import { useState } from "react";
import {
  DISCOVERY_STRATEGY_OPTIONS,
  RULE_SOURCE_FAMILY_OPTIONS,
  RULE_SOURCE_FAMILY_VALUES,
  getPatternOptionsForSourceClass,
} from "@/data/ruleSourceUx";

function inferFamilyKey({ url, sourceName }) {
  const hay = `${String(sourceName || "")} ${String(url || "")}`.toLowerCase();
  if (hay.includes("local")) return "local";
  if (hay.includes("ethic")) return "ethics";
  if (hay.includes("append")) return "appendix";
  if (hay.includes("standard")) return "standards";
  if (hay.includes("primary")) return "primary";
  return "standards";
}

function labelForFamilyKey(familyKey) {
  const key = String(familyKey || "").trim();
  const hit = RULE_SOURCE_FAMILY_OPTIONS.find((o) => o.value === key);
  return hit?.label || null;
}

function defaultDiscoverMode(sourceClass) {
  const sc = String(sourceClass || "").toLowerCase();
  if (sc === "pdf") return ""; // PDF is leaf in the Manager guardrails
  return "html_index";
}

export function DiscoverySection({
  activeSource,
  onDiscover,
  isDiscovering,
  discovered,
  onRegister,
  isRegistering,
  onRegisterRoot,
  isRegisteringRoot,
  disableNetwork,
}) {
  const [editsByKey, setEditsByKey] = useState({});

  const setEdits = (itemKey, patch) => {
    const k = String(itemKey || "");
    if (!k) return;
    setEditsByKey((prev) => {
      const next = { ...(prev || {}) };
      next[k] = { ...(next[k] || {}), ...(patch || {}) };
      return next;
    });
  };

  const rootName = String(
    activeSource?.source_name || activeSource?.source_key || "",
  );
  const rootUrl = String(activeSource?.url || "");

  const rootId =
    activeSource?.id !== null && activeSource?.id !== undefined
      ? Number(activeSource.id)
      : null;

  const canDiscover =
    !disableNetwork &&
    !isDiscovering &&
    Boolean(activeSource?.source_key) &&
    Number.isFinite(rootId) &&
    rootId > 0;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="text-xs font-bold text-gray-900 dark:text-gray-100 font-jetbrains-mono">
            Discover (live crawl of Active Source)
          </div>
          <div className="mt-1 text-[11px] text-gray-600 dark:text-gray-400 font-jetbrains-mono">
            Button-only. No DB writes until you click “Add to Registry” or “Register as Family Root”.
          </div>
          <div className="mt-2 text-[11px] text-gray-600 dark:text-gray-400 font-jetbrains-mono break-words">
            Active root:{" "}
            <span className="font-bold">{rootName || "(none)"}</span>
            {rootUrl ? (
              <>
                {" "}
                <a
                  href={rootUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
                  {rootUrl}
                </a>
              </>
            ) : null}
          </div>
        </div>

        <button
          onClick={onDiscover}
          disabled={!canDiscover}
          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white font-jetbrains-mono hover:bg-blue-700 disabled:opacity-50"
        >
          Discover Sources
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {discovered.length === 0 ? (
          <div className="text-xs text-gray-500 dark:text-gray-400 font-jetbrains-mono">
            No discovered items yet.
          </div>
        ) : (
          discovered.map((d) => {
            const key = String(d?.key || d?.source_key || d?.url || Math.random());
            const already = Boolean(d?.already_registered);
            const alreadyRoot = Boolean(d?.already_root);

            const discoveredUrl = String(d?.url || "");
            const sourceClass = String(d?.source_class || "authoritative");
            const isPdf = sourceClass.toLowerCase() === "pdf";

            const itemKey = String(d?.url || d?.source_key || d?.key || key);
            const itemEdits = editsByKey?.[itemKey] || {};

            const familyKeyCandidate = String(
              itemEdits.family_key ?? d?.family_key ?? "",
            ).trim();

            const familyKeySuggested = RULE_SOURCE_FAMILY_VALUES.has(familyKeyCandidate)
              ? familyKeyCandidate
              : inferFamilyKey({
                  url: discoveredUrl,
                  sourceName: d?.source_name,
                });

            const familyKey = String(familyKeySuggested || "").trim();
            const familyIsKnown = familyKey
              ? RULE_SOURCE_FAMILY_VALUES.has(familyKey)
              : true;

            const discoverMode = String(itemEdits.discover_mode ?? d?.discover_mode ?? "");
            const discoverModeValue = discoverMode || defaultDiscoverMode(sourceClass);

            const patternOptions = getPatternOptionsForSourceClass(sourceClass);
            const preferredPatternDefault = String(d?.pattern_hint || "");
            const preferredPattern = String(itemEdits.preferred_pattern ?? preferredPatternDefault);
            const preferredPatternValue = patternOptions.some((o) => o.value === preferredPattern)
              ? preferredPattern
              : "";

            const canRegisterRoot = Boolean(
              onRegisterRoot && !isPdf && !alreadyRoot && !disableNetwork,
            );
            const familyLabel = familyIsKnown ? labelForFamilyKey(familyKey) : null;

            return (
              <div
                key={key}
                className="rounded-lg border border-gray-100 dark:border-gray-900 bg-gray-50 dark:bg-[#111111] p-2"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-gray-900 dark:text-gray-100 font-jetbrains-mono">
                        {String(d?.source_name || "Discovered source")}
                      </div>
                      <div className="mt-0.5 text-[11px] text-gray-600 dark:text-gray-400 font-jetbrains-mono break-words">
                        {discoveredUrl ? (
                          <a
                            href={discoveredUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:text-blue-700 break-all"
                          >
                            {discoveredUrl}
                          </a>
                        ) : (
                          <span>(no url)</span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-600 dark:text-gray-400 font-jetbrains-mono">
                        <span>court_type: {String(d?.court_type || "(unset)")}</span>
                        <span>rule_set: {String(d?.rule_set || "(unset)")}</span>
                        <span>
                          hint:{" "}
                          {String(d?.pattern_hint || d?.adapter_hint || "(none)")}
                        </span>
                        <span>priority: {Number(d?.priority ?? 50)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {already ? (
                        <div className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white font-jetbrains-mono">
                          Registered ✅
                        </div>
                      ) : (
                        <button
                          onClick={() => onRegister(d)}
                          disabled={disableNetwork || isRegistering}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white font-jetbrains-mono hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Add to Registry
                        </button>
                      )}

                      {alreadyRoot ? (
                        <div className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white font-jetbrains-mono">
                          Root Registered ✅
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            onRegisterRoot?.({
                              ...d,
                              family_key: familyIsKnown ? familyKey : null,
                              family_label: familyLabel,
                              family_root: true,
                              discover_mode: String(discoverModeValue || ""),
                              preferred_pattern: String(preferredPatternValue || ""),
                            })
                          }
                          disabled={!canRegisterRoot || isRegisteringRoot}
                          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white font-jetbrains-mono hover:bg-blue-700 disabled:opacity-50"
                          title={
                            isPdf
                              ? "PDF sources are treated as leaf sources; root discovery should start from an HTML index."
                              : "Upserts the source URL as a Family Root in rule_sources (no duplicates)."
                          }
                        >
                          Register as Family Root
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-end gap-2">
                    <label className="text-[11px] text-gray-600 dark:text-gray-400 font-jetbrains-mono">
                      Family
                      <select
                        value={familyIsKnown ? familyKey : ""}
                        onChange={(e) => setEdits(itemKey, { family_key: e.target.value })}
                        disabled={disableNetwork || isRegisteringRoot}
                        className="mt-1 w-[160px] rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0B0B0B] px-2 py-1 text-xs text-gray-900 dark:text-gray-100 font-jetbrains-mono disabled:opacity-50"
                      >
                        <option value="">(none)</option>
                        {RULE_SOURCE_FAMILY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="text-[11px] text-gray-600 dark:text-gray-400 font-jetbrains-mono">
                      Discover
                      <select
                        value={String(discoverModeValue || "")}
                        onChange={(e) => setEdits(itemKey, { discover_mode: e.target.value })}
                        disabled={disableNetwork || isRegisteringRoot}
                        className="mt-1 w-[190px] rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0B0B0B] px-2 py-1 text-xs text-gray-900 dark:text-gray-100 font-jetbrains-mono disabled:opacity-50"
                      >
                        {DISCOVERY_STRATEGY_OPTIONS.map((opt) => {
                          const k = opt.value || "_none";
                          return (
                            <option key={k} value={opt.value}>
                              {opt.label}
                            </option>
                          );
                        })}
                      </select>
                    </label>

                    <label className="text-[11px] text-gray-600 dark:text-gray-400 font-jetbrains-mono">
                      Pattern
                      <select
                        value={preferredPatternValue}
                        onChange={(e) => setEdits(itemKey, { preferred_pattern: e.target.value })}
                        disabled={disableNetwork || isRegisteringRoot}
                        className="mt-1 w-[110px] rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0B0B0B] px-2 py-1 text-xs text-gray-900 dark:text-gray-100 font-jetbrains-mono disabled:opacity-50"
                      >
                        {patternOptions.map((opt) => {
                          const k = opt.value || "_auto";
                          return (
                            <option key={k} value={opt.value}>
                              {opt.label}
                            </option>
                          );
                        })}
                      </select>
                    </label>

                    {isPdf ? (
                      <div className="text-[11px] text-gray-500 dark:text-gray-500 font-jetbrains-mono">
                        PDF = leaf (cannot be root)
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
