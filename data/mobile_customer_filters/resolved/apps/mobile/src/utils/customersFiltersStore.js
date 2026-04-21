import { create } from "zustand";

const initialState = {
  search: "",
  status: "", // lead | active | completed | ''
  assignedToUserId: null,
  territoryId: null,
  dateField: "activity", // activity | created
  datePreset: "this_month",
  dateStart: null, // ISO string
  dateEnd: null, // ISO string
};

export const useCustomersFiltersStore = create((set, get) => ({
  ...initialState,

  setSearch: (v) => {
    const next = typeof v === "string" ? v : "";
    set({ search: next });
  },

  setStatus: (v) => {
    const raw = typeof v === "string" ? v.trim().toLowerCase() : "";
    const allowed = raw === "lead" || raw === "active" || raw === "completed";
    set({ status: allowed ? raw : "" });
  },

  setAssignedToUserId: (v) => {
    const next = typeof v === "string" && v.trim() ? v.trim() : null;
    set({ assignedToUserId: next });
  },

  setTerritoryId: (v) => {
    if (v == null || v === "") {
      set({ territoryId: null });
      return;
    }
    const n = Number(v);
    if (!Number.isFinite(n)) {
      set({ territoryId: null });
      return;
    }
    set({ territoryId: Math.trunc(n) });
  },

  setDateField: (v) => {
    const raw = typeof v === "string" ? v.trim().toLowerCase() : "";
    set({ dateField: raw === "created" ? "created" : "activity" });
  },

  setDateRange: ({ preset, start, end }) => {
    const nextPreset = typeof preset === "string" ? preset : "custom";
    const safeStart = start instanceof Date ? start : null;
    const safeEnd = end instanceof Date ? end : null;

    set({
      datePreset: nextPreset,
      dateStart: safeStart ? safeStart.toISOString() : null,
      dateEnd: safeEnd ? safeEnd.toISOString() : null,
    });
  },

  clearFilters: () => {
    const current = get();
    const keepSearch = typeof current.search === "string" ? current.search : "";
    set({
      ...initialState,
      search: keepSearch,
    });
  },
}));
