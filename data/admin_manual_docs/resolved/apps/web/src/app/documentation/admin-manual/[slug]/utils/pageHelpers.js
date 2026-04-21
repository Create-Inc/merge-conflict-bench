import { ADMIN_MANUAL_PAGES } from "../data/pagesContent";
import { ADMIN_MANUAL_ORDER } from "../data/pageOrder";

export const ADMIN_MANUAL_PAGE_MAP = new Map(
  ADMIN_MANUAL_PAGES.map((p) => [p.slug, p]),
);

export function getOrderedPages() {
  const pages = [];
  for (const slug of ADMIN_MANUAL_ORDER) {
    const page = ADMIN_MANUAL_PAGE_MAP.get(slug);
    if (page) {
      pages.push(page);
    }
  }
  return pages;
}

export function getNavSlugs(slug) {
  const idx = ADMIN_MANUAL_ORDER.indexOf(slug);
  const prevSlug = idx > 0 ? ADMIN_MANUAL_ORDER[idx - 1] : null;
  const nextSlug =
    idx >= 0 && idx < ADMIN_MANUAL_ORDER.length - 1
      ? ADMIN_MANUAL_ORDER[idx + 1]
      : null;
  return { prevSlug, nextSlug };
}
