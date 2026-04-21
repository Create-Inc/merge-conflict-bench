"use client";

import { useEffect, useState } from "react";

export default function FloatingDemoCTA() {
  const [isVisible, setIsVisible] = useState(false);

  // Show after a little scroll so it feels less spammy.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onScroll = () => {
      const y = window.scrollY || 0;
      setIsVisible(y > 240);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed right-4 bottom-4 z-[9999] transition-all duration-500 ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      <a
        href="/demo/access"
        // IMPORTANT: force white text so it can't be overridden by global marketing link styling
        className="group inline-flex items-center gap-2 rounded-2xl px-5 py-4 text-sm font-bold bg-[#2B86C6] text-white !text-white shadow-2xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#2579B3]"
        style={{ color: "#ffffff" }}
      >
        <span className="whitespace-nowrap text-white !text-white" style={{ color: "#ffffff" }}>
          Try the demo
        </span>
        <span
          className="transition-transform duration-300 group-hover:translate-x-0.5 text-white !text-white"
          style={{ color: "#ffffff" }}
        >
          →
        </span>
      </a>
    </div>
  );
}
