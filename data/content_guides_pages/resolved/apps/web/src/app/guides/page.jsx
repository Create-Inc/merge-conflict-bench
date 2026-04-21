"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, BookOpen, ChevronRight } from "lucide-react";
import TopMenu from "@/components/TopMenu";
import PortalSectionTabs from "@/components/PortalSectionTabs";

const GUIDES = [
  {
    slug: "first-time-pass",
    category: "HOWTO",
    title: "はじめてのKAGOSHIMA-SHI JOREN NAVI（3分ガイド）",
    excerpt: "検索→保存→口コミ、まずはこの流れだけ覚えると便利です。",
    timeLabel: "更新: 今週",
    imageUrl: "https://ucarecdn.com/4e5a9407-5ed5-4d40-a0af-64f2ddac8e26/",
    tags: ["使い方", "基本"],
  },
  {
    slug: "date-spots",
    category: "DATE",
    title: "デート向きのお店の探し方",
    excerpt: "“静かに話せる”“雰囲気がいい”など、シーン別の探し方を紹介。",
    timeLabel: "更新: 今月",
    imageUrl:
      "https://ucarecdn.com/e4638038-a932-4571-92e6-0f034903a998/-/format/auto/",
    tags: ["デート", "グルメ"],
  },
  {
    slug: "tourist-lunch",
    category: "TRAVEL",
    title: "観光の合間に寄れるランチ",
    excerpt: "移動の途中でも寄りやすいランチを探すコツ。混雑回避の考え方も。",
    timeLabel: "更新: 今月",
    imageUrl:
      "https://ucarecdn.com/733a0510-bbc1-4f14-81ed-73b59b884814/-/format/auto/",
    tags: ["観光", "ランチ"],
  },
  {
    slug: "kagoshima-city-kaigyo",
    category: "HOWTO",
    title: "鹿児島市で開業しよう（ゼロからサポート）",
    excerpt: "物件・許認可・資金・集客を“順番”で整理して、開業を前に進める。",
    timeLabel: "更新: 今週",
    imageUrl: "https://ucarecdn.com/49f6948a-eaa9-40d5-b117-5f341c0e8324/",
    tags: ["開業", "集客"],
  },
];

const CATEGORY_META = {
  ALL: { label: "すべて" },
  HOWTO: { label: "使い方" },
  DATE: { label: "デート" },
  TRAVEL: { label: "観光" },
};

function getCategoryLabel(key) {
  const meta = CATEGORY_META[key];
  if (!meta) {
    return "その他";
  }
  return meta.label;
}

export default function LocalGuidesPage() {
  const guides = useMemo(() => GUIDES, []);
  const [activeCategory, setActiveCategory] = useState("ALL");

  const categoryKeys = useMemo(() => {
    const keys = new Set();
    for (const g of guides) {
      if (g?.category) {
        keys.add(g.category);
      }
    }
    const list = Array.from(keys);
    list.sort((a, b) => String(a).localeCompare(String(b)));
    return ["ALL", ...list];
  }, [guides]);

  const filteredGuides = useMemo(() => {
    if (activeCategory === "ALL") {
      return guides;
    }
    return guides.filter((g) => g.category === activeCategory);
  }, [activeCategory, guides]);

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
                <BookOpen size={18} className="text-gray-700" />
                <div className="truncate text-base font-extrabold">JOREN MAGAZINE</div>
              </div>
              <div className="mt-0.5 text-xs text-gray-500">編集部のおすすめ・特集（サンプル）</div>
            </div>

            <TopMenu />
          </div>

          <div className="mt-3">
            <PortalSectionTabs activeSection="local" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-12 pt-6 md:px-6">
        <section className="rounded-3xl border border-gray-200 bg-white p-5 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm font-extrabold text-gray-900">新着・おすすめ</div>
              <div className="mt-1 text-xs text-gray-500">カテゴリで絞り込めます</div>
            </div>

            <div className="flex w-full gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:w-auto">
              {categoryKeys.map((key) => {
                const isActive = key === activeCategory;
                const label = getCategoryLabel(key);
                const btnClass = isActive
                  ? "rounded-full bg-gray-900 px-3 py-2 text-xs font-extrabold text-white"
                  : "rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-extrabold text-gray-700 hover:bg-gray-50";

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveCategory(key)}
                    className={btnClass}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredGuides.map((g) => {
              const href = `/guides/${encodeURIComponent(g.slug)}`;
              const bgStyle = {
                backgroundImage: `url(${g.imageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              };

              const categoryKey = g.category || "";
              const categoryLabel = getCategoryLabel(categoryKey);
              const hasCategoryLabel = !!categoryKey;

              return (
                <a
                  key={g.slug}
                  href={href}
                  className="group block overflow-hidden rounded-3xl border border-gray-200 bg-white hover:bg-gray-50"
                >
                  <div className="relative h-[150px]" style={bgStyle}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4">
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-semibold text-white/90">{g.timeLabel}</div>
                        {hasCategoryLabel ? (
                          <div className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-extrabold text-white backdrop-blur">
                            {categoryLabel}
                          </div>
                        ) : null}
                      </div>
                      <div className="mt-1 text-lg font-extrabold text-white">{g.title}</div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="text-sm font-semibold text-gray-600">{g.excerpt}</div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(Array.isArray(g.tags) ? g.tags : []).slice(0, 6).map((tag) => (
                        <span
                          key={`${g.slug}-${tag}`}
                          className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-bold text-gray-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 inline-flex items-center gap-1 text-xs font-extrabold text-gray-900">
                      読む
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
