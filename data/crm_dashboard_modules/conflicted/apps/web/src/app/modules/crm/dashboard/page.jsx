<<<<<<< ours
import React, { useCallback, useMemo, useState } from "react";
=======
import React, { useMemo, useState } from "react";
import { useCallback } from "react";
>>>>>>> theirs
import useUser from "@/utils/useUser";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { useCompany } from "@/hooks/useCompany";
import { useCustomers } from "@/hooks/useCustomers";
import { useCrmDashboard } from "@/hooks/useCrmDashboard";
import { useCustomers } from "@/hooks/useCustomers";
import { formatMoney } from "@/utils/formatMoney";
import { BRAND_GRAY, BRAND_GRAY_LIGHT } from "@/components/Brand";
<<<<<<< ours
import { CreateTicketModal } from "@/components/HelpDesk/CreateTicketModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/utils/fetchJson";
=======
import { CreateTicketModal } from "@/components/HelpDesk/CreateTicketModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/utils/fetchJson";
import { LifeBuoy } from "lucide-react";
>>>>>>> theirs
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LifeBuoy } from "lucide-react";

const DEFAULT_TICKET_DRAFT = {
  customerId: "",
  requesterEmail: "",
  areaTag: "",
  autoCreateJobCard: true,
  subject: "",
  description: "",
  priority: "medium",
};

function stageLabel(stage) {
  const s = String(stage || "").toLowerCase();
  if (s === "prospecting") return "Prospecting";
  if (s === "qualified") return "Qualified";
  if (s === "proposal") return "Proposal";
  if (s === "negotiation") return "Negotiation";
  if (s === "won") return "Won";
  if (s === "lost") return "Lost";
  return stage || "Stage";
}

function monthLabel(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

export default function CRMDashboardPage() {
  const { data: user, loading: userLoading } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

<<<<<<< ours
  const queryClient = useQueryClient();

=======
  const queryClient = useQueryClient();
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketDraft, setTicketDraft] = useState(DEFAULT_TICKET_DRAFT);
  const [ticketError, setTicketError] = useState(null);

>>>>>>> theirs
  const companyQuery = useCompany(user);
  const customersQuery = useCustomers(user);
  const dashboardQuery = useCrmDashboard(user);
  const customersQuery = useCustomers(user);

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

  const company = companyQuery.data?.company || null;
  const customers = customersQuery.data?.customers || [];
  const dashboard = dashboardQuery.data || null;
  const customers = customersQuery.data?.customers || [];

  const isLoading =
<<<<<<< ours
    userLoading ||
    companyQuery.isLoading ||
    customersQuery.isLoading ||
    dashboardQuery.isLoading;
=======
    userLoading ||
    companyQuery.isLoading ||
    dashboardQuery.isLoading ||
    customersQuery.isLoading;
>>>>>>> theirs

  const pipelineData = useMemo(() => {
    const rows = dashboard?.pipeline || [];
    return rows
      .map((r) => ({
        stage: stageLabel(r.stage),
        value: Number(r.value || 0),
        weightedValue: Number(r.weightedValue || 0),
        count: Number(r.count || 0),
      }))
      .sort((a, b) => b.weightedValue - a.weightedValue);
  }, [dashboard]);

  const winsData = useMemo(() => {
    const rows = dashboard?.winsByMonth || [];
    return rows.map((r) => ({
      month: monthLabel(r.month),
      wonValue: Number(r.wonValue || 0),
      wonCount: Number(r.wonCount || 0),
    }));
  }, [dashboard]);

  const totals = dashboard?.pipelineTotals || {
    value: 0,
    weightedValue: 0,
    count: 0,
  };
  const tasks = dashboard?.tasks || {
    open: 0,
    overdue: 0,
    dueToday: 0,
    dueSoon: 0,
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#111827] flex items-center justify-center">
        <div className="text-[#6B7280] dark:text-[#9CA3AF]">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#111827] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white dark:bg-[#0B1220] border border-gray-200 dark:border-gray-700 rounded-3xl p-6">
          <div className="text-lg font-semibold text-[#374151] dark:text-[#D1D5DB] mb-2">
            Sign in required
          </div>
          <div className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mb-4">
            Please sign in to view CRM dashboard.
          </div>
          <a
            href="/account/signin"
            className="inline-flex items-center justify-center px-5 py-2 rounded-full font-semibold"
            style={{ backgroundColor: BRAND_GRAY, color: BRAND_GRAY_LIGHT }}
          >
            Go to Sign in
          </a>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#111827] flex items-center justify-center">
        <div className="text-[#6B7280] dark:text-[#9CA3AF]">
          Company not found
        </div>
      </div>
    );
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
                Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
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
              <a
                href="/modules/crm/tasks"
                className="px-4 py-2 rounded-full font-semibold border border-gray-200 dark:border-gray-700 text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Tasks
              </a>
<<<<<<< ours
              <button
                type="button"
                onClick={openTicket}
                className="px-4 py-2 rounded-full font-semibold border border-gray-200 dark:border-gray-700 text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-gray-800 inline-flex items-center gap-2"
              >
                <LifeBuoy size={18} />
                New ticket
              </button>
=======

              <button
                type="button"
                onClick={openTicket}
                className="px-4 py-2 rounded-full font-semibold border border-gray-200 dark:border-gray-700 text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-gray-800 inline-flex items-center gap-2"
              >
                <LifeBuoy size={18} />
                New Ticket
              </button>
>>>>>>> theirs
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-white dark:bg-[#111827]">
          {dashboardQuery.isError ? (
            <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-300">
              Could not load CRM dashboard
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-[#0B1220] border border-gray-200 dark:border-gray-700 rounded-3xl p-5">
              <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                Pipeline value
              </div>
              <div className="mt-2 text-2xl font-semibold text-[#374151] dark:text-[#D1D5DB]">
                ${formatMoney(totals.value || 0)}
              </div>
              <div className="mt-1 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                {Number(totals.count || 0)} deals
              </div>
            </div>

            <div className="bg-white dark:bg-[#0B1220] border border-gray-200 dark:border-gray-700 rounded-3xl p-5">
              <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                Weighted pipeline
              </div>
              <div className="mt-2 text-2xl font-semibold text-[#374151] dark:text-[#D1D5DB]">
                ${formatMoney(totals.weightedValue || 0)}
              </div>
              <div className="mt-1 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                Stage-weighted estimate
              </div>
            </div>

            <div className="bg-white dark:bg-[#0B1220] border border-gray-200 dark:border-gray-700 rounded-3xl p-5">
              <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                Overdue tasks
              </div>
              <div className="mt-2 text-2xl font-semibold text-[#374151] dark:text-[#D1D5DB]">
                {Number(tasks.overdue || 0)}
              </div>
              <div className="mt-1 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                Due today: {Number(tasks.dueToday || 0)}
              </div>
            </div>

            <div className="bg-white dark:bg-[#0B1220] border border-gray-200 dark:border-gray-700 rounded-3xl p-5">
              <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                Open tasks
              </div>
              <div className="mt-2 text-2xl font-semibold text-[#374151] dark:text-[#D1D5DB]">
                {Number(tasks.open || 0)}
              </div>
              <div className="mt-1 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                Due soon (7d): {Number(tasks.dueSoon || 0)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#0B1220] border border-gray-200 dark:border-gray-700 rounded-3xl p-5">
              <div className="text-sm font-semibold text-[#374151] dark:text-[#D1D5DB] mb-1">
                Pipeline (weighted)
              </div>
              <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-4">
                Value by stage
              </div>
              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={pipelineData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value, name) => {
                        const n = Number(value || 0);
                        if (name === "weightedValue") {
                          return [`$${formatMoney(n)}`, "Weighted"];
                        }
                        if (name === "value") {
                          return [`$${formatMoney(n)}`, "Total"];
                        }
                        return [String(value), String(name)];
                      }}
                    />
                    <Bar
                      dataKey="weightedValue"
                      fill={BRAND_GRAY}
                      radius={[10, 10, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0B1220] border border-gray-200 dark:border-gray-700 rounded-3xl p-5">
              <div className="text-sm font-semibold text-[#374151] dark:text-[#D1D5DB] mb-1">
                Won deals (last 12 months)
              </div>
              <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-4">
                Monthly total
              </div>
              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={winsData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value, name) => {
                        const n = Number(value || 0);
                        if (name === "wonValue") {
                          return [`$${formatMoney(n)}`, "Won value"];
                        }
                        if (name === "wonCount") {
                          return [String(n), "Won deals"];
                        }
                        return [String(value), String(name)];
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="wonValue"
                      stroke={BRAND_GRAY}
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </main>
      </div>

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
