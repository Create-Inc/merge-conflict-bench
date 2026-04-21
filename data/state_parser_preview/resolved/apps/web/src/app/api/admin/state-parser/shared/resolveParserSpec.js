// STEP 6E — Parser spec resolution (shared by Preview + Apply)
//
// Purpose:
// - Dispatch is version-driven (parser_version -> versions registry -> spec.adapter)
// - Source adapter hints are advisory only
// - Drift is surfaced via warnings (never blocks)

import {
  normalizeParserVersionKeyStrict,
  normalizeAdapterHintForMatch,
  resolveParserVersionSpec,
} from "../versions";

function normalizeStateCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function normalizeAdapterHint(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  return normalizeAdapterHintForMatch(raw) || raw;
}

/**
 * Resolve the effective parser spec.
 *
 * @param {object} params
 * @param {string} params.state
 * @param {string} params.parser_version
 * @param {object} params.sourceRow - source meta (from registry list / rule_sources)
 * @returns {Promise<object>}
 */
export async function resolveParserSpec({ state, parser_version, sourceRow }) {
  const s = normalizeStateCode(state);
  const rawVersion = String(parser_version || "").trim();

  if (!rawVersion) {
    return {
      ok: false,
      implemented: false,
      status: 400,
      code: "PARSER_VERSION_REQUIRED",
      message: "parser_version is required (select a version in Panel C).",
      parser_version: rawVersion,
    };
  }

  const normalized = normalizeParserVersionKeyStrict(rawVersion);
  if (!normalized) {
    return {
      ok: false,
      implemented: false,
      status: 409,
      code: "INVALID_PARSER_VERSION",
      message:
        "parser_version must be a real registry key (for example: html_single_index_v1, html_multi_index_v1, html_json_index_v1, pdf_v1, hybrid_v1).",
      parser_version: rawVersion,
    };
  }

  const sourceClass = sourceRow?.source_class || null;

  const resolved = resolveParserVersionSpec({
    version_key: normalized,
    state: s,
    source_class: sourceClass,
  });

  if (!resolved.ok) {
    return {
      ok: false,
      implemented: false,
      status: 409,
      code: resolved.error || "PARSER_VERSION_NOT_ALLOWED",
      message: "parser_version is not allowed for this state/source_class.",
      parser_version: normalized,
      source_class: sourceClass,
      supported_source_classes: resolved.supported_source_classes || [],
      states: resolved.states || ["*"],
    };
  }

  if (resolved.implemented !== true) {
    return {
      ok: false,
      implemented: false,
      status: 409,
      code: "PARSER_VERSION_NOT_IMPLEMENTED",
      message: "Selected parser_version is not implemented.",
      parser_version: normalized,
      source_class: sourceClass,
    };
  }

  const warnings = [];

  const hinted = normalizeAdapterHint(
    sourceRow?.adapter_hint || sourceRow?.parser_adapter_hint || null,
  );
  const expected = String(resolved.adapter || "").trim() || null;

  if (hinted && expected && hinted !== expected) {
    warnings.push({
      code: "SOURCE_ADAPTER_HINT_MISMATCH",
      message: `Source adapter_hint (${hinted}) differs from selected version adapter (${expected}). Ignoring hint.`,
      adapter_hint: hinted,
      adapter_selected: expected,
    });
  }

  return {
    ok: true,
    spec: resolved,
    adapterKey: expected,
    warnings,
    parser_version_normalized: normalized,
  };
}
