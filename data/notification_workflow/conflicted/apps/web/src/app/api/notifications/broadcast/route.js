import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { requireAdmin } from "@/app/api/utils/rbac";
import { validateRequestBody, validators } from "@/app/api/utils/validation";
<<<<<<< ours
import { sendEmail } from "@/app/api/utils/send-email";
import { renderBroadcastEmail } from "@/app/api/utils/emailTemplates";
=======
import { sendEmail } from "@/app/api/utils/send-email";
>>>>>>> theirs

function preferenceColumnForType(type) {
  if (type === "product_update") {
    return "product_updates";
  }
  if (type === "important_update") {
    return "important_updates";
  }
  return null;
}

function renderBroadcastEmail({ title, message, url }) {
  const safeTitle = title || "Update";
  const safeMessage = message || "";
  const safeUrl = url || `${process.env.APP_URL}/notifications`;

  const subject = `Important update: ${safeTitle}`;

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto; max-width: 640px; margin: 0 auto; padding: 24px; background: #F9FAFB;">
      <div style="background: white; border: 1px solid #E5E7EB; border-radius: 16px; overflow: hidden;">
        <div style="padding: 18px 20px; background: #DC2626; color: white;">
          <div style="font-size: 16px; font-weight: 800; letter-spacing: 0.2px;">Syntelligent</div>
          <div style="margin-top: 6px; font-size: 14px; opacity: 0.9;">Important update</div>
        </div>
        <div style="padding: 22px 20px;">
          <h1 style="font-size: 20px; margin: 0 0 10px; color: #111827;">${safeTitle}</h1>
          <p style="margin: 0 0 18px; color: #374151; line-height: 1.6; white-space: pre-line;">${safeMessage}</p>
          <a href="${safeUrl}" style="display: inline-block; background: #2563EB; color: white; text-decoration: none; padding: 12px 18px; border-radius: 12px; font-weight: 700;">Open</a>
        </div>
        <div style="padding: 14px 20px; border-top: 1px solid #E5E7EB; background: #FFFFFF; color: #9CA3AF; font-size: 12px;">
          You’re receiving this because you enabled email for important updates.
        </div>
      </div>
      <div style="text-align: center; margin-top: 14px; color: #9CA3AF; font-size: 12px;">
        Syntelligent • Workflow automation platform
      </div>
    </div>
  `;

  const text = `${safeTitle}\n\n${safeMessage}\n\nOpen: ${safeUrl}`;

  return { subject, html, text };
}

export async function POST(request) {
  try {
    // Allow either:
    // 1) internal secret header (for server-side automation)
    // 2) an authenticated admin user
    const internalSecret = process.env.AUTH_SECRET;
    const providedSecret = request.headers.get("x-anything-internal-secret");

    const allowInternal = !!internalSecret && providedSecret === internalSecret;

    let senderUserId = null;

    if (!allowInternal) {
      const session = await auth();
      const check = await requireAdmin(session);
      if (!check.ok) {
        return check.response;
      }
      senderUserId = session?.user?.id || null;
    }

    const validation = await validateRequestBody(request, {
      type: validators.string({
        required: true,
        enum: ["product_update", "important_update"],
      }),
      title: validators.string({ required: true, min: 1, max: 140 }),
      message: validators.string({ required: false, max: 4000 }),
      url: validators.string({ required: false, url: true }),
      user_ids: validators.array(validators.number({ integer: true }), {
        required: false,
        max: 500,
      }),
<<<<<<< ours
      sender_user_id: validators.number({ required: false, integer: true }),
=======
      // Only needed for internal calls that want email sending.
      sender_user_id: validators.number({ required: false, integer: true }),
>>>>>>> theirs
    });

    if (!validation.success) {
      return Response.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 },
      );
    }

    const { type, title, message, url, user_ids, sender_user_id } =
      validation.data;

<<<<<<< ours
    if (allowInternal && sender_user_id) {
      senderUserId = Number(sender_user_id);
    }

=======
    if (allowInternal && sender_user_id) {
      senderUserId = sender_user_id;
    }

>>>>>>> theirs
    const preferenceColumn = preferenceColumnForType(type);

    const metadata = {
      url: url || null,
      source: allowInternal ? "internal" : "admin",
    };

    const values = [type, title, message || null, JSON.stringify(metadata)];

    let where = `
      WHERE COALESCE(uas.is_active, true) = true
        AND COALESCE(uas.is_archived, false) = false
    `;

    if (preferenceColumn) {
      where += `
        AND COALESCE(ns.${preferenceColumn}, true) = true
      `;
    }

    if (Array.isArray(user_ids) && user_ids.length > 0) {
      values.push(user_ids);
      where += `
        AND au.id = ANY($${values.length}::int[])
      `;
    }

    const query = `
      INSERT INTO user_notifications (
        user_id,
        notification_type,
        title,
        message,
        metadata
      )
      SELECT
        au.id,
        $1,
        $2,
        $3,
        $4::jsonb
      FROM auth_users au
      LEFT JOIN user_admin_state uas ON uas.user_id = au.id
      LEFT JOIN notification_settings ns ON ns.user_id = au.id
      ${where}
      RETURNING id
    `;

    const inserted = await sql(query, values);

<<<<<<< ours
    // Optional emails: if the user enabled `email_on_broadcast`, we will also email them.
    // NOTE: emails are sent using the sender/admin user's Resend credentials.
    let emailAttempted = 0;
    let emailSent = 0;
    let emailSkippedReason = null;
    let emailError = null;
    let emailPreview = null;

    if (!senderUserId) {
      emailSkippedReason = allowInternal
        ? "sender_user_id is required for email when using internal secret"
        : "missing sender";
    } else {
      const emailValues = [];

      let emailWhere = `
        WHERE COALESCE(uas.is_active, true) = true
          AND COALESCE(uas.is_archived, false) = false
          AND COALESCE(ns.email_on_broadcast, false) = true
      `;

      if (preferenceColumn) {
        emailWhere += `
          AND COALESCE(ns.${preferenceColumn}, true) = true
        `;
      }

      if (Array.isArray(user_ids) && user_ids.length > 0) {
        emailValues.push(user_ids);
        emailWhere += `
          AND au.id = ANY($${emailValues.length}::int[])
        `;
      }

      const emailQuery = `
        SELECT
          au.id AS user_id,
          au.name AS user_name,
          COALESCE(NULLIF(ns.email, ''), au.email) AS recipient_email
        FROM auth_users au
        LEFT JOIN user_admin_state uas ON uas.user_id = au.id
        LEFT JOIN notification_settings ns ON ns.user_id = au.id
        ${emailWhere}
          AND COALESCE(NULLIF(ns.email, ''), au.email) IS NOT NULL
          AND COALESCE(NULLIF(ns.email, ''), au.email) <> ''
        LIMIT 500
      `;

      const recipients = await sql(emailQuery, emailValues);

      const wasCapped = (recipients?.length || 0) === 500;

      if (recipients.length > 0) {
        const tpl = renderBroadcastEmail({
          title,
          message,
          url,
          type,
          recipientName: null,
        });

        emailPreview = {
          subject: tpl.subject,
          text: tpl.text,
          html: tpl.html,
        };

        for (const r of recipients) {
          emailAttempted += 1;
          try {
            const t = renderBroadcastEmail({
              title,
              message,
              url,
              type,
              recipientName: r.user_name,
            });

            await sendEmail({
              userId: senderUserId,
              to: r.recipient_email,
              subject: t.subject,
              html: t.html,
              text: t.text,
            });
            emailSent += 1;
          } catch (err) {
            emailError = err?.message || "Failed to send email";

            // If Resend isn't configured, stop trying.
            if (
              typeof emailError === "string" &&
              emailError.toLowerCase().includes("resend not configured")
            ) {
              break;
            }
          }
        }
      }

      if (wasCapped) {
        emailSkippedReason =
          "email recipients capped at 500; send to a smaller set (user_ids) for full email coverage";
      }
    }

=======
    // Optional email sending for important updates.
    // Safeguards:
    // - Only for important_update
    // - Requires senderUserId (to load Resend API key)
    // - Caps total emails per call
    const emailSummary = {
      attempted: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      error: null,
      preview: null,
      capped: false,
    };

    if (type === "important_update") {
      if (!senderUserId) {
        emailSummary.skipped = inserted?.length || 0;
        emailSummary.error =
          "Email sending skipped: missing sender_user_id (internal call) or session user.";
      } else {
        const maxEmails = 200;

        const emailValues = [];
        let emailWhere = `
          WHERE COALESCE(uas.is_active, true) = true
            AND COALESCE(uas.is_archived, false) = false
            AND COALESCE(ns.important_updates, true) = true
            AND COALESCE(ns.email_on_broadcast, false) = true
        `;

        if (Array.isArray(user_ids) && user_ids.length > 0) {
          emailValues.push(user_ids);
          emailWhere += `
            AND au.id = ANY($${emailValues.length}::int[])
          `;
        }

        // Only email users where we can determine a destination.
        const recipientsQuery = `
          SELECT
            au.id AS user_id,
            COALESCE(NULLIF(ns.email, ''), au.email) AS email
          FROM auth_users au
          LEFT JOIN user_admin_state uas ON uas.user_id = au.id
          LEFT JOIN notification_settings ns ON ns.user_id = au.id
          ${emailWhere}
            AND COALESCE(NULLIF(ns.email, ''), au.email) IS NOT NULL
          LIMIT ${maxEmails + 1}
        `;

        const recipients = await sql(recipientsQuery, emailValues);
        const list = Array.isArray(recipients) ? recipients : [];

        const finalRecipients = list.slice(0, maxEmails);
        if (list.length > maxEmails) {
          emailSummary.capped = true;
        }

        const tpl = renderBroadcastEmail({
          title,
          message,
          url: url || null,
        });

        for (const r of finalRecipients) {
          if (!r?.email) {
            emailSummary.skipped += 1;
            continue;
          }

          emailSummary.attempted += 1;

          try {
            await sendEmail({
              userId: senderUserId,
              to: r.email,
              subject: tpl.subject,
              html: tpl.html,
              text: tpl.text,
            });
            emailSummary.sent += 1;
          } catch (e) {
            emailSummary.failed += 1;
            if (!emailSummary.error) {
              emailSummary.error = e?.message || "Failed to send email";
              emailSummary.preview = {
                to: r.email,
                subject: tpl.subject,
                text: tpl.text,
                html: tpl.html,
              };
            }

            // If Resend isn't configured, don't hammer it 200 times.
            if (
              String(e?.message || "")
                .toLowerCase()
                .includes("resend not configured")
            ) {
              break;
            }
          }
        }
      }
    }

>>>>>>> theirs
    return Response.json({
      success: true,
      inserted_count: inserted?.length || 0,
<<<<<<< ours
      email_attempted: emailAttempted,
      email_sent: emailSent,
      email_skipped_reason: emailSkippedReason,
      email_error: emailError,
      email_preview: emailPreview,
=======
      email: emailSummary,
>>>>>>> theirs
    });
  } catch (err) {
    console.error("POST /api/notifications/broadcast error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
