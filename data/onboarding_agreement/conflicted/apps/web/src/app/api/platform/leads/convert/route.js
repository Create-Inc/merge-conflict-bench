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

    // Get lead details
    const [lead] = await sql`
      SELECT * FROM demo_access_requests
      WHERE id = ${leadId}
    `;

    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    // Prefer APP_URL if set (most reliable), otherwise construct from headers.
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

<<<<<<< ours
    const buildOnboardingEmailPayload = ({ invitation, inviteUrl }) => {
=======
    const buildOnboardingEmailPayload = ({
      invitation,
      inviteUrl,
      agreementPreviewUrlHtml,
      agreementPreviewUrlPdf,
    }) => {
>>>>>>> theirs
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
              When you open onboarding, you'll review & sign the service agreement and choose your billing preference.
            </p>

<<<<<<< ours
            <div style="text-align: center; margin: 22px 0 28px;">
=======
            <div style="border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; background: #f9fafb; margin: 18px 0;">
              <div style="font-weight: 800; color: #111827; margin-bottom: 8px;">Service agreement</div>
              <div style="color: #374151; font-size: 14px; line-height: 1.6; margin-bottom: 12px;">
                Please review the Lotly Service Agreement before completing setup.
              </div>
              <div style="text-align: center; margin: 10px 0;">
                <a href="${agreementPreviewUrlHtml}"
                  style="background-color: #111827; color: white; padding: 12px 16px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 700;">
                  View Service Agreement
                </a>
              </div>
              <div style="text-align: center; margin: 8px 0 0;">
                <a href="${agreementPreviewUrlPdf}" style="color: #2563eb; font-size: 12px;">Download PDF</a>
              </div>
              <div style="color: #6b7280; font-size: 12px; line-height: 1.5; margin-top: 10px;">
                If the button doesn't work, copy/paste this link:<br />
                <a href="${agreementPreviewUrlHtml}" style="color: #2563eb;">${agreementPreviewUrlHtml}</a>
              </div>
            </div>

            <p style="color: #374151; line-height: 1.6; margin-bottom: 14px;">
              To finish setup, pick how you'd like billing handled going forward. You can change this later.
            </p>

            <div style="margin: 20px 0;">
              <div style="margin-bottom: 10px; color: #111827; font-weight: 800;">Billing preference</div>
              <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
                <a href="${onboardingUrlStripeMonthly}"
                   style="background-color: #111827; color: white; padding: 14px 18px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 700; text-align: center;">
                  Recurring monthly invoice (recommended)
                </a>
                <a href="${onboardingUrlManual}"
                   style="background-color: #2563eb; color: white; padding: 14px 18px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 700; text-align: center;">
                  Manual invoice (sent by our team each month)
                </a>
              </div>
            </div>

            <p style="color: #374151; line-height: 1.6; margin-bottom: 18px;">
              After you complete setup, we’ll send your first invoice within 24 hours.
              Once your first invoice is paid, we will enable your account and email you when you can sign in.
            </p>

            <div style="text-align: center; margin: 22px 0 30px;">
>>>>>>> theirs
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
<<<<<<< ours
        text: `Welcome to Lotly!\n\nHi ${recipientName},\n\nStart onboarding here: ${inviteUrl}\n\nInside onboarding you'll review & sign the service agreement and choose billing.`,
=======
        text: `Welcome to Lotly!\n\nHi ${recipientName},\n\nReview the service agreement: ${agreementPreviewUrlHtml}\n(Download PDF: ${agreementPreviewUrlPdf})\n\nChoose billing + complete setup:\n- Recurring monthly invoice: ${onboardingUrlStripeMonthly}\n- Manual invoice: ${onboardingUrlManual}\n\nStart onboarding: ${inviteUrl}`,
>>>>>>> theirs
      };
    };

    // If an active invite already exists (and is not expired), just resend it.
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
<<<<<<< ours

=======
      const agreementPreviewUrlHtml = `${baseUrl.replace(/\/$/, "")}/api/onboarding/agreement-preview?token=${existingInvitation.token}&format=html`;
      const agreementPreviewUrlPdf = `${baseUrl.replace(/\/$/, "")}/api/onboarding/agreement-preview?token=${existingInvitation.token}&format=pdf`;
>>>>>>> theirs

      if (sendInvite) {
        await sendEmail({
          ...buildOnboardingEmailPayload({
            invitation: existingInvitation,
            inviteUrl,
<<<<<<< ours

=======
            agreementPreviewUrlHtml,
            agreementPreviewUrlPdf,
>>>>>>> theirs
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

    // Generate invitation token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14); // 14 days expiry

    // Create onboarding invitation
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
<<<<<<< ours

=======
    const agreementPreviewUrlHtml = `${baseUrl.replace(/\/$/, "")}/api/onboarding/agreement-preview?token=${token}&format=html`;
    const agreementPreviewUrlPdf = `${baseUrl.replace(/\/$/, "")}/api/onboarding/agreement-preview?token=${token}&format=pdf`;
>>>>>>> theirs

    // Send invitation email if requested
    if (sendInvite) {
      await sendEmail({
        ...buildOnboardingEmailPayload({
          invitation,
          inviteUrl,
<<<<<<< ours

=======
          agreementPreviewUrlHtml,
          agreementPreviewUrlPdf,
>>>>>>> theirs
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
