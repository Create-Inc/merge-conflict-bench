import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readResolved(relPath) {
  return readFileSync(join(__dirname, 'resolved', relPath), 'utf-8');
}

describe('club_invite_accept merge', () => {
  describe('base behaviors', () => {
    it('invitation route.js exports a GET handler', () => {
      const src = readResolved('apps/web/src/app/api/invitations/[token]/route.js');
      expect(src).toMatch(/export\s+async\s+function\s+GET/);
    });

    it('invitation route.js returns 404 when invitation not found', () => {
      const src = readResolved('apps/web/src/app/api/invitations/[token]/route.js');
      expect(src).toMatch(/Invitation not found/);
      expect(src).toMatch(/404/);
    });

    it('invitation route.js checks expiration', () => {
      const src = readResolved('apps/web/src/app/api/invitations/[token]/route.js');
      expect(src).toMatch(/expires_at/);
      expect(src).toMatch(/invitation has expired/);
    });

    it('invitation route.js distinguishes share links from email invites', () => {
      const src = readResolved('apps/web/src/app/api/invitations/[token]/route.js');
      expect(src).toMatch(/isShareLink/);
    });

    it('accept route.js exports a POST handler', () => {
      const src = readResolved('apps/web/src/app/api/invitations/[token]/accept/route.js');
      expect(src).toMatch(/export\s+async\s+function\s+POST/);
    });

    it('accept route.js requires authentication', () => {
      const src = readResolved('apps/web/src/app/api/invitations/[token]/accept/route.js');
      expect(src).toMatch(/Unauthorized/);
      expect(src).toMatch(/401/);
    });

    it('accept route.js checks for existing membership (409)', () => {
      const src = readResolved('apps/web/src/app/api/invitations/[token]/accept/route.js');
      expect(src).toMatch(/already a member/);
      expect(src).toMatch(/409/);
    });

    it('accept route.js marks email invitations as accepted but keeps share links reusable', () => {
      const src = readResolved('apps/web/src/app/api/invitations/[token]/accept/route.js');
      expect(src).toMatch(/!isShareLink/);
      expect(src).toMatch(/accepted/);
    });

    it('invite-link route.js uses COALESCE(email, \'\') = \'\' to handle both NULL and empty email for share links', () => {
      const src = readResolved('apps/web/src/app/api/clubs/[id]/invite-link/route.js');
      expect(src).toMatch(/COALESCE\(email,\s*''\)\s*=\s*''/);
    });

    it('invite-link route.js generates 30-day expiration for new links', () => {
      const src = readResolved('apps/web/src/app/api/clubs/[id]/invite-link/route.js');
      expect(src).toMatch(/30\s*\*\s*24\s*\*\s*60\s*\*\s*60\s*\*\s*1000/);
    });
  });

  describe('ours behaviors', () => {
    it('invitation route.js normalizes email with trim() for share-link detection', () => {
      const src = readResolved('apps/web/src/app/api/invitations/[token]/route.js');
      // ours approach: (invitation.email || "").trim(), checking emailValue.length === 0
      expect(src).toMatch(/email\s*\|\|\s*["']["']\)\.trim\(\)/);
    });

    it('accept route.js normalizes email with trim() for share-link detection', () => {
      const src = readResolved('apps/web/src/app/api/invitations/[token]/accept/route.js');
      expect(src).toMatch(/email\s*\|\|\s*["']["']\)\.trim\(\)/);
    });
  });

  describe('theirs behaviors', () => {
    it('accept route.js validates share-link invitation.status is still active', () => {
      const src = readResolved('apps/web/src/app/api/invitations/[token]/accept/route.js');
      expect(src).toMatch(/invite link is no longer active/);
    });

    it('accept route.js checks email invite status is pending (single-use)', () => {
      const src = readResolved('apps/web/src/app/api/invitations/[token]/accept/route.js');
      expect(src).toMatch(/invitation has already been used/);
      expect(src).toMatch(/pending/);
    });

    it('accept route.js verifies email mismatch returns 403', () => {
      const src = readResolved('apps/web/src/app/api/invitations/[token]/accept/route.js');
      expect(src).toMatch(/different email/);
      expect(src).toMatch(/403/);
    });

    it('invite-link revokes existing active links using COALESCE for schema compatibility', () => {
      const src = readResolved('apps/web/src/app/api/clubs/[id]/invite-link/route.js');
      // Should revoke with status = 'revoked' and use COALESCE
      expect(src).toMatch(/SET\s+status\s*=\s*'revoked'/);
      expect(src).toMatch(/COALESCE\(email,\s*''\)\s*=\s*''/);
    });
  });
});
