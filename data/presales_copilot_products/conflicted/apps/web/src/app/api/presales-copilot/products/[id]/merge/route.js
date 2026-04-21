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

function setNestedValue(obj, path, value) {
  const keys = String(path || "")
    .split(".")
    .filter(Boolean);
  if (!keys.length) return;

  const last = keys.pop();
  let current = obj;

  for (const k of keys) {
    if (!current[k] || typeof current[k] !== "object") {
      current[k] = {};
    }
    current = current[k];
  }

  current[last] = value;
}

export async function POST(request, { params }) {
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

    const newFields = Array.isArray(body?.newFields) ? body.newFields : [];
    const resolvedConflicts = Array.isArray(body?.resolvedConflicts)
      ? body.resolvedConflicts
      : [];
    const enhancements = Array.isArray(body?.enhancements)
      ? body.enhancements
      : [];

    const sourceInfo =
      body?.sourceInfo && typeof body.sourceInfo === "object"
        ? body.sourceInfo
        : null;

    const productRows = await sql(
      `SELECT * FROM public.presales_copilot_products WHERE id = $1 LIMIT 1`,
      [productId],
    );

    if (!productRows?.length) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    const product = productRows[0];
    const orgId = product?.org_id ? String(product.org_id) : "";

    const specs =
      product?.specs_json && typeof product.specs_json === "object"
        ? JSON.parse(JSON.stringify(product.specs_json))
        : {};

    // Apply new fields
    for (const f of newFields) {
      const path = safeTrim(f?.path);
      if (!path) continue;
      setNestedValue(specs, path, f?.value);
    }

    // Apply conflict resolutions
    for (const c of resolvedConflicts) {
      const path = safeTrim(c?.path);
      if (!path) continue;

      const resolution = safeTrim(c?.resolution);
      if (resolution === "use_new") {
        setNestedValue(specs, path, c?.newValue);
      } else if (resolution === "manual") {
        setNestedValue(specs, path, c?.value);
      }
      // keep_existing => no-op
    }

    // Apply enhancements (merged arrays)
    for (const e of enhancements) {
      const path = safeTrim(e?.path);
      if (!path) continue;
      if (!Array.isArray(e?.merged)) continue;
      setNestedValue(specs, path, e.merged);
    }

    await sql(
      `
      UPDATE public.presales_copilot_products
      SET
        specs_json = $1::jsonb,
        source_count = COALESCE(source_count, 0) + 1,
        last_enriched_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
      [JSON.stringify(specs), productId],
    );

    if (sourceInfo) {
      const userIdInt = safeInt(actor.userId, null);

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
          uploaded_by,
          uploaded_at,
          merge_strategy,
          conflicts_detected,
          extracted_fields
        ) VALUES (
          $1,
          $2::uuid,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          CURRENT_TIMESTAMP,
          $10,
          $11::jsonb,
          $12::jsonb
        )
        `,
        [
          productId,
          orgId,
          safeTrim(sourceInfo.sourceType) || null,
          safeTrim(sourceInfo.sourceFilename) || null,
          safeTrim(sourceInfo.sourceUrl) || null,
          safeTrim(sourceInfo.fileHash) || null,
          Number.isFinite(Number(sourceInfo.fileSizeBytes))
            ? Number(sourceInfo.fileSizeBytes)
            : null,
          safeTrim(sourceInfo.extractionMethod) || null,
          userIdInt,
          safeTrim(sourceInfo.mergeStrategy) || "smart_merge",
          JSON.stringify(resolvedConflicts || []),
          JSON.stringify({ newFields, enhancements }),
        ],
      );
    }

    return Response.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "POST /api/presales-copilot/products/[id]/merge error:",
      error,
    );
    return Response.json(
      { error: error?.message || "Merge failed" },
      { status: 500 },
    );
  }
}
=======
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
  const keys = String(path || "")
    .split(".")
    .filter(Boolean);
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
    const enhancements = Array.isArray(body?.enhancements)
      ? body.enhancements
      : [];

    const sourceInfo =
      body?.sourceInfo && typeof body.sourceInfo === "object"
        ? body.sourceInfo
        : null;

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

    // Persist updated specs + enrichment metadata
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

    // Add source record if provided
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
              message:
                "This file hash is already associated with a product source",
              existingSourceId: existing[0].id,
            },
            { status: 409 },
          );
        }
      }

      const extractedFields = sourceInfo.extractedFields || null;
      const conflictsDetected =
        sourceInfo.conflictsDetected || resolvedConflicts || null;

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
          typeof sourceInfo.fileSize === "number" &&
          Number.isFinite(sourceInfo.fileSize)
            ? sourceInfo.fileSize
            : null,
          safeTrim(sourceInfo.extractionMethod) || null,
          extractedFields ? JSON.stringify(extractedFields) : null,
          String(actor.userId),
          safeTrim(sourceInfo.mergeStrategy) || "smart_merge",
          conflictsDetected ? JSON.stringify(conflictsDetected) : null,
        ],
      );
    }

    return Response.json(
      { ok: true, message: "Product enriched successfully" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "POST /api/presales-copilot/products/[id]/merge error:",
      error,
    );

    const msg =
      typeof error?.message === "string" && error.message.trim()
        ? error.message
        : "Merge failed";

    return Response.json({ error: msg }, { status: 500 });
  }
}
>>>>>>> theirs
