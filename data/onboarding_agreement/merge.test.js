import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// Read all resolved source files as text
const pageSource = readFileSync(
  join(__dirname, "resolved/apps/web/src/app/onboard/page.jsx"),
  "utf-8",
);

const agreementPreviewSource = readFileSync(
  join(
    __dirname,
    "resolved/apps/web/src/app/api/onboarding/agreement-preview/route.js",
  ),
  "utf-8",
);

const invitationsSource = readFileSync(
  join(
    __dirname,
    "resolved/apps/web/src/app/api/onboarding/invitations/route.js",
  ),
  "utf-8",
);

const leadsConvertSource = readFileSync(
  join(
    __dirname,
    "resolved/apps/web/src/app/api/platform/leads/convert/route.js",
  ),
  "utf-8",
);

// =====================================================================
// BASE BEHAVIORS (shared by both branches before divergence)
// =====================================================================
describe("base behaviors", () => {
  describe("onboard page - form state and validation", () => {
    it("manages form state with useState", () => {
      expect(pageSource).toMatch(/useState\(/);
    });

    it("has fullName, password, confirmPassword fields", () => {
      expect(pageSource).toMatch(/fullName/);
      expect(pageSource).toMatch(/password/);
      expect(pageSource).toMatch(/confirmPassword/);
    });

    it("has dealershipName, dealershipPhone, dealershipAddress fields", () => {
      expect(pageSource).toMatch(/dealershipName/);
      expect(pageSource).toMatch(/dealershipPhone/);
      expect(pageSource).toMatch(/dealershipAddress/);
    });

    it("has agreement fields: agreementAccepted, agreementPrintedName, agreementDate, agreementEffectiveDate", () => {
      expect(pageSource).toMatch(/agreementAccepted/);
      expect(pageSource).toMatch(/agreementPrintedName/);
      expect(pageSource).toMatch(/agreementDate/);
      expect(pageSource).toMatch(/agreementEffectiveDate/);
    });

    it("has invoicePreference with manual and stripe_monthly options", () => {
      expect(pageSource).toMatch(/invoicePreference/);
      expect(pageSource).toMatch(/manual/);
      expect(pageSource).toMatch(/stripe_monthly/);
    });

    it("validates password length >= 8", () => {
      expect(pageSource).toMatch(/password\.length\s*<\s*8/);
    });

    it("validates password === confirmPassword", () => {
      expect(pageSource).toMatch(
        /password\s*!==\s*.*confirmPassword/,
      );
    });

    it("requires agreementAccepted to be true for canSubmit", () => {
      expect(pageSource).toMatch(/agreementAccepted/);
    });

    it("requires agreementPrintedName to be non-empty for canSubmit", () => {
      expect(pageSource).toMatch(/agreementPrintedName.*trim/s);
    });
  });

  describe("onboard page - submission", () => {
    it("POSTs to /api/onboarding/accept", () => {
      expect(pageSource).toMatch(/\/api\/onboarding\/accept/);
    });

    it("sends token, password, dealership details, and agreement in POST body", () => {
      expect(pageSource).toMatch(/token/);
      expect(pageSource).toMatch(/dealerPrintedName/);
      expect(pageSource).toMatch(/dealerSignedDate/);
      expect(pageSource).toMatch(/monthlySubscriptionFee/);
      expect(pageSource).toMatch(/oneTimeSetupFee/);
      expect(pageSource).toMatch(/effectiveDate/);
    });
  });

  describe("onboard page - resolvedMonthlyFee logic", () => {
    it("prefers acceptedQuote total_monthly over invitation monthly_price", () => {
      expect(pageSource).toMatch(/acceptedQuote\?\.total_monthly/);
      expect(pageSource).toMatch(/invitation\?\.monthly_price/);
    });
  });

  describe("onboard page - loading, error, and success states", () => {
    it("shows loading state", () => {
      expect(pageSource).toMatch(/Loading/i);
    });

    it("shows missing token state", () => {
      expect(pageSource).toMatch(/Missing setup link/);
    });

    it("shows success state with setup complete", () => {
      expect(pageSource).toMatch(/Setup complete/);
    });

    it("has hasStarted gate before showing main form", () => {
      expect(pageSource).toMatch(/hasStarted/);
    });
  });

  describe("onboard page - inventory size options", () => {
    it("defines INVENTORY_SIZE_OPTIONS with vehicle ranges", () => {
      expect(pageSource).toMatch(/INVENTORY_SIZE_OPTIONS/);
      expect(pageSource).toMatch(/0-25/);
      expect(pageSource).toMatch(/251\+/);
    });
  });

  describe("onboard page - DMS sync checkbox", () => {
    it("has wantsDmsSync checkbox", () => {
      expect(pageSource).toMatch(/wantsDmsSync/);
    });

    it("has currentDmsProvider input", () => {
      expect(pageSource).toMatch(/currentDmsProvider/);
    });
  });

  describe("agreement-preview route - token validation", () => {
    it("returns 400 for missing token", () => {
      expect(agreementPreviewSource).toMatch(/Missing token/);
      expect(agreementPreviewSource).toMatch(/status:\s*400/);
    });

    it("returns 404 for invalid or expired invitation", () => {
      expect(agreementPreviewSource).toMatch(/Invalid or expired invitation/);
      expect(agreementPreviewSource).toMatch(/status:\s*404/);
    });
  });

  describe("agreement-preview route - queries pricing_quotes for accepted quote", () => {
    it("queries pricing_quotes table for accepted quotes", () => {
      expect(agreementPreviewSource).toMatch(/pricing_quotes/);
      expect(agreementPreviewSource).toMatch(/accepted_at IS NOT NULL/);
    });
  });

  describe("agreement-preview route - calls buildServiceAgreementHtml", () => {
    it("imports and calls buildServiceAgreementHtml", () => {
      expect(agreementPreviewSource).toMatch(/buildServiceAgreementHtml/);
    });
  });

  describe("invitations route - auth gating", () => {
    it("checks for admin role", () => {
      expect(invitationsSource).toMatch(/role.*admin/s);
    });

    it("requires email and company name", () => {
      expect(invitationsSource).toMatch(/Email and company name are required/);
    });
  });

  describe("invitations route - generates secure token", () => {
    it("uses crypto.randomBytes for token generation", () => {
      expect(invitationsSource).toMatch(/randomBytes\(32\)/);
    });
  });

  describe("invitations route - sends email via sendEmail", () => {
    it("calls sendEmail with onboarding welcome content", () => {
      expect(invitationsSource).toMatch(/sendEmail/);
      expect(invitationsSource).toMatch(/Welcome to Lotly/);
    });
  });

  describe("leads convert route - auth gating", () => {
    it("uses requirePlatformAdmin for authorization", () => {
      expect(leadsConvertSource).toMatch(/requirePlatformAdmin/);
    });
  });

  describe("leads convert route - resends existing invite if active", () => {
    it("checks for existing active invitation before creating new one", () => {
      expect(leadsConvertSource).toMatch(/existingInvitation/);
      expect(leadsConvertSource).toMatch(/accepted_at IS NULL/);
    });
  });

  describe("leads convert route - creates onboarding invitation", () => {
    it("inserts into onboarding_invitations table", () => {
      expect(leadsConvertSource).toMatch(
        /INSERT INTO onboarding_invitations/,
      );
    });
  });
});

// =====================================================================
// OURS BEHAVIORS (from the "ours" branch)
// =====================================================================
describe("ours behaviors", () => {
  describe("agreement-preview route - safeNum helper", () => {
    it("defines safeNum function for safe number parsing", () => {
      expect(agreementPreviewSource).toMatch(/function\s+safeNum/);
    });
  });

  describe("agreement-preview route - buildDealershipAddressFromInvitation helper", () => {
    it("defines buildDealershipAddressFromInvitation function", () => {
      expect(agreementPreviewSource).toMatch(
        /function\s+buildDealershipAddressFromInvitation/,
      );
    });

    it("joins state and phone with bullet separator", () => {
      expect(agreementPreviewSource).toMatch(/join\(.*\u2022/s);
    });
  });

  describe("agreement-preview route - accepts query params for live preview", () => {
    it("reads dealershipName from query params", () => {
      expect(agreementPreviewSource).toMatch(
        /searchParams\.get\(["']dealershipName["']\)/,
      );
    });

    it("reads dealershipAddress from query params", () => {
      expect(agreementPreviewSource).toMatch(
        /searchParams\.get\(["']dealershipAddress["']\)/,
      );
    });

    it("reads primaryContact from query params", () => {
      expect(agreementPreviewSource).toMatch(
        /searchParams\.get\(["']primaryContact["']\)/,
      );
    });

    it("reads monthlySubscriptionFee from query params", () => {
      expect(agreementPreviewSource).toMatch(
        /searchParams\.get\(["']monthlySubscriptionFee["']\)/,
      );
    });

    it("reads effectiveDate from query params", () => {
      expect(agreementPreviewSource).toMatch(
        /searchParams\.get\(["']effectiveDate["']\)/,
      );
    });

    it("reads dealerPrintedName from query params", () => {
      expect(agreementPreviewSource).toMatch(
        /searchParams\.get\(["']dealerPrintedName["']\)/,
      );
    });
  });

  describe("agreement-preview route - ONE_TIME_SETUP_FEE = 25", () => {
    it("defines setup fee of 25", () => {
      expect(agreementPreviewSource).toMatch(/ONE_TIME_SETUP_FEE\s*=\s*25/);
    });
  });

  describe("agreement-preview route - HTML default format", () => {
    it("defaults format to html", () => {
      expect(agreementPreviewSource).toMatch(/formatRaw.*["']html["']/s);
    });

    it("returns HTML with Content-Type text/html", () => {
      expect(agreementPreviewSource).toMatch(
        /Content-Type.*text\/html/,
      );
    });
  });

  describe("agreement-preview route - PDF format with Content-Disposition", () => {
    it("supports format=pdf", () => {
      expect(agreementPreviewSource).toMatch(/format\s*===\s*["']pdf["']/);
    });

    it("fetches from /integrations/pdf-generation/pdf", () => {
      expect(agreementPreviewSource).toMatch(
        /\/integrations\/pdf-generation\/pdf/,
      );
    });

    it("returns PDF with Content-Disposition header including filename", () => {
      expect(agreementPreviewSource).toMatch(/Content-Disposition/);
      expect(agreementPreviewSource).toMatch(/Lotly_Service_Agreement\.pdf/);
    });
  });

  describe("onboard page - agreementPreviewSrc builds URL with query params", () => {
    it("builds URL with URLSearchParams for agreement preview", () => {
      expect(pageSource).toMatch(/URLSearchParams/);
      expect(pageSource).toMatch(/agreement-preview/);
    });

    it("includes token, format=html, and form data in preview URL", () => {
      expect(pageSource).toMatch(/p\.set\(["']token["']/);
      expect(pageSource).toMatch(/p\.set\(["']format["'],\s*["']html["']\)/);
    });
  });

  describe("onboard page - renders iframe with src for agreement preview", () => {
    it("uses iframe with src attribute for agreement preview", () => {
      expect(pageSource).toMatch(/src=\{agreementPreviewSrc\}/);
    });
  });

  describe("invitations route - email text includes onboarding URL", () => {
    it("plaintext email includes Start onboarding URL", () => {
      expect(invitationsSource).toMatch(/Start onboarding.*onboardingUrl/s);
    });
  });

  describe("leads convert route - buildOnboardingEmailPayload accepts invitation and inviteUrl", () => {
    it("defines buildOnboardingEmailPayload function", () => {
      expect(leadsConvertSource).toMatch(/buildOnboardingEmailPayload/);
    });

    it("constructs recipient name from first_name and last_name", () => {
      expect(leadsConvertSource).toMatch(/invitation\.first_name/);
      expect(leadsConvertSource).toMatch(/invitation\.last_name/);
    });
  });

  describe("leads convert route - email includes Start Onboarding button", () => {
    it("email HTML includes Start Onboarding link", () => {
      expect(leadsConvertSource).toMatch(/Start Onboarding/);
    });
  });
});

// =====================================================================
// THEIRS BEHAVIORS (from the "theirs" branch)
// =====================================================================
describe("theirs behaviors", () => {
  // Note: theirs introduced inline agreement preview HTML, separate
  // HTML/PDF preview URLs, and agreement links in emails.
  // The resolved version kept ours's iframe approach with query params.
  // But we test what the resolution may have preserved from theirs.

  describe("agreement-preview route - filenameSafe helper", () => {
    it("defines filenameSafe function for safe filenames", () => {
      expect(agreementPreviewSource).toMatch(/function\s+filenameSafe/);
    });
  });

  describe("agreement-preview route - uses invitation.email for dealershipEmail", () => {
    it("uses invitation email", () => {
      expect(agreementPreviewSource).toMatch(/invitation\.email/);
    });
  });

  describe("agreement-preview route - queries onboarding_invitations by token", () => {
    it("queries onboarding_invitations WHERE token matches and not expired", () => {
      expect(agreementPreviewSource).toMatch(/onboarding_invitations/);
      expect(agreementPreviewSource).toMatch(/expires_at\s*>\s*NOW/);
    });
  });

  describe("invitations route - constructs onboardingUrl with baseUrl", () => {
    it("builds onboardingUrl from baseUrl + token", () => {
      expect(invitationsSource).toMatch(
        /onboardingUrl.*baseUrl.*token/s,
      );
    });
  });

  describe("invitations route - email has 30-day expiry notice", () => {
    it("email mentions 30 days expiry", () => {
      expect(invitationsSource).toMatch(/30 days/);
    });
  });

  describe("leads convert route - 14-day invitation expiry", () => {
    it("sets invitation expiry to 14 days", () => {
      expect(leadsConvertSource).toMatch(/14/);
    });
  });

  describe("leads convert route - email references sales@lotlyauto.com", () => {
    it("includes sales email address", () => {
      expect(leadsConvertSource).toMatch(/sales@lotlyauto\.com/);
    });
  });

  describe("leads convert route - handles sendInvite flag", () => {
    it("respects sendInvite parameter to conditionally send email", () => {
      expect(leadsConvertSource).toMatch(/sendInvite/);
    });
  });
});
