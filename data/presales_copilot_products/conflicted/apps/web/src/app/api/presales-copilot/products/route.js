<<<<<<< ours
import sql from "@/app/api/utils/sql";
import { getActor, requireAuthActor } from "@/app/api/utils/authz";

function safeTrim(v) {
  return typeof v === "string" ? v.trim() : "";
}

function isUuid(value) {
  const v = safeTrim(value);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    v,
  );
}

function canAccessOrg(actor, orgId) {
  if (!orgId) return false;
  if (actor?.realIsPlatformAdmin) return true;
  const orgIds = Array.isArray(actor?.orgIds) ? actor.orgIds : [];
  return orgIds.includes(String(orgId));
}

function safeInt(v, fallback) {
  const n = Number.parseInt(String(v), 10);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeSort(sort) {
  const s = safeTrim(sort);
  const allowed = new Set([
    "vendor",
    "model_name",
    "sku",
    "product_type",
    "approved",
    "created_at",
    "updated_at",
  ]);
  return allowed.has(s) ? s : "updated_at";
}

function normalizeOrder(order) {
  return safeTrim(order).toLowerCase() === "asc" ? "ASC" : "DESC";
}

export async function GET(request) {
  try {
    const actor = await getActor(request);
    const authRes = requireAuthActor(actor);
    if (authRes) return authRes;

    const url = new URL(request.url);
    const orgId = safeTrim(url.searchParams.get("orgId"));

    if (!orgId) {
      return Response.json({ error: "Missing orgId" }, { status: 400 });
    }
    if (!isUuid(orgId)) {
      return Response.json({ error: "orgId must be a UUID" }, { status: 400 });
    }
    if (!canAccessOrg(actor, orgId)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const vendor = safeTrim(url.searchParams.get("vendor"));
    const productType = safeTrim(url.searchParams.get("productType"));
    const category = safeTrim(url.searchParams.get("category"));
    const status = safeTrim(url.searchParams.get("status"));
    const search = safeTrim(url.searchParams.get("search"));

    const includeInactive =
      safeTrim(url.searchParams.get("includeInactive")) === "1";

    const page = Math.max(1, safeInt(url.searchParams.get("page"), 1));
    const limit = Math.min(
      100,
      Math.max(1, safeInt(url.searchParams.get("limit"), 25)),
    );
    const offset = (page - 1) * limit;

    const sort = normalizeSort(url.searchParams.get("sort"));
    const order = normalizeOrder(url.searchParams.get("order"));

    const where = [];
    const values = [];
    let idx = 1;

    where.push(`org_id = $${idx}::uuid`);
    values.push(orgId);
    idx++;

    if (!includeInactive) {
      where.push("is_active = true");
    }

    if (vendor) {
      where.push(`vendor = $${idx}`);
      values.push(vendor);
      idx++;
    }

    if (productType) {
      where.push(`product_type = $${idx}`);
      values.push(productType);
      idx++;
    }

    if (category) {
      where.push(`category = $${idx}`);
      values.push(category);
      idx++;
    }

    if (status === "approved") {
      where.push("approved = true");
    } else if (status === "pending") {
      where.push("approved = false");
    }

    if (search) {
      where.push(
        `(
          model_name ILIKE $${idx}
          OR sku ILIKE $${idx}
          OR product_family ILIKE $${idx}
          OR vendor ILIKE $${idx}
        )`,
      );
      values.push(`%${search}%`);
      idx++;
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const countRows = await sql(
      `SELECT COUNT(*)::int as count FROM public.presales_copilot_products ${whereClause}`,
      values,
    );
    const total = Number(countRows?.[0]?.count || 0);

    values.push(limit);
    values.push(offset);

    const rows = await sql(
      `
      SELECT
        id,
        org_id,
        vendor,
        product_family,
        model_name,
        sku,
        product_type,
        category,
        approved,
        is_active,
        source_count,
        last_enriched_at,
        created_at,
        updated_at
      FROM public.presales_copilot_products
      ${whereClause}
      ORDER BY ${sort} ${order}
      LIMIT $${idx} OFFSET $${idx + 1}
      `,
      values,
    );

    return Response.json(
      {
        ok: true,
        orgId,
        products: rows || [],
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("GET /api/presales-copilot/products error:", error);
    return Response.json(
      { error: error?.message || "Failed to fetch products" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const actor = await getActor(request);
    const authRes = requireAuthActor(actor);
    if (authRes) return authRes;

    // Only platform admins can create/update catalog data.
    // IMPORTANT: actor.isPlatformAdmin is false in Preview Mode.
    if (!actor?.isPlatformAdmin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);

    const orgId = safeTrim(body?.orgId);
    if (!orgId) {
      return Response.json({ error: "Missing orgId" }, { status: 400 });
    }
    if (!isUuid(orgId)) {
      return Response.json({ error: "orgId must be a UUID" }, { status: 400 });
    }

    const vendor = safeTrim(body?.vendor);
    const modelName = safeTrim(body?.modelName);
    const specs = body?.specs;

    if (!vendor || !modelName || !specs || typeof specs !== "object") {
      return Response.json(
        { error: "Missing required fields: vendor, modelName, specs" },
        { status: 400 },
      );
    }

    const productFamily = safeTrim(body?.productFamily) || null;
    const sku = safeTrim(body?.sku) || null;
    const productType = safeTrim(body?.productType) || null;
    const category = safeTrim(body?.category) || null;
    const specSheetUrl = safeTrim(body?.specSheetUrl) || null;

    const approved = Boolean(body?.approved);

    const userIdInt = safeInt(actor.userId, null);

    const inserted = await sql(
      `
      INSERT INTO public.presales_copilot_products (
        org_id,
        vendor,
        product_family,
        model_name,
        sku,
        product_type,
        category,
        specs_json,
        spec_sheet_url,
        extracted_at,
        reviewed_by,
        approved,
        source_count
      ) VALUES (
        $1::uuid,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8::jsonb,
        $9,
        CURRENT_TIMESTAMP,
        $10,
        $11,
        1
      )
      RETURNING *
      `,
      [
        orgId,
        vendor,
        productFamily,
        modelName,
        sku,
        productType,
        category,
        JSON.stringify(specs),
        specSheetUrl,
        approved ? userIdInt : null,
        approved,
      ],
    );

    const product = inserted?.[0] || null;
    if (!product) {
      return Response.json({ error: "Insert failed" }, { status: 500 });
    }

    const sourceInfo =
      body?.sourceInfo && typeof body.sourceInfo === "object"
        ? body.sourceInfo
        : null;

    if (sourceInfo) {
      const sourceType = safeTrim(sourceInfo.sourceType) || null;
      const sourceFilename = safeTrim(sourceInfo.sourceFilename) || null;
      const sourceUrl = safeTrim(sourceInfo.sourceUrl) || specSheetUrl;
      const fileHash = safeTrim(sourceInfo.fileHash) || null;
      const fileSizeBytes =
        sourceInfo.fileSizeBytes === undefined ||
        sourceInfo.fileSizeBytes === null
          ? null
          : Number(sourceInfo.fileSizeBytes);
      const extractionMethod = safeTrim(sourceInfo.extractionMethod) || null;

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
          uploaded_at
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
          CURRENT_TIMESTAMP
        )
        `,
        [
          product.id,
          orgId,
          sourceType,
          sourceFilename,
          sourceUrl,
          fileHash,
          Number.isFinite(fileSizeBytes) ? fileSizeBytes : null,
          extractionMethod,
          userIdInt,
        ],
      );
    }

    return Response.json(
      { ok: true, product },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("POST /api/presales-copilot/products error:", error);

    const msg =
      typeof error?.message === "string" && error.message.trim()
        ? error.message
        : "Failed to create product";

    // Best-effort unique constraint message
    if (String(msg).toLowerCase().includes("unique_org_vendor_sku")) {
      return Response.json(
        { error: "Product with this vendor and SKU already exists" },
        { status: 409 },
      );
    }

    return Response.json({ error: msg }, { status: 500 });
  }
}
=======
import sql from "@/app/api/utils/sql";
import { getActor, requireAuthActor } from "@/app/api/utils/authz";

function safeTrim(v) {
  return typeof v === "string" ? v.trim() : "";
}

function isUuid(value) {
  const v = safeTrim(value);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    v,
  );
}

function canAccessOrg(actor, orgId) {
  if (!orgId) return false;
  if (actor?.realIsPlatformAdmin) return true;
  const orgIds = Array.isArray(actor?.orgIds) ? actor.orgIds : [];
  return orgIds.includes(String(orgId));
}

function safeInt(value, fallback) {
  const n = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeJsonInput(value, label) {
  if (value && typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      throw new Error(`${label || "json"} must be valid JSON`);
    }
  }
  return null;
}

export async function GET(request) {
  try {
    const actor = await getActor(request);
    const authRes = requireAuthActor(actor);
    if (authRes) return authRes;

    const { searchParams } = new URL(request.url);

    const orgId = safeTrim(searchParams.get("orgId"));
    const vendor = safeTrim(searchParams.get("vendor"));
    const productType = safeTrim(searchParams.get("productType"));
    const category = safeTrim(searchParams.get("category"));
    const status = safeTrim(searchParams.get("status"));
    const search = safeTrim(searchParams.get("search"));
    const includeInactive =
      safeTrim(searchParams.get("includeInactive")) === "1";

    const page = Math.max(1, safeInt(searchParams.get("page"), 1));
    const limitRaw = safeInt(searchParams.get("limit"), 25);
    const limit = Math.min(100, Math.max(1, limitRaw));
    const sort = safeTrim(searchParams.get("sort")) || "updated_at";
    const orderRaw = safeTrim(searchParams.get("order")) || "desc";

    if (!orgId) {
      return Response.json({ error: "Missing orgId" }, { status: 400 });
    }
    if (!isUuid(orgId)) {
      return Response.json({ error: "orgId must be a UUID" }, { status: 400 });
    }
    if (!canAccessOrg(actor, orgId)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const where = ["org_id = $1::uuid"]; // always org-scoped
    const values = [orgId];
    let i = 2;

    // NEW: default to active-only unless explicitly asked
    if (!includeInactive) {
      where.push("is_active = true");
    }

    if (vendor) {
      where.push(`LOWER(vendor) = LOWER($${i})`);
      values.push(vendor);
      i += 1;
    }

    if (productType) {
      where.push(`product_type = $${i}`);
      values.push(productType);
      i += 1;
    }

    if (category) {
      where.push(`category = $${i}`);
      values.push(category);
      i += 1;
    }

    if (status === "approved") {
      where.push("approved = true");
    } else if (status === "pending") {
      where.push("approved = false");
    }

    if (search) {
      where.push(`(
        model_name ILIKE $${i}
        OR sku ILIKE $${i}
        OR product_family ILIKE $${i}
        OR vendor ILIKE $${i}
      )`);
      values.push(`%${search}%`);
      i += 1;
    }

    const whereClause = where.join(" AND ");

    const allowedSort = new Set([
      "vendor",
      "model_name",
      "sku",
      "created_at",
      "updated_at",
      "source_count",
    ]);
    const sortCol = allowedSort.has(sort) ? sort : "updated_at";
    const order = orderRaw === "asc" ? "ASC" : "DESC";

    const countRows = await sql(
      `SELECT COUNT(*)::int as count FROM public.presales_copilot_products WHERE ${whereClause}`,
      values,
    );

    const total = Number(countRows?.[0]?.count || 0);

    const offset = (page - 1) * limit;
    const rows = await sql(
      `
      SELECT
        id,
        org_id,
        vendor,
        product_family,
        model_name,
        sku,
        product_type,
        category,
        approved,
        is_active,
        source_count,
        last_enriched_at,
        created_at,
        updated_at
      FROM public.presales_copilot_products
      WHERE ${whereClause}
      ORDER BY ${sortCol} ${order}
      LIMIT $${i} OFFSET $${i + 1}
      `,
      [...values, limit, offset],
    );

    return Response.json(
      {
        products: rows || [],
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("GET /api/presales-copilot/products error:", error);
    return Response.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const actor = await getActor(request);
    const authRes = requireAuthActor(actor);
    if (authRes) return authRes;

    // Only platform admins can create / mutate product catalog.
    // IMPORTANT: actor.isPlatformAdmin is false in Preview Mode by design.
    if (!actor?.isPlatformAdmin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);

    const orgId = safeTrim(body?.orgId);
    const vendor = safeTrim(body?.vendor);
    const productFamily = safeTrim(body?.productFamily);
    const modelName = safeTrim(body?.modelName);
    const sku = safeTrim(body?.sku);
    const productType = safeTrim(body?.productType);
    const category = safeTrim(body?.category);
    const specSheetUrl = safeTrim(body?.specSheetUrl);
    const approved =
      body?.approved === undefined ? false : Boolean(body.approved);

    const specsObj = normalizeJsonInput(body?.specs, "specs");

    const sourceInfo =
      body?.sourceInfo && typeof body.sourceInfo === "object"
        ? body.sourceInfo
        : null;

    if (!orgId) {
      return Response.json({ error: "Missing orgId" }, { status: 400 });
    }
    if (!isUuid(orgId)) {
      return Response.json({ error: "orgId must be a UUID" }, { status: 400 });
    }
    if (!canAccessOrg(actor, orgId)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!vendor) {
      return Response.json({ error: "vendor is required" }, { status: 400 });
    }
    if (!modelName) {
      return Response.json({ error: "modelName is required" }, { status: 400 });
    }
    if (!specsObj) {
      return Response.json({ error: "specs is required" }, { status: 400 });
    }

    const specsJson = JSON.stringify(specsObj);

    const created = await sql(
      `
      INSERT INTO public.presales_copilot_products (
        org_id,
        vendor,
        product_family,
        model_name,
        sku,
        product_type,
        category,
        specs_json,
        spec_sheet_url,
        extracted_at,
        reviewed_by,
        approved,
        source_count
      ) VALUES (
        $1::uuid,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8::jsonb,
        $9,
        NOW(),
        $10,
        $11,
        $12
      )
      RETURNING *
      `,
      [
        orgId,
        vendor,
        productFamily || null,
        modelName,
        sku || null,
        productType || null,
        category || null,
        specsJson,
        specSheetUrl || null,
        approved ? String(actor.userId) : null,
        approved,
        sourceInfo ? 1 : 0,
      ],
    );

    const product = created?.[0] || null;
    if (!product) {
      return Response.json(
        { error: "Failed to create product" },
        { status: 500 },
      );
    }

    if (sourceInfo) {
      const sourceType = safeTrim(sourceInfo.sourceType);
      const sourceFilename = safeTrim(sourceInfo.sourceFilename);
      const sourceUrl = safeTrim(sourceInfo.sourceUrl) || specSheetUrl || null;
      const fileHash = safeTrim(sourceInfo.fileHash) || null;
      const fileSize =
        typeof sourceInfo.fileSize === "number" &&
        Number.isFinite(sourceInfo.fileSize)
          ? sourceInfo.fileSize
          : null;
      const extractionMethod = safeTrim(sourceInfo.extractionMethod) || null;
      const extractedFields = sourceInfo.extractedFields || null;

      // Best-effort: honor unique constraint (file_hash) if present
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
                "This exact file hash has already been stored in the catalog",
              existingSourceId: existing[0].id,
              product,
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
          uploaded_at
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
          NOW()
        )
        `,
        [
          product.id,
          orgId,
          sourceType || null,
          sourceFilename || null,
          sourceUrl,
          fileHash,
          fileSize,
          extractionMethod,
          extractedFields ? JSON.stringify(extractedFields) : null,
          String(actor.userId),
        ],
      );
    }

    return Response.json(
      {
        ok: true,
        productId: product.id,
        product,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("POST /api/presales-copilot/products error:", error);

    const message =
      typeof error?.message === "string" && error.message.trim()
        ? error.message
        : "Failed to create product";

    // If unique constraint triggered, bubble up a clean 409.
    if (String(message).toLowerCase().includes("unique")) {
      return Response.json({ error: message }, { status: 409 });
    }

    return Response.json({ error: message }, { status: 500 });
  }
}
>>>>>>> theirs
