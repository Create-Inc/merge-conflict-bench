<<<<<<< ours
import React, { useCallback, useMemo, useState } from "react";
=======
import React, { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/utils/fetchJson";
>>>>>>> theirs
import useUser from "@/utils/useUser";
import { useCustomerDetailData } from "@/hooks/useCustomerDetailData";
import { useCustomerDetailActions } from "@/hooks/useCustomerDetailActions";
import { useCustomerQueryMutations } from "@/hooks/useCustomerQueryMutations";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/utils/fetchJson";
import CreateTaskModal from "@/components/CRM/CreateTaskModal";
import { BRAND_GRAY, BRAND_GRAY_LIGHT } from "@/components/Brand";
import { normalizeStage } from "@/components/CustomerDetail/constants";
import { EditCustomerModal } from "@/components/CustomerDetail/EditCustomerModal";
import { CustomerSidebar } from "@/components/CustomerDetail/CustomerSidebar";
import { CustomerHeader } from "@/components/CustomerDetail/CustomerHeader";
import { CustomerInfoCard } from "@/components/CustomerDetail/CustomerInfoCard";
import { ActivityTimeline } from "@/components/CustomerDetail/ActivityTimeline";
import { TasksSection } from "@/components/CustomerDetail/TasksSection";
import { LinkedDocumentsSection } from "@/components/CustomerDetail/LinkedDocumentsSection";
import { STAGES } from "@/components/CustomerDetail/constants";
import { ContactsSection } from "@/components/CustomerDetail/ContactsSection";
import AttachmentsSection from "@/components/CRM/AttachmentsSection";
import CustomerQueriesSection from "@/components/CustomerQueries/CustomerQueriesSection";
import CustomerQueryModal from "@/components/CustomerQueries/CustomerQueryModal";
import { CreateTicketModal } from "@/components/HelpDesk/CreateTicketModal";

const DEFAULT_TICKET_DRAFT = {
  customerId: "",
  requesterEmail: "",
  areaTag: "",
  autoCreateJobCard: true,
  subject: "",
  description: "",
  priority: "medium",
};

export default function CustomerDetailPage({ params }) {
  const customerId = params?.id;
  const { data: user, loading: userLoading } = useUser();

  const queryClient = useQueryClient();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [queryOpen, setQueryOpen] = useState(false);

<<<<<<< ours
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketDraft, setTicketDraft] = useState(DEFAULT_TICKET_DRAFT);
  const [ticketError, setTicketError] = useState(null);

  const ticketPriorityOptions = ["low", "medium", "high"];

=======
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketDraft, setTicketDraft] = useState(DEFAULT_TICKET_DRAFT);
  const [ticketError, setTicketError] = useState(null);

>>>>>>> theirs
  const {
    company,
    customer,
    quotes,
    salesOrders,
    invoices,
    activities,
    deals,
    tasks,
    customerQueries,
    customerQueriesQuery,
    isLoading,
    pageError,
    createActivityMutation,
  } = useCustomerDetailData(user, customerId);

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

    const name = customer?.name ? String(customer.name) : "";
    const subject = name ? `Customer: ${name}` : "";

    setTicketDraft({
      ...DEFAULT_TICKET_DRAFT,
      customerId: customer?.id ? String(customer.id) : "",
      subject,
    });

    setTicketOpen(true);
  }, [customer]);

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

      const customerIdNum = ticketDraft.customerId
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
        customerId: Number.isFinite(customerIdNum) ? customerIdNum : null,
        priority,
      };

      if (isFieldWorkTag) {
        payload.autoCreateJobCard = !!ticketDraft.autoCreateJobCard;
      }

      createTicketMutation.mutate(payload);
    },
    [ticketDraft, createTicketMutation],
  );

  const { createCustomerQueryMutation } = useCustomerQueryMutations();

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

  const ticketPriorityOptions = ["low", "medium", "high"];

  const {
    onSaveCustomer,
    editSaving,
    activityType,
    setActivityType,
    activitySubject,
    setActivitySubject,
    activityBody,
    setActivityBody,
    activityError,
    onAddActivity,
    addActivitySaving,
    onCreateTask,
    onToggleDone,
    onDeleteTask,
    taskError,
    togglingTaskId,
    deletingTaskId,
    createTaskSaving,
  } = useCustomerDetailActions(customerId, createActivityMutation);

  const stageKey = useMemo(
    () => normalizeStage(customer?.status),
    [customer?.status],
  );

  const stageLabel = useMemo(() => {
    const found = STAGES.find((s) => s.key === stageKey);
    return found ? found.label : "Inactive";
  }, [stageKey]);

  const handleSaveCustomer = (payload) => {
    onSaveCustomer(payload);
    setEditOpen(false);
  };

  const handleCreateTask = (payload) => {
    onCreateTask(payload);
    setTaskOpen(false);
  };

  const openTicket = (next) => {
    if (!next) {
      setTicketOpen(false);
      setTicketError(null);
      setTicketDraft(DEFAULT_TICKET_DRAFT);
      return;
    }

    setTicketError(null);
    const cid = customer?.id ? String(customer.id) : "";
    setTicketDraft({ ...DEFAULT_TICKET_DRAFT, customerId: cid });
    setTicketOpen(true);
  };

  const onCreateTicket = (e) => {
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

    const cid = ticketDraft.customerId ? Number(ticketDraft.customerId) : null;
    const requesterEmail =
      String(ticketDraft.requesterEmail || "").trim() || null;
    const description = String(ticketDraft.description || "").trim() || null;
    const priority = String(ticketDraft.priority || "medium").trim();

    const payload = {
      subject,
      description,
      requesterEmail,
      customerId: Number.isFinite(cid) ? cid : null,
      priority,
    };

    if (isFieldWorkTag) {
      payload.autoCreateJobCard = !!ticketDraft.autoCreateJobCard;
    }

    createTicketMutation.mutate(payload);
  };

  if (isLoading || userLoading) {
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
            Please sign in to view CRM customer details.
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

  if (!company || !customer) {
    const message = pageError
      ? "Could not load customer"
      : "Customer not found";

    return (
      <div className="min-h-screen bg-white dark:bg-[#111827] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white dark:bg-[#0B1220] border border-gray-200 dark:border-gray-700 rounded-3xl p-6">
          <div className="text-lg font-semibold text-[#374151] dark:text-[#D1D5DB] mb-2">
            {message}
          </div>
          <a
            href="/modules/crm"
            className="inline-flex items-center justify-center px-5 py-2 rounded-full font-semibold"
            style={{ backgroundColor: BRAND_GRAY, color: BRAND_GRAY_LIGHT }}
          >
            Back to CRM
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#111827] flex">
      <CustomerSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        company={company}
      />

      <div className="flex-1 flex flex-col lg:ml-0">
        <CustomerHeader
          customer={customer}
          stageLabel={stageLabel}
          stageKey={stageKey}
          customerId={customerId}
          setSidebarOpen={setSidebarOpen}
          setEditOpen={setEditOpen}
          setTaskOpen={setTaskOpen}
          setQueryOpen={setQueryOpen}
<<<<<<< ours
          onNewTicket={openTicket}
=======
          setTicketOpen={(v) => openTicket(v)}
>>>>>>> theirs
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-white dark:bg-[#111827]">
          {pageError && (
            <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-300">
              Could not load some customer data.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            <CustomerInfoCard customer={customer} />

            <ActivityTimeline
              activities={activities}
              activityType={activityType}
              setActivityType={setActivityType}
              activitySubject={activitySubject}
              setActivitySubject={setActivitySubject}
              activityBody={activityBody}
              setActivityBody={setActivityBody}
              activityError={activityError}
              onAddActivity={onAddActivity}
              addActivitySaving={addActivitySaving}
            />

            <TasksSection
              tasks={tasks}
              taskError={taskError}
              onToggleDone={onToggleDone}
              onDeleteTask={onDeleteTask}
              togglingTaskId={togglingTaskId}
              deletingTaskId={deletingTaskId}
            />

            <LinkedDocumentsSection
              quotes={quotes}
              salesOrders={salesOrders}
              invoices={invoices}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            <ContactsSection customerId={customerId} />
            <div className="lg:col-span-3">
              <AttachmentsSection
                title="Customer attachments"
                subtitle="Files and links for this customer"
                entityType="customer"
                entityId={customer.id}
              />
            </div>
          </div>

          <div className="mt-6">
            <CustomerQueriesSection
              queries={customerQueries}
              loading={customerQueriesQuery?.isLoading}
              error={customerQueriesQuery?.isError}
              onNew={() => setQueryOpen(true)}
              contextLabel="Sales, billing, support, and training queries (with optional routing)"
            />
          </div>
        </main>
      </div>

      <EditCustomerModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        customer={customer}
        saving={editSaving}
        onSave={handleSaveCustomer}
      />

      <CreateTaskModal
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        onCreate={handleCreateTask}
        saving={createTaskSaving}
        customers={[customer]}
        deals={deals}
        defaultCustomerId={customer?.id}
      />

      <CustomerQueryModal
        open={queryOpen}
        onClose={() => setQueryOpen(false)}
        context={{
          sourceSystem: "crm",
          defaultCustomerId: Number(customer?.id),
        }}
        customers={[]}
        fixedCustomer={{ id: Number(customer?.id), name: customer?.name }}
        createMutation={createCustomerQueryMutation}
      />
<<<<<<< ours

      <CreateTicketModal
        show={ticketOpen}
        error={ticketError}
        createDraft={ticketDraft}
        customers={customer ? [customer] : []}
        priorityOptions={ticketPriorityOptions}
        isCreating={createTicketMutation.isPending}
        onClose={closeTicket}
        onDraftChange={setTicketDraft}
        onCreate={onCreateTicket}
      />
=======

      <CreateTicketModal
        show={ticketOpen}
        error={ticketError}
        createDraft={ticketDraft}
        customers={customer ? [customer] : []}
        priorityOptions={ticketPriorityOptions}
        isCreating={createTicketMutation.isPending}
        onClose={() => openTicket(false)}
        onDraftChange={setTicketDraft}
        onCreate={onCreateTicket}
      />
>>>>>>> theirs
    </div>
  );
}
