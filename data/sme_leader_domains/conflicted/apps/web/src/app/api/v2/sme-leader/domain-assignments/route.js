<<<<<<< ours
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
      SELECT org_id, domain, assigned_sme_user_id, created_at, updated_at, updated_by
      FROM domain_sme_assignments
      WHERE org_id = $1::uuid
      ORDER BY domain ASC
      `,
      [actor.orgId],
    );

    return Response.json({ items: rows || [] });
  } catch (error) {
    console.error("GET /api/v2/sme-leader/domain-assignments error:", error);
    return Response.json(
      { error: safeTrim(error?.message) || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
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

    const body = await request.json().catch(() => ({}));

    const domain = safeTrim(body?.domain);
    const assigned_sme_user_id = safeTrim(body?.assigned_sme_user_id);

    if (!domain) {
      return Response.json({ error: "domain is required" }, { status: 400 });
    }

    // Empty assignment means delete rule
    if (!assigned_sme_user_id) {
      await sql(
        `
        DELETE FROM domain_sme_assignments
        WHERE org_id = $1::uuid AND domain = $2
        `,
        [actor.orgId, domain],
      );

      // v2: if a rule is removed, unassign active tickets in that domain (manual triage needed)
      await sql(
        `
          UPDATE tickets_v2
          SET assigned_sme_user_id = NULL,
              assigned_at = NULL,
              assigned_by = $1,
              assignment_method = 'manual',
              status = 'new',
              updated_at = CURRENT_TIMESTAMP
          WHERE org_id = $2::uuid
            AND final_domain = $3
            AND status NOT IN ('resolved', 'wont_fix')
        `,
        [String(actor.userId), actor.orgId, domain],
      ).catch(() => null);

      return Response.json({ ok: true, item: null });
    }

    const rows = await sql(
      `
      INSERT INTO domain_sme_assignments (
        org_id,
        domain,
        assigned_sme_user_id,
        created_at,
        updated_at,
        updated_by
      ) VALUES (
        $1::uuid,
        $2,
        $3,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        $4
      )
      ON CONFLICT (org_id, domain)
      DO UPDATE SET
        assigned_sme_user_id = EXCLUDED.assigned_sme_user_id,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = EXCLUDED.updated_by
      RETURNING org_id, domain, assigned_sme_user_id, created_at, updated_at, updated_by
      `,
      [actor.orgId, domain, assigned_sme_user_id, actor.userId],
    );

    // v2: auto-reassign active tickets in this domain
    await sql(
      `
        UPDATE tickets_v2
        SET assigned_sme_user_id = $1,
            assigned_at = CURRENT_TIMESTAMP,
            assigned_by = 'system',
            assignment_method = 'auto',
            status = 'assigned',
            updated_at = CURRENT_TIMESTAMP
        WHERE org_id = $2::uuid
          AND final_domain = $3
          AND status NOT IN ('resolved', 'wont_fix')
      `,
      [assigned_sme_user_id, actor.orgId, domain],
    ).catch(() => null);

    return Response.json({ ok: true, item: rows?.[0] || null });
  } catch (error) {
    console.error("PATCH /api/v2/sme-leader/domain-assignments error:", error);
    return Response.json(
      { error: safeTrim(error?.message) || "Internal server error" },
      { status: 500 },
    );
  }
}
=======
import sql from "@/app/api/utils/sql";
import {
  getActor,
  requireAuthActor,
  requireAnyRole,
  requireOrg,
  safeTrim,
} from "@/app/api/utils/authz";

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

    const roleRes = requireAnyRole(actor, ["msp_sme_leader"]);
    if (roleRes) return roleRes;

    const rows = await sql(
      `
      SELECT org_id, domain, assigned_sme_user_id, created_at, updated_at, updated_by
      FROM domain_sme_assignments
      WHERE org_id = $1::uuid
      ORDER BY domain ASC
      `,
      [actor.orgId],
    );

    return Response.json({ items: rows || [] });
  } catch (error) {
    console.error("GET /api/v2/sme-leader/domain-assignments error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
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

    const roleRes = requireAnyRole(actor, ["msp_sme_leader"]);
    if (roleRes) return roleRes;

    const body = await request.json().catch(() => ({}));

    const domain = safeTrim(body?.domain);
    const assigned_sme_user_id = safeTrim(body?.assigned_sme_user_id);

    if (!domain) {
      return Response.json({ error: "domain is required" }, { status: 400 });
    }

    // Empty assignment means delete rule
    if (!assigned_sme_user_id) {
      await sql(
        `
        DELETE FROM domain_sme_assignments
        WHERE org_id = $1::uuid AND domain = $2
        `,
        [actor.orgId, domain],
      );

      // v2: if a rule is removed, unassign active tickets in that domain (manual triage needed)
      await sql(
        `
          UPDATE tickets_v2
          SET assigned_sme_user_id = NULL,
              assigned_at = NULL,
              assigned_by = $1,
              assignment_method = 'manual',
              status = 'new',
              updated_at = CURRENT_TIMESTAMP
          WHERE org_id = $2::uuid
            AND final_domain = $3
            AND status NOT IN ('resolved', 'wont_fix')
        `,
        [String(actor.userId), actor.orgId, domain],
      ).catch(() => null);

      return Response.json({ ok: true, item: null });
    }

    const rows = await sql(
      `
      INSERT INTO domain_sme_assignments (
        org_id,
        domain,
        assigned_sme_user_id,
        created_at,
        updated_at,
        updated_by
      ) VALUES (
        $1::uuid,
        $2,
        $3,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        $4
      )
      ON CONFLICT (org_id, domain)
      DO UPDATE SET
        assigned_sme_user_id = EXCLUDED.assigned_sme_user_id,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = EXCLUDED.updated_by
      RETURNING org_id, domain, assigned_sme_user_id, created_at, updated_at, updated_by
      `,
      [actor.orgId, domain, assigned_sme_user_id, actor.userId],
    );

    // v2: auto-reassign active tickets in this domain
    await sql(
      `
        UPDATE tickets_v2
        SET assigned_sme_user_id = $1,
            assigned_at = CURRENT_TIMESTAMP,
            assigned_by = 'system',
            assignment_method = 'auto',
            status = 'assigned',
            updated_at = CURRENT_TIMESTAMP
        WHERE org_id = $2::uuid
          AND final_domain = $3
          AND status NOT IN ('resolved', 'wont_fix')
      `,
      [assigned_sme_user_id, actor.orgId, domain],
    ).catch(() => null);

    return Response.json({ ok: true, item: rows?.[0] || null });
  } catch (error) {
    console.error("PATCH /api/v2/sme-leader/domain-assignments error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
>>>>>>> theirs
