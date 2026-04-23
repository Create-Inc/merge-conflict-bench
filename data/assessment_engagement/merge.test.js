import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readResolved(relPath) {
  return readFileSync(join(__dirname, 'resolved', relPath), 'utf-8');
}

describe('assessment_engagement merge', () => {
  describe('base behaviors', () => {
    it('useAssessmentDetail hook checks for employee_engagement_survey template_key', () => {
      const src = readResolved('apps/web/src/hooks/useAssessmentDetail.js');
      expect(src).toMatch(/employee_engagement_survey/);
    });

    it('useAssessmentDetail exports isEngagementSurvey in the return object', () => {
      const src = readResolved('apps/web/src/hooks/useAssessmentDetail.js');
      expect(src).toMatch(/isEngagementSurvey/);
    });

    it('useAssessmentDetail returns templateLabel as a useMemo', () => {
      const src = readResolved('apps/web/src/hooks/useAssessmentDetail.js');
      expect(src).toMatch(/templateLabel/);
      expect(src).toMatch(/useMemo/);
    });

    it('useAssessmentDetail checks looksLikeEngagementSurveyType based on typeName', () => {
      const src = readResolved('apps/web/src/hooks/useAssessmentDetail.js');
      expect(src).toMatch(/looksLikeEngagementSurveyType/);
      expect(src).toMatch(/typeName\.includes.*engagement/);
    });

    it('setup-engagement page has a looksLikeEngagementSurveyType function', () => {
      const src = readResolved('apps/web/src/app/assessments/[id]/setup-engagement/page.jsx');
      expect(src).toMatch(/function\s+looksLikeEngagementSurveyType/);
    });

    it('setup-engagement page offers convert when shouldOfferConvert is true', () => {
      const src = readResolved('apps/web/src/app/assessments/[id]/setup-engagement/page.jsx');
      expect(src).toMatch(/shouldOfferConvert/);
      expect(src).toMatch(/Convert now/);
    });

    it('API route exports POST handler for convert-to-engagement-survey', () => {
      const src = readResolved('apps/web/src/app/api/assessments/[id]/convert-to-engagement-survey/route.js');
      expect(src).toMatch(/export\s+async\s+function\s+POST/);
    });

    it('API route checks for assessment_admin and company_admin roles', () => {
      const src = readResolved('apps/web/src/app/api/assessments/[id]/convert-to-engagement-survey/route.js');
      expect(src).toMatch(/company_admin/);
      expect(src).toMatch(/assessment_admin/);
    });
  });

  describe('ours behaviors', () => {
    it('useAssessmentDetail extracts category from assessment and uses isEngagementCategory', () => {
      const src = readResolved('apps/web/src/hooks/useAssessmentDetail.js');
      expect(src).toMatch(/category/);
      expect(src).toMatch(/isEngagementCategory/);
      // Must check category === "engagement"
      expect(src).toMatch(/category\s*===\s*["']engagement["']/);
    });

    it('useAssessmentDetail defines isLiftBusiness, isHiringFactor, isJobFitFactor, isLiftSales', () => {
      const src = readResolved('apps/web/src/hooks/useAssessmentDetail.js');
      expect(src).toMatch(/isLiftBusiness/);
      expect(src).toMatch(/isHiringFactor/);
      expect(src).toMatch(/isJobFitFactor/);
      expect(src).toMatch(/isLiftSales/);
    });

    it('isEngagementSurvey includes isEngagementCategory in its disjunction', () => {
      const src = readResolved('apps/web/src/hooks/useAssessmentDetail.js');
      // isEngagementSurvey should include isEngagementCategory as one of its conditions
      const surveyDef = src.match(/isEngagementSurvey\s*=[\s\S]*?;/);
      expect(surveyDef).not.toBeNull();
      expect(surveyDef[0]).toMatch(/isEngagementCategory/);
    });

    it('API route looksLikeEngagementSurveyType accepts category parameter', () => {
      const src = readResolved('apps/web/src/app/api/assessments/[id]/convert-to-engagement-survey/route.js');
      expect(src).toMatch(/category/);
    });

    it('setup-engagement page checks category === engagement', () => {
      const src = readResolved('apps/web/src/app/assessments/[id]/setup-engagement/page.jsx');
      expect(src).toMatch(/category.*engagement|engagement.*category/i);
    });
  });

  describe('theirs behaviors', () => {
    it('useAssessmentDetail defines looksLikeEngagementSurveyName based on nameLower', () => {
      const src = readResolved('apps/web/src/hooks/useAssessmentDetail.js');
      expect(src).toMatch(/looksLikeEngagementSurveyName/);
      expect(src).toMatch(/nameLower\.includes.*engagement/);
      // excludes business from name check
      expect(src).toMatch(/!nameLower\.includes.*business/);
    });

    it('isEngagementSurvey includes looksLikeEngagementSurveyName as a fallback', () => {
      const src = readResolved('apps/web/src/hooks/useAssessmentDetail.js');
      const surveyDef = src.match(/isEngagementSurvey\s*=[\s\S]*?;/);
      expect(surveyDef).not.toBeNull();
      expect(surveyDef[0]).toMatch(/looksLikeEngagementSurveyName/);
    });

    it('templateLabel useMemo includes looksLikeEngagementSurveyName and looksLikeEngagementSurveyType in deps', () => {
      const src = readResolved('apps/web/src/hooks/useAssessmentDetail.js');
      // Look for the deps array of the templateLabel useMemo
      const memoMatch = src.match(/templateLabel\s*=\s*useMemo\(\s*\(\)\s*=>\s*\{[\s\S]*?\},\s*\[([^\]]*)\]/);
      expect(memoMatch).not.toBeNull();
      expect(memoMatch[1]).toMatch(/looksLikeEngagementSurveyName/);
      expect(memoMatch[1]).toMatch(/looksLikeEngagementSurveyType/);
    });

    it('templateLabel falls back to "Employee Engagement Survey" when name/type hints match', () => {
      const src = readResolved('apps/web/src/hooks/useAssessmentDetail.js');
      // After the main template_key checks, there should be a fallback using looksLikeEngagementSurveyType or looksLikeEngagementSurveyName
      expect(src).toMatch(/looksLikeEngagementSurveyType\s*\|\|\s*looksLikeEngagementSurveyName/);
      expect(src).toMatch(/Employee Engagement Survey/);
    });

    it('API route looksLikeEngagementSurveyType accepts assessmentName parameter', () => {
      const src = readResolved('apps/web/src/app/api/assessments/[id]/convert-to-engagement-survey/route.js');
      expect(src).toMatch(/assessmentName/);
    });

    it('API route passes assessmentName to looksLikeEngagementSurveyType call', () => {
      const src = readResolved('apps/web/src/app/api/assessments/[id]/convert-to-engagement-survey/route.js');
      expect(src).toMatch(/assessmentName:\s*assessment/);
    });

    it('setup-engagement page uses assessment name as a hint for engagement detection', () => {
      const src = readResolved('apps/web/src/app/assessments/[id]/setup-engagement/page.jsx');
      // Checks name.includes("engagement") && !name.includes("business")
      expect(src).toMatch(/name\.includes.*engagement/);
      expect(src).toMatch(/!name\.includes.*business/);
    });
  });
});
