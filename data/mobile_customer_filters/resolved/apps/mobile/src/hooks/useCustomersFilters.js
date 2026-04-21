import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/utils/api";

export function useCustomersFilters(canViewTeam) {
  const territoriesQuery = useQuery({
    queryKey: ["territoriesForCustomers"],
    queryFn: async () => {
      const res = await apiFetch("/api/territories", { method: "GET" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          json?.error || `Could not load territories (${res.status})`,
        );
      }
      const territories = Array.isArray(json?.territories)
        ? json.territories
        : [];
      return territories.map((t) => ({
        key: String(t?.id),
        label: String(t?.name || "Territory"),
        subtitle: t?.territory_type ? String(t.territory_type) : "",
      }));
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
  });

  const membersQuery = useQuery({
    queryKey: ["teamMembersForCustomerFilter"],
    enabled: Boolean(canViewTeam),
    queryFn: async () => {
      const res = await apiFetch("/api/team/members", { method: "GET" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || `Could not load team (${res.status})`);
      }
      const members = Array.isArray(json?.members) ? json.members : [];
      return members
        .filter((m) => m?.active)
        .map((m) => ({
          key: String(m?.user_id || ""),
          label: String(m?.name || m?.email || m?.user_id || "Member"),
          subtitle: m?.role ? String(m.role) : "",
        }));
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
  });

  return {
    territoriesQuery,
    membersQuery,
  };
}

export function useTerritoryLabel(territoryId, territoriesData) {
  return useMemo(() => {
    if (!territoryId) return "All territories";
    const rows = Array.isArray(territoriesData) ? territoriesData : [];
    const found = rows.find((t) => String(t?.key) === String(territoryId));
    return found?.label ? String(found.label) : "Territory";
  }, [territoriesData, territoryId]);
}

export function useAssigneeLabel(assignedToUserId, canViewTeam, membersData) {
  return useMemo(() => {
    if (!assignedToUserId) {
      return canViewTeam ? "All assignees" : "My customers";
    }
    const rows = Array.isArray(membersData) ? membersData : [];
    const found = rows.find((m) => String(m?.key) === String(assignedToUserId));
    return found?.label ? String(found.label) : "Assignee";
  }, [assignedToUserId, canViewTeam, membersData]);
}
