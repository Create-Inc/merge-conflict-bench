import React, { useCallback, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { fetchJson } from "@/utils/fetchJson";

function clampPct(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

function toMoneyNumber(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function computeFromSubtotal(subtotalAmount, taxRatePct) {
  const subtotal = toMoneyNumber(subtotalAmount);
  const ratePct = clampPct(taxRatePct);
  const rate = ratePct / 100;

  if (!ratePct) {
    return { tax: 0, total: subtotal };
  }

  const tax = toMoneyNumber(subtotal * rate);
  const total = toMoneyNumber(subtotal + tax);
  return { tax, total };
}

export function CreateInvoiceModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();

  const [error, setError] = useState(null);

  const [draft, setDraft] = useState({
    // allow blank -> backend auto numbering
    invoiceNumber: "",
    customerName: "",
    customerEmail: "",
    amount: "", // subtotal (excl tax)
    taxRate: "0", // percent (e.g. 15 for 15%)
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    status: "draft", // draft | pending
    notes: "",
  });

  const computed = useMemo(() => {
    const amt = Number(draft.amount);
    if (!Number.isFinite(amt) || amt < 0) {
      return { tax: 0, total: 0 };
    }
    return computeFromSubtotal(amt, draft.taxRate);
  }, [draft.amount, draft.taxRate]);

  const createMutation = useMutation({
    mutationFn: async (payload) =>
      fetchJson("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setError(null);
      onClose();
      setDraft({
        invoiceNumber: "",
        customerName: "",
        customerEmail: "",
        amount: "",
        taxRate: "0",
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: "",
        status: "draft",
        notes: "",
      });
    },
    onError: (err) => {
      console.error(err);
      setError(err?.data?.error || "Could not create invoice");
    },
  });

  const canSubmit = useMemo(() => {
    const nameOk = String(draft.customerName || "").trim().length > 0;
    const amt = Number(draft.amount);
    const amtOk = Number.isFinite(amt) && amt >= 0;

    const tr = clampPct(draft.taxRate);
    const taxOk = Number.isFinite(tr) && tr >= 0 && tr <= 100;

    return nameOk && amtOk && taxOk;
  }, [draft]);

  const submit = useCallback(
    (e) => {
      e.preventDefault();
      setError(null);

      const taxRatePct = clampPct(draft.taxRate);

      const payload = {
        invoiceNumber: String(draft.invoiceNumber || "").trim() || null,
        customerName: String(draft.customerName || "").trim(),
        customerEmail: String(draft.customerEmail || "").trim() || null,
        // Amount is subtotal (excl. tax). Tax is computed as a %.
        amount: Number(draft.amount || 0),
        taxRate: taxRatePct,
        taxInclusive: false,
        // send vatAmount too for backward compatibility
        vatAmount: computed.tax,
        issueDate: String(draft.issueDate || "").trim() || null,
        dueDate: String(draft.dueDate || "").trim() || null,
        status: String(draft.status || "draft"),
        notes: String(draft.notes || "").trim() || null,
      };

      createMutation.mutate(payload);
    },
    [draft, createMutation, computed.tax],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-black dark:text-white">
              New invoice
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Leave Invoice # blank to auto-generate.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#232323]"
          >
            <X size={18} className="text-gray-700 dark:text-gray-200" />
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <form
          onSubmit={submit}
          className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Invoice # (optional)
            </label>
            <input
              value={draft.invoiceNumber}
              onChange={(e) =>
                setDraft((p) => ({ ...p, invoiceNumber: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121212] text-black dark:text-white"
              placeholder="INV-2026-0001"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Status
            </label>
            <select
              value={draft.status}
              onChange={(e) =>
                setDraft((p) => ({ ...p, status: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121212] text-black dark:text-white"
            >
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Customer name *
            </label>
            <input
              required
              value={draft.customerName}
              onChange={(e) =>
                setDraft((p) => ({ ...p, customerName: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121212] text-black dark:text-white"
              placeholder="Customer"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Customer email (optional)
            </label>
            <input
              value={draft.customerEmail}
              onChange={(e) =>
                setDraft((p) => ({ ...p, customerEmail: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121212] text-black dark:text-white"
              placeholder="billing@customer.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Subtotal (excl. tax) *
            </label>
            <input
              required
              type="number"
              step="0.01"
              value={draft.amount}
              onChange={(e) =>
                setDraft((p) => ({ ...p, amount: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121212] text-black dark:text-white"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Tax rate (%)
            </label>
            <input
              type="number"
              step="0.01"
              min={0}
              value={draft.taxRate}
              onChange={(e) =>
                setDraft((p) => ({ ...p, taxRate: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121212] text-black dark:text-white"
              placeholder="0.00"
            />
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Tax: {computed.tax.toFixed(2)} • Total: {computed.total.toFixed(2)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Issue date
            </label>
            <input
              type="date"
              value={draft.issueDate}
              onChange={(e) =>
                setDraft((p) => ({ ...p, issueDate: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121212] text-black dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Due date
            </label>
            <input
              type="date"
              value={draft.dueDate}
              onChange={(e) =>
                setDraft((p) => ({ ...p, dueDate: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121212] text-black dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Notes
            </label>
            <textarea
              value={draft.notes}
              onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121212] text-black dark:text-white"
            />
          </div>

          <div className="md:col-span-2 flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-2 rounded-full border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || createMutation.isPending}
              className="flex-1 px-5 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black font-semibold disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating…" : "Create invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
