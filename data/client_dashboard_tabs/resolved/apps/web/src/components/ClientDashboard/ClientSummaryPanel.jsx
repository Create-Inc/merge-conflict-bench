import { ExternalLink, Edit, X, Printer } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import ClientFileView from "@/components/ClientDashboard/ClientFileView";

export function ClientSummaryPanel({
  client,
  onEdit,
  onRefetch,
  layout,
  embedded,
  variant, // "card" (default) or "inline"
}) {
  const resolvedLayout = layout === "banner" ? "banner" : "sidebar";
  const isEmbedded = embedded === true;
  const isInline = variant === "inline";

  const displayName =
    client.client_name || `${client.first_name} ${client.last_name}`.trim();

  const [deleting, setDeleting] = useState(false);
  const [inactivating, setInactivating] = useState(false);
  const [activating, setActivating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [actionError, setActionError] = useState(null);
  const [showClientFile, setShowClientFile] = useState(false);

  const clientFileContentRef = useRef(null);

  const resetConfirmation = () => {
    setShowDeleteConfirm(false);
    setConfirmName("");
    setActionError(null);
  };

  const handleDelete = async () => {
    const expected = (displayName || "").trim();
    const typed = (confirmName || "").trim();
    if (!typed || typed !== expected) {
      setActionError("Type the exact client name to confirm deletion.");
      return;
    }

    try {
      setActionError(null);
      setDeleting(true);
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error(
          `When deleting client ${client.id}, the response was [${res.status}] ${res.statusText}`,
        );
      }
      toast.success("Client deleted successfully");
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 2900);
      }
    } catch (err) {
      console.error(err);
      setActionError(
        "Could not delete the client. Please try again or mark as Inactive.",
      );
      toast.error("Could not delete the client");
      setDeleting(false);
    }
  };

  const handleMarkInactive = async () => {
    try {
      setActionError(null);
      setInactivating(true);
      const res = await fetch(`/api/clients/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [client.id], status: "Inactive" }),
      });
      if (!res.ok) {
        let msg = `When marking client ${client.id} inactive, the response was [${res.status}] ${res.statusText}`;
        try {
          const j = await res.json();
          if (j?.error) msg = j.error;
        } catch (_) {}
        throw new Error(msg);
      }
      toast.success("Client marked as Inactive");
      if (showDeleteConfirm) resetConfirmation();
      if (typeof onRefetch === "function") {
        onRefetch();
      } else if (typeof window !== "undefined") {
        setTimeout(() => window.location.reload(), 2900);
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not mark as Inactive");
      setActionError("Could not mark as Inactive. Please try again.");
    } finally {
      setInactivating(false);
    }
  };

  const handleMarkActive = async () => {
    try {
      setActionError(null);
      setActivating(true);
      const res = await fetch(`/api/clients/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [client.id], status: "Active" }),
      });
      if (!res.ok) {
        let msg = `When marking client ${client.id} active, the response was [${res.status}] ${res.statusText}`;
        try {
          const j = await res.json();
          if (j?.error) msg = j.error;
        } catch (_) {}
        throw new Error(msg);
      }
      toast.success("Client marked as Active");
      if (showDeleteConfirm) resetConfirmation();
      if (typeof onRefetch === "function") {
        onRefetch();
      } else if (typeof window !== "undefined") {
        setTimeout(() => window.location.reload(), 2900);
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not mark as Active");
      setActionError("Could not mark as Active. Please try again.");
    } finally {
      setActivating(false);
    }
  };

  const {
    data: clientFileData,
    isLoading: fileLoading,
    isError: fileError,
  } = useQuery({
    queryKey: ["client-file", client.id],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${client.id}`);
      if (!res.ok) {
        throw new Error(
          `When fetching client ${client.id}, the response was [${res.status}] ${res.statusText}`,
        );
      }
      const data = await res.json();
      return data?.client || data;
    },
    enabled: showClientFile,
  });

  const isInactive = (client.status || "").toString() === "Inactive";

  const handlePrint = () => {
    try {
      if (typeof window !== "undefined") {
        window.print();
      }
    } catch (e) {
      console.error(e);
      toast.error("Could not open print dialog");
    }
  };

  const handleOpenEditFromModal = () => {
    if (typeof onEdit === "function") {
      setShowClientFile(false);
      onEdit();
    }
  };

  const actionsRow = (
    <div
      className={
        resolvedLayout === "banner"
          ? "flex flex-col sm:flex-row sm:flex-wrap gap-2"
          : "space-y-2"
      }
    >
      {isInline && typeof onEdit === "function" ? (
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 w-full sm:w-auto"
        >
          <Edit className="w-4 h-4" />
          Edit Client
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => setShowClientFile(true)}
        className={
          isInline
            ? "flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 w-full sm:w-auto"
            : resolvedLayout === "banner"
              ? "flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 w-full sm:w-auto"
              : "flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
        }
      >
        <ExternalLink className="w-4 h-4" />
        View Client File
      </button>

      {isInactive ? (
        <button
          type="button"
          onClick={handleMarkActive}
          disabled={activating}
          className={
            isInline
              ? "px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 disabled:opacity-70 w-full sm:w-auto"
              : resolvedLayout === "banner"
                ? "px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-70 w-full sm:w-auto"
                : "w-full sm:w-1/2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-70"
          }
          title="Mark this client as Active"
        >
          {activating ? "Marking…" : "Mark as Active"}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleMarkInactive}
          disabled={inactivating}
          className={
            isInline
              ? "px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 disabled:opacity-70 w-full sm:w-auto"
              : resolvedLayout === "banner"
                ? "px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-70 w-full sm:w-auto"
                : "w-full sm:w-1/2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-70"
          }
          title="Mark this client as Inactive"
        >
          {inactivating ? "Marking…" : "Mark as Inactive"}
        </button>
      )}

      <button
        type="button"
        onClick={() => setShowDeleteConfirm(true)}
        disabled={deleting}
        className={
          isInline
            ? "px-3 py-2 rounded-lg border border-red-300 text-red-700 text-sm font-semibold hover:bg-red-50 disabled:opacity-70 w-full sm:w-auto"
            : resolvedLayout === "banner"
              ? "px-4 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-70 w-full sm:w-auto"
              : "w-full sm:w-1/2 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-70"
        }
      >
        {deleting ? "Deleting…" : "Delete Client"}
      </button>
    </div>
  );

  const deleteConfirmModal = showDeleteConfirm ? (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={resetConfirmation} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-client-title"
        className="relative w-full max-w-md rounded-xl overflow-hidden shadow-2xl bg-white"
      >
        <div className="px-5 py-3 bg-red-600 text-white">
          <h3 id="delete-client-title" className="text-base font-semibold">
            Confirm delete
          </h3>
        </div>
        <div className="p-5 bg-red-50">
          <p className="text-sm text-red-800 mb-3">
            You are about to permanently delete this client. This cannot be undone. If an existing client has disengaged from our services, please mark them as Inactive instead.
          </p>
          <label className="block text-sm text-red-900 mb-2">
            Type <span className="font-semibold">{displayName}</span> to confirm
          </label>
          <input
            type="text"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={displayName}
            className="w-full rounded-md border border-red-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
          />
          {actionError ? (
            <p className="mt-2 text-sm text-red-700">{actionError}</p>
          ) : null}
        </div>
        <div className="p-4 bg-white border-t flex flex-col sm:flex-row sm:flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={
              deleting ||
              (confirmName || "").trim() !== (displayName || "").trim()
            }
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-red-600 text-white font-medium disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Permanently Delete"}
          </button>
          <button
            type="button"
            onClick={resetConfirmation}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          {isInactive ? (
            <button
              type="button"
              onClick={handleMarkActive}
              disabled={activating}
              className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {activating ? "Marking…" : "Mark as Active Instead"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleMarkInactive}
              disabled={inactivating}
              className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {inactivating ? "Marking…" : "Mark as Inactive Instead"}
            </button>
          )}
        </div>
      </div>
    </div>
  ) : null;

  const clientFileModal = showClientFile ? (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => setShowClientFile(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-file-title"
        className="relative w-full max-w-5xl max-h-[85vh] rounded-xl overflow-hidden shadow-2xl bg-white flex flex-col"
      >
        <div className="px-5 py-3 border-b flex items-center justify-between">
          <h3 id="client-file-title" className="text-base font-semibold text-gray-900">
            Client File
          </h3>
          <button
            type="button"
            onClick={() => setShowClientFile(false)}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div ref={clientFileContentRef} className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white">
          {fileLoading ? (
            <div className="text-sm text-gray-600">Loading client file…</div>
          ) : null}
          {fileError ? (
            <div className="text-sm text-red-600">
              Could not load client file. Please try again.
            </div>
          ) : null}
          {!fileLoading && !fileError ? (
            <ClientFileView client={clientFileData || client} />
          ) : null}
        </div>
        <div className="px-5 py-3 border-t bg-gray-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleOpenEditFromModal}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            Edit Client Details
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-white flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>
          <button
            type="button"
            onClick={() => setShowClientFile(false)}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // Inline variant: actions only (plus modals)
  if (isInline) {
    return (
      <>
        {actionsRow}
        {deleteConfirmModal}
        {clientFileModal}
      </>
    );
  }

  const containerClassName =
    resolvedLayout === "banner"
      ? isEmbedded
        ? "border-b border-gray-200"
        : "bg-white rounded-lg shadow"
      : "bg-white rounded-lg shadow sticky top-6 z-30 isolate";

  const headerClassName =
    resolvedLayout === "banner"
      ? isEmbedded
        ? "px-6 py-4"
        : "px-5 py-4 border-b border-gray-200"
      : "p-6 border-b border-gray-200";

  const bodyClassName =
    resolvedLayout === "banner"
      ? isEmbedded
        ? "px-6 pb-4"
        : "p-4 sm:p-5"
      : "px-6 py-6 space-y-2 relative z-20";

  return (
    <div className={containerClassName}>
      <div className={headerClassName}>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900">Actions</div>
            <div className="text-xs text-gray-500 mt-1 truncate">
              {displayName}
            </div>
          </div>

          {onEdit ? (
            <button
              onClick={onEdit}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
              title="Edit client"
            >
              <Edit className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className={bodyClassName}>
        {resolvedLayout === "banner" ? (
          actionsRow
        ) : (
          <div className="space-y-2 relative z-20">
            <button
              type="button"
              onClick={() => setShowClientFile(true)}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
            >
              <ExternalLink className="w-4 h-4" />
              View Client File
            </button>

            <div className="flex flex-col sm:flex-row gap-2 relative z-20">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm((s) => !s)}
                disabled={deleting}
                className="w-full sm:w-1/2 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-70"
              >
                {deleting
                  ? "Deleting…"
                  : showDeleteConfirm
                    ? "Confirm Delete"
                    : "Delete Client"}
              </button>

              {isInactive ? (
                <button
                  type="button"
                  onClick={handleMarkActive}
                  disabled={activating}
                  className="w-full sm:w-1/2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-70"
                  title="Mark this client as Active"
                >
                  {activating ? "Marking…" : "Mark as Active"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleMarkInactive}
                  disabled={inactivating}
                  className="w-full sm:w-1/2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-70"
                  title="Mark this client as Inactive"
                >
                  {inactivating ? "Marking…" : "Mark as Inactive"}
                </button>
              )}
            </div>
          </div>
        )}

        {deleteConfirmModal}
        {clientFileModal}
      </div>
    </div>
  );
}
