"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import useUser from "@/utils/useUser";
import { useCreatedAssessmentsBatch } from "@/hooks/useCreatedAssessmentsBatch";
import { useEngagementSurveySetup } from "@/hooks/useEngagementSurveySetup";
import { safeString } from "@/utils/engagementSurvey/dataHelpers";
import { PageHeader } from "@/components/EngagementSurveySetup/PageHeader";
import { ErrorBanner } from "@/components/EngagementSurveySetup/ErrorBanner";
import { SurveySettings } from "@/components/EngagementSurveySetup/SurveySettings";
import { SectionsEditor } from "@/components/EngagementSurveySetup/SectionsEditor";
import { QuestionsEditor } from "@/components/EngagementSurveySetup/QuestionsEditor";

function looksLikeEngagementSurveyType(assessment) {
  const category = safeString(assessment?.category).toLowerCase();
  if (category === "engagement") return true;

  const typeName = safeString(assessment?.type_name).toLowerCase();
  const name = safeString(assessment?.name).toLowerCase();

  // Strong hint: admin named it as an engagement survey.
  const nameHint = name.includes("engagement") && !name.includes("business");
  if (nameHint) return true;

  if (!typeName) return false;

  // Back-compat: if category is missing, fall back to type name heuristics.
  // We purposely do NOT exclude the word "business" here because some mis-created
  // engagement surveys can carry the wrong label yet still need conversion.
  return typeName.includes("engagement");
}

export default function EngagementSurveySetupPage({ params }) {
  const { id } = params;

  const { data: user, loading: userLoading } = useUser();
  const queryClient = useQueryClient();

  const { createdIdsQuery, backToLinksHref } = useCreatedAssessmentsBatch(id);
  const backToAssessmentHref = `/assessments/${id}${createdIdsQuery}`;

  const {
    assessmentQuery,
    configQuery,
    goals,
    setGoals,
    sections,
    setSections,
    questionsPerSection,
    setQuestionsPerSection,
    anonymous,
    setAnonymous,
    allowBreakdowns,
    setAllowBreakdowns,
    deadlineDate,
    setDeadlineDate,
    normalizedQuestionsPerSection,
    saveConfigMutation,
    generateMutation,
    questionSetDraft,
    questionSetDirty,
    updateQuestion,
    changeQuestionType,
  } = useEngagementSurveySetup(id, user);

  const backHref = backToLinksHref || backToAssessmentHref;

  // IMPORTANT: hooks must not be called conditionally, so keep this near the top.
  const convertMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/assessments/${id}/convert-to-engagement-survey`,
        { method: "POST" },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          json?.error ||
            `When posting /api/assessments/${id}/convert-to-engagement-survey, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return json;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["assessment", id] });
      await queryClient.invalidateQueries({
        queryKey: ["engagement-survey-config", id],
      });
    },
  });

  const isLoading =
    userLoading || assessmentQuery.isLoading || configQuery.isLoading;

  if (!user && !userLoading) {
    return (
      <div className="min-h-screen bg-white p-8 text-center">
        <p className="text-gray-700">You need to sign in to view this.</p>
        <a
          href="/account/signin"
          className="inline-block mt-4 px-5 py-2 rounded-full bg-[#2962FF] text-white"
        >
          Sign in
        </a>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-8 text-gray-500">Loading…</div>;
  }

  if (assessmentQuery.isError) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {assessmentQuery.error?.message || "Could not load assessment"}
        </div>
      </div>
    );
  }

  const assessment = assessmentQuery.data?.assessment || null;
  const templateKey = safeString(assessment?.template_key);

  const shouldOfferConvert =
    !!assessment?.id &&
    looksLikeEngagementSurveyType(assessment) &&
    templateKey !== "employee_engagement_survey";

  if (shouldOfferConvert) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#121212] text-sm text-gray-700 dark:text-gray-200 font-['Instrument_Sans']">
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
        `}</style>

        <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
          <PageHeader
            backHref={backHref}
            backToLinksHref={backToLinksHref}
            showActions={false}
          />

          <ErrorBanner
            error={
              convertMutation.isError
                ? safeString(convertMutation.error?.message) ||
                  "Could not convert"
                : null
            }
          />

          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            <div className="font-medium">This assessment needs a quick fix</div>
            <div className="mt-1">
              This assessment was created as an Engagement Survey, but it is
              currently using a different underlying template. Convert it so you
              can generate and edit Engagement Survey questions.
            </div>
            <button
              type="button"
              onClick={() => convertMutation.mutate()}
              disabled={convertMutation.isPending}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2962FF] text-white hover:bg-[#1E4FCC] disabled:opacity-50"
            >
              {convertMutation.isPending ? "Converting…" : "Convert now"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (templateKey !== "employee_engagement_survey") {
    return (
      <div className="p-8 text-gray-700">
        This is not an Employee Engagement Survey assessment.
      </div>
    );
  }

  const topError =
    (configQuery.isError
      ? safeString(configQuery.error?.message) || "Could not load config"
      : null) ||
    (saveConfigMutation.isError
      ? safeString(saveConfigMutation.error?.message) || "Could not save"
      : null) ||
    (generateMutation.isError
      ? safeString(generateMutation.error?.message) || "Could not generate"
      : null);

  const savedAt = safeString(configQuery.data?.meta?.configUpdatedAt);

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] text-sm text-gray-700 dark:text-gray-200 font-['Instrument_Sans']">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
      `}</style>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
        <PageHeader
          backHref={backHref}
          backToLinksHref={backToLinksHref}
          onSave={() => saveConfigMutation.mutate()}
          onGenerate={() => generateMutation.mutate()}
          isSaving={saveConfigMutation.isPending}
          isGenerating={generateMutation.isPending}
        />

        <ErrorBanner error={topError} />

        <SurveySettings
          savedAt={savedAt}
          goals={goals}
          setGoals={setGoals}
          questionsPerSection={questionsPerSection}
          setQuestionsPerSection={setQuestionsPerSection}
          deadlineDate={deadlineDate}
          setDeadlineDate={setDeadlineDate}
          anonymous={anonymous}
          setAnonymous={setAnonymous}
          allowBreakdowns={allowBreakdowns}
          setAllowBreakdowns={setAllowBreakdowns}
        />

        <SectionsEditor
          sections={sections}
          setSections={setSections}
          normalizedQuestionsPerSection={normalizedQuestionsPerSection}
        />

        <QuestionsEditor
          questionSetDraft={questionSetDraft}
          questionSetDirty={questionSetDirty}
          updateQuestion={updateQuestion}
          changeQuestionType={changeQuestionType}
        />
      </div>
    </div>
  );
}
