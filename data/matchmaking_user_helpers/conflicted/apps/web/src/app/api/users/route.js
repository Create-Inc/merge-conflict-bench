import { auth } from "@/auth";
import sql from "@/app/api/utils/sql";

// Consolidated users API route to reduce total backend routes
// Supports:
//  - GET   /api/users?endpoint=me (default)
//  - PATCH /api/users?endpoint=me
//  - GET   /api/users?endpoint=role
//  - POST  /api/users?endpoint=role

const ALLOWED_DASHBOARD_ROLES = new Set([
  "consultant",
  "company",
  "partner",
  "seller",
]);

const DASHBOARD_ROLE_ALIASES = [
  "consultant",
  "company",
  "partner",
  "seller",
  // old plural spellings seen in some rows
  "companies",
  "partners",
  "sellers",
];

function normalizeRole(role) {
  const raw = String(role || "")
    .trim()
    .toLowerCase();
  if (!raw) return "";
  // Backwards-compatible aliases (some older rows used plurals)
  if (raw === "companies") return "company";
  if (raw === "partners") return "partner";
  if (raw === "sellers") return "seller";
  if (raw === "admins") return "admin";
  return raw;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = (searchParams.get("endpoint") || "me").trim();

    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    if (endpoint === "role") {
      // 1) explicit roles
      const rows = await sql`
        SELECT role FROM user_roles WHERE user_id = ${userId}
      `;
<<<<<<< ours
      const roles = rows.map((r) => normalizeRole(r?.role)).filter(Boolean);
=======

      const roleSet = new Set(
        (rows || [])
          .map((r) =>
            String(r.role || "")
              .trim()
              .toLowerCase(),
          )
          .filter(Boolean),
      );

      // 2) derived roles (back-compat for older accounts)
      try {
        const [
          companyOwned,
          companyManaged,
          partnerOwned,
          partnerManaged,
          seller,
          consultant,
        ] = await sql.transaction((txn) => [
          txn("SELECT 1 FROM company_profiles WHERE user_id = $1 LIMIT 1", [
            userId,
          ]),
          txn(
            "SELECT 1 FROM company_managers WHERE manager_user_id = $1 LIMIT 1",
            [userId],
          ),
          txn(
            "SELECT 1 FROM partner_company_profiles WHERE user_id = $1 LIMIT 1",
            [userId],
          ),
          txn(
            "SELECT 1 FROM partner_managers WHERE manager_user_id = $1 LIMIT 1",
            [userId],
          ),
          txn("SELECT 1 FROM seller_profiles WHERE user_id = $1 LIMIT 1", [
            userId,
          ]),
          txn("SELECT 1 FROM consultant_profiles WHERE user_id = $1 LIMIT 1", [
            userId,
          ]),
        ]);

        if (companyOwned?.[0] || companyManaged?.[0]) roleSet.add("company");
        if (partnerOwned?.[0] || partnerManaged?.[0]) roleSet.add("partner");
        if (seller?.[0]) roleSet.add("seller");
        if (consultant?.[0]) roleSet.add("consultant");
      } catch (e) {
        console.error(
          "/api/users endpoint=role: derived role lookup failed",
          e,
        );
      }

      const roles = Array.from(roleSet);
>>>>>>> theirs
      return Response.json({ roles });
    }

    // Default: endpoint=me
    const rows = await sql`
      SELECT u.id, u.name, u.email, u.image, u."emailVerified",
             (SELECT MAX(s.expires) FROM auth_sessions s WHERE s."userId" = u.id) AS last_login
      FROM auth_users u
      WHERE u.id = ${userId}
      LIMIT 1
    `;

    return Response.json({ user: rows[0] || null });
  } catch (e) {
    console.error("/api/users GET error", e);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = (searchParams.get("endpoint") || "me").trim();

    if (endpoint !== "me") {
      return Response.json(
        { error: "Invalid endpoint for PATCH. Try endpoint=me" },
        { status: 400 },
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const body = await request.json().catch(() => ({}));
    const { name, image } = body || {};

    if (name == null && image == null) {
      return Response.json({ ok: true });
    }

    await sql`
      UPDATE auth_users
      SET
        name = COALESCE(${name}, name),
        image = COALESCE(${image}, image)
      WHERE id = ${userId}
    `;

    const rows = await sql`
      SELECT u.id, u.name, u.email, u.image, u."emailVerified",
             (SELECT MAX(s.expires) FROM auth_sessions s WHERE s."userId" = u.id) AS last_login
      FROM auth_users u
      WHERE u.id = ${userId}
      LIMIT 1
    `;

    return Response.json({ user: rows[0] || null });
  } catch (e) {
    console.error("/api/users PATCH error", e);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = (searchParams.get("endpoint") || "").trim();

    if (endpoint !== "role") {
      return Response.json(
        { error: "Invalid endpoint for POST. Try endpoint=role" },
        { status: 400 },
      );
    }

    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const role = normalizeRole(body?.role);

    if (!ALLOWED_DASHBOARD_ROLES.has(role)) {
      return Response.json({ error: "Invalid role" }, { status: 400 });
    }

    // Ensure a single dashboard role: remove any existing dashboard roles first
    await sql`
      DELETE FROM user_roles
      WHERE user_id = ${userId} AND role = ANY(${DASHBOARD_ROLE_ALIASES})
    `;

    await sql`
      INSERT INTO user_roles (user_id, role)
      VALUES (${userId}, ${role})
      ON CONFLICT (user_id, role) DO NOTHING
    `;

    const rows = await sql`
      SELECT role FROM user_roles WHERE user_id = ${userId}
    `;
    const roles = rows.map((r) => normalizeRole(r?.role)).filter(Boolean);

    return Response.json({ ok: true, roles });
  } catch (e) {
    console.error("/api/users POST error", e);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
