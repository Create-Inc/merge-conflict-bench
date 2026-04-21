<<<<<<< ours
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/utils/sourcesPanelHelpers";

function safeText(v) {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

export function useRegisterFamilyRoot({ state, registryQuery }) {
  const queryClient = useQueryClient();

  const registerRootMutation = useMutation({
    mutationFn: async (payload) => {
      const url = safeText(payload?.url);
      if (!url) {
        throw new Error("Missing url");
      }

      const body = {
        state,
        url,
        source_key: safeText(payload?.source_key || payload?.key) || null,
        source_name: safeText(payload?.source_name) || null,
        authority_name:
          safeText(payload?.authority_name || payload?.authority) || null,
        court_type: safeText(payload?.court_type) || null,
        rule_set: safeText(payload?.rule_set) || null,
        source_class: safeText(payload?.source_class) || null,
        content_type_hint: safeText(payload?.content_type_hint) || null,
        is_authoritative:
          payload?.is_authoritative === undefined
            ? true
            : Boolean(payload?.is_authoritative),
        is_parser_eligible:
          payload?.is_parser_eligible === undefined
            ? true
            : Boolean(payload?.is_parser_eligible),
        family_key: safeText(payload?.family_key) || null,
        family_label: safeText(payload?.family_label) || null,
        family_root: true,
        discover_mode: safeText(payload?.discover_mode) || null,
        preferred_pattern:
          safeText(
            payload?.preferred_pattern ||
              payload?.pattern_hint ||
              payload?.parser_pattern_hint,
          ) || null,
        priority:
          payload?.priority === undefined || payload?.priority === null
            ? null
            : Number(payload?.priority),
      };

      const { res, data } = await fetchJson(
        "/api/admin/state-parser/register-root",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Register root failed");
      }

      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["state-parser-registry", state],
        exact: false,
      });

      await queryClient.invalidateQueries({
        queryKey: ["state-parser", state, "registry"],
        exact: false,
      });

      await registryQuery.refetch();
    },
    onError: (e) => {
      console.error(e);
    },
  });

  return registerRootMutation;
}
=======
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/utils/sourcesPanelHelpers";

const KNOWN_DISCOVER_MODES = new Set([
  "",
  "html_index",
  "html_directory",
  "pdf_directory",
]);

function safeText(v) {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

function normalizeDiscoverMode(v) {
  const s = String(v ?? "").trim();
  if (KNOWN_DISCOVER_MODES.has(s)) return s;
  return "";
}

export function useRegisterFamilyRoot({ state, registryQuery }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const body = {
        state,
        url: safeText(payload?.url),
        source_key: safeText(payload?.source_key || payload?.key),
        source_name: safeText(payload?.source_name) || safeText(payload?.title),
        authority_name: safeText(payload?.authority_name),
        court_type: safeText(payload?.court_type),
        rule_set: safeText(payload?.rule_set),
        source_class: safeText(payload?.source_class) || "authoritative",

        is_authoritative: payload?.is_authoritative ?? true,
        is_parser_eligible: payload?.is_parser_eligible ?? true,

        family_key: safeText(payload?.family_key),
        family_label: safeText(payload?.family_label),
        family_root: true,
        discover_mode: normalizeDiscoverMode(payload?.discover_mode),

        preferred_pattern: safeText(payload?.preferred_pattern),

        priority:
          payload?.priority !== null && payload?.priority !== undefined
            ? Number(payload.priority)
            : null,
      };

      const { res, data } = await fetchJson(
        "/api/admin/state-parser/register-root",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Register root failed");
      }

      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["state-parser-registry", state],
        exact: false,
      });
      await registryQuery?.refetch?.();
    },
    onError: (e) => {
      console.error(e);
    },
  });
}
>>>>>>> theirs
