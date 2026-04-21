import sql from "@/app/api/utils/sql";

export async function GET(request, { params }) {
  try {
    const token = params.token;

    // Get invitation details (keep compatible with older schemas)
    const invitationRows = await sql`
      SELECT 
        ci.id,
        ci.club_id,
        ci.email,
        ci.token,
        ci.created_by,
        ci.expires_at,
        ci.status,
        c.name as club_name,
        c.description as club_description,
        au.name as inviter_name,
        au.email as inviter_email
      FROM club_invitations ci
      JOIN clubs c ON ci.club_id = c.id
      LEFT JOIN auth_users au ON ci.created_by = au.id
      WHERE ci.token = ${token}
    `;

    if (invitationRows.length === 0) {
      return Response.json({ error: "Invitation not found" }, { status: 404 });
    }

    const invitation = invitationRows[0];

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    if (now > expiresAt) {
      return Response.json(
        { error: "This invitation has expired" },
        { status: 410 },
      );
    }

    const emailValue = (invitation.email || "").trim();
    const isShareLink = invitation.status === "active" && emailValue.length === 0;

    if (!isShareLink) {
      // Email invites are single-use
      if (invitation.status !== "pending") {
        return Response.json(
          { error: "This invitation has already been used" },
          { status: 410 },
        );
      }
    }

    return Response.json({ invitation });
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return Response.json(
      { error: "Failed to fetch invitation" },
      { status: 500 },
    );
  }
}
