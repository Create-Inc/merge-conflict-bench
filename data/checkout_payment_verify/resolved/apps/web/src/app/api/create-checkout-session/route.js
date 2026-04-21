// Create Stripe Checkout Sessions via Stripe REST API (fetch) to avoid Anything's internal Stripe SDK wrapper

function encodeForm(data) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    params.append(key, String(value));
  }
  return params;
}

async function stripePost(path, formData) {
  const url = `https://api.stripe.com/v1/${path}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  const contentType = response.headers.get("content-type") || "";
  const raw = await response.text();

  if (!contentType.includes("application/json")) {
    throw new Error(
      `Stripe API returned non-JSON (status ${response.status}). First 200 chars: ${raw.slice(0, 200)}`,
    );
  }

  const json = JSON.parse(raw);

  if (!response.ok) {
    const msg = json?.error?.message || `Stripe API error (status ${response.status})`;
    throw new Error(msg);
  }

  return json;
}

function buildDiscountedUnitAmounts({ items, subtotal, discount }) {
  // Stripe Checkout does not allow negative line items.
  // We apply discounts by reducing each product's unit price proportionally.
  if (!discount || discount <= 0 || !subtotal || subtotal <= 0) {
    return items.map((i) => ({
      ...i,
      unit_amount_cents: Math.round(Number(i.price) * 100),
      remainder_cents: 0,
    }));
  }

  const subtotalCents = Math.round(Number(subtotal) * 100);
  const discountCents = Math.round(Number(discount) * 100);
  const safeDiscountCents = Math.min(Math.max(0, discountCents), Math.max(0, subtotalCents));

  const itemTotalsCents = items.map((item) => {
    const unitCents = Math.round(Number(item.price) * 100);
    const qty = Number(item.quantity || 1);
    return unitCents * qty;
  });

  const totalItemsCents = itemTotalsCents.reduce((sum, v) => sum + v, 0) || 1;

  const discountedTotalsCents = itemTotalsCents.map((totalCents) =>
    Math.max(0, totalCents - Math.round((totalCents / totalItemsCents) * safeDiscountCents)),
  );

  // Fix rounding error by adjusting the first line.
  const discountedSum = discountedTotalsCents.reduce((sum, v) => sum + v, 0);
  const expectedSum = Math.max(0, totalItemsCents - safeDiscountCents);
  const delta = expectedSum - discountedSum;
  discountedTotalsCents[0] = Math.max(0, discountedTotalsCents[0] + delta);

  return items.map((item, idx) => {
    const qty = Number(item.quantity || 1);
    const totalForItem = discountedTotalsCents[idx];
    const unitAmount = Math.floor(totalForItem / qty);
    const remainder = totalForItem - unitAmount * qty;

    return {
      ...item,
      unit_amount_cents: Math.max(0, unitAmount),
      remainder_cents: Math.max(0, remainder),
    };
  });
}

export async function POST(request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return Response.json(
        {
          error: "Payment system not configured",
          details: "STRIPE_SECRET_KEY is missing.",
        },
        { status: 500 },
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "Invalid request", details: "Request body must be valid JSON" },
        { status: 400 },
      );
    }

    const { orderData, redirectURL } = body || {};

    if (!orderData || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      return Response.json(
        { error: "Invalid order", details: "No items in cart" },
        { status: 400 },
      );
    }

    if (!orderData.customer_email) {
      return Response.json(
        { error: "Invalid order", details: "Customer email is required" },
        { status: 400 },
      );
    }

    const baseURL = String(redirectURL || process.env.APP_URL || "").replace(/^http:/, "https:");
    if (!baseURL.startsWith("http")) {
      return Response.json(
        { error: "Invalid request", details: "redirectURL is required" },
        { status: 400 },
      );
    }

    const discounted = buildDiscountedUnitAmounts({
      items: orderData.items,
      subtotal: orderData.subtotal,
      discount: orderData.discount,
    });

    const form = encodeForm({
      mode: "payment",
      success_url: `${baseURL}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseURL}/checkout`,
      customer_email: orderData.customer_email,
      billing_address_collection: "auto",
    });

    // Shipping address collection
    form.append("shipping_address_collection[allowed_countries][]", "US");

    let lineIndex = 0;

    for (const item of discounted) {
      const qty = Number(item.quantity || 1);
      const name = `${item.name} - ${item.size}`;

      form.append(`line_items[${lineIndex}][quantity]`, String(qty));
      form.append(`line_items[${lineIndex}][price_data][currency]`, "usd");
      form.append(`line_items[${lineIndex}][price_data][product_data][name]`, name);
      form.append(`line_items[${lineIndex}][price_data][unit_amount]`, String(item.unit_amount_cents));

      if (item.image) {
        form.append(`line_items[${lineIndex}][price_data][product_data][images][]`, String(item.image));
      }

      lineIndex += 1;

      // Remainder cents per product (due to flooring unit amounts)
      if (item.remainder_cents && item.remainder_cents > 0) {
        form.append(`line_items[${lineIndex}][quantity]`, "1");
        form.append(`line_items[${lineIndex}][price_data][currency]`, "usd");
        form.append(
          `line_items[${lineIndex}][price_data][product_data][name]`,
          `Discount rounding (${item.size})`,
        );
        form.append(`line_items[${lineIndex}][price_data][unit_amount]`, String(item.remainder_cents));
        lineIndex += 1;
      }
    }

    if (Number(orderData.shipping_cost) > 0) {
      const shippingCents = Math.round(Number(orderData.shipping_cost) * 100);
      form.append(`line_items[${lineIndex}][quantity]`, "1");
      form.append(`line_items[${lineIndex}][price_data][currency]`, "usd");
      form.append(`line_items[${lineIndex}][price_data][product_data][name]`, "Shipping");
      form.append(`line_items[${lineIndex}][price_data][unit_amount]`, String(shippingCents));
      lineIndex += 1;
    }

    // Keep metadata small (Stripe metadata values have strict length limits)
    const compactMeta = {
      email: orderData.customer_email,
      subtotal: orderData.subtotal,
      shipping_cost: orderData.shipping_cost,
      discount_code: orderData.discount_code || "",
      total: orderData.total,
    };
    form.append("metadata[order_data]", JSON.stringify(compactMeta));

    const session = await stripePost("checkout/sessions", form);

    return Response.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("create-checkout-session error:", error);
    return Response.json(
      { error: "Checkout failed", details: error?.message || "Unknown error" },
      { status: 500 },
    );
  }
}
