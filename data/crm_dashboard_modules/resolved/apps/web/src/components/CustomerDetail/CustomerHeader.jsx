import {
  Menu,
  FileText,
  ShoppingCart,
  Plus,
  HelpCircle,
  LifeBuoy,
} from "lucide-react";
import { BRAND_GRAY, BRAND_GRAY_LIGHT } from "@/components/Brand";
import { stagePillClass } from "./constants";

export function CustomerHeader({
  customer,
  stageLabel,
  stageKey,
  customerId,
  setSidebarOpen,
  setEditOpen,
  setTaskOpen,
  setQueryOpen,
  // Backwards-compatible: some pages may pass setTicketOpen(boolean)
  setTicketOpen,
  // Preferred: callback that opens the create-ticket modal
  onNewTicket,
}) {
  const createQuoteHref = `/modules/quotes?customerId=${encodeURIComponent(String(customerId))}&new=1`;
  const createSoHref = `/modules/sales-orders?customerId=${encodeURIComponent(String(customerId))}&new=1`;

  const showTicketButton = !!onNewTicket || !!setTicketOpen;
  const onTicketClick = () => {
    if (onNewTicket) {
      onNewTicket();
      return;
    }
    if (setTicketOpen) {
      setTicketOpen(true);
    }
  };

  return (
    <header className="bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors duration-200"
        >
          <Menu size={20} className="text-[#374151] dark:text-[#D1D5DB]" />
        </button>

        <div className="min-w-0">
          <div className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
            Customer
          </div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-[#374151] dark:text-[#D1D5DB] truncate">
            {customer.name}
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {showTicketButton ? (
            <button
              type="button"
              className="px-4 py-2 rounded-full font-semibold border border-gray-200 dark:border-gray-700 text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-gray-800 inline-flex items-center gap-2"
              onClick={onTicketClick}
              title="Create a helpdesk ticket"
            >
              <LifeBuoy size={18} />
              New ticket
            </button>
          ) : null}

          <button
            type="button"
            className="px-4 py-2 rounded-full font-semibold border border-gray-200 dark:border-gray-700 text-[#374151] dark:text-[#D1D5DB] hover:bg-gray-50 dark:hover:bg-gray-800 inline-flex items-center gap-2"
            onClick={() => (setQueryOpen ? setQueryOpen(true) : null)}
            title="Log a customer query"
          >
            <HelpCircle size={18} />
            Query
          </button>

          <a
            href={createQuoteHref}
            className="px-4 py-2 rounded-full font-semibold border border-gray-200 dark:border-gray-700 text-[#374151] dark:text-[#D1D5DB] hover:bg-gray-50 dark:hover:bg-gray-800 inline-flex items-center gap-2"
            title="Create a quote for this customer"
          >
            <FileText size={18} />
            Quote
          </a>
          <a
            href={createSoHref}
            className="px-4 py-2 rounded-full font-semibold border border-gray-200 dark:border-gray-700 text-[#374151] dark:text-[#D1D5DB] hover:bg-gray-50 dark:hover:bg-gray-800 inline-flex items-center gap-2"
            title="Create a sales order for this customer"
          >
            <ShoppingCart size={18} />
            Sales order
          </a>

          <button
            className="px-4 py-2 rounded-full font-semibold border border-gray-200 dark:border-gray-700 text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-gray-800 inline-flex items-center gap-2"
            onClick={() => setTaskOpen(true)}
          >
            <Plus size={18} />
            Task
          </button>

          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${stagePillClass(stageKey)}`}
          >
            {stageLabel}
          </span>
          <button
            className="px-4 py-2 rounded-full font-semibold"
            style={{ backgroundColor: BRAND_GRAY, color: BRAND_GRAY_LIGHT }}
            onClick={() => setEditOpen(true)}
          >
            Edit
          </button>
        </div>
      </div>
    </header>
  );
}
