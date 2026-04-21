import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// ---------------------------------------------------------------------------
// Read the resolved source as text for structural pattern testing.
// (This is a React component with heavy browser/Jitsi dependencies, so we
// test observable code structure rather than trying to render.)
// ---------------------------------------------------------------------------
const resolvedPath = join(
  __dirname,
  "resolved",
  "apps",
  "web",
  "src",
  "components",
  "ProfilePage",
  "CampaignsTab",
  "CampaignCallPanel.jsx",
);

const src = readFileSync(resolvedPath, "utf8");

// ---------------------------------------------------------------------------
// Extract the normalizeDisplayName function body if present, and evaluate it
// so we can test its behavior directly.
// ---------------------------------------------------------------------------
let normalizeDisplayName = null;
{
  const fnMatch = src.match(
    /function\s+normalizeDisplayName\s*\([^)]*\)\s*\{([\s\S]*?)\n\}/,
  );
  if (fnMatch) {
    try {
      normalizeDisplayName = new Function(
        "name",
        fnMatch[1].replace(/return\s+/, "return "),
      );
    } catch {
      // If extraction fails, leave null — the test will verify presence structurally
    }
  }
}

// ---------------------------------------------------------------------------
// Extract the safeRoomName function for direct testing
// ---------------------------------------------------------------------------
let safeRoomName = null;
{
  const fnMatch = src.match(
    /function\s+safeRoomName\s*\([^)]*\)\s*\{([\s\S]*?)\n\}/,
  );
  if (fnMatch) {
    try {
      safeRoomName = new Function(
        "campaignId",
        "title",
        fnMatch[1],
      );
    } catch {
      // leave null
    }
  }
}

describe("CampaignCallPanel merge resolution", () => {
  // =========================================================================
  // BASE behaviors (present in both branches before divergence)
  // =========================================================================
  describe("base behaviors", () => {
    it("exports a default function component named CampaignCallPanel", () => {
      expect(src).toMatch(/export\s+default\s+function\s+CampaignCallPanel/);
    });

    it("accepts compact prop with default false", () => {
      expect(src).toMatch(/compact\s*=\s*false/);
    });

    it("accepts showRoster prop with default true", () => {
      expect(src).toMatch(/showRoster\s*=\s*true/);
    });

    it("accepts rosterMode prop with default 'full'", () => {
      expect(src).toMatch(/rosterMode\s*=\s*["']full["']/);
    });

    it("safeRoomName produces a slug from campaignId and title", () => {
      if (safeRoomName) {
        const result = safeRoomName("42", "My Cool Campaign!");
        expect(result).toMatch(/^anything-42-/);
        expect(result).toMatch(/my-cool-campaign/);
      } else {
        // Fallback: structural check
        expect(src).toMatch(/function\s+safeRoomName/);
        expect(src).toMatch(/anything-/);
      }
    });

    it("queries call presence via /api/campaigns/:id/call-presence", () => {
      expect(src).toMatch(/\/api\/campaigns\/.*\/call-presence/);
    });

    it("counts players and viewers from presence array by presence_role", () => {
      expect(src).toMatch(/presence_role.*===.*["']player["']/);
      expect(src).toMatch(/presence_role.*===.*["']viewer["']/);
    });

    it("computes isPlayerFull based on maxPlayers", () => {
      expect(src).toMatch(/isPlayerFull/);
      expect(src).toMatch(/playerCount\s*>=\s*maxPlayersNumber/);
    });

    it("displays speaking label when joined", () => {
      expect(src).toMatch(/speakingLabel/);
      expect(src).toMatch(/Speaking:/);
    });

    it("has join-as-player and join-as-viewer buttons", () => {
      expect(src).toMatch(/join\("player"\)/);
      expect(src).toMatch(/join\("viewer"\)/);
    });

    it("appends (Viewer) suffix to display name when joining as viewer", () => {
      expect(src).toMatch(/\(Viewer\)/);
    });

    it("starts viewers with audio and video muted", () => {
      expect(src).toMatch(/startWithAudioMuted:\s*viewerDefaults/);
      expect(src).toMatch(/startWithVideoMuted:\s*viewerDefaults/);
    });

    it("shows GM tools (toggle mic/cam, mute all, stop video, clear presence) for owner in full mode", () => {
      expect(src).toMatch(/GM tools/);
      expect(src).toMatch(/Toggle mic/);
      expect(src).toMatch(/Toggle cam/);
      expect(src).toMatch(/Mute all/);
      expect(src).toMatch(/Stop video/);
      expect(src).toMatch(/Clear presence/);
    });

    it("has shouldShowSpeakerCard derived from rosterMode === 'speaker_only'", () => {
      expect(src).toMatch(
        /shouldShowSpeakerCard\s*=\s*rosterMode\s*===\s*["']speaker_only["']/,
      );
    });

    it("renders the speaker card (Who is speaking) when rosterMode is speaker_only", () => {
      expect(src).toMatch(/Who.s speaking/);
    });

    it("renders the in-room roster list when shouldShowRosterList is true", () => {
      expect(src).toMatch(/shouldShowRosterList/);
      expect(src).toMatch(/In-room list/);
    });

    it("has a leave button that disposes the Jitsi API", () => {
      expect(src).toMatch(/apiRef\.current\.dispose/);
      expect(src).toMatch(/Leave/);
    });

    it("shows error message when player slots are full for non-owners", () => {
      expect(src).toMatch(/Player slots are full/);
    });

    it("no conflict markers remain in the source", () => {
      expect(src).not.toMatch(/<<<<<<</);
      expect(src).not.toMatch(/=======/);
      expect(src).not.toMatch(/>>>>>>>/);
    });
  });

  // =========================================================================
  // OURS behaviors (compact mode header changes)
  // =========================================================================
  describe("ours behaviors", () => {
    it("shows 'Call' as header text in compact mode, 'Voice + Video Room' otherwise", () => {
      // The compact mode should show "Call" and full mode "Voice + Video Room"
      expect(src).toMatch(/compact\s*\?\s*["']Call["']\s*:\s*["']Voice \+ Video Room["']/);
    });

    it("uses h-[180px] for compact iframe height (ours value, not theirs 160px)", () => {
      expect(src).toMatch(/h-\[180px\]/);
    });

    it("does NOT show player count / room name in compact header", () => {
      // There must be a condition that hides counts/room info in compact mode
      // Either showCountsInHeader = !compact or showFullHeader = !compact && ...
      const hasCompactHiding =
        /showCountsInHeader\s*=\s*!compact/.test(src) ||
        /showFullHeader.*!compact/.test(src) ||
        /showCompactHeader.*compact/.test(src);
      expect(hasCompactHiding).toBe(true);
    });

    it("shows viewer count in compact/sidebar mode when viewers exist", () => {
      // In compact mode, viewer count should still be shown
      expect(src).toMatch(/Viewers:/);
      expect(src).toMatch(/viewerCount/);
    });
  });

  // =========================================================================
  // THEIRS behaviors (speaker tracking, normalizeDisplayName)
  // =========================================================================
  describe("theirs behaviors", () => {
    it("has normalizeDisplayName function that strips (Viewer) suffix", () => {
      expect(src).toMatch(/normalizeDisplayName/);
      if (normalizeDisplayName) {
        expect(normalizeDisplayName("Alice (Viewer)")).toBe("Alice");
        expect(normalizeDisplayName("Bob")).toBe("Bob");
        expect(normalizeDisplayName(null)).toBe("");
        expect(normalizeDisplayName("")).toBe("");
      }
    });

    it("computes speakingPresence by matching normalised speakingName to presence list", () => {
      expect(src).toMatch(/speakingPresence/);
      expect(src).toMatch(/useMemo/);
      // The lookup matches display_name from presence
      expect(src).toMatch(/display_name/);
    });

    it("speaker card shows avatar when speakingPresence has avatar_url", () => {
      expect(src).toMatch(/speakingPresence\.avatar_url/);
      expect(src).toMatch(/speakingPresence\.display_name/);
    });

    it("speaker card shows viewer count when viewers exist", () => {
      // Inside the speaker card, viewer count line
      expect(src).toMatch(/Viewers:\s*\{viewerCount\}/);
    });

    it("speaker card fallback shows 'No one yet.' when no one is speaking", () => {
      expect(src).toMatch(/No one yet\./);
    });

    it("shouldShowRosterList requires rosterMode === 'full' AND !compact AND showRoster", () => {
      expect(src).toMatch(
        /shouldShowRosterList\s*=\s*showRoster\s*&&\s*!compact\s*&&\s*rosterMode\s*===\s*["']full["']/,
      );
    });

    it("room name is only shown when in full roster mode (not compact)", () => {
      // The room name display is gated by the full header condition
      const showsRoomConditionally =
        /showFullHeader/.test(src) ||
        /!compact\s*&&\s*rosterMode\s*===\s*["']full["']/.test(src);
      expect(showsRoomConditionally).toBe(true);
    });

    it("countsLine includes player/max and optional viewer count with bullet separator", () => {
      // Either uses a countsLine variable or inline equivalent
      const hasCountsFormat =
        /countsLine/.test(src) ||
        (/playerCount/.test(src) && /maxLabel/.test(src) && /Viewers/.test(src));
      expect(hasCountsFormat).toBe(true);
    });
  });
});
