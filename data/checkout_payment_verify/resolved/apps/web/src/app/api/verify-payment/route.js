import sql from "@/app/api/utils/sql";
import { sendEmail } from "@/app/api/utils/send-email";
import { orderConfirmationEmail } from "@/app/api/utils/email-templates/order-confirmation";
import { ownerNotificationEmail } from "@/app/api/utils/email-templates/owner-notification";
import { firstOrderThankYouEmail } from "@/app/api/utils/email-templates/first-order-thank-you";

async function stripeGet(path) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
    },
  });

  const contentType = res.headers.get("content-type") || "";
  const raw = await res.text();

  if (!contentType.includes("application/json")) {
    throw new Error(
      `Stripe API returned non-JSON (status ${res.status}). First 200 chars: ${raw.slice(0, 200)}`,
    );
  }

  const json = JSON.parse(raw);

  if (!res.ok) {
    const details = json?.error?.message || `Stripe API error (status ${res.status})`;
    const err = new Error(details);
    err.status = res.status;
    err.stripePayload = json;
    throw err;
  }

  return json;
}

export async function POST(request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return Response.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const { sessionId, orderData } = await request.json();

    if (!sessionId) {
      return Response.json({ error: "Session ID required" }, { status: 400 });
    }

    const session = await stripeGet(
      `checkout/sessions/${encodeURIComponent(sessionId)}`,
    );

    if (session.payment_status !== "paid") {
      return Response.json({ paid: false, status: session.payment_status });
    }

    // If we've already created an order for this Stripe session, return it.
    const existingOrders = await sql`
      SELECT id, order_number FROM orders
      WHERE notes LIKE ${"%" + sessionId + "%"}
      LIMIT 1
    `;

    if (existingOrders.length > 0) {
      return Response.json({
        paid: true,
        orderNumber: existingOrders[0].order_number,
        alreadyCreated: true,
      });
    }

    // Prefer orderData passed from browser sessionStorage.
    const resolvedOrderData = orderData || null;

    if (!resolvedOrderData) {
      return Response.json(
        {
          error: "Missing order details",
          details:
            "Order details were not provided. The thank-you page should send the pending order from sessionStorage.",
        },
        { status: 400 },
      );
    }

    const orderNumber = "GG-" + Date.now().toString().slice(-8);

    const result = await sql`
      INSERT INTO orders (
        order_number,
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_zip,
        items,
        subtotal,
        shipping_cost,
        total,
        status,
        notes
      ) VALUES (
        ${orderNumber},
        ${resolvedOrderData.customer_name},
        ${resolvedOrderData.customer_email},
        ${resolvedOrderData.customer_phone || ""},
        ${resolvedOrderData.shipping_address},
        ${resolvedOrderData.shipping_city},
        ${resolvedOrderData.shipping_state},
        ${resolvedOrderData.shipping_zip},
        ${JSON.stringify(resolvedOrderData.items)},
        ${resolvedOrderData.subtotal},
        ${resolvedOrderData.shipping_cost},
        ${resolvedOrderData.total},
        'paid',
        ${
          "Stripe Session: " +
          sessionId +
          (
            resolvedOrderData.discount_code
              ? " | Discount: " + resolvedOrderData.discount_code
              : ""
          ) +
          (resolvedOrderData.notes ? " | " + resolvedOrderData.notes : "")
        }
      )
      RETURNING id, order_number
    `;

    const order = {
      ...resolvedOrderData,
      order_number: result[0].order_number,
      id: result[0].id,
    };

    const previousOrders = await sql`
      SELECT id FROM orders
      WHERE customer_email = ${resolvedOrderData.customer_email}
      AND id != ${result[0].id}
      LIMIT 1
    `;
    const isFirstOrder = previousOrders.length === 0;

    try {
      const emailTemplate = orderConfirmationEmail(order, false, null);
      await sendEmail({
        to: resolvedOrderData.customer_email,
        from: "Gunner's Goodies <orders@gunnersgoodies.com>",
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
    }

    if (isFirstOrder) {
      try {
        const thankYouEmailContent = firstOrderThankYouEmail(order);
        await sendEmail({
          to: resolvedOrderData.customer_email,
          from: "Gunner's Goodies <hello@gunnersgoodies.com>",
          subject: thankYouEmailContent.subject,
          html: thankYouEmailContent.html,
          text: thankYouEmailContent.text,
        });
      } catch (emailError) {
        console.error("Failed to send first-order thank you email:", emailError);
      }
    }

    // Owner notification: avoid env vars that aren't guaranteed in Anything
    try {
      const ownerEmailContent = ownerNotificationEmail(order);
      await sendEmail({
        to: "hello@gunnersgoodies.com",
        from: "Gunner's Goodies <orders@gunnersgoodies.com>",
        subject: ownerEmailContent.subject,
        html: ownerEmailContent.html,
        text: ownerEmailContent.text,
      });
    } catch (emailError) {
      console.error("Failed to send owner notification:", emailError);
    }

    return Response.json({
      paid: true,
      orderNumber: result[0].order_number,
      orderId: result[0].id,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return Response.json(
      { error: "Failed to verify payment", details: error.message },
      { status: 500 },
    );
  }
}
