import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Menu } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Avatar from "../Avatar";
import { NotificationBell } from "../Notifications/NotificationBell";
import { ThemeToggle } from "../ThemeToggle";
import { useTheme, getThemeClasses } from "../../utils/useTheme";
import useBillingStatus from "../../utils/useBillingStatus";

export function MainHeader({
  isSidebarOpen,
  onToggleSidebar,
  title,
  showBack = false,
  onBack,
}) {
  const { theme } = useTheme();
  const colors = getThemeClasses(theme);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const r = await fetch("/api/me");
      if (!r.ok) {
        return { user: null, employee: null };
      }
      return r.json();
    },
    staleTime: 1000 * 30,
  });

  const employee = meData?.employee || null;

  const { data: billing } = useBillingStatus({
    enabled: Boolean(meData?.user?.email),
  });

  const trialActive = Boolean(billing?.trial?.active);
  const trialDaysLeft = billing?.trial?.daysLeft;
  const needsPlanSelection = Boolean(billing?.needsPlanSelection);

  const showTrialChip =
    trialActive && typeof trialDaysLeft === "number" && trialDaysLeft <= 3;

  const trialChipText = useMemo(() => {
    if (!showTrialChip) return null;
    const dayLabel = trialDaysLeft === 1 ? "day" : "days";
    return `All-access trial: ${trialDaysLeft} ${dayLabel} left`;
  }, [showTrialChip, trialDaysLeft]);

  const billingChipText = useMemo(() => {
    if (needsPlanSelection && !trialActive) {
      return "Choose a plan to continue";
    }
    return null;
  }, [needsPlanSelection, trialActive]);

  const avatarName = useMemo(() => {
    const n = String(employee?.name || "").trim();
    if (n) return n;
    const email = String(meData?.user?.email || "").trim();
    return email;
  }, [employee?.name, meData?.user?.email]);

  const menuTitle = useMemo(() => {
    const n = String(employee?.name || "").trim();
    if (n) return n;
    return "Signed in";
  }, [employee?.name]);

  const menuEmail = useMemo(() => {
    const e = String(employee?.email || "").trim();
    if (e) return e;
    return String(meData?.user?.email || "").trim();
  }, [employee?.email, meData?.user?.email]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuRef.current) return;
      const target = e.target;
      if (target && menuRef.current.contains(target)) {
        return;
      }
      setMenuOpen(false);
    };

    if (menuOpen) {
      document.addEventListener("mousedown", onDocClick);
    }

    return () => {
      document.removeEventListener("mousedown", onDocClick);
    };
  }, [menuOpen]);

  return (
    <header className="flex justify-between items-center mb-8 flex-wrap gap-4">
      <div className="flex items-center gap-3">
        <button
          className={`md:hidden ${colors.text.primary}`}
          onClick={onToggleSidebar}
        >
          <Menu size={20} />
        </button>
        {showBack ? (
          <button
            onClick={onBack}
            className={`${colors.text.primary} hover:opacity-80`}
          >
            <ChevronLeft size={20} />
          </button>
        ) : null}
        {title ? (
          <h1
            className={`text-lg leading-[22px] font-semibold ${colors.text.primary}`}
          >
            {title}
          </h1>
        ) : null}
      </div>

      <div className="flex items-center gap-3 flex-wrap justify-end">
        {billingChipText ? (
          <a
            href="/billing"
            className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/20"
            title="Billing"
          >
            {billingChipText}
          </a>
        ) : null}

        {trialChipText ? (
          <a
            href="/billing"
            className="inline-flex items-center rounded-full border border-[#6B6CF6]/30 bg-[#6B6CF6]/10 px-3 py-1.5 text-xs font-semibold text-[#6B6CF6] hover:bg-[#6B6CF6]/20"
            title="All-access trial (concierge is separate)"
          >
            {trialChipText}
          </a>
        ) : null}

        <ThemeToggle />
        <NotificationBell />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-full focus:outline-none"
            aria-label="User menu"
          >
            <Avatar
              src={employee?.avatar_url || null}
              name={avatarName}
              size="sm"
              className="border border-[#2E303A]"
            />
          </button>

          {menuOpen ? (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#2E303A] bg-[#0F1118] shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-[#2E303A]">
                <div className="text-sm text-[#E4E6EB] font-semibold truncate">
                  {menuTitle}
                </div>
                <div className="mt-0.5 text-xs text-[#8B8F9A] truncate">
                  {menuEmail}
                </div>
              </div>

              <div className="py-1">
                <a
                  href="/billing"
                  className="block px-4 py-2 text-sm text-[#E4E6EB] hover:bg-[#141826]"
                  onClick={() => setMenuOpen(false)}
                >
                  Billing
                </a>
                <a
                  href="/settings"
                  className="block px-4 py-2 text-sm text-[#E4E6EB] hover:bg-[#141826]"
                  onClick={() => setMenuOpen(false)}
                >
                  Settings
                </a>
                <a
                  href="/team"
                  className="block px-4 py-2 text-sm text-[#E4E6EB] hover:bg-[#141826]"
                  onClick={() => setMenuOpen(false)}
                >
                  Team
                </a>
                <a
                  href="/account/logout"
                  className="block px-4 py-2 text-sm text-[#E4E6EB] hover:bg-[#141826]"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign out
                </a>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
