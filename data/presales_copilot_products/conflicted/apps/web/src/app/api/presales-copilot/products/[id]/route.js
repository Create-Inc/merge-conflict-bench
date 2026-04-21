<<<<<<< ours
import sql from "@/app/api/utils/sql";
import { getActor, requireAuthActor } from "@/app/api/utils/authz";

function safeTrim(v) {
  return typeof v === "string" ? v.trim() : "";
}

function safeInt(v, fallback) {
  const n = Number.parseInt(String(v), 10);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeId(id) {
  const n = safeInt(id, null);
  return n === null ? null : n;
}

function canAccessOrg(actor, orgId) {
  if (!orgId) return false;
  if (actor?.realIsPlatformAdmin) return true;
  const orgIds = Array.isArray(actor?.orgIds) ? actor.orgIds : [];
  return orgIds.includes(String(orgId));
}

export async function GET(request, { params }) {
  try {
    const actor = await getActor(request);
    const authRes = requireAuthActor(actor);
    if (authRes) return authRes;

    const productId = normalizeId(params?.id);
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
          specs: product.specs_json,
          specSheetUrl: product.spec_sheet_url,
          approved: Boolean(product.approved),
          isActive: Boolean(product.is_active),
          reviewedBy: product.reviewed_by,
          fieldSources: product.field_sources,
          sourceCount: product.source_count,
          lastEnrichedAt: product.last_enriched_at,
          createdAt: product.created_at,
          updatedAt: product.updated_at,
          sources: sources || [],
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

    const productId = normalizeId(params?.id);
    if (!productId) {
      return Response.json({ error: "Invalid product id" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);

    const updates = [];
    const values = [];
    let idx = 1;

    const setField = (column, value, cast) => {
      updates.push(`${column} = $${idx}${cast || ""}`);
      values.push(value);
      idx++;
    };

    if (body?.vendor !== undefined) setField("vendor", safeTrim(body.vendor));
    if (body?.productFamily !== undefined)
      setField("product_family", safeTrim(body.productFamily) || null);
    if (body?.modelName !== undefined)
      setField("model_name", safeTrim(body.modelName));
    if (body?.sku !== undefined) setField("sku", safeTrim(body.sku) || null);
    if (body?.productType !== undefined)
      setField("product_type", safeTrim(body.productType) || null);
    if (body?.category !== undefined)
      setField("category", safeTrim(body.category) || null);

    if (body?.specs !== undefined) {
      if (!body.specs || typeof body.specs !== "object") {
        return Response.json(
          { error: "specs must be an object" },
          { status: 400 },
        );
      }
      setField("specs_json", JSON.stringify(body.specs), "::jsonb");
    }

    if (body?.specSheetUrl !== undefined)
      setField("spec_sheet_url", safeTrim(body.specSheetUrl) || null);

    if (body?.approved !== undefined) {
      const approved = Boolean(body.approved);
      setField("approved", approved);
      if (approved) {
        const userIdInt = safeInt(actor.userId, null);
        setField("reviewed_by", userIdInt);
      }
    }

    if (body?.isActive !== undefined) {
      setField("is_active", Boolean(body.isActive));
    }

    if (!updates.length) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");

    values.push(productId);

    const rows = await sql(
      `
      UPDATE public.presales_copilot_products
      SET ${updates.join(", ")}
      WHERE id = $${idx}
      RETURNING *
      `,
      values,
    );

    if (!rows?.length) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    return Response.json(
      { ok: true, product: rows[0] },
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

    const productId = normalizeId(params?.id);
    if (!productId) {
      return Response.json({ error: "Invalid product id" }, { status: 400 });
    }

    const rows = await sql(
      `
      UPDATE public.presales_copilot_products
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id
      `,
      [productId],
    );

    if (!rows?.length) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    return Response.json(
      { ok: true, id: rows[0].id },
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
=======
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

    const productRows = await sql(
      `SELECT * FROM public.presales_copilot_products WHERE id = $1 LIMIT 1`,
      [productId],
    );

    if (!productRows?.length) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    const product = productRows[0];
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

    const specs =
      product.specs_json && typeof product.specs_json === "object"
        ? product.specs_json
        : typeof product.specs_json === "string"
          ? JSON.parse(product.specs_json)
          : null;

    const fieldSources =
      product.field_sources && typeof product.field_sources === "object"
        ? product.field_sources
        : typeof product.field_sources === "string"
          ? JSON.parse(product.field_sources)
          : null;

    return Response.json(
      {
        id: product.id,
        orgId: orgId,
        vendor: product.vendor,
        productFamily: product.product_family,
        modelName: product.model_name,
        sku: product.sku,
        productType: product.product_type,
        category: product.category,
        specs,
        approved: Boolean(product.approved),
        isActive: Boolean(product.is_active),
        reviewedBy: product.reviewed_by,
        sources: sources || [],
        fieldSources,
        sourceCount: product.source_count || 0,
        lastEnrichedAt: product.last_enriched_at,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("GET /api/presales-copilot/products/[id] error:", error);
    return Response.json({ error: "Failed to fetch product" }, { status: 500 });
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

    const body = await request.json().catch(() => null);

    const setClauses = [];
    const values = [];
    let i = 1;

    if (hasOwn(body, "vendor")) {
      setClauses.push(`vendor = $${i}`);
      values.push(safeTrim(body.vendor) || null);
      i += 1;
    }

    if (hasOwn(body, "productFamily")) {
      setClauses.push(`product_family = $${i}`);
      values.push(safeTrim(body.productFamily) || null);
      i += 1;
    }

    if (hasOwn(body, "modelName")) {
      setClauses.push(`model_name = $${i}`);
      values.push(safeTrim(body.modelName) || null);
      i += 1;
    }

    if (hasOwn(body, "sku")) {
      setClauses.push(`sku = $${i}`);
      values.push(safeTrim(body.sku) || null);
      i += 1;
    }

    if (hasOwn(body, "productType")) {
      setClauses.push(`product_type = $${i}`);
      values.push(safeTrim(body.productType) || null);
      i += 1;
    }

    if (hasOwn(body, "category")) {
      setClauses.push(`category = $${i}`);
      values.push(safeTrim(body.category) || null);
      i += 1;
    }

    if (hasOwn(body, "specSheetUrl")) {
      setClauses.push(`spec_sheet_url = $${i}`);
      values.push(safeTrim(body.specSheetUrl) || null);
      i += 1;
    }

    if (hasOwn(body, "specs")) {
      const specs = body?.specs;
      let obj = null;
      if (specs && typeof specs === "object") obj = specs;
      else if (typeof specs === "string") {
        obj = JSON.parse(specs);
      } else if (specs === null) {
        obj = null;
      }

      setClauses.push(`specs_json = $${i}::jsonb`);
      values.push(obj === null ? null : JSON.stringify(obj));
      i += 1;
    }

    if (hasOwn(body, "approved")) {
      const approved = Boolean(body.approved);
      setClauses.push(`approved = $${i}`);
      values.push(approved);
      i += 1;

      // track reviewer when approving; clear when un-approving
      setClauses.push(`reviewed_by = $${i}`);
      values.push(approved ? String(actor.userId) : null);
      i += 1;
    }

    if (hasOwn(body, "isActive")) {
      setClauses.push(`is_active = $${i}`);
      values.push(Boolean(body.isActive));
      i += 1;
    }

    if (!setClauses.length) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    // Always bump updated_at
    setClauses.push(`updated_at = NOW()`);

    // Ensure the product belongs to an org the admin can operate on (usually any org)
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
      SET is_active = false, updated_at = NOW()
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
      { error: "Failed to delete product" },
      { status: 500 },
    );
  }
}
>>>>>>> theirs
