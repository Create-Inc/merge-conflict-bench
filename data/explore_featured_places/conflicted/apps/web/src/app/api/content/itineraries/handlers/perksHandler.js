import sql from "@/app/api/utils/sql";
import { isUserProMember, getFamilyContext } from "@/app/api/utils/userPerks";
import { canEdit } from "../utils/authorization";
import { parseCursor, makeCursor } from "../utils/cursorHelpers";
import { normalizeVibes } from "../utils/normalizers";

function isRestrictedForJunior(vibes) {
  const list = Array.isArray(vibes) ? vibes : [];
  return list.some((v) => {
    const s = v ? String(v).trim().toLowerCase() : "";
    return s === "late night" || s === "adult-only" || s === "adult only";
  });
}

export async function handlePerksRequest(request, me) {
  try {
    const { searchParams } = new URL(request.url);
    const role = me?.systemUser?.role || "USER";

    const stateRaw = searchParams.get("state")
      ? String(searchParams.get("state"))
      : "";
    const state = stateRaw.trim().slice(0, 40);

    const limitRaw = searchParams.get("limit")
      ? Number(searchParams.get("limit"))
      : 25;
    const requestedLimit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(50, Math.round(limitRaw)))
      : 25;

    const cursor = parseCursor(searchParams.get("cursor"));

    let isPro = false;
    try {
      isPro = await isUserProMember(me.systemUser.id);
    } catch (e) {
      console.error(e);
      isPro = false;
    }

    // Sprint 56: family tier seats can also see the full perks catalog.
    let family = null;
    try {
      family = await getFamilyContext(me.systemUser.id);
    } catch (e) {
      console.error(e);
      family = null;
    }

    const isFamily = Boolean(family?.isFamily);
    const isJunior = Boolean(family?.isFamily) && Boolean(family?.isJunior);

    const canSeeAll = Boolean(isPro) || Boolean(isFamily) || canEdit(role);
    const limit = canSeeAll ? requestedLimit : 10;

    const values = [];
    let idx = 1;

    const stateParamProvided = Boolean(state);
    if (stateParamProvided) {
      values.push(state);
    }

    const cursorProvided = canSeeAll && Boolean(cursor);
    if (cursorProvided) {
      // Phase 14.1: cursor now includes featured/sort_order keys (backward compatible parse)
      values.push(
        Number.isFinite(Number(cursor.featuredRank))
          ? Number(cursor.featuredRank)
          : 0,
      );
      values.push(
        Number.isFinite(Number(cursor.sortOrderKey))
          ? Number(cursor.sortOrderKey)
          : -1,
      );
      values.push(cursor.ts);
      values.push(cursor.id);
      values.push(cursor.perkKey);
    }

    values.push(limit);
    const limitParamIdx = idx + values.length - 1;

    const stateSql = stateParamProvided
      ? `
        AND LOWER(COALESCE(pick.state, '')) = LOWER($1)
      `
      : "";

    const cursorSql = cursorProvided
      ? `
        AND (perks.featured_rank, perks.sort_order_key, perks.sort_ts, perks.partner_id, perks.perk_key) < ($${stateParamProvided ? 2 : 1}::int, $${stateParamProvided ? 3 : 2}::int, $${stateParamProvided ? 4 : 3}::timestamptz, $${stateParamProvided ? 5 : 4}::uuid, $${stateParamProvided ? 6 : 5}::text)
      `
      : "";

<<<<<<< ours
    const freeStateBoostSql = stateParamProvided
      ? `
          , CASE WHEN LOWER(COALESCE(pick.state, '')) = LOWER($1) THEN 0 ELSE 1 END
        `
      : "";

=======
    // Phase 14.1: ensure non-member ordering doesn't reference a non-existent SQL parameter.
    const stateBoostSql = stateParamProvided
      ? `
          CASE WHEN LOWER(COALESCE(pick.state, '')) = LOWER($1) THEN 0 ELSE 1 END,
        `
      : "";

>>>>>>> theirs
    const orderBySql = canSeeAll
      ? `ORDER BY perks.featured_rank DESC, perks.sort_order_key DESC, perks.sort_ts DESC, perks.partner_id DESC, perks.perk_key DESC`
      : `ORDER BY
          perks.featured_rank DESC,
<<<<<<< ours
          perks.sort_order_key DESC
          ${freeStateBoostSql}
          , CASE WHEN perks.expires_at IS NULL THEN 1 ELSE 0 END,
=======
          perks.sort_order_key DESC,
          ${stateBoostSql}
          CASE WHEN perks.expires_at IS NULL THEN 1 ELSE 0 END,
>>>>>>> theirs
          perks.expires_at ASC NULLS LAST,
          perks.sort_ts DESC,
          perks.partner_id DESC`;

    const query = `
      WITH pick AS (
        SELECT
          p.id AS partner_id,
          p.name AS partner_name,
          p.created_at AS created_at,
          p.full_data AS full_data,
          COALESCE((p.full_data->'commercial'->>'paused')::boolean, false) AS paused,
          (SELECT pl.state FROM public.places pl WHERE pl.partner_id = p.id ORDER BY pl.created_at DESC LIMIT 1) AS state,
          (SELECT pl.city FROM public.places pl WHERE pl.partner_id = p.id ORDER BY pl.created_at DESC LIMIT 1) AS city
        FROM public.partners p
      ),
      place_stats AS (
        SELECT
          pl.partner_id,
          MAX(pl.assessment_score) AS assessment_score,
          BOOL_OR(COALESCE(pl.xplr_approved, false)) AS xplr_approved
        FROM public.places pl
        GROUP BY pl.partner_id
      ),
      perks AS (
        SELECT
          pick.partner_id,
          pick.partner_name,
          'PERMANENT'::text AS perk_key,
          COALESCE(NULLIF(pick.full_data->'commercial'->'perks'->'permanent'->>'perkName',''), 'Permanent Perk') AS perk_name,
          COALESCE(NULLIF(pick.full_data->'commercial'->'perks'->>'redemptionMethod',''), '') AS redemption_method,
          NULL::date AS expires_at,
          COALESCE(NULLIF(pick.full_data->'commercial'->'perks'->'permanent'->>'status',''), 'ACTIVE') AS status,
          COALESCE(pick.full_data->'commercial'->'perks'->'permanent'->'vibes', '[]'::jsonb) AS vibes,
          pick.created_at AS sort_ts,
          /* Phase 14.1: featured + sort order support */
          CASE
            WHEN LOWER(COALESCE(NULLIF(pick.full_data->'commercial'->'perks'->'permanent'->>'is_featured',''), NULLIF(pick.full_data->'commercial'->'perks'->>'is_featured',''), 'false')) IN ('true','t','1','yes','y') THEN 1
            ELSE 0
          END AS featured_rank,
          CASE
            WHEN COALESCE(NULLIF(pick.full_data->'commercial'->'perks'->'permanent'->>'sort_order',''), NULLIF(pick.full_data->'commercial'->'perks'->>'sort_order','')) ~ '^\\d+$'
              THEN 100000 - (COALESCE(NULLIF(pick.full_data->'commercial'->'perks'->'permanent'->>'sort_order',''), NULLIF(pick.full_data->'commercial'->'perks'->>'sort_order',''))::int)
            ELSE -1
          END AS sort_order_key
        FROM pick
        WHERE COALESCE((pick.full_data->'perks'->>'permanentPerk')::boolean, false) = true
          AND pick.paused = false

        UNION ALL

        SELECT
          pick.partner_id,
          pick.partner_name,
          'SEASONAL'::text AS perk_key,
          COALESCE(NULLIF(pick.full_data->'commercial'->'perks'->'seasonal'->>'perkName',''), 'Seasonal Perk') AS perk_name,
          COALESCE(NULLIF(pick.full_data->'commercial'->'perks'->>'redemptionMethod',''), '') AS redemption_method,
          CASE
            WHEN (pick.full_data->'commercial'->'perks'->>'expiresAt') ~ '^\\d{4}-\\d{2}-\\d{2}$'
              THEN (pick.full_data->'commercial'->'perks'->>'expiresAt')::date
            ELSE NULL
          END AS expires_at,
          COALESCE(NULLIF(pick.full_data->'commercial'->'perks'->'seasonal'->>'status',''), 'ACTIVE') AS status,
          COALESCE(pick.full_data->'commercial'->'perks'->'seasonal'->'vibes', '[]'::jsonb) AS vibes,
          pick.created_at AS sort_ts,
          /* Phase 14.1: featured + sort order support */
          CASE
            WHEN LOWER(COALESCE(NULLIF(pick.full_data->'commercial'->'perks'->'seasonal'->>'is_featured',''), NULLIF(pick.full_data->'commercial'->'perks'->>'is_featured',''), 'false')) IN ('true','t','1','yes','y') THEN 1
            ELSE 0
          END AS featured_rank,
          CASE
            WHEN COALESCE(NULLIF(pick.full_data->'commercial'->'perks'->'seasonal'->>'sort_order',''), NULLIF(pick.full_data->'commercial'->'perks'->>'sort_order','')) ~ '^\\d+$'
              THEN 100000 - (COALESCE(NULLIF(pick.full_data->'commercial'->'perks'->'seasonal'->>'sort_order',''), NULLIF(pick.full_data->'commercial'->'perks'->>'sort_order',''))::int)
            ELSE -1
          END AS sort_order_key
        FROM pick
        WHERE (pick.full_data->'commercial'->'perks'->>'expiresAt') IS NOT NULL
          AND pick.paused = false
      )
      SELECT
        perks.partner_id,
        perks.partner_name,
        perks.perk_key,
        perks.perk_name,
        perks.redemption_method,
        perks.expires_at,
        perks.vibes,
        perks.sort_ts,
        perks.featured_rank,
        perks.sort_order_key,
        (SELECT pl.state FROM public.places pl WHERE pl.partner_id = perks.partner_id ORDER BY pl.created_at DESC LIMIT 1) AS state,
        (SELECT pl.city FROM public.places pl WHERE pl.partner_id = perks.partner_id ORDER BY pl.created_at DESC LIMIT 1) AS city,
        ps.assessment_score,
        ps.xplr_approved
      FROM perks
      JOIN pick ON pick.partner_id = perks.partner_id
      LEFT JOIN place_stats ps ON ps.partner_id = perks.partner_id
      WHERE perks.status = 'ACTIVE'
        AND (perks.expires_at IS NULL OR perks.expires_at >= CURRENT_DATE)
        ${stateSql}
        ${cursorSql}
      ${orderBySql}
      LIMIT $${limitParamIdx}
    `;

    const rows = await sql(query, values);
    const list = Array.isArray(rows) ? rows : [];

    const items = list
      .map((r) => {
        const partnerId = r?.partner_id ? String(r.partner_id) : "";
        const partnerName = r?.partner_name ? String(r.partner_name) : "";
        const perkKey = r?.perk_key ? String(r.perk_key) : "PERMANENT";
        const perkName = r?.perk_name ? String(r.perk_name) : "";
        if (!partnerId || !partnerName || !perkName) {
          return null;
        }

        const expiresAt = r?.expires_at ? String(r.expires_at) : null;
        const redemptionMethod = r?.redemption_method
          ? String(r.redemption_method).trim()
          : "";

        const vibes = normalizeVibes(r?.vibes);

        const stateOut = r?.state ? String(r.state) : null;
        const cityOut = r?.city ? String(r.city) : null;

        // Sprint 54 Control Center: safe vetting signals for "For You" cards.
        const assessmentScoreNum = Number(r?.assessment_score);
        const assessmentScore = Number.isFinite(assessmentScoreNum)
          ? Math.max(0, Math.min(100, Math.round(assessmentScoreNum)))
          : null;
        const xplrApproved = Boolean(r?.xplr_approved);

        return {
          id: `${partnerId}:${perkKey}`,
          partnerId,
          partnerName,
          perkKey,
          perkName,
          redemptionMethod: redemptionMethod || null,
          expiresAt,
          vibes,
          location: {
            city: cityOut,
            state: stateOut,
          },
          assessmentScore,
          xplrApproved,
        };
      })
      .filter(Boolean)
      // Sprint 56: Junior Explorer mode must filter out adult categories.
      .filter((item) => {
        if (!isJunior) return true;
        return !isRestrictedForJunior(item?.vibes);
      });

    let nextCursor = null;
    if (canSeeAll && items.length === limit) {
      const last = list[list.length - 1];
      const ts = last?.sort_ts ? new Date(last.sort_ts).toISOString() : null;
      const id = last?.partner_id ? String(last.partner_id) : null;
      const perkKey = last?.perk_key ? String(last.perk_key) : null;

      const featuredRankNum = Number(last?.featured_rank);
      const sortOrderKeyNum = Number(last?.sort_order_key);

      const featuredRank = Number.isFinite(featuredRankNum)
        ? Math.max(0, Math.min(1, Math.round(featuredRankNum)))
        : 0;

      const sortOrderKey = Number.isFinite(sortOrderKeyNum)
        ? Math.max(-1, Math.min(100000, Math.round(sortOrderKeyNum)))
        : -1;

      if (ts && id && perkKey) {
        nextCursor = makeCursor({
          ts,
          id,
          perkKey,
          featuredRank,
          sortOrderKey,
        });
      }
    }

    return Response.json({
      items,
      nextCursor,
      membership: { isPro: Boolean(isPro), isFamily },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Could not load perks" }, { status: 500 });
  }
}
