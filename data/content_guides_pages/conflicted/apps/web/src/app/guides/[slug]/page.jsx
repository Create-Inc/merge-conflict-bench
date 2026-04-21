"use client";

import { useEffect, useMemo } from "react";

<<<<<<< ours
const GUIDES = {
  "first-time-pass": {
    category: "HOWTO",
    title: "はじめてのKAGOSHIMA-SHI JOREN NAVI（3分ガイド）",
    timeLabel: "更新: 今週",
    imageUrl: "https://ucarecdn.com/4e5a9407-5ed5-4d40-a0af-64f2ddac8e26/",
    tags: ["使い方", "基本"],
    summary: [
      "まずは『検索→詳細→お気に入り』の3ステップ",
      "気になるお店は保存して、あとでまとめて比較",
      "住民認証（デモ）でJOREN割が使えるようになります",
    ],
    body: [
      "まずはこの3ステップだけでOKです。",
      "1. 検索で『天文館』『ランチ』『歯医者』など入れる\n2. 気になるお店の詳細を開く\n3. お気に入りに保存して後で見返す",
      "会員登録すると、口コミの閲覧・投稿や、JOREN割（住民認証後）の利用ができる想定です。",
    ],
  },
  "kagoshima-city-kaigyo": {
    category: "HOWTO",
    title: "鹿児島市で開業しよう（ゼロからサポート）",
    timeLabel: "更新: 今週",
    imageUrl: "https://ucarecdn.com/49f6948a-eaa9-40d5-b117-5f341c0e8324/",
    tags: ["開業", "店舗", "資金", "許認可", "集客"],
    summary: [
      "『何を/誰に/いくらで』を先に決めると失敗しにくい",
      "物件・許認可・お金・人材・集客を“順番”で整理",
      "Googleマップ（MEO）と予約導線を最初から設計する",
    ],
    body: [
      "鹿児島市でお店を開きたい方向けの、はじめの一歩まとめ（サンプル記事）です。",
      "\n## 1. まず決める：何を、誰に、いくらで",
      "・メニュー/サービスの核（強み）\n・ターゲット（誰の悩みを解決するか）\n・価格帯（利益が残る設計）",
      "\n## 2. 集客は“開業前”から仕込む（重要）",
      "・Googleビジネスプロフィール（MEO）を整備\n・写真/メニュー/予約導線を先に用意\n・SNSは『週1投稿』からでもOK",
    ],
  },
};

const CATEGORY_LABELS = {
  HOWTO: "使い方",
};

function getCategoryLabel(key) {
  if (!key) {
    return "";
  }
  return CATEGORY_LABELS[key] || "その他";
}

export default function LocalGuideDetailPage({ params }) {
=======
export default function GuideSlugRedirectPage({ params }) {
>>>>>>> theirs
  const raw = params?.slug || "";
  const slug = useMemo(() => {
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }, [raw]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.location.replace(`/local/guides/${encodeURIComponent(slug)}`);
  }, [slug]);

  const href = `/local/guides/${encodeURIComponent(slug)}`;

<<<<<<< ours
  if (!guide) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] text-gray-900">
        <header className="sticky top-0 z-40 border-b border-orange-100 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-6">
            <a
              href="/guides"
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-white hover:bg-gray-50"
              aria-label="戻る"
            >
              <ChevronLeft size={20} />
            </a>
            <div className="min-w-0 flex-1">
              <div className="text-base font-extrabold">読みもの</div>
              <div className="text-xs text-gray-500">記事が見つかりません</div>
            </div>
            <TopMenu />
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 pb-12 pt-6 md:px-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6">
            <div className="text-lg font-extrabold">404</div>
            <div className="mt-2 text-sm text-gray-600">
              このページは見つかりませんでした。
            </div>
            <a
              href="/guides"
              className="mt-4 inline-flex items-center justify-center rounded-2xl bg-gray-900 px-4 py-3 text-sm font-extrabold text-white"
            >
              読みもの一覧に戻る
            </a>
          </div>
        </main>
      </div>
    );
  }

  const tagList = Array.isArray(guide.tags) ? guide.tags : [];
  const summaryList = Array.isArray(guide.summary) ? guide.summary : [];
  const hasSummary = summaryList.length > 0;

  const categoryLabel = getCategoryLabel(guide.category);
  const hasCategory = !!guide.category;

=======

>>>>>>> theirs
  return (
<<<<<<< ours
    <div className="min-h-screen bg-[#F7F7F8] text-gray-900">
      <header className="sticky top-0 z-40 border-b border-orange-100 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <a
              href="/guides"
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
                <div className="truncate text-base font-extrabold">
                  読みもの
                </div>
              </div>
              <div className="mt-0.5 text-xs text-gray-500">JOREN MAGAZINE</div>
            </div>

            <TopMenu />
          </div>

          <div className="mt-3">
            <PortalSectionTabs activeSection="local" />
          </div>
=======
    <div className="min-h-screen bg-white p-6 text-gray-900">
      <div className="mx-auto max-w-md rounded-3xl border border-gray-200 bg-white p-5">
        <div className="text-base font-extrabold">移動中…</div>
        <div className="mt-2 text-sm text-gray-600">
          記事ページは <span className="font-bold">{href}</span>{" "}
          に移動しました。
>>>>>>> theirs
        </div>
<<<<<<< ours
      </header>

      {/* HERO */}
      <section className="w-full">
        <div className="relative overflow-hidden bg-gray-200" style={heroStyle}>
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/10" />
          <div className="relative mx-auto max-w-6xl px-4 py-10 md:px-6">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                  <Clock3 size={14} />
                  {guide.timeLabel}
                </div>
                {hasCategory ? (
                  <div className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-extrabold text-white backdrop-blur">
                    {categoryLabel}
                  </div>
                ) : null}
              </div>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white md:text-4xl">
                {guide.title}
              </h1>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-4 pb-12 pt-6 md:px-6">
        <section className="rounded-3xl border border-gray-200 bg-white p-5 md:p-6">
          {hasSummary ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-sm font-extrabold text-gray-900">
                <ListChecks size={16} className="text-gray-700" />
                この記事の要約
              </div>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
                {summaryList.slice(0, 5).map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className={hasSummary ? "mt-5" : ""}>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 font-bold text-gray-700">
                <Tag size={14} className="text-gray-500" />
                タグ
              </div>
              {tagList.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 font-bold text-gray-700"
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="mt-5 space-y-4">
              {guide.body.map((p, idx) => {
                const text = String(p);
                const isH2 = text.startsWith("## ");
                const headingText = isH2 ? text.replace(/^##\s+/, "") : "";

                if (isH2) {
                  return (
                    <h2
                      key={idx}
                      className="pt-2 text-base font-extrabold text-gray-900"
                    >
                      {headingText}
                    </h2>
                  );
                }

                return (
                  <p
                    key={idx}
                    className="whitespace-pre-line text-sm text-gray-700"
                  >
                    {text}
                  </p>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-sm font-extrabold">次にやれること</div>
              <div className="mt-1 text-sm text-gray-700">
                気になるお店を探して、お気に入りに保存してみましょう。
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <a
                  href="/search"
                  className="inline-flex items-center justify-center rounded-2xl bg-gray-900 px-4 py-3 text-sm font-extrabold text-white"
                >
                  お店を探す
                </a>
                <a
                  href="/community"
                  className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-extrabold text-gray-900"
                >
                  みんなの推しを聞く
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
=======
        <a
          href={href}
          className="mt-4 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#E63946] px-4 py-3 text-sm font-extrabold text-white"
        >
          記事を開く
        </a>
      </div>
>>>>>>> theirs
    </div>
  );
}
