"use client";

import { useEffect } from "react";

export default function Page() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.location.replace("/local");
  }, []);

<<<<<<< ours
      <HeroSection />

      {/* HERO下に重ねて縦を増やしすぎないアンバサダー帯（SPでも見つけやすく） */}
      <div className="relative z-10 mx-auto -mt-10 max-w-6xl px-0 md:-mt-12 md:px-6">
        <AmbassadorBanner href="/about" />
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
              moreHref="/category/%E3%82%B0%E3%83%AB%E3%83%A1"
            />
            <StoreSliderSection
              title="人気の美容・サロン"
              categoryName="美容・サロン"
              moreHref="/category/%E7%BE%8E%E5%AE%B9%E3%83%BB%E3%82%B5%E3%83%AD%E3%83%B3"
            />
            <StoreSliderSection
              title="人気のおでかけスポット"
              categoryName="おでかけ"
              moreHref="/category/%E3%81%8A%E3%81%A7%E3%81%8B%E3%81%91"
            />
          </div>

          {/* Right */}
          <MagazineSection />
=======
  return (
    <div className="min-h-screen bg-white p-6 text-gray-900">
      <div className="mx-auto max-w-md rounded-3xl border border-gray-200 bg-white p-5">
        <div className="text-base font-extrabold">移動中…</div>
        <div className="mt-2 text-sm text-gray-600">
          トップページは <span className="font-bold">/local</span>{" "}
          に移動しました。
>>>>>>> theirs
        </div>
        <a
          href="/local"
          className="mt-4 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#E63946] px-4 py-3 text-sm font-extrabold text-white"
        >
          /local を開く
        </a>
      </div>
    </div>
  );
}
