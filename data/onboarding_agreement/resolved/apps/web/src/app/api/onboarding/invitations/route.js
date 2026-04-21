import { auth } from "@/auth";
import sql from "@/app/api/utils/sql";
import { sendEmail } from "@/app/api/utils/send-email";
import crypto from "crypto";

// GET - List all onboarding invitations (admin only)
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await sql`
      SELECT role, dealership_id FROM auth_users WHERE id = ${session.user.id}
    `;

    if (user?.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const invitations = await sql`
      SELECT 
        oi.*,
        d.name as dealership_name,
        u.name as created_by_name
      FROM onboarding_invitations oi
      LEFT JOIN dealerships d ON oi.dealership_id = d.id
      LEFT JOIN auth_users u ON oi.created_by = u.id
      ORDER BY oi.created_at DESC
    `;

    return Response.json({ invitations });
  } catch (error) {
    console.error("Failed to fetch onboarding invitations:", error);
    return Response.json(
      { error: "Failed to fetch onboarding invitations" },
      { status: 500 },
    );
  }
}

// POST - Create new onboarding invitation (admin only)
export async function POST(request) {
  let requestEmail = null;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await sql`
      SELECT role, dealership_id FROM auth_users WHERE id = ${session.user.id}
    `;

    if (user?.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      email,
      firstName,
      lastName,
      phone,
      companyName,
      state,
      dmsProvider,
      expectedUsers,
      planTier = "starter",
      monthlyPrice,
      notes,
    } = body;

    requestEmail = email;

    if (!email || !companyName) {
      return Response.json(
        { error: "Email and company name are required" },
        { status: 400 },
      );
    }

    const token = crypto.randomBytes(32).toString("hex");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const [invitation] = await sql`
      INSERT INTO onboarding_invitations (
        email, first_name, last_name, phone, company_name, state,
        dms_provider, expected_users, plan_tier, monthly_price,
        token, expires_at, created_by, notes
      ) VALUES (
        ${email}, ${firstName || null}, ${lastName || null}, ${phone || null},
        ${companyName}, ${state || null}, ${dmsProvider || null},
        ${expectedUsers || null}, ${planTier}, ${monthlyPrice || null},
        ${token}, ${expiresAt}, ${session.user.id}, ${notes || null}
      )
      RETURNING *
    `;

    let baseUrl;
    if (process.env.APP_URL) {
      baseUrl = process.env.APP_URL;
    } else {
      const protocol = request.headers.get("x-forwarded-proto") || "https";
      const host = request.headers.get("host") || "www.lotlyauto.com";
      baseUrl = `${protocol}://${host}`;
    }
    baseUrl = String(baseUrl || "").replace(/\/$/, "");

    const onboardingUrl = `${baseUrl}/onboard?token=${token}`;

    const recipientName =
      firstName && lastName
        ? `${firstName} ${lastName}`
        : firstName || companyName;

    const emailResult = await sendEmail({
      to: email,
      from: "sales@lotlyauto.com",
      subject: `Welcome to Lotly - Let's Get ${companyName} Set Up!`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #111827; margin-bottom: 16px;">Welcome to Lotly!</h2>

          <p style="color: #374151; line-height: 1.6; margin-bottom: 16px;">
            Hi ${recipientName},
          </p>

          <p style="color: #374151; line-height: 1.6; margin-bottom: 16px;">
            We're excited to help ${companyName} streamline your dealership operations.
          </p>

          <div style="text-align: center; margin: 22px 0 28px;">
            <a href="${onboardingUrl}"
               style="background-color: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 800;">
              Start Onboarding
            </a>
          </div>

          <div style="color: #6b7280; font-size: 12px; line-height: 1.5; margin-top: 10px;">
            If the button doesn't work, copy and paste this link:<br />
            <a href="${onboardingUrl}" style="color: #2563eb;">${onboardingUrl}</a>
          </div>

          <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            This link will expire in 30 days. If you have any questions, reply to this email or contact us at
            <a href="mailto:sales@lotlyauto.com" style="color: #2563eb;">sales@lotlyauto.com</a>
          </p>
        </div>
      `,
      text: `Welcome to Lotly!\n\nHi ${recipientName},\n\nStart onboarding: ${onboardingUrl}`,
      tags: ["onboarding", "welcome"],
    });

    console.log(`Onboarding email sent successfully:`, emailResult);

    return Response.json(
      {
        invitation,
        onboardingUrl,
        emailId: emailResult?.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create onboarding invitation:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      email: requestEmail,
    });
    return Response.json(
      {
        error: "Failed to create onboarding invitation",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
