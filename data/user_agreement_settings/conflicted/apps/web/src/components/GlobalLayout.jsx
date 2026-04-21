"use client";
import { useEffect, useRef, useState } from "react";
import { useChatStore } from "@/utils/useChatStore";
import { ChatWindow } from "@/components/Chat/ChatWindow";
import {
  Home,
  ArrowLeft,
  X as CloseIcon,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useDashboardProfile } from "@/hooks/useDashboardProfile";
import useUser from "@/utils/useUser";
import { useProfileUrl } from "@/hooks/useProfileUrl";
import { ChatButton } from "@/components/Chat/ChatButton";
import SiteUserMenu from "@/components/SiteUserMenu";

const HEADER_HEIGHT_PX = 72;

function UserAgreementGate({ user }) {
  const [checked, setChecked] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();

<<<<<<< ours
  // UPDATED: show for ALL authenticated users (except auth routes)
  // IMPORTANT: do NOT memoize this with [] because layout can stay mounted across client-side navigation.
  const onAuthRoute = (() => {
=======
  // show for ALL authenticated users (including admins), but skip auth + onboarding routes.
  const onAuthRoute = useMemo(() => {
>>>>>>> theirs
    if (typeof window === "undefined") return false;
    const path = window.location.pathname || "/";
    return (
      path.startsWith("/account/signin") ||
      path.startsWith("/account/signup") ||
      path.startsWith("/account/logout") ||
      path.startsWith("/account/user-agreement") ||
      path.startsWith("/onboarding")
    );
  })();

  const settingsQuery = useQuery({
    queryKey: ["public-settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings/public", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load settings");
      return res.json();
    },
    staleTime: 60_000,
    refetchOnMount: "always",
  });

  const currentVersion = settingsQuery.data?.user_agreement_version || null;
  const agreementText = settingsQuery.data?.user_agreement_text || "";
  const hasAgreement = Boolean(currentVersion);

  const statusQuery = useQuery({
    queryKey: ["agreement-status", user?.id || null, currentVersion || null],
    queryFn: async () => {
      const res = await fetch("/api/user-agreements/status", {
        headers: { "cache-control": "no-store" },
        credentials: "include",
      });
      if (res.status === 401) return { accepted: false, version: null };
      if (!res.ok) {
        throw new Error(
          `Failed to check agreement status (${res.status} ${res.statusText})`,
        );
      }
      return res.json();
    },
    enabled: !!user && !onAuthRoute && hasAgreement,
    refetchOnMount: "always",
  });

  const accepted = statusQuery.data?.accepted === true;

  const mustAccept =
    !!user &&
    !onAuthRoute &&
    hasAgreement &&
    // While status is loading, keep the gate up (prevents flashing protected UI)
    (statusQuery.isLoading || accepted === false);

  // Lock page scroll when the agreement gate is up.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!mustAccept) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev;
    };
  }, [mustAccept]);

  // Reset gating UI whenever the agreement version changes.
  useEffect(() => {
    setChecked(false);
    setScrolledToBottom(false);
    setError(null);

    // On short agreements, the scroll container might already be at bottom.
    const t = setTimeout(() => {
      try {
        const el = scrollRef.current;
        if (!el) return;
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
        if (atBottom) setScrolledToBottom(true);
      } catch (_) {
        // ignore
      }
    }, 0);

    return () => clearTimeout(t);
  }, [currentVersion]);

  const acceptMutation = useMutation({
    mutationFn: async () => {
      setError(null);
      const res = await fetch("/api/user-agreements/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = json?.detail
          ? `${json?.error || "Failed to accept agreement"}: ${String(
              json.detail,
            ).slice(0, 220)}`
          : json?.error || "Failed to accept agreement";
        throw new Error(msg);
      }
      return json;
    },
    onSuccess: async () => {
      // Optimistically mark accepted so the gate drops instantly.
      try {
        queryClient.setQueryData(
          ["agreement-status", user?.id || null, currentVersion || null],
          { accepted: true, version: currentVersion },
        );
      } catch (_) {
        // ignore
      }

      await queryClient.invalidateQueries({
        queryKey: ["agreement-status", user?.id || null],
      });
      await queryClient.invalidateQueries({
        queryKey: [
          "agreement-status",
          user?.id || null,
          currentVersion || null,
        ],
      });
    },
    onError: (e) => {
      console.error(e);
      setError(String(e?.message || "Could not save your acceptance"));
    },
  });

  if (!mustAccept) {
    return null;
  }

  const allowAccept = scrolledToBottom && checked && !acceptMutation.isLoading;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/80" />

      <div className="relative w-full max-w-3xl">
        {/* Glowing gradient backdrop */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-r from-purple-600/40 to-pink-600/40 blur-2xl"
          style={{ opacity: 0.6 }}
        />

        <div className="relative bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="p-5 md:p-6 border-b border-white/10 flex items-center gap-3">
            <div className="bg-purple-500/10 p-2 rounded-lg">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div className="min-w-0">
              <div className="text-white font-semibold text-lg md:text-xl truncate">
                User Agreement
              </div>
              <div className="text-white/50 text-xs md:text-sm">
                You must scroll through and accept to continue.
                {currentVersion ? ` (Version: ${currentVersion})` : ""}
              </div>
            </div>
          </div>

          <div className="p-5 md:p-6">
            <div
              ref={scrollRef}
              onScroll={() => {
                try {
                  const el = scrollRef.current;
                  if (!el) return;
                  const atBottom =
                    el.scrollHeight - el.scrollTop - el.clientHeight < 8;
                  if (atBottom) setScrolledToBottom(true);
                } catch (_) {
                  // ignore
                }
              }}
              className="max-h-[55vh] overflow-y-auto rounded-2xl border border-white/10 bg-black/40 p-4"
            >
              {settingsQuery.isLoading ? (
                <div className="text-white/60">Loading…</div>
              ) : settingsQuery.error ? (
                <div className="text-red-200 text-sm">
                  Could not load the agreement text.
                </div>
              ) : (
                <pre className="whitespace-pre-wrap text-white/90 text-sm leading-relaxed">
                  {agreementText}
                </pre>
              )}
            </div>

            <div className="mt-4 flex items-start gap-3">
              <input
                id="ttc-agree"
                type="checkbox"
                checked={checked}
                disabled={!scrolledToBottom}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-1 w-5 h-5 accent-purple-500 disabled:opacity-50"
              />
              <label htmlFor="ttc-agree" className="text-white/80 text-sm">
                I have read and agree to the User Agreement.
                {!scrolledToBottom ? (
                  <span className="block text-white/40 text-xs mt-1">
                    Scroll to the bottom to enable acceptance.
                  </span>
                ) : null}
              </label>
            </div>

            {error ? (
              <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-200 text-sm rounded-lg p-3">
                {error}
              </div>
            ) : null}

            <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <a
                href="/account/logout"
                className="text-white/50 text-sm underline"
              >
                Sign out
              </a>

              <button
                type="button"
                disabled={!allowAccept}
                onClick={() => acceptMutation.mutate()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {acceptMutation.isLoading ? "Saving…" : "Accept & Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GlobalLayout({ children }) {
  const { isOpen } = useChatStore();
  const { data: user } = useUser();
  const queryClient = useQueryClient();

  // Hide the "JS blocked" banner once React is actually running.
  useEffect(() => {
    try {
      // Let the inline HTML health-check know React actually started.
      if (typeof window !== "undefined") {
        window.__TTC_REACT_STARTED = true;
      }

      const el = document.getElementById("ttc-js-warning");
      if (el) {
        el.style.display = "none";
      }
    } catch (_) {
      // ignore
    }
  }, []);

  // canonical host redirect (moved here so /app/layout.jsx stays server-safe)
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      const isProd =
        (typeof process !== "undefined" && process.env?.ENV === "production") ||
        (typeof process !== "undefined" &&
          process.env?.NODE_ENV === "production");
      if (!isProd) return;

      let targetHost = "www.thetattooconnect.com";
      try {
        const appUrl =
          typeof process !== "undefined" && process.env?.APP_URL
            ? String(process.env.APP_URL)
            : "";
        if (appUrl) {
          const parsed = new URL(appUrl);
          if (parsed.hostname) {
            targetHost = parsed.hostname;
          }
        }
      } catch (_) {
        // ignore
      }

      const { protocol, hostname, pathname, search, hash } = window.location;
      const currentHost = hostname ? hostname.toLowerCase() : "";
      const desiredHost = targetHost.toLowerCase();
      if (currentHost && currentHost !== desiredHost) {
        const redirectUrl = `${protocol}//${targetHost}${pathname}${search}${hash}`;
        window.location.replace(redirectUrl);
      }
    } catch (_) {
      // ignore
    }
  }, []);

  const [showAuthGuard, setShowAuthGuard] = useState(false);
  const authGuardPrevFocusRef = useRef(null);

  // When the auth guard opens, move keyboard focus into it; restore on close.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!showAuthGuard) return;

    try {
      authGuardPrevFocusRef.current = document.activeElement;
    } catch (_) {
      authGuardPrevFocusRef.current = null;
    }

    const t = setTimeout(() => {
      try {
        const first = document.getElementById("auth-guard-primary");
        if (first && typeof first.focus === "function") {
          first.focus();
        }
      } catch (_) {
        // ignore
      }
    }, 0);

    return () => {
      clearTimeout(t);
      try {
        const prev = authGuardPrevFocusRef.current;
        if (prev && typeof prev.focus === "function") {
          prev.focus();
        }
      } catch (_) {
        // ignore
      }
    };
  }, [showAuthGuard]);

  useEffect(() => {
    if (!showAuthGuard) return;

    const onKey = (e) => {
      if (e.key === "Escape") {
        setShowAuthGuard(false);
        return;
      }

      if (e.key !== "Tab") return;

      try {
        const modal = document.getElementById("auth-guard-modal");
        if (!modal) return;

        const focusables = Array.from(
          modal.querySelectorAll(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => {
          if (!el) return false;
          // Don't allow focus on hidden elements
          if (el.getAttribute("aria-hidden") === "true") return false;
          return true;
        });

        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        const isShift = e.shiftKey === true;

        if (!isShift && active === last) {
          e.preventDefault();
          first.focus();
        } else if (isShift && active === first) {
          e.preventDefault();
          last.focus();
        }
      } catch (_) {
        // ignore
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showAuthGuard]);

  // Load profile to know if user is an artist
  const { data: profileData } = useDashboardProfile();
  const userType = profileData?.userType || null;
  const profileUrl = useProfileUrl(userType, profileData?.profile) || "/";

  // Only show availability badge for recipients (collectors)
  const isArtist = (userType || "").toLowerCase() === "artist";

  // Streaming-first availability unread badge (blue dot)
  const [availabilitySseActive, setAvailabilitySseActive] = useState(false);
  const availabilitySseRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!user?.id) return;
    if (isArtist) return;
    if (typeof EventSource === "undefined") return;

    try {
      if (availabilitySseRef.current) {
        availabilitySseRef.current.close();
        availabilitySseRef.current = null;
      }
    } catch (_) {}

    setAvailabilitySseActive(false);

    const es = new EventSource("/api/inquiries/updates/stream");
    availabilitySseRef.current = es;

    es.onopen = () => {
      setAvailabilitySseActive(true);
      // initial sync
      queryClient.invalidateQueries({
        queryKey: ["inquiries", "sender", user?.id],
      });
    };

    es.addEventListener("availability", (evt) => {
      try {
        const payload = JSON.parse(evt?.data || "{}");
        const inquiry = payload?.inquiry;
        if (!inquiry?.id) return;

        // Update the sender-inbox cache instantly so the blue dot appears without waiting.
        queryClient.setQueryData(["inquiries", "sender", user?.id], (old) => {
          const base = old || { inquiries: [], unread: 0 };
          const prev = Array.isArray(base.inquiries) ? base.inquiries : [];
          const idx = prev.findIndex(
            (x) => String(x?.id) === String(inquiry.id),
          );

          let nextInquiries = prev;
          if (idx >= 0) {
            nextInquiries = prev.slice();
            nextInquiries[idx] = { ...nextInquiries[idx], ...inquiry };
          } else {
            nextInquiries = [inquiry, ...prev];
          }

          // Preserve the "unread" meta (used elsewhere) based on read_by_sender.
          const unread = nextInquiries.filter(
            (i) => i?.read_by_sender === false,
          ).length;

          return { ...base, inquiries: nextInquiries, unread };
        });
      } catch (_) {
        // ignore malformed SSE
      }
    });

    es.onerror = () => {
      // Let EventSource retry. While it's down, we fall back to light polling.
      setAvailabilitySseActive(false);
    };

    return () => {
      try {
        es.close();
      } catch (_) {}
      try {
        if (availabilitySseRef.current === es) {
          availabilitySseRef.current = null;
        }
      } catch (_) {}
      setAvailabilitySseActive(false);
    };
  }, [user?.id, isArtist, queryClient]);

  const availabilityList = useQuery({
    queryKey: ["inquiries", "sender", user?.id],
    queryFn: async () => {
      if (isArtist) return { inquiries: [], unread: 0 };
      const res = await fetch("/api/inquiries/list?role=sender", {
        headers: { "cache-control": "no-store" },
      });
      if (!res.ok) return { inquiries: [], unread: 0 };
      return res.json();
    },
    enabled: !!user && !isArtist,
    // No constant polling. Only fallback if SSE is disconnected.
    refetchInterval:
      !!user && !isArtist && !availabilitySseActive ? 20000 : false,
  });

  // blue dot is driven by pending availability invites
  const availabilityUnreadCount = (
    availabilityList.data?.inquiries || []
  ).filter(
    (i) =>
      i?.type === "availability" &&
      String(i?.status || "pending").toLowerCase() === "pending",
  ).length;

  const styleFor = (key) => {
    const style = { position: "fixed", zIndex: 1000 };
    if (key === "back") {
      style.left = "20px";
      style.bottom = "20px";
    }
    if (key === "home") {
      style.right = "20px";
      style.bottom = "20px";
    }
    return style;
  };

  // Global click guard for unauthenticated users (except auth pages)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const path = window.location.pathname || "/";
    const onAuthRouteNow = path.startsWith("/account");
    if (user || onAuthRouteNow) return;

    const protectedActions = new Set([
      "message",
      "inquiry",
      "follow",
      "favorite",
      "like",
      "save",
      "create",
      "edit",
      "delete",
      "submit",
      "upload",
    ]);

    const handler = (e) => {
      try {
        const target = e.target;
        const modal = document.getElementById("auth-guard-modal");
        if (modal && modal.contains(target)) return;

        let el = target;
        while (el && el !== document && el !== document.body) {
          if (el.getAttribute) {
            const actionRaw = el.getAttribute("data-action");
            const action = actionRaw
              ? String(actionRaw).toLowerCase().trim()
              : "";
            if (action && protectedActions.has(action)) {
              e.preventDefault();
              e.stopPropagation();
              setShowAuthGuard(true);
              return;
            }
          }
          el = el.parentElement;
        }
      } catch (_) {
        // ignore
      }
    };

    document.addEventListener("click", handler, true);
    return () => {
      document.removeEventListener("click", handler, true);
    };
  }, [user]);

  const handleBack = () => {
    try {
      if (typeof window !== "undefined") {
        if (window.history && window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = "/";
        }
      }
    } catch (e) {
      console.error("Back navigation failed", e);
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  };

  return (
    <>
      {/* Global dark background layer */}
      <div
        aria-hidden
        className="fixed inset-0 bg-[#0a0a0a] pointer-events-none z-[-1]"
      />

      {/* Agreement Gate (blocks the site until accepted) */}
      <UserAgreementGate user={user} />

      {/* STICKY HEADER (every page) */}
      <header
        className="fixed top-0 inset-x-0 z-[1500] bg-[#0a0a0a]/80 backdrop-blur border-b border-white/10"
        style={{ height: HEADER_HEIGHT_PX }}
      >
        <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
          <a
            href="/"
            className="inline-block font-playfair text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent transition hover:opacity-100 filter hover:drop-shadow-[0_0_10px_rgba(236,72,153,0.45)]"
            title="The Tattoo Connect"
          >
            The Tattoo Connect
          </a>

          <div className="flex items-center gap-2">
            {user ? (
              <ChatButton availabilityUnreadCount={availabilityUnreadCount} />
            ) : null}
            <SiteUserMenu />
          </div>
        </div>
      </header>

      {/* NOTE: Toaster is mounted once in Providers.jsx to avoid duplicates */}
      <ChatWindow />

      {/* Page content is pushed below the header so nothing overlaps */}
      <main style={{ paddingTop: HEADER_HEIGHT_PX }} className="min-h-screen">
        {children}
      </main>

      {/* Back button on every page */}
      <button
        type="button"
        onClick={handleBack}
        aria-label="Go back"
        className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-4 py-3 text-white border border-white/15 shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/30"
        style={styleFor("back")}
      >
        <ArrowLeft size={18} className="opacity-90" />
        <span className="hidden sm:inline">Back</span>
      </button>

      {/* Home button (hides when chat is open) */}
      {!isOpen && (
        <a
          href={profileUrl}
          aria-label="Go to Home"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/30"
          style={styleFor("home")}
        >
          <Home size={18} className="opacity-90" />
          <span className="hidden sm:inline">Home</span>
        </a>
      )}

      {/* Auth Guard Popup (only when unauthenticated) */}
      {!user && showAuthGuard && (
        <div
          id="auth-guard-overlay"
          className="fixed inset-0 z-[2000] bg-black/60 flex items-center justify-center px-6"
          onClick={() => setShowAuthGuard(false)}
          aria-modal="true"
          role="dialog"
          aria-labelledby="auth-guard-title"
          aria-describedby="auth-guard-desc"
        >
          <div
            id="auth-guard-modal"
            className="relative w-full max-w-sm rounded-2xl bg-[#121212] border border-white/10 text-white shadow-2xl p-6 animate-auth-glow"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setShowAuthGuard(false)}
              className="absolute top-3 right-3 inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 text-white/80 border border-white/10"
            >
              <CloseIcon size={16} />
            </button>
            <div className="text-center">
              <h2 id="auth-guard-title" className="text-xl font-semibold mb-2">
                Log in to continue
              </h2>
              <p id="auth-guard-desc" className="text-white/70 text-sm">
                Please sign in or create an account to keep going.
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <a
                  id="auth-guard-primary"
                  href="/account/signin"
                  className="px-4 py-2 rounded-lg bg-white text-black hover:opacity-90 transition"
                >
                  Sign In
                </a>
                <a
                  href="/account/signup"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 transition"
                >
                  Join Now
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animation */}
      <style jsx global>{`
        @keyframes auth-glow {
          0% { box-shadow: 0 0 0px rgba(168, 85, 247, 0.0), 0 0 0px rgba(236, 72, 153, 0.0); }
          50% { box-shadow: 0 0 24px rgba(168, 85, 247, 0.35), 0 0 36px rgba(236, 72, 153, 0.25); }
          100% { box-shadow: 0 0 0px rgba(168, 85, 247, 0.0), 0 0 0px rgba(236, 72, 153, 0.0); }
        }
        .animate-auth-glow {
          animation: auth-glow 2s ease-in-out infinite;
        }
        html, body { overflow-x: hidden; }
        *::-webkit-scrollbar:horizontal { height: 0 !important; }
      `}</style>
    </>
  );
}
