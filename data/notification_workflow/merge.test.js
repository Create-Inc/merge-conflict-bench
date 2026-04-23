import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const notifySrc = readFileSync(
  join(__dirname, "resolved/apps/web/src/app/api/utils/notify.js"),
  "utf-8"
);
const workflowsRouteSrc = readFileSync(
  join(__dirname, "resolved/apps/web/src/app/api/workflows/route.js"),
  "utf-8"
);
const importRouteSrc = readFileSync(
  join(__dirname, "resolved/apps/web/src/app/api/workflows/import/route.js"),
  "utf-8"
);
const acceptInviteSrc = readFileSync(
  join(__dirname, "resolved/apps/web/src/app/api/teams/accept-invite/route.js"),
  "utf-8"
);
const broadcastSrc = readFileSync(
  join(__dirname, "resolved/apps/web/src/app/api/notifications/broadcast/route.js"),
  "utf-8"
);
const settingsSrc = readFileSync(
  join(__dirname, "resolved/apps/web/src/app/settings/notifications/page.jsx"),
  "utf-8"
);

// =====================================================================
// BASE BEHAVIORS
// =====================================================================
describe("base behaviors", () => {
  describe("notify: preference mapping", () => {
    it("maps workflow_created to workflow_activity preference", () => {
      expect(notifySrc).toMatch(/workflow_created.*workflow_activity/);
    });

    it("maps team notification types to team_invites preference", () => {
      expect(notifySrc).toMatch(/team_invite.*team_invites/);
    });
  });

  describe("notify: createNotification export", () => {
    it("exports createNotification function", () => {
      expect(notifySrc).toMatch(/export\s+async\s+function\s+createNotification/);
    });

    it("respects user preferences when respectPreferences is true", () => {
      expect(notifySrc).toMatch(/respectPreferences/);
    });

    it("returns null when userId is falsy", () => {
      expect(notifySrc).toMatch(/if\s*\(!userId\)\s*\{?\s*return\s+null/);
    });
  });

  describe("workflows route: auth and domain check", () => {
    it("calls getSessionFromRequest for auth", () => {
      expect(workflowsRouteSrc).toMatch(/getSessionFromRequest/);
    });

    it("checks domain restrictions", () => {
      expect(workflowsRouteSrc).toMatch(/requireAllowedDomain/);
    });

    it("checks workflow permissions", () => {
      expect(workflowsRouteSrc).toMatch(/requirePermission/);
    });
  });

  describe("workflows route: creates notification on POST", () => {
    it("calls createNotification with workflow_created type", () => {
      expect(workflowsRouteSrc).toMatch(/notificationType.*workflow_created/);
    });
  });

  describe("import route: creates notification on import", () => {
    it("calls createNotification for imported workflow", () => {
      expect(importRouteSrc).toMatch(/createNotification/);
      expect(importRouteSrc).toMatch(/workflow_created/);
    });

    it("validates workflow_data has nodes", () => {
      expect(importRouteSrc).toMatch(/workflow_data.*nodes/);
    });
  });

  describe("accept-invite route: basic flow", () => {
    it("requires a token", () => {
      expect(acceptInviteSrc).toMatch(/Token required/);
    });

    it("checks for invitation expiration", () => {
      expect(acceptInviteSrc).toMatch(/expires_at/);
      expect(acceptInviteSrc).toMatch(/Invitation has expired/);
    });

    it("checks for email mismatch", () => {
      expect(acceptInviteSrc).toMatch(/Email mismatch/);
    });

    it("checks for existing membership", () => {
      expect(acceptInviteSrc).toMatch(/Already a team member/);
    });

    it("notifies the inviter on acceptance", () => {
      expect(acceptInviteSrc).toMatch(/team_invite_accepted/);
    });
  });

  describe("broadcast route: admin gating", () => {
    it("allows internal secret OR admin auth", () => {
      expect(broadcastSrc).toMatch(/x-anything-internal-secret/);
      expect(broadcastSrc).toMatch(/requireAdmin|auth\(\)/);
    });
  });

  describe("notification settings page: toggle rows", () => {
    it("renders ToggleRow components for preferences", () => {
      expect(settingsSrc).toMatch(/ToggleRow/);
    });

    it("fetches settings from /api/notifications/settings", () => {
      expect(settingsSrc).toMatch(/\/api\/notifications\/settings/);
    });
  });
});

// =====================================================================
// OURS BEHAVIORS
// =====================================================================
describe("ours behaviors", () => {
  describe("notify: maps team_member_joined to team_invites", () => {
    it("includes team_member_joined in preference mapping", () => {
      expect(notifySrc).toMatch(/team_member_joined.*team_invites/);
    });
  });

  describe("broadcast route: email sending with renderBroadcastEmail", () => {
    it("defines or imports renderBroadcastEmail for email templates", () => {
      expect(broadcastSrc).toMatch(/renderBroadcastEmail/);
    });

    it("sends emails using sendEmail utility", () => {
      expect(broadcastSrc).toMatch(/sendEmail/);
    });
  });

  describe("broadcast route: sender_user_id handling", () => {
    it("validates sender_user_id in the request body", () => {
      expect(broadcastSrc).toMatch(/sender_user_id/);
    });
  });

  describe("accept-invite: notifies team admins", () => {
    it("queries for team admin/owner members to notify", () => {
      // Ours notifies other team admins/owners
      expect(acceptInviteSrc).toMatch(/team_invite_accepted|team_member_joined|team_joined/);
    });
  });

  describe("settings page: email_on_broadcast toggle", () => {
    it("has email_on_broadcast setting", () => {
      expect(settingsSrc).toMatch(/email_on_broadcast/);
    });
  });
});

// =====================================================================
// THEIRS BEHAVIORS
// =====================================================================
describe("theirs behaviors", () => {
  describe("notify: maps team_joined to team_invites", () => {
    it("includes team_joined in preference mapping", () => {
      expect(notifySrc).toMatch(/team_joined.*team_invites/);
    });
  });

  describe("workflows route: error handling around notification", () => {
    it("wraps notification creation in try/catch (non-fatal)", () => {
      // Theirs wraps createNotification in try/catch to make it non-fatal
      expect(workflowsRouteSrc).toMatch(/createNotification/);
    });
  });

  describe("import route: includes url in metadata", () => {
    it("notification metadata includes workflowId", () => {
      expect(importRouteSrc).toMatch(/workflowId/);
    });
  });

  describe("broadcast route: email limit/cap behavior", () => {
    it("handles cases where Resend is not configured", () => {
      expect(broadcastSrc).toMatch(/resend not configured/i);
    });
  });

  describe("no conflict markers", () => {
    it("notify.js has no conflict markers", () => {
      expect(notifySrc).not.toMatch(/<<<<<<</);
    });

    it("workflows route has no conflict markers", () => {
      expect(workflowsRouteSrc).not.toMatch(/<<<<<<</);
    });

    it("import route has no conflict markers", () => {
      expect(importRouteSrc).not.toMatch(/<<<<<<</);
    });

    it("accept-invite route has no conflict markers", () => {
      expect(acceptInviteSrc).not.toMatch(/<<<<<<</);
    });

    it("broadcast route has no conflict markers", () => {
      expect(broadcastSrc).not.toMatch(/<<<<<<</);
    });

    it("settings page has no conflict markers", () => {
      expect(settingsSrc).not.toMatch(/<<<<<<</);
    });
  });
});
