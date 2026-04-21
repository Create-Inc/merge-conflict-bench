import { X, LogOut, UserCog, PanelLeftClose, PanelLeftOpen } from "lucide-react";
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

  const local = useSidebarCollapsed();
  const isCollapsed = typeof collapsed === "boolean" ? collapsed : local.collapsed;
  const toggleCollapsed =
    typeof onToggleCollapsed === "function" ? onToggleCollapsed : local.toggle;

  const sidebarWidthClass = isCollapsed ? "w-64 lg:w-20" : "w-64";

  const itemBaseClass =
    "mb-1 flex items-center rounded-lg py-2.5 text-sm font-medium transition-all";

  const itemPaddingClass = isCollapsed
    ? "gap-3 px-3 lg:justify-center lg:gap-0 lg:px-0"
    : "gap-3 px-3";

  const labelClass = isCollapsed ? "lg:hidden" : "";
  const orgTextClass = isCollapsed ? "lg:hidden" : "";
  const signOutTextClass = isCollapsed ? "lg:hidden" : "";

  const toggleButton = toggleCollapsed ? (
    <button
      type="button"
      onClick={toggleCollapsed}
      className="hidden items-center justify-center rounded-lg border border-gray-200 bg-white/80 p-2 text-gray-700 shadow-sm hover:bg-white lg:flex"
      title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
    </button>
  ) : null;

  const safePrimary = Array.isArray(primaryModules) ? primaryModules : [];
  const safeSecondary = Array.isArray(secondaryModules) ? secondaryModules : [];

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
        className={`fixed inset-y-0 left-0 z-30 ${sidebarWidthClass} transform transition-transform duration-300 lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="relative flex h-32 items-center justify-center border-b border-gray-200 bg-white px-3">
            <img
              src={sidebarLogoUrl}
              alt={logoAlt}
              className={`h-full w-full object-contain p-1 ${
                isCollapsed ? "lg:hidden" : ""
              }`}
              onError={handleLogoError}
            />

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

            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute right-3 top-3 text-gray-700 lg:hidden"
              type="button"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>

            <div className="absolute left-3 top-3">{toggleButton}</div>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-[var(--tenant-primary)]">
            <nav
              className={`flex flex-1 flex-col overflow-y-auto pt-8 pb-4 ${
                isCollapsed ? "px-3 lg:px-2" : "px-3"
              }`}
            >
              {safePrimary.map((module, idx) => {
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
                    className={`${itemBaseClass} ${itemPaddingClass} ${itemClass}`}
                    title={module.name}
                    aria-label={module.name}
                  >
                    <Icon size={20} />
                    <span className={labelClass}>{module.name}</span>
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
                    className={`${itemBaseClass} ${itemPaddingClass} ${itemClass}`}
                    title={module.name}
                    aria-label={module.name}
                  >
                    <Icon size={20} />
                    <span className={labelClass}>{module.name}</span>
                  </ClientLink>
                );
              })}
            </nav>

            <div
              className={`border-t border-white/10 py-4 ${
                isCollapsed ? "px-3 lg:px-2" : "px-6"
              }`}
            >
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

                <div className={`flex-1 overflow-hidden ${orgTextClass}`}>
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
                  className={`flex items-center rounded-lg py-2.5 text-sm font-medium text-white/80 transition-all hover:bg-white/10 ${
                    isCollapsed
                      ? "flex-1 gap-3 px-3 lg:justify-center lg:gap-0 lg:px-0"
                      : "flex-1 gap-3 px-3"
                  }`}
                  title="Sign Out"
                >
                  <LogOut size={20} />
                  <span className={signOutTextClass}>Sign Out</span>
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
