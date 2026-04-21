import sql from "@/app/api/utils/sql";
import { normalizeCourtLevelSafe } from "@/app/api/utils/court-type-normalization";
import {
  listEligibleParserSourcesForState,
  buildParserConfigFromSource,
} from "../registry";
import { buildBaseConfigFromVersion, normalizeSourceClass } from "../versions";
import { resolveParserSpec } from "../shared/resolveParserSpec";

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

  const resolved = await resolveParserSpec({
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

  const spec = resolved.spec;

  // Build an impl-like object from the spec so existing Apply limits logic stays intact.
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
    normalizedParserVersion: resolved.parser_version_normalized,
    parserSpec: spec,
    adapterKey: resolved.adapterKey,
    warnings: Array.isArray(resolved.warnings) ? resolved.warnings : [],
  };
}

export async function buildCfgForApply({
  state,
  savedConfig,
  sourceMeta,
  parser_version,
  mapping_preset,
}) {
  const sourceClass = normalizeSourceClassForImpl(sourceMeta?.source_class);

  const resolved = await resolveParserSpec({
    state,
    parser_version,
    sourceRow: {
      ...(sourceMeta || {}),
      // Ensure the resolver sees the correct class for gating.
      source_class: sourceClass,
    },
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

  const warnings = Array.isArray(resolved.warnings) ? [...resolved.warnings] : [];

  const baseCfg = buildBaseConfigFromVersion({
    state,
    version_key: resolved.parser_version_normalized,
    mapping_preset,
    sourceMeta,
  });

  if (!baseCfg) {
    const err = new Error("ADAPTER_NOT_IMPLEMENTED");
    err.statusCode = 409;
    err.details = {
      message: "No base config could be built for this parser_version.",
      parser_version: resolved.parser_version_normalized,
    };
    throw err;
  }

  const overlay = await buildParserConfigFromSource({
    state,
    fallback: baseCfg,
    sourceMeta,
    parser_version: resolved.parser_version_normalized,
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
    parser_version: resolved.parser_version_normalized,
  };

  // Adapter is owned by parser_version.
  // Do NOT fail Apply on config/source drift; warn and override.
  const cfgAdapterRaw = String(cfg?.adapter || "").trim();
  const adapterExpected = String(resolved.adapterKey || "").trim();

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
