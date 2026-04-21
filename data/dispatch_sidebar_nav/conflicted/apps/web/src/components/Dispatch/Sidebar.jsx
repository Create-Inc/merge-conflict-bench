<<<<<<< ours
import { X, LogOut, UserCog, ChevronLeft, ChevronRight } from "lucide-react";
=======
import {
  X,
  LogOut,
  UserCog,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
>>>>>>> theirs
import useTenantBranding from "@/hooks/useTenantBranding";
import useSidebarCollapsed from "@/hooks/useSidebarCollapsed";
import CurrentOrganizationBadge from "@/components/CurrentOrganizationBadge";
import ClientLink from "@/components/ClientLink";

const DEFAULT_SIDEBAR_LOGO_URL =
  "https://ucarecdn.com/36cb4339-9517-47f5-a93e-f80d371014b0/-/format/auto/";

export function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  primaryModules,
  secondaryModules,
  user,
  showAdmin,
  adminHref,
  adminTitle,
  collapsed,
  onToggleCollapsed,
}) {
  const safeAdminHref = adminHref || "/admin";
  const safeAdminTitle = adminTitle || "Admin";

  const { sidebarLogoUrl, logoAlt } = useTenantBranding(user);

<<<<<<< ours
  const { collapsed, toggle } = useSidebarCollapsed();
  const desktopWidthClass = collapsed ? "lg:w-20" : "lg:w-64";
  const headerHeightClass = collapsed ? "lg:h-20" : "lg:h-32";
  const navPaddingClass = collapsed ? "px-3 lg:px-2" : "px-3";
  const orgPaddingClass = collapsed ? "px-6 lg:px-3" : "px-6";

  const desktopCollapseLinkClass = collapsed
    ? "lg:justify-center lg:gap-0 lg:px-2"
    : "";
  const desktopCollapseLabelClass = collapsed ? "lg:hidden" : "";

  const ToggleIcon = collapsed ? ChevronRight : ChevronLeft;
  const toggleTitle = collapsed ? "Expand sidebar" : "Collapse sidebar";

=======
  const isCollapsed = !!collapsed;
  const sidebarWidthClass = isCollapsed ? "w-64 lg:w-20" : "w-64";

  const itemBaseClass =
    "mb-1 flex items-center rounded-lg py-2.5 text-sm font-medium transition-all";

  const itemPaddingClass = isCollapsed
    ? "gap-3 px-3 lg:justify-center lg:gap-0 lg:px-0"
    : "gap-3 px-3";

  const labelClass = isCollapsed ? "lg:hidden" : "";
  const orgTextClass = isCollapsed ? "lg:hidden" : "";
  const signOutTextClass = isCollapsed ? "lg:hidden" : "";

  const toggleButton =
    typeof onToggleCollapsed === "function" ? (
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="hidden lg:flex items-center justify-center rounded-lg border border-gray-200 bg-white/80 p-2 text-gray-700 shadow-sm hover:bg-white"
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <PanelLeftOpen size={18} />
        ) : (
          <PanelLeftClose size={18} />
        )}
      </button>
    ) : null;

  const safePrimary = Array.isArray(primaryModules) ? primaryModules : [];
  const safeSecondary = Array.isArray(secondaryModules) ? secondaryModules : [];

>>>>>>> theirs
  const handleLogoError = (e) => {
    try {
      if (!e?.currentTarget) return;
      if (e.currentTarget.src === DEFAULT_SIDEBAR_LOGO_URL) return;
      e.currentTarget.src = DEFAULT_SIDEBAR_LOGO_URL;
    } catch {
      // ignore
    }
  };

  return (
    <>
      {sidebarOpen ? (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
<<<<<<< ours
        className={`fixed inset-y-0 left-0 z-30 w-64 ${desktopWidthClass} transform transition-transform duration-300 lg:relative lg:translate-x-0 ${
=======
        className={`fixed inset-y-0 left-0 z-30 ${sidebarWidthClass} transform transition-transform duration-300 lg:relative lg:translate-x-0 ${
>>>>>>> theirs
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
<<<<<<< ours
          <div
            className={`relative flex h-32 ${headerHeightClass} items-center justify-center border-b border-gray-200 bg-white`}
          >
=======
          <div className="relative flex h-32 items-center justify-center border-b border-gray-200 bg-white px-3">
>>>>>>> theirs
            <img
              src={sidebarLogoUrl}
              alt={logoAlt}
              className={`h-full w-full object-contain p-1 ${
                isCollapsed ? "lg:hidden" : ""
              }`}
              onError={handleLogoError}
            />
<<<<<<< ours

=======

            <div
              className={`hidden items-center justify-center lg:flex ${
                isCollapsed ? "" : "lg:hidden"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200">
                <img
                  src={sidebarLogoUrl}
                  alt={logoAlt}
                  className="h-10 w-10 object-contain"
                  onError={handleLogoError}
                />
              </div>
            </div>

>>>>>>> theirs
            <button
              onClick={toggle}
              className="absolute left-3 hidden rounded-lg border border-gray-200 bg-white/90 p-2 text-gray-700 shadow-sm hover:bg-gray-50 lg:inline-flex"
              type="button"
              title={toggleTitle}
              aria-label={toggleTitle}
            >
              <ToggleIcon size={18} />
            </button>

            <button
              onClick={() => setSidebarOpen(false)}
<<<<<<< ours
              className="absolute right-3 text-gray-700 lg:hidden"
              type="button"
=======
              className="absolute right-3 top-3 text-gray-700 lg:hidden"
              type="button"
              aria-label="Close menu"
>>>>>>> theirs
            >
              <X size={24} />
            </button>

            <div className="absolute left-3 top-3">{toggleButton}</div>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-[var(--tenant-primary)]">
<<<<<<< ours
            <nav
              className={`flex flex-1 flex-col overflow-y-auto ${navPaddingClass} pt-8 pb-4`}
            >
              {primaryModules.map((module, idx) => {
=======
            <nav
              className={`flex flex-1 flex-col overflow-y-auto pt-8 pb-4 ${
                isCollapsed ? "px-3 lg:px-2" : "px-3"
              }`}
            >
              {safePrimary.map((module, idx) => {
>>>>>>> theirs
                const Icon = module.icon;
                const isActive = !!module.active;
                const itemClass = isActive
                  ? "bg-[var(--tenant-accent)] text-white"
                  : "text-white/80 hover:bg-white/10";

                return (
                  <ClientLink
                    key={module.key || idx}
                    href={module.href}
                    onNavigate={() => setSidebarOpen(false)}
<<<<<<< ours
                    title={module.name}
                    className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${itemClass} ${desktopCollapseLinkClass}`}
=======
                    className={`${itemBaseClass} ${itemPaddingClass} ${itemClass}`}
                    title={module.name}
                    aria-label={module.name}
>>>>>>> theirs
                  >
                    <Icon size={20} />
<<<<<<< ours
                    <span className={desktopCollapseLabelClass}>
                      {module.name}
                    </span>
=======
                    <span className={labelClass}>{module.name}</span>
>>>>>>> theirs
                  </ClientLink>
                );
              })}

              <div className="mt-auto pt-3">
                <div className="mb-3 border-t border-white/10" />
              </div>

              {safeSecondary.map((module, idx) => {
                const Icon = module.icon;
                const isActive = !!module.active;
                const itemClass = isActive
                  ? "bg-[var(--tenant-accent)] text-white"
                  : "text-white/80 hover:bg-white/10";

                return (
                  <ClientLink
                    key={module.key || `secondary-${idx}`}
                    href={module.href}
                    onNavigate={() => setSidebarOpen(false)}
<<<<<<< ours
                    title={module.name}
                    className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${itemClass} ${desktopCollapseLinkClass}`}
=======
                    className={`${itemBaseClass} ${itemPaddingClass} ${itemClass}`}
                    title={module.name}
                    aria-label={module.name}
>>>>>>> theirs
                  >
                    <Icon size={20} />
<<<<<<< ours
                    <span className={desktopCollapseLabelClass}>
                      {module.name}
                    </span>
=======
                    <span className={labelClass}>{module.name}</span>
>>>>>>> theirs
                  </ClientLink>
                );
              })}
            </nav>

<<<<<<< ours
            <div className={`border-t border-white/10 ${orgPaddingClass} py-4`}>
=======
            <div
              className={`border-t border-white/10 py-4 ${
                isCollapsed ? "px-3 lg:px-2" : "px-6"
              }`}
            >
>>>>>>> theirs
              <ClientLink
                href="/tenant"
                onNavigate={() => setSidebarOpen(false)}
                className={`group flex items-start rounded-lg px-2 py-1.5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 ${
                  isCollapsed ? "gap-3 lg:justify-center" : "gap-3"
                }`}
                title="Organization settings"
                aria-label="Go to Organization settings"
              >
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-1 ring-1 ring-white/20">
                  <img
                    src={sidebarLogoUrl}
                    alt={logoAlt}
                    className="h-full w-full object-contain"
                    onError={handleLogoError}
                  />
                </div>

<<<<<<< ours
                <div
                  className={`flex-1 overflow-hidden ${desktopCollapseLabelClass}`}
                >
=======
                <div className={`flex-1 overflow-hidden ${orgTextClass}`}>
>>>>>>> theirs
                  <CurrentOrganizationBadge
                    user={user}
                    asLink={false}
                    className="w-full max-w-none sm:max-w-none"
                  />
                </div>
              </ClientLink>
            </div>

            <div className="h-4" />

            <div className="border-t border-white/10 p-3">
              <div className="flex items-center gap-2">
                <a
                  href="/account/logout"
<<<<<<< ours
                  title="Sign Out"
                  className={`flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 transition-all hover:bg-white/10 ${desktopCollapseLinkClass}`}
=======
                  className={`flex items-center rounded-lg py-2.5 text-sm font-medium text-white/80 transition-all hover:bg-white/10 ${
                    isCollapsed
                      ? "flex-1 gap-3 px-3 lg:justify-center lg:gap-0 lg:px-0"
                      : "flex-1 gap-3 px-3"
                  }`}
                  title="Sign Out"
>>>>>>> theirs
                >
                  <LogOut size={20} />
<<<<<<< ours
                  <span className={desktopCollapseLabelClass}>Sign Out</span>
=======
                  <span className={signOutTextClass}>Sign Out</span>
>>>>>>> theirs
                </a>

                {showAdmin ? (
                  <ClientLink
                    href={safeAdminHref}
                    title={safeAdminTitle}
                    onNavigate={() => setSidebarOpen(false)}
                    className="flex items-center justify-center rounded-lg px-3 py-2.5 text-white/80 transition-all hover:bg-white/10"
                    aria-label="Admin"
                  >
                    <UserCog size={20} />
                  </ClientLink>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
