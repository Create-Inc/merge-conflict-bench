import React, { useCallback, useEffect, useMemo, useState } from "react";
import useUser from "@/utils/useUser";
import { MobileMenuButton, Sidebar } from "@/components/Sidebar/Sidebar";
import { useCompany } from "@/hooks/useCompany";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useDepartments } from "@/hooks/useDepartments";
import { UserRolesManager } from "@/components/Approvals/UserRolesManager";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/utils/fetchJson";
import { ArrowLeft, Users } from "lucide-react";

function getUserLabel(u) {
  const name = u?.name ? String(u.name) : "";
  const email = u?.email ? String(u.email) : "";
  return name ? `${name} (${email})` : email;
}

export default function UsersPage() {
  const { data: user, loading: userLoading } = useUser();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userLoading && !user) {
      if (typeof window !== "undefined") {
        window.location.href = "/account/signin";
      }
    }
  }, [user, userLoading]);

  const companyQuery = useCompany(!!user);
  const company = companyQuery.data?.company || null;

  const roleLower = String(company?.role || "").toLowerCase();
  const canManageUsers = useMemo(() => {
    return [
      "admin",
      "manager",
      "operations",
      "director",
      "super_admin",
    ].includes(roleLower);
  }, [roleLower]);

  const companyUsersQuery = useCompanyUsers(!!user);
  const companyUsers = companyUsersQuery.companyUsers || [];

  const departmentsQuery = useDepartments(!!user && !!company && canManageUsers);
  const departments = Array.isArray(departmentsQuery.data?.departments)
    ? departmentsQuery.data.departments
    : [];

  const queryClient = useQueryClient();

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }) => {
      return fetchJson("/api/company-users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["companyUsers"] });
      setError(null);
    },
    onError: (err) => {
      console.error(err);
      setError("Could not update user role");
    },
  });

  const handleUpdateUserRole = useCallback(
    ({ userId, role }) => {
      const uid = Number(userId);
      const roleText = String(role || "").trim();
      if (!Number.isFinite(uid) || !roleText) {
        setError("User and role are required");
        return;
      }
      setError(null);
      updateRoleMutation.mutate({ userId: uid, role: roleText });
    },
    [updateRoleMutation],
  );

  const isLoading =
    userLoading ||
    companyQuery.isLoading ||
    companyUsersQuery.isLoading ||
    companyUsersQuery.isFetching ||
    (canManageUsers &&
      (departmentsQuery.isLoading || departmentsQuery.isFetching));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#121212] flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user || !company) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] flex">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        company={company}
      />

      <div className="flex-1 flex flex-col">
        <header className="bg-white dark:bg-[#121212] border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <MobileMenuButton onClick={() => setSidebarOpen(true)} />
              <a
                href="/"
                className="hidden lg:flex items-center text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
              >
                <ArrowLeft size={20} className="mr-2" />
                Back to Dashboard
              </a>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center gap-2 justify-center">
                <Users size={18} className="text-gray-500 dark:text-gray-400" />
                <h1 className="text-2xl lg:text-3xl font-semibold text-black dark:text-white">
                  Users
                </h1>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Manage who can access this workspace
              </div>
            </div>

            <div className="w-[160px]" />
          </div>

          {error ? (
            <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          ) : null}
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-white dark:bg-[#121212] space-y-6">
          {canManageUsers ? (
            <>
              {departmentsQuery.isError ? (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
                  Could not load departments. Department is required when
                  creating users.
                </div>
              ) : null}
              <UserRolesManager
                companyUsers={companyUsers}
                departments={departments}
                onUpdateUserRole={handleUpdateUserRole}
                isUpdating={updateRoleMutation.isPending}
              />
            </>
          ) : (
            <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-800 rounded-3xl p-6">
              <div className="text-lg font-semibold text-black dark:text-white">
                Workspace members
              </div>
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                You can view who’s in this workspace, but only admins can invite
                users or change roles.
              </div>

              {companyUsers.length === 0 ? (
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  No users found.
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {companyUsers.map((u) => {
                    const label = getUserLabel(u);
                    const roleText = u?.role ? String(u.role).replace(/_/g, " ") : "";

                    return (
                      <div
                        key={u.id}
                        className="flex flex-col md:flex-row md:items-center gap-2 justify-between border border-gray-100 dark:border-gray-800 rounded-xl p-3"
                      >
                        <div>
                          <div className="text-sm font-semibold text-black dark:text-white">
                            {label}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            Role: {roleText || "general"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-800 rounded-3xl p-6">
            <div className="text-sm font-semibold text-black dark:text-white">
              Tips
            </div>
            <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 list-disc pl-5 space-y-1">
              <li>
                If you create a user here, you’ll get a temporary password to
                share with them.
              </li>
              <li>
                Users will show up here after they sign in (or after an admin
                invites them).
              </li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
}
