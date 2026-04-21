import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { apiFetch } from "@/utils/api";

function safeString(v) {
  return typeof v === "string" ? v : "";
}

function toQueryString(params) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v == null) return;
    const s = String(v);
    if (!s) return;
    q.set(k, s);
  });
  const str = q.toString();
  return str ? `?${str}` : "";
}

function dedupeById(items) {
  const map = new Map();
  for (const it of items) {
    const key = it?.id != null ? String(it.id) : null;
    if (!key) continue;
    if (!map.has(key)) {
      map.set(key, it);
    }
  }
  return Array.from(map.values());
}

export default function useCustomersList({
  search,
  status,
  assignedToUserId,
  territoryId,
  dateField,
  dateFrom,
  dateTo,
  limit = 50,
} = {}) {
  const normalized = useMemo(() => {
    const territory = territoryId != null ? Number(territoryId) : null;
    const safeTerritoryId = Number.isFinite(territory)
      ? Math.trunc(territory)
      : null;

    const rawStatus = safeString(status).trim().toLowerCase();
    const safeStatus =
      rawStatus === "lead" || rawStatus === "active" || rawStatus === "completed"
        ? rawStatus
        : "";

    const safeDateField = dateField === "created" ? "created" : "activity";

    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 50));

    return {
      search: safeString(search).trim(),
      status: safeStatus,
      assignedToUserId: assignedToUserId ? String(assignedToUserId) : "",
      territoryId: safeTerritoryId != null ? String(safeTerritoryId) : "",
      dateField: safeDateField,
      dateFrom: dateFrom ? String(dateFrom) : "",
      dateTo: dateTo ? String(dateTo) : "",
      limit: safeLimit,
    };
  }, [
    assignedToUserId,
    dateField,
    dateFrom,
    dateTo,
    limit,
    search,
    status,
    territoryId,
  ]);

  const query = useInfiniteQuery({
    queryKey: ["customers", normalized],
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      const qs = toQueryString({
        limit: normalized.limit,
        cursor: pageParam || "",
        search: normalized.search || "",
        status: normalized.status || "",
        assignedToUserId: normalized.assignedToUserId || "",
        territoryId: normalized.territoryId || "",
        dateField: normalized.dateField,
        dateFrom: normalized.dateFrom || "",
        dateTo: normalized.dateTo || "",
      });

      const res = await apiFetch(
        `/api/customers${qs}`,
        { method: "GET" },
        { timeoutMs: 10_000, retry: 1 },
      );

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          json?.error ||
          json?.message ||
          `Could not load customers (${res.status})`;
        const err = new Error(String(msg));
        err.status = res.status;
        throw err;
      }

      const items = Array.isArray(json?.items)
        ? json.items
        : Array.isArray(json?.customers)
          ? json.customers
          : [];

      const nextCursor =
        typeof json?.nextCursor === "string" && json.nextCursor
          ? json.nextCursor
          : null;

      return { items, nextCursor };
    },
    getNextPageParam: (lastPage) => lastPage?.nextCursor || undefined,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: (failureCount, error) => {
      if (error?.status === 401) return false;
      return failureCount < 1;
    },
  });

  const items = useMemo(() => {
    const pages = Array.isArray(query.data?.pages) ? query.data.pages : [];
    const flat = pages.flatMap((p) => (Array.isArray(p?.items) ? p.items : []));
    return dedupeById(flat);
  }, [query.data?.pages]);

  return { query, items };
}
