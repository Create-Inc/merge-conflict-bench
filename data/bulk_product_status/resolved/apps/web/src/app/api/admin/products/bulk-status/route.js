import sql from "@/app/api/utils/sql";
import { requirePermission, PERMISSIONS } from "@/app/api/utils/rbac";

export const dynamic = "force-dynamic";

// Support the full product_status set, plus legacy aliases.
const ALLOWED_TARGETS = new Set([
  "active",
  "pending_review",
  "draft",
  "inactive",
  "quarantine",
  // legacy
  "pending",
  "hidden",
]);

function normalizeTarget(raw) {
  const t = String(raw || "")
    .trim()
    .toLowerCase();
  if (t === "pending") return "pending_review";
  if (t === "hidden") return "draft";
  return t;
}

function clampIds(raw) {
  const list = Array.isArray(raw) ? raw : [];
  const out = [];
  const seen = new Set();
  for (const id of list) {
    const n = Number(id);
    if (!Number.isFinite(n) || n <= 0) continue;
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(n);
    if (out.length >= 20000) break;
  }
  return out;
}

function currentStatus(p) {
  const ps = String(p?.product_status || "").trim();
  if (ps) return normalizeTarget(ps);
  if (p?.is_active) return "active";
  if (p?.pending_review) return "pending_review";
  return "draft";
}

async function computePreview({ productIds, target }) {
  // NOTE: this mirrors /api/admin/products/bulk-status/preview so the apply step
  // always validates server-side (don’t trust the client).

  // 1) Base product fields
  const products = await sql(
    `
      SELECT id, name, slug, price, sku, is_active, pending_review, product_status, channel_web_enabled
      FROM products
      WHERE id = ANY($1::int[])
    `,
    [productIds],
  );

  const byId = new Map();
  for (const p of products || []) {
    const id = Number(p?.id);
    if (!Number.isFinite(id) || id <= 0) continue;
    byId.set(id, p);
  }

  // 2) Category readiness
  const categoryRows = await sql(
    `
      WITH unc AS (
        SELECT id
        FROM categories
        WHERE slug = 'uncategorized'
        LIMIT 1
      )
      SELECT
        p.id,
        (
          (SELECT id FROM unc) IS NOT NULL
          AND (
            p.primary_category_id = (SELECT id FROM unc)
            OR EXISTS (
              SELECT 1
              FROM product_categories pc
              WHERE pc.product_id = p.id
                AND pc.category_id = (SELECT id FROM unc)
            )
          )
        )
        OR (
          p.primary_category_id IS NULL
          AND NOT EXISTS (
            SELECT 1
            FROM product_categories pc0
            WHERE pc0.product_id = p.id
          )
        ) AS needs_category_action
      FROM products p
      WHERE p.id = ANY($1::int[])
    `,
    [productIds],
  );

  const needsCategoryActionById = new Map();
  for (const r of categoryRows || []) {
    const id = Number(r?.id);
    if (!Number.isFinite(id) || id <= 0) continue;
    needsCategoryActionById.set(id, Boolean(r?.needs_category_action));
  }

  // 3) Gallery count
  const galleryCounts = await sql(
    `
      SELECT product_id, COUNT(*)::int AS gallery_count
      FROM product_images
      WHERE variation_id IS NULL
        AND is_gallery = true
        AND product_id = ANY($1::int[])
      GROUP BY product_id
    `,
    [productIds],
  );

  const galleryCountById = new Map();
  for (const r of galleryCounts || []) {
    const id = Number(r?.product_id);
    if (!Number.isFinite(id) || id <= 0) continue;
    galleryCountById.set(id, Number(r?.gallery_count) || 0);
  }

  // 4) Variations agg
  const variationAgg = await sql(
    `
      SELECT
        product_id,
        COUNT(*)::int AS variation_count,
        COUNT(*) FILTER (WHERE is_active = true)::int AS active_variation_count,
        COUNT(*) FILTER (
          WHERE is_active = true
            AND (
              sku IS NULL OR BTRIM(sku) = ''
              OR price IS NULL
            )
        )::int AS active_variations_missing_required
      FROM product_variations
      WHERE product_id = ANY($1::int[])
      GROUP BY product_id
    `,
    [productIds],
  );

  const variationAggById = new Map();
  for (const r of variationAgg || []) {
    const id = Number(r?.product_id);
    if (!Number.isFinite(id) || id <= 0) continue;
    variationAggById.set(id, {
      variation_count: Number(r?.variation_count) || 0,
      active_variation_count: Number(r?.active_variation_count) || 0,
      active_variations_missing_required:
        Number(r?.active_variations_missing_required) || 0,
    });
  }

  // 5) Inventory warnings
  const inventoryAgg = await sql(
    `
      SELECT product_id, COALESCE(SUM(quantity_on_hand), 0)::int AS qty_on_hand
      FROM inventory_current
      WHERE product_id = ANY($1::int[])
      GROUP BY product_id
    `,
    [productIds],
  );

  const qtyById = new Map();
  for (const r of inventoryAgg || []) {
    const id = Number(r?.product_id);
    if (!Number.isFinite(id) || id <= 0) continue;
    qtyById.set(id, Number(r?.qty_on_hand) || 0);
  }

  let okCount = 0;
  let blockedCount = 0;
  let warningsCount = 0;

  const results = [];

  for (const id of productIds) {
    const p = byId.get(id);

    if (!p) {
      blockedCount += 1;
      results.push({
        id,
        name: `#${id}`,
        from_status: null,
        to_status: target,
        blockers: ["Product not found"],
        warnings: [],
      });
      continue;
    }

    const fromStatus = currentStatus(p);
    const blockers = [];
    const warnings = [];

    const needsCategoryAction = Boolean(needsCategoryActionById.get(id));
    const galleryCount = galleryCountById.get(id) || 0;
    const qtyOnHand = qtyById.get(id) || 0;
    const vAgg = variationAggById.get(id) || {
      variation_count: 0,
      active_variation_count: 0,
      active_variations_missing_required: 0,
    };

    if (target === "active") {
      if (!String(p?.name || "").trim()) blockers.push("Missing product name");
      if (!String(p?.slug || "").trim()) blockers.push("Missing product slug");
      if (needsCategoryAction)
        blockers.push("Needs category assignment (Uncategorized or none)");
      if (galleryCount <= 0) blockers.push("Missing gallery media");
      if (p?.channel_web_enabled === false)
        blockers.push("Web channel is disabled");

      if (vAgg.variation_count > 0) {
        if (vAgg.active_variation_count <= 0)
          blockers.push("No active variations");
        if (vAgg.active_variations_missing_required > 0)
          blockers.push("Some active variations are missing SKU or price");
      } else {
        if (p?.price == null) blockers.push("Missing price");
        const sku = String(p?.sku || "").trim();
        if (!sku) blockers.push("Missing SKU");
      }

      if (qtyOnHand <= 0) {
        warnings.push("No inventory on hand (still ok to activate)");
      }
    }

    // Inventory alerts any time we move OUT of active.
    if (target !== "active") {
      if (qtyOnHand > 0) {
        warnings.push(
          `Has ${qtyOnHand} units on hand — inventory will still be counted`,
        );
      }
    }

    if (warnings.length) warningsCount += 1;

    const blocked = blockers.length > 0;
    if (blocked) blockedCount += 1;
    else okCount += 1;

    results.push({
      id,
      name: String(p?.name || `#${id}`),
      from_status: fromStatus,
      to_status: target,
      blockers,
      warnings,
    });
  }

  return {
    target,
    summary: {
      total: productIds.length,
      ok: okCount,
      blocked: blockedCount,
      warnings: warningsCount,
    },
    results,
  };
}

function mapTargetToFields(target) {
  if (target === "active") {
    return { is_active: true, pending_review: false, product_status: "active" };
  }
  if (target === "pending_review") {
    return {
      is_active: false,
      pending_review: true,
      product_status: "pending_review",
    };
  }
  if (target === "quarantine") {
    return {
      is_active: false,
      pending_review: false,
      product_status: "quarantine",
    };
  }
  if (target === "inactive") {
    return {
      is_active: false,
      pending_review: false,
      product_status: "inactive",
    };
  }

  // default: draft
  return { is_active: false, pending_review: false, product_status: "draft" };
}

export async function POST(request) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_PRODUCTS);
    if (!guard.ok) {
      return guard.response;
    }

    const body = await request.json();
    const rawTarget = String(body?.target || "")
      .trim()
      .toLowerCase();

    if (!ALLOWED_TARGETS.has(rawTarget)) {
      return Response.json({ error: "Invalid target status" }, { status: 400 });
    }

    const target = normalizeTarget(rawTarget);

    const productIds = clampIds(body?.product_ids);
    if (!productIds.length) {
      return Response.json(
        { error: "No product ids provided" },
        { status: 400 },
      );
    }

    const reason = body?.reason ? String(body.reason).trim() : null;

    // Re-run preview server-side (don’t trust the client)
    const preview = await computePreview({ productIds, target });

    const results = Array.isArray(preview?.results) ? preview.results : [];
    const blocked = results.filter((r) => (r?.blockers || []).length > 0);

    if (blocked.length > 0) {
      return Response.json(
        {
          error:
            "Some products are blocked and cannot be changed in a bulk operation",
          preview,
        },
        { status: 409 },
      );
    }

    const { is_active, pending_review, product_status } = mapTargetToFields(
      target,
    );

    const metadata = {
      target: product_status,
      reason,
      product_count: productIds.length,
    };

    const userId = Number(guard.userId);

    const [row] = await sql(
      `
      WITH op AS (
        INSERT INTO product_bulk_operations (
          operation_type,
          status,
          requested_by_user_id,
          notes,
          metadata
        ) VALUES (
          'bulk_status_change',
          'applied',
          $1,
          $2,
          $3::jsonb
        )
        RETURNING id
      ),
      targets AS (
        SELECT
          p.id AS product_id,
          CASE
            WHEN COALESCE(NULLIF(BTRIM(p.product_status), ''), '') <> '' THEN p.product_status
            WHEN p.is_active = true THEN 'active'
            WHEN p.pending_review = true THEN 'pending_review'
            ELSE 'draft'
          END AS from_status
        FROM products p
        WHERE p.id = ANY($4::int[])
      ),
      history AS (
        INSERT INTO product_history (
          product_id,
          bulk_operation_id,
          change_type,
          changed_by_user_id,
          snapshot
        )
        SELECT
          p.id,
          op.id,
          'bulk_status_change',
          $1,
          to_jsonb(p)
        FROM products p
        CROSS JOIN op
        WHERE p.id = ANY($4::int[])
        RETURNING id
      ),
      status_log AS (
        INSERT INTO product_status_log (
          product_id,
          bulk_operation_id,
          from_status,
          to_status,
          requested_by_user_id,
          approved_by_user_id,
          reason
        )
        SELECT
          t.product_id,
          op.id,
          t.from_status,
          $5,
          $1,
          NULL,
          $2
        FROM targets t
        CROSS JOIN op
      ),
      updated AS (
        UPDATE products
        SET is_active = $6,
            pending_review = $7,
            product_status = $8,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ANY($4::int[])
        RETURNING id
      )
      SELECT
        (SELECT id FROM op) AS bulk_operation_id,
        (SELECT COUNT(*)::int FROM updated) AS updated_count,
        (SELECT COUNT(*)::int FROM history) AS history_count
    `,
      [
        userId,
        reason,
        JSON.stringify(metadata),
        productIds,
        product_status,
        is_active,
        pending_review,
        product_status,
      ],
    );

    return Response.json({
      success: true,
      bulk_operation_id: row?.bulk_operation_id ?? null,
      updated_count: Number(row?.updated_count) || 0,
      history_count: Number(row?.history_count) || 0,
      preview_summary: preview?.summary || null,
    });
  } catch (e) {
    console.error(e);
    const msg = String(e?.message || "Failed to apply bulk status change");
    return Response.json({ error: msg }, { status: 500 });
  }
}
