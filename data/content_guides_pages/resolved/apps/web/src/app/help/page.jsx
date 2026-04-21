"use client";

import { useCallback, useMemo, useState } from "react";
import TopMenu from "@/components/TopMenu";
import PortalSectionTabs from "@/components/PortalSectionTabs";
import {
  ChevronLeft,
  HelpCircle,
  ChevronDown,
  Search,
  Heart,
  Star,
  User,
} from "lucide-react";

function FaqItem({ q, a, open, onToggle }) {
  const iconStyle = open ? { transform: "rotate(180deg)" } : undefined;

  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left hover:bg-gray-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-extrabold text-gray-900">{q}</div>
          {open ? (
            <div className="mt-2 whitespace-pre-line text-sm text-gray-700">
              {a}
            </div>
          ) : null}
        </div>
        <ChevronDown
          size={18}
          className="mt-0.5 text-gray-400"
          style={iconStyle}
        />
      </div>
    </button>
  );
}

export default function LocalHelpPage() {
  const [openKey, setOpenKey] = useState("q1");

  const toggle = useCallback((key) => {
    setOpenKey((prev) => {
      if (prev === key) {
        return null;
      }
      return key;
    });
  }, []);

  const faq = useMemo(() => {
    return [
      {
        key: "q1",
        q: "まず何から使えばいい？",
        a: "おすすめはこの順です。\n\n1) 検索でエリアやキーワードを入れる\n2) お店の詳細を見る\n3) 気になるお店をお気に入りに入れる\n\nログインすると口コミが見られたり、投稿できる想定です。",
      },
      {
        key: "q2",
        q: "ログインは必要？",
        a: "見るだけなら不要なページもあります。\n口コミの閲覧・投稿などはログインが必要な想定です（運用ルールに合わせて変更できます）。",
      },
      {
        key: "q3",
        q: "掲載情報を直したい／オーナーです",
        a: "お店の詳細ページから『オーナーとして申請』ができる導線を用意できます。\nいまはサンプルのため、実運用に向けて承認フローを整えるのがおすすめです。",
      },
    ];
  }, []);

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

            <a href="/" className="leading-none" aria-label="ホーム">
              <div className="text-lg font-extrabold tracking-tight text-gray-900 md:text-xl">
                KAGOSHIMA-SHI JOREN NAVI
              </div>
            </a>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <HelpCircle size={18} className="text-gray-700" />
                <div className="truncate text-base font-extrabold">使い方・FAQ</div>
              </div>
            </div>

            <TopMenu />
          </div>

          <div className="mt-3">
            <PortalSectionTabs activeSection="local" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-12 pt-6 md:px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-gray-200 bg-white p-5 md:p-6">
            <div className="text-base font-extrabold">はじめての使い方（3ステップ）</div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-sm font-extrabold">
                  <Search size={18} className="text-gray-700" />
                  探す
                </div>
                <div className="mt-2 text-sm text-gray-700">
                  天文館 / ランチ / 歯医者 などで検索。
                </div>
              </div>
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-sm font-extrabold">
                  <Star size={18} className="text-gray-700" />
                  比べる
                </div>
                <div className="mt-2 text-sm text-gray-700">
                  お店の詳細と口コミで、雰囲気をつかむ。
                </div>
              </div>
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-sm font-extrabold">
                  <Heart size={18} className="text-gray-700" />
                  保存
                </div>
                <div className="mt-2 text-sm text-gray-700">
                  気になったらお気に入り。あとで迷わない。
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-gray-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100">
                  <User size={18} className="text-gray-700" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold">ログインするとできること</div>
                  <div className="mt-1 text-sm text-gray-700">
                    口コミの閲覧・投稿、コミュニティ参加など。運用に合わせて調整できます。
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              ※このページはサンプルです。文言や導線はあとで整えられます。
            </div>
          </section>

          <aside className="rounded-3xl border border-gray-200 bg-white p-5 md:p-6">
            <div className="text-base font-extrabold">FAQ</div>
            <div className="mt-4 space-y-3">
              {faq.map((f) => {
                const isOpen = openKey === f.key;
                return (
                  <FaqItem
                    key={f.key}
                    q={f.q}
                    a={f.a}
                    open={isOpen}
                    onToggle={() => toggle(f.key)}
                  />
                );
              })}
            </div>

            {/* NOTE: business portal link removed on regional portal pages */}
          </aside>
        </div>
      </main>
    </div>
  );
}
