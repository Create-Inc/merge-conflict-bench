"use client";

import React from "react";

export default function AIStudioPage() {
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // AI Studio Beta is now the primary experience.
      window.location.replace("/ai-studio/beta");
    } catch (e) {
      console.error("Failed to redirect to AI Studio", e);
    }
  }, []);

  return (
    <div
      className="p-6 sm:p-8 min-h-full"
      style={{ backgroundColor: "var(--theme-bg-primary)" }}
    >
      <div className="max-w-xl">
        <h1
          className="text-2xl font-semibold"
          style={{
            fontFamily: "var(--theme-font-heading)",
            color: "var(--theme-text-primary)",
          }}
        >
          AI Studio
        </h1>
        <p className="mt-2" style={{ color: "var(--theme-text-secondary)" }}>
          Loading…
        </p>
        <a
          href="/ai-studio/beta"
          className="inline-flex mt-4 underline"
          style={{ color: "var(--theme-text-primary)" }}
        >
          Continue
        </a>
      </div>
    </div>
  );
}
