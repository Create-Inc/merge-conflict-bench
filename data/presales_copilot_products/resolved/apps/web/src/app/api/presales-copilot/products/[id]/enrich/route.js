import sql from "@/app/api/utils/sql";
import upload from "@/app/api/utils/upload";
import { getActor, requireAuthActor } from "@/app/api/utils/authz";

import { decryptFromString } from "../../../utils/encryption.js";
import { extractSpecsWithClaude } from "../../../utils/claude.js";
import { extractSpecsWithLlamaParse } from "../../../utils/llamaparse.js";
import { calculateFileHash } from "../../../utils/duplicate-detection.js";

function safeTrim(v) {
  return typeof v === "string" ? v.trim() : "";
}

function isUuid(value) {
  const v = safeTrim(value);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
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

function normalizeJson(value, fallback) {
  if (value && typeof value === "object") return value;
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function loadPresalesCopilotSettings(orgId) {
  const rows = await sql(
    `
    SELECT
      enabled,
      models,
      pdf_extraction_method,
      llamaparse_api_key,
      llamaparse_endpoint,
      llamaparse_mode
    FROM public.presales_copilot_settings
    WHERE org_id = $1::uuid
    LIMIT 1
    `,
    [orgId],
  );

  return rows?.[0] || null;
}

async function loadUserLlmConfig({ actor, orgId }) {
  const userId = actor?.userId ? String(actor.userId) : "";
  if (!userId) return null;

  let rows = [];
  rows = await sql(
    `SELECT settings FROM public.user_app_settings WHERE user_id = $1 AND org_id = $2::uuid LIMIT 1`,
    [userId, orgId],
  );

  if (!rows?.length) {
    rows = await sql(
      `SELECT settings FROM public.user_app_settings WHERE user_id = $1 AND org_id IS NULL LIMIT 1`,
      [userId],
    );
  }

  const settings = rows?.[0]?.settings || null;
  const llmConfig = settings?.llmConfig || null;

  if (!llmConfig || typeof llmConfig !== "object") return null;

  const { decryptIfNeeded } = await import("@/app/api/utils/crypto");
  const apiKeyRaw = typeof llmConfig.apiKey === "string" ? llmConfig.apiKey : "";
  const apiKey = apiKeyRaw ? await decryptIfNeeded(apiKeyRaw) : "";

  return { ...llmConfig, apiKey };
}

function pickExtractionMethod(incoming, settingsRow) {
  const requested = safeTrim(incoming);
  if (requested === "llamaparse" || requested === "claude") return requested;

  const fallback = safeTrim(settingsRow?.pdf_extraction_method);
  if (fallback === "llamaparse" || fallback === "claude") return fallback;

  return "claude";
}

function buildStructuredLlmConfig({ userLlmConfig, modelsRow, purposeKey }) {
  const models = normalizeJson(modelsRow, {});
  const purpose =
    models?.[purposeKey] && typeof models[purposeKey] === "object"
      ? models[purposeKey]
      : {};

  const provider =
    safeTrim(purpose.provider) || safeTrim(userLlmConfig?.provider) || "openai";
  const model = safeTrim(purpose.model) || safeTrim(userLlmConfig?.model) || "gpt-4o";

  const temperature =
    typeof purpose.temperature === "number"
      ? purpose.temperature
      : typeof userLlmConfig?.temperature === "number"
        ? userLlmConfig.temperature
        : 0.2;

  const maxTokens =
    typeof purpose.max_tokens === "number"
      ? purpose.max_tokens
      : typeof userLlmConfig?.maxTokens === "number"
        ? userLlmConfig.maxTokens
        : 4096;

  const apiEndpoint = safeTrim(purpose.apiEndpoint) || safeTrim(userLlmConfig?.apiEndpoint);

  return {
    provider,
    model,
    temperature,
    maxTokens,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    apiEndpoint,
    apiKey: safeTrim(userLlmConfig?.apiKey),
    fallbackChain: Array.isArray(userLlmConfig?.fallbackChain)
      ? userLlmConfig.fallbackChain
      : [],
  };
}

async function checkFileHashDuplicate(fileHash) {
  if (!fileHash) return null;

  const rows = await sql(
    `
    SELECT ps.product_id, ps.uploaded_at, p.model_name, p.sku
    FROM public.presales_copilot_product_sources ps
    JOIN public.presales_copilot_products p ON p.id = ps.product_id
    WHERE ps.file_hash = $1
    LIMIT 1
    `,
    [fileHash],
  );

  return rows?.[0] || null;
}

function performMergeAnalysis(existingSpecs, newSpecs) {
  const result = {
    newFields: [],
    conflicts: [],
    enhancements: [],
  };

  const walk = (existingObj, newObj, path = []) => {
    const e = existingObj && typeof existingObj === "object" ? existingObj : {};
    const n = newObj && typeof newObj === "object" ? newObj : {};

    for (const [key, newValue] of Object.entries(n)) {
      const currentPath = [...path, key];
      const pathString = currentPath.join(".");

      if (!(key in e)) {
        result.newFields.push({ path: pathString, value: newValue });
        continue;
      }

      const existingValue = e[key];

      const bothObjects =
        existingValue &&
        newValue &&
        typeof existingValue === "object" &&
        typeof newValue === "object" &&
        !Array.isArray(existingValue) &&
        !Array.isArray(newValue);

      if (bothObjects) {
        walk(existingValue, newValue, currentPath);
        continue;
      }

      if (Array.isArray(existingValue) && Array.isArray(newValue)) {
        const additions = newValue.filter((v) => !existingValue.includes(v));
        if (additions.length) {
          const merged = [...new Set([...existingValue, ...newValue])];
          result.enhancements.push({
            path: pathString,
            existing: existingValue,
            additions,
            merged,
          });
        }
        continue;
      }

      if (JSON.stringify(existingValue) !== JSON.stringify(newValue)) {
        result.conflicts.push({
          path: pathString,
          existingValue,
          newValue,
        });
      }
    }
  };

  walk(existingSpecs, newSpecs);
  return result;
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

    // Load product
    const productRows = await sql(
      `SELECT id, org_id, specs_json FROM public.presales_copilot_products WHERE id = $1 LIMIT 1`,
      [productId],
    );

    if (!productRows?.length) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    const product = productRows[0];
    const orgId = product?.org_id ? String(product.org_id) : "";

    if (!orgId || !isUuid(orgId)) {
      return Response.json({ error: "Product has invalid org_id" }, { status: 500 });
    }

    if (!canAccessOrg(actor, orgId)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const contentType = String(request.headers.get("content-type") || "");

    let file = null;
    let fileUrl = "";
    let documentType = "spec_sheet";
    let extractionMethod = "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      file = form.get("file");
      fileUrl = safeTrim(form.get("fileUrl"));
      documentType = safeTrim(form.get("documentType")) || "spec_sheet";
      extractionMethod = safeTrim(form.get("extractionMethod"));
    } else {
      const body = await request.json().catch(() => null);
      fileUrl = safeTrim(body?.fileUrl);
      documentType = safeTrim(body?.documentType) || "spec_sheet";
      extractionMethod = safeTrim(body?.extractionMethod);
    }

    const settingsRow = await loadPresalesCopilotSettings(orgId);
    if (!settingsRow || !settingsRow.enabled) {
      return Response.json(
        { error: "Presales Copilot not enabled for this org" },
        { status: 403 },
      );
    }

    const chosenMethod = pickExtractionMethod(extractionMethod, settingsRow);

    // If file wasn't provided, require fileUrl.
    if (!fileUrl) {
      if (!file || typeof file.arrayBuffer !== "function") {
        return Response.json(
          {
            error: "Missing file (multipart) or fileUrl (json)",
            hint: "For large PDFs, upload client-side with useUpload and call this endpoint with { fileUrl }.",
          },
          { status: 400 },
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const result = await upload({ buffer: new Uint8Array(arrayBuffer) });
      if (!result?.url) {
        return Response.json(
          { error: "Upload failed: server did not return a URL" },
          { status: 502 },
        );
      }

      fileUrl = result.url;
    }

    // Hash (best-effort)
    let fileName = "spec.pdf";
    let fileSize = null;
    let mimeType = "application/pdf";
    let bytesForHash = null;

    if (file && typeof file.arrayBuffer === "function") {
      const ab = await file.arrayBuffer();
      bytesForHash = ab;
      fileName = safeTrim(file?.name) || "spec.pdf";
      fileSize = typeof file?.size === "number" ? file.size : null;
      mimeType = safeTrim(file?.type) || "application/pdf";
    } else {
      const resp = await fetch(fileUrl);
      if (resp.ok) {
        mimeType = safeTrim(resp.headers.get("content-type")) || "application/pdf";
        const ab = await resp.arrayBuffer();
        bytesForHash = ab;
        fileSize = ab?.byteLength || null;
      }
    }

    const fileHash = bytesForHash ? await calculateFileHash(bytesForHash) : "";

    if (fileHash) {
      const dup = await checkFileHashDuplicate(fileHash);
      if (dup) {
        return Response.json(
          {
            error: "duplicate_file",
            message: "This exact file has already been uploaded",
            existingProduct: {
              id: dup.product_id,
              name: dup.model_name,
              sku: dup.sku,
              uploadedAt: dup.uploaded_at,
            },
          },
          { status: 409 },
        );
      }
    }

    const userLlmConfig = await loadUserLlmConfig({ actor, orgId });
    if (!userLlmConfig?.apiKey) {
      return Response.json(
        {
          error: "llm_not_configured",
          message: "LLM API key not configured. Go to Settings → LLM and add an API key, then retry.",
        },
        { status: 400 },
      );
    }

    const structuredLlmConfig = buildStructuredLlmConfig({
      userLlmConfig,
      modelsRow: settingsRow.models,
      purposeKey: "document_extractor",
    });

    let extractedData = null;

    if (chosenMethod === "llamaparse") {
      const encryptedKey = safeTrim(settingsRow.llamaparse_api_key);
      const llamaparseApiKey = encryptedKey ? await decryptFromString(encryptedKey) : "";

      if (!llamaparseApiKey) {
        return Response.json(
          {
            error: "llamaparse_not_configured",
            message: "LlamaParse API key not configured. Go to Settings → Presales Copilot and add the LlamaParse key.",
          },
          { status: 400 },
        );
      }

      const llamaparseConfig = {
        tier: "agentic",
        version: "latest",
        pollIntervalMs: 5000,
        maxPollAttempts: 24,
      };

      const res = await extractSpecsWithLlamaParse({
        pdfUrl: fileUrl,
        fileName,
        mimeType,
        llamaparseApiKey,
        llamaparseConfig,
        llmConfig: structuredLlmConfig,
      });

      extractedData = res.extracted;
    } else {
      if (String(structuredLlmConfig.provider || "").toLowerCase() !== "anthropic") {
        return Response.json(
          {
            error: "invalid_extraction_provider",
            message: "Claude-native PDF extraction requires provider=anthropic. Update Presales Copilot → Document Extractor provider, or switch to LlamaParse extraction.",
          },
          { status: 400 },
        );
      }

      const extractionConfig = normalizeJson(settingsRow.models, {})?.document_extractor || {};

      extractedData = await extractSpecsWithClaude(
        fileUrl,
        extractionConfig,
        structuredLlmConfig.apiKey,
      );
    }

    const existingSpecs =
      product.specs_json && typeof product.specs_json === "object"
        ? product.specs_json
        : typeof product.specs_json === "string"
          ? JSON.parse(product.specs_json)
          : {};

    const newSpecs =
      extractedData && typeof extractedData === "object"
        ? extractedData.specs && typeof extractedData.specs === "object"
          ? extractedData.specs
          : extractedData
        : {};

    const mergeResult = performMergeAnalysis(existingSpecs, newSpecs);

    return Response.json(
      {
        ok: true,
        orgId,
        productId,
        documentType,
        extractionMethod: chosenMethod,
        fileUrl,
        fileHash,
        fileName,
        fileSize,
        extractedData,
        mergeResult,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("POST /api/presales-copilot/products/[id]/enrich error:", error);

    const msg =
      typeof error?.message === "string" && error.message.trim()
        ? error.message
        : "Enrichment failed";

    return Response.json({ error: msg }, { status: 500 });
  }
}
