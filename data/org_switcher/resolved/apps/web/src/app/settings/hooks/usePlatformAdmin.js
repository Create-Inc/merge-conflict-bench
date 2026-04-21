import { useState, useCallback, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";

export function usePlatformAdmin() {
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState(null);

  // New org form state
  const [orgName, setOrgName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [plan, setPlan] = useState("Enterprise");
  const [complimentary, setComplimentary] = useState(true);
  const [createdOrg, setCreatedOrg] = useState(null);
  const [invitationUrl, setInvitationUrl] = useState("");

  // Current org info (for deletion)
  const [currentOrg, setCurrentOrg] = useState(null);
  const [deletingOrg, setDeletingOrg] = useState(false);
  const [confirmOrgName, setConfirmOrgName] = useState("");
  const [confirmPhrase, setConfirmPhrase] = useState("");

  // Prefill from URL params (one-time on mount)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const qOrg = params.get("orgName");
      const qAdmin = params.get("adminName");
      const qEmail = params.get("adminEmail");
      const qPlan = params.get("plan");
      const qComplimentary = params.get("complimentary");

      if (qOrg) setOrgName(qOrg);
      if (qAdmin) setAdminName(qAdmin);
      if (qEmail) setAdminEmail(qEmail);
      if (qPlan && ["Starter", "Professional", "Enterprise"].includes(qPlan)) {
        setPlan(qPlan);
      }
      if (qComplimentary != null) {
        const val = qComplimentary === "1" || qComplimentary === "true";
        setComplimentary(val);
      }
    } catch (e) {
      // ignore URL parsing errors
    }
  }, []);

  // Load current organization (IMPORTANT: must forward current URL search params so Platform Admin org override works)
  useEffect(() => {
    let cancelled = false;

    const getEffectiveSearch = () => {
      if (typeof window === "undefined") return "";

      let search = window.location.search || "";
      try {
        const params = new URLSearchParams(search);
        const orgIdParam = params.get("organizationId");

        // If URL is missing org context but we have a persisted Platform Admin selection,
        // use it (this makes delete-org work even if some link dropped the query string).
        if (!orgIdParam) {
          const stored = window.localStorage.getItem(
            "platformAdmin.selectedOrgId",
          );
          const storedNum = stored ? Number(stored) : null;
          if (Number.isFinite(storedNum) && storedNum > 0) {
            params.set("organizationId", String(storedNum));
            search = `?${params.toString()}`;

            // Keep the URL in sync (no reload)
            try {
              const url = new URL(window.location.href);
              url.search = search;
              window.history.replaceState({}, "", url.toString());
            } catch (_) {}
          }
        }
      } catch (_) {
        // ignore parse errors
      }

      return search;
    };

    async function loadCurrentOrg() {
      try {
        let url = "/api/organizations/current";
        const search = getEffectiveSearch();
        url += search;

        const res = await fetch(url);
        if (!res.ok) {
          if (!cancelled) setCurrentOrg(null);
          return;
        }
        const data = await res.json();
        if (!cancelled) setCurrentOrg(data);
      } catch (e) {
        if (!cancelled) setCurrentOrg(null);
      }
    }

    loadCurrentOrg();

    const onNav = () => loadCurrentOrg();
    if (typeof window !== "undefined") {
      window.addEventListener("popstate", onNav);
      window.addEventListener("locationchange", onNav);
    }

    return () => {
      cancelled = true;
      if (typeof window !== "undefined") {
        window.removeEventListener("popstate", onNav);
        window.removeEventListener("locationchange", onNav);
      }
    };
  }, []);

  const handleClearSubscription = async () => {
    if (
      !confirm(
        "This will remove all subscription plan restrictions from your account as a Platform Administrator. Continue?",
      )
    ) {
      return;
    }

    setClearing(true);
    setMessage(null);

    try {
      const response = await fetch("/api/users/clear-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to clear subscription");
      }

      setMessage({
        type: "success",
        text: "Subscription plan cleared successfully! Refreshing...",
      });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error clearing subscription:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to clear subscription",
      });
    } finally {
      setClearing(false);
    }
  };

  const createOrgMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/admin/organizations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error ||
            `When creating organization, got [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
    onSuccess: (data) => {
      setCreatedOrg(data.organization);

      const url =
        data?.invitation?.invitationUrl ||
        data?.invitationUrl ||
        data?.invitation?.inviteUrl ||
        data?.inviteUrl ||
        "";
      setInvitationUrl(url);

      setMessage({
        type: "success",
        text: `Organization “${data.organization?.name}” created.${url ? " Invitation link ready." : " (Invitation link missing — try refreshing.)"}`,
      });
    },
    onError: (err) => {
      console.error(err);
      setMessage({
        type: "error",
        text: err.message || "Failed to create organization",
      });
    },
  });

  const handleCreateOrg = useCallback(() => {
    setMessage(null);
    setCreatedOrg(null);
    setInvitationUrl("");

    if (!orgName.trim() || !adminEmail.trim()) {
      setMessage({
        type: "error",
        text: "Organization name and admin email are required",
      });
      return;
    }

    createOrgMutation.mutate({
      name: orgName.trim(),
      primaryAdminEmail: adminEmail.trim(),
      primaryAdminName: adminName.trim() || undefined,
      plan,
      complimentary,
    });
  }, [orgName, adminEmail, adminName, plan, complimentary, createOrgMutation]);

  const handleCopyInvite = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(invitationUrl);
      setMessage({
        type: "success",
        text: "Invitation link copied to clipboard",
      });
    } catch (e) {
      console.error(e);
      setMessage({ type: "error", text: "Could not copy invite link" });
    }
  }, [invitationUrl]);

  const resetForm = useCallback(() => {
    setOrgName("");
    setAdminName("");
    setAdminEmail("");
    setPlan("Enterprise");
    setComplimentary(true);
    setCreatedOrg(null);
    setInvitationUrl("");
    setMessage(null);
  }, []);

  const handleDeleteOrganization = useCallback(async () => {
    // Fallback: if currentOrg isn't selected, use the persisted selection.
    let orgIdToDelete = currentOrg?.id;
    if (!orgIdToDelete && typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem(
          "platformAdmin.selectedOrgId",
        );
        const storedNum = stored ? Number(stored) : null;
        if (Number.isFinite(storedNum) && storedNum > 0) {
          orgIdToDelete = storedNum;
        }
      } catch (_) {}
    }

    if (!orgIdToDelete) {
      setMessage({
        type: "error",
        text: "No organization selected. Use Platform Admin Mode to pick an organization first.",
      });
      return;
    }

    if (!currentOrg?.id || Number(currentOrg.id) !== Number(orgIdToDelete)) {
      setMessage({
        type: "error",
        text: "Organization details haven’t loaded for the selected org yet. Please refresh the page and try again.",
      });
      return;
    }

    if (
      String(confirmOrgName || "").trim() !==
        String(currentOrg.name || "").trim() ||
      (confirmPhrase || "").toUpperCase() !== "DELETE"
    ) {
      setMessage({
        type: "error",
        text: "Type the exact org name and the word DELETE to confirm",
      });
      return;
    }

    setDeletingOrg(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/organizations/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: orgIdToDelete,
          confirmName: confirmOrgName,
          confirmPhrase: confirmPhrase,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Delete failed with ${res.status}`);
      }

      try {
        window.localStorage.removeItem("platformAdmin.selectedOrgId");
        if (currentOrg?.id) {
          window.localStorage.removeItem(`lfms_branding_${currentOrg.id}`);
        }
      } catch (_) {}

      setMessage({
        type: "success",
        text: "Organization deleted. Redirecting...",
      });
      setTimeout(() => {
        window.location.href = "/settings";
      }, 1200);
    } catch (e) {
      console.error("Delete org error", e);
      setMessage({
        type: "error",
        text: e.message || "Failed to delete organization",
      });
    } finally {
      setDeletingOrg(false);
    }
  }, [currentOrg, confirmOrgName, confirmPhrase]);

  return {
    clearing,
    message,
    handleClearSubscription,
    orgName,
    setOrgName,
    adminName,
    setAdminName,
    adminEmail,
    setAdminEmail,
    plan,
    setPlan,
    complimentary,
    setComplimentary,
    createdOrg,
    invitationUrl,
    creating: createOrgMutation.isPending || createOrgMutation.isLoading,
    handleCreateOrg,
    handleCopyInvite,
    resetForm,
    // deletion
    currentOrg,
    deletingOrg,
    confirmOrgName,
    setConfirmOrgName,
    confirmPhrase,
    setConfirmPhrase,
    handleDeleteOrganization,
  };
}
