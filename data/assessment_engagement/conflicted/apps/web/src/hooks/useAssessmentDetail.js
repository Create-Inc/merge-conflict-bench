import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

export function useAssessmentDetail(id, user) {
  const assessmentQuery = useQuery({
    queryKey: ["assessment", id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const res = await fetch(`/api/assessments/${id}`);
      if (!res.ok) {
        throw new Error(
          `When fetching /api/assessments/${id}, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  const assessment = assessmentQuery.data?.assessment || null;

  const templateKey = assessment?.template_key || null;
<<<<<<< ours
  const categoryRaw =
    typeof assessment?.category === "string" ? assessment.category : "";
  const category = categoryRaw.toLowerCase();

=======

>>>>>>> theirs
  const typeNameRaw =
    typeof assessment?.type_name === "string" ? assessment.type_name : "";
  const typeName = typeNameRaw.toLowerCase();

  const nameRaw = typeof assessment?.name === "string" ? assessment.name : "";
  const nameLower = nameRaw.toLowerCase();

  const isLift = templateKey === "lift_factor";
  const isLift360 = templateKey === "lift_360";
  const isMotivator = templateKey === "lift_motivator";
  const isEmotionalIntelligence = templateKey === "emotional_intelligence";
  const isCognitive = templateKey === "lift_cognitive_factor";

  // IMPORTANT: Some older assessments were created with the wrong template_key.
  // We want the "Setup" button to send the user to the right setup screen.
  // Prefer the assessment type category when available.
  const looksLikeEngagementSurveyType = typeName.includes("engagement");
  const isEngagementCategory = category === "engagement";

<<<<<<< ours
  // If an assessment is truly a LIFT Business assessment, its template_key is lift_business
  // AND it should not be an engagement-category assessment.
  const isLiftBusiness =
    templateKey === "lift_business" && !isEngagementCategory;

  const isHiringFactor = templateKey === "lift_hiring_factor";
  const isJobFitFactor = templateKey === "lift_job_fit_factor";
  const isLiftSales = templateKey === "LIFT_Factor_Sales";
=======
  // Extra safety: sometimes the assessment type name is a generic "Business" label,
  // but the user clearly named it as an Engagement Survey.
  const looksLikeEngagementSurveyName =
    nameLower.includes("engagement") && !nameLower.includes("business");
>>>>>>> theirs

  // Engagement Survey:
  // - canonical template_key: employee_engagement_survey
  // - back-compat: category === engagement (even if template_key is wrong)
  // - last resort: type_name contains "engagement"
  const isEngagementSurvey =
    templateKey === "employee_engagement_survey" ||
<<<<<<< ours
    isEngagementCategory ||
    looksLikeEngagementSurveyType;
=======
    // Back-compat: if the assessment type name says "Engagement" (and not "Business"),
    // treat it as an Engagement Survey so admins can reach the right setup screen.
    looksLikeEngagementSurveyType ||
    // Last-resort: use the assessment name as a hint.
    looksLikeEngagementSurveyName;
>>>>>>> theirs

  // Business assessment should never steal the Setup button if we believe this is an engagement survey.
  const isLiftBusiness = templateKey === "lift_business" && !isEngagementSurvey;

  const isHiringFactor = templateKey === "lift_hiring_factor";
  const isJobFitFactor = templateKey === "lift_job_fit_factor";
  const isLiftSales = templateKey === "LIFT_Factor_Sales";

  const templateLabel = useMemo(() => {
    const key = templateKey;

    // If the assessment is effectively being treated as an engagement survey (even if mis-created),
    // keep the UI consistent.
    if (isEngagementSurvey && key !== "employee_engagement_survey") {
      return "Employee Engagement Survey";
    }

    if (key === "lift_factor") return "LIFT Factor";
    if (key === "lift_motivator") return "LIFT Motivator";
    if (key === "lift_360") return "LIFT Factor 360";
    if (key === "emotional_intelligence") return "Emotional Intelligence (EQ)";
    if (key === "lift_cognitive_factor") return "Cognitive";

    // NOTE: if an assessment is in the engagement category, label it as such
    // even if template_key was created incorrectly.
    if (isEngagementSurvey) return "Employee Engagement Survey";

    if (key === "lift_business") return "LIFT Business";
    if (key === "lift_hiring_factor") return "LIFT Hiring Factor";
    if (key === "lift_job_fit_factor") return "LIFT Job Fit Factor";
    if (key === "LIFT_Factor_Sales") return "LIFT Factor Sales";

<<<<<<< ours

=======
    // If template_key is missing/misaligned, fall back to type/name hints.
    if (looksLikeEngagementSurveyType || looksLikeEngagementSurveyName)
      return "Employee Engagement Survey";

>>>>>>> theirs
    return null;
<<<<<<< ours
  }, [isEngagementSurvey, templateKey]);
=======
  }, [
    isEngagementSurvey,
    looksLikeEngagementSurveyName,
    looksLikeEngagementSurveyType,
    templateKey,
  ]);
>>>>>>> theirs

  return {
    assessmentQuery,
    assessment,
    isLift,
    isLift360,
    isMotivator,
    isEmotionalIntelligence,
    isCognitive,
    isLiftBusiness,
    isHiringFactor,
    isJobFitFactor,
    isLiftSales,
    isEngagementSurvey,
    templateLabel,
  };
}
