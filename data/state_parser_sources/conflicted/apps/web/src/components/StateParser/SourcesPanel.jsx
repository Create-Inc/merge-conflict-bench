"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSourcesRegistry } from "@/hooks/useSourcesRegistry";
import { useSourceRegistration } from "@/hooks/useSourceRegistration";
import { useRegisterFamilyRoot } from "@/hooks/useRegisterFamilyRoot";
import { safeArray, normalizeSourceKey } from "@/utils/sourcesPanelHelpers";
import { RegistrySourcesList } from "./SourcesPanel/RegistrySourcesList";
import { DiscoverySection } from "./SourcesPanel/DiscoverySection";

function sortSources(list, sortKey) {
  const sources = safeArray(list);
  const key = String(sortKey || "priority");

  const getText = (v) => String(v || "").toLowerCase();

  const sorted = [...sources];
  sorted.sort((a, b) => {
    if (key === "authority") {
      return getText(a?.authority_name).localeCompare(
        getText(b?.authority_name),
      );
    }
    if (key === "court_type") {
      return getText(a?.court_type).localeCompare(getText(b?.court_type));
    }
    if (key === "rule_set") {
      return getText(a?.rule_set).localeCompare(getText(b?.rule_set));
    }
    // default: priority
    return Number(a?.priority ?? 100) - Number(b?.priority ?? 100);
  });

  return sorted;
}

export default function SourcesPanel({
  stateCode,
  disableNetwork,
  isAdmin,
  parser,
}) {
  const state = useMemo(
    () =>
      String(stateCode || "")
        .trim()
        .toUpperCase(),
    [stateCode],
  );

  // Registry paging + search (cursor-based)
  const [registrySearch, setRegistrySearch] = useState("");
  const [registryCursor, setRegistryCursor] = useState(null);
  const [registryCursorHistory, setRegistryCursorHistory] = useState([]);
  const [sortBy, setSortBy] = useState("priority");

  // NEW: when switching states (Next can reuse the same page instance), reset local UI state
  // so NJ discoveries/search/cursors never appear on CA (and vice-versa).
  useEffect(() => {
    setRegistrySearch("");
    setRegistryCursor(null);
    setRegistryCursorHistory([]);
    setSortBy("priority");
  }, [state]);

  const registryQuery = useSourcesRegistry({
    state,
    disableNetwork,
    isAdmin,
    search: registrySearch,
    cursor: registryCursor,
    limit: 200,
  });

  const registrySourcesRaw = useMemo(() => {
    const list = registryQuery.data?.sources;
    return safeArray(list);
  }, [registryQuery.data]);

  const registrySources = useMemo(
    () => sortSources(registrySourcesRaw, sortBy),
    [registrySourcesRaw, sortBy],
  );

  const nextRegistryCursor = registryQuery.data?.next_cursor || null;
  const canNextRegistryPage = Boolean(nextRegistryCursor);
  const canPrevRegistryPage = registryCursorHistory.length > 0;

  const registryPrevDisabled =
    disableNetwork || registryQuery.isFetching || !canPrevRegistryPage;
  const registryNextDisabled =
    disableNetwork || registryQuery.isFetching || !canNextRegistryPage;

  const registrySuffix = useMemo(() => {
    const parts = [];
    if (registryCursor) parts.push("paged");
    if (canNextRegistryPage) parts.push("more available");
    return parts.length ? ` • ${parts.join(" • ")}` : "";
  }, [canNextRegistryPage, registryCursor]);

  const refreshRegistry = useCallback(async () => {
    setRegistryCursor(null);
    setRegistryCursorHistory([]);
    await registryQuery.refetch();
  }, [registryQuery]);

  const goRegistryPage1 = useCallback(() => {
    setRegistryCursor(null);
    setRegistryCursorHistory([]);
  }, []);

  const goNextRegistryPage = useCallback(() => {
    if (!nextRegistryCursor) return;

    setRegistryCursorHistory((h) => {
      const list = safeArray(h);
      const next = registryCursor ? [...list, registryCursor] : list;
      return next.slice(-25);
    });

    setRegistryCursor(nextRegistryCursor);
  }, [nextRegistryCursor, registryCursor]);

  const goPrevRegistryPage = useCallback(() => {
    setRegistryCursorHistory((h) => {
      const list = safeArray(h);
      const prev = list[list.length - 1] || null;
      const next = list.slice(0, -1);
      setRegistryCursor(prev);
      return next;
    });
  }, []);

  // Active source is a SINGLE selection, stored in the main parser hook.
  const activeSourceKey = normalizeSourceKey(parser?.sourceKey);
  const activeSource = useMemo(() => {
    return registrySourcesRaw.find(
      (s) => normalizeSourceKey(s?.source_key) === activeSourceKey,
    );
  }, [registrySourcesRaw, activeSourceKey]);

  const setActiveSource = useCallback(
    (key) => {
      const k = normalizeSourceKey(key);
      if (!k) return;
      parser.setSourceKeyDraft(k);
      parser.setSourceKey(k);
      parser.resetPreviewCursor();
    },
    [parser],
  );

  // Discovery results live in the shared parser hook (so we don't need a separate hook outside useStateParser/*)
  const discoveredRaw = useMemo(() => {
    const d = parser?.lastDiscoverResult;
    return safeArray(d?.items || d?.discovered_children);
  }, [parser?.lastDiscoverResult]);

  const [registeredNeedles, setRegisteredNeedles] = useState([]);
<<<<<<< ours
  const [rootRegisteredNeedles, setRootRegisteredNeedles] = useState([]);
=======
  const [rootNeedles, setRootNeedles] = useState([]);
>>>>>>> theirs

  // reset when state changes
  useEffect(() => {
    setRegisteredNeedles([]);
<<<<<<< ours
    setRootRegisteredNeedles([]);
=======
    setRootNeedles([]);
>>>>>>> theirs
  }, [state]);

  const discovered = useMemo(() => {
    const needles = new Set(safeArray(registeredNeedles));
<<<<<<< ours
    const rootNeedles = new Set(safeArray(rootRegisteredNeedles));
=======
    const rootSet = new Set(safeArray(rootNeedles));
    if (!needles.size && !rootSet.size) return discoveredRaw;
>>>>>>> theirs

    if (!needles.size && !rootNeedles.size) return discoveredRaw;

    return discoveredRaw.map((d) => {
      const url = String(d?.url || "").trim();
      const key = String(d?.source_key || d?.key || "").trim();
<<<<<<< ours

      const isRegistered = Boolean(
        (url && needles.has(url)) || (key && needles.has(key)),
      );

      const isRootRegistered = Boolean(
        (url && rootNeedles.has(url)) || (key && rootNeedles.has(key)),
      );

      if (isRegistered || isRootRegistered) {
        return {
          ...d,
          already_registered: true,
          already_root: isRootRegistered ? true : Boolean(d?.already_root),
        };
=======
      const isRoot =
        Boolean(d?.already_root) || rootSet.has(url) || rootSet.has(key);
      const isRegistered =
        isRoot ||
        Boolean(d?.already_registered) ||
        needles.has(url) ||
        needles.has(key);
      if (isRegistered || isRoot) {
        return {
          ...d,
          already_registered: isRegistered,
          already_root: isRoot,
        };
>>>>>>> theirs
      }

      return d;
    });
<<<<<<< ours
  }, [discoveredRaw, registeredNeedles, rootRegisteredNeedles]);
=======
  }, [discoveredRaw, registeredNeedles, rootNeedles]);
>>>>>>> theirs

  const registerMutation = useSourceRegistration({ state, registryQuery });
  const registerRootMutation = useRegisterFamilyRoot({ state, registryQuery });

  // When registry list first loads and parser has an unknown sourceKey, select the first.
  useEffect(() => {
    if (!registrySourcesRaw.length) return;
    if (activeSourceKey) {
      const exists = registrySourcesRaw.some(
        (s) => normalizeSourceKey(s?.source_key) === activeSourceKey,
      );
      if (exists) return;
    }

    const first = normalizeSourceKey(registrySourcesRaw[0]?.source_key);
    if (first) {
      setActiveSource(first);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrySourcesRaw.length]);

  const handleDiscover = useCallback(() => {
    parser?.discoverMutation?.mutate({
      root_source_id: activeSource?.id ?? null,
    });
  }, [parser?.discoverMutation, activeSource?.id]);

  const handleRegister = useCallback(
    async (item) => {
      try {
        await registerMutation.mutateAsync(item);
        const needle = item?.url || item?.source_key || item?.key;
        if (needle) {
          setRegisteredNeedles((prev) => {
            const next = safeArray(prev);
            next.push(String(needle));
            return next.slice(-50);
          });
        }
      } catch {
        // handled by mutation
      }
    },
    [registerMutation],
  );

<<<<<<< ours
  const handleRegisterRoot = useCallback(
    async (payload) => {
      try {
        await registerRootMutation.mutateAsync(payload);
        const needle = payload?.url || payload?.source_key || payload?.key;
        if (needle) {
          setRootRegisteredNeedles((prev) => {
            const next = safeArray(prev);
            next.push(String(needle));
            return next.slice(-50);
          });
        }
      } catch {
        // handled by mutation
      }
    },
    [registerRootMutation],
  );

=======
  const handleRegisterRoot = useCallback(
    async (item) => {
      try {
        await registerRootMutation.mutateAsync(item);
        const needle = item?.url || item?.source_key || item?.key;
        if (needle) {
          setRootNeedles((prev) => {
            const next = safeArray(prev);
            next.push(String(needle));
            return next.slice(-50);
          });
        }
      } catch {
        // handled by mutation
      }
    },
    [registerRootMutation],
  );

>>>>>>> theirs
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0B0B0B] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-gray-900 dark:text-gray-100 font-jetbrains-mono">
            Sources
          </div>
          <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 font-jetbrains-mono">
            Panel A: Registry (pick one Active Source) • Panel B: Discover
            (crawl Active Source)
          </div>
        </div>
        <button
          onClick={refreshRegistry}
          disabled={registryQuery.isFetching || disableNetwork}
          className="rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2 text-xs font-bold text-gray-900 dark:text-gray-100 font-jetbrains-mono hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {registryQuery.isError ? (
        <div className="mt-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-3 text-xs text-red-900 dark:text-red-100 font-jetbrains-mono">
          {String(registryQuery.error?.message || "Failed to load sources")}
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-4">
        {/* Panel A — Registry */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs font-bold text-gray-900 dark:text-gray-100 font-jetbrains-mono">
                Panel A — Registry sources (eligible)
              </div>
              <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 font-jetbrains-mono">
                Showing {registrySources.length} source(s){registrySuffix}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-end">
              <label className="text-[11px] text-gray-600 dark:text-gray-400 font-jetbrains-mono">
                Sort
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="mt-1 w-full sm:w-[180px] rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0B0B0B] px-2 py-2 text-xs text-gray-900 dark:text-gray-100 font-jetbrains-mono"
                >
                  <option value="priority">priority</option>
                  <option value="authority">authority</option>
                  <option value="court_type">court_type</option>
                  <option value="rule_set">rule_set</option>
                </select>
              </label>

              <label className="text-[11px] text-gray-600 dark:text-gray-400 font-jetbrains-mono">
                Search
                <input
                  value={registrySearch}
                  onChange={(e) => {
                    setRegistrySearch(e.target.value);
                    setRegistryCursor(null);
                    setRegistryCursorHistory([]);
                  }}
                  placeholder="source_name / url / rule_set / court_type / authority"
                  className="mt-1 w-full sm:w-[320px] rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0B0B0B] px-2 py-2 text-xs text-gray-900 dark:text-gray-100 font-jetbrains-mono"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={goRegistryPage1}
                  disabled={disableNetwork || registryQuery.isFetching}
                  className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0B0B0B] px-3 py-2 text-xs font-bold text-gray-900 dark:text-gray-100 font-jetbrains-mono hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50"
                >
                  Page 1
                </button>
                <button
                  onClick={goPrevRegistryPage}
                  disabled={registryPrevDisabled}
                  className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0B0B0B] px-3 py-2 text-xs font-bold text-gray-900 dark:text-gray-100 font-jetbrains-mono hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  onClick={goNextRegistryPage}
                  disabled={registryNextDisabled}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white font-jetbrains-mono hover:bg-blue-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <RegistrySourcesList
              sources={registrySources}
              activeSourceKey={activeSourceKey}
              onSetActiveSource={setActiveSource}
            />
          </div>
        </div>

        {/* Panel B — Discover */}
        <DiscoverySection
          activeSource={activeSource}
          onDiscover={handleDiscover}
          isDiscovering={parser?.discoverMutation?.isPending}
          discovered={safeArray(discovered)}
          onRegister={handleRegister}
          isRegistering={registerMutation.isPending}
          onRegisterRoot={handleRegisterRoot}
          isRegisteringRoot={registerRootMutation.isPending}
          disableNetwork={disableNetwork}
        />
      </div>
    </div>
  );
}
