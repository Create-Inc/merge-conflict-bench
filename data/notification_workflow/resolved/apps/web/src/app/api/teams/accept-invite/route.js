import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { createNotification } from "@/app/api/utils/notify";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return Response.json({ error: "Token required" }, { status: 400 });
    }

    // Find invitation
    const invitations = await sql`
      SELECT * FROM team_invitations
      WHERE token = ${token} AND accepted_at IS NULL
      LIMIT 1
    `;

    if (invitations.length === 0) {
      return Response.json(
        { error: "Invalid or expired invitation" },
        { status: 404 },
      );
    }

    const invitation = invitations[0];

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return Response.json({ error: "Invitation has expired" }, { status: 400 });
    }

    // Check if user's email matches
    const users =
      await sql`SELECT email, name FROM auth_users WHERE id = ${userId} LIMIT 1`;
    if (
      users.length === 0 ||
      users[0].email.toLowerCase() !== invitation.email.toLowerCase()
    ) {
      return Response.json({ error: "Email mismatch" }, { status: 403 });
    }

    // Check if already a member
    const existing = await sql`
      SELECT id FROM team_members
      WHERE team_id = ${invitation.team_id} AND user_id = ${userId}
      LIMIT 1
    `;

    if (existing.length > 0) {
      return Response.json({ error: "Already a team member" }, { status: 400 });
    }

    // Add user to team
    await sql`
      INSERT INTO team_members (team_id, user_id, role)
      VALUES (${invitation.team_id}, ${userId}, ${invitation.role})
    `;

    // Mark invitation as accepted
    await sql`
      UPDATE team_invitations
      SET accepted_at = NOW()
      WHERE id = ${invitation.id}
    `;

    // Notify inviter
    try {
      await createNotification({
        userId: invitation.invited_by,
        notificationType: "team_invite_accepted",
        title: `${users[0].name || users[0].email} joined your team`,
        message: `Invite accepted for role: ${invitation.role}`,
        metadata: { teamId: invitation.team_id, url: "/teams" },
      });
    } catch (e) {
      console.error("Failed to create team_invite_accepted notification", e);
    }

    // Notify the user who accepted (useful confirmation)
    try {
      await createNotification({
        userId,
        notificationType: "team_joined",
        title: "You joined a team",
        message: `You're now a member (role: ${invitation.role}).`,
        metadata: { teamId: invitation.team_id, url: "/teams" },
      });
    } catch (e) {
      console.error("Failed to create team_joined notification", e);
    }

    // Also notify other team admins/owners (helps teams stay in the loop)
    try {
      const teamRows = await sql`
        SELECT name FROM teams WHERE id = ${invitation.team_id} LIMIT 1
      `;
      const teamName = teamRows?.[0]?.name || "your team";

      const adminMembers = await sql`
        SELECT user_id
        FROM team_members
        WHERE team_id = ${invitation.team_id}
          AND role IN ('owner', 'admin')
      `;

      const alreadyNotified = new Set([invitation.invited_by, userId]);

      for (const member of adminMembers) {
        const adminUserId = member.user_id;
        if (alreadyNotified.has(adminUserId)) {
          continue;
        }
        alreadyNotified.add(adminUserId);

        await createNotification({
          userId: adminUserId,
          notificationType: "team_member_joined",
          title: `${users[0].name || users[0].email} joined ${teamName}`,
          message: `Role: ${invitation.role}`,
          metadata: { teamId: invitation.team_id, memberUserId: userId },
        });
      }
    } catch (e) {
      console.error("Failed to create team_member_joined notifications", e);
    }

    return Response.json({ success: true, team_id: invitation.team_id });
  } catch (err) {
    console.error("Accept invite error:", err);
    return Response.json(
      { error: "Failed to accept invitation" },
      { status: 500 },
    );
  }
}
