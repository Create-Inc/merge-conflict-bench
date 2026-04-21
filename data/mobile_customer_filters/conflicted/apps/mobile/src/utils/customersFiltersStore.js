<<<<<<< ours
import { create } from "zustand";

const initialState = {
  search: "",
  status: "", // lead | active | completed | ''
  assignedToUserId: null,
  territoryId: null,
  dateField: "activity", // activity | created
  datePreset: "this_month",
  dateStart: null,
  dateEnd: null,
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
=======
import { create } from "zustand";

const initialState = {
  search: "",
  status: null, // lead | active | completed
  assignedToUserId: null,
  territoryId: null,
  dateField: "activity", // activity | created
  datePreset: null,
  dateStart: null, // ISO string
  dateEnd: null, // ISO string
};

function anyFilterActive(state) {
  return Boolean(
    (state.search && state.search.trim()) ||
      state.status ||
      state.assignedToUserId ||
      state.territoryId ||
      (state.dateStart && state.dateEnd),
  );
}

export const useCustomersFiltersStore = create((set, get) => ({
  ...initialState,
  get hasActiveFilters() {
    return anyFilterActive(get());
  },
  setSearch: (search) =>
    set({ search: typeof search === "string" ? search : "" }),
  setStatus: (status) =>
    set({
      status:
        status === "lead" || status === "active" || status === "completed"
          ? status
          : null,
    }),
  setTerritoryId: (territoryId) => {
    if (territoryId == null || territoryId === "") {
      set({ territoryId: null });
      return;
    }
    const n = Number(territoryId);
    set({ territoryId: Number.isFinite(n) ? Math.trunc(n) : null });
  },
  setAssignedToUserId: (userId) =>
    set({
      assignedToUserId:
        userId == null || userId === "" ? null : String(userId).trim(),
    }),
  setDateField: (dateField) =>
    set({
      dateField: dateField === "created" ? "created" : "activity",
    }),
  setDateRange: ({ preset, start, end }) => {
    const startIso = start instanceof Date ? start.toISOString() : null;
    const endIso = end instanceof Date ? end.toISOString() : null;
    set({ datePreset: preset || null, dateStart: startIso, dateEnd: endIso });
  },
  clearFilters: () => set({ ...initialState }),
}));
>>>>>>> theirs
