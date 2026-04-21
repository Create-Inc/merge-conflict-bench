<<<<<<< ours
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/utils/api";

export function useCustomerRecurringPlan(customerId) {
  const queryClient = useQueryClient();

  const upsertMutation = useMutation({
    mutationFn: async ({ payload }) => {
      if (!customerId) {
        throw new Error("Missing customer id");
      }

      const res = await apiFetch(`/api/customers/${customerId}/recurring`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload || {}),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || `Recurring save failed (${res.status})`);
      }
      return json;
    },
    onSuccess: async () => {
      // Refresh the customer detail screen.
      await queryClient.invalidateQueries({
        queryKey: ["customer", customerId],
      });

      // Refresh schedule views too (recurring can create/cancel jobs).
      await queryClient.invalidateQueries({ queryKey: ["scheduleJobs"] });
    },
  });

  return { upsertMutation };
}
=======
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/utils/api";

export function useCustomerRecurringPlan(customerId) {
  const queryClient = useQueryClient();

  const upsertMutation = useMutation({
    mutationFn: async ({ mode, payload }) => {
      if (!customerId) {
        throw new Error("Missing customer id");
      }

      const method = mode === "create" ? "POST" : "PATCH";
      const res = await apiFetch(
        `/api/customers/${customerId}/recurring-plan`,
        {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload || {}),
        },
      );

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || `Recurring save failed (${res.status})`);
      }
      return json;
    },
    onSuccess: async () => {
      // Refresh the customer detail + schedule views.
      await queryClient.invalidateQueries({
        queryKey: ["customer", customerId],
      });
      await queryClient.invalidateQueries({ queryKey: ["scheduleJobs"] });
    },
  });

  return { upsertMutation };
}
>>>>>>> theirs
