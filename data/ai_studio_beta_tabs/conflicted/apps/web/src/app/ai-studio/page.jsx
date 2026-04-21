"use client";

import React from "react";

export default function AIStudioPage() {
  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
<<<<<<< ours
      // Beta is now the primary AI Studio experience.
      window.location.replace("/ai-studio/beta");
=======
      // AI Studio Beta is now the primary experience.
      window.location.replace("/ai-studio/beta");
>>>>>>> theirs
    } catch (e) {
<<<<<<< ours
      console.error("Failed to redirect to AI Studio Beta", e);
=======
      console.error("Failed to redirect to AI Studio", e);
>>>>>>> theirs
    }
  }, []);

  return (
    <div
<<<<<<< ours
      className="p-6 min-h-full"
=======
      className="p-6 sm:p-8 min-h-full"
>>>>>>> theirs
      style={{ backgroundColor: "var(--theme-bg-primary)" }}
    >
<<<<<<< ours
      <div
        className="max-w-xl rounded-3xl p-5"
        style={{
          backgroundColor: "var(--theme-bg-surface)",
          border: "1px solid var(--theme-border)",
          boxShadow: "var(--theme-tile-shadow)",
          color: "var(--theme-text-primary)",
        }}
      >
        <div
          className="text-lg font-semibold"
          style={{ fontFamily: "var(--theme-font-heading)" }}
        >
          Opening AI Studio…
        </div>
        <div
          className="text-sm mt-2"
          style={{ color: "var(--theme-text-secondary)" }}
        >
          If you’re not redirected automatically, use the link below.
        </div>

        <a
          href="/ai-studio/beta"
          className="inline-flex mt-4 items-center justify-center px-4 py-2.5 rounded-full text-sm font-semibold"
          style={{
            backgroundColor: "var(--theme-btn-primary-bg)",
            color: "var(--theme-btn-primary-text)",
            border: "1px solid var(--theme-border)",
            boxShadow: "var(--theme-btn-primary-shadow)",
            fontFamily: "var(--theme-font-body)",
            textDecoration: "none",
          }}
        >
          Go to AI Studio
        </a>
      </div>
=======
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
>>>>>>> theirs
    </div>
  );
}
