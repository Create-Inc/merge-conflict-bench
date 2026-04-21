import sql from "@/app/api/utils/sql";
import {
  jsonNoStore,
  normalizeStateCode,
  requireAdminSessionOrReturnResponse,
} from "../utils";
import { normalizeCourtLevelSafe } from "@/app/api/utils/court-type-normalization";

export const dynamic = "force-dynamic";

const KNOWN_DISCOVER_MODES = new Set(["", "html_index", "html_directory", "pdf_directory"]);

function safeText(v) {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

function safeBool(v) {
  if (v === true) return true;
  if (v === false) return false;
  return null;
}

function safeInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function normalizeSourceClass(v) {
  const s = String(v || "unknown")
    .trim()
    .toLowerCase();
  return s || "unknown";
}

function normalizeDiscoverMode(v) {
  const s = String(v ?? "").trim();
  if (KNOWN_DISCOVER_MODES.has(s)) return s;
  return "";
}

function normalizeUrl(raw) {
  const s = String(raw || "").trim();
  if (!s) return null;

  try {
    const u = new URL(s);
    u.hash = "";
    // soft-normalize trailing slash
    const p = u.pathname;
    if (p.length > 1 && p.endsWith("/")) {
      u.pathname = p.slice(0, -1);
    }
    return u.toString();
  } catch {
    // if it isn't a valid URL, store it as-is (DB still accepts text)
    return s;
  }
}

async function loadRowById(id) {
  if (!Number.isFinite(Number(id))) return null;

  const rows = await sql(
    `
    SELECT
      id,
      jurisdiction_code,
      source_key,
      source_name,
      source_url,
      court_type,
      rule_set,
      authority_name,
      source_class,
      content_type_hint,
      is_authoritative,
      is_parser_eligible,
      parser_pattern_hint,
      parser_adapter_hint,
      parser_strategy,
      priority,
      family_key,
      family_label,
      family_root,
      discover_mode,
      parent_source_id,
      source_depth,
      is_active,
      updated_at
    FROM public.rule_sources
    WHERE id = $1::int
    LIMIT 1
  `,
    [id],
  );

  return rows?.[0] || null;
}

export async function POST(request) {
  const { ok, response } = await requireAdminSessionOrReturnResponse();
  if (!ok) return response;

  try {
    const body = await request.json().catch(() => ({}));

    const state = normalizeStateCode(body?.state);
    if (!state || state.length !== 2) {
      return jsonNoStore(
        { ok: false, error: "BAD_STATE", message: "state must be 2-letter code" },
        { status: 400 },
      );
    }

    const source_url = normalizeUrl(body?.url);
    if (!source_url) {
      return jsonNoStore(
        { ok: false, error: "URL_REQUIRED", message: "url is required" },
        { status: 400 },
      );
    }

    const source_key = safeText(body?.source_key);

    const source_name = safeText(body?.source_name) || source_url;

    const rawCourtType = safeText(body?.court_type);
    const court_type = rawCourtType
      ? normalizeCourtLevelSafe(rawCourtType) || rawCourtType
      : null;

    const rule_set = safeText(body?.rule_set);
    const authority_name = safeText(body?.authority_name);

    const source_class = normalizeSourceClass(body?.source_class);
    const content_type_hint = safeText(body?.content_type_hint);

    const is_authoritative = safeBool(body?.is_authoritative);
    const is_parser_eligible = safeBool(body?.is_parser_eligible);

    const family_key = safeText(body?.family_key);
    const family_label = safeText(body?.family_label);
    const discover_mode = normalizeDiscoverMode(body?.discover_mode);

    const preferred_pattern = safeText(body?.preferred_pattern);

    const priority = safeInt(body?.priority);

    // Identity match: prefer stable (jurisdiction_code, source_key), else (jurisdiction_code, source_url)
    const existingRows = await sql(
      `
      SELECT id
      FROM public.rule_sources
      WHERE jurisdiction_code = $1::varchar
        AND COALESCE(is_active, true) = true
        AND (
          ($2::text IS NOT NULL AND source_key = $2::text)
          OR source_url = $3::text
        )
      ORDER BY id DESC
      LIMIT 1
    `,
      [state, source_key, source_url],
    );

    const existingId = existingRows?.[0]?.id ? Number(existingRows[0].id) : null;

    if (!existingId) {
      const rows = await sql(
        `
        INSERT INTO public.rule_sources (
          jurisdiction_code,
          rule_type,
          source_key,
          source_name,
          source_url,
          last_verified,
          rule_set,
          authority_name,
          ingestion_method,
          parser_strategy,
          is_active,
          court_type,
          source_class,
          content_type_hint,
          is_authoritative,
          is_parser_eligible,
          parser_pattern_hint,
          priority,
          family_key,
          family_label,
          family_root,
          discover_mode,
          parent_source_id,
          source_depth
        ) VALUES (
          $1::varchar,
          'parser',
          $2::text,
          $3::text,
          $4::text,
          CURRENT_DATE,
          $5::varchar,
          $6::varchar,
          'parser',
          'state_parser_v1',
          true,
          $7::varchar,
          $8::text,
          $9::text,
          $10::boolean,
          $11::boolean,
          $12::text,
          $13::int,
          $14::text,
          $15::text,
          true,
          $16::text,
          NULL,
          0
        )
        RETURNING id
      `,
        [
          state,
          source_key,
          source_name,
          source_url,
          rule_set,
          authority_name,
          court_type,
          source_class,
          content_type_hint,
          is_authoritative === null ? true : is_authoritative,
          is_parser_eligible === null ? true : is_parser_eligible,
          preferred_pattern,
          priority,
          family_key,
          family_label,
          discover_mode,
        ],
      );

      const id = rows?.[0]?.id ? Number(rows[0].id) : null;
      const row = id ? await loadRowById(id) : null;

      return jsonNoStore({ ok: true, action: "inserted", id, row });
    }

    // Update only fields that are provided, but ALWAYS force root wiring fields.
    const sets = [
      "family_root = true",
      "parent_source_id = NULL",
      "source_depth = 0",
      "updated_at = NOW()",
      "last_verified = CURRENT_DATE",
    ];

    const values = [existingId];
    let i = values.length;

    const addSet = (sqlFrag, val) => {
      i += 1;
      sets.push(sqlFrag.replace("$X", `$${i}`));
      values.push(val);
    };

    if (source_key !== null) addSet("source_key = $X::text", source_key);
    if (source_name) addSet("source_name = $X::text", source_name);
    if (source_url) addSet("source_url = $X::text", source_url);

    if (court_type !== null) addSet("court_type = $X::varchar", court_type);
    if (rule_set !== null) addSet("rule_set = $X::varchar", rule_set);
    if (authority_name !== null)
      addSet("authority_name = $X::varchar", authority_name);

    if (source_class) addSet("source_class = $X::text", source_class);
    if (content_type_hint !== null)
      addSet("content_type_hint = $X::text", content_type_hint);

    if (is_authoritative !== null)
      addSet("is_authoritative = $X::boolean", is_authoritative);
    if (is_parser_eligible !== null)
      addSet("is_parser_eligible = $X::boolean", is_parser_eligible);

    if (preferred_pattern !== null)
      addSet("parser_pattern_hint = $X::text", preferred_pattern);

    if (priority !== null) addSet("priority = $X::int", priority);

    // Root metadata
    if (family_key !== null) addSet("family_key = $X::text", family_key);
    if (family_label !== null) addSet("family_label = $X::text", family_label);
    addSet("discover_mode = $X::text", discover_mode);

    const q = `
      UPDATE public.rule_sources
      SET ${sets.join(", ")}
      WHERE id = $1::int
      RETURNING id
    `;

    const updated = await sql(q, values);
    const id = updated?.[0]?.id ? Number(updated[0].id) : existingId;
    const row = id ? await loadRowById(id) : null;

    return jsonNoStore({ ok: true, action: "updated", id, row });
  } catch (error) {
    console.error("[state-parser register-root] error", error);
    return jsonNoStore(
      { ok: false, error: error?.message || "Failed" },
      { status: 500 },
    );
  }
}
