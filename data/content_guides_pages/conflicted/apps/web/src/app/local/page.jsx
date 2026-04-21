<<<<<<< ours
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
=======
"use client";

import { StickyHeader } from "@/components/HomePage/StickyHeader";
import { HeroSection } from "@/components/HomePage/HeroSection";
import { AmbassadorBanner } from "@/components/HomePage/AmbassadorBanner";
import { CategoriesSection } from "@/components/HomePage/CategoriesSection";
import { RelocationFeatureSection } from "@/components/HomePage/RelocationFeatureSection";
import { FeaturedSection } from "@/components/HomePage/FeaturedSection";
import { SummaryCardsSection } from "@/components/HomePage/SummaryCardsSection";
import { RebniseFeatureSection } from "@/components/HomePage/RebniseFeatureSection";
import { StoreSliderSection } from "@/components/HomePage/StoreSliderSection";
import { MagazineSection } from "@/components/HomePage/MagazineSection";
import { Footer } from "@/components/HomePage/Footer";

export default function LocalHomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F7F7F8] text-gray-900">
      <StickyHeader />

      <HeroSection />

      {/* HERO下に重ねて縦を増やしすぎないアンバサダー帯（SPでも見つけやすく） */}
      <div className="relative z-10 mx-auto -mt-10 max-w-6xl px-0 md:-mt-12 md:px-6">
        <AmbassadorBanner href="/local/about" />
      </div>

      {/* Main */}
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-4 md:px-6 md:pb-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.4fr_1fr]">
          {/* Left */}
          <div className="min-w-0">
            <CategoriesSection />

            {/* isolated relocation spotlight (not part of 注目特集 slider) */}
            <RelocationFeatureSection />

            <FeaturedSection />

            <SummaryCardsSection />

            {/* NEW: Rebnise spotlight (independent from sliders) */}
            <RebniseFeatureSection />

            {/* NOTE: Business content moved to /business */}

            <StoreSliderSection
              title="人気のグルメ"
              categoryName="グルメ"
              moreHref="/local/category/%E3%82%B0%E3%83%AB%E3%83%A1"
            />
            <StoreSliderSection
              title="人気の美容・サロン"
              categoryName="美容・サロン"
              moreHref="/local/category/%E7%BE%8E%E5%AE%B9%E3%83%BB%E3%82%B5%E3%83%AD%E3%83%B3"
            />
            <StoreSliderSection
              title="人気のおでかけスポット"
              categoryName="おでかけ"
              moreHref="/local/category/%E3%81%8A%E3%81%A7%E3%81%8B%E3%81%91"
            />
          </div>

          {/* Right */}
          <MagazineSection />
        </div>
      </main>

      <Footer />
    </div>
  );
}
>>>>>>> theirs
