import { useTranslation } from "@/utils/useUser";
import { getTrackingStatusLabel } from "@/utils/enumLabels";

export function JobStatus({ hasResearch, hasApplication, applicationStatus }) {
  const { t } = useTranslation();

  const titleText = t("jobDetail.status.title");
  const researchText = t("jobDetail.status.research");
  const applicationText = t("jobDetail.status.application");
  const completeText = t("jobDetail.status.complete");
  const pendingText = t("jobDetail.status.pending");
  const notGeneratedText = t("jobDetail.status.notGenerated");

<<<<<<< ours
  const applicationStatusLabel = applicationStatus
    ? getTrackingStatusLabel(t, applicationStatus)
    : "";

=======
  // Translate backend status codes (e.g. "generated", "sent") when possible.
  const applicationStatusKey = applicationStatus
    ? `tracking.statuses.${applicationStatus}`
    : null;
  const applicationStatusLabel = applicationStatusKey
    ? t(applicationStatusKey, applicationStatus)
    : null;

>>>>>>> theirs
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{titleText}</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{researchText}</span>
          {hasResearch ? (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
              {completeText}
            </span>
          ) : (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
              {pendingText}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{applicationText}</span>
          {hasApplication ? (
<<<<<<< ours
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
              {applicationStatusLabel}
=======
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded capitalize">
              {applicationStatusLabel || applicationStatus}
>>>>>>> theirs
            </span>
          ) : (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
              {notGeneratedText}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
