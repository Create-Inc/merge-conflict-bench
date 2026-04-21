"use client";
import { useState, useEffect } from "react";
import { Building2, ChevronDown, Check } from "lucide-react";

export default function OrganizationSwitcher() {
  const [organizations, setOrganizations] = useState([]);
  const [currentOrgId, setCurrentOrgId] = useState(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    checkPlatformAdminStatus();

    const checkTheme = () => {
      const isDarkMode =
        document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(isDarkMode);
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  async function checkPlatformAdminStatus() {
    try {
      const res = await fetch("/api/organizations/list");
      if (!res.ok) {
        setIsPlatformAdmin(false);
        return;
      }

      const data = await res.json();
      const orgs = Array.isArray(data.organizations) ? data.organizations : [];
      setOrganizations(orgs);
      setIsPlatformAdmin(true);

      // Determine selected org from URL first, then fall back to persisted selection.
      let orgIdFromUrl = null;
      let selectedId = null;

      try {
        const params = new URLSearchParams(window.location.search);
        const orgParam = params.get("organizationId");
        orgIdFromUrl = orgParam ? Number(orgParam) : null;
        selectedId = Number.isFinite(orgIdFromUrl) ? orgIdFromUrl : null;
      } catch (e) {
        // ignore
      }

      if (!selectedId) {
        try {
          const stored = localStorage.getItem("platformAdmin.selectedOrgId");
          const parsed = stored ? Number(stored) : null;
          if (Number.isFinite(parsed) && parsed > 0) selectedId = parsed;
        } catch (e) {
          // ignore storage errors
        }
      }

      const selectedIdNum = selectedId ? Number(selectedId) : null;
      const hasSelected = selectedIdNum
        ? orgs.some((o) => Number(o?.id) === Number(selectedIdNum))
        : false;

      if (hasSelected) {
        setCurrentOrgId(selectedIdNum);

        // If the URL dropped the organizationId param but we have a persisted selection,
        // restore it so every page reliably stays in the same org view.
        if (!orgIdFromUrl && typeof window !== "undefined") {
          try {
            const url = new URL(window.location.href);
            url.searchParams.set("organizationId", String(selectedIdNum));
            window.location.replace(url.toString());
            return; // prevent flicker while the page reloads
          } catch (_) {
            // ignore
          }
        }
      } else {
        setCurrentOrgId(null);
      }
    } catch (error) {
      console.error("Error checking platform admin status:", error);
      setIsPlatformAdmin(false);
    } finally {
      setLoading(false);
    }
  }

  function switchOrganization(orgId) {
    const orgIdNum = orgId ? Number(orgId) : null;

    // Persist selection so it survives page changes
    try {
      if (orgIdNum) {
        localStorage.setItem("platformAdmin.selectedOrgId", String(orgIdNum));
      } else {
        localStorage.removeItem("platformAdmin.selectedOrgId");
        localStorage.removeItem("lfms_branding_self");
      }
    } catch (e) {
      // ignore storage errors
    }

    const url = new URL(window.location.href);
    if (orgIdNum) {
      url.searchParams.set("organizationId", String(orgIdNum));
    } else {
      url.searchParams.delete("organizationId");
    }
    window.location.href = url.toString();
  }

  if (loading || !isPlatformAdmin) {
    return null;
  }

  const currentOrg = currentOrgId
    ? organizations.find((o) => Number(o?.id) === Number(currentOrgId))
    : null;

  const primaryColor = isDark ? "#22c6bd" : "#1d2c5d";
  const bgColor = isDark ? "rgba(34, 198, 189, 0.15)" : "rgba(29, 44, 93, 0.1)";
  const hoverBgColor = isDark
    ? "rgba(34, 198, 189, 0.25)"
    : "rgba(29, 44, 93, 0.15)";
  const borderColor = isDark ? "#22c6bd" : "#1d2c5d";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border-2"
        style={{
          backgroundColor: bgColor,
          color: primaryColor,
          borderColor: borderColor,
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = hoverBgColor)
        }
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = bgColor)}
      >
        <Building2 size={18} />
        <div className="flex flex-col items-start min-w-0">
          <span className="text-xs font-semibold">Platform Admin Mode</span>
          <span className="text-xs truncate max-w-48">
            {currentOrg ? currentOrg.name : "My Organization"}
          </span>
        </div>
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div
            className="absolute top-full left-0 mt-2 w-96 rounded-lg shadow-xl border z-20 max-h-96 overflow-y-auto"
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--border)",
            }}
          >
            <div className="p-2">
              <div
                className="px-3 py-2 text-xs font-semibold uppercase"
                style={{ color: "var(--muted)" }}
              >
                Switch Organization View
              </div>

              <button
                onClick={() => {
                  switchOrganization(null);
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded transition-colors"
                style={{
                  backgroundColor: !currentOrgId
                    ? isDark
                      ? "rgba(34, 198, 189, 0.15)"
                      : "rgba(29, 44, 93, 0.1)"
                    : "transparent",
                  color: !currentOrgId ? primaryColor : "var(--text)",
                }}
                onMouseEnter={(e) => {
                  if (currentOrgId)
                    e.currentTarget.style.backgroundColor =
                      "var(--bg-contrast)";
                }}
                onMouseLeave={(e) => {
                  if (currentOrgId)
                    e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <div className="flex items-center gap-2">
                  <Building2 size={16} />
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-sm">My Organization</span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      Your default view
                    </span>
                  </div>
                </div>
                {!currentOrgId && <Check size={16} />}
              </button>

              <div
                className="my-2 border-t"
                style={{ borderColor: "var(--border)" }}
              />

              {organizations.map((org) => {
                const orgIdNum = Number(org?.id);
                const isSelected = Number(orgIdNum) === Number(currentOrgId);

                return (
                  <button
                    key={String(org?.id)}
                    onClick={() => {
                      switchOrganization(orgIdNum);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded transition-colors"
                    style={{
                      backgroundColor: isSelected
                        ? isDark
                          ? "rgba(34, 198, 189, 0.15)"
                          : "rgba(29, 44, 93, 0.1)"
                        : "transparent",
                      color: isSelected ? primaryColor : "var(--text)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.backgroundColor =
                          "var(--bg-contrast)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <div className="flex flex-col items-start min-w-0">
                      <span className="font-medium text-sm truncate max-w-xs">
                        {org.name}
                      </span>
                      <span className="text-xs" style={{ color: "var(--muted)" }}>
                        {org.user_count || 0} users · {org.call_count || 0} calls ·
                        {org.subscription_plan || "Starter"}
                      </span>
                    </div>
                    {isSelected && <Check size={16} />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
