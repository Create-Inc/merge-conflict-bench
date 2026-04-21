import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApiAuthHeaders } from "@/hooks/useApiAuthHeaders";

async function safeReadJson(response, pathForError) {
  const contentType = String(
    response?.headers?.get?.("content-type") || "",
  ).toLowerCase();

  const text = await response.text();
  const trimmed = String(text || "").trim();

  // Treat empty / literal-null responses right after login as retryable failures.
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

async function fetchJson(url, pathForError, headers) {
  // Keep fetch minimal to avoid proxy/webview oddities.
  const response = await fetch(url, {
    headers: {
      ...(headers || {}),
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

export function useDashboardData() {
  const authHeaders = useApiAuthHeaders();

  const authKey = String(authHeaders?.Authorization || "");
  const cookieKey = String(authHeaders?.Cookie || "");

  // Single endpoint: everything the dashboard needs.
  const dashboardQuery = useQuery({
    queryKey: ["dashboard-data", authKey, cookieKey],
    retry: shouldRetryDashboardFetch,
    retryDelay: dashboardRetryDelay,
    queryFn: async () => {
      const json = await fetchJson(
        "/api/dashboard-data",
        "/api/dashboard-data",
        authHeaders,
      );

      const accounts = Array.isArray(json?.accounts) ? json.accounts : [];
      const transactions = Array.isArray(json?.transactions)
        ? json.transactions
        : [];
      const goals = Array.isArray(json?.goals) ? json.goals : [];

      return {
        accounts,
        transactions,
        goals,
        preview: Boolean(json?.preview),
      };
    },
  });

  const accounts = useMemo(() => {
    const list = dashboardQuery.data?.accounts;
    return Array.isArray(list) ? list : [];
  }, [dashboardQuery.data]);

  const accountOptions = useMemo(() => {
    return accounts
      .filter((a) => a?.id !== undefined && a?.id !== null)
      .map((a) => {
        const accountType = String(a?.account_type || "Account");
        const rawNum = String(a?.account_number || "");
        const digits = rawNum.replace(/\D/g, "");
        const last4 = digits ? digits.slice(-4) : rawNum.slice(-4);
        const label = last4 ? `${accountType} ••••${last4}` : accountType;
        return { value: String(a.id), label };
      });
  }, [accounts]);

  const recentTransactions = useMemo(() => {
    const rows = Array.isArray(dashboardQuery.data?.transactions)
      ? dashboardQuery.data.transactions
      : [];
    return rows.slice(0, 10);
  }, [dashboardQuery.data]);

  // Only block the dashboard on the single dashboard-data call.
  const loading = dashboardQuery.isLoading;
  const hasError = Boolean(dashboardQuery.error);

  const errorText = useMemo(() => {
    if (dashboardQuery.error) return "Could not load dashboard.";
    return null;
  }, [dashboardQuery.error]);

  return {
    accounts,
    accountOptions,
    recentTransactions,
    loading,
    hasError,
    errorText,
  };
}
