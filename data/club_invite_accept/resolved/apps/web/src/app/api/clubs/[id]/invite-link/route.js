import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

function normalizeBaseUrl(url) {
  if (!url) {
    return null;
  }
  try {
    return new URL(url).origin;
  } catch {
    // If it's already an origin-ish string, trim trailing slashes.
    return String(url).replace(/\/+$/, "");
  }
}

function getBaseUrl(request) {
  // Best effort: derive from request.url first (works even when Origin is not set)
  try {
    const derived = new URL(request.url).origin;
    if (derived) {
      return derived;
    }
  } catch {
    // ignore
  }

  // Next best: Origin header
  const origin = request?.headers?.get?.("origin");
  const normalizedOrigin = normalizeBaseUrl(origin);
  if (normalizedOrigin) {
    return normalizedOrigin;
  }

  // Fall back to configured env vars
  const appUrl = normalizeBaseUrl(process.env.APP_URL);
  if (appUrl) {
    return appUrl;
  }

  const authUrl = normalizeBaseUrl(process.env.AUTH_URL);
  if (authUrl) {
    return authUrl;
  }

  return null;
}

function buildInviteUrl(request, token) {
  const baseUrl = getBaseUrl(request);
  if (!baseUrl) {
    return `/invitations/${token}`;
  }
  return `${baseUrl}/invitations/${token}`;
}

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clubId = parseInt(params.id);
    if (!Number.isFinite(clubId)) {
      return Response.json({ error: "Invalid club id" }, { status: 400 });
    }
    const userId = parseInt(session.user.id);

    // Check if user is a member of this club
    const membershipRows = await sql`
      SELECT role FROM club_members
      WHERE club_id = ${clubId} AND user_id = ${userId}
    `;

    if (membershipRows.length === 0) {
      return Response.json(
        { error: "You are not a member of this club" },
        { status: 403 },
      );
    }

    // Reusable share links are invitations with status='active' and email empty (or null in older rows)
    const rows = await sql`
      SELECT token, expires_at
      FROM club_invitations
      WHERE club_id = ${clubId}
        AND status = 'active'
        AND COALESCE(email, '') = ''
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (rows.length === 0) {
      return Response.json({ inviteUrl: null, expiresAt: null });
    }

    const row = rows[0];
    return Response.json({
      inviteUrl: buildInviteUrl(request, row.token),
      expiresAt: row.expires_at,
    });
  } catch (error) {
    console.error("GET /api/clubs/[id]/invite-link error", error);
    return Response.json(
      { error: error?.message || "Failed to load invite link" },
      { status: 500 },
    );
  }
}

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clubId = parseInt(params.id);
    if (!Number.isFinite(clubId)) {
      return Response.json({ error: "Invalid club id" }, { status: 400 });
    }
    const userId = parseInt(session.user.id);

    // Check if user is a member of this club
    const membershipRows = await sql`
      SELECT role FROM club_members
      WHERE club_id = ${clubId} AND user_id = ${userId}
    `;

    if (membershipRows.length === 0) {
      return Response.json(
        { error: "You are not a member of this club" },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const regenerate = !!body?.regenerate;

    if (!regenerate) {
      // If they didn't ask to regenerate, just return the existing link if possible.
      const existing = await sql`
        SELECT token, expires_at
        FROM club_invitations
        WHERE club_id = ${clubId}
          AND status = 'active'
          AND COALESCE(email, '') = ''
          AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
      `;

      if (existing.length > 0) {
        return Response.json({
          inviteUrl: buildInviteUrl(request, existing[0].token),
          expiresAt: existing[0].expires_at,
        });
      }
    }

    // Revoke any existing active links (keep compatible with older schemas)
    await sql`
      UPDATE club_invitations
      SET status = 'revoked'
      WHERE club_id = ${clubId}
        AND status = 'active'
        AND COALESCE(email, '') = ''
    `;

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // NOTE: our DB may have email as NOT NULL, so we store '' for share links.
    const rows = await sql`
      INSERT INTO club_invitations (
        club_id,
        email,
        token,
        created_by,
        expires_at,
        status
      )
      VALUES (
        ${clubId},
        ${""},
        ${token},
        ${userId},
        ${expiresAt},
        'active'
      )
      RETURNING token, expires_at
    `;

    const created = rows[0];

    return Response.json({
      inviteUrl: buildInviteUrl(request, created.token),
      expiresAt: created.expires_at,
    });
  } catch (error) {
    console.error("POST /api/clubs/[id]/invite-link error", error);
    return Response.json(
      { error: error?.message || "Failed to create invite link" },
      { status: 500 },
    );
  }
}
