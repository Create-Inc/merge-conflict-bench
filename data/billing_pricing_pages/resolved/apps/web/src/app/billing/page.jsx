"use client";

import { useCallback, useMemo, useState } from "react";
import { useTheme, getThemeClasses } from "../../utils/useTheme";
import { Sidebar } from "../../components/Tradeshow/Sidebar";
import { MainHeader } from "../../components/Tradeshow/MainHeader";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useBillingStatus from "../../utils/useBillingStatus";
import { Sparkles, ShieldCheck, ArrowRight, BadgeCheck } from "lucide-react";

const BASE_PLANS = [
  {
    key: "pro_monthly",
    title: "All-access",
    price: "$99",
    cadence: "per month",
    note: "Billed monthly • Cancel anytime",
  },
  {
    key: "pro_annual",
    title: "All-access (Annual)",
    price: "$999",
    cadence: "per year",
    note: "Billed annually • 2 months free",
  },
];

const CONCIERGE_PLAN = {
  key: "concierge_monthly",
  title: "Concierge add-on",
  price: "$299",
  cadence: "per month",
  note: "White-glove help when you need it",
};

function FeatureList({ title, items, colors }) {
  return (
    <div
      className={`${colors.bg.card} border ${colors.border.primary} rounded-xl p-5`}
    >
      <div className={`font-semibold ${colors.text.primary}`}>{title}</div>
      <ul className={`mt-3 space-y-2 text-sm ${colors.text.secondary}`}>
        {items.map((x) => (
          <li key={x} className="flex gap-2">
            <BadgeCheck size={16} className="text-[#6B6CF6] mt-0.5" />
            <span>{x}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function BillingPage() {
  const { theme } = useTheme();
  const colors = getThemeClasses(theme);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: billing, isLoading: billingLoading } = useBillingStatus({
    enabled: true,
  });

  const trialActive = Boolean(billing?.trial?.active);
  const trialDaysLeft = billing?.trial?.daysLeft;
  const needsPlanSelection = Boolean(billing?.needsPlanSelection);

  const [selectedBase, setSelectedBase] = useState("pro_monthly");
  const [wantsConcierge, setWantsConcierge] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [error, setError] = useState(null);

  const startCheckoutMutation = useMutation({
    mutationFn: async ({ planKey }) => {
      setError(null);
      const r = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planKey,
          promoCode: promoCode.trim() || null,
        }),
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        const msg =
          typeof data?.error === "string"
            ? data.error
            : `When posting /api/billing/checkout, the response was [${r.status}] ${r.statusText}`;
        throw new Error(msg);
      }

      return data;
    },
    onSuccess: async (data) => {
      const url = data?.url ? String(data.url) : null;
      if (!url) {
        setError("Checkout link was not returned. Please try again.");
        return;
      }

      // Open in a popup so it works inside the Anything builder iframe.
      window.open(url, "_blank", "popup");

      await queryClient.invalidateQueries({ queryKey: ["billing-status"] });
    },
    onError: (e) => {
      console.error(e);
      setError(e instanceof Error ? e.message : "Could not start checkout");
    },
  });

  const isBusy = startCheckoutMutation.isPending;

  const assistantDescription = useMemo(() => {
    return [
      "A quiet, intelligent layer that works in the background — not a chatbot, and not a manual service.",
      "Helps users find information, settings, and features across the platform.",
      "Monitors shows for missing, inconsistent, or incomplete info and highlights items that may need attention.",
      "Reviews uploaded or forwarded documents (invoices, receipts, shipping confirmations, exhibitor kits, etc.) and helps with data entry + routing into the correct show.",
      "Surfaces potential issues or gaps early so teams can address them before they become problems.",
      "Assists with logistics, timelines, budgeting, and best practices.",
      "Supports forwarding via email so teams can send documents into the system to be reviewed and placed appropriately.",
    ];
  }, []);

  const allAccessIncludes = useMemo(() => {
    return [
      "Unlimited shows",
      "Unlimited team seats/users",
      "Task and timeline management per show",
      "Team assignments and responsibility tracking",
      "Travel + logistics tracking (flights, hotels, shipping, schedules)",
      "Budget + expense tracking per show and across shows",
      "Lead capture, enrichment, and reporting",
      "ROI + performance reports",
      "Inventory and shipping management",
      "Automatic document uploads and attachments",
      "Team communication and notifications",
      "Role-based permissions (optional / future-ready)",
      "Standard support (email + in-app)",
      "360 Assistant (included)",
    ];
  }, []);

  const conciergeIncludes = useMemo(() => {
    return [
      "Bookings support",
      "Vendor coordination",
      "Advice + troubleshooting",
      "Data entry help when needed",
      "Slack/email/text escalation channel",
      "White-glove onboarding",
    ];
  }, []);

  const onBuy = useCallback(
    async (planKey) => {
      startCheckoutMutation.mutate({ planKey });
    },
    [startCheckoutMutation],
  );

  const trialBannerText = useMemo(() => {
    if (!trialActive) return null;
    if (typeof trialDaysLeft !== "number") return "Your free trial is active.";

    const dayLabel = trialDaysLeft === 1 ? "day" : "days";
    return `Free trial: ${trialDaysLeft} ${dayLabel} left`;
  }, [trialActive, trialDaysLeft]);

  return (
    <div
      className={`min-h-screen ${colors.bg.primary} font-inter transition-colors duration-200 overflow-x-hidden`}
    >
      <div className="mx-auto w-full max-w-[1440px] lg:p-6">
        <div className="flex flex-col md:flex-row min-h-screen w-full lg:rounded-2xl lg:overflow-hidden">
          <Sidebar isSidebarOpen={isSidebarOpen} activeSection="billing" />

          <div className={`flex-1 min-w-0 ${colors.bg.secondary} p-8 md:p-12`}>
            <MainHeader
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              title="Billing"
            />

            <div className="max-w-5xl">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className={`text-2xl font-semibold ${colors.text.primary}`}>
                    Choose your plan
                  </h2>
                  <p className={`mt-1 text-sm ${colors.text.secondary}`}>
                    7-day free trial (no card) → then pick a plan to keep access.
                  </p>
                </div>

                {trialBannerText ? (
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-[#6B6CF6]/10 border border-[#6B6CF6]/30 text-[#6B6CF6] text-sm font-semibold">
                    <ShieldCheck size={16} />
                    {trialBannerText}
                  </div>
                ) : null}
              </div>

              {needsPlanSelection && !trialActive ? (
                <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <div className="font-semibold text-amber-200">
                    Your trial has ended
                  </div>
                  <div className="mt-1 text-sm text-amber-200/80">
                    Pick a plan below to keep access.
                  </div>
                </div>
              ) : null}

              {error ? (
                <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div
                    className={`${colors.bg.card} border ${colors.border.primary} rounded-2xl p-6`}
                  >
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9333EA] to-[#6D28D9] flex items-center justify-center">
                          <Sparkles size={18} className="text-white" />
                        </div>
                        <div>
                          <div className={`font-semibold ${colors.text.primary}`}>
                            Tradeshow360 All-access
                          </div>
                          <div className={`text-xs ${colors.text.secondary}`}>
                            One plan. Everything included.
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {BASE_PLANS.map((p) => {
                        const isSelected = selectedBase === p.key;
                        const borderClass = isSelected
                          ? "border-[#6B6CF6]"
                          : colors.border.primary;
                        const ringClass = isSelected
                          ? "ring-1 ring-[#6B6CF6]/60"
                          : "";
                        return (
                          <button
                            key={p.key}
                            type="button"
                            onClick={() => setSelectedBase(p.key)}
                            className={`text-left rounded-xl border ${borderClass} ${ringClass} ${colors.bg.tertiary} p-4 hover:border-[#6B6CF6]/60 transition-colors`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className={`font-semibold ${colors.text.primary}`}>
                                  {p.title}
                                </div>
                                <div className={`text-xs ${colors.text.secondary} mt-1`}>
                                  {p.note}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`text-xl font-bold ${colors.text.primary}`}>
                                  {p.price}
                                </div>
                                <div className={`text-xs ${colors.text.secondary}`}>
                                  {p.cadence}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-5 flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={wantsConcierge}
                        onChange={(e) => setWantsConcierge(e.target.checked)}
                        className="mt-1"
                      />
                      <div className="min-w-0">
                        <div className={`font-semibold ${colors.text.primary}`}>
                          Add Concierge (+$299/mo)
                        </div>
                        <div className={`text-sm ${colors.text.secondary} mt-1`}>
                          White-glove help for bookings, vendors, troubleshooting,
                          escalation, and onboarding.
                        </div>
                      </div>
                    </div>

                    <div className="mt-5">
                      <label className={`text-xs font-medium ${colors.text.secondary}`}>
                        Promo code (optional)
                      </label>
                      <input
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="e.g. LAUNCH50"
                        className={`mt-1 w-full h-10 px-3 rounded-lg ${colors.bg.input} border ${colors.border.primary} ${colors.text.primary} text-sm focus:outline-none focus:border-[#6B6CF6]`}
                      />
                      <div className={`mt-2 text-xs ${colors.text.tertiary}`}>
                        Promo codes apply to the plan you’re purchasing.
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={() => onBuy(selectedBase)}
                        disabled={isBusy}
                        className="h-11 px-4 rounded-lg bg-[#6B6CF6] hover:bg-[#5C5DF0] disabled:opacity-60 text-white font-semibold inline-flex items-center justify-center gap-2"
                      >
                        Continue to checkout
                        <ArrowRight size={16} />
                      </button>

                      {wantsConcierge ? (
                        <button
                          type="button"
                          onClick={() => onBuy(CONCIERGE_PLAN.key)}
                          disabled={isBusy}
                          className={`h-11 px-4 rounded-lg border ${colors.border.primary} ${colors.bg.tertiary} ${colors.bg.hover} ${colors.text.primary} font-semibold inline-flex items-center justify-center gap-2`}
                          title="Concierge is purchased as an add-on"
                        >
                          Checkout concierge add-on
                          <ArrowRight size={16} />
                        </button>
                      ) : null}
                    </div>

                    {billingLoading ? (
                      <div className={`mt-4 text-xs ${colors.text.tertiary}`}>
                        Loading your billing status…
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-4">
                  <FeatureList
                    title="All-access includes"
                    items={allAccessIncludes}
                    colors={colors}
                  />
                  <FeatureList
                    title="360 Assistant"
                    items={assistantDescription}
                    colors={colors}
                  />
                  <FeatureList
                    title="Concierge add-on includes"
                    items={conciergeIncludes}
                    colors={colors}
                  />
                </div>
              </div>

              <div className={`mt-10 text-xs ${colors.text.tertiary}`}>
                Note: Checkout opens in a new window. After payment, you’ll be
                returned here and your access will update.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
