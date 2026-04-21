import { useMemo, useState, useCallback, useEffect } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { ResourceTableRow } from "./ResourceTableRow";
import { useUser } from "@/utils/useUser";
import { useClub } from "@/hooks/useClub";

const NATURAL_COLLATOR = (() => {
  try {
    return new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
  } catch {
    return null;
  }
})();

function naturalCompare(a, b) {
  const aS = String(a || "");
  const bS = String(b || "");
  if (NATURAL_COLLATOR) {
    return NATURAL_COLLATOR.compare(aS, bS);
  }
  return aS.localeCompare(bS);
}

function SortIndicator({ active, dir }) {
  if (!active) {
    return <ArrowUpDown className="w-4 h-4" />;
  }
  return dir === "desc" ? (
    <ArrowDown className="w-4 h-4" />
  ) : (
    <ArrowUp className="w-4 h-4" />
  );
}

function parseNumberOrNull(value) {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  if (Number.isFinite(n)) return n;
  const m = String(value).match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const parsed = Number(m[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatFeet(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
  const one = n.toFixed(1);
  return one.endsWith(".0") ? one.slice(0, -2) : one;
}

function getMobileStatusLabel(resource, subleaseLabel) {
  const assignmentType = String(resource?.assignment_type || "").toLowerCase();
  if (assignmentType === "sublease") return subleaseLabel;
  if (assignmentType === "temporary") return "Temporary";
  const status = String(resource?.status || "").toLowerCase();
  if (status === "available") return "Available";
  if (status === "occupied") return "Occupied";
  if (status === "unavailable") return "Unavailable";
  return resource?.status || "Unknown";
}

function getMobileStatusClasses(label, subleaseLabel) {
  const v = String(label || "").toLowerCase();
  const subleaseLower = String(subleaseLabel || "").toLowerCase();

  if (v === "available") {
    return "bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400";
  }
  if (v === "occupied") {
    return "bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400";
  }
  if (v === "unavailable") {
    return "bg-gray-100 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400";
  }
  if (subleaseLower && v === subleaseLower) {
    return "bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
  }
  if (v === "temporary") {
    return "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400";
  }
  return "bg-gray-100 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400";
}

export function ResourceTable({
  resources,
  onEdit,
  onAssign,
  onViewDetails,
  onSublease,
  onTemporaryAssign,
  category,
  resourceTerm,
}) {
  const { user } = useUser();
  const { club } = useClub();

  const canManageResourceActions = user?.roles?.some(
    (role) =>
      role?.name === "Site Admin" ||
      role?.name === "Resource Admin" ||
      (role?.is_system_role === true &&
        (role?.name === "ClubSoft Full Admin" ||
          role?.name === "ClubSoft Owner")),
  );

  const noun = resourceTerm || "Resource";
  const isMoorage =
    category?.name?.toLowerCase?.().includes("moorage") ||
    category?.name?.toLowerCase?.().includes("slip") ||
    category?.name?.toLowerCase?.().includes("dock") ||
    category?.name?.toLowerCase?.().includes("boat") ||
    category?.name?.toLowerCase?.().includes("vessel") ||
    category?.name?.toLowerCase?.().includes("sailboat");

  const [sortBy, setSortBy] = useState("spot"); // spot | size | user
  const [sortDir, setSortDir] = useState("asc"); // asc | desc

  const toggleSort = useCallback(
    (key) => {
      setSortBy((prev) => {
        if (prev !== key) {
          setSortDir("asc");
          return key;
        }
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      });
    },
    [setSortBy, setSortDir],
  );

  const getOwnerName = (r) => {
    const type = String(r?.assignment_type || "").toLowerCase();
    if ((type === "sublease" || type === "temporary") && r?.original_owner_name) {
      return r.original_owner_name;
    }
    return r?.assigned_member_name || null;
  };

  const sortedResources = useMemo(() => {
    const dir = sortDir === "desc" ? -1 : 1;
    const copy = Array.isArray(resources) ? [...resources] : [];

    copy.sort((a, b) => {
      if (sortBy === "size") {
        const aN = parseNumberOrNull(a?.length);
        const bN = parseNumberOrNull(b?.length);

        const aMissing = aN === null;
        const bMissing = bN === null;
        if (aMissing !== bMissing) return aMissing ? 1 : -1;

        if (aN !== null && bN !== null && aN !== bN) {
          return (aN - bN) * dir;
        }
      }

      if (sortBy === "user") {
        const aU = getOwnerName(a);
        const bU = getOwnerName(b);

        const aMissing = !aU;
        const bMissing = !bU;
        if (aMissing !== bMissing) return aMissing ? 1 : -1;

        const cmp = naturalCompare(aU, bU);
        if (cmp !== 0) return cmp * dir;
      }

      return naturalCompare(a?.name || "", b?.name || "") * dir;
    });

    return copy;
  }, [resources, sortBy, sortDir]);

  const subleaseLabel = club?.sublease_verbiage || "Sublease";
  const spotHeaderLabel = isMoorage ? `${noun} Number` : "Resource";
  const specialAssignmentHeaderLabel = `${subleaseLabel} / Temporary`;

  const desktopTableMinWidth = isMoorage ? "min-w-[1250px]" : "min-w-[900px]";

  const mobileSortLabel = useMemo(() => {
    if (sortBy === "size") return `${noun} Size`;
    if (sortBy === "user") return "User";
    return spotHeaderLabel;
  }, [sortBy, noun, spotHeaderLabel]);

  const mobileDirLabel = useMemo(() => {
    if (sortBy === "size") {
      return sortDir === "asc" ? "Small → Large" : "Large → Small";
    }
    return sortDir === "asc" ? "A → Z" : "Z → A";
  }, [sortBy, sortDir]);

  const [forceMobileLayout, setForceMobileLayout] = useState(false);

  useEffect(() => {
    try {
      const compute = () => {
        const effectiveWidth = Math.min(
          window.innerWidth || 0,
          window.screen?.width || window.innerWidth || 0,
        );
        const isCoarse =
          typeof window.matchMedia === "function" &&
          window.matchMedia("(pointer: coarse)").matches;

        const shouldForce = isCoarse && effectiveWidth > 0 && effectiveWidth < 768;
        setForceMobileLayout(shouldForce);
      };

      compute();
      window.addEventListener("resize", compute);
      return () => window.removeEventListener("resize", compute);
    } catch (e) {
      console.error(e);
      return undefined;
    }
  }, []);

  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-2xl overflow-visible shadow-sm relative">
      {/* Mobile card list */}
      <div className={forceMobileLayout ? "block" : "md:hidden"}>
        <div className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#2a2a2a]">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Sorted by: {mobileSortLabel}
            </div>
            <button
              type="button"
              onClick={() => toggleSort(sortBy)}
              className="text-sm font-semibold text-blue-600 dark:text-blue-400"
            >
              {mobileDirLabel}
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => toggleSort("spot")}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                sortBy === "spot"
                  ? "bg-white dark:bg-[#151515] text-gray-900 dark:text-white border-gray-200 dark:border-[#2a2a2a]"
                  : "bg-transparent text-gray-700 dark:text-gray-300 border-transparent"
              }`}
            >
              {isMoorage ? noun : "Resource"}
            </button>
            {isMoorage ? (
              <button
                type="button"
                onClick={() => toggleSort("size")}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                  sortBy === "size"
                    ? "bg-white dark:bg-[#151515] text-gray-900 dark:text-white border-gray-200 dark:border-[#2a2a2a]"
                    : "bg-transparent text-gray-700 dark:text-gray-300 border-transparent"
                }`}
              >
                Size
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => toggleSort("user")}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                sortBy === "user"
                  ? "bg-white dark:bg-[#151515] text-gray-900 dark:text-white border-gray-200 dark:border-[#2a2a2a]"
                  : "bg-transparent text-gray-700 dark:text-gray-300 border-transparent"
              }`}
            >
              User
            </button>
          </div>
        </div>

        {sortedResources.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
            No resources in this category yet
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-[#2a2a2a]">
            {sortedResources.map((resource) => {
              const ownerName = getOwnerName(resource) || "Unassigned";
              const statusLabel = getMobileStatusLabel(resource, subleaseLabel);
              const statusClasses = getMobileStatusClasses(
                statusLabel,
                subleaseLabel,
              );

              const sizeLabel = isMoorage
                ? (() => {
                    const feet = formatFeet(resource?.length);
                    return feet ? `${feet}ft` : "—";
                  })()
                : null;

              const slipNumber = resource?.name || "";
              const displayName = resource?.resource_name || null;
              const notes = resource?.description || null;

              const showDetailsButton = Boolean(onViewDetails);

              const type = String(resource?.assignment_type || "normal").toLowerCase();
              const ownerMemberId =
                (type === "sublease" || type === "temporary") &&
                resource?.original_owner_member_id
                  ? resource.original_owner_member_id
                  : resource?.assigned_to_member_id;

              const ownerProfileHref = ownerMemberId
                ? `/members/${ownerMemberId}`
                : null;

              const ownerNameNode = ownerProfileHref ? (
                <a
                  href={ownerProfileHref}
                  className="font-medium text-gray-900 dark:text-white hover:underline"
                  title="View member profile"
                >
                  {ownerName}
                </a>
              ) : (
                <span className="font-medium text-gray-900 dark:text-white">
                  {ownerName}
                </span>
              );

              return (
                <div key={resource.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    {showDetailsButton ? (
                      <button
                        type="button"
                        onClick={() => onViewDetails?.(resource)}
                        className="text-left min-w-0"
                      >
                        <div className="font-semibold text-gray-900 dark:text-white leading-tight break-words">
                          {slipNumber}
                        </div>
                        {displayName ? (
                          <div className="text-sm text-gray-700 dark:text-gray-300 mt-0.5 break-words">
                            {displayName}
                          </div>
                        ) : null}
                        {notes ? (
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 break-words">
                            {notes}
                          </div>
                        ) : null}
                      </button>
                    ) : (
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 dark:text-white leading-tight break-words">
                          {slipNumber}
                        </div>
                        {displayName ? (
                          <div className="text-sm text-gray-700 dark:text-gray-300 mt-0.5 break-words">
                            {displayName}
                          </div>
                        ) : null}
                        {notes ? (
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 break-words">
                            {notes}
                          </div>
                        ) : null}
                      </div>
                    )}

                    <span
                      className={`shrink-0 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusClasses}`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex flex-col gap-1">
                      <div className="break-words">
                        <span className="text-gray-500 dark:text-gray-400">
                          User:
                        </span>{" "}
                        {ownerNameNode}
                      </div>
                      {isMoorage ? (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            {noun} Size:
                          </span>{" "}
                          <span className="font-medium">{sizeLabel}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {canManageResourceActions ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit?.(resource)}
                        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2a2a2a] text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onAssign?.(resource)}
                        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2a2a2a] text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Assign
                      </button>
                      {isMoorage ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onSublease?.(resource)}
                            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2a2a2a] text-sm font-semibold text-gray-900 dark:text-white"
                          >
                            {subleaseLabel}
                          </button>
                          <button
                            type="button"
                            onClick={() => onTemporaryAssign?.(resource)}
                            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2a2a2a] text-sm font-semibold text-gray-900 dark:text-white"
                          >
                            Temporary
                          </button>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className={forceMobileLayout ? "hidden" : "hidden md:block"}>
        <div
          className="overflow-x-auto overflow-y-visible"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <table className={`w-full ${desktopTableMinWidth}`}>
            <thead className="bg-gray-50 dark:bg-[#2a2a2a] border-b border-gray-200 dark:border-[#3a3a3a]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <button
                    type="button"
                    onClick={() => toggleSort("spot")}
                    className="inline-flex items-center gap-2 hover:underline"
                    title={`Sort by ${spotHeaderLabel}`}
                  >
                    {spotHeaderLabel}
                    <SortIndicator active={sortBy === "spot"} dir={sortDir} />
                  </button>
                </th>

                {isMoorage ? (
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Resource Name
                  </th>
                ) : null}

                {isMoorage ? (
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <button
                      type="button"
                      onClick={() => toggleSort("size")}
                      className="inline-flex items-center gap-2 hover:underline"
                      title={`Sort by ${noun} size`}
                    >
                      {noun} Size
                      <SortIndicator active={sortBy === "size"} dir={sortDir} />
                    </button>
                  </th>
                ) : null}

                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Status
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <button
                    type="button"
                    onClick={() => toggleSort("user")}
                    className="inline-flex items-center gap-2 hover:underline"
                    title="Sort by user"
                  >
                    User
                    <SortIndicator active={sortBy === "user"} dir={sortDir} />
                  </button>
                </th>

                {isMoorage ? (
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {specialAssignmentHeaderLabel}
                  </th>
                ) : null}

                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#2a2a2a]">
              {sortedResources.length === 0 ? (
                <tr>
                  <td
                    colSpan={isMoorage ? 7 : 4}
                    className="px-6 py-12 text-center"
                  >
                    <div className="text-gray-500 dark:text-gray-400">
                      No resources in this category yet
                    </div>
                  </td>
                </tr>
              ) : (
                sortedResources.map((resource) => (
                  <ResourceTableRow
                    key={resource.id}
                    resource={resource}
                    onEdit={onEdit}
                    onAssign={onAssign}
                    onViewDetails={onViewDetails}
                    onSublease={onSublease}
                    onTemporaryAssign={onTemporaryAssign}
                    isAdmin={canManageResourceActions}
                    isMoorage={isMoorage}
                    resourceTerm={noun}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
