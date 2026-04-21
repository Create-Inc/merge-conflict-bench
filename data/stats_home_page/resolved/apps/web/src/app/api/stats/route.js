import sql from "@/app/api/utils/sql";
import {
  getActor,
  requireAuthActor,
  requireAnyRole,
  requireOrg,
} from "@/app/api/utils/authz.js";

export async function GET(request) {
  try {
    const actor = await getActor(request);
    const authRes = requireAuthActor(actor);
    if (authRes) return authRes;

    // Dashboard should be safe for normal org users too (SOC2-friendly overview)
    const roleRes = requireAnyRole(actor, [
      "msp_user",
      "msp_sme",
      "msp_sme_leader",
      "msp_account_owner",
    ]);
    if (roleRes) return roleRes;

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("timeRange") || "7d"; // 7d | 30d | 90d | 12m

    const RANGE_TO_INTERVAL = {
      "7d": "7 days",
      "30d": "30 days",
      "90d": "90 days",
      "12m": "12 months",
    };

    const interval = RANGE_TO_INTERVAL[timeRange] || RANGE_TO_INTERVAL["7d"];
    const bucketUnit = timeRange === "12m" ? "month" : "day";

    // Build org scoping for query_logs / conversations / messages.
    let scopeJoin = "";
    let scopeWhere = "";
    let scopeParams = [];

    if (!actor.isPlatformAdmin) {
      const orgRes = requireOrg(actor);
      if (orgRes) return orgRes;

      const orgIds = Array.isArray(actor.orgIds) ? actor.orgIds : [];
      scopeJoin = "LEFT JOIN conversations c ON q.conversation_id = c.id";

      if (orgIds.length > 0) {
        scopeWhere =
          "WHERE ((q.org_id IS NOT NULL AND q.org_id = ANY($1::uuid[])) OR (q.org_id IS NULL AND c.user_id = $2))";
        scopeParams = [orgIds, actor.userId];
      } else {
        scopeWhere = "WHERE (q.org_id IS NULL AND c.user_id = $1)";
        scopeParams = [actor.userId];
      }
    } else if (actor.orgId) {
      scopeWhere = "WHERE q.org_id = $1::uuid";
      scopeParams = [actor.orgId];
    }

    const addAnd = (w, clause) => {
      if (!clause) return w;
      if (!w) return `WHERE ${clause}`;
      return `${w} AND ${clause}`;
    };

    // Shared time filter for the dashboard period
    const timeClause = `q."timestamp" > now() - interval '${interval}'`;

    // 1) Requests over time
    {
      const where = addAnd(scopeWhere, timeClause);

      const q1 = `
        SELECT
          date_trunc('${bucketUnit}', q."timestamp") as date,
          count(*)::int as count
        FROM query_logs q
        ${scopeJoin}
        ${where}
        GROUP BY 1
        ORDER BY 1 ASC
      `;

      var requestsOverTime = await sql(q1, scopeParams);
    }

    // 2) Latency over time
    {
      const where = addAnd(scopeWhere, timeClause);

      const q2 = `
        SELECT
          date_trunc('${bucketUnit}', q."timestamp") as date,
          avg(q.response_time_ms)::float as avg_latency
        FROM query_logs q
        ${scopeJoin}
        ${where}
        GROUP BY 1
        ORDER BY 1 ASC
      `;

      var latencyOverTime = await sql(q2, scopeParams);
    }

    // 3) Token usage over time
    {
      const where = addAnd(scopeWhere, timeClause);

      const q3 = `
        SELECT
          date_trunc('${bucketUnit}', q."timestamp") as date,
          sum(q.total_tokens)::bigint as total_tokens
        FROM query_logs q
        ${scopeJoin}
        ${where}
        GROUP BY 1
        ORDER BY 1 ASC
      `;

      var tokensOverTime = await sql(q3, scopeParams);
    }

    // 4) Summary stats
    {
      const where = addAnd(scopeWhere, timeClause);

      const q4 = `
        SELECT
          count(*)::int as total_requests,
          avg(q.response_time_ms)::float as avg_latency,
          sum(q.total_tokens)::bigint as total_tokens,
          sum(CASE WHEN LOWER(COALESCE(q.metadata->>'status','success')) = 'success' THEN 1 ELSE 0 END)::int as success_count,
          sum(CASE WHEN LOWER(COALESCE(q.metadata->>'status','success')) <> 'success' THEN 1 ELSE 0 END)::int as fail_count
        FROM query_logs q
        ${scopeJoin}
        ${where}
      `;

      const rows = await sql(q4, scopeParams);
      var summary = rows?.[0] || {
        total_requests: 0,
        avg_latency: 0,
        total_tokens: 0,
        success_count: 0,
        fail_count: 0,
      };
    }

    // 5) Source usage breakdown (using the same fields shown in /query-history)
    {
      const where = addAnd(scopeWhere, timeClause);

      const q5 = `
        WITH base AS (
          SELECT
            (
              COALESCE(q.metadata->>'useKnowledgeBase','false') = 'true'
              OR q.llama_cloud_results IS NOT NULL
            ) AS used_kb,
            (
              COALESCE(q.metadata->>'useWebSearch','false') = 'true'
              OR q.tavily_results IS NOT NULL
            ) AS used_web
          FROM query_logs q
          ${scopeJoin}
          ${where}
        )
        SELECT
          count(*)::int as total,
          sum(CASE WHEN used_kb AND used_web THEN 1 ELSE 0 END)::int as both,
          sum(CASE WHEN used_kb AND NOT used_web THEN 1 ELSE 0 END)::int as kb_only,
          sum(CASE WHEN used_web AND NOT used_kb THEN 1 ELSE 0 END)::int as web_only,
          sum(CASE WHEN NOT used_kb AND NOT used_web THEN 1 ELSE 0 END)::int as none
        FROM base
      `;

      const rows = await sql(q5, scopeParams);
      var sources = rows?.[0] || {
        total: 0,
        both: 0,
        kb_only: 0,
        web_only: 0,
        none: 0,
      };
    }

    // 6) Feedback distribution (align with /query-history: query_logs.user_feedback)
    {
      const where = addAnd(scopeWhere, timeClause);

      const q6 = `
        SELECT
          (q.user_feedback->>'rating')::int as rating,
          count(*)::int as count
        FROM query_logs q
        ${scopeJoin}
        ${where}
        AND (q.user_feedback->>'rating') IS NOT NULL
        GROUP BY 1
      `;

      var feedback = await sql(q6, scopeParams);
    }

    // 7) Recent chat activity (no model/provider exposure)
    {
      let raJoin = "LEFT JOIN conversations c2 ON q.conversation_id = c2.id";
      let raWhere = addAnd("", timeClause);
      let raParams = [];

      if (!actor.isPlatformAdmin) {
        const orgIds = Array.isArray(actor.orgIds) ? actor.orgIds : [];
        if (orgIds.length > 0) {
          raWhere = addAnd(
            raWhere,
            "((q.org_id IS NOT NULL AND q.org_id = ANY($1::uuid[])) OR (q.org_id IS NULL AND c2.user_id = $2))",
          );
          raParams = [orgIds, actor.userId];
        } else {
          raWhere = addAnd(raWhere, "(q.org_id IS NULL AND c2.user_id = $1)");
          raParams = [actor.userId];
        }
      } else if (actor.orgId) {
        raWhere = addAnd(raWhere, "q.org_id = $1::uuid");
        raParams = [actor.orgId];
      }

      const q7 = `
        SELECT
          q.id,
          q."timestamp",
          q.response_time_ms,
          q.total_tokens,
          LOWER(COALESCE(q.metadata->>'status','success')) as status,
          COALESCE(q.metadata->>'useKnowledgeBase','false') as use_knowledge_base,
          COALESCE(q.metadata->>'useWebSearch','false') as use_web_search,
          c2.title as conversation_title
        FROM query_logs q
        ${raJoin}
        ${raWhere}
        ORDER BY q."timestamp" DESC
        LIMIT 10
      `;

      var recentActivity = await sql(q7, raParams);
    }

    // 8) Requests last 24h (still useful as a quick pulse)
    {
      const where = addAnd(
        scopeWhere,
        "q.\"timestamp\" > now() - interval '24 hours'",
      );
      const q8 = `
        SELECT COUNT(*)::int as count
        FROM query_logs q
        ${scopeJoin}
        ${where}
      `;
      const rows = await sql(q8, scopeParams);
      var requestsLast24h = rows?.[0]?.count || 0;
    }

    return Response.json({
      timeRange,
      bucketUnit,
      requestsOverTime,
      latencyOverTime,
      tokensOverTime,
      summary,
      sources,
      feedback,
      recentActivity,
      requestsLast24h,
    });
  } catch (error) {
    console.error("Stats API Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
