"use client";

import {
  Sparkles,
  ArrowRight,
  BadgeCheck,
  CheckSquare,
  Users,
  Plane,
  DollarSign,
  Target,
  TrendingUp,
  Package,
  Truck,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme, getThemeClasses } from "@/utils/useTheme";

function Bullet({ text }) {
  const { theme } = useTheme();
  const colors = getThemeClasses(theme);
  return (
    <div className="flex gap-2">
      <BadgeCheck size={16} className="text-[#6B6CF6] mt-0.5" />
      <div className={`text-sm ${colors.text.secondary}`}>{text}</div>
    </div>
  );
}

function PlanCard({ title, price, cadence, note, ctaHref, ctaLabel }) {
  const { theme } = useTheme();
  const colors = getThemeClasses(theme);

  return (
    <div
      className={`${colors.bg.card} border ${colors.border.primary} rounded-2xl p-6 ${colors.shadow}`}
    >
      <div className={`text-lg font-semibold ${colors.text.primary}`}>
        {title}
      </div>
      <div className="mt-3 flex items-end gap-2">
        <div className={`text-4xl font-bold ${colors.text.primary}`}>
          {price}
        </div>
        <div className={`text-sm ${colors.text.secondary} pb-1`}>{cadence}</div>
      </div>
      {note ? (
        <div className={`mt-2 text-xs ${colors.text.tertiary}`}>{note}</div>
      ) : null}
      <a href={ctaHref} className="mt-6 inline-flex w-full">
        <button className="w-full h-11 rounded-lg text-white bg-gradient-to-r from-[#9333EA] to-[#7C3AED] hover:shadow-xl hover:shadow-[#9333EA]/20 text-sm font-semibold transition-all inline-flex items-center justify-center gap-2">
          {ctaLabel}
          <ArrowRight size={18} />
        </button>
      </a>
    </div>
  );
}

export default function PricingPage() {
  const { theme } = useTheme();
  const colors = getThemeClasses(theme);

  const signupHref = "/account/signup?callbackUrl=%2Fdashboard";

  return (
    <div
      className={`min-h-screen ${colors.bg.primary} font-inter ${colors.text.primary} transition-colors duration-200`}
    >
      <nav
        className={`border-b ${colors.border.primary} ${colors.bg.secondary} backdrop-blur-lg fixed w-full top-0 z-50 transition-colors duration-200`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#9333EA] to-[#7C3AED] flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold">TradeShow 360</span>
          </a>
          <div className="flex items-center gap-6">
            <ThemeToggle />
            <a href={signupHref}>
              <button className="px-4 py-2 rounded-lg text-white bg-[#9333EA] hover:bg-[#7C3AED] text-sm font-semibold transition-colors">
                Start Free Trial
              </button>
            </a>
          </div>
        </div>
      </nav>

      <section className="pt-28 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#6B6CF6]/10 border border-[#6B6CF6]/30 text-[#6B6CF6] text-sm font-medium">
              <ShieldCheck size={16} />
              7-day free trial • No credit card
            </div>
            <h1
              className={`mt-6 text-4xl md:text-5xl font-bold ${colors.text.primary}`}
            >
              Simple pricing for exhibitor teams
            </h1>
            <p className={`mt-4 text-lg ${colors.text.secondary}`}>
              One all-access plan, plus an optional concierge add-on.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <PlanCard
              title="All-access"
              price="$99"
              cadence="/ month"
              note="Per company • Unlimited seats"
              ctaHref={signupHref}
              ctaLabel="Start free trial"
            />
            <PlanCard
              title="All-access (Annual)"
              price="$999"
              cadence="/ year"
              note="Billed annually upfront • 2 months free"
              ctaHref={signupHref}
              ctaLabel="Start free trial"
            />
            <PlanCard
              title="Concierge add-on"
              price="$299"
              cadence="/ month"
              note="Add-on • White-glove support & escalation"
              ctaHref={signupHref}
              ctaLabel="Start free trial"
            />
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div
              className={`${colors.bg.card} border ${colors.border.primary} rounded-2xl p-6 ${colors.shadow}`}
            >
              <div className={`text-lg font-semibold ${colors.text.primary}`}>
                All-access includes
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Bullet text="Unlimited shows" />
<<<<<<< ours
                <Bullet text="Unlimited seats/users" />
                <Bullet text="Task and timeline management per show" />
                <Bullet text="Team assignments and responsibility tracking" />
                <Bullet text="Travel + logistics tracking (flights, hotels, shipping, schedules)" />
                <Bullet text="Budget + expense tracking per show and across shows" />
=======
                <Bullet text="Unlimited team seats/users" />
                <Bullet text="Task and timeline management per show" />
                <Bullet text="Team assignments and responsibility tracking" />
                <Bullet text="Travel and logistics tracking (flights, hotels, shipping, schedules)" />
                <Bullet text="Budget and expense tracking per show and across shows" />
>>>>>>> theirs
                <Bullet text="Lead capture, enrichment, and reporting" />
<<<<<<< ours
                <Bullet text="ROI + performance reports" />
                <Bullet text="Inventory and shipping management" />
                <Bullet text="Automatic document uploads and attachments" />
                <Bullet text="Team communication and notifications" />
                <Bullet text="Role-based permissions (optional / future-ready)" />
                <Bullet text="Standard support (email + in-app)" />
                <Bullet text="360 Assistant (included)" />
=======
                <Bullet text="ROI and performance reports" />
                <Bullet text="Inventory and shipping management" />
                <Bullet text="Automatic document uploads and attachments" />
                <Bullet text="Team communication and notifications" />
                <Bullet text="Role-based permissions (optional / future-ready)" />
                <Bullet text="Standard support (email and in-app)" />
                <Bullet text="360 Assistant (included)" />
>>>>>>> theirs
              </div>
            </div>

            <div
              className={`${colors.bg.card} border ${colors.border.primary} rounded-2xl p-6 ${colors.shadow}`}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-[#6B6CF6]" />
                <div className={`text-lg font-semibold ${colors.text.primary}`}>
                  360 Assistant (included)
                </div>
              </div>
              <p className={`mt-3 text-sm ${colors.text.secondary}`}>
<<<<<<< ours
                A quiet, intelligent layer that works in the background to help
                your team stay organized, accurate, and on track — not a
                chatbot, and not a manual service.
=======
                A quiet, intelligent layer that works in the background to help
                teams stay organized, accurate, and on track — not a chatbot,
                and not a manual service. It’s optional to use, but always there
                when you want it.
>>>>>>> theirs
              </p>
              <div className="mt-4 space-y-3">
<<<<<<< ours
                <Bullet text="Helps users find information, settings, and features across the platform" />
                <Bullet text="Monitors shows for missing, inconsistent, or incomplete info and highlights items that may need attention" />
                <Bullet text="Reviews uploaded or forwarded documents (invoices, receipts, shipping confirmations, exhibitor kits, etc.) and helps with data entry + routing into the correct show" />
                <Bullet text="Surfaces potential issues or gaps early so teams can fix them before they become problems" />
                <Bullet text="Assists with logistics, timelines, budgeting, and best practices" />
                <Bullet text="Supports forwarding via email so teams can send documents into the system to be reviewed and placed appropriately" />
=======
                <Bullet text="Helps users find information, settings, and features across the platform" />
                <Bullet text="Monitors shows for missing, inconsistent, or incomplete information and highlights items that may need attention" />
                <Bullet text="Reviews uploaded or forwarded documents (invoices, receipts, shipping confirmations, exhibitor kits, etc.)" />
                <Bullet text="Helps with data entry and organizes documents into the correct show" />
                <Bullet text="Surfaces gaps early so teams can fix issues before they become problems" />
                <Bullet text="Supports forwarding via email so users can forward documents into the system to be reviewed and placed appropriately" />
>>>>>>> theirs
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div
              className={`${colors.bg.card} border ${colors.border.primary} rounded-2xl p-6 ${colors.shadow} lg:col-span-2`}
            >
              <div className={`text-lg font-semibold ${colors.text.primary}`}>
                Built for modern trade show execution
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MiniFeature
                  icon={CheckSquare}
                  title="Tasks"
                  text="Assign work, track progress, and keep the team aligned."
                />
                <MiniFeature
                  icon={Plane}
                  title="Travel"
                  text="Track flights, hotels, and confirmations in one place."
                />
                <MiniFeature
                  icon={DollarSign}
                  title="Budgets"
                  text="Stay on budget with receipts, totals, and rollups."
                />
                <MiniFeature
                  icon={Target}
                  title="Lead capture"
                  text="Capture contacts fast and follow up with context."
                />
                <MiniFeature
                  icon={TrendingUp}
                  title="ROI"
                  text="Understand what each show produced and why."
                />
                <MiniFeature
                  icon={Package}
                  title="Inventory"
                  text="Track booth gear, shipments, and what’s where."
                />
              </div>
            </div>

            <div
              className={`${colors.bg.card} border ${colors.border.primary} rounded-2xl p-6 ${colors.shadow}`}
            >
              <div className={`text-lg font-semibold ${colors.text.primary}`}>
                Concierge add-on
              </div>
              <div className={`mt-2 text-sm ${colors.text.secondary}`}>
                Extra help when you want a real person to handle details.
              </div>
              <div className="mt-4 space-y-3">
                <Bullet text="Bookings" />
                <Bullet text="Vendor coordination" />
                <Bullet text="Advice + troubleshooting" />
                <Bullet text="Data entry if needed" />
                <Bullet text="Slack/email/text escalation" />
                <Bullet text="White-glove onboarding" />
              </div>
            </div>
          </div>

          <div className="mt-14 text-center">
            <a href={signupHref}>
              <button className="px-8 py-4 rounded-lg text-white bg-gradient-to-r from-[#9333EA] to-[#7C3AED] hover:shadow-xl hover:shadow-[#9333EA]/20 text-base font-semibold transition-all inline-flex items-center gap-2">
                Start Free Trial
                <ArrowRight size={20} />
              </button>
            </a>
            <div className={`mt-3 text-sm ${colors.text.tertiary}`}>
              No credit card required • Full access for 7 days
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniFeature({ icon: Icon, title, text }) {
  const { theme } = useTheme();
  const colors = getThemeClasses(theme);

  return (
    <div
      className={`flex items-start gap-3 ${colors.bg.tertiary} border ${colors.border.primary} rounded-xl p-4`}
    >
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#6B6CF6] to-[#5C5DF0] flex items-center justify-center shrink-0">
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <div className={`font-semibold ${colors.text.primary}`}>{title}</div>
        <div className={`mt-1 text-sm ${colors.text.secondary}`}>{text}</div>
      </div>
    </div>
  );
}
