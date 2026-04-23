import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const genAppSrc = readFileSync(
  join(
    __dirname,
    "resolved/apps/web/src/components/JobDetail/GeneratedApplication.jsx",
  ),
  "utf8",
);

const jobStatusSrc = readFileSync(
  join(
    __dirname,
    "resolved/apps/web/src/components/JobDetail/JobStatus.jsx",
  ),
  "utf8",
);

// =====================================================================
// BASE BEHAVIORS (shared by both branches before divergence)
// =====================================================================
describe("base behaviors", () => {
  describe("GeneratedApplication - component structure", () => {
    it("exports a GeneratedApplication function component", () => {
      expect(genAppSrc).toMatch(/export\s+function\s+GeneratedApplication/);
    });

    it("uses useTranslation hook", () => {
      expect(genAppSrc).toMatch(/useTranslation/);
    });

    it("imports getTrackingStatusLabel from enumLabels", () => {
      expect(genAppSrc).toMatch(/getTrackingStatusLabel/);
      expect(genAppSrc).toMatch(/enumLabels/);
    });

    it("renders email subject section", () => {
      expect(genAppSrc).toMatch(/email_subject/);
      expect(genAppSrc).toMatch(/emailSubject/);
    });

    it("renders email body section", () => {
      expect(genAppSrc).toMatch(/email_body/);
      expect(genAppSrc).toMatch(/emailBody/);
    });

    it("conditionally renders cover letter section", () => {
      expect(genAppSrc).toMatch(/cover_letter/);
      expect(genAppSrc).toMatch(/coverLetter/);
    });

    it("renders status with blue badge styling", () => {
      expect(genAppSrc).toMatch(/bg-blue-100/);
      expect(genAppSrc).toMatch(/text-blue-800/);
    });

    it("imports FileText icon from lucide-react", () => {
      expect(genAppSrc).toMatch(/FileText/);
      expect(genAppSrc).toMatch(/lucide-react/);
    });
  });

  describe("JobStatus - component structure", () => {
    it("exports a JobStatus function component", () => {
      expect(jobStatusSrc).toMatch(/export\s+function\s+JobStatus/);
    });

    it("uses useTranslation hook", () => {
      expect(jobStatusSrc).toMatch(/useTranslation/);
    });

    it("imports getTrackingStatusLabel from enumLabels", () => {
      expect(jobStatusSrc).toMatch(/getTrackingStatusLabel/);
      expect(jobStatusSrc).toMatch(/enumLabels/);
    });

    it("shows research status as complete or pending", () => {
      expect(jobStatusSrc).toMatch(/hasResearch/);
      expect(jobStatusSrc).toMatch(/completeText/);
      expect(jobStatusSrc).toMatch(/pendingText/);
    });

    it("shows application status as generated label or not-generated", () => {
      expect(jobStatusSrc).toMatch(/hasApplication/);
      expect(jobStatusSrc).toMatch(/notGeneratedText/);
    });
  });
});

// =====================================================================
// OURS BEHAVIORS (getTrackingStatusLabel from enumLabels)
// =====================================================================
describe("ours behaviors", () => {
  describe("GeneratedApplication - uses getTrackingStatusLabel", () => {
    it("calls getTrackingStatusLabel with the translation function and status", () => {
      expect(genAppSrc).toMatch(/getTrackingStatusLabel\(t,\s*job/);
    });

    it("uses optional chaining on job?.application_status for safety", () => {
      expect(genAppSrc).toMatch(/job\?\.application_status/);
    });
  });

  describe("JobStatus - uses getTrackingStatusLabel", () => {
    it("calls getTrackingStatusLabel with the translation function and applicationStatus", () => {
      expect(jobStatusSrc).toMatch(
        /getTrackingStatusLabel\(t,\s*applicationStatus\)/,
      );
    });
  });
});

// =====================================================================
// THEIRS BEHAVIORS (fallback to raw status)
// =====================================================================
describe("theirs behaviors", () => {
  describe("GeneratedApplication - fallback to raw application_status", () => {
    it("has a fallback that shows raw application_status when label is not available", () => {
      // The resolved version should fall back to the raw status value
      expect(genAppSrc).toMatch(/application_status/);
      // It should have some fallback logic (|| pattern)
      expect(genAppSrc).toMatch(/\|\|/);
    });
  });

  describe("JobStatus - fallback to raw applicationStatus", () => {
    it("has a fallback that shows raw applicationStatus when label is not available", () => {
      expect(jobStatusSrc).toMatch(/applicationStatus/);
      // Should have fallback (|| pattern)
      expect(jobStatusSrc).toMatch(/\|\|/);
    });
  });
});
