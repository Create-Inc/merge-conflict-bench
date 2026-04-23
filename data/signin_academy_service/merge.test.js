import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readResolved(relPath) {
  return readFileSync(join(__dirname, 'resolved', relPath), 'utf8');
}

describe('signin_academy_service', () => {
  describe('base behaviors', () => {
    it('signin page is a client component', () => {
      const src = readResolved('apps/web/src/app/account/signin/page.jsx');
      expect(src.trimStart().startsWith('"use client"')).toBe(true);
    });

    it('signin page imports useAuth', () => {
      const src = readResolved('apps/web/src/app/account/signin/page.jsx');
      expect(src).toMatch(/useAuth/);
    });

    it('signin page has email and password inputs', () => {
      const src = readResolved('apps/web/src/app/account/signin/page.jsx');
      expect(src).toMatch(/type=["']email["']/);
      expect(src).toMatch(/type=["']password["']/);
    });

    it('signin page calls signInWithCredentials on submit', () => {
      const src = readResolved('apps/web/src/app/account/signin/page.jsx');
      expect(src).toMatch(/signInWithCredentials/);
    });

    it('lyf-academy page is a client component', () => {
      const src = readResolved('apps/web/src/app/services/lyf-academy/page.jsx');
      expect(src.trimStart().startsWith('"use client"')).toBe(true);
    });

    it('lyf-academy page has enrollment form with required fields', () => {
      const src = readResolved('apps/web/src/app/services/lyf-academy/page.jsx');
      expect(src).toMatch(/parentName/);
      expect(src).toMatch(/parentEmail/);
      expect(src).toMatch(/athleteName/);
      expect(src).toMatch(/athleteGradYear/);
    });

    it('lyf-academy page POSTs to /api/services/lyf-academy/enroll', () => {
      const src = readResolved('apps/web/src/app/services/lyf-academy/page.jsx');
      expect(src).toMatch(/\/api\/services\/lyf-academy\/enroll/);
    });

    it('lyf-academy page redirects to Stripe checkout', () => {
      const src = readResolved('apps/web/src/app/services/lyf-academy/page.jsx');
      expect(src).toMatch(/\/api\/parent\/stripe\/checkout/);
    });
  });

  describe('ours behaviors', () => {
    it('signin page reads callbackUrl from URL and only allows paths starting with /', () => {
      const src = readResolved('apps/web/src/app/account/signin/page.jsx');
      expect(src).toMatch(/callbackUrl/);
      expect(src).toMatch(/startsWith\s*\(\s*["']\/["']\s*\)/);
    });

    it('signin page has isStaffFlow detection based on /staff prefix', () => {
      const src = readResolved('apps/web/src/app/account/signin/page.jsx');
      expect(src).toMatch(/isStaffFlow|isStaffSignin/);
      expect(src).toMatch(/\/staff/);
    });

    it('signin page shows invite-only note for staff flow', () => {
      const src = readResolved('apps/web/src/app/account/signin/page.jsx');
      expect(src).toMatch(/invite-only/i);
    });

    it('signin page hides signup CTA for staff flow', () => {
      const src = readResolved('apps/web/src/app/account/signin/page.jsx');
      // When isStaffFlow, sign-up link should not be shown
      expect(src).toMatch(/!isStaffFlow|!isStaffSignin/);
      expect(src).toMatch(/Sign up/);
    });

    it('signin page passes callbackUrl to signUpHref', () => {
      const src = readResolved('apps/web/src/app/account/signin/page.jsx');
      expect(src).toMatch(/signUpHref/);
      expect(src).toMatch(/callbackUrl/);
    });

    it('lyf-academy page has the title LYF Academy', () => {
      const src = readResolved('apps/web/src/app/services/lyf-academy/page.jsx');
      expect(src).toMatch(/LYF Academy/);
    });

    it('lyf-academy page has "Leading Youth Forward" acronym explanation', () => {
      const src = readResolved('apps/web/src/app/services/lyf-academy/page.jsx');
      // The acronym L-Y-F is expanded with bold letters: L(eading) Y(outh) F(orward)
      expect(src).toMatch(/L<\/strong>eading/);
      expect(src).toMatch(/Y<\/strong>outh/);
      expect(src).toMatch(/F<\/strong>orward/);
    });

    it('signin page shows "Back to portal" link in staff flow', () => {
      const src = readResolved('apps/web/src/app/account/signin/page.jsx');
      expect(src).toMatch(/Back to portal/);
    });
  });

  describe('theirs behaviors', () => {
    it('signin page uses gradient background from-[#cc0000] via-[#b30000] to-black', () => {
      const src = readResolved('apps/web/src/app/account/signin/page.jsx');
      expect(src).toMatch(/from-\[#cc0000\]/);
      expect(src).toMatch(/to-black/);
    });

    it('lyf-academy page describes the program supports 5 key areas', () => {
      const src = readResolved('apps/web/src/app/services/lyf-academy/page.jsx');
      expect(src).toMatch(/Academic readiness/);
      expect(src).toMatch(/Athletic development/);
      expect(src).toMatch(/Family education/);
      expect(src).toMatch(/Accountability and guidance/);
      expect(src).toMatch(/Long-term planning/);
    });

    it('lyf-academy page includes Monthly Coaching Sessions and Life Skills Curriculum sections', () => {
      const src = readResolved('apps/web/src/app/services/lyf-academy/page.jsx');
      expect(src).toMatch(/Monthly Coaching Sessions/);
      expect(src).toMatch(/Life Skills Curriculum/);
    });

    it('lyf-academy page includes Recruiting Education section', () => {
      const src = readResolved('apps/web/src/app/services/lyf-academy/page.jsx');
      expect(src).toMatch(/Recruiting Education/);
    });

    it('lyf-academy page shows $400/month pricing', () => {
      const src = readResolved('apps/web/src/app/services/lyf-academy/page.jsx');
      expect(src).toMatch(/\$400\/month/);
    });

    it('lyf-academy page mentions 12-month commitment', () => {
      const src = readResolved('apps/web/src/app/services/lyf-academy/page.jsx');
      expect(src).toMatch(/12-month/);
    });
  });
});
