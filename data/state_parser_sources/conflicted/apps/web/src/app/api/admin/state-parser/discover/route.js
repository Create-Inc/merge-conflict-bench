import sql from "@/app/api/utils/sql";
import {
  jsonNoStore,
  normalizeStateCode,
  requireAdminSessionOrReturnResponse,
} from "../utils";
import { fetchNjIndexSnapshot } from "../nj";
import { fetchCaRootSnapshot, parseCaPartLinks } from "../ca";

export const dynamic = "force-dynamic";

function looksForbiddenUrl(url) {
  const raw = String(url || "").toLowerCase();
  if (!raw) return true;
  if (raw.startsWith("bootstrap_pack://")) return true;
  if (raw.includes("example.com")) return true;
  if (raw.includes("localhost")) return true;
  if (raw.includes("bootstrap.local")) return true;
  return false;
}

function looksLikePdfUrl(url) {
  const u = String(url || "").trim();
  if (!u) return false;
  return /\.pdf(\b|\?)/i.test(u);
}

function inferCaCourtTypeFromTitle(text) {
  const t = String(text || "").toLowerCase();
  if (t.includes("appellate") || t.includes("title eight"))
    return "Appellate Court";
  // Default for CA rules of court ingestion
  return "Trial Court";
}

function titleToSafeKey(title) {
  return String(title || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

async function loadRootSource({ state, root_source_id }) {
  if (!root_source_id) return null;

  const rows = await sql(
    `
    SELECT
      id,
      source_key,
      source_name,
      source_url,
      rule_set,
      court_type,
      authority_name,
      source_class,
      parser_pattern_hint,
      parser_adapter_hint,
      parser_strategy,
      priority,
      COALESCE(is_authoritative, false) AS is_authoritative,
      COALESCE(is_parser_eligible, false) AS is_parser_eligible,
      COALESCE(is_active, true) AS is_active
    FROM public.rule_sources
    WHERE id = $1::int
      AND jurisdiction_code = $2::varchar
      AND COALESCE(is_active, true) = true
      AND NULLIF(btrim(source_url), '') IS NOT NULL
    LIMIT 1
  `,
    [root_source_id, state],
  );

  const row = rows?.[0] || null;
  if (!row?.id) return null;

  const trimmedUrl = String(row.source_url || "").trim() || null;

  return {
    id: Number(row.id),
    source_key:
      String(row.source_key || "").trim() || `rule_sources:${Number(row.id)}`,
    source_name: row.source_name ? String(row.source_name) : null,
    url: trimmedUrl,
    rule_set: row.rule_set ? String(row.rule_set) : null,
    court_type: row.court_type ? String(row.court_type) : null,
    authority_name: row.authority_name ? String(row.authority_name) : null,
    source_class: row.source_class ? String(row.source_class) : "unknown",
    pattern_hint: row.parser_pattern_hint || null,
    adapter_hint: row.parser_adapter_hint || null,
    parser_strategy: row.parser_strategy ? String(row.parser_strategy) : null,
    priority: Number(row.priority ?? 100),

    // Helpful for diagnostics
    is_authoritative: Boolean(row.is_authoritative),
    is_parser_eligible: Boolean(row.is_parser_eligible),
    is_active: Boolean(row.is_active),
  };
}

export async function POST(request) {
  const { ok, response } = await requireAdminSessionOrReturnResponse();
  if (!ok) return response;

  try {
    const body = await request.json().catch(() => ({}));
    const state = normalizeStateCode(body?.state);

    if (!state || state.length !== 2) {
      return jsonNoStore(
        {
          ok: false,
          error: "BAD_STATE",
          message: "state must be 2-letter code",
        },
        { status: 400 },
      );
    }

    // IMPORTANT: Number(null) === 0, which previously slipped through and then produced a confusing
    // "no usable URL" error. Treat missing/invalid/0 as "required".
    const root_source_id = Number(body?.root_source_id);
    if (!Number.isFinite(root_source_id) || root_source_id <= 0) {
      return jsonNoStore(
        {
          ok: false,
          error: "ROOT_SOURCE_REQUIRED",
          message:
            "root_source_id is required (pick an Active Source from the registry first).",
          state,
        },
        { status: 400 },
      );
    }

    const root = await loadRootSource({ state, root_source_id });

    if (!root) {
      return jsonNoStore(
        {
          ok: false,
          error: "ROOT_SOURCE_NOT_FOUND",
          message:
            "Selected root source was not found (or is inactive / missing a URL). Check the Rule Sources Manager entry.",
          state,
          root_source_id,
        },
        { status: 400 },
      );
    }

    let rootUrl = root?.url || null;
    if (looksForbiddenUrl(rootUrl)) rootUrl = null;

    if (!rootUrl) {
      return jsonNoStore(
        {
          ok: false,
          error: "NO_ROOT_URL",
          message:
            "Selected root source has no usable URL. Add or fix an authoritative Source URL in Rule Sources Manager (no localhost/example/bootstrap_pack).",
          state,
          root_source_id,
          root: {
            source_key: root.source_key,
            url: root?.url || null,
            source_class: root.source_class,
            is_authoritative: root.is_authoritative,
            is_parser_eligible: root.is_parser_eligible,
          },
        },
        { status: 400 },
      );
    }

    let discovered = [];
    let notes = {};

    if (state === "NJ") {
      // NJ: validate the root index is reachable, but return no children.
      try {
        const snap = await fetchNjIndexSnapshot(rootUrl);
        notes = {
          index_fetch_ok: true,
          http_status: snap.http_status || 200,
          content_type: snap.content_type || null,
          content_length: snap.content_length || null,
          html_length: snap.html_length || null,
          snapshot_hash: snap.hash,
        };
      } catch (e) {
        notes = {
          index_fetch_ok: false,
          error: e?.message || "FETCH_FAILED",
        };
      }

      return jsonNoStore({
        ok: true,
        state,
        root: {
          root_source_id,
          source_key: root.source_key,
          url: rootUrl,
        },
        discovered_children: [],
        items: [],
        discovered_count: 0,
        notes,
        message: "NJ discovery returned no child sources (single-root state).",
      });
    }

    if (state === "CA") {
      const cfg = {
        root_index_url: rootUrl,
        index_url: rootUrl,
        base_url: rootUrl ? new URL(rootUrl).origin : null,
      };

      const snap = await fetchCaRootSnapshot(cfg);
      const parts = parseCaPartLinks({ rootHtml: snap.html, cfg });

      discovered = (parts || [])
        .map((p) => {
          const name =
            String(p?.text || p?.title || "").trim() || "CA Rules Title";
          const url = String(p?.url || "").trim();
          const key = titleToSafeKey(name);

          const isPdf = looksLikePdfUrl(url);

          // Parser strategy is chosen by discovered content type.
          // These are UI-facing (state-scoped) keys; backend will normalize them.
          const parser_strategy = isPdf ? "ca_PDF_v1" : "ca_P4_v1";

          const adapter_hint = isPdf
            ? "PdfTextRuleAdapter"
            : "PatternP4MultiIndexAdapter";

          const pattern_hint = isPdf ? "P2" : "P4";

          return {
            key,
            source_key: key,
            source_name: name,
            url,
            jurisdiction_code: "CA",
            authority_name:
              root?.authority_name || "Judicial Branch of California",
            rule_set: root?.rule_set || "California Rules of Court",
            court_type: inferCaCourtTypeFromTitle(name),
            source_class: isPdf ? "pdf" : "authoritative",
            content_type_hint: isPdf ? "application/pdf" : "text/html",
            is_authoritative: true,
            is_parser_eligible: true,
            pattern_hint,
            adapter_hint,
            parser_strategy,
            priority: 50,
          };
        })
        .filter((d) => !looksForbiddenUrl(d.url));

      // Mark which discovered items are already registered
      const urls = discovered.map((d) => String(d.url || "")).filter(Boolean);
      const existing = urls.length
        ? await sql(
            `
            SELECT id, source_key, source_url, COALESCE(family_root, false) AS family_root
            FROM public.rule_sources
            WHERE jurisdiction_code = $1::varchar
              AND COALESCE(is_active, true) = true
              AND source_url = ANY($2::text[])
          `,
            [state, urls],
          )
        : [];

      const byUrl = new Map(
        (Array.isArray(existing) ? existing : []).map((r) => [
          String(r?.source_url || ""),
          {
            id: r?.id ? Number(r.id) : null,
            source_key: r?.source_key ? String(r.source_key) : null,
            family_root: Boolean(r?.family_root),
          },
        ]),
      );

      discovered = discovered.map((d) => {
        const hit = byUrl.get(String(d.url || "")) || null;
        const stableKey = String(hit?.source_key || "").trim();
        const alreadyRoot = Boolean(hit?.family_root);
        const alreadyRegistered = Boolean(hit?.id);

        return {
          ...d,
<<<<<<< ours
          already_registered: alreadyRegistered,
          already_root: alreadyRoot,
=======
          already_registered: Boolean(hit?.id),
          already_root: Boolean(hit?.family_root),
>>>>>>> theirs
          registered_id: hit?.id || null,
          registered_source_key: stableKey || null,
        };
      });

      notes = {
        index_fetch_ok: true,
        http_status: snap.http_status || 200,
        content_type: snap.content_type || null,
        content_length: snap.content_length || null,
        html_length: snap.html_length || null,
        snapshot_hash: snap.hash,
        parts_found: discovered.length,
      };

      return jsonNoStore({
        ok: true,
        state,
        root: {
          root_source_id,
          source_key: root.source_key,
          url: rootUrl,
        },
        discovered_children: discovered,
        items: discovered,
        discovered_count: discovered.length,
        notes,
        message: discovered.length
          ? `Discovered ${discovered.length} child source(s) from CA root index.`
          : "No child sources discovered.",
      });
    }

    return jsonNoStore({
      ok: true,
      state,
      root: { root_source_id, source_key: root.source_key, url: rootUrl },
      discovered_children: [],
      discovered_count: 0,
      notes: {},
      message: "Discovery is not implemented for this state yet.",
    });
  } catch (error) {
    console.error("[state-parser discover] error", error);
    return jsonNoStore(
      { ok: false, error: error?.message || "Failed" },
      { status: 500 },
    );
  }
}
