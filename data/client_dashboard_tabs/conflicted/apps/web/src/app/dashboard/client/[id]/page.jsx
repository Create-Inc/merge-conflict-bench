"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import useUser from "@/utils/useUser";
import { useClientData } from "@/utils/useClientData";
import { useDeadlines } from "@/utils/useDeadlines";
import { useSetupData } from "@/utils/useSetupData";
import { useEditClient } from "@/hooks/useEditClient";
import { useAutoSaveSetup } from "@/hooks/useAutoSaveSetup";
import { useNotes } from "@/utils/useNotes";
import { LoadingState } from "@/components/ClientDashboard/LoadingState";
import { ErrorState } from "@/components/ClientDashboard/ErrorState";
import { ClientHeader } from "@/components/ClientDashboard/ClientHeader";
import { DashboardContent } from "@/components/ClientDashboard/DashboardContent";
import { EditClientModal } from "@/components/ClientDashboard/EditClientModal/EditClientModal";
import CelebrationOverlay from "@/components/CelebrationOverlay";

function MainComponent({ params }) {
  const { data: user, loading: userLoading } = useUser();
  const { client, loading, error, refetch } = useClientData(
    params.id,
    user,
    userLoading,
  );
  const [activeTab, setActiveTab] = useState("setup");

  // celebration overlay when a prospect is converted into a client
  const [celebrationPayload, setCelebrationPayload] = useState(null);
  const [celebrationOpen, setCelebrationOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!client?.id) return;

    try {
      const raw = window.sessionStorage.getItem("clientCelebration");
      if (!raw) return;

      const parsed = JSON.parse(raw);
      const parsedClientId =
        parsed?.clientId != null ? String(parsed.clientId) : "";
      const currentClientId = String(client.id);

      if (parsedClientId && parsedClientId === currentClientId) {
        setCelebrationPayload(parsed);
        setCelebrationOpen(true);
        window.sessionStorage.removeItem("clientCelebration");
      }
    } catch (e) {
      console.error("Failed to read client celebration", e);
      try {
        window.sessionStorage.removeItem("clientCelebration");
      } catch (_e2) {
        // ignore
      }
    }
  }, [client?.id]);

  const userFirstName = useMemo(() => {
    const explicit = (user?.first_name || "").trim();
    if (explicit) return explicit;

    const full = (user?.name || "").trim();
    if (full) {
      const parts = full.split(/\s+/).filter(Boolean);
      if (parts.length > 0) return parts[0];
    }

    const email = (user?.email || "").trim();
    if (email && email.includes("@")) {
      const local = email.split("@")[0];
      if (local) return local;
    }

    return "";
  }, [user?.email, user?.first_name, user?.name]);

  const celebrationTitle = useMemo(() => {
    if (userFirstName) return `Nice work, ${userFirstName}!`;
    return "Nice work!";
  }, [userFirstName]);

  const celebrationSubtitle = useMemo(() => {
    const name = celebrationPayload?.clientName
      ? String(celebrationPayload.clientName).trim()
      : "";
    if (name) return `Client added: ${name}`;
    return "Client added";
  }, [celebrationPayload?.clientName]);

  // One-click import of Discovery Call details (for clients created via AML)
  const [syncingDiscovery, setSyncingDiscovery] = useState(false);
  const [syncDiscoveryError, setSyncDiscoveryError] = useState(null);

  const hasServicesSelected = useMemo(() => {
    const raw = client?.services_selected;
    if (Array.isArray(raw)) return raw.length > 0;
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      return trimmed !== "" && trimmed !== "[]";
    }
    return !!raw;
  }, [client?.services_selected]);

  const hasKeyDiscoveryDetails = useMemo(() => {
    return (
      !!client?.business_structure ||
      !!client?.limited_company_name ||
      !!client?.business_name
    );
  }, [
    client?.business_structure,
    client?.limited_company_name,
    client?.business_name,
  ]);

  const showSyncBanner = useMemo(() => {
    if (!client) return false;
    return (
      !syncingDiscovery && (!hasServicesSelected || !hasKeyDiscoveryDetails)
    );
  }, [client, syncingDiscovery, hasServicesSelected, hasKeyDiscoveryDetails]);

  const handleSyncFromDiscoveryCall = useCallback(async () => {
    if (!client?.id) return;

    setSyncDiscoveryError(null);
    setSyncingDiscovery(true);

    try {
      const res = await fetch(
        `/api/clients/${client.id}/sync-from-discovery-call`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `When syncing discovery call details, the response was [${res.status}] ${res.statusText}: ${text}`,
        );
      }

      if (typeof window !== "undefined") {
        window.location.reload();
      } else {
        await refetch();
      }
    } catch (e) {
      console.error(e);
      setSyncDiscoveryError(
        e?.message || "Could not import details from the discovery call",
      );
    } finally {
      setSyncingDiscovery(false);
    }
  }, [client?.id, refetch]);

  // Initialize tab from URL (?tab=...) and keep URL in sync
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const search = new URLSearchParams(window.location.search);
      const tab = (search.get("tab") || "").toLowerCase();
      if (tab) {
        setActiveTab(tab);
      }
    } catch (e) {
      console.error("Failed to read tab from URL", e);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("tab") !== activeTab) {
        url.searchParams.set("tab", activeTab);
        window.history.replaceState(null, "", url.toString());
      }
    } catch (e) {
      console.error("Failed to sync tab to URL", e);
    }
  }, [activeTab]);

  // Notes from database
  const {
    notes,
    loading: notesLoading,
    error: notesError,
    addNote,
    deleteNote,
    updateNote,
    moveNote,
  } = useNotes(params.id);

  const {
    setupData,
    setSetupData,
    saveSetupData,
    loading: setupLoading,
  } = useSetupData(params.id);

  const {
    filteredDeadlines,
    upcomingDeadlines,
    stats,
    filters,
    completeDeadline,
    uncompleteDeadline,
    deleteDeadline,
    restoreDeadline,
    deletedDeadlinesList,
    completedDeadlinesList,
  } = useDeadlines(setupData, params.id);

  const {
    showEditModal,
    editFormData,
    saving,
    editError,
    handleEditClick,
    handleEditChange,
    handleEditSubmit,
    handleCloseModal,
  } = useEditClient(client || {}, params.id, refetch);

  const handleOpenServicesFromEdit = () => {
    handleCloseModal();
    setActiveTab("services");
  };

  // Auto-save setup data when it changes (with debounce)
  useAutoSaveSetup(setupData, setupLoading, saveSetupData);

  if (userLoading || loading || setupLoading) {
    return <LoadingState />;
  }

  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/account/signin";
    }
    return null;
  }

  if (error || !client) {
    return <ErrorState error={error} />;
  }

  if (notesError) {
    // non-blocking; keep visible in console
    console.error("Notes error", notesError);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CelebrationOverlay
        open={celebrationOpen}
        title={celebrationTitle}
        subtitle={celebrationSubtitle}
        revenueBefore={celebrationPayload?.revenueBefore}
        revenueAfter={celebrationPayload?.revenueAfter}
        addedMonthlyFee={celebrationPayload?.monthlyFeeAdded}
        enableSound={!(celebrationPayload?.silent === true)}
        onDone={() => setCelebrationOpen(false)}
      />

      <ClientHeader
        client={client}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onEdit={handleEditClick}
        onRefetch={refetch}
      />

      {showSyncBanner ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-amber-900">
                Missing discovery call details
              </div>
              <div className="text-sm text-amber-800 mt-1">
                This client looks like it was created from AML, but some
                details/services weren’t pulled through.
              </div>
            </div>

            <button
              type="button"
              onClick={handleSyncFromDiscoveryCall}
              className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700"
            >
              Import from discovery call
            </button>
          </div>
        </div>
      ) : null}

      {syncDiscoveryError ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3">
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {syncDiscoveryError}
          </div>
        </div>
      ) : null}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
<<<<<<< ours
          {/*
            Layout change:
            - Actions live inside the same header box as the tab headings
            - Tab headings stretch across the full width on desktop
          */}
          <TabNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            actions={
              <ClientSummaryPanel
                client={client}
                onEdit={handleEditClick}
                onRefetch={refetch}
                layout="banner"
                embedded={true}
                mode="inline"
              />
            }
          />

=======

>>>>>>> theirs
          <DashboardContent
            activeTab={activeTab}
            setupData={setupData}
            setSetupData={setSetupData}
            upcomingDeadlines={upcomingDeadlines}
            setActiveTab={setActiveTab}
            stats={stats}
            filteredDeadlines={filteredDeadlines}
            filters={filters}
            completeDeadline={completeDeadline}
            uncompleteDeadline={uncompleteDeadline}
            deleteDeadline={deleteDeadline}
            deletedDeadlinesList={deletedDeadlinesList}
            restoreDeadline={restoreDeadline}
            completedDeadlinesList={completedDeadlinesList}
            clientData={client}
            notes={notes}
            addNote={addNote}
            deleteNote={deleteNote}
            notesLoading={notesLoading}
            updateNote={updateNote}
            moveNote={moveNote}
            onEdit={handleEditClick}
            onRefetchClient={refetch}
          />
        </div>
      </div>

      {/* Edit Client Modal */}
      <EditClientModal
        showEditModal={showEditModal}
        editFormData={editFormData}
        editError={editError}
        saving={saving}
        onClose={handleCloseModal}
        onChange={handleEditChange}
        onSubmit={handleEditSubmit}
        onOpenServices={handleOpenServicesFromEdit}
      />
    </div>
  );
}

export default MainComponent;
