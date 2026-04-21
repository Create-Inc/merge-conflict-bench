import sql from "@/app/api/utils/sql";

const DEFAULT_SETTINGS = {
  workflow_success: false,
  workflow_failure: true,
  workflow_activity: true,
  team_invites: true,
  billing_updates: true,
  product_updates: true,
  important_updates: true,
  performance_alerts: true,
};

const PREFERENCE_BY_NOTIFICATION_TYPE = {
  workflow_success: "workflow_success",
  workflow_failure: "workflow_failure",

<<<<<<< ours
  workflow_created: "workflow_activity",

=======
  // General workflow activity (create/import/install/etc.)
  workflow_created: "workflow_activity",

>>>>>>> theirs
  team_invite_sent: "team_invites",
  team_invite_received: "team_invites",
  team_invite_accepted: "team_invites",
<<<<<<< ours
  team_member_joined: "team_invites",
=======
  team_joined: "team_invites",
>>>>>>> theirs

  billing_update: "billing_updates",

  performance_alert: "performance_alerts",

  product_update: "product_updates",
  important_update: "important_updates",
};

async function getOrCreateNotificationSettings(userId) {
  const rows = await sql`
    SELECT *
    FROM notification_settings
    WHERE user_id = ${userId}
    ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
    LIMIT 1
  `;

  if (rows.length > 0) {
    return { ...DEFAULT_SETTINGS, ...rows[0] };
  }

  const created = await sql`
    INSERT INTO notification_settings (user_id)
    VALUES (${userId})
    RETURNING *
  `;

  return { ...DEFAULT_SETTINGS, ...(created?.[0] || {}) };
}

export async function createNotification({
  userId,
  notificationType,
  title,
  message,
  metadata = {},
  respectPreferences = true,
}) {
  if (!userId) {
    return null;
  }

  if (respectPreferences) {
    const preferenceKey = PREFERENCE_BY_NOTIFICATION_TYPE[notificationType];

    if (preferenceKey) {
      const settings = await getOrCreateNotificationSettings(userId);
      const allowed = settings?.[preferenceKey] !== false;

      if (!allowed) {
        return null;
      }
    }
  }

  const rows = await sql`
    INSERT INTO user_notifications (
      user_id,
      notification_type,
      title,
      message,
      metadata
    )
    VALUES (
      ${userId},
      ${notificationType},
      ${title},
      ${message || null},
      ${JSON.stringify(metadata || {})}
    )
    RETURNING *
  `;

  return rows[0] || null;
}

export default {
  createNotification,
};
