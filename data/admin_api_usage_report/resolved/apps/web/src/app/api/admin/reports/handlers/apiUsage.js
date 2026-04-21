import sql from "@/app/api/utils/sql";
import { getUsageWindowSummary } from "@/app/api/music/utils/movieQuotes/usageTracking";
import { getMovieQuoteConfig } from "@/app/api/music/utils/movieQuotes";

// Admin-controlled daily reset configuration.
// IMPORTANT: This does NOT reset or delete raw metrics; it only changes the cutoff
// we use when computing the "Today" window.
const RESET_KEY = "api_usage_reset";

const DEFAULT_RESET = {
  hour: 3, // 1-12
  ampm: "am", // 'am' | 'pm'
  timeZone: "America/New_York", // ET (labelled "EST" in UI)
  timeZoneLabel: "EST",
};

const TZ_OPTIONS = {
  EST: "America/New_York",
  PST: "America/Los_Angeles",
  UTC: "UTC",
};

function safeObj(v) {
  return v && typeof v === "object" && !Array.isArray(v) ? v : null;
}

function normalizeResetConfig(raw) {
  const r = safeObj(raw) || {};

  // accept either hour or hour12
  const hourRaw = Number(r.hour ?? r.hour12 ?? DEFAULT_RESET.hour);
  const hour =
    Number.isFinite(hourRaw) && hourRaw >= 1 && hourRaw <= 12
      ? hourRaw
      : DEFAULT_RESET.hour;

  const ampmRaw = String(r.ampm || DEFAULT_RESET.ampm).toLowerCase();
  const ampm = ampmRaw === "pm" ? "pm" : "am";

  const tzRaw = String(r.timeZone || r.tz || DEFAULT_RESET.timeZone).trim();
  const allowedTimeZones = new Set(Object.values(TZ_OPTIONS));
  const timeZone = allowedTimeZones.has(tzRaw) ? tzRaw : DEFAULT_RESET.timeZone;

  const timeZoneLabelRaw = String(r.timeZoneLabel || "").trim();
  const derivedLabel =
    Object.entries(TZ_OPTIONS).find(([, v]) => v === timeZone)?.[0] ||
    DEFAULT_RESET.timeZoneLabel;

  const timeZoneLabel = TZ_OPTIONS[timeZoneLabelRaw]
    ? timeZoneLabelRaw
    : derivedLabel;

  return { hour, ampm, timeZone, timeZoneLabel };
}

async function getResetConfig() {
  try {
    const rows = await sql(
      `SELECT value FROM app_settings WHERE key = $1 LIMIT 1`,
      [RESET_KEY],
    );
    return normalizeResetConfig(rows?.[0]?.value ?? null);
  } catch (_) {
    return { ...DEFAULT_RESET };
  }
}

async function setResetConfig(next) {
  const clean = normalizeResetConfig(next);

  await sql(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value,
           updated_at = now()`,
    [RESET_KEY, JSON.stringify(clean)],
  );

  return clean;
}

function getDatePartsInTimeZone(date, timeZone) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(date);
  const map = {};
  for (const p of parts) {
    if (p.type !== "literal") {
      map[p.type] = p.value;
    }
  }
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

function getTimeZoneOffsetMinutes(date, timeZone) {
  const p = getDatePartsInTimeZone(date, timeZone);
  const asUTC = Date.UTC(
    p.year,
    p.month - 1,
    p.day,
    p.hour,
    p.minute,
    p.second,
  );
  // If timeZone is behind UTC, this will be negative (e.g. PT ~ -480).
  return Math.round((asUTC - date.getTime()) / 60000);
}

function makeDateAtTimeZone(date, timeZone, hour = 0, minute = 0) {
  const p = getDatePartsInTimeZone(date, timeZone);
  const utcGuess = new Date(
    Date.UTC(p.year, p.month - 1, p.day, hour, minute, 0),
  );
  const offsetMin = getTimeZoneOffsetMinutes(utcGuess, timeZone);
  return new Date(utcGuess.getTime() - offsetMin * 60000);
}

function hour12To24(hour12, ampm) {
  const h = Math.max(1, Math.min(12, Number(hour12 || 12)));
  const a = String(ampm || "am").toLowerCase() === "pm" ? "pm" : "am";
  if (a === "am") return h === 12 ? 0 : h;
  return h === 12 ? 12 : h + 12;
}

function computeTodayStart({ now, reset }) {
  const tz = reset.timeZone;
  const hour24 = hour12To24(reset.hour, reset.ampm);

  const candidate = makeDateAtTimeZone(now, tz, hour24, 0);
  if (now >= candidate) return candidate;

  // Before reset time today: treat "today" as starting at yesterday's reset.
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return makeDateAtTimeZone(yesterday, tz, hour24, 0);
}

async function getTodayUsageSummary({
  groupKey,
  providerKeys,
  todayStart,
  now,
} = {}) {
  const g = String(groupKey || "").trim();
  const keys = Array.isArray(providerKeys)
    ? providerKeys.map((k) => String(k || "").trim()).filter(Boolean)
    : [];
  if (!g || !keys.length) return {};

  const rows = await sql(
    `SELECT provider_key AS key,
            SUM(attempts_count) AS attempts,
            SUM(hits_count) AS hits,
            SUM(misses_count) AS misses,
            SUM(blocked_count) AS blocked
     FROM api_usage_metrics
     WHERE group_key = $1
       AND window_kind = 'hour'
       AND window_start >= $2
       AND window_start < $3
       AND provider_key = ANY($4::text[])
     GROUP BY provider_key`,
    [g, todayStart, now, keys],
  );

  const map = {};
  for (const r of rows || []) {
    map[r.key] = {
      attempts: Number(r.attempts || 0),
      hits: Number(r.hits || 0),
      misses: Number(r.misses || 0),
      blocked: Number(r.blocked || 0),
    };
  }
  return map;
}

// Per-hour breakdown (drill-down) for a single group.
async function getHourlyUsageTimeline({ groupKey, providerKeys, todayStart, now }) {
  const g = String(groupKey || "").trim();
  const keys = Array.isArray(providerKeys)
    ? providerKeys.map((k) => String(k || "").trim()).filter(Boolean)
    : [];

  if (!g || !keys.length) return [];

  const rows = await sql(
    `SELECT window_start AS "windowStart",
            provider_key AS "providerKey",
            attempts_count AS attempts,
            hits_count AS hits,
            misses_count AS misses,
            blocked_count AS blocked
     FROM api_usage_metrics
     WHERE group_key = $1
       AND window_kind = 'hour'
       AND window_start >= $2
       AND window_start < $3
       AND provider_key = ANY($4::text[])
     ORDER BY window_start ASC`,
    [g, todayStart, now, keys],
  );

  const byHour = new Map();

  for (const r of rows || []) {
    const ws = r?.windowStart ? new Date(r.windowStart).toISOString() : null;
    if (!ws) continue;

    const entry = byHour.get(ws) || {
      windowStart: ws,
      providers: {},
      totals: { attempts: 0, hits: 0, misses: 0, blocked: 0 },
    };

    const pk = String(r?.providerKey || "").trim();
    if (pk) {
      const data = {
        attempts: Number(r?.attempts || 0),
        hits: Number(r?.hits || 0),
        misses: Number(r?.misses || 0),
        blocked: Number(r?.blocked || 0),
      };

      entry.providers[pk] = data;
      entry.totals.attempts += data.attempts;
      entry.totals.hits += data.hits;
      entry.totals.misses += data.misses;
      entry.totals.blocked += data.blocked;
    }

    byHour.set(ws, entry);
  }

  return Array.from(byHour.values());
}

function startOfMonth(d = new Date()) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfYear(d = new Date()) {
  const x = new Date(d);
  x.setMonth(0, 1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function safeNum(n) {
  const x = Number(n || 0);
  return Number.isFinite(x) ? x : 0;
}

function ensureAllFields(row) {
  const r = row && typeof row === "object" ? row : {};
  return {
    attempts: safeNum(r.attempts),
    hits: safeNum(r.hits),
    misses: safeNum(r.misses),
    blocked: safeNum(r.blocked),
  };
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || "").trim();

    if (action !== "set-reset") {
      return Response.json(
        { ok: false, error: "unsupported_action", action },
        { status: 400 },
      );
    }

    const saved = await setResetConfig(body?.reset);
    return Response.json({ ok: true, reset: saved });
  } catch (e) {
    console.error("[admin/reports/api-usage][POST]", e);
    return Response.json(
      { ok: false, error: e?.message || "failed" },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  const now = new Date();
  const reset = await getResetConfig();

  const todayStart = computeTodayStart({ now, reset });
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  // Provider keys we track (even if unused, we return zeros)
  const groups = [
    {
      groupKey: "youtube",
      label: "YouTube",
      providers: [
        { key: "search", label: "Search (search.list)" },
        { key: "videos", label: "Videos (videos.list)" },
        { key: "channels", label: "Channels (channels.list)" },
        { key: "playlistItems", label: "Playlist items (playlistItems.list)" },
      ],
    },
    {
      groupKey: "spotify",
      label: "Spotify",
      providers: [
        { key: "token", label: "OAuth token (accounts.spotify.com)" },
        { key: "api", label: "User Web API (api.spotify.com/v1)" },
        { key: "token_client", label: "Client token (accounts.spotify.com)" },
        { key: "api_client", label: "Server Web API (api.spotify.com/v1)" },
      ],
    },
    {
      groupKey: "tmdb",
      label: "TMDB",
      providers: [
        { key: "search_movie", label: "Search movie (/search/movie)" },
        { key: "movie_videos", label: "Movie videos (/movie/{id}/videos)" },
        {
          key: "movie_external_ids",
          label: "External IDs (/movie/{id}/external_ids)",
        },
        { key: "movie_details", label: "Movie details (/movie/{id})" },
        { key: "movie_reviews", label: "Movie reviews (/movie/{id}/reviews)" },
        { key: "movie_popular", label: "Popular movies (/movie/popular)" },
      ],
    },
    {
      groupKey: "ai",
      label: "AI (quote → movie guessing)",
      providers: [
        {
          key: "gemini_guess_movie_from_quote",
          label: "Gemini: guess movie from quote (legacy)",
        },
        {
          key: "openai_guess_movie_from_quote",
          label: "OpenAI: guess movie from quote (legacy)",
        },
        {
          key: "gemini_quote_to_movie_narrative",
          label: "Gemini: quote → movie (narrative)",
        },
        {
          key: "openai_quote_to_movie_narrative",
          label: "OpenAI: quote → movie (narrative)",
        },
      ],
    },
    {
      groupKey: "quote_lookup",
      label: "Quote Lookup (pipeline)",
      providers: [
        { key: "db_cache", label: "DB cache (quote_lookup_cache)" },
        {
          key: "tmdb_candidate_match",
          label: "TMDB candidate checks (accepted/rejected)",
        },
      ],
    },
    {
      groupKey: "movie_quotes",
      label: "Movie Quotes (provider chain)",
      providers: [], // filled from config below
    },
  ];

  // Dynamically load Movie Quotes provider list (so it stays in sync with toggles).
  try {
    const cfg = await getMovieQuoteConfig();
    const keys = [
      "cache",
      ...Object.keys(cfg?.providers || {}).map((k) => String(k)),
    ];

    const mqGroup = groups.find((g) => g.groupKey === "movie_quotes");
    if (mqGroup) {
      mqGroup.providers = keys.map((k) => ({
        key: k,
        label:
          k === "cache"
            ? "Cache (saved quotes in DB)"
            : cfg?.providers?.[k]?.label || k,
      }));
    }
  } catch (_) {
    // If config fails, still return the other groups.
  }

  const outGroups = [];

  for (const g of groups) {
    const providerKeys = g.providers.map((p) => p.key);

    const today = providerKeys.length
      ? await getTodayUsageSummary({
          groupKey: g.groupKey,
          providerKeys,
          todayStart,
          now,
        })
      : {};

    const month = providerKeys.length
      ? await getUsageWindowSummary({
          groupKey: g.groupKey,
          providerKeys,
          windowKind: "month",
          windowStart: monthStart,
        })
      : {};

    const year = providerKeys.length
      ? await getUsageWindowSummary({
          groupKey: g.groupKey,
          providerKeys,
          windowKind: "year",
          windowStart: yearStart,
        })
      : {};

    // Drill-down timeline for YouTube only (keeps payload small)
    const timeline =
      g.groupKey === "youtube" && providerKeys.length
        ? await getHourlyUsageTimeline({
            groupKey: g.groupKey,
            providerKeys,
            todayStart,
            now,
          })
        : null;

    outGroups.push({
      groupKey: g.groupKey,
      label: g.label,
      providers: g.providers.map((p) => ({
        key: p.key,
        label: p.label,
        usage: {
          today: ensureAllFields(today?.[p.key]),
          month: ensureAllFields(month?.[p.key]),
          year: ensureAllFields(year?.[p.key]),
        },
      })),
      timeline,
    });
  }

  return Response.json({
    ok: true,
    now: now.toISOString(),
    reset,
    windows: {
      todayStart: todayStart.toISOString(),
      todayTimeZone: reset.timeZone,
      todayTimeZoneLabel: reset.timeZoneLabel,
      monthStart: monthStart.toISOString(),
      yearStart: yearStart.toISOString(),
    },
    groups: outGroups,
  });
}
