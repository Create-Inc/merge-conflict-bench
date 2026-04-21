import React, { useCallback, useEffect, useMemo, useState } from "react";
import useUser from "@/utils/useUser";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { useCompany } from "@/hooks/useCompany";
import { useCustomers } from "@/hooks/useCustomers";
import { useDeals } from "@/hooks/useDeals";
import { useTasks } from "@/hooks/useTasks";
import { useTaskMutations } from "@/hooks/useTaskMutations";
import CreateTaskModal from "@/components/CRM/CreateTaskModal";
import TasksList from "@/components/CRM/TasksList";
import { BRAND_GRAY, BRAND_GRAY_LIGHT } from "@/components/Brand";
<<<<<<< ours
import { CreateTicketModal } from "@/components/HelpDesk/CreateTicketModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/utils/fetchJson";
import { LifeBuoy, Plus, Search } from "lucide-react";
=======
import { Plus, Search, LifeBuoy } from "lucide-react";
import { CreateTicketModal } from "@/components/HelpDesk/CreateTicketModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/utils/fetchJson";
>>>>>>> theirs

const DEFAULT_TICKET_DRAFT = {
  customerId: "",
  requesterEmail: "",
  areaTag: "",
  autoCreateJobCard: true,
  subject: "",
  description: "",
  priority: "medium",
};

export default function CRMTasksPage() {
  const { data: user, loading: userLoading } = useUser();

  const queryClient = useQueryClient();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("open");
  const [dueFilter, setDueFilter] = useState(null); // null | 'today' | 'overdue' | 'soon'
  const [mineOnly, setMineOnly] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

<<<<<<< ours
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketDraft, setTicketDraft] = useState(DEFAULT_TICKET_DRAFT);
  const [ticketError, setTicketError] = useState(null);

  const ticketPriorityOptions = ["low", "medium", "high"];

  const createTicketMutation = useMutation({
    mutationFn: async (payload) =>
      fetchJson("/api/helpdesk/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["helpdesk", "tickets"] });
      setTicketOpen(false);
      setTicketError(null);
      setTicketDraft(DEFAULT_TICKET_DRAFT);
    },
    onError: (err) => {
      console.error(err);
      setTicketError(
        err?.message ? String(err.message) : "Could not create ticket",
      );
    },
  });

  const openTicket = useCallback(() => {
    setTicketError(null);
    setTicketDraft(DEFAULT_TICKET_DRAFT);
    setTicketOpen(true);
  }, []);

  const closeTicket = useCallback(() => {
    setTicketOpen(false);
    setTicketError(null);
    setTicketDraft(DEFAULT_TICKET_DRAFT);
  }, []);

  const onCreateTicket = useCallback(
    (e) => {
      e.preventDefault();
      setTicketError(null);

      const subjectRaw = String(ticketDraft.subject || "").trim();
      if (!subjectRaw) {
        setTicketError("Subject is required");
        return;
      }

      const tagRaw = String(ticketDraft.areaTag || "").trim();
      const tag = tagRaw.toUpperCase();
      const subject = tag ? `[${tag}] ${subjectRaw}` : subjectRaw;

      const isFieldWorkTag = new Set([
        "FIELD",
        "FSM",
        "FIELDWORK",
        "FIELD WORK",
      ]).has(String(tag).trim());

      const customerId = ticketDraft.customerId
        ? Number(ticketDraft.customerId)
        : null;
      const requesterEmail =
        String(ticketDraft.requesterEmail || "").trim() || null;
      const description = String(ticketDraft.description || "").trim() || null;
      const priority = String(ticketDraft.priority || "medium").trim();

      const payload = {
        subject,
        description,
        requesterEmail,
        customerId: Number.isFinite(customerId) ? customerId : null,
        priority,
      };

      if (isFieldWorkTag) {
        payload.autoCreateJobCard = !!ticketDraft.autoCreateJobCard;
      }

      createTicketMutation.mutate(payload);
    },
    [ticketDraft, createTicketMutation],
  );

=======
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketDraft, setTicketDraft] = useState(DEFAULT_TICKET_DRAFT);
  const [ticketError, setTicketError] = useState(null);

>>>>>>> theirs
  const companyQuery = useCompany(user);
  const customersQuery = useCustomers(user);
  const dealsQuery = useDeals(user);
  const tasksQuery = useTasks(user, {
    status: statusFilter,
    due: statusFilter === "open" ? dueFilter : null,
    mine: mineOnly ? true : null,
  });
  const { createTaskMutation, updateTaskMutation, deleteTaskMutation } =
    useTaskMutations();

  const customers = customersQuery.data?.customers || [];
  const ticketPriorityOptions = ["low", "medium", "high"];

  const createTicketMutation = useMutation({
    mutationFn: async (payload) =>
      fetchJson("/api/helpdesk/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["helpdesk", "tickets"] });
      setTicketOpen(false);
      setTicketError(null);
      setTicketDraft(DEFAULT_TICKET_DRAFT);
    },
    onError: (err) => {
      console.error(err);
      setTicketError(
        err?.message ? String(err.message) : "Could not create ticket",
      );
    },
  });

  useEffect(() => {
    if (!userLoading && !user) {
      if (typeof window !== "undefined") {
        window.location.href = "/account/signin";
      }
    }
  }, [user, userLoading]);

  const company = companyQuery.data?.company || null;
  const deals = dealsQuery.data?.deals || [];
  const tasks = tasksQuery.data?.tasks || [];

  const filteredTasks = useMemo(() => {
    const q = String(searchTerm || "")
      .trim()
      .toLowerCase();
    if (!q) {
      return tasks;
    }

    return tasks.filter((t) => {
      const title = String(t.title || "").toLowerCase();
      const customerName = String(t.customer_name || "").toLowerCase();
      const dealTitle = String(t.deal_title || "").toLowerCase();
      return (
        title.includes(q) || customerName.includes(q) || dealTitle.includes(q)
      );
    });
  }, [tasks, searchTerm]);

  const isLoading =
    userLoading ||
    companyQuery.isLoading ||
    customersQuery.isLoading ||
    dealsQuery.isLoading ||
    tasksQuery.isLoading;

  const onCreateTask = useCallback(
    (payload) => {
      setError(null);
      createTaskMutation.mutate(payload, {
        onSuccess: () => setCreateOpen(false),
        onError: (err) => {
          console.error(err);
          setError("Could not create task");
        },
      });
    },
    [createTaskMutation],
  );

  const onToggleDone = useCallback(
    (task) => {
      if (!task?.id) {
        return;
      }
      setError(null);
      const nextStatus =
        String(task.status || "open") === "done" ? "open" : "done";
      setTogglingId(task.id);
      updateTaskMutation.mutate(
        { taskId: task.id, payload: { status: nextStatus } },
        {
          onSettled: () => setTogglingId(null),
          onError: (err) => {
            console.error(err);
            setError("Could not update task");
          },
        },
      );
    },
    [updateTaskMutation],
  );

  const onDeleteTask = useCallback(
    (task) => {
      if (!task?.id) {
        return;
      }
      if (typeof window !== "undefined") {
        const ok = window.confirm("Delete this task?");
        if (!ok) {
          return;
        }
      }

      setDeletingId(task.id);
      deleteTaskMutation.mutate(task.id, {
        onSettled: () => setDeletingId(null),
        onError: (err) => {
          console.error(err);
          setError("Could not delete task");
        },
      });
    },
    [deleteTaskMutation],
  );

  const openTicket = useCallback(() => {
    setTicketError(null);
    setTicketDraft(DEFAULT_TICKET_DRAFT);
    setTicketOpen(true);
  }, []);

  const closeTicket = useCallback(() => {
    setTicketOpen(false);
    setTicketError(null);
    setTicketDraft(DEFAULT_TICKET_DRAFT);
  }, []);

  const onCreateTicket = useCallback(
    (e) => {
      e.preventDefault();
      setTicketError(null);

      const subjectRaw = String(ticketDraft.subject || "").trim();
      if (!subjectRaw) {
        setTicketError("Subject is required");
        return;
      }

      const tagRaw = String(ticketDraft.areaTag || "").trim();
      const tag = tagRaw.toUpperCase();
      const subject = tag ? `[${tag}] ${subjectRaw}` : subjectRaw;

      const isFieldWorkTag = new Set([
        "FIELD",
        "FSM",
        "FIELDWORK",
        "FIELD WORK",
      ]).has(String(tag).trim());

      const customerId = ticketDraft.customerId
        ? Number(ticketDraft.customerId)
        : null;
      const requesterEmail =
        String(ticketDraft.requesterEmail || "").trim() || null;
      const description = String(ticketDraft.description || "").trim() || null;
      const priority = String(ticketDraft.priority || "medium").trim();

      const payload = {
        subject,
        description,
        requesterEmail,
        customerId: Number.isFinite(customerId) ? customerId : null,
        priority,
      };

      if (isFieldWorkTag) {
        payload.autoCreateJobCard = !!ticketDraft.autoCreateJobCard;
      }

      createTicketMutation.mutate(payload);
    },
    [ticketDraft, createTicketMutation],
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#111827] flex items-center justify-center">
        <div className="text-[#6B7280] dark:text-[#9CA3AF]">Loading...</div>
      </div>
    );
  }

  if (!user || !company) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#111827] flex">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        company={company}
      />

      <div className="flex-1 flex flex-col lg:ml-0">
        <header className="bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                CRM
              </div>
              <h1 className="text-2xl lg:text-3xl font-semibold text-[#374151] dark:text-[#D1D5DB] truncate">
                Tasks
              </h1>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              <a
                href="/modules/crm/dashboard"
                className="px-4 py-2 rounded-full font-semibold border border-gray-200 dark:border-gray-700 text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Dashboard
              </a>
              <a
                href="/modules/crm"
                className="px-4 py-2 rounded-full font-semibold border border-gray-200 dark:border-gray-700 text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Customers
              </a>
              <a
                href="/modules/crm/deals"
                className="px-4 py-2 rounded-full font-semibold border border-gray-200 dark:border-gray-700 text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Deals
              </a>
              <button
<<<<<<< ours
                type="button"
                onClick={openTicket}
                className="px-4 py-2 rounded-full font-semibold border border-gray-200 dark:border-gray-700 text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-gray-800 inline-flex items-center gap-2"
              >
                <LifeBuoy size={18} />
                New ticket
              </button>
              <button
=======
                type="button"
                onClick={openTicket}
                className="px-4 py-2 rounded-full font-semibold border border-gray-200 dark:border-gray-700 text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-gray-800 inline-flex items-center gap-2"
              >
                <LifeBuoy size={18} />
                New Ticket
              </button>
              <button
>>>>>>> theirs
                onClick={() => setCreateOpen(true)}
                className="px-5 py-2 rounded-full font-semibold flex items-center gap-2"
                style={{ backgroundColor: BRAND_GRAY, color: BRAND_GRAY_LIGHT }}
              >
                <Plus size={18} />
                New task
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                size={18}
              />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#0B1220] border border-gray-200 dark:border-gray-700 rounded-xl text-[#374151] dark:text-[#D1D5DB] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter("open")}
                className={
                  statusFilter === "open"
                    ? "px-4 py-2 rounded-full font-semibold"
                    : "px-4 py-2 rounded-full font-semibold border border-gray-200 dark:border-gray-700 text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-gray-800"
                }
                style={
                  statusFilter === "open"
                    ? { backgroundColor: BRAND_GRAY, color: BRAND_GRAY_LIGHT }
                    : undefined
                }
              >
                Open
              </button>
              <button
                onClick={() => setStatusFilter("done")}
                className={
                  statusFilter === "done"
                    ? "px-4 py-2 rounded-full font-semibold"
                    : "px-4 py-2 rounded-full font-semibold border border-gray-200 dark:border-gray-700 text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-gray-800"
                }
                style={
                  statusFilter === "done"
                    ? { backgroundColor: BRAND_GRAY, color: BRAND_GRAY_LIGHT }
                    : undefined
                }
              >
                Done
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setMineOnly((v) => !v)}
                  className={
                    mineOnly
                      ? "px-4 py-2 rounded-full font-semibold"
                      : "px-4 py-2 rounded-full font-semibold border border-gray-200 dark:border-gray-700 text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-gray-800"
                  }
                  style={
                    mineOnly
                      ? { backgroundColor: BRAND_GRAY, color: BRAND_GRAY_LIGHT }
                      : undefined
                  }
                >
                  {mineOnly ? "My tasks" : "All tasks"}
                </button>

                {statusFilter === "open" ? (
                  <>
                    <button
                      onClick={() => setDueFilter(null)}
                      className={
                        !dueFilter
                          ? "px-4 py-2 rounded-full font-semibold"
                          : "px-4 py-2 rounded-full font-semibold border border-gray-200 dark:border-gray-700 text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-gray-800"
                      }
                      style={
                        !dueFilter
                          ? {
                              backgroundColor: BRAND_GRAY,
                              color: BRAND_GRAY_LIGHT,
                            }
                          : undefined
                      }
                    >
                      All open
                    </button>
                    <button
                      onClick={() => setDueFilter("today")}
                      className={
                        dueFilter === "today"
                          ? "px-4 py-2 rounded-full font-semibold"
                          : "px-4 py-2 rounded-full font-semibold border border-gray-200 dark:border-gray-700 text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-gray-800"
                      }
                      style={
                        dueFilter === "today"
                          ? {
                              backgroundColor: BRAND_GRAY,
                              color: BRAND_GRAY_LIGHT,
                            }
                          : undefined
                      }
                    >
                      Due today
                    </button>
                    <button
                      onClick={() => setDueFilter("overdue")}
                      className={
                        dueFilter === "overdue"
                          ? "px-4 py-2 rounded-full font-semibold"
                          : "px-4 py-2 rounded-full font-semibold border border-gray-200 dark:border-gray-700 text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-gray-800"
                      }
                      style={
                        dueFilter === "overdue"
                          ? {
                              backgroundColor: BRAND_GRAY,
                              color: BRAND_GRAY_LIGHT,
                            }
                          : undefined
                      }
                    >
                      Overdue
                    </button>
                    <button
                      onClick={() => setDueFilter("soon")}
                      className={
                        dueFilter === "soon"
                          ? "px-4 py-2 rounded-full font-semibold"
                          : "px-4 py-2 rounded-full font-semibold border border-gray-200 dark:border-gray-700 text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-gray-800"
                      }
                      style={
                        dueFilter === "soon"
                          ? {
                              backgroundColor: BRAND_GRAY,
                              color: BRAND_GRAY_LIGHT,
                            }
                          : undefined
                      }
                    >
                      Due soon
                    </button>
                  </>
                ) : null}
              </div>

              <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                {statusFilter === "open" && dueFilter
                  ? `Filtered: ${String(dueFilter)}`
                  : null}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-white dark:bg-[#111827]">
          {(companyQuery.isError ||
            customersQuery.isError ||
            tasksQuery.isError) && (
            <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-300">
              Could not load CRM tasks
            </div>
          )}

          {error ? (
            <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          ) : null}

          <TasksList
            tasks={filteredTasks}
            onToggleDone={onToggleDone}
            onDelete={onDeleteTask}
            togglingId={togglingId}
            deletingId={deletingId}
          />
        </main>
      </div>

      <CreateTaskModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={onCreateTask}
        saving={createTaskMutation.isPending}
        customers={customers}
        deals={deals}
      />

      <CreateTicketModal
        show={ticketOpen}
        error={ticketError}
        createDraft={ticketDraft}
        customers={customers}
        priorityOptions={ticketPriorityOptions}
        isCreating={createTicketMutation.isPending}
        onClose={closeTicket}
        onDraftChange={setTicketDraft}
        onCreate={onCreateTicket}
      />
    </div>
  );
}
