import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function read(relPath) {
  return readFileSync(join(__dirname, 'resolved', relPath), 'utf-8');
}

describe('mobile_chat_profile', () => {
  describe('base behaviors (preserved from both sides)', () => {
    it('_layout.jsx: AuthModal is rendered after the Stack', () => {
      const src = read('apps/mobile/src/app/_layout.jsx');
      expect(src).toMatch(/AuthModal/);
      // AuthModal should appear after Stack closing tag
      const stackClose = src.indexOf('</Stack>');
      const authModal = src.indexOf('<AuthModal');
      expect(stackClose).toBeGreaterThan(-1);
      expect(authModal).toBeGreaterThan(stackClose);
    });

    it('_layout.jsx: no global chat button — live chat is profile-only', () => {
      const src = read('apps/mobile/src/app/_layout.jsx');
      // Should NOT contain a chat button/FAB in the layout
      expect(src).not.toMatch(/ChatButton|FloatingChat|liveChatButton/i);
      // Should have a comment about no global chat
      expect(src).toMatch(/chat.*profile|profile.*chat/i);
    });

    it('profile.jsx: contains live chat support ProfileActionButton', () => {
      const src = read('apps/mobile/src/app/(tabs)/profile.jsx');
      expect(src).toMatch(/MessageCircle/);
      expect(src).toMatch(/liveSupport|Live support/);
      expect(src).toMatch(/setShowLiveChat\(true\)/);
    });

    it('profile.jsx: contains ProfileModals with showLiveChat', () => {
      const src = read('apps/mobile/src/app/(tabs)/profile.jsx');
      expect(src).toMatch(/ProfileModals/);
      expect(src).toMatch(/showLiveChat/);
      expect(src).toMatch(/onCloseLiveChat/);
    });

    it('profile.jsx: contains FamilyChildrenCard and AddChildModal', () => {
      const src = read('apps/mobile/src/app/(tabs)/profile.jsx');
      expect(src).toMatch(/FamilyChildrenCard/);
      expect(src).toMatch(/AddChildModal/);
      expect(src).toMatch(/handleChildAdded/);
    });

    it('profile.jsx: fetches children from /api/family/children', () => {
      const src = read('apps/mobile/src/app/(tabs)/profile.jsx');
      expect(src).toMatch(/\/api\/family\/children/);
    });

    it('groupChat: polls for new messages every 4 seconds', () => {
      const src = read('apps/mobile/src/app/group-chat/[groupId].jsx');
      expect(src).toMatch(/setInterval/);
      expect(src).toMatch(/4000/);
    });

    it('groupChat: has video call and audio call buttons', () => {
      const src = read('apps/mobile/src/app/group-chat/[groupId].jsx');
      expect(src).toMatch(/startVideoCall/);
      expect(src).toMatch(/startAudioCall/);
      expect(src).toMatch(/group-video/);
    });

    it('groupChat: sends messages via /api/chat/messages POST', () => {
      const src = read('apps/mobile/src/app/group-chat/[groupId].jsx');
      expect(src).toMatch(/\/api\/chat\/messages/);
      expect(src).toMatch(/method:\s*["']POST["']/);
    });

    it('groupChat: has GroupModerationModal with leave/delete', () => {
      const src = read('apps/mobile/src/app/group-chat/[groupId].jsx');
      expect(src).toMatch(/GroupModerationModal/);
      expect(src).toMatch(/handleLeaveGroup/);
      expect(src).toMatch(/handleDeleteGroup/);
    });

    it('HelpSupportSection: has FAQ, report problem, and live chat items', () => {
      const src = read('apps/mobile/src/components/settings/HelpSupportSection.jsx');
      expect(src).toMatch(/frequentlyAskedQuestions/);
      expect(src).toMatch(/reportProblem/);
      expect(src).toMatch(/liveChatSupport/);
    });
  });

  describe('theirs behaviors (redirect-with-UI approach for chat tab)', () => {
    it('chat.jsx: uses router.replace to redirect to profile with openLiveChat param', () => {
      const src = read('apps/mobile/src/app/(tabs)/chat.jsx');
      expect(src).toMatch(/router\.replace/);
      expect(src).toMatch(/openLiveChat=1/);
    });

    it('chat.jsx: shows a transitional UI with translated text while redirecting', () => {
      const src = read('apps/mobile/src/app/(tabs)/chat.jsx');
      expect(src).toMatch(/openingLiveChat/);
      expect(src).toMatch(/liveChatMovedToProfile/);
      // Uses theme colors
      expect(src).toMatch(/colors\.background/);
      expect(src).toMatch(/colors\.text/);
    });

    it('chat.jsx: imports useTheme and useLanguage for the redirect UI', () => {
      const src = read('apps/mobile/src/app/(tabs)/chat.jsx');
      expect(src).toMatch(/useTheme/);
      expect(src).toMatch(/useLanguage/);
    });

    it('chat.jsx: does NOT use Redirect component (uses router.replace instead)', () => {
      const src = read('apps/mobile/src/app/(tabs)/chat.jsx');
      expect(src).not.toMatch(/<Redirect\b/);
    });

    it('HelpSupportSection: navigates to profile with openLiveChat=1', () => {
      const src = read('apps/mobile/src/components/settings/HelpSupportSection.jsx');
      expect(src).toMatch(/openLiveChat=1/);
    });
  });

  describe('ours behaviors (guard against re-opening chat from param)', () => {
    it('profile.jsx: uses a ref to prevent re-opening live chat on re-render', () => {
      const src = read('apps/mobile/src/app/(tabs)/profile.jsx');
      // Should have a guard pattern (ref-based or equivalent) to prevent re-opening
      expect(src).toMatch(/openedFromParamRef|useRef/);
    });

    it('profile.jsx: reads openLiveChat query param to auto-open live chat', () => {
      const src = read('apps/mobile/src/app/(tabs)/profile.jsx');
      expect(src).toMatch(/openLiveChat/);
      expect(src).toMatch(/setShowLiveChat\(true\)/);
    });
  });

  describe('theirs behaviors (locale map for time formatting in group chat)', () => {
    it('groupChat: has a locale map supporting multiple languages', () => {
      const src = read('apps/mobile/src/app/group-chat/[groupId].jsx');
      // The resolved version should use theirs locale map approach
      expect(src).toMatch(/nb.*nb-NO/);
      expect(src).toMatch(/sv.*sv-SE|sv-SE/);
      expect(src).toMatch(/de.*de-DE|de-DE/);
    });

    it('groupChat: formatTime uses the locale variable', () => {
      const src = read('apps/mobile/src/app/group-chat/[groupId].jsx');
      expect(src).toMatch(/formatTime/);
      expect(src).toMatch(/toLocaleTimeString/);
    });
  });
});
