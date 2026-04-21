"use client";

import { useEffect } from "react";

export default function LegacyLocalRootRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const target = "/";
    const suffix = `${window.location.search || ""}${window.location.hash || ""}`;
    window.location.replace(`${target}${suffix}`);
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F7F8] text-gray-900">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-3xl border border-gray-200 bg-white p-6">
          <div className="text-base font-extrabold">移動しています…</div>
          <div className="mt-2 text-sm text-gray-600">
            最新のURLへリダイレクトします。
          </div>
          <a
            href="/"
            className="mt-4 inline-flex items-center justify-center rounded-2xl bg-gray-900 px-4 py-3 text-sm font-extrabold text-white"
          >
            トップへ
          </a>
        </div>
      </div>
    </div>
  );
}
