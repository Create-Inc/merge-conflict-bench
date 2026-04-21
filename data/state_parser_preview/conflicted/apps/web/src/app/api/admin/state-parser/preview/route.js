import {
  jsonNoStore,
  normalizeStateCode,
  requireAdminSessionOrReturnResponse,
} from "../utils";
import sql from "@/app/api/utils/sql";
import { fetchSnapshot as fetchStoredSnapshot } from "../apply/snapshot";
import { loadExistingRulesByCanonical, computeDiff } from "../diff";
import {
  loadSavedConfig,
  mergeConfigs,
  saveConfig,
  saveRuleSource,
} from "./configManager";
import {
  validateStateCode,
  validateSourceKey,
  parseRequestBody,
  makeCursor,
} from "./validation";
import {
  validatePdfRuleHeadingRegex,
  pdfValidationErrorResponse,
} from "../shared/pdfValidation";
import {
  handleAdapterNotImplemented,
  handleNoLinksFound,
  handlePagesFetchedZero,
  handleRuleContentEmpty,
  handleNoRulesParsed,
} from "./errorHandlers";
import { buildSuccessResponse } from "./responseBuilder";
import {
  listEligibleParserSourcesForState,
  buildParserConfigFromSource,
  // getParserImplFor (no longer used; dispatch is version-driven)
} from "../registry";
import { buildBaseConfigFromVersion } from "../versions";
import { resolveParserSpec } from "../shared/resolveParserSpec";
import {
<<<<<<< ours

=======
  buildBaseConfigFromVersion,
  // NOTE: Preview/Apply must fail closed unless the value is a real registry key.
  // This strict helper only maps legacy aliases (p4_v1, ca_P4_v1, etc.) and rejects "v1".
  normalizeParserVersionKeyStrict,
} from "../versions";
import { resolveParserSpec } from "../shared/resolveParserSpec";
import {
>>>>>>> theirs
  parseHybridIndexPdfAdapter,
  parsePdfTextRuleAdapter,
} from "../pdfAdapter";
import { parseCaRules } from "./caParser";
import { parseNjRules } from "./njParser";
import { parseHtmlSingleIndexAdapterPreview } from "../htmlSingleIndexAdapter";
import { normalizeMappingPresetForEngine } from "../presets";

export const dynamic = "force-dynamic";

const PREVIEW_SNAPSHOT_TTL_HOURS = 12;

async function loadLatestPreviewSnapshot({
  state,
  parser_version,
  mapping_preset,
  actor_user_id,
}) {
  if (!state || !actor_user_id) return null;

  const rows = await sql(
    `
    SELECT
      snapshot_url,
      snapshot_hash,
      created_at,
      (result->>'snapshot_html') AS snapshot_html,
      (result->>'snapshot_text') AS snapshot_text,
      (result->>'snapshot_content_type') AS snapshot_content_type,
      (result->>'snapshot_fetched_at') AS snapshot_fetched_at,
      (result->'snapshot_links') AS snapshot_links,
      (result->'cursor') AS cursor
    FROM public.state_parser_events
    WHERE state_code = $1::varchar
      AND event_type = 'STATE_PARSER_PREVIEW'
      AND actor_user_id = $2::int
      AND ($3::text IS NULL OR parser_version = $3::text)
      AND ($4::text IS NULL OR mapping_preset = $4::text)
      AND created_at > (now() - (($5::int)::text || ' hours')::interval)
    ORDER BY created_at DESC
    LIMIT 1
  `,
    [
      state,
      actor_user_id,
      String(parser_version || "").trim() || null,
      String(mapping_preset || "").trim() || null,
      PREVIEW_SNAPSHOT_TTL_HOURS,
    ],
  );

  const row = rows?.[0] || null;
  const html = row?.snapshot_html || null;
  const text = row?.snapshot_text || null;
  if (!html && !text) return null;

  return {
    url: row?.snapshot_url || null,
    hash: row?.snapshot_hash || null,
    fetched_at: row?.snapshot_fetched_at || row?.created_at || null,
    html,
    text,
    content_type: row?.snapshot_content_type || null,
    links: row?.snapshot_links || null,
    cursor: row?.cursor || null,
  };
}

export async function POST(request) {
  const { ok, response, session } = await requireAdminSessionOrReturnResponse();
  if (!ok) return response;

  // Hard time budget to prevent 524s.
  const MAX_MS = 11_000;
  const RESERVE_MS = 1_500;
  const startedAt = Date.now();
  const timeLeft = () => MAX_MS - (Date.now() - startedAt);

  try {
    const body = await request.json().catch(() => ({}));

    const {
      state: rawState,
      parser_version,
      mapping_preset,
      dry_run,
      batch_size,
      cursor,
      cursor_in,
    } = parseRequestBody(body);
    const state = normalizeStateCode(rawState);

    // NEW: UI preset -> engine preset normalization (prevents NJ-only preset logic leaking)
    const mapping_preset_ui = mapping_preset;
    const mapping_preset_engine = normalizeMappingPresetForEngine({
      state,
      mapping_preset: mapping_preset_ui,
    });

    const stateValidation = validateStateCode(state);
    if (!stateValidation.valid) return stateValidation.response;

    // Multi-source: load eligible sources from Rule Sources Manager ONLY
    const eligibleSources = await listEligibleParserSourcesForState(state);

    const saved = await loadSavedConfig(state);

    // Support both legacy (source) and new (source_key) request fields
    const requestedSource =
      String(body?.source_key || "").trim() ||
      String(body?.source || "").trim() ||
      String(saved?.source_key || "").trim() ||
      "";

    const sourceValidation = validateSourceKey({
      source: requestedSource,
      supportedSources: eligibleSources,
      state,
    });
    if (!sourceValidation.valid) return sourceValidation.response;

    const sourceMeta = sourceValidation.sourceMeta;

    // STEP 6D — Fail closed when parser_version is missing.
    const rawVersion = String(parser_version || "").trim();
    if (!rawVersion) {
      return jsonNoStore(
        {
          ok: false,
          implemented: false,
          error: "PARSER_VERSION_REQUIRED",
          message: "parser_version is required (select a version in Panel C).",
          state,
          source_key: sourceMeta.source_key,
          source_class: sourceMeta?.source_class || null,
        },
        { status: 400 },
      );
    }

<<<<<<< ours
    // STEP 6C/6D — Version-driven dispatch ONLY (source adapter_hint is advisory)
    const resolvedParser = resolveParserSpec({
=======
    // STEP 6C: STRICT dispatch by parser_version key.
    // Do NOT normalize via heuristics (no v1 -> P4/P5 fallback).
    const normalizedParserVersion = normalizeParserVersionKeyStrict(rawVersion);

    if (!normalizedParserVersion) {
      return jsonNoStore(
        {
          ok: false,
          implemented: false,
          error: "INVALID_PARSER_VERSION",
          message:
            "parser_version must be a real registry key (for example: html_single_index_v1, html_multi_index_v1, html_json_index_v1, pdf_v1, hybrid_v1).",
          state,
          source_key: sourceMeta.source_key,
          source_class: sourceMeta?.source_class || null,
          parser_version: rawVersion,
        },
        { status: 409 },
      );
    }

    // STEP 6E: Resolve registry spec (state/source_class gates) and compute warnings.
    // IMPORTANT: adapter_hint drift is a WARNING (never blocks).
    const resolved = await resolveParserSpec({
>>>>>>> theirs
      state,
<<<<<<< ours
      parser_version: rawVersion,
      sourceRow: sourceMeta,
=======
      parser_version: normalizedParserVersion,
      sourceRow: sourceMeta,
>>>>>>> theirs
    });

    if (!resolvedParser.ok) {
      return jsonNoStore(
        {
          ok: false,
          implemented: false,
<<<<<<< ours
          error: resolvedParser.code,
          message: resolvedParser.message,
=======
          error: resolved.code || "BAD_PARSER_VERSION",
          message: resolved.message || "parser_version is not allowed.",
>>>>>>> theirs
          state,
          source_key: sourceMeta.source_key,
          source_class: sourceMeta?.source_class || null,
          parser_version: resolvedParser.parser_version || rawVersion,
          supported_source_classes: resolvedParser.supported_source_classes,
          states: resolvedParser.states,
        },
        { status: resolvedParser.status || 409 },
      );
    }

<<<<<<< ours
    const normalizedParserVersion = resolvedParser.normalizedParserVersion;
    const adapterExpected = String(resolvedParser.adapterKey || "").trim();
    const warnings = Array.isArray(resolvedParser.warnings)
      ? [...resolvedParser.warnings]
      : [];

    // Validate that this source is compatible (do NOT block on adapter_hint drift)
    const impl = getParserImplFor({
      state,
      parser_version: normalizedParserVersion,
      adapter_hint: null,
      source_class: sourceMeta?.source_class || null,
      pattern_hint: sourceMeta?.pattern_hint || null,
    });
=======
    const spec = resolved.spec;
    const adapterExpected = String(resolved.adapterKey || "").trim();
    const specWarnings = Array.isArray(resolved.warnings)
      ? resolved.warnings
      : [];
>>>>>>> theirs

<<<<<<< ours
    if (!impl || impl?.implemented !== true) {
      return jsonNoStore(
        {
          ok: false,
          implemented: false,
          error: impl?.reason || "ADAPTER_NOT_IMPLEMENTED",
          message: "No parser implementation found for this source/version.",
          state,
          source_key: sourceMeta.source_key,
          parser_version: normalizedParserVersion,
          adapter_expected: adapterExpected,
          adapter_hint: sourceMeta?.adapter_hint || null,
          warnings,
        },
        { status: 409 },
      );
    }

=======

>>>>>>> theirs
    // Enforce preview batch limits from registry
    const maxPreview = Number(spec?.limits?.max_batch_override ?? 250);
    const pageSize = Math.max(1, Math.min(maxPreview, Number(batch_size)));

    // Build base cfg from parser version + source
    const baseCfg = buildBaseConfigFromVersion({
      state,
      version_key: normalizedParserVersion,
      mapping_preset: mapping_preset_ui,
      sourceMeta,
    });

    if (!baseCfg) {
      return handleAdapterNotImplemented({
        state,
        source: String(sourceMeta.source_key || "").trim(),
        session,
        parser_version: normalizedParserVersion,
        mapping_preset: mapping_preset_ui,
      });
    }

    // Strategy-aware URL placement + identity hints
    const cfgFromSource = await buildParserConfigFromSource({
      state,
      fallback: baseCfg,
      sourceMeta,
      mapping_preset: mapping_preset_ui,
      parser_version: normalizedParserVersion,
    });

    const cfgMerged = mergeConfigs({
      saved,
      baseCfg,
      body: {
        ...body,
        ...cfgFromSource,
        parser_version: normalizedParserVersion,
        source_class: sourceMeta?.source_class || null,
      },
    });

    // STEP 6C/6D: adapter is owned by parser_version.
    // Do NOT fail Preview on config/source drift; warn and override.
    const cfgAdapterRaw = String(cfgMerged?.adapter || "").trim();
    if (cfgAdapterRaw && adapterExpected && cfgAdapterRaw !== adapterExpected) {
      warnings.push({
        code: "CONFIG_ADAPTER_OVERRIDE_IGNORED",
        message: `Config adapter (${cfgAdapterRaw}) differs from selected version adapter (${adapterExpected}). Overriding to version adapter.`,
        cfg_adapter: cfgAdapterRaw,
        adapter_selected: adapterExpected,
      });
    }

    const cfg = { ...cfgMerged, adapter: adapterExpected };

    // --- Snapshot pinning (DB) ---
    const requestedSnapshotHash =
      String(body?.snapshot_hash || "").trim() ||
      String(cursor?.snapshot_hash || "").trim() ||
      null;

    let cachedSnapshot = null;
    if (requestedSnapshotHash) {
      cachedSnapshot = await fetchStoredSnapshot({
        state,
        snapshot_hash: requestedSnapshotHash,
      });
    }

    if (!cachedSnapshot) {
      cachedSnapshot = await loadLatestPreviewSnapshot({
        state,
        parser_version: normalizedParserVersion,
        mapping_preset: mapping_preset,
        actor_user_id: session.user.id,
      });
    }

    // PDF/Hybrid fail-fast validation (prevents slow/expensive parsing on bad configs)
    const sourceClass = String(cfg?.source_class || "")
      .trim()
      .toLowerCase();
    if (sourceClass === "pdf" || sourceClass === "hybrid") {
      const ruleHeadingRegex =
        cfg?.pdf_rule_heading_regex || cfg?.rule_heading_regex || null;

      const minHeadingMatches =
        cfg?.pdf_min_heading_matches ?? cfg?.min_heading_matches ?? null;

      const sampleText =
        cfg?.pdf_sample_text ||
        body?.pdf_sample_text ||
        body?.sample_text ||
        (typeof cachedSnapshot?.text === "string"
          ? cachedSnapshot.text
          : null) ||
        null;

      const validation = validatePdfRuleHeadingRegex({
        rule_heading_regex: ruleHeadingRegex,
        min_heading_matches: minHeadingMatches,
        sample_text: sampleText,
      });

      if (validation?.ok === false) {
        return pdfValidationErrorResponse({ state, validation });
      }
    }

    // Persist last-used selection for the workflow
    await saveConfig({
      state,
      parser_version: normalizedParserVersion,
      mapping_preset: mapping_preset_ui,
      cfg,
    });
    await saveRuleSource({ state, cfg });

    // --- continue with parsing logic ---
    let snapshot = null;
    let links = [];
    let parsedRules = [];
    let pagesFetched = 0;
    let pagesFailed = 0;
    let pageFailures = [];
    let cursor_advance = 0;

    // --- Adapter routing (STRICT by parser_version -> adapter) ---
    const adapterName = adapterExpected;

    if (adapterName === "PdfTextRuleAdapter") {
      const result = await parsePdfTextRuleAdapter({
        cfg: { ...cfg, state, mapping_preset: mapping_preset_engine },
        batch_size: pageSize,
        cursor,
        snapshot: cachedSnapshot,
        timeLeft,
        reserveMs: RESERVE_MS,
      });

      snapshot = result.snapshot;
      links = result.links;
      parsedRules = result.parsedRules;
      pagesFetched = result.pagesFetched;
      pagesFailed = result.pagesFailed;
      pageFailures = result.pageFailures;
      cursor_advance = Number(result.cursor_advance ?? 0) || 0;
    } else if (adapterName === "HybridIndexPdfAdapter") {
      const result = await parseHybridIndexPdfAdapter({
        cfg: { ...cfg, state, mapping_preset: mapping_preset_engine },
        batch_size: pageSize,
        cursor,
        snapshot: cachedSnapshot,
        timeLeft,
        reserveMs: RESERVE_MS,
      });

      snapshot = result.snapshot;
      links = result.links;
      parsedRules = result.parsedRules;
      pagesFetched = result.pagesFetched;
      pagesFailed = result.pagesFailed;
      pageFailures = result.pageFailures;
      cursor_advance = Number(result.cursor_advance ?? 0) || 0;
    } else if (adapterName === "PatternP4MultiIndexAdapter") {
      const result = await parseCaRules({
        cfg: { ...cfg, state, mapping_preset: mapping_preset_engine },
        batch_size: pageSize,
        cursor,
        snapshot: cachedSnapshot,
        timeLeft,
        reserveMs: RESERVE_MS,
      });

      snapshot = result.snapshot;
      links = result.links;
      parsedRules = result.parsedRules;
      pagesFetched = result.pagesFetched;
      pagesFailed = result.pagesFailed;
      pageFailures = result.pageFailures;
      cursor_advance = Number(result.cursor_advance ?? 0) || 0;
    } else if (
      adapterName === "PatternHtmlIndexHtmlRuleAdapter" ||
      adapterName === "PatternP5NjAdapter"
    ) {
      const result = await parseNjRules({
        cfg: { ...cfg, state, mapping_preset: mapping_preset_engine },
        batch_size: pageSize,
        cursor,
        snapshot: cachedSnapshot,
        timeLeft,
        reserveMs: RESERVE_MS,
      });

      snapshot = result.snapshot;
      links = result.links;
      parsedRules = result.parsedRules;
      pagesFetched = result.pagesFetched;
      pagesFailed = result.pagesFailed;
      pageFailures = result.pageFailures;
      cursor_advance = Number(result.cursor_advance ?? 0) || 0;

      if (!Array.isArray(links) || links.length === 0) {
        return handleNoLinksFound({
          state,
          cfg,
          snapshot,
          links,
          njDebug: snapshot?.nj_debug,
          session,
          parser_version: normalizedParserVersion,
          mapping_preset: mapping_preset_ui,
        });
      }

      if (
        pagesFetched === 0 &&
        String(cfg.pattern_id || "").toUpperCase() !== "P5_NJ_SUBTREE_JSON"
      ) {
        return handlePagesFetchedZero({
          state,
          cfg,
          snapshot,
          links,
          pagesFetched,
          pagesFailed,
          pageFailures,
          njDebug: snapshot?.nj_debug,
          session,
          parser_version: normalizedParserVersion,
          mapping_preset: mapping_preset_ui,
        });
      }

      if (parsedRules.length === 0) {
        return handleRuleContentEmpty({
          state,
          cfg,
          snapshot,
          links,
          pagesFetched,
          pagesFailed,
          pageFailures,
          njDebug: snapshot?.nj_debug,
          session,
          parser_version: normalizedParserVersion,
          mapping_preset: mapping_preset_ui,
        });
      }
    } else if (adapterName === "HtmlSingleIndexAdapter") {
      const result = await parseHtmlSingleIndexAdapterPreview({
        cfg: { ...cfg, state, mapping_preset: mapping_preset_engine },
        batch_size: pageSize,
        cursor,
        snapshot: cachedSnapshot,
        timeLeft,
        reserveMs: RESERVE_MS,
      });

      snapshot = result.snapshot;
      links = result.links;
      parsedRules = result.parsedRules;
      pagesFetched = result.pagesFetched;
      pagesFailed = result.pagesFailed;
      pageFailures = result.pageFailures;
      cursor_advance = Number(result.cursor_advance ?? 0) || 0;
    } else {
      return jsonNoStore(
        {
          ok: false,
          implemented: false,
          error: "ADAPTER_NOT_IMPLEMENTED",
          message: "Adapter runner not implemented for this parser_version.",
          state,
          source_key: sourceMeta.source_key,
          parser_version: normalizedParserVersion,
          adapter_used: adapterName,
        },
        { status: 409 },
      );
    }

    if (parsedRules.length === 0) {
      return handleNoRulesParsed({
        state,
        snapshot,
        links,
        pagesFetched,
        cfg,
        session,
        parser_version: normalizedParserVersion,
        mapping_preset: mapping_preset_ui,
      });
    }

    const ruleNumbers = parsedRules.map((r) => String(r.rule_number));

    const existingByRuleNumber = await loadExistingRulesByCanonical({
      state,
      ruleNumbers,
      courtType: cfg.court_type,
      ruleSet: cfg.rule_set,
    });

    const diff = computeDiff({ parsedRules, existingByRuleNumber });

    // Cursor bookkeeping (time-budget safe)
    const offset = Number(cursor?.offset ?? 0) || 0;
    const total = Array.isArray(links) ? links.length : 0;

    const prevOffset = Math.max(0, offset - pageSize);
    const cursor_prev =
      offset > 0
        ? makeCursor(prevOffset, {
            limit: pageSize,
            snapshot_hash: snapshot?.hash || null,
          })
        : null;

    const advance = Math.max(
      0,
      Math.min(
        Number.isFinite(Number(cursor_advance)) ? Number(cursor_advance) : 0,
        pageSize,
      ),
    );

    const nextOffset = Math.min(total, offset + advance);
    const done = total === 0 ? true : nextOffset >= total;
    const cursor_out = done
      ? null
      : makeCursor(nextOffset, {
          limit: pageSize,
          snapshot_hash: snapshot?.hash || null,
        });

    const cursor_in_final =
      cursor_in ||
      makeCursor(offset, {
        limit: pageSize,
        snapshot_hash: snapshot?.hash || null,
      });

    return buildSuccessResponse({
      state,
      snapshot,
      diff,
      links,
      parsedRules,
      pagesFetched,
      batch_size: pageSize,
      dry_run,
      session,
      parser_version: normalizedParserVersion,
      mapping_preset: mapping_preset_ui,
      cfg,
      cursor_in: cursor_in_final,
      cursor_out,
      cursor_prev,
      effective_limit: pageSize,
      link_count_scanned: nextOffset,
      done,
      latency_ms: Date.now() - startedAt,

      // STEP 6E warnings (non-blocking)
      warnings: specWarnings,

      // STEP 6D debug
<<<<<<< ours
      parser_version_used: resolvedParser.spec?.version_key_used,
=======
      parser_version_used: spec.version_key_used,
>>>>>>> theirs
      adapter_used: adapterName,
<<<<<<< ours
      capabilities: resolvedParser.spec?.capabilities,
=======
      capabilities: spec.capabilities,
>>>>>>> theirs
      source_class: sourceMeta?.source_class || null,

      // Drift visibility
      warnings,
    });
  } catch (error) {
    console.error("[state-parser preview] error", error);

    const status =
      Number.isFinite(Number(error?.statusCode)) && Number(error.statusCode)
        ? Number(error.statusCode)
        : 500;

    return jsonNoStore(
      {
        ok: false,
        error: error?.message || "Failed",
        details: error?.details || undefined,
        stack:
          process.env.NODE_ENV === "development" ? error?.stack : undefined,
      },
      { status },
    );
  }
}
