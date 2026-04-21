<<<<<<< ours
import sql from "@/app/api/utils/sql";
import {
  getActor,
  requireAuthActor,
  requireAnyRole,
  requireOrg,
  safeTrim,
} from "@/app/api/utils/authz";

const BASE_DOMAINS = [
  "Datacenter",
  "IT",
  "Software",
  "Network",
  "Storage",
  "Cybersecurity",
];

function isBaseDomain(name) {
  const n = safeTrim(name).toLowerCase();
  return BASE_DOMAINS.some((d) => d.toLowerCase() === n);
}

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
      SELECT id, domain_name, is_active, created_at, created_by_user_id
      FROM custom_domains
      WHERE org_id = $1::uuid
      ORDER BY created_at DESC
      `,
      [actor.orgId],
    );

    return Response.json({
      baseDomains: BASE_DOMAINS,
      customDomains: rows || [],
    });
  } catch (error) {
    console.error("GET /api/v2/sme-leader/domains error:", error);
    return Response.json(
      { error: safeTrim(error?.message) || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
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
    const domain_name = safeTrim(body?.domain_name);

    if (!domain_name) {
      return Response.json(
        { error: "domain_name is required" },
        { status: 400 },
      );
    }

    if (domain_name.length > 80) {
      return Response.json(
        { error: "domain_name must be 80 characters or less" },
        { status: 400 },
      );
    }

    if (isBaseDomain(domain_name)) {
      return Response.json(
        { error: "This domain already exists as a base domain" },
        { status: 400 },
      );
    }

    const rows = await sql(
      `
      INSERT INTO custom_domains (org_id, domain_name, is_active, created_by_user_id)
      VALUES ($1::uuid, $2, true, $3)
      RETURNING id, domain_name, is_active, created_at, created_by_user_id
      `,
      [actor.orgId, domain_name, actor.userId],
    );

    return Response.json({ item: rows?.[0] || null });
  } catch (error) {
    console.error("POST /api/v2/sme-leader/domains error:", error);

    const msg = safeTrim(error?.message);
    const isUnique = msg
      .toLowerCase()
      .includes("uq_custom_domains_org_lower_name");

    return Response.json(
      {
        error: isUnique
          ? "Domain already exists"
          : msg || "Internal server error",
      },
      { status: isUnique ? 409 : 500 },
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

    const id = safeTrim(body?.id);
    if (!id) {
      return Response.json({ error: "id is required" }, { status: 400 });
    }

    const updates = [];
    const params = [actor.orgId, id];
    let p = params.length + 1;

    if (typeof body?.is_active === "boolean") {
      updates.push(`is_active = $${p}`);
      params.push(Boolean(body.is_active));
      p += 1;
    }

    const nextName =
      typeof body?.domain_name === "string" ? safeTrim(body.domain_name) : "";
    if (nextName) {
      if (nextName.length > 80) {
        return Response.json(
          { error: "domain_name must be 80 characters or less" },
          { status: 400 },
        );
      }

      if (isBaseDomain(nextName)) {
        return Response.json(
          { error: "This domain already exists as a base domain" },
          { status: 400 },
        );
      }

      updates.push(`domain_name = $${p}`);
      params.push(nextName);
      p += 1;
    }

    if (!updates.length) {
      return Response.json({ error: "No changes" }, { status: 400 });
    }

    const rows = await sql(
      `
      UPDATE custom_domains
      SET ${updates.join(", ")}
      WHERE org_id = $1::uuid AND id = $2::uuid
      RETURNING id, domain_name, is_active, created_at, created_by_user_id
      `,
      params,
    );

    return Response.json({ item: rows?.[0] || null });
  } catch (error) {
    console.error("PATCH /api/v2/sme-leader/domains error:", error);

    const msg = safeTrim(error?.message);
    const isUnique = msg
      .toLowerCase()
      .includes("uq_custom_domains_org_lower_name");

    return Response.json(
      {
        error: isUnique
          ? "Domain already exists"
          : msg || "Internal server error",
      },
      { status: isUnique ? 409 : 500 },
    );
  }
}

export async function DELETE(request) {
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

    const id = safeTrim(body?.id);
    if (!id) {
      return Response.json({ error: "id is required" }, { status: 400 });
    }

    // NOTE: if there are assignment rules pointing at this domain name,
    // we keep them (they will simply be unused if the domain disappears).
    await sql(
      `
      DELETE FROM custom_domains
      WHERE org_id = $1::uuid AND id = $2::uuid
      `,
      [actor.orgId, id],
    );

    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/v2/sme-leader/domains error:", error);
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

const BASE_DOMAINS = [
  "Datacenter",
  "IT",
  "Software",
  "Network",
  "Storage",
  "Cybersecurity",
];

function isBaseDomain(name) {
  const n = safeTrim(name).toLowerCase();
  return BASE_DOMAINS.some((d) => d.toLowerCase() === n);
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

    const roleRes = requireAnyRole(actor, ["msp_sme_leader"]);
    if (roleRes) return roleRes;

    const rows = await sql(
      `
      SELECT id, domain_name, is_active, created_at, created_by_user_id
      FROM custom_domains
      WHERE org_id = $1::uuid
      ORDER BY created_at DESC
      `,
      [actor.orgId],
    );

    return Response.json({
      baseDomains: BASE_DOMAINS,
      customDomains: rows || [],
    });
  } catch (error) {
    console.error("GET /api/v2/sme-leader/domains error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
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
    const domain_name = safeTrim(body?.domain_name);

    if (!domain_name) {
      return Response.json(
        { error: "domain_name is required" },
        { status: 400 },
      );
    }

    if (domain_name.length > 80) {
      return Response.json(
        { error: "domain_name must be 80 characters or less" },
        { status: 400 },
      );
    }

    if (isBaseDomain(domain_name)) {
      return Response.json(
        { error: "This domain already exists as a base domain" },
        { status: 400 },
      );
    }

    const rows = await sql(
      `
      INSERT INTO custom_domains (org_id, domain_name, is_active, created_by_user_id)
      VALUES ($1::uuid, $2, true, $3)
      RETURNING id, domain_name, is_active, created_at, created_by_user_id
      `,
      [actor.orgId, domain_name, actor.userId],
    );

    return Response.json({ item: rows?.[0] || null });
  } catch (error) {
    console.error("POST /api/v2/sme-leader/domains error:", error);

    const msg = safeTrim(error?.message);
    const isUnique = msg
      .toLowerCase()
      .includes("uq_custom_domains_org_lower_name");

    return Response.json(
      { error: isUnique ? "Domain already exists" : error.message },
      { status: isUnique ? 409 : 500 },
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

    const roleRes = requireAnyRole(actor, ["msp_sme_leader"]);
    if (roleRes) return roleRes;

    const body = await request.json().catch(() => ({}));

    const id = safeTrim(body?.id);
    if (!id) {
      return Response.json({ error: "id is required" }, { status: 400 });
    }

    const updates = [];
    const params = [actor.orgId, id];
    let p = params.length + 1;

    if (typeof body?.is_active === "boolean") {
      updates.push(`is_active = $${p}`);
      params.push(Boolean(body.is_active));
      p += 1;
    }

    const nextName =
      typeof body?.domain_name === "string" ? safeTrim(body.domain_name) : "";
    if (nextName) {
      if (nextName.length > 80) {
        return Response.json(
          { error: "domain_name must be 80 characters or less" },
          { status: 400 },
        );
      }

      if (isBaseDomain(nextName)) {
        return Response.json(
          { error: "This domain already exists as a base domain" },
          { status: 400 },
        );
      }

      updates.push(`domain_name = $${p}`);
      params.push(nextName);
      p += 1;
    }

    if (!updates.length) {
      return Response.json({ error: "No changes" }, { status: 400 });
    }

    const rows = await sql(
      `
      UPDATE custom_domains
      SET ${updates.join(", ")}
      WHERE org_id = $1::uuid AND id = $2::uuid
      RETURNING id, domain_name, is_active, created_at, created_by_user_id
      `,
      params,
    );

    return Response.json({ item: rows?.[0] || null });
  } catch (error) {
    console.error("PATCH /api/v2/sme-leader/domains error:", error);

    const msg = safeTrim(error?.message);
    const isUnique = msg
      .toLowerCase()
      .includes("uq_custom_domains_org_lower_name");

    return Response.json(
      { error: isUnique ? "Domain already exists" : error.message },
      { status: isUnique ? 409 : 500 },
    );
  }
}

export async function DELETE(request) {
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

    const id = safeTrim(body?.id);
    if (!id) {
      return Response.json({ error: "id is required" }, { status: 400 });
    }

    // NOTE: if there are assignment rules pointing at this domain name,
    // we keep them (they will simply be unused if the domain disappears).
    await sql(
      `
      DELETE FROM custom_domains
      WHERE org_id = $1::uuid AND id = $2::uuid
      `,
      [actor.orgId, id],
    );

    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/v2/sme-leader/domains error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
>>>>>>> theirs
