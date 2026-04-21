import { useState, useEffect, useMemo } from "react";
import { X, Ruler } from "lucide-react";
import { useResources } from "@/hooks/useResources";
import { useClub } from "@/hooks/useClub";

function formatFeetOption(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
  const one = n.toFixed(1);
  return one.endsWith(".0") ? one.slice(0, -2) : one;
}

function extractFeetNumber(value) {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  if (Number.isFinite(n)) return n;
  const m = String(value).match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const parsed = Number(m[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

export function CreateResourceModal({ category, onClose }) {
  const [name, setName] = useState("");
  const [resourceName, setResourceName] = useState("");
  const [description, setDescription] = useState("");
  const [subscriptionProduct, setSubscriptionProduct] = useState("");
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [length, setLength] = useState("");
  const [depth, setDepth] = useState("");
  const [beam, setBeam] = useState("");

  const { createMutation } = useResources(category?.id);
  const { club } = useClub();
  const resourceTerm = club?.resource_verbiage || "Slip";

  const isMoorage =
    category?.name?.toLowerCase().includes("moorage") ||
    category?.name?.toLowerCase().includes("slip") ||
    category?.name?.toLowerCase().includes("dock") ||
    category?.name?.toLowerCase().includes("boat") ||
    category?.name?.toLowerCase().includes("vessel") ||
    category?.name?.toLowerCase().includes("sailboat");

  const assignableSizes = useMemo(() => {
    const raw = Array.isArray(category?.assignable_sizes)
      ? category.assignable_sizes
      : [];

    return raw
      .map(extractFeetNumber)
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((a, b) => a - b);
  }, [category?.assignable_sizes]);

  useEffect(() => {
    if (club?.stripe_account_id) {
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [club?.stripe_account_id]);

  const fetchProducts = async () => {
    if (!club?.stripe_account_id) return;

    setLoadingProducts(true);
    try {
      const res = await fetch(`/api/stripe/products?clubId=${club.id}`);
      if (res.ok) {
        const data = await res.json();
        const recurringProducts = (data.products || []).filter((p) => p.recurring);
        setProducts(recurringProducts);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const formatBillingPeriod = (recurring) => {
    if (!recurring) return "";

    const { interval, interval_count = 1 } = recurring;

    if (interval_count === 1) return interval;
    if (interval === "month") {
      if (interval_count === 3) return "quarter";
      if (interval_count === 6) return "6 months";
      return `${interval_count} months`;
    }

    return `${interval_count} ${interval}s`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isMoorage && assignableSizes.length > 0) {
      const chosen = Number(length);
      const ok = Number.isFinite(chosen) && assignableSizes.includes(chosen);
      if (!ok) {
        alert(
          `${resourceTerm} length must be one of: ${assignableSizes
            .map((n) => formatFeetOption(n))
            .join(", ")}ft`,
        );
        return;
      }
    }

    createMutation.mutate(
      {
        clubId: club.id,
        categoryId: category?.id,
        name,
        resourceName: resourceName.trim() || null,
        description,
        status: "available",
        stripeProductId: subscriptionProduct || null,
        length: length ? parseFloat(length) : null,
        depth: depth ? parseFloat(depth) : null,
        beam: beam ? parseFloat(beam) : null,
      },
      {
        onSuccess: onClose,
      },
    );
  };

  const numberLabel = `${resourceTerm} Number`;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2a2a2a] w-full max-w-2xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#2a2a2a]">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Add Resource
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors duration-150"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {numberLabel} *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., A-1, 12"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Resource Name
                  </label>
                  <input
                    type="text"
                    value={resourceName}
                    onChange={(e) => setResourceName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Guest Slip, End Tie"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Optional"
                />
              </div>

              {isMoorage ? (
                <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Ruler className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {resourceTerm} Dimensions (feet)
                    </h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {resourceTerm} Length
                      </label>
                      {assignableSizes.length > 0 ? (
                        <select
                          value={length}
                          onChange={(e) => setLength(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select size</option>
                          {assignableSizes.map((n) => {
                            const label = formatFeetOption(n);
                            return (
                              <option key={n} value={String(n)}>
                                {label}ft
                              </option>
                            );
                          })}
                        </select>
                      ) : (
                        <input
                          type="number"
                          step="0.1"
                          value={length}
                          onChange={(e) => setLength(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Depth
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={depth}
                        onChange={(e) => setDepth(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Beam
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={beam}
                        onChange={(e) => setBeam(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  {assignableSizes.length > 0 ? (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Length options come from your category sizes.
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Recurring Billing Product
                </label>
                {loadingProducts ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400 py-3">
                    Loading products...
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400 py-3 bg-gray-50 dark:bg-[#2a2a2a] rounded-xl px-4">
                    No recurring products available. Create a recurring product
                    in the Financials section.
                  </div>
                ) : (
                  <>
                    <select
                      value={subscriptionProduct}
                      onChange={(e) => setSubscriptionProduct(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No billing</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                          {product.unit_amount && product.recurring
                            ? ` - $${(product.unit_amount / 100).toFixed(2)}/${formatBillingPeriod(product.recurring)}`
                            : ""}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      When assigned, the member will automatically be billed via
                      Stripe
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-[#2a2a2a]">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-xl transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? "Creating..." : "Create Resource"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
