"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import useModalScrollLock from "@/hooks/useModalScrollLock";
import SelectMenu from "@/components/SelectMenu";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "pending_review", label: "Pending review" },
  { value: "active", label: "Active" },
<<<<<<< ours

=======
  { value: "pending_review", label: "Pending review" },
  { value: "draft", label: "Draft" },
>>>>>>> theirs
  { value: "inactive", label: "Inactive" },
  { value: "quarantine", label: "Quarantine" },
];

function clampIds(ids) {
  const list = Array.isArray(ids) ? ids : [];
  const out = [];
  const seen = new Set();

  for (const id of list) {
    const n = Number(id);
    if (!Number.isFinite(n) || n <= 0) continue;
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(n);
    if (out.length >= 20000) break;
  }

  return out;
}

export default function BulkStatusModal({
  open,
  selectedProductIds,
  onClose,
  onDone,
}) {
  const isOpen = !!open;
  useModalScrollLock(isOpen);

  const ids = useMemo(() => clampIds(selectedProductIds), [selectedProductIds]);

  const [target, setTarget] = useState("active");
  const [reason, setReason] = useState("");
  const [preview, setPreview] = useState(null);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setPreview(null);
    setSuccess(null);
    setReason("");
    setTarget("active");
    setSuccess(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const previewMutation = useMutation({
    mutationFn: async ({ productIds, targetStatus }) => {
      const response = await fetch("/api/admin/products/bulk-status/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_ids: productIds, target: targetStatus }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const msg = String(data?.error || "").trim();
        const fallback = `When previewing bulk status change, the response was [${response.status}] ${response.statusText}`;
        throw new Error(msg || fallback);
      }

      return response.json();
    },
    onSuccess: (data) => {
      setPreview(data || null);
      setError(null);
    },
    onError: (e) => {
      console.error(e);
      setError(String(e?.message || "Could not preview bulk status change"));
    },
  });

  const applyMutation = useMutation({
    mutationFn: async ({ productIds, targetStatus, reasonText }) => {
      const response = await fetch("/api/admin/products/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_ids: productIds,
          target: targetStatus,
          reason: reasonText,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const msg = String(data?.error || "").trim();
        const fallback = `When applying bulk status change, the response was [${response.status}] ${response.statusText}`;
        const err = new Error(msg || fallback);
        err._details = data;
        throw err;
      }

      return response.json();
    },
    onSuccess: (data) => {
      setError(null);
      setSuccess(data || { success: true });
    },
    onError: (e) => {
      console.error(e);
      const details = e?._details;
      if (details?.preview) {
        setPreview(details.preview);
      }
      setError(String(e?.message || "Could not apply bulk status change"));
    },
  });

  const previewRows = useMemo(() => {
    return Array.isArray(preview?.results) ? preview.results : [];
  }, [preview]);

  const blockedRows = useMemo(() => {
    return previewRows.filter((r) => (r?.blockers || []).length > 0);
  }, [previewRows]);

  const previewSummary = useMemo(() => {
    const s = preview?.summary;
    if (!s || typeof s !== "object") {
      return { total: ids.length, ok: 0, blocked: 0, warnings: 0 };
    }
    return {
      total: Number(s.total) || ids.length,
      ok: Number(s.ok) || 0,
      blocked: Number(s.blocked) || 0,
      warnings: Number(s.warnings) || 0,
    };
  }, [preview, ids.length]);

  const hasPreview = !!preview;
  const canPreview = ids.length > 0 && !previewMutation.isPending && !success;

  const canApply =
    ids.length > 0 &&
    hasPreview &&
    blockedRows.length === 0 &&
    !applyMutation.isPending &&
    !previewMutation.isPending &&
    !success;

  const runPreview = useCallback(() => {
    if (!canPreview) return;
    setError(null);
    setSuccess(null);
    previewMutation.mutate({ productIds: ids, targetStatus: target });
  }, [canPreview, ids, target, previewMutation]);

  const runApply = useCallback(() => {
    if (!canApply) return;
    setError(null);
    setSuccess(null);
    applyMutation.mutate({
      productIds: ids,
      targetStatus: target,
      reasonText: String(reason || "").trim() || null,
    });
  }, [canApply, applyMutation, ids, reason, target]);

  // Auto-preview when the modal opens or the target changes.
  useEffect(() => {
    if (!isOpen) return;
    if (!ids.length) return;
    if (success) return;

    const t = setTimeout(() => {
      previewMutation.mutate({ productIds: ids, targetStatus: target });
    }, 150);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, target, ids.join(","), success]);

  const bulkOperationId = useMemo(() => {
    const id = Number(success?.bulk_operation_id);
    if (!Number.isFinite(id) || id <= 0) return null;
    return Math.round(id);
  }, [success?.bulk_operation_id]);

  const confirmationQuery = useQuery({
    queryKey: ["adminProductHistoryByBulkOp", bulkOperationId],
    enabled: !!bulkOperationId,
    queryFn: async () => {
      const qs = new URLSearchParams();
      qs.set("bulk_operation_id", String(bulkOperationId));
      qs.set("limit", "25");

      const response = await fetch(
        `/api/admin/product-history?${qs.toString()}`,
      );
      if (response.status === 401) {
        throw new Error("Not authorized to view confirmation history");
      }
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(
          `When fetching /api/admin/product-history, the response was [${response.status}] ${response.statusText}${
            text ? ` - ${text}` : ""
          }`,
        );
      }
      return response.json();
    },
    staleTime: 1000 * 30,
  });

  const confirmationRows = useMemo(() => {
    const rows = confirmationQuery.data?.rows;
    return Array.isArray(rows) ? rows : [];
  }, [confirmationQuery.data]);

  if (!isOpen) return null;

  const bulkOperationId = success?.bulk_operation_id;
  const showSuccess = !!success?.success;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={() => {
          if (applyMutation.isPending) return;
          if (showSuccess) return;
          onClose?.();
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-base font-semibold text-gray-900 truncate">
                Bulk status change
              </div>
              <div className="text-sm text-gray-600 mt-1">
                You have <b>{ids.length}</b> products selected.
              </div>
              {error ? (
                <div className="mt-2 text-sm text-red-700">{String(error)}</div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => {
                if (applyMutation.isPending) return;
                if (showSuccess) return;
                onClose?.();
              }}
              className="p-2 rounded-lg hover:bg-gray-50 text-gray-600"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-4">
<<<<<<< ours
            {showSuccess ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4">
                <div className="text-sm font-semibold text-emerald-900">
                  Bulk status change applied
                </div>
                <div className="mt-1 text-sm text-emerald-900">
                  Updated <b>{Number(success?.updated_count) || 0}</b> products.
                </div>
                <div className="mt-1 text-sm text-emerald-900">
                  Created <b>{Number(success?.history_count) || 0}</b> product
                  history snapshots.
                </div>
                {bulkOperationId ? (
                  <div className="mt-1 text-sm text-emerald-900">
                    Bulk operation id: <b>#{String(bulkOperationId)}</b>
                  </div>
                ) : null}
                <div className="mt-3 text-xs text-emerald-800">
                  Tip: this change is transactional (all-or-nothing) and is
                  recorded in product history.
                </div>
=======
            {success ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="text-sm font-semibold text-green-900">
                  Bulk status change applied
                </div>
                <div className="mt-1 text-sm text-green-900">
                  <div>
                    Updated <b>{Number(success?.updated_count) || 0}</b>{" "}
                    products.
                  </div>
                  <div>
                    Wrote <b>{Number(success?.history_count) || 0}</b> product
                    history snapshots.
                  </div>
                  {success?.bulk_operation_id ? (
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <div>
                        Bulk operation id:{" "}
                        <span className="font-mono">
                          {String(success.bulk_operation_id)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            const text = String(success.bulk_operation_id);
                            if (
                              typeof navigator !== "undefined" &&
                              navigator.clipboard
                            ) {
                              navigator.clipboard.writeText(text);
                            }
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="text-xs px-2 py-1 rounded-md border border-green-200 bg-white text-green-900 hover:bg-green-100"
                      >
                        Copy
                      </button>
                    </div>
                  ) : null}
                </div>
>>>>>>> theirs

<<<<<<< ours
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onDone?.(success);
                    }}
                    className="px-4 py-2 rounded-lg bg-[#8FA888] text-white hover:bg-[#7a9477] text-sm font-medium"
                  >
                    Done
                  </button>
                </div>
=======
                <div className="mt-3 text-xs text-green-800">
                  Confirmation: product history rows written in this bulk op.
                </div>

                <div className="mt-3 rounded-md border border-green-200 bg-white">
                  <div className="px-3 py-2 border-b border-green-200 text-xs font-semibold text-green-900">
                    Product history entries
                  </div>

                  <div className="p-3">
                    {confirmationQuery.isLoading ? (
                      <div className="text-xs text-gray-600">Loading…</div>
                    ) : confirmationQuery.isError ? (
                      <div className="text-xs text-amber-700">
                        Couldn’t load confirmation rows.
                      </div>
                    ) : confirmationRows.length === 0 ? (
                      <div className="text-xs text-gray-600">
                        No rows found.
                      </div>
                    ) : (
                      <div className="max-h-[220px] overflow-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-left text-gray-500">
                              <th className="py-1 pr-2">History id</th>
                              <th className="py-1 pr-2">Product</th>
                              <th className="py-1 pr-2">Prior status</th>
                              <th className="py-1 pr-2">Changed at</th>
                            </tr>
                          </thead>
                          <tbody>
                            {confirmationRows.map((r) => {
                              const historyId = String(r?.id || "");
                              const productId = String(r?.product_id || "");
                              const name = String(r?.name || "").trim();
                              const label = name
                                ? `${name} (#${productId})`
                                : `#${productId}`;
                              const status =
                                String(r?.product_status || "").trim() ||
                                "(unknown)";
                              const changedAt = String(r?.changed_at || "");

                              return (
                                <tr
                                  key={historyId}
                                  className="border-t border-gray-100"
                                >
                                  <td className="py-1 pr-2 font-mono text-gray-700">
                                    {historyId}
                                  </td>
                                  <td className="py-1 pr-2 text-gray-800">
                                    {label}
                                  </td>
                                  <td className="py-1 pr-2 text-gray-700">
                                    {status}
                                  </td>
                                  <td className="py-1 pr-2 text-gray-700">
                                    {changedAt}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {confirmationQuery.data?.total > confirmationRows.length ? (
                      <div className="mt-2 text-[11px] text-gray-500">
                        Showing {confirmationRows.length} of{" "}
                        {confirmationQuery.data.total}.
                      </div>
                    ) : null}
                  </div>
                </div>
>>>>>>> theirs
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Set selected products to
                    </label>
                    <SelectMenu
                      value={target}
                      onChange={(e) => {
                        setTarget(String(e.target.value || "active"));
                      }}
                      options={STATUS_OPTIONS}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8FA888] bg-white"
                      buttonAriaLabel="Target status"
                    />
                  </div>

<<<<<<< ours
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Reason (optional)
                    </label>
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Why are you changing these products?"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8FA888]"
                    />
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-600">
                  Preview runs automatically and will block the apply step if
                  any products fail readiness checks.
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 flex-col sm:flex-row">
                  <div className="text-sm text-gray-700">
                    {hasPreview ? (
=======
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Reason (optional)
                    </label>
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Why are you changing these products?"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8FA888]"
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 flex-col sm:flex-row">
                  <div className="text-sm text-gray-700">
                    {hasPreview ? (
>>>>>>> theirs
                      <span>
                        Preview: <b>{previewSummary.ok}</b> ok,{" "}
                        <b>{previewSummary.blocked}</b> blocked
                        {previewSummary.warnings ? (
                          <span>
                            {" "}
                            • <b>{previewSummary.warnings}</b> warnings
                          </span>
                        ) : null}
                      </span>
                    ) : (
                      <span className="text-gray-500">
                        Preview required before applying.
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={runPreview}
                      disabled={!canPreview}
                      className={
                        canPreview
                          ? "px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-sm"
                          : "px-4 py-2 rounded-lg bg-gray-200 text-gray-500 cursor-not-allowed text-sm"
                      }
                    >
                      {previewMutation.isPending
                        ? "Previewing…"
                        : "Refresh preview"}
                    </button>

                    <button
                      type="button"
                      onClick={runApply}
                      disabled={!canApply}
                      className={
                        canApply
                          ? "px-4 py-2 rounded-lg bg-[#8FA888] text-white hover:bg-[#7a9477] text-sm font-medium"
                          : "px-4 py-2 rounded-lg bg-gray-200 text-gray-500 cursor-not-allowed text-sm font-medium"
                      }
                      title={
                        blockedRows.length
                          ? "Some products are blocked — fix blockers first"
                          : "Apply the change"
                      }
                    >
                      {applyMutation.isPending ? "Applying…" : "Apply"}
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  {previewMutation.isPending && !hasPreview ? (
                    <div className="text-sm text-gray-600">
                      Loading preview…
                    </div>
                  ) : null}

<<<<<<< ours
                  {hasPreview ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Blocked panel */}
                      <div className="rounded-lg border border-gray-200 bg-white">
                        <div className="px-4 py-3 border-b border-gray-200">
                          <div className="text-sm font-semibold text-gray-900">
                            Blocked ({blockedRows.length})
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Bulk apply is all-or-nothing.
                          </div>
=======
                  {hasPreview ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="rounded-lg border border-gray-200 bg-white">
                        <div className="px-4 py-3 border-b border-gray-200">
                          <div className="text-sm font-semibold text-gray-900">
                            Blocked ({blockedRows.length})
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Bulk apply is all-or-nothing.
                          </div>
>>>>>>> theirs
                        </div>

                        <div className="p-4">
                          {blockedRows.length === 0 ? (
                            <div className="text-sm text-gray-600">
                              No blockers.
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-[360px] overflow-auto">
                              {blockedRows.slice(0, 60).map((r) => {
                                const name = String(r?.name || `#${r?.id}`);
                                const blockers = Array.isArray(r?.blockers)
                                  ? r.blockers
                                  : [];

                                return (
                                  <div
                                    key={String(r?.id)}
                                    className="rounded-md border border-red-200 bg-red-50 px-3 py-2"
                                  >
                                    <div className="text-sm font-medium text-red-900">
                                      {name}
                                    </div>
                                    <ul className="mt-1 list-disc pl-5 text-xs text-red-800">
                                      {blockers.map((b, idx) => (
                                        <li key={`${String(r?.id)}-b-${idx}`}>
                                          {String(b)}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                );
                              })}
                              {blockedRows.length > 60 ? (
                                <div className="text-xs text-gray-600">
                                  Showing first 60 blocked products.
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>

<<<<<<< ours
                      {/* Warnings panel */}
                      <div className="rounded-lg border border-gray-200 bg-white">
                        <div className="px-4 py-3 border-b border-gray-200">
                          <div className="text-sm font-semibold text-gray-900">
                            Warnings
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Warnings don’t block the change.
                          </div>
                        </div>
=======
                      <div className="rounded-lg border border-gray-200 bg-white">
                        <div className="px-4 py-3 border-b border-gray-200">
                          <div className="text-sm font-semibold text-gray-900">
                            Warnings
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Warnings don’t block the change.
                          </div>
                        </div>
>>>>>>> theirs

                        <div className="p-4">
                          <div className="space-y-3 max-h-[360px] overflow-auto">
                            {previewRows
                              .filter((r) => (r?.warnings || []).length > 0)
                              .slice(0, 60)
                              .map((r) => {
                                const name = String(r?.name || `#${r?.id}`);
                                const warnings = Array.isArray(r?.warnings)
                                  ? r.warnings
                                  : [];

                                return (
                                  <div
                                    key={String(r?.id)}
                                    className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2"
                                  >
                                    <div className="text-sm font-medium text-amber-900">
                                      {name}
                                    </div>
                                    <ul className="mt-1 list-disc pl-5 text-xs text-amber-900">
                                      {warnings.map((w, idx) => (
                                        <li key={`${String(r?.id)}-w-${idx}`}>
                                          {String(w)}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                );
                              })}

                            {previewRows.filter(
                              (r) => (r?.warnings || []).length > 0,
                            ).length === 0 ? (
                              <div className="text-sm text-gray-600">
                                No warnings.
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 flex items-center justify-end gap-2">
<<<<<<< ours
            <button
              type="button"
              onClick={() => {
                if (applyMutation.isPending) return;
                if (showSuccess) {
                  onDone?.(success);
                  return;
                }
                onClose?.();
              }}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-sm"
              disabled={applyMutation.isPending}
            >
              {showSuccess ? "Close" : "Cancel"}
            </button>
=======
            {success ? (
              <button
                type="button"
                onClick={() => {
                  onDone?.(success);
                }}
                className="px-4 py-2 rounded-lg bg-[#8FA888] text-white hover:bg-[#7a9477] text-sm font-medium"
              >
                Done
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (applyMutation.isPending) return;
                  onClose?.();
                }}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-sm"
                disabled={applyMutation.isPending}
              >
                Close
              </button>
            )}
>>>>>>> theirs
          </div>
        </div>
      </div>
    </div>
  );
}
