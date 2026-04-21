import sql from "@/app/api/utils/sql";
import {
  getActor,
  requireAuthActor,
  requireAnyRole,
  requireOrg,
  safeTrim,
} from "@/app/api/utils/authz";

function requireLeaderOrAdmin(actor) {
  if (actor?.isPlatformAdmin) return null;
  return requireAnyRole(actor, ["msp_sme_leader"]);
}

export async function GET(request) {
  try {
    const actor = await getActor(request);

    const authRes = requireAuthActor(actor);
    if (authRes) return authRes;

    const orgRes = requireOrg(actor);
    if (orgRes) return orgRes;

    if (actor.isPlatformAdmin && !actor.orgId) {
      return Response.json(
        { error: "Platform Admin must set x-org-id" },
        { status: 400 },
      );
    }

    const roleRes = requireLeaderOrAdmin(actor);
    if (roleRes) return roleRes;

    const rows = await sql(
      `
      SELECT
        m.user_id,
        m.roles,
        u.email,
        u.name
      FROM org_memberships m
      LEFT JOIN auth_users u ON u.id::text = m.user_id
      WHERE m.org_id = $1::uuid
        AND m.roles @> ARRAY['msp_sme']::text[]
      ORDER BY u.email NULLS LAST, m.created_at ASC
      `,
      [actor.orgId],
    );

    return Response.json({ items: rows || [] });
  } catch (error) {
    console.error("GET /api/v2/sme-leader/smes error:", error);
    return Response.json(
      { error: safeTrim(error?.message) || "Internal server error" },
      { status: 500 },
    );
  }
}
