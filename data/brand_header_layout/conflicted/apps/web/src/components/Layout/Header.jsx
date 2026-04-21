"use client";

import { useMemo, useState } from "react";
import useCurrentUser from "@/hooks/useCurrentUser";
import {
  BRAND_NAME,
  BRAND_NAME_PLAIN,
  BRAND_TAGLINE,
  BRAND_LOGO_URL,
  BRAND_WORDMARK_URL,
} from "@/utils/brand";

export function Header({ hideConnectivityNote = false }) {
  const brandName = BRAND_NAME;
  const tagline = BRAND_TAGLINE;
  const [wordmarkFailed, setWordmarkFailed] = useState(false);

  const { data: user } = useCurrentUser();

  const initials = useMemo(() => {
    const label = user?.email || user?.name;
    if (!label || typeof label !== "string") {
      return "CA";
    }

    const cleaned = label.trim();
    if (!cleaned) {
      return "CA";
    }

    if (cleaned.includes("@")) {
      return cleaned.slice(0, 2).toUpperCase();
    }

    const parts = cleaned.split(/\s+/).filter(Boolean);
    const first = parts[0] ? parts[0][0] : "C";
    const second = parts[1] ? parts[1][0] : "A";
    return `${first}${second}`.toUpperCase();
  }, [user?.email, user?.name]);

  const authHref = useMemo(() => {
    if (typeof window === "undefined") {
      return user ? "/account/logout" : "/account/signin";
    }

    const callbackUrl = `${window.location.pathname}${window.location.search}`;
    if (user) {
      return "/account/logout";
    }

    return `/account/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  }, [user]);

  const authLabel = useMemo(() => {
    return user ? "Sign out" : "Sign in";
  }, [user]);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      {/* Top row (brand + account) */}
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src={BRAND_LOGO_URL}
            alt={`${BRAND_NAME_PLAIN} Logo`}
            className="w-20 h-20 rounded-lg object-contain"
          />
          <div className="flex flex-col">
<<<<<<< ours
            {/* Bigger wordmark for better readability on phones */}
            <img
              src={BRAND_WORDMARK_URL}
              alt={BRAND_NAME}
              className="h-10 md:h-12 w-auto max-w-[320px] object-contain"
            />
            <p className="font-inter font-semibold text-sm md:text-base text-teal-700 leading-tight mt-1">
=======
            {/* Use the brand wordmark graphic everywhere instead of plain text */}
            {!wordmarkFailed ? (
              <img
                src={BRAND_WORDMARK_URL}
                alt={BRAND_NAME}
                className="h-8 w-auto object-contain"
                onError={() => setWordmarkFailed(true)}
              />
            ) : (
              <div className="font-inter font-extrabold text-2xl text-teal-700 leading-tight">
                {brandName}
              </div>
            )}
            <p className="font-inter font-semibold text-sm text-teal-700 leading-tight mt-1">
>>>>>>> theirs
              {tagline}
            </p>
          </div>
        </div>

        {/* Right side links */}
        <div className="flex items-center gap-3">
          {/*
            Per request: remove Docs/FAQ/Privacy from the header area.
            Show a simple "Sign out" label next to the initials.
          */}
          <a
            href={authHref}
            className="inline-flex items-center gap-3 rounded-full px-2 py-1 hover:bg-gray-50 active:bg-gray-100"
            aria-label={authLabel}
          >
            <span className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-semibold">
              {initials}
            </span>
            <span className="font-inter font-semibold text-sm text-gray-800">
              {authLabel}
            </span>
          </a>
        </div>
      </div>

      {/* Connectivity note */}
      {!hideConnectivityNote ? (
        <div className="px-5 pb-4 -mt-2">
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
            <div className="font-inter text-[12px] text-amber-900 leading-4">
              Using this App requires a robust connection (e.g. Wi-Fi) to the
              Internet.
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
