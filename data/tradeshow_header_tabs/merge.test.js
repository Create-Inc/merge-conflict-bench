import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const pricingSrc = readFileSync(
  join(__dirname, "resolved/apps/web/src/app/pricing/page.jsx"),
  "utf8",
);

const mainHeaderSrc = readFileSync(
  join(
    __dirname,
    "resolved/apps/web/src/components/Tradeshow/MainHeader.jsx",
  ),
  "utf8",
);

const tabsSrc = readFileSync(
  join(__dirname, "resolved/apps/web/src/utils/tradeShowTabs.js"),
  "utf8",
);

// =====================================================================
// BASE BEHAVIORS (shared by both branches before divergence)
// =====================================================================
describe("base behaviors", () => {
  describe("tradeShowTabs.js - tab configuration", () => {
    it("exports a tradeShowTabs array", () => {
      expect(tabsSrc).toMatch(/export\s+const\s+tradeShowTabs/);
    });

    it("includes overview, tasks, leads, travel, schedule tabs", () => {
      expect(tabsSrc).toMatch(/key:\s*["']overview["']/);
      expect(tabsSrc).toMatch(/key:\s*["']tasks["']/);
      expect(tabsSrc).toMatch(/key:\s*["']leads["']/);
      expect(tabsSrc).toMatch(/key:\s*["']travel["']/);
      expect(tabsSrc).toMatch(/key:\s*["']schedule["']/);
    });

    it("includes inventory, shipping, budget, team, vendors tabs", () => {
      expect(tabsSrc).toMatch(/key:\s*["']inventory["']/);
      expect(tabsSrc).toMatch(/key:\s*["']shipping["']/);
      expect(tabsSrc).toMatch(/key:\s*["']budget["']/);
      expect(tabsSrc).toMatch(/key:\s*["']team["']/);
      expect(tabsSrc).toMatch(/key:\s*["']vendors["']/);
    });

    it("includes roi, reports, ai-concierge, and chat tabs", () => {
      expect(tabsSrc).toMatch(/key:\s*["']roi["']/);
      expect(tabsSrc).toMatch(/key:\s*["']reports["']/);
      expect(tabsSrc).toMatch(/key:\s*["']ai-concierge["']/);
      expect(tabsSrc).toMatch(/key:\s*["']chat["']/);
    });

    it("uses Sparkles icon for ai-concierge tab", () => {
      expect(tabsSrc).toMatch(/Sparkles/);
    });
  });

  describe("pricing/page.jsx - pricing page structure", () => {
    it("has use client directive", () => {
      expect(pricingSrc).toMatch(/["']use client["']/);
    });

    it("exports a default PricingPage function", () => {
      expect(pricingSrc).toMatch(
        /export\s+default\s+function\s+PricingPage/,
      );
    });

    it("renders All-access plan at $99/month", () => {
      expect(pricingSrc).toMatch(/\$99/);
      expect(pricingSrc).toMatch(/month/);
    });

    it("renders All-access Annual plan at $999/year", () => {
      expect(pricingSrc).toMatch(/\$999/);
      expect(pricingSrc).toMatch(/year/);
    });

    it("renders Concierge add-on at $299/month", () => {
      expect(pricingSrc).toMatch(/\$299/);
      expect(pricingSrc).toMatch(/Concierge add-on/);
    });

    it("includes 7-day trial messaging", () => {
      expect(pricingSrc).toMatch(/7-day|7 day/i);
    });

    it("mentions no credit card required", () => {
      expect(pricingSrc).toMatch(/No credit card/i);
    });
  });

  describe("MainHeader.jsx - header structure", () => {
    it("exports a MainHeader function component", () => {
      expect(mainHeaderSrc).toMatch(/export\s+function\s+MainHeader/);
    });

    it("uses useBillingStatus hook", () => {
      expect(mainHeaderSrc).toMatch(/useBillingStatus/);
    });

    it("shows billing chip when plan selection is needed", () => {
      expect(mainHeaderSrc).toMatch(/needsPlanSelection/);
      expect(mainHeaderSrc).toMatch(/Choose a plan to continue/);
    });

    it("shows trial chip when trial has 3 or fewer days left", () => {
      expect(mainHeaderSrc).toMatch(/trialDaysLeft\s*<=\s*3/);
    });

    it("includes user avatar and dropdown menu", () => {
      expect(mainHeaderSrc).toMatch(/Avatar/);
      expect(mainHeaderSrc).toMatch(/menuOpen/);
    });

    it("includes ThemeToggle and NotificationBell", () => {
      expect(mainHeaderSrc).toMatch(/ThemeToggle/);
      expect(mainHeaderSrc).toMatch(/NotificationBell/);
    });
  });
});

// =====================================================================
// OURS BEHAVIORS (concierge as premium add-on, label clarity)
// =====================================================================
describe("ours behaviors", () => {
  describe("tradeShowTabs.js - concierge label is 'Concierge' (not 'Travel Concierge')", () => {
    it("uses 'Concierge' as the label for ai-concierge tab", () => {
      // Match the label specifically for the ai-concierge entry
      const conciergeMatch = tabsSrc.match(
        /key:\s*["']ai-concierge["'][^}]*label:\s*["']([^"']+)["']/s,
      );
      expect(conciergeMatch).not.toBeNull();
      expect(conciergeMatch[1]).toBe("Concierge");
    });
  });

  describe("tradeShowTabs.js - concierge is marked as addon", () => {
    it("includes addon property on the ai-concierge tab", () => {
      expect(tabsSrc).toMatch(/addon:\s*["']concierge["']/);
    });
  });

  describe("MainHeader.jsx - trial chip text mentions All-access", () => {
    it("trial chip text includes 'All-access trial' prefix", () => {
      expect(mainHeaderSrc).toMatch(/All-access trial/);
    });
  });

  describe("pricing/page.jsx - concierge note mentions trial exclusion", () => {
    it("concierge add-on note mentions not included in trial", () => {
      expect(pricingSrc).toMatch(/[Nn]ot included in trial/);
    });
  });
});

// =====================================================================
// THEIRS BEHAVIORS (white-glove description)
// =====================================================================
describe("theirs behaviors", () => {
  describe("pricing/page.jsx - concierge description includes white-glove", () => {
    it("concierge card note mentions white-glove support", () => {
      expect(pricingSrc).toMatch(/[Ww]hite-glove/i);
    });
  });
});
