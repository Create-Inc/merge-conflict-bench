import { CheckCircle, ExternalLink, Loader2, Lock, Save } from "lucide-react";
import { useEffect } from "react";
import { SOURCE_CLASS_OPTIONS } from "@/data/courtTypes";
import {
  DISCOVERY_STRATEGY_OPTIONS,
  RULE_SOURCE_FAMILY_OPTIONS,
  RULE_SOURCE_FAMILY_VALUES,
  getPatternOptionsForSourceClass,
  labelForSourceClass,
} from "@/data/ruleSourceUx";

export function SourceRow({
  source,
  sources,
  setSources,
  savingId,
  saveSourceRow,
}) {
  const isSaving = savingId === source.id;

  const urlValueRaw = source.source_url ?? source.url ?? source.sourceUrl ?? "";
  const urlValue = String(urlValueRaw || "");
  const href = urlValue.trim() || null;

  const sourceClass = String(source.source_class || "unknown");
  const isPdfClass = sourceClass.toLowerCase() === "pdf";

  // Child source detection
  const parentSourceId = source.parent_source_id;
  const sourceDepthRaw = source.source_depth;
  const sourceDepth = Number.isFinite(Number(sourceDepthRaw))
    ? Number(sourceDepthRaw)
    : 0;
  const isChildSource = Boolean(parentSourceId) || Boolean(sourceDepth > 0);

  const familyKeyValue = String(source.family_key || "");
  const familyIsKnown = familyKeyValue
    ? RULE_SOURCE_FAMILY_VALUES.has(familyKeyValue)
    : true;

  const isFamilyRootRaw = Boolean(source.family_root);
  const isFamilyRoot = Boolean(
    !isPdfClass && !isChildSource && isFamilyRootRaw,
  );

  const shouldWarnMissingFamily = Boolean(isFamilyRoot && !familyKeyValue);
  const shouldShowDiscovery = Boolean(
    isFamilyRoot && !isPdfClass && !isChildSource,
  );

  const patternOptions = getPatternOptionsForSourceClass(sourceClass);
  const patternHintValue = String(source.parser_pattern_hint || "");
  const patternIsKnown = patternHintValue
    ? new Set(patternOptions.map((o) => o.value)).has(patternHintValue)
    : true;

  const discoverModeValue = String(source.discover_mode || "");

  // UI guardrails
  useEffect(() => {
    const needsPdfFix = Boolean(
      isPdfClass && (source.family_root || source.discover_mode),
    );
    const needsRootFix = Boolean(!source.family_root && source.discover_mode);
    const needsChildFix = Boolean(
      isChildSource && (source.family_root || source.discover_mode),
    );

    if (!needsPdfFix && !needsRootFix && !needsChildFix) {
      return;
    }

    setSources((prev) =>
      prev.map((s) => {
        if (s.id !== source.id) {
          return s;
        }

        const next = { ...s };

        if (isPdfClass) {
          next.family_root = false;
          next.discover_mode = "";
        }

        if (!next.family_root) {
          next.discover_mode = "";
        }

        if (isChildSource) {
          next.family_root = false;
          next.discover_mode = "";
        }

        next._dirty = true;
        return next;
      }),
    );
  }, [
    isPdfClass,
    isChildSource,
    setSources,
    source.discover_mode,
    source.family_root,
    source.id,
  ]);

  const childBadge = isChildSource ? (
    <span className="ml-1 inline-flex items-center gap-1 text-[11px] px-1 py-0.5 rounded bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300 font-jetbrains-mono">
      <Lock size={10} />
      <span title="Discovered child sources inherit family/root settings from their root.">
        Child
      </span>
    </span>
  ) : null;

  const familyWarningBadge = shouldWarnMissingFamily ? (
    <span className="ml-1 text-[11px] px-1 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
      Fam?
    </span>
  ) : null;

  const canEditFamilyFields = Boolean(!isSaving && !isChildSource);

  const sanitizedRowForSave = (() => {
    const next = { ...source, _dirty: false };

    if (isPdfClass) {
      next.family_root = false;
      next.discover_mode = "";
    }

    if (!next.family_root) {
      next.discover_mode = "";
    }

    if (isChildSource) {
      next.family_root = false;
      next.discover_mode = "";
    }

    return next;
  })();

  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#262626]">
      {/* Jurisdiction */}
      <td className="px-4 py-3 text-sm font-jetbrains-mono text-gray-900 dark:text-gray-100">
        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-bold">
          {source.jurisdiction_code}
        </span>
      </td>

      {/* Court Type */}
      <td className="px-4 py-3 text-sm font-jetbrains-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
        <div
          className="max-w-[100px] truncate"
          title={source.court_type || source.court_level || "N/A"}
        >
          {source.court_type || source.court_level || "N/A"}
        </div>
      </td>

      {/* Rule Set */}
      <td className="px-4 py-3 text-sm font-jetbrains-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
        <div
          className="max-w-[100px] truncate"
          title={source.rule_set || source.rule_type || "N/A"}
        >
          {source.rule_set || source.rule_type || "N/A"}
        </div>
      </td>

      {/* Authority */}
      <td className="px-4 py-3 text-sm font-jetbrains-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
        <div
          className="max-w-[100px] truncate"
          title={source.authority_name || source.source_name || "N/A"}
        >
          {source.authority_name || source.source_name || "N/A"}
        </div>
      </td>

      {/* Source URL */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-2">
          <input
            type="url"
            value={urlValue}
            disabled={isSaving}
            onChange={(e) => {
              const next = e.target.value;
              setSources((prev) =>
                prev.map((s) =>
                  s.id === source.id
                    ? { ...s, source_url: next, _dirty: true }
                    : s,
                ),
              );
            }}
            placeholder="https://..."
            className="w-full max-w-[260px] px-2 py-1 bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded font-jetbrains-mono text-xs disabled:opacity-50"
          />

          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-jetbrains-mono text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center space-x-1 max-w-[280px]"
            >
              <span className="truncate">{href}</span>
              <ExternalLink size={10} className="flex-shrink-0" />
            </a>
          ) : (
            <span className="text-xs font-jetbrains-mono text-gray-400">
              (no url)
            </span>
          )}
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <div
            className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium w-fit ${
              source.is_active
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                : "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300"
            }`}
          >
            <CheckCircle size={6} />
            <span>{source.is_active ? "Active" : "Inactive"}</span>
          </div>
          {source.ingestion_status ? (
            <span className="text-xs text-gray-500 dark:text-gray-500 font-jetbrains-mono">
              {source.ingestion_status}
            </span>
          ) : null}
        </div>
      </td>

      {/* Source Class - constrained width */}
      <td className="px-4 py-3">
        <select
          value={sourceClass}
          disabled={isSaving}
          onChange={(e) => {
            const next = e.target.value;
            const nextIsPdf = String(next).toLowerCase() === "pdf";
            setSources((prev) =>
              prev.map((s) =>
                s.id === source.id
                  ? {
                      ...s,
                      source_class: next,
                      family_root: nextIsPdf ? false : s.family_root,
                      discover_mode: nextIsPdf ? "" : s.discover_mode,
                      _dirty: true,
                    }
                  : s,
              ),
            );
          }}
          className="w-full max-w-[80px] px-2 py-1 bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded font-jetbrains-mono text-xs disabled:opacity-50"
          title="Class answers: what is this source technically?"
        >
          {SOURCE_CLASS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {labelForSourceClass(opt)}
            </option>
          ))}
        </select>
      </td>

      {/* Authoritative */}
      <td className="px-4 py-3 text-center">
        <input
          type="checkbox"
          checked={Boolean(source.is_authoritative)}
          disabled={isSaving}
          onChange={(e) => {
            const next = e.target.checked;
            setSources((prev) =>
              prev.map((s) =>
                s.id === source.id
                  ? { ...s, is_authoritative: next, _dirty: true }
                  : s,
              ),
            );
          }}
          className="w-3 h-3"
        />
      </td>

      {/* Parser Eligible */}
      <td className="px-4 py-3 text-center">
        <input
          type="checkbox"
          checked={Boolean(source.is_parser_eligible)}
          disabled={isSaving}
          onChange={(e) => {
            const next = e.target.checked;
            setSources((prev) =>
              prev.map((s) =>
                s.id === source.id
                  ? { ...s, is_parser_eligible: next, _dirty: true }
                  : s,
              ),
            );
          }}
          className="w-3 h-3"
        />
      </td>

      {/* Pattern - constrained width */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <select
            value={patternIsKnown ? patternHintValue : ""}
            disabled={isSaving}
            onChange={(e) => {
              const next = e.target.value;
              setSources((prev) =>
                prev.map((s) =>
                  s.id === source.id
                    ? { ...s, parser_pattern_hint: next, _dirty: true }
                    : s,
                ),
              );
            }}
            title="Parser versions select the adapter; this is only a hint."
            className="w-full max-w-[100px] px-2 py-1 bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded font-jetbrains-mono text-xs disabled:opacity-50"
          >
            {patternOptions.map((opt) => {
              const key = opt.value || "_auto";
              return (
                <option key={key} value={opt.value}>
                  {opt.label}
                </option>
              );
            })}
          </select>
          {!patternIsKnown && patternHintValue ? (
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-jetbrains-mono">
              legacy: {patternHintValue}
            </span>
          ) : null}
        </div>
      </td>

      {/* Priority - constrained and centered */}
<<<<<<< ours
      <td className="px-4 py-3 w-[110px]">
=======
      <td className="px-4 py-3 w-[80px] min-w-[80px]">
>>>>>>> theirs
        <input
          type="number"
          value={Number(source.priority ?? 100)}
          disabled={isSaving}
          onChange={(e) => {
            const next = Number(e.target.value);
            setSources((prev) =>
              prev.map((s) =>
                s.id === source.id ? { ...s, priority: next, _dirty: true } : s,
              ),
            );
          }}
          className="w-[96px] max-w-[96px] px-2 py-1 bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded font-jetbrains-mono text-xs text-center disabled:opacity-50"
        />
      </td>

      {/* Family / Root / Discovery - condensed inline layout */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-2 max-w-[140px]">
          {/* Family selector with inline root checkbox */}
          <div className="flex items-center gap-2">
            <select
              value={familyIsKnown ? familyKeyValue : ""}
              disabled={!canEditFamilyFields}
              onChange={(e) => {
                const next = e.target.value;
                setSources((prev) =>
                  prev.map((s) =>
                    s.id === source.id
                      ? { ...s, family_key: next, _dirty: true }
                      : s,
                  ),
                );
              }}
              className="flex-1 min-w-0 px-2 py-1 bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded font-jetbrains-mono text-xs disabled:opacity-50"
              title={
                isChildSource
                  ? "This is a discovered child. Family is inherited and locked."
                  : "Family answers: what bucket does this belong to?"
              }
            >
              <option value="">(none)</option>
              {RULE_SOURCE_FAMILY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Inline Root checkbox for non-PDF sources */}
            {!isPdfClass ? (
              <div className="flex items-center gap-1 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={isFamilyRoot}
                  disabled={!canEditFamilyFields}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setSources((prev) =>
                      prev.map((s) =>
                        s.id === source.id
                          ? {
                              ...s,
                              family_root: next,
                              discover_mode: next ? s.discover_mode : "",
                              _dirty: true,
                            }
                          : s,
                      ),
                    );
                  }}
                  className="w-3 h-3"
                  id={`root-${source.id}`}
                />
                <label
                  htmlFor={`root-${source.id}`}
                  className="text-[11px] font-jetbrains-mono text-gray-600 dark:text-gray-400 cursor-pointer"
                  title="Root sources can discover and register child sources."
                >
                  Root
                </label>
              </div>
            ) : null}
          </div>

          {/* Warning badges and child indicator */}
          <div className="flex items-center gap-1 flex-wrap">
            {familyWarningBadge}
            {childBadge}
          </div>

          {/* Legacy family key notice */}
          {!familyIsKnown && familyKeyValue ? (
            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-jetbrains-mono">
              legacy: {familyKeyValue}
            </div>
          ) : null}

          {/* Child inheritance notice */}
          {isChildSource ? (
            <div className="text-[11px] text-gray-500 dark:text-gray-500 font-jetbrains-mono">
              inherited from discovery
            </div>
          ) : null}

          {/* Discovery mode (only show if root) */}
          {shouldShowDiscovery ? (
            <select
              value={discoverModeValue}
              disabled={isSaving || isChildSource}
              onChange={(e) => {
                const next = e.target.value;
                setSources((prev) =>
                  prev.map((s) =>
                    s.id === source.id
                      ? { ...s, discover_mode: next, _dirty: true }
                      : s,
                  ),
                );
              }}
              className="w-full max-w-[160px] px-2 py-1 bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded font-jetbrains-mono text-xs disabled:opacity-50"
            >
              {DISCOVERY_STRATEGY_OPTIONS.map((opt) => {
                const key = opt.value || "_none";
                return (
                  <option key={key} value={opt.value}>
                    {opt.label}
                  </option>
                );
              })}
            </select>
          ) : null}

          {/* PDF leaf notice */}
          {isPdfClass ? (
            <div className="text-xs text-gray-500 dark:text-gray-500 font-jetbrains-mono">
              PDF = leaf
            </div>
          ) : null}
        </div>
      </td>

      {/* Save button */}
      <td className="px-4 py-3">
        <button
          onClick={() => saveSourceRow(sanitizedRowForSave)}
          disabled={isSaving}
          className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-jetbrains-mono hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-1 whitespace-nowrap"
        >
          {isSaving ? (
            <>
              <Loader2 size={6} className="animate-spin" />
              <span>Saving</span>
            </>
          ) : (
            <>
              <Save size={6} />
              <span>Save</span>
            </>
          )}
        </button>
      </td>
    </tr>
  );
}
