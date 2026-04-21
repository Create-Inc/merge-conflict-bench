import sql from "@/app/api/utils/sql";
import { requirePlatformAdmin } from "@/app/api/platform/utils/requirePlatformAdmin";
import { randomBytes } from "crypto";
import { sendEmail } from "@/app/api/utils/send-email";

// Convert lead to invitation (or resend an existing active invite)
export async function POST(request) {
  const access = await requirePlatformAdmin();
  if (!access.ok) return access.response;

  try {
    const body = await request.json();
    const {
      leadId,
      planTier = "starter",
      monthlyPrice,
      dmsIntegrationFee,
      sendInvite = true,
    } = body;

    const [lead] = await sql`
      SELECT * FROM demo_access_requests
      WHERE id = ${leadId}
    `;

    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    const getBaseUrl = () => {
      const envUrl = (process.env.APP_URL || process.env.AUTH_URL || "").trim();
      if (envUrl) {
        try {
          const u = new URL(envUrl);
          return `${u.protocol}//${u.host}`;
        } catch (_) {
          if (!/^https?:\/\//i.test(envUrl)) {
            return `https://${envUrl.replace(/\/$/, "")}`;
          }
          return envUrl.replace(/\/$/, "");
        }
      }

      const protocol = request.headers.get("x-forwarded-proto") || "https";
      const host =
        request.headers.get("x-forwarded-host") ||
        request.headers.get("host") ||
        "";
      if (host) return `${protocol}://${host}`;

      try {
        const u = new URL(request.url);
        return `${u.protocol}//${u.host}`;
      } catch {
        return "https://www.lotlyauto.com";
      }
    };

    const buildOnboardingEmailPayload = ({ invitation, inviteUrl }) => {
      const recipientName =
        invitation.first_name && invitation.last_name
          ? `${invitation.first_name} ${invitation.last_name}`
          : invitation.first_name || invitation.company_name;

      return {
        to: invitation.email,
        from: "sales@lotlyauto.com",
        subject: `Welcome to Lotly - Let's Get ${invitation.company_name} Set Up!`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #111827; margin-bottom: 16px;">Welcome to Lotly!</h2>

            <p style="color: #374151; line-height: 1.6; margin-bottom: 16px;">
              Hi ${recipientName},
            </p>

            <p style="color: #374151; line-height: 1.6; margin-bottom: 16px;">
              We're excited to help ${invitation.company_name} streamline your dealership operations.
            </p>

            <div style="text-align: center; margin: 22px 0 28px;">
              <a href="${inviteUrl}"
                 style="background-color: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 800;">
                Start Onboarding
              </a>
            </div>

            <div style="color: #6b7280; font-size: 12px; line-height: 1.5; margin-top: 10px;">
              If the button doesn't work, copy and paste this link:<br />
              <a href="${inviteUrl}" style="color: #2563eb;">${inviteUrl}</a>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              This link will expire in 14 days. If you have any questions during setup,
              reply to this email or contact us at <a href="mailto:sales@lotlyauto.com" style="color: #2563eb;">sales@lotlyauto.com</a>
            </p>
          </div>
        `,
        text: `Welcome to Lotly!\n\nHi ${recipientName},\n\nStart onboarding here: ${inviteUrl}`,
      };
    };

    const [existingInvitation] = await sql`
      SELECT *
      FROM onboarding_invitations
      WHERE email = ${lead.email}
        AND accepted_at IS NULL
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (existingInvitation) {
      const baseUrl = getBaseUrl();
      const inviteUrl = `${baseUrl.replace(/\/$/, "")}/onboard?token=${existingInvitation.token}`;

      if (sendInvite) {
        await sendEmail({
          ...buildOnboardingEmailPayload({
            invitation: existingInvitation,
            inviteUrl,
          }),
          tags: ["onboarding", "welcome", "lead-invite-resend"],
        });
      }

      return Response.json({
        invitation: existingInvitation,
        inviteUrl,
        resent: true,
      });
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    const [invitation] = await sql`
      INSERT INTO onboarding_invitations (
        email,
        first_name,
        last_name,
        phone,
        company_name,
        state,
        dms_provider,
        expected_users,
        plan_tier,
        monthly_price,
        token,
        expires_at,
        created_by,
        notes
      ) VALUES (
        ${lead.email},
        ${lead.first_name},
        ${lead.last_name},
        ${lead.phone},
        ${lead.dealership_name},
        ${lead.state},
        ${lead.dms_provider},
        ${lead.expected_users},
        ${planTier},
        ${monthlyPrice || null},
        ${token},
        ${expiresAt},
        ${access.session.user.id},
        ${lead.questions || ""}
      )
      RETURNING *
    `;

    const baseUrl = getBaseUrl();
    const inviteUrl = `${baseUrl.replace(/\/$/, "")}/onboard?token=${token}`;

    if (sendInvite) {
      await sendEmail({
        ...buildOnboardingEmailPayload({
          invitation,
          inviteUrl,
        }),
        tags: ["onboarding", "welcome", "lead-conversion"],
      });
    }

    return Response.json({
      invitation,
      inviteUrl,
    });
  } catch (error) {
    console.error("Error converting lead:", error);
    return Response.json({ error: "Failed to convert lead" }, { status: 500 });
  }
}
