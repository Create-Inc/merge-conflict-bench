import sql from "@/app/api/utils/sql";
import { normalizeCourtLevelSafe } from "@/app/api/utils/court-type-normalization";
import {
  listEligibleParserSourcesForState,
  // getParserImplFor (no longer used; dispatch is version-driven)
  buildParserConfigFromSource,
} from "../registry";
<<<<<<< ours
import { buildBaseConfigFromVersion, normalizeSourceClass } from "../versions";
import { resolveParserSpec } from "../shared/resolveParserSpec";
=======
import {
  buildBaseConfigFromVersion,
  // Strict request normalization: reject legacy "v1" and unknown values.
  normalizeParserVersionKeyStrict,
  normalizeSourceClass,
} from "../versions";
import { resolveParserSpec } from "../shared/resolveParserSpec";
>>>>>>> theirs

export const MAX_APPLY_UPDATES = 5;
export const MAX_APPLY_INSERTS = 25;

// Load "current" per-state config (back-compat). Multi-source configs are stored inside config JSON.
export async function loadSavedConfig(state) {
  const [saved] = await sql(
    `
    SELECT source_key, config
    FROM public.state_parser_configs
    WHERE state_code = $1::varchar
    LIMIT 1
  `,
    [state],
  );

  const baseConfig = saved?.config || null;
  const multi = baseConfig?.multi_source_configs || null;

  return {
    hasSaved: Boolean(saved?.source_key),
    savedConfig: baseConfig || null,
    savedSourceKey: String(saved?.source_key || "").trim(),
    multiSourceConfigs: multi && typeof multi === "object" ? multi : {},
  };
}

export function mergeConfig({ baseCfg, savedConfig, sourceKey }) {
  const multi =
    savedConfig?.multi_source_configs &&
    typeof savedConfig.multi_source_configs === "object"
      ? savedConfig.multi_source_configs
      : {};

  const perSource = sourceKey ? multi?.[String(sourceKey)] || null : null;

  const cfg = {
    ...(baseCfg || {}),
    ...(savedConfig || {}),
    ...(perSource || {}),
  };

  cfg.source_key = String(sourceKey || cfg.source_key || "").trim() || null;

  const safeCourtType = normalizeCourtLevelSafe(
    String(cfg.court_type || "").trim(),
  );
  if (safeCourtType) cfg.court_type = safeCourtType;

  if (cfg.rule_set !== undefined && cfg.rule_set !== null) {
    cfg.rule_set = String(cfg.rule_set || "").trim();
  }

  return cfg;
}

function normalizeSourceClassForImpl(source_class) {
  return normalizeSourceClass(source_class);
}

// Builder-proof: no hard-coded "only source X supported".
// Apply should be allowed for any eligible source with an implemented adapter.
export async function validateSourceKey({ state, source_key, parser_version }) {
  const eligible = await listEligibleParserSourcesForState(state);
  const key = String(source_key || "").trim();

  const match = eligible.find((s) => String(s?.source_key) === key) || null;
  if (!match) {
    return {
      valid: false,
      error: "UNKNOWN_SOURCE",
      message:
        "This source_key is not eligible or not supported by any parser adapter.",
      source_key: key,
      eligible_sources: eligible.map((s) => s?.source_key).slice(0, 25),
    };
  }

  const resolved = resolveParserSpec({
    state,
    parser_version,
    sourceRow: match,
  });

  if (!resolved.ok) {
    return {
      valid: false,
      error: resolved.code,
      message: resolved.message,
      source_key: key,
      parser_version:
        resolved.parser_version || String(parser_version || "").trim(),
      supported_source_classes: resolved.supported_source_classes,
      states: resolved.states,
      warnings: Array.isArray(resolved.warnings) ? resolved.warnings : [],
    };
  }

  const sourceClass = normalizeSourceClassForImpl(match?.source_class);

<<<<<<< ours
  // IMPORTANT: adapter_hint is advisory; do not block Apply on drift.
  const impl = getParserImplFor({
=======
  if (!normalizedParserVersion) {
    return {
      valid: false,
      error: "INVALID_PARSER_VERSION",
      message:
        "parser_version must be a real registry key (for example: html_single_index_v1, html_multi_index_v1, html_json_index_v1, pdf_v1, hybrid_v1).",
      source_key: key,
      parser_version: String(parser_version || "").trim(),
    };
  }

  // STEP 6E: Resolve spec and warnings. adapter_hint drift is a WARNING.
  const resolved = await resolveParserSpec({
>>>>>>> theirs
    state,
<<<<<<< ours
    parser_version: resolved.normalizedParserVersion,
    adapter_hint: null,
    source_class: sourceClass,
    pattern_hint: match?.pattern_hint || null,
=======
    parser_version: normalizedParserVersion,
    sourceRow: match,
>>>>>>> theirs
  });

  if (!resolved.ok) {
    return {
      valid: false,
      error: resolved.code || "ADAPTER_NOT_IMPLEMENTED",
      message: resolved.message || "No parser implementation found.",
      source_key: key,
<<<<<<< ours
      parser_version: resolved.normalizedParserVersion,
      adapter_expected: resolved.adapterKey || null,
      warnings: Array.isArray(resolved.warnings) ? resolved.warnings : [],
=======
      parser_version: normalizedParserVersion,
      supported_source_classes: resolved.supported_source_classes || [],
      states: resolved.states || ["*"],
>>>>>>> theirs
    };
  }

  const spec = resolved.spec;
  const impl = {
    version_key: spec.version_key_used,
    parser_version: spec.version_key_used,
    base_version_key: spec.base_version_key,
    adapter: resolved.adapterKey,
    supported_source_classes: spec.supported_source_classes,
    states: spec.states,
    capabilities: spec.capabilities,
    limits: spec.limits,
    implemented: true,
  };

  return {
    valid: true,
    sourceMeta: match,
    impl,
<<<<<<< ours
    normalizedParserVersion: resolved.normalizedParserVersion,
    parserSpec: resolved.spec,
    adapterKey: resolved.adapterKey,
    warnings: Array.isArray(resolved.warnings) ? resolved.warnings : [],
=======
    normalizedParserVersion,
    warnings: Array.isArray(resolved.warnings) ? resolved.warnings : [],
>>>>>>> theirs
  };
}

export async function buildCfgForApply({
  state,
  savedConfig,
  sourceMeta,
  parser_version,
  mapping_preset,
}) {
  const resolved = resolveParserSpec({
    state,
    parser_version,
    sourceRow: sourceMeta,
  });

  if (!resolved.ok) {
    const err = new Error(resolved.code || "INVALID_PARSER_VERSION");
    err.statusCode = resolved.status || 409;
    err.details = {
      message: resolved.message,
      parser_version:
        resolved.parser_version || String(parser_version || "").trim(),
      state,
      source_key: String(sourceMeta?.source_key || "").trim() || null,
      supported_source_classes: resolved.supported_source_classes,
      states: resolved.states,
    };
    throw err;
  }

<<<<<<< ours
  const warnings = Array.isArray(resolved.warnings)
    ? [...resolved.warnings]
    : [];

  const sourceClass = normalizeSourceClassForImpl(sourceMeta?.source_class);

  const impl = getParserImplFor({
=======
  const resolved = await resolveParserSpec({
>>>>>>> theirs
    state,
<<<<<<< ours
    parser_version: resolved.normalizedParserVersion,
    adapter_hint: null,
    source_class: sourceClass,
    pattern_hint: sourceMeta?.pattern_hint || null,
=======
    parser_version: normalizedParserVersion,
    sourceRow: {
      ...(sourceMeta || {}),
      // Ensure the resolver sees the correct class for gating.
      source_class: sourceClass,
    },
>>>>>>> theirs
  });

  if (!resolved.ok) {
    const err = new Error(resolved.code || "ADAPTER_NOT_IMPLEMENTED");
    err.statusCode = 409;
<<<<<<< ours
    err.details = {
      message: "No parser implementation found for this source/version.",
      parser_version: resolved.normalizedParserVersion,
      adapter_expected: resolved.adapterKey || null,
    };
=======
    err.details = {
      message: resolved.message || "No parser implementation found.",
      parser_version: normalizedParserVersion,
    };
>>>>>>> theirs
    throw err;
  }

  const implAdapter = String(resolved.adapterKey || "").trim();

  const baseCfg = buildBaseConfigFromVersion({
    state,
    version_key: resolved.normalizedParserVersion,
    mapping_preset,
    sourceMeta,
  });

  const overlay = await buildParserConfigFromSource({
    state,
    fallback: baseCfg,
    sourceMeta,
    parser_version: resolved.normalizedParserVersion,
    mapping_preset,
  });

  const merged = mergeConfig({
    baseCfg,
    savedConfig,
    sourceKey: sourceMeta?.source_key,
  });

  const cfg = {
    ...merged,
    ...overlay,
    parser_version: resolved.normalizedParserVersion,
  };

  // Adapter is owned by parser_version.
  // Do NOT fail Apply on config/source drift; warn and override.
  const cfgAdapterRaw = String(cfg?.adapter || "").trim();
<<<<<<< ours
  const adapterExpected = String(resolved.adapterKey || "").trim();
=======

>>>>>>> theirs

  if (cfgAdapterRaw && adapterExpected && cfgAdapterRaw !== adapterExpected) {
    warnings.push({
      code: "CONFIG_ADAPTER_OVERRIDE_IGNORED",
      message: `Config adapter (${cfgAdapterRaw}) differs from selected version adapter (${adapterExpected}). Overriding to version adapter.`,
      cfg_adapter: cfgAdapterRaw,
      adapter_selected: adapterExpected,
    });
  }

  cfg.adapter = adapterExpected;

  return { cfg, warnings, parserSpec: resolved.spec };
}
