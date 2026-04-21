import { FileText } from "lucide-react";
import { useTranslation } from "@/utils/useUser";
import { getTrackingStatusLabel } from "@/utils/enumLabels";

export function GeneratedApplication({ job }) {
  const { t } = useTranslation();

  const statusLabel = t("applications.status");

<<<<<<< ours
  const applicationStatusLabel = job.application_status
    ? getTrackingStatusLabel(t, job.application_status)
    : null;

=======
  // Translate backend status codes (e.g. "generated", "sent") when possible.
  const applicationStatusKey = job?.application_status
    ? `tracking.statuses.${job.application_status}`
    : null;
  const applicationStatusLabel = applicationStatusKey
    ? t(applicationStatusKey, job?.application_status)
    : null;

>>>>>>> theirs
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <FileText className="w-6 h-6 text-[#5AB9C8]" />
        {t("jobDetail.application.title")}
      </h2>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            {t("jobDetail.application.emailSubject")}
          </h3>
          <p className="text-gray-900 font-medium">{job.email_subject}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            {t("jobDetail.application.emailBody")}
          </h3>
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">
            {job.email_body}
          </p>
        </div>

        {job.cover_letter && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              {t("jobDetail.application.coverLetter")}
            </h3>
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">
              {job.cover_letter}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>{statusLabel}:</span>
<<<<<<< ours
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium">
            {applicationStatusLabel || ""}
=======
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium capitalize">
            {applicationStatusLabel || job.application_status}
>>>>>>> theirs
          </span>
        </div>
      </div>
    </div>
  );
}
