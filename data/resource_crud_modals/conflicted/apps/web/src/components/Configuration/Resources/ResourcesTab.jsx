import { Plus, Anchor, Trash2, Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { EditResourceModal } from "@/components/Resources/Modals/EditResourceModal";
import { useClub } from "@/hooks/useClub";

function formatFeet(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
  const one = n.toFixed(1);
  return one.endsWith(".0") ? one.slice(0, -2) : one;
}

export function ResourcesTab({
  resources,
  categories,
  onCreateResource,
  onDeleteResource,
  deletingResourceId,
}) {
  const [editingResource, setEditingResource] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { club } = useClub();
  const resourceTerm = club?.resource_verbiage || "Slip";
  const numberLabel = `${resourceTerm} Number`;

  const categoryOptions = useMemo(() => {
    const base = [{ value: "all", label: "All categories" }];

    const sorted = [...(categories || [])].sort((a, b) =>
      String(a?.name || "").localeCompare(String(b?.name || "")),
    );

    for (const c of sorted) {
      if (!c?.id) continue;
      base.push({ value: String(c.id), label: c.name || `Category ${c.id}` });
    }

    base.push({ value: "none", label: "Uncategorized" });

    return base;
  }, [categories]);

  const filteredResources = useMemo(() => {
    if (!Array.isArray(resources)) return [];
    if (categoryFilter === "all") return resources;

    if (categoryFilter === "none") {
      return resources.filter((r) => !r.category_id);
    }

    const categoryId = Number(categoryFilter);
    return resources.filter((r) => Number(r.category_id) === categoryId);
  }, [resources, categoryFilter]);

  const editingCategory = useMemo(() => {
    if (!editingResource?.category_id) return null;
    const id = Number(editingResource.category_id);
    const list = Array.isArray(categories) ? categories : [];
    return list.find((c) => Number(c?.id) === id) || null;
  }, [editingResource, categories]);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            All Resources
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onCreateResource}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-200"
          >
            <Plus className="w-5 h-5" />
            <span>Add Resource</span>
          </button>
        </div>
      </div>

      {filteredResources.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-[#2a2a2a] rounded-full flex items-center justify-center mx-auto mb-4">
            <Anchor className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No resources yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Create your first {resourceTerm.toLowerCase()} or resource
          </p>
          <button
            onClick={onCreateResource}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-200"
          >
            <Plus className="w-5 h-5" />
            <span>Add Resource</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#2a2a2a]">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
<<<<<<< ours
                  {numberLabel}
=======
                  {resourceTerm} #
>>>>>>> theirs
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Resource Name
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Category
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {resourceTerm} Length
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.map((resource) => {
                const len = formatFeet(resource.length);
                const lengthValue = len ? `${len}ft` : "-";
<<<<<<< ours
                const resourceName = resource?.resource_name
                  ? String(resource.resource_name)
                  : "-";
=======
                const displayName = resource?.resource_name || "-";
>>>>>>> theirs

                const isDeleting =
                  deletingResourceId &&
                  Number(deletingResourceId) === Number(resource.id);

                return (
                  <tr
                    key={resource.id}
                    className="border-b border-gray-100 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#222222]"
                  >
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-900 dark:text-white font-medium">
                        {resource.name}
                      </div>
                      {resource.description ? (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {resource.description}
                        </div>
                      ) : null}
                    </td>
<<<<<<< ours
                    <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                      {resourceName}
                    </td>
=======
                    <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                      {displayName}
                    </td>
>>>>>>> theirs
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {resource.category_name || resource.resource_type || "-"}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                      {lengthValue}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingResource(resource)}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            if (!onDeleteResource) return;
                            const ok = window.confirm(
                              `Delete resource "${resource.name}"? This cannot be undone.`,
                            );
                            if (!ok) return;

                            try {
                              await onDeleteResource(resource.id);
                            } catch (e) {
                              console.error("Failed to delete resource:", e);
                              alert(e?.message || "Failed to delete resource");
                            }
                          }}
                          disabled={Boolean(isDeleting)}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editingResource && (
        <EditResourceModal
          resource={editingResource}
          category={editingCategory}
          onClose={() => setEditingResource(null)}
        />
      )}
    </>
  );
}
