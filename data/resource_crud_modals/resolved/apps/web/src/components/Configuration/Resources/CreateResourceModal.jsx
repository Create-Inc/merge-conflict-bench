import { useMemo, useState, useEffect } from "react";
import { X, Ruler } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveClub } from "@/contexts/ClubContext";
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

export function CreateResourceModal({ onClose, categories }) {
  const { activeClubId } = useActiveClub();
  const { club } = useClub();
  const resourceTerm = club?.resource_verbiage || "Slip";

  // NOTE:
  // - `name` is the slip/spot number (ex: A20)
  // - `resourceName` is the display name (ex: boat name, guest slip label)
  const [name, setName] = useState("");
  const [resourceName, setResourceName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(categories?.[0]?.id || "");

  const [subscriptionProduct, setSubscriptionProduct] = useState("");
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [length, setLength] = useState("");
  const [depth, setDepth] = useState("");
  const [beam, setBeam] = useState("");

  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  const selectedCategory = useMemo(() => {
    const idNum = Number(categoryId);
    if (!idNum) return null;
    return categories.find((c) => Number(c.id) === idNum) || null;
  }, [categories, categoryId]);

  const assignableSizes = useMemo(() => {
    const raw = Array.isArray(selectedCategory?.assignable_sizes)
      ? selectedCategory.assignable_sizes
      : [];
    return raw
      .map(extractFeetNumber)
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((a, b) => a - b);
  }, [selectedCategory?.assignable_sizes]);

  const isMoorage = useMemo(() => {
    const n = String(selectedCategory?.name || "").toLowerCase();
    return (
      n.includes("moorage") ||
      n.includes("slip") ||
      n.includes("dock") ||
      n.includes("boat") ||
      n.includes("vessel") ||
      n.includes("sailboat")
    );
  }, [selectedCategory?.name]);

  useEffect(() => {
    const load = async () => {
      if (!club?.stripe_account_id) return;
      setLoadingProducts(true);
      try {
        const res = await fetch(`/api/stripe/products?clubId=${club.id}`);
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        const recurringProducts = (data.products || []).filter((p) => p.recurring);
        setProducts(recurringProducts);
      } catch (e) {
        console.error("Error fetching products:", e);
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    load();
  }, [club?.stripe_account_id, club?.id]);

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

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to create resource");
      }
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources", activeClubId] });
      queryClient.invalidateQueries({
        queryKey: ["resource-categories", activeClubId],
      });
      onClose();
    },
    onError: (err) => {
      console.error("Error creating resource:", err);
      setError(err.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!activeClubId) {
      setError("No active club selected");
      return;
    }

    if (!name.trim()) {
      setError(`${resourceTerm} number is required`);
      return;
    }

    if (isMoorage && assignableSizes.length > 0) {
      const chosen = Number(length);
      const ok = Number.isFinite(chosen) && assignableSizes.includes(chosen);
      if (!ok) {
        setError(
          `${resourceTerm} length must be one of: ${assignableSizes
            .map((n) => formatFeetOption(n))
            .join(", ")}ft`,
        );
        return;
      }
    }

    createMutation.mutate({
      clubId: activeClubId,
      name: name.trim(),
      resourceName: resourceName.trim() || null,
      description: description.trim() || null,
      categoryId: categoryId ? Number(categoryId) : null,
      stripeProductId: subscriptionProduct || null,
      length: isMoorage && length ? parseFloat(length) : null,
      depth: isMoorage && depth ? parseFloat(depth) : null,
      beam: isMoorage && beam ? parseFloat(beam) : null,
    });
  };

  const numberLabel = `${resourceTerm} Number`;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
        onClick={onClose}
      />
      <div className="fixed inset-0 flex items-center justify-center z-[10000] p-4 pointer-events-none">
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2a2a2a] w-full max-w-2xl max-h-[90vh] flex flex-col pointer-events-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#2a2a2a] flex-shrink-0">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create Resource
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors duration-150"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 min-h-0">
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            <div className="space-y-6">
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

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {isMoorage ? (
                <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Ruler className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {resourceTerm} Dimensions (feet)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                          {assignableSizes.map((n) => (
                            <option key={n} value={String(n)}>
                              {formatFeetOption(n)}ft
                            </option>
                          ))}
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
                  <select
                    value={subscriptionProduct}
                    onChange={(e) => setSubscriptionProduct(e.target.value)}
                    className="w-full pl-4 pr-4 py-3 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-200 dark:border-[#2a2a2a]">
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
