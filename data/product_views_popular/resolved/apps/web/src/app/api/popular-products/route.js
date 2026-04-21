import sql from "@/app/api/utils/sql";

function safeInt(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.floor(n);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const limitRaw = searchParams.get("limit");
    const daysRaw = searchParams.get("days");
    const modeRaw = searchParams.get("mode");

    const mode = modeRaw === "most_viewed" ? "most_viewed" : "most_ordered";

    const limit = Math.min(60, Math.max(1, safeInt(limitRaw, 9)));
    const days = Math.min(365, Math.max(7, safeInt(daysRaw, 180)));

    if (mode === "most_viewed") {
      const rows = await sql(
        `
        SELECT
          p.id,
          p.slug,
          p.name,
          p.description,
          p.category,
          p.image_url,
          p.base_price,
          p.base_quantity,
          p.active,
          COUNT(pve.id) AS view_count
        FROM product_view_events pve
        JOIN products p ON p.id = pve.product_id
        WHERE
          p.active = true
          AND pve.created_at >= (now() - ($1 || ' days')::interval)
        GROUP BY p.id
        ORDER BY view_count DESC, MAX(pve.created_at) DESC
        LIMIT $2
        `,
        [String(days), limit],
      );

      return Response.json({ popularProducts: rows || [], mode });
    }

    // "Most ordered" = sum of quantities across paid/fulfilled orders.
    // We support both legacy and new order statuses.
    const rows = await sql(
      `
      SELECT
        p.id,
        p.slug,
        p.name,
        p.description,
        p.category,
        p.image_url,
        p.base_price,
        p.base_quantity,
        p.active,
        COALESCE(SUM(oi.quantity), 0) AS ordered_quantity
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN products p ON p.slug = oi.product_slug
      WHERE
        p.active = true
        AND o.created_at >= (now() - ($1 || ' days')::interval)
        AND (
          COALESCE(o.payment_status, '') = 'paid'
          OR o.status IN (
            'paid',
            'awaiting_processing',
            'processing',
            'in_production',
            'ready_to_ship',
            'shipped',
            'dispatched',
            'completed',
            'delivered'
          )
        )
        AND o.status NOT IN ('draft', 'cancelled')
      GROUP BY p.id
      ORDER BY ordered_quantity DESC, MAX(o.created_at) DESC
      LIMIT $2
      `,
      [String(days), limit],
    );

    return Response.json({ popularProducts: rows || [], mode });
  } catch (error) {
    console.error("GET /api/popular-products error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
