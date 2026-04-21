import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = params.token;
    const userId = parseInt(session.user.id);
    const userEmail = (session.user.email || "").toLowerCase();

    // Get invitation details (keep compatible with older schemas)
    const invitationRows = await sql`
      SELECT 
        id,
        club_id,
        email,
        expires_at,
        status
      FROM club_invitations
      WHERE token = ${token}
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
      // Email invite
      if (invitation.status !== "pending") {
        return Response.json(
          { error: "This invitation has already been used" },
          { status: 410 },
        );
      }

      if (invitation.email && userEmail && invitation.email !== userEmail) {
        return Response.json(
          {
            error:
              "This invite was sent to a different email. Please sign in with the invited email to join.",
          },
          { status: 403 },
        );
      }
    } else {
      // Share-link invite must remain active
      if (invitation.status !== "active") {
        return Response.json(
          { error: "This invite link is no longer active" },
          { status: 410 },
        );
      }
    }

    // Check if user is already a member
    const existingMemberRows = await sql`
      SELECT id FROM club_members
      WHERE club_id = ${invitation.club_id} AND user_id = ${userId}
    `;

    if (existingMemberRows.length > 0) {
      return Response.json(
        { error: "You are already a member of this club" },
        { status: 409 },
      );
    }

    // Add user to club
    await sql`
      INSERT INTO club_members (club_id, user_id, role)
      VALUES (${invitation.club_id}, ${userId}, 'member')
    `;

    // Mark email invitations as accepted. Keep share-links reusable.
    if (!isShareLink) {
      await sql`
        UPDATE club_invitations
        SET status = 'accepted'
        WHERE id = ${invitation.id}
      `;
    }

    return Response.json({
      success: true,
      clubId: invitation.club_id,
      message: "Successfully joined the club",
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return Response.json(
      { error: "Failed to accept invitation" },
      { status: 500 },
    );
  }
}
