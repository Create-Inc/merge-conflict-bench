import { X } from "lucide-react";

const ROLE_OPTIONS = [
  { value: "general", label: "Employee" },
  { value: "intern", label: "Intern" },
  { value: "supervisor", label: "Supervisor" },
  { value: "dept_head", label: "Department Head" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "operations", label: "Operations" },
  { value: "director", label: "Director" },
];

export function CreateUserModal({
  createUserOpen,
  setCreateUserOpen,
  selectedEmployee,
  createUserRole,
  setCreateUserRole,
  createUserPassword,
  setCreateUserPassword,
  createUserSetAsHead,
  setCreateUserSetAsHead,
  creatingUser,
  submitCreateUser,
  createdUserInfo,
}) {
  if (!createUserOpen) return null;

  const employeeName = `${String(selectedEmployee?.first_name || "").trim()} ${String(
    selectedEmployee?.last_name || "",
  ).trim()}`.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setCreateUserOpen(false)}
      />
      <div className="relative w-full max-w-xl bg-white dark:bg-[#0B1220] border border-gray-200 dark:border-gray-700 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold text-[#374151] dark:text-[#D1D5DB]">
            Create login
          </div>
          <button
            onClick={() => setCreateUserOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={18} className="text-[#6B7280] dark:text-[#9CA3AF]" />
          </button>
        </div>

        <div className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mb-3">
          Employee: {employeeName || "—"}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            value={createUserRole}
            onChange={(e) => setCreateUserRole(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111827] text-[#374151] dark:text-[#D1D5DB]"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <input
            value={createUserPassword}
            onChange={(e) => setCreateUserPassword(e.target.value)}
            placeholder="Optional: set initial password"
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111827] text-[#374151] dark:text-[#D1D5DB]"
          />
        </div>

        <div className="mt-3">
          <label className="flex items-center gap-2 text-sm text-[#6B7280] dark:text-[#9CA3AF]">
            <input
              type="checkbox"
              checked={!!createUserSetAsHead}
              onChange={(e) => setCreateUserSetAsHead(e.target.checked)}
            />
            Set as head of this employee’s department (approver)
          </label>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={() => setCreateUserOpen(false)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Close
          </button>
          <button
            onClick={submitCreateUser}
            disabled={creatingUser}
            className="px-5 py-2.5 rounded-xl font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: "#111827" }}
          >
            {creatingUser ? "Creating..." : "Create login"}
          </button>
        </div>

        {createdUserInfo?.tempPassword ? (
          <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#111827] p-4">
            <div className="text-sm font-semibold text-[#374151] dark:text-[#D1D5DB]">
              Temporary password
            </div>
            <div className="mt-1 text-sm text-[#111827] dark:text-white font-mono">
              {String(createdUserInfo.tempPassword)}
            </div>
            <div className="mt-2 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
              Share this with the employee and ask them to change it after
              signing in.
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
