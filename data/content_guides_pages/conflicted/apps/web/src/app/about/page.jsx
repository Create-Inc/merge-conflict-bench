"use client";

import { useEffect } from "react";

<<<<<<< ours
export default function LocalAboutPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F8] text-gray-900">
      <header className="sticky top-0 z-40 border-b border-orange-100 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-white hover:bg-gray-50"
              aria-label="戻る"
            >
              <ChevronLeft size={20} />
            </a>
=======
export default function AboutRedirectPage() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.location.replace("/local/about");
  }, []);
>>>>>>> theirs

<<<<<<< ours
            <a href="/" className="leading-none" aria-label="ホーム">
              <div className="text-lg font-extrabold tracking-tight text-gray-900 md:text-xl">
                KAGOSHIMA-SHI JOREN NAVI
              </div>
            </a>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Info size={18} className="text-gray-700" />
                <div className="truncate text-base font-extrabold">
                  このサイトについて
                </div>
              </div>
            </div>

            <TopMenu />
          </div>

          <div className="mt-3">
            <PortalSectionTabs activeSection="local" />
          </div>
=======
  return (
    <div className="min-h-screen bg-white p-6 text-gray-900">
      <div className="mx-auto max-w-md rounded-3xl border border-gray-200 bg-white p-5">
        <div className="text-base font-extrabold">移動中…</div>
        <div className="mt-2 text-sm text-gray-600">
          このページは <span className="font-bold">/local/about</span>{" "}
          に移動しました。
>>>>>>> theirs
        </div>
<<<<<<< ours
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-12 pt-6 md:px-6">
        <section className="rounded-3xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 text-base font-extrabold">
            <Sparkles size={18} className="text-gray-700" />
            KAGOSHIMA-SHI JOREN NAVIとは
          </div>
          <p className="mt-3 text-sm leading-relaxed text-gray-700">
            鹿児島県鹿児島市に限定したローカルメディアです。住民認証（デモ）などを通じて、県民だけの常連割引き（JOREN割）を使える世界観を想定しています。
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
              <div className="text-sm font-extrabold">
                このサイトで増やしていくもの
              </div>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
                <li>読みもの・特集（エリア/シーン/季節）</li>
                <li>コミュニティのスレ（相談・おすすめ）</li>
                <li>お店の情報（基本情報/写真/口コミ）</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex items-center gap-2 text-sm font-extrabold">
                <Shield size={18} className="text-gray-700" />
                運用の考え方（サンプル）
              </div>
              <div className="mt-3 text-sm text-gray-700">
                口コミやコミュニティは、安心して使える雰囲気が大事なので、あとでガイドラインと通報導線を入れるのがオススメです。
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2 text-sm font-extrabold">
              <Mail size={18} className="text-gray-700" />
              お問い合わせ（サンプル）
            </div>
            <div className="mt-2 text-sm text-gray-700">
              連絡先は後で差し替えできます。
            </div>
            <div className="mt-3">
              <a
                href="mailto:info@kagoshima-portal.jp"
                className="inline-flex items-center justify-center rounded-2xl bg-gray-900 px-4 py-3 text-sm font-extrabold text-white"
              >
                info@kagoshima-portal.jp
              </a>
            </div>
          </div>
        </section>
      </main>
=======
        <a
          href="/local/about"
          className="mt-4 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#E63946] px-4 py-3 text-sm font-extrabold text-white"
        >
          /local/about を開く
        </a>
      </div>
>>>>>>> theirs
    </div>
  );
}
