import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useEffect } from "react";
import { useAdminStatus } from "@/hooks/useAdminStatus";

async function safeReadJson(response, pathForError) {
  // Treat non-JSON responses as hard failures.
  // This prevents silently showing "No accounts found" when the backend returned HTML (signin page, proxy error, etc).
  const contentType = String(
    response?.headers?.get?.("content-type") || "",
  ).toLowerCase();

  const text = await response.text();
  const trimmed = String(text || "").trim();

  // Some environments can occasionally return a literal JSON `null` (or an empty body)
  // during the first request right after login. Treat it as a retryable failure.
  if (!trimmed || trimmed === "null") {
    throw new Error(
      `When fetching ${pathForError}, received an empty response body right after login. ` +
        `Status: ${response.status} ${response.statusText}. ` +
        `content-type: ${contentType || "unknown"}. ` +
        `Body preview: ${String(text).slice(0, 160)}`,
    );
  }

  if (!contentType.includes("application/json")) {
    throw new Error(
      `When fetching ${pathForError}, expected JSON but received ${contentType || "unknown content-type"}. ` +
        `Body preview: ${String(text).slice(0, 160)}`,
    );
  }

  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") {
      throw new Error(
        `Unexpected ${pathForError} payload (non-object JSON). Body preview: ${String(text).slice(0, 160)}`,
      );
    }
    return parsed;
  } catch (error) {
    throw new Error(
      `When fetching ${pathForError}, could not parse JSON. ` +
        `Status: ${response.status} ${response.statusText}. ` +
        `Error: ${error?.message || error}. ` +
        `Body preview: ${String(text).slice(0, 160)}`,
    );
  }
}

async function fetchJson(url, pathForError) {
  // Keep this fetch minimal.
  // We previously added custom headers and a retry loop here, but those extra headers
  // can cause weird intermediary/proxy behavior in some environments (200 + `null` body).
  const response = await fetch(url, {
    cache: "no-store",
    credentials: "include",
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `When fetching ${pathForError}, the response was [${response.status}] ${response.statusText}`,
    );
  }

  return safeReadJson(response, pathForError);
}

function shouldRetryDashboardFetch(failureCount, error) {
  const msg = String(error?.message || "");

  // Retry a bit longer right after sign-in.
  const retryableSignals = [
    "could not parse json",
    "non-object json",
    "expected json",
    "empty response body",
    "received an empty response body",
  ];

  const isRetryable = retryableSignals.some((signal) =>
    msg.toLowerCase().includes(signal),
  );

  if (isRetryable) {
    return failureCount < 6;
  }

  return failureCount < 2;
}

function dashboardRetryDelay(attemptIndex) {
  const attempt = Number(attemptIndex) + 1;
  const delay = 400 * attempt;
  return Math.min(2000, delay);
}

export function useDashboardData(user) {
  const queryClient = useQueryClient();
  const hasBootstrappedRef = useRef(false);

  const adminStatusQuery = useAdminStatus(Boolean(user));
  const isAdmin = adminStatusQuery.data?.isAdmin === true;

  const bootstrapMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/bootstrap", { method: "POST" });
      if (!response.ok) {
        throw new Error(
          `When POSTing /api/bootstrap, the response was [${response.status}] ${response.statusText}`,
        );
      }
      const data = await safeReadJson(response, "/api/bootstrap");
      return data;
    },
    onSuccess: () => {
<<<<<<< ours
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      // Keep these for other pages that still query them directly.
=======
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
>>>>>>> theirs
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
    onError: (error) => {
      console.error("Bootstrap error", error);
    },
  });

  const userKey = user?.id ? String(user.id) : "preview";

<<<<<<< ours
  const dashboardQuery = useQuery({
    queryKey: ["dashboard-data", userKey],
=======
  // NEW: single endpoint to fetch everything the dashboard needs.
  const dashboardQuery = useQuery({
    queryKey: ["dashboard-data", userKey],
>>>>>>> theirs
    enabled: true,
    staleTime: 0,
    refetchOnMount: true,
    retry: shouldRetryDashboardFetch,
    retryDelay: dashboardRetryDelay,
    queryFn: async () => {
      const data = await fetchJson(
        "/api/dashboard-data",
        "/api/dashboard-data",
      );

      const accounts = Array.isArray(data?.accounts) ? data.accounts : [];
      const transactions = Array.isArray(data?.transactions)
        ? data.transactions
        : [];
<<<<<<< ours
      const goals = Array.isArray(data?.goals) ? data.goals : [];

      if (!Array.isArray(data?.accounts)) {
        console.error("Unexpected /api/dashboard-data accounts payload", data);
      }
      if (!Array.isArray(data?.transactions)) {
        console.error(
          "Unexpected /api/dashboard-data transactions payload",
          data,
        );
      }
      if (!Array.isArray(data?.goals)) {
        console.error("Unexpected /api/dashboard-data goals payload", data);
=======
      const goals = Array.isArray(data?.goals) ? data.goals : [];

      if (!Array.isArray(data?.accounts)) {
        console.error(
          "Unexpected /api/dashboard-data payload (accounts)",
          data,
        );
>>>>>>> theirs
      }

<<<<<<< ours
      return {
        accounts,
        transactions,
        goals,
        preview: Boolean(data?.preview),
      };
=======
      return { accounts, transactions, goals };
>>>>>>> theirs
    },
  });

  useEffect(() => {
    if (!user) return;
    if (!isAdmin) return; // only admins get auto-seeded demo data
    if (hasBootstrappedRef.current) return;
    if (!dashboardQuery.isSuccess) return;

<<<<<<< ours
    const payload = dashboardQuery.data || null;
    if (payload?.preview) return;

    const accounts = payload?.accounts || [];
=======
    const accounts = dashboardQuery.data?.accounts || [];
>>>>>>> theirs
    if (accounts.length > 0) return;

    hasBootstrappedRef.current = true;
    bootstrapMutation.mutate();
  }, [
    user,
    isAdmin,
    dashboardQuery.isSuccess,
    dashboardQuery.data,
    bootstrapMutation,
  ]);

<<<<<<< ours
  const isLoading = bootstrapMutation.isPending || dashboardQuery.isLoading;
  const errorMessage = dashboardQuery.error?.message || null;
=======
  // IMPORTANT: Only block the dashboard on the *dashboard-data* call.
  const isLoading = bootstrapMutation.isPending || dashboardQuery.isLoading;
>>>>>>> theirs

<<<<<<< ours
  const accounts = dashboardQuery.data?.accounts || [];
  const transactions = dashboardQuery.data?.transactions || [];
  const goals = dashboardQuery.data?.goals || [];
=======
  const errorMessage = dashboardQuery.error?.message || null;
>>>>>>> theirs

<<<<<<< ours

=======
  const accounts = dashboardQuery.data?.accounts || [];
  const transactions = dashboardQuery.data?.transactions || [];
  const goals = dashboardQuery.data?.goals || [];

>>>>>>> theirs
  return {
    accounts,
    transactions,
    goals,
    isLoading,
    errorMessage,
  };
}
