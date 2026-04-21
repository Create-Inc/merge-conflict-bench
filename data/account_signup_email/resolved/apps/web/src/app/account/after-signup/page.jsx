"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

function getRoleFromLocation() {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return (params.get("role") || "").toLowerCase();
}

function getFlagFromLocation(key) {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return (params.get(key) || "").toLowerCase();
}

function getParamFromLocation(key) {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return params.get(key) || "";
}

function getSetupPayload() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    role: (params.get("role") || "").toLowerCase(),
    name: params.get("name") || undefined,
    company_name: params.get("company_name") || undefined,
    org_number: params.get("org_number") || undefined,
    address: params.get("address") || undefined,
  };
}

function getSafeCallbackUrlFromLocation() {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  const cb = params.get("callbackUrl") || "";

  // Only allow relative paths to avoid open redirects
  if (!cb) return "";
  if (!cb.startsWith("/")) return "";
  if (cb.startsWith("//")) return "";
  return cb;
}

export default function AfterSignupPage() {
  const [role, setRoleState] = useState("");
  const [safeCallbackUrl, setSafeCallbackUrl] = useState("");
  const fallbackTimerRef = useRef(null);

  // prevent accidental rapid re-sends on render loops / errors
  const autoVerificationSentRef = useRef(false);

  // also persist a short-lived guard across hard refreshes
  const clientCooldownKeyRef = useRef("");

  useEffect(() => {
    setRoleState(getRoleFromLocation());
    setSafeCallbackUrl(getSafeCallbackUrlFromLocation());
  }, []);

  const roleTarget = useMemo(() => {
    if (role === "consultant") return "/consultant";
    if (role === "partner") return "/partners/dashboard";
    if (role === "company") return "/companies/dashboard";
    if (role === "seller") return "/seller";
    return "/";
  }, [role]);

  const target = safeCallbackUrl || roleTarget;

  const fromSignin =
    getFlagFromLocation("from") === "signin" ||
    getFlagFromLocation("from") === "google";
  const signinEmail = getParamFromLocation("signin_email");

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetch("/api/users?endpoint=me");
      if (!res.ok) {
        throw new Error(
          `When fetching /api/users?endpoint=me, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
    enabled: true,
  });

  const user = meQuery.data?.user || null;
  const emailVerified = !!user?.emailVerified;

  const requiresVerification = !!role && meQuery.isSuccess && !emailVerified;

  const sendVerification = useMutation({
    mutationFn: async () => {
      // NOTE: this endpoint sends verification and supports throttling
      const res = await fetch("/api/account/email?endpoint=send-verification", {
        method: "POST",
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `When sending verification, the response was [${res.status}] ${res.statusText} ${text}`,
        );
      }
      return res.json();
    },
  });

  useEffect(() => {
    // only auto-send ONCE per mount.
    if (!requiresVerification) {
      autoVerificationSentRef.current = false;
      clientCooldownKeyRef.current = "";
      return;
    }

    if (autoVerificationSentRef.current) {
      return;
    }

    const email = user?.email || "";
    const cooldownKey = email ? `mm_verify_sent_${email}` : "mm_verify_sent";
    clientCooldownKeyRef.current = cooldownKey;

    // If the user refreshes the page, don’t resend right away.
    // This is a *UI guard*; server-side throttling is the real protection.
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        const last = window.sessionStorage.getItem(cooldownKey);
        const lastMs = last ? Number(last) : 0;
        const ageMs = lastMs ? Date.now() - lastMs : Infinity;
        if (ageMs >= 0 && ageMs < 60 * 1000) {
          autoVerificationSentRef.current = true;
          return;
        }
      }
    } catch {
      // ignore
    }

    autoVerificationSentRef.current = true;
    sendVerification.mutate(undefined, {
      onSuccess: () => {
        try {
          if (typeof window !== "undefined" && window.sessionStorage) {
            window.sessionStorage.setItem(cooldownKey, String(Date.now()));
          }
        } catch {
          // ignore
        }
      },
    });
  }, [requiresVerification, sendVerification, user?.email]);

  const rolesQuery = useQuery({
    queryKey: ["me", "roles", "redirect"],
    queryFn: async () => {
      const res = await fetch("/api/users?endpoint=role");
      if (!res.ok) {
        throw new Error(
          `When fetching roles, the response was [${res.status}] ${res.statusText}`,
        );
      }
      const json = await res.json();
      return json.roles || [];
    },
    enabled: !role || fromSignin,
  });

  const setRoleMut = useMutation({
    mutationFn: async (nextRole) => {
      const res = await fetch("/api/users?endpoint=role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      if (!res.ok) {
        throw new Error(
          `When setting role, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  useEffect(() => {
    if (!fromSignin) return;
    fallbackTimerRef.current = setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.href = safeCallbackUrl || "/consultant";
      }
    }, 3000);
    return () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
  }, [fromSignin, safeCallbackUrl]);

  const updateContactEmail = useMutation({
    mutationFn: async (email) => {
      const res = await fetch("/api/consultants?endpoint=me-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact_email: email }),
      });
      if (!res.ok) {
        throw new Error(
          `When updating contact email, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  useEffect(() => {
    if (role) {
      if (requiresVerification) {
        return;
      }

      const setRole = async () => {
        try {
          await fetch("/api/users?endpoint=role", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role }),
          });
        } catch {}

        try {
          await fetch("/api/auth/setup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(getSetupPayload()),
          });
        } catch {}

        if (typeof window !== "undefined") {
          window.location.href = target;
        }
      };

      setRole();
      return;
    }

    if ((!role || fromSignin) && rolesQuery.data) {
      const roles = rolesQuery.data || [];
      let next = "/";

      if (Array.isArray(roles)) {
        if (roles.includes("seller")) next = "/seller";
        else if (roles.includes("consultant")) next = "/consultant";
        else if (roles.includes("partner")) next = "/partners/dashboard";
        else if (roles.includes("company")) next = "/companies/dashboard";
      }

      if (safeCallbackUrl) {
        next = safeCallbackUrl;
      }

      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }

      if (Array.isArray(roles) && roles.length > 0) {
        if (
          fromSignin &&
          roles.includes("consultant") &&
          signinEmail &&
          !roles.includes("seller")
        ) {
          updateContactEmail.mutate(signinEmail, {
            onSettled: () => {
              if (typeof window !== "undefined") {
                window.location.href = next;
              }
            },
          });
        } else if (typeof window !== "undefined") {
          window.location.href = next;
        }
        return;
      }
    }

    if (fromSignin && rolesQuery.isError) {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      if (typeof window !== "undefined") {
        window.location.href = safeCallbackUrl || "/consultant";
      }
    }
  }, [
    role,
    fromSignin,
    rolesQuery.data,
    rolesQuery.isError,
    signinEmail,
    updateContactEmail,
    roleTarget,
    requiresVerification,
    target,
    safeCallbackUrl,
  ]);

  const showRolePicker =
    !role &&
    fromSignin &&
    Array.isArray(rolesQuery.data) &&
    rolesQuery.data.length === 0;

  const chooseRole = async (r) => {
    try {
      await setRoleMut.mutateAsync(r);
      try {
        await fetch("/api/auth/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: r }),
        });
      } catch {}

      const next = (() => {
        if (r === "consultant") return "/consultant";
        if (r === "partner") return "/partners/dashboard";
        if (r === "company") return "/companies/dashboard";
        if (r === "seller") return "/seller";
        return "/";
      })();

      if (typeof window !== "undefined") {
        window.location.href = safeCallbackUrl || next;
      }
    } catch (e) {
      console.error("Failed to set role", e);
      alert("Could not set role. Please try again or contact support.");
    }
  };

  if (requiresVerification) {
    const email = user?.email || "your email";

    const isThrottled = !!sendVerification.data?.throttled;
    const retryAfterSeconds = Number(sendVerification.data?.retryAfterSeconds);
    const throttledMsg = isThrottled
      ? Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
        ? `We just sent a link — please wait about ${retryAfterSeconds} seconds before resending.`
        : "We just sent you a link a moment ago — please check your inbox before resending."
      : null;

    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border p-6 bg-white shadow-sm text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Confirm your email
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            We sent a verification link to{" "}
            <span className="font-medium">{email}</span>. Please click the link
            to finish setting up your account.
          </p>

          {throttledMsg && (
            <div className="mb-3 text-xs text-gray-600">{throttledMsg}</div>
          )}

          {sendVerification.isError && !isThrottled && (
            <div className="mb-3 text-sm text-red-600">
              Could not send email. Please try again.
            </div>
          )}

          <button
            onClick={() => sendVerification.mutate()}
            disabled={sendVerification.isLoading}
            className="px-4 py-2 rounded-lg bg-[#6F3FF5] text-white hover:bg-[#5b2fe9] disabled:opacity-60"
          >
            {sendVerification.isLoading ? "Sending…" : "Resend email"}
          </button>
          <div className="mt-3 text-xs text-gray-500">
            Didn’t get it? Check spam, or click Resend.
          </div>
        </div>
      </div>
    );
  }

  if (showRolePicker) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Choose your role
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            To finish setting up your account, pick how you’ll use Magic Match.
          </p>
          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              onClick={() => chooseRole("consultant")}
              className="px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm"
            >
              Consultant
            </button>
            <button
              onClick={() => chooseRole("company")}
              className="px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm"
            >
              Company
            </button>
            <button
              onClick={() => chooseRole("partner")}
              className="px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm"
            >
              Partner
            </button>
            <button
              onClick={() => chooseRole("seller")}
              className="px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm"
            >
              Seller
            </button>
          </div>
          <div className="text-xs text-gray-500">
            You can ask an admin to change this later if needed.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center text-gray-700">
        <div className="text-xl font-semibold mb-2">
          {role ? "Setting up your account…" : "Taking you to your dashboard…"}
        </div>
        <div className="text-sm">
          {role
            ? "We’ll take you to your dashboard in a moment."
            : "One sec while we detect your role."}
        </div>
      </div>
    </div>
  );
}
