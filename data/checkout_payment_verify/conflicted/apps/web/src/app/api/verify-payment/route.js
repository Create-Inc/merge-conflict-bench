import sql from "@/app/api/utils/sql";
import { sendEmail } from "@/app/api/utils/send-email";
import { orderConfirmationEmail } from "@/app/api/utils/email-templates/order-confirmation";
import { ownerNotificationEmail } from "@/app/api/utils/email-templates/owner-notification";
import { firstOrderThankYouEmail } from "@/app/api/utils/email-templates/first-order-thank-you";

<<<<<<< ours
async function stripeGet(path) {
  const url = `https://api.stripe.com/v1/${path}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
    },
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
    const msg =
      json?.error?.message || `Stripe API error (status ${response.status})`;
    throw new Error(msg);
  }

  return json;
}

=======
async function stripeGet(path) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
    },
  });
  const raw = await res.text();
  let json = null;
  try {
    json = JSON.parse(raw);
  } catch {
    json = null;
  }
  if (!res.ok) {
    const details =
      json?.error?.message || raw?.slice?.(0, 200) || "Stripe request failed";
    const err = new Error(details);
    err.status = res.status;
    err.stripePayload = json;
    throw err;
  }
  if (!json) {
    throw new Error("Stripe returned a non-JSON response");
  }
  return json;
}

>>>>>>> theirs
export async function POST(request) {
  try {
<<<<<<< ours
    if (!process.env.STRIPE_SECRET_KEY) {
      return Response.json({ error: "Stripe not configured" }, { status: 500 });
    }
=======
    if (!process.env.STRIPE_SECRET_KEY) {
      return Response.json(
        { error: "Payment system not configured" },
        { status: 500 },
      );
    }

    const { sessionId } = await request.json();
>>>>>>> theirs

    const { sessionId, orderData } = await request.json();

    if (!sessionId) {
      return Response.json({ error: "Session ID required" }, { status: 400 });
    }

    // Retrieve the checkout session from Stripe
    const session = await stripeGet(
      `checkout/sessions/${encodeURIComponent(sessionId)}`,
    );

    if (session.payment_status !== "paid") {
      return Response.json({
        paid: false,
        status: session.payment_status,
      });
    }

    // Check if order already exists for this session
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

<<<<<<< ours
    // Prefer orderData passed from the browser (sessionStorage), because Stripe metadata has strict size limits.
    const resolvedOrderData = orderData || null;
=======
    // Parse order data from metadata
    let orderData;
    try {
      orderData = JSON.parse(session?.metadata?.order_data || "{}") || {};
    } catch (e) {
      return Response.json(
        {
          error: "Invalid order data",
          details: "Could not parse order metadata",
        },
        { status: 400 },
      );
    }
>>>>>>> theirs

    if (!resolvedOrderData) {
      return Response.json(
        {
          error: "Missing order details",
          details:
            "Order details were not provided. This site expects the thank-you page to send the pending order from sessionStorage.",
        },
        { status: 400 },
      );
    }

    // Generate order number
    const orderNumber = "GG-" + Date.now().toString().slice(-8);

    // Create the order in database
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
<<<<<<< ours
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
=======
        ${orderData.customer_name || ""},
        ${orderData.customer_email || session.customer_email || ""},
        ${orderData.customer_phone || ""},
        ${orderData.shipping_address || ""},
        ${orderData.shipping_city || ""},
        ${orderData.shipping_state || ""},
        ${orderData.shipping_zip || ""},
        ${JSON.stringify(orderData.items || [])},
        ${Number(orderData.subtotal) || 0},
        ${Number(orderData.shipping_cost) || 0},
        ${Number(orderData.total) || 0},
>>>>>>> theirs
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
<<<<<<< ours
      ...resolvedOrderData,
=======
      ...orderData,
      customer_email: orderData.customer_email || session.customer_email || "",
>>>>>>> theirs
      order_number: result[0].order_number,
      id: result[0].id,
    };

    // Check if this is the customer's first order
    const previousOrders = await sql`
      SELECT id FROM orders 
<<<<<<< ours
      WHERE customer_email = ${resolvedOrderData.customer_email} 
=======
      WHERE customer_email = ${order.customer_email} 
>>>>>>> theirs
      AND id != ${result[0].id}
      LIMIT 1
    `;
    const isFirstOrder = previousOrders.length === 0;

    // Send confirmation email to customer
    try {
      const emailTemplate = orderConfirmationEmail(order, false, null);
      await sendEmail({
<<<<<<< ours
        to: resolvedOrderData.customer_email,
=======
        to: order.customer_email,
>>>>>>> theirs
        from: "Gunner's Goodies <orders@gunnersgoodies.com>",
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });
<<<<<<< ours

=======
      console.log(`✅ Confirmation email sent to ${order.customer_email}`);
>>>>>>> theirs
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
    }

    // First-order thank you
    if (isFirstOrder) {
      try {
        const thankYouEmailContent = firstOrderThankYouEmail(order);
        await sendEmail({
<<<<<<< ours
          to: resolvedOrderData.customer_email,
=======
          to: order.customer_email,
>>>>>>> theirs
          from: "Gunner's Goodies <hello@gunnersgoodies.com>",
          subject: thankYouEmailContent.subject,
          html: thankYouEmailContent.html,
          text: thankYouEmailContent.text,
        });
<<<<<<< ours
      } catch (emailError) {
        console.error(
          "Failed to send first-order thank you email:",
          emailError,
=======
        console.log(
          `✨ First-time thank you email sent to ${order.customer_email}`,
>>>>>>> theirs
        );
      }
    }

<<<<<<< ours
    // Owner notification (avoid env vars not guaranteed to exist in Anything)
=======
    // Owner notification
>>>>>>> theirs
    try {
      const ownerEmailContent = ownerNotificationEmail(order);
      await sendEmail({
<<<<<<< ours
        to: "hello@gunnersgoodies.com",
=======
        to: "owner@gunnersgoodies.com",
>>>>>>> theirs
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
