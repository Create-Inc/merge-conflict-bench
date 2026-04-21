"use client";

import React from "react";
import { Sparkles, ArrowRight } from "lucide-react";

// Tiles have text baked into the image (per product requirement)
const TILE_ASSETS = {
  "virtual-try-on":
    "https://raw.createusercontent.com/e52254c1-c3b0-4ee2-83aa-492092d72539/",
  eyelashes:
    "https://raw.createusercontent.com/e2e54b94-c6a2-43ae-a41a-54df1048c986/",
  "hair-system":
    "https://raw.createusercontent.com/75d6f095-4091-4b8c-a284-0184b8aa75c7/",
};

export default function AIStudioBetaHubPage() {
  const tiles = [
    {
      key: "virtual-try-on",
      href: "/ai-studio/beta/virtual-try-on",
      aria: "Open Virtual Try-On",
    },
    {
      key: "eyelashes",
      href: "/ai-studio/beta/eyelashes",
      aria: "Open Eye Lashes",
    },
    {
      key: "hair-system",
      href: "/ai-studio/beta/hair-system",
      aria: "Open Hair System",
    },
  ];

  return (
    <div
      className="p-4 sm:p-6 lg:p-8 min-h-full"
      style={{ backgroundColor: "var(--theme-bg-primary)" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
          <div>
            <div className="flex items-center gap-3">
              <div
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm"
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  color: "#065F46",
                }}
              >
                <Sparkles size={16} />
                AI Studio
              </div>
            </div>

            <h1
              className="text-2xl sm:text-3xl font-semibold mt-4"
              style={{
                fontFamily: "var(--theme-font-heading)",
                color: "var(--theme-text-primary)",
              }}
            >
              Choose what you want to do
            </h1>
            <p
              className="text-sm mt-2"
              style={{ color: "var(--theme-text-secondary)" }}
            >
              Pick a mode below, then start with a photo.
            </p>
          </div>

          <a
            href="/ai-studio/beta/start"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium"
            style={{
              backgroundColor: "var(--theme-btn-primary-bg)",
              color: "var(--theme-btn-primary-text)",
              border: "1px solid var(--theme-border)",
              boxShadow: "var(--theme-btn-primary-shadow)",
              fontFamily: "var(--theme-font-body)",
            }}
          >
            Start with a photo
            <ArrowRight size={16} />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiles.map((t) => {
            const imgUrl = TILE_ASSETS[t.key];
            const title = t.key;

            return (
              <a
                key={t.key}
                href={t.href}
                aria-label={t.aria}
                className="p-3 sm:p-4 block"
                style={{
                  backgroundColor: "var(--theme-tile-bg)",
                  border: "1px solid var(--theme-border)",
                  boxShadow: "var(--theme-tile-shadow)",
                  borderRadius: "var(--theme-tile-radius)",
                  textDecoration: "none",
                }}
              >
                {/* Text is baked into the image; keep only screen-reader label */}
                <span className="sr-only">{title}</span>
                {imgUrl ? (
                  <div
                    className="overflow-hidden"
                    style={{
                      backgroundColor: "rgba(0,0,0,0.03)",
                      border: "1px solid rgba(0,0,0,0.06)",
                      borderRadius: "calc(var(--theme-tile-radius) - 4px)",
                    }}
                  >
                    <img
                      src={imgUrl}
                      alt=""
                      className="w-full aspect-square object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : null}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
