<<<<<<< ours
// Replaces Stripe SDK usage with direct Stripe REST calls (fetch) to avoid Anything's internal stripe wrapper
=======
// Remove Stripe SDK usage (Anything wraps Stripe SDK with an internal shim that is returning HTML)
// and call Stripe's REST API directly using fetch.
>>>>>>> theirs

function encodeForm(data) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) {
      continue;
    }
    params.append(key, String(value));
  }
  return params;
}

async function stripeRequest(path, formData) {
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
    // This is the exact failure mode we want to avoid bubbling up as JSON.parse errors.
    throw new Error(
      `Stripe API returned non-JSON (status ${response.status}). First 200 chars: ${raw.slice(0, 200)}`,
    );
  }

  const json = JSON.parse(raw);

  if (!response.ok) {
    const msg =
      json?.error?.message || `Stripe API error (status ${response.status})`;
    throw new Error(msg);
  }

  return json;
}

function buildDiscountedUnitAmounts({ items, subtotal, discount }) {
  // Stripe doesn’t allow negative line items for Checkout Sessions.
  // We apply discounts by reducing each product's unit price proportionally.
  if (!discount || discount <= 0 || !subtotal || subtotal <= 0) {
    return items.map((i) => ({
      ...i,
      unit_amount_cents: Math.round(i.price * 100),
    }));
  }

  const subtotalCents = Math.round(subtotal * 100);
  const discountCents = Math.round(discount * 100);

  // Safety: never discount more than subtotal.
  const safeDiscountCents = Math.min(discountCents, subtotalCents);

  const itemTotalsCents = items.map((item) => {
    const unitCents = Math.round(item.price * 100);
    return unitCents * item.quantity;
  });

  const totalItemsCents = itemTotalsCents.reduce((sum, v) => sum + v, 0) || 1;

  // Allocate discount proportionally by item total.
  const discountedTotalsCents = itemTotalsCents.map((totalCents) =>
    Math.max(
      0,
      totalCents -
        Math.round((totalCents / totalItemsCents) * safeDiscountCents),
    ),
  );

  // Fix rounding error by adjusting the first item.
  const discountedSum = discountedTotalsCents.reduce((sum, v) => sum + v, 0);
  const expectedSum = Math.max(0, totalItemsCents - safeDiscountCents);
  const delta = expectedSum - discountedSum;
  discountedTotalsCents[0] = Math.max(0, discountedTotalsCents[0] + delta);

  // Convert back to per-unit amounts.
  return items.map((item, idx) => {
    const qty = item.quantity || 1;
    const totalForItem = discountedTotalsCents[idx];
    const unitAmount = Math.floor(totalForItem / qty);

    // distribute remainder cents by adding 1 cent to some units via quantity split is complex.
    // We'll keep unit_amount as floor and add the remainder as a small "Rounding" line item later.
    return {
      ...item,
      unit_amount_cents: Math.max(0, unitAmount),
      remainder_cents: totalForItem - unitAmount * qty,
    };
  });
}

export async function POST(request) {
  try {
<<<<<<< ours

=======
    console.log("=== Checkout Session Started ===");

>>>>>>> theirs
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
        {
          error: "Invalid request",
          details: "Request body must be valid JSON",
        },
        { status: 400 },
      );
    }

    const { orderData, redirectURL } = body || {};

<<<<<<< ours
    if (
      !orderData ||
      !Array.isArray(orderData.items) ||
      orderData.items.length === 0
    ) {
=======
    console.log("Order data:", {
      email: orderData?.customer_email,
      items: orderData?.items?.length,
      total: orderData?.total,
    });

    if (
      !orderData ||
      !Array.isArray(orderData.items) ||
      orderData.items.length === 0
    ) {
>>>>>>> theirs
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

<<<<<<< ours
    const baseURL = String(redirectURL || process.env.APP_URL || "").replace(
      /^http:/,
      "https:",
    );
    if (!baseURL) {
      return Response.json(
        { error: "Invalid request", details: "redirectURL is required" },
        { status: 400 },
      );
=======
    const baseURL = String(redirectURL || "").replace(/^http:/, "https:");
    if (!baseURL.startsWith("http")) {
      return Response.json(
        { error: "Invalid request", details: "redirectURL is required" },
        { status: 400 },
      );
    }

    // Stripe Checkout Session creation (REST API)
    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set(
      "success_url",
      `${baseURL}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
    );
    params.set("cancel_url", `${baseURL}/checkout`);
    params.set("customer_email", orderData.customer_email);

    // keep shipping + billing aligned with previous behavior
    params.set("billing_address_collection", "auto");
    params.set("shipping_address_collection[allowed_countries][]", "US");

    // Metadata must be strings
    params.set("metadata[order_data]", JSON.stringify(orderData));

    // Line items
    const hasDiscount =
      Number(orderData.discount) > 0 && Number(orderData.subtotal) > 0;
    const discountRate = hasDiscount
      ? Math.min(
          1,
          Math.max(0, Number(orderData.discount) / Number(orderData.subtotal)),
        )
      : 0;

    let discountedSubtotalCentsSum = 0;

    orderData.items.forEach((item, idx) => {
      const qty = Number(item.quantity || 1);
      const priceCents = Math.round(Number(item.price) * 100);

      // Stripe does not allow negative line items. To represent discount codes from the site,
      // apply a per-item discount to the unit_amount.
      const discountedUnitCents = hasDiscount
        ? Math.floor(priceCents * (1 - discountRate))
        : priceCents;

      discountedSubtotalCentsSum += discountedUnitCents * qty;

      params.set(`line_items[${idx}][quantity]`, String(qty));
      params.set(`line_items[${idx}][price_data][currency]`, "usd");
      params.set(
        `line_items[${idx}][price_data][product_data][name]`,
        `${item.name} - ${item.size}`,
      );
      if (item.image) {
        params.set(
          `line_items[${idx}][price_data][product_data][images][]`,
          String(item.image),
        );
      }
      params.set(
        `line_items[${idx}][price_data][unit_amount]`,
        String(discountedUnitCents),
      );
    });

    // If we discounted per-line with floor(), rounding might leave a few cents unaccounted.
    // Add a small positive adjustment line item so Stripe total matches what the customer saw.
    let lineItemIndex = orderData.items.length;
    if (hasDiscount) {
      const desiredDiscountedSubtotalCents = Math.round(
        (Number(orderData.subtotal) - Number(orderData.discount)) * 100,
      );
      const remainder =
        desiredDiscountedSubtotalCents - discountedSubtotalCentsSum;
      if (remainder > 0) {
        params.set(`line_items[${lineItemIndex}][quantity]`, "1");
        params.set(`line_items[${lineItemIndex}][price_data][currency]`, "usd");
        params.set(
          `line_items[${lineItemIndex}][price_data][product_data][name]`,
          "Discount adjustment",
        );
        params.set(
          `line_items[${lineItemIndex}][price_data][unit_amount]`,
          String(remainder),
        );
        lineItemIndex += 1;
      }
    }

    // Add shipping line item
    if (Number(orderData.shipping_cost) > 0) {
      params.set(`line_items[${lineItemIndex}][quantity]`, "1");
      params.set(`line_items[${lineItemIndex}][price_data][currency]`, "usd");
      params.set(
        `line_items[${lineItemIndex}][price_data][product_data][name]`,
        "Shipping",
      );
      params.set(
        `line_items[${lineItemIndex}][price_data][unit_amount]`,
        String(Math.round(Number(orderData.shipping_cost) * 100)),
      );
      lineItemIndex += 1;
    }

    // NOTE: We intentionally do NOT add negative line items for discounts.
    // Stripe rejects negative unit_amount. Discounts are applied above by adjusting unit_amount.

    console.log("Creating Stripe session (REST)...");

    const stripeRes = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      },
    );

    const raw = await stripeRes.text();

    // Stripe should always respond JSON. If we get HTML, include a short snippet.
    let stripeJson = null;
    try {
      stripeJson = JSON.parse(raw);
    } catch {
      stripeJson = null;
    }

    if (!stripeRes.ok) {
      const snippet = raw?.slice?.(0, 200);
      console.error(
        "❌ Stripe REST error:",
        stripeRes.status,
        stripeRes.statusText,
        snippet,
      );
      const details =
        stripeJson?.error?.message || snippet || "Stripe request failed";
      return Response.json(
        {
          error: "Checkout failed",
          details,
          stripeStatus: stripeRes.status,
        },
        { status: 500 },
      );
>>>>>>> theirs
    }

<<<<<<< ours
    const discounted = buildDiscountedUnitAmounts({
      items: orderData.items,
      subtotal: orderData.subtotal,
      discount: orderData.discount,
    });
=======
    if (!stripeJson?.url) {
      console.error("❌ Stripe response missing url", stripeJson);
      return Response.json(
        {
          error: "Checkout failed",
          details: "Stripe did not return a checkout URL",
        },
        { status: 500 },
      );
    }
>>>>>>> theirs

<<<<<<< ours
    // Build form payload for Stripe Checkout Session
    const form = encodeForm({
      mode: "payment",
      success_url: `${baseURL}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseURL}/checkout`,
      customer_email: orderData.customer_email,
      billing_address_collection: "auto",
    });

    // shipping_address_collection[allowed_countries][] = US
    form.append("shipping_address_collection[allowed_countries][]", "US");

    let lineIndex = 0;

    for (const item of discounted) {
      const name = `${item.name} - ${item.size}`;
      const qty = item.quantity || 1;

      form.append(`line_items[${lineIndex}][quantity]`, String(qty));
      form.append(`line_items[${lineIndex}][price_data][currency]`, "usd");
      form.append(
        `line_items[${lineIndex}][price_data][product_data][name]`,
        name,
      );
      form.append(
        `line_items[${lineIndex}][price_data][unit_amount]`,
        String(item.unit_amount_cents),
      );

      if (item.image) {
        form.append(
          `line_items[${lineIndex}][price_data][product_data][images][]`,
          item.image,
        );
      }

      lineIndex += 1;

      // If there are remainder cents (due to floor), we add them as a tiny "Rounding" line item per product.
      // This keeps Stripe total exact without negative amounts.
      if (item.remainder_cents && item.remainder_cents > 0) {
        form.append(`line_items[${lineIndex}][quantity]`, "1");
        form.append(`line_items[${lineIndex}][price_data][currency]`, "usd");
        form.append(
          `line_items[${lineIndex}][price_data][product_data][name]`,
          `Rounding (${item.size})`,
        );
        form.append(
          `line_items[${lineIndex}][price_data][unit_amount]`,
          String(item.remainder_cents),
        );
        lineIndex += 1;
      }
    }

    if (orderData.shipping_cost && Number(orderData.shipping_cost) > 0) {
      const shippingCents = Math.round(Number(orderData.shipping_cost) * 100);
      form.append(`line_items[${lineIndex}][quantity]`, "1");
      form.append(`line_items[${lineIndex}][price_data][currency]`, "usd");
      form.append(
        `line_items[${lineIndex}][price_data][product_data][name]`,
        "Shipping",
      );
      form.append(
        `line_items[${lineIndex}][price_data][unit_amount]`,
        String(shippingCents),
      );
      lineIndex += 1;
    }

    // Keep metadata small (Stripe metadata values max length is limited).
    // Store only essentials and rely on pendingOrder in sessionStorage for UI.
    const compactMeta = {
      email: orderData.customer_email,
      subtotal: orderData.subtotal,
      shipping_cost: orderData.shipping_cost,
      discount_code: orderData.discount_code || "",
      total: orderData.total,
    };

    form.append("metadata[order_data]", JSON.stringify(compactMeta));

    const session = await stripeRequest("checkout/sessions", form);

    return Response.json({ url: session.url, sessionId: session.id });
=======
    console.log("✅ Session created:", stripeJson.id);

    return Response.json({ url: stripeJson.url, sessionId: stripeJson.id });
>>>>>>> theirs
  } catch (error) {
    console.error("create-checkout-session error:", error);
    return Response.json(
      { error: "Checkout failed", details: error?.message || "Unknown error" },
      { status: 500 },
    );
  }
}
