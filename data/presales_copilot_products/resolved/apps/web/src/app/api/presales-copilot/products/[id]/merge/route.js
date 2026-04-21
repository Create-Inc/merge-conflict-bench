import sql from "@/app/api/utils/sql";
import { getActor, requireAuthActor } from "@/app/api/utils/authz";

function safeInt(value) {
  const n = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(n) ? n : null;
}

function safeTrim(v) {
  return typeof v === "string" ? v.trim() : "";
}

function canAccessOrg(actor, orgId) {
  if (!orgId) return false;
  if (actor?.realIsPlatformAdmin) return true;
  const orgIds = Array.isArray(actor?.orgIds) ? actor.orgIds : [];
  return orgIds.includes(String(orgId));
}

function setNestedValue(obj, path, value) {
  if (!obj || typeof obj !== "object") return;
  const keys = String(path || "").split(".").filter(Boolean);
  if (!keys.length) return;

  const lastKey = keys.pop();
  let current = obj;

  for (const key of keys) {
    if (!current[key] || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key];
  }

  current[lastKey] = value;
}

export async function POST(request, { params }) {
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

    const newFields = Array.isArray(body?.newFields) ? body.newFields : [];
    const resolvedConflicts = Array.isArray(body?.resolvedConflicts)
      ? body.resolvedConflicts
      : [];
    const enhancements = Array.isArray(body?.enhancements) ? body.enhancements : [];

    const sourceInfo =
      body?.sourceInfo && typeof body.sourceInfo === "object" ? body.sourceInfo : null;

    const productRows = await sql(
      `SELECT id, org_id, specs_json FROM public.presales_copilot_products WHERE id = $1 LIMIT 1`,
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

    const specs =
      product.specs_json && typeof product.specs_json === "object"
        ? { ...product.specs_json }
        : typeof product.specs_json === "string"
          ? JSON.parse(product.specs_json)
          : {};

    // Apply new fields
    for (const field of newFields) {
      const path = safeTrim(field?.path);
      if (!path) continue;
      setNestedValue(specs, path, field?.value);
    }

    // Apply conflict resolutions
    for (const conflict of resolvedConflicts) {
      const path = safeTrim(conflict?.path);
      if (!path) continue;

      const resolution = safeTrim(conflict?.resolution);
      if (resolution === "use_new") {
        setNestedValue(specs, path, conflict?.newValue);
      } else if (resolution === "manual") {
        setNestedValue(specs, path, conflict?.value);
      }
      // keep_existing: no-op
    }

    // Apply enhancements (merged arrays)
    for (const enhancement of enhancements) {
      const path = safeTrim(enhancement?.path);
      if (!path) continue;
      if (Array.isArray(enhancement?.merged)) {
        setNestedValue(specs, path, enhancement.merged);
      }
    }

    await sql(
      `
      UPDATE public.presales_copilot_products
      SET
        specs_json = $1::jsonb,
        source_count = COALESCE(source_count, 0) + 1,
        last_enriched_at = NOW(),
        updated_at = NOW()
      WHERE id = $2
      `,
      [JSON.stringify(specs), productId],
    );

    if (sourceInfo) {
      const fileHash = safeTrim(sourceInfo.fileHash) || null;

      // Best-effort: avoid violating unique_file_hash
      if (fileHash) {
        const existing = await sql(
          `SELECT id FROM public.presales_copilot_product_sources WHERE file_hash = $1 LIMIT 1`,
          [fileHash],
        );
        if (existing?.length) {
          return Response.json(
            {
              error: "duplicate_file",
              message: "This file hash is already associated with a product source",
              existingSourceId: existing[0].id,
            },
            { status: 409 },
          );
        }
      }

      await sql(
        `
        INSERT INTO public.presales_copilot_product_sources (
          product_id,
          org_id,
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
        ) VALUES (
          $1,
          $2::uuid,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9::jsonb,
          $10,
          NOW(),
          $11,
          $12::jsonb
        )
        `,
        [
          productId,
          orgId,
          safeTrim(sourceInfo.sourceType) || null,
          safeTrim(sourceInfo.sourceFilename) || null,
          safeTrim(sourceInfo.sourceUrl) || null,
          fileHash,
          typeof sourceInfo.fileSizeBytes === "number" &&
          Number.isFinite(sourceInfo.fileSizeBytes)
            ? sourceInfo.fileSizeBytes
            : null,
          safeTrim(sourceInfo.extractionMethod) || null,
          null,
          safeInt(actor.userId),
          safeTrim(sourceInfo.mergeStrategy) || "smart_merge",
          JSON.stringify(resolvedConflicts || []),
        ],
      );
    }

    return Response.json(
      { ok: true, message: "Product enriched successfully" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("POST /api/presales-copilot/products/[id]/merge error:", error);

    const msg =
      typeof error?.message === "string" && error.message.trim()
        ? error.message
        : "Merge failed";

    return Response.json({ error: msg }, { status: 500 });
  }
}
