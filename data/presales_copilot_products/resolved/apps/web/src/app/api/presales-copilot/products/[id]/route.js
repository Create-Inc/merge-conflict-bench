import sql from "@/app/api/utils/sql";
import { getActor, requireAuthActor } from "@/app/api/utils/authz";

function safeTrim(v) {
  return typeof v === "string" ? v.trim() : "";
}

function safeInt(value) {
  const n = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(n) ? n : null;
}

function canAccessOrg(actor, orgId) {
  if (!orgId) return false;
  if (actor?.realIsPlatformAdmin) return true;
  const orgIds = Array.isArray(actor?.orgIds) ? actor.orgIds : [];
  return orgIds.includes(String(orgId));
}

function safeJsonParse(value, fallback) {
  if (value && typeof value === "object") return value;
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

export async function GET(request, { params }) {
  try {
    const actor = await getActor(request);
    const authRes = requireAuthActor(actor);
    if (authRes) return authRes;

    const productId = safeInt(params?.id);
    if (!productId) {
      return Response.json({ error: "Invalid product id" }, { status: 400 });
    }

    const rows = await sql(
      `SELECT * FROM public.presales_copilot_products WHERE id = $1 LIMIT 1`,
      [productId],
    );

    if (!rows?.length) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    const product = rows[0];
    const orgId = product?.org_id ? String(product.org_id) : "";

    if (!canAccessOrg(actor, orgId)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const sources = await sql(
      `
      SELECT
        id,
        source_type,
        source_filename,
        source_url,
        file_hash,
        file_size_bytes,
        extraction_method,
        extracted_fields,
        uploaded_by,
        uploaded_at,
        merge_strategy,
        conflicts_detected
      FROM public.presales_copilot_product_sources
      WHERE product_id = $1
      ORDER BY uploaded_at DESC
      `,
      [productId],
    );

    const specs = safeJsonParse(product.specs_json, null);
    const fieldSources = safeJsonParse(product.field_sources, null);

    return Response.json(
      {
        ok: true,
        product: {
          id: product.id,
          orgId: product.org_id,
          vendor: product.vendor,
          productFamily: product.product_family,
          modelName: product.model_name,
          sku: product.sku,
          productType: product.product_type,
          category: product.category,
          specs,
          specSheetUrl: product.spec_sheet_url,
          approved: Boolean(product.approved),
          isActive: Boolean(product.is_active),
          reviewedBy: product.reviewed_by,
          fieldSources,
          sources: sources || [],
          sourceCount: product.source_count || 0,
          lastEnrichedAt: product.last_enriched_at,
          createdAt: product.created_at,
          updatedAt: product.updated_at,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("GET /api/presales-copilot/products/[id] error:", error);
    return Response.json(
      { error: error?.message || "Failed to fetch product" },
      { status: 500 },
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const actor = await getActor(request);
    const authRes = requireAuthActor(actor);
    if (authRes) return authRes;

    if (!actor?.isPlatformAdmin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const productId = safeInt(params?.id);
    if (!productId) {
      return Response.json({ error: "Invalid product id" }, { status: 400 });
    }

    const existing = await sql(
      `SELECT id, org_id FROM public.presales_copilot_products WHERE id = $1 LIMIT 1`,
      [productId],
    );

    if (!existing?.length) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    const orgId = existing[0]?.org_id ? String(existing[0].org_id) : "";
    if (!canAccessOrg(actor, orgId)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);

    const setClauses = [];
    const values = [];
    let i = 1;

    const setField = (sqlFrag, val) => {
      setClauses.push(sqlFrag.replace("$i", `$${i}`));
      values.push(val);
      i += 1;
    };

    if (hasOwn(body, "vendor")) setField("vendor = $i", safeTrim(body.vendor) || null);
    if (hasOwn(body, "productFamily")) setField("product_family = $i", safeTrim(body.productFamily) || null);
    if (hasOwn(body, "modelName")) setField("model_name = $i", safeTrim(body.modelName) || null);
    if (hasOwn(body, "sku")) setField("sku = $i", safeTrim(body.sku) || null);
    if (hasOwn(body, "productType")) setField("product_type = $i", safeTrim(body.productType) || null);
    if (hasOwn(body, "category")) setField("category = $i", safeTrim(body.category) || null);
    if (hasOwn(body, "specSheetUrl")) setField("spec_sheet_url = $i", safeTrim(body.specSheetUrl) || null);

    if (hasOwn(body, "specs")) {
      const obj =
        body?.specs && typeof body.specs === "object"
          ? body.specs
          : typeof body?.specs === "string"
            ? JSON.parse(body.specs)
            : null;

      setField("specs_json = $i::jsonb", obj === null ? null : JSON.stringify(obj));
    }

    if (hasOwn(body, "approved")) {
      const approved = Boolean(body.approved);
      setField("approved = $i", approved);
      setField("reviewed_by = $i", approved ? safeInt(actor.userId) : null);
    }

    if (hasOwn(body, "isActive")) {
      setField("is_active = $i", Boolean(body.isActive));
    }

    if (!setClauses.length) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    setClauses.push("updated_at = CURRENT_TIMESTAMP");

    values.push(productId);

    const updated = await sql(
      `
      UPDATE public.presales_copilot_products
      SET ${setClauses.join(", ")}
      WHERE id = $${i}
      RETURNING *
      `,
      values,
    );

    if (!updated?.length) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    return Response.json(
      { ok: true, product: updated[0] },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("PUT /api/presales-copilot/products/[id] error:", error);
    return Response.json(
      { error: error?.message || "Failed to update product" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const actor = await getActor(request);
    const authRes = requireAuthActor(actor);
    if (authRes) return authRes;

    if (!actor?.isPlatformAdmin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const productId = safeInt(params?.id);
    if (!productId) {
      return Response.json({ error: "Invalid product id" }, { status: 400 });
    }

    const existing = await sql(
      `SELECT id, org_id FROM public.presales_copilot_products WHERE id = $1 LIMIT 1`,
      [productId],
    );

    if (!existing?.length) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    const orgId = existing[0]?.org_id ? String(existing[0].org_id) : "";
    if (!canAccessOrg(actor, orgId)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await sql(
      `
      UPDATE public.presales_copilot_products
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [productId],
    );

    return Response.json(
      { ok: true, message: "Product deleted" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("DELETE /api/presales-copilot/products/[id] error:", error);
    return Response.json(
      { error: error?.message || "Failed to delete product" },
      { status: 500 },
    );
  }
}
