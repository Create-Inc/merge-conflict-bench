import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readResolved(relPath) {
  return readFileSync(join(__dirname, 'resolved', relPath), 'utf-8');
}

describe('group_chat_video merge', () => {
  describe('base behaviors', () => {
    it('group-video screen renders WebView with Jitsi meet URL', () => {
      const src = readResolved('apps/mobile/src/app/group-video/[groupId].jsx');
      expect(src).toMatch(/meet\.jit\.si/);
      expect(src).toMatch(/<WebView/);
    });

    it('group-video screen sanitizes room name', () => {
      const src = readResolved('apps/mobile/src/app/group-video/[groupId].jsx');
      expect(src).toMatch(/sanitizeRoomName/);
    });

    it('group-video screen supports audio-only mode via query param', () => {
      const src = readResolved('apps/mobile/src/app/group-video/[groupId].jsx');
      expect(src).toMatch(/isAudioOnly/);
      expect(src).toMatch(/startWithVideoMuted/);
    });

    it('group-video screen has external link button to open in browser', () => {
      const src = readResolved('apps/mobile/src/app/group-video/[groupId].jsx');
      expect(src).toMatch(/openExternal/);
      expect(src).toMatch(/Linking\.openURL/);
    });

    it('group-chat screen has video call and audio call buttons', () => {
      const src = readResolved('apps/mobile/src/app/group-chat/[groupId].jsx');
      expect(src).toMatch(/startVideoCall/);
      expect(src).toMatch(/startAudioCall/);
    });

    it('group-chat screen handles sending messages', () => {
      const src = readResolved('apps/mobile/src/app/group-chat/[groupId].jsx');
      expect(src).toMatch(/handleSendMessage/);
    });
  });

  describe('ours behaviors', () => {
    it('group-video screen shows Expo Go warning with theirs variable name', () => {
      const src = readResolved('apps/mobile/src/app/group-video/[groupId].jsx');
      // Both sides had a warning for Expo Go; theirs used "expoGoWarningText"
      expect(src).toMatch(/expoGoWarningText|expoGoHint/);
    });

    it('group-video screen sets WebView error from onHttpError', () => {
      const src = readResolved('apps/mobile/src/app/group-video/[groupId].jsx');
      expect(src).toMatch(/onHttpError/);
      expect(src).toMatch(/setWebViewError/);
    });

    it('group-video screen has javaScriptEnabled and domStorageEnabled', () => {
      const src = readResolved('apps/mobile/src/app/group-video/[groupId].jsx');
      expect(src).toMatch(/javaScriptEnabled/);
      expect(src).toMatch(/domStorageEnabled/);
    });

    it('group-video screen has originWhitelist', () => {
      const src = readResolved('apps/mobile/src/app/group-video/[groupId].jsx');
      expect(src).toMatch(/originWhitelist/);
    });
  });

  describe('theirs behaviors', () => {
    it('group-chat startVideoCall navigates to group-video with audio=0', () => {
      const src = readResolved('apps/mobile/src/app/group-chat/[groupId].jsx');
      expect(src).toMatch(/audio=0/);
    });

    it('group-chat startAudioCall navigates to group-video with audio=1', () => {
      const src = readResolved('apps/mobile/src/app/group-chat/[groupId].jsx');
      expect(src).toMatch(/audio=1/);
    });

    it('group-chat always navigates to group-video screen (no Expo Go conditional)', () => {
      const src = readResolved('apps/mobile/src/app/group-chat/[groupId].jsx');
      // Theirs removed the isExpoGo conditional; always uses router.push to group-video
      expect(src).toMatch(/router\.push\s*\(\s*`\/group-video\//);
    });

    it('group-chat startVideoCall and startAudioCall have [groupId] as dependency', () => {
      const src = readResolved('apps/mobile/src/app/group-chat/[groupId].jsx');
      // Both callbacks should depend on groupId
      const videoCallBlock = src.match(/startVideoCall\s*=\s*useCallback\s*\([\s\S]*?\[\s*groupId\s*\]\s*\)/);
      expect(videoCallBlock).not.toBeNull();
      const audioCallBlock = src.match(/startAudioCall\s*=\s*useCallback\s*\([\s\S]*?\[\s*groupId\s*\]\s*\)/);
      expect(audioCallBlock).not.toBeNull();
    });

    it('group-video screen uses description from httpError event in error message', () => {
      const src = readResolved('apps/mobile/src/app/group-video/[groupId].jsx');
      // Theirs included event description in error: event?.nativeEvent?.description
      expect(src).toMatch(/nativeEvent\?\.description/);
    });

    it('group-video Expo Go warning uses yellow/amber background color', () => {
      const src = readResolved('apps/mobile/src/app/group-video/[groupId].jsx');
      // Theirs used "#FFFBEB" (amber background) for Expo Go warning
      expect(src).toMatch(/#FFFBEB/);
    });
  });
});
