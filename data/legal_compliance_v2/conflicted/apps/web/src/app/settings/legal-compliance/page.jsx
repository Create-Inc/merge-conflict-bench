"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  FileText,
  Link2,
  MessageSquare,
  Scale,
} from "lucide-react";
import AuthProtection from "@/components/AuthProtection";
import useMe from "@/hooks/useMe";

function formatDate(value) {
  if (!value) {
    return "";
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  return d.toLocaleString();
}

function Notice({ kind, children }) {
  const styles =
    kind === "error"
      ? "bg-red-50 border-red-200 text-red-700"
      : "bg-green-50 border-green-200 text-green-700";

  return (
    <div className={`mb-6 p-4 border rounded-lg ${styles}`}>{children}</div>
  );
}

function AgreementCard({
  icon,
  title,
  subtitle,
  accepted,
  acceptedAt,
  documentUrl,
  body,
  checkboxLabel,
  checked,
  onCheckedChange,
  actionLabel,
  onAction,
  actionDisabled,
  docUrl,
}) {
  const Icon = icon;

  const acceptedAtLabel = accepted ? formatDate(acceptedAt) : "";
<<<<<<< ours
  const docHref = typeof documentUrl === "string" ? documentUrl.trim() : "";
  const showDocLink = Boolean(docHref);
=======
  const hasDocUrl = typeof docUrl === "string" && docUrl.trim().length > 0;
  const safeDocUrl = hasDocUrl ? docUrl.trim() : "";
>>>>>>> theirs

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <Icon className="text-white" size={22} />
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xl font-semibold text-[#101828]">
                {title}
              </div>
              <div className="text-sm text-[#667085] mt-1">{subtitle}</div>
            </div>

            {showDocLink ? (
              <a
                href={docHref}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-sm font-medium text-blue-700 hover:text-blue-800"
              >
                Open document
              </a>
            ) : null}
          </div>

          {hasDocUrl ? (
            <div className="mt-4">
              <a
                href={safeDocUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800"
              >
                <Link2 size={16} />
                View uploaded document
              </a>
            </div>
          ) : null}

          <div className="mt-5 bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-[420px] overflow-auto">
            {/* Avoid non-tailwind classes like "prose"; keep plain text styling */}
            <div>{body}</div>
          </div>

          {accepted ? (
            <div className="mt-5 flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
              <CheckCircle2 className="text-green-600 mt-0.5" size={18} />
              <div className="flex-1">
                <div className="text-sm font-semibold text-green-900">
                  Accepted
                </div>
                {acceptedAtLabel ? (
                  <div className="text-xs text-green-700 mt-0.5">
                    Accepted at {acceptedAtLabel}
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="mt-5">
              <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(checked)}
                  onChange={(e) => onCheckedChange(e.target.checked)}
                  className="mt-1 h-5 w-5"
                />
                <div className="text-sm text-[#344054]">{checkboxLabel}</div>
              </label>

              <button
                type="button"
                onClick={onAction}
                disabled={Boolean(actionDisabled)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                {actionLabel}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LegalComplianceSettingsPage() {
  const queryClient = useQueryClient();
  const { data: meData } = useMe();

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [eulaChecked, setEulaChecked] = useState(false);
  const [smsChecked, setSmsChecked] = useState(false);

<<<<<<< ours
  const [sitesEulaUrl, setSitesEulaUrl] = useState("");
  const [smsOptInUrl, setSmsOptInUrl] = useState("");

=======
  // NEW: optional uploaded doc links (company-wide)
  const [eulaDocumentUrl, setEulaDocumentUrl] = useState("");
  const [smsDocumentUrl, setSmsDocumentUrl] = useState("");

>>>>>>> theirs
  const isSuperAdmin = Boolean(meData?.isSuperAdmin);
  const permissionLevel = meData?.user?.permission_level || null;
  const role = meData?.role || null;

  // Keep UI aligned with API: Admin (permission_level) or Support/SuperAdmin.
  const canManage =
    isSuperAdmin ||
    permissionLevel === "Admin" ||
    role === "Company Owner" ||
    role === "Admin";

  const { data, isLoading } = useQuery({
    queryKey: ["settings", "legal-compliance"],
    queryFn: async () => {
      const response = await fetch("/api/settings/legal-compliance");
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        const details = json?.error || response.statusText;
        throw new Error(details);
      }
      return json;
    },
  });

<<<<<<< ours
  // When server data arrives, seed the editable URL fields once.
  useEffect(() => {
    const nextEula =
      typeof data?.legal_sites_eula_url === "string"
        ? data.legal_sites_eula_url
        : "";
    const nextSms =
      typeof data?.legal_sms_opt_in_url === "string"
        ? data.legal_sms_opt_in_url
        : "";
    setSitesEulaUrl(nextEula);
    setSmsOptInUrl(nextSms);
  }, [data?.legal_sites_eula_url, data?.legal_sms_opt_in_url]);

=======
  // NEW: hydrate the doc URL inputs from the server
  useEffect(() => {
    const nextEula = data?.documents?.eula_document_url;
    const nextSms = data?.documents?.sms_document_url;

    if (typeof nextEula === "string") {
      setEulaDocumentUrl(nextEula);
    }
    if (typeof nextSms === "string") {
      setSmsDocumentUrl(nextSms);
    }
  }, [data?.documents?.eula_document_url, data?.documents?.sms_document_url]);

>>>>>>> theirs
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await fetch("/api/settings/legal-compliance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        const details = json?.error || response.statusText;
        throw new Error(details);
      }
      return json;
    },
    onMutate: () => {
      setError(null);
      setSuccess(null);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["settings", "legal-compliance"],
      });
      setEulaChecked(false);
      setSmsChecked(false);
      setSuccess("Saved!");
      setTimeout(() => setSuccess(null), 2500);
    },
    onError: (err) => {
      console.error(err);
      setError(err?.message || "Could not save legal compliance settings");
    },
  });

  const docsMutation = useMutation({
    mutationFn: async ({ legal_sites_eula_url, legal_sms_opt_in_url }) => {
      const response = await fetch("/api/settings/legal-compliance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legal_sites_eula_url,
          legal_sms_opt_in_url,
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        const details = json?.error || response.statusText;
        throw new Error(details);
      }
      return json;
    },
    onMutate: () => {
      setError(null);
      setSuccess(null);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["settings", "legal-compliance"],
      });
      setSuccess("Document links saved!");
      setTimeout(() => setSuccess(null), 2500);
    },
    onError: (err) => {
      console.error(err);
      setError(err?.message || "Could not save document links");
    },
  });

  const eulaAccepted = Boolean(data?.eula_accepted);
  const smsAccepted = Boolean(data?.sms_consent_accepted);

  const eulaDocUrl =
    typeof data?.legal_sites_eula_url === "string"
      ? data.legal_sites_eula_url
      : "";
  const smsDocUrl =
    typeof data?.legal_sms_opt_in_url === "string"
      ? data.legal_sms_opt_in_url
      : "";

  const companyName = meData?.company?.name || "your company";

  const eulaBody = useMemo(() => {
    return (
      <div className="space-y-3 text-sm text-[#344054]">
        {eulaDocUrl ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
            Your uploaded/published Sites EULA is available via the “Open
            document” link above. The text below is a quick in-app summary.
          </div>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            Optional: add a PDF/Doc link for your Sites EULA above so admins can
            open the official document.
          </div>
        )}
        <p>
          This End User License Agreement ("EULA") is between Pool Splasher and
          your company. By using the software, you agree to these terms.
        </p>

        <p className="font-semibold text-[#101828]">1. License</p>
        <p>
          Pool Splasher grants you a limited, non-exclusive, non-transferable
          license to use the application for operating your pool service
          business.
        </p>

        <p className="font-semibold text-[#101828]">2. Acceptable Use</p>
        <p>
          You agree not to misuse the service, attempt unauthorized access, or
          use the service for unlawful activities.
        </p>

        <p className="font-semibold text-[#101828]">3. Data</p>
        <p>
          You are responsible for the accuracy of data you enter and for
          obtaining any customer permissions required by law.
        </p>

        <p className="font-semibold text-[#101828]">4. Availability</p>
        <p>
          Pool Splasher is provided "as is" and "as available". We do not
          guarantee uninterrupted service.
        </p>

        <p className="text-xs text-[#667085] pt-2">
          Last updated: January 13, 2026
        </p>
      </div>
    );
  }, [eulaDocUrl]);

  const smsBody = useMemo(() => {
    return (
      <div className="space-y-3 text-sm text-[#344054]">
        {smsDocUrl ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
            Your uploaded/published SMS agreement is available via the “Open
            document” link above. The text below is the compliance summary +
            suggested opt-in copy.
          </div>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            Optional: add a PDF/Doc link for your SMS Opt-In Agreement above so
            admins can open the official document.
          </div>
        )}
        <p>
          This agreement enables {companyName} to use Pool Splasher to send
          service-related text messages to customers.
        </p>

        <p className="font-semibold text-[#101828]">
          SMS/Text Message Consent (Twilio / TCPA aligned)
        </p>

        <p>
          By accepting, you confirm that {companyName} will only send text
          messages to customers who have provided prior express consent to
          receive SMS/MMS messages.
        </p>

        <ul className="list-disc pl-5 space-y-1">
          <li>
            <span className="font-medium">Purpose:</span> service notifications
            such as pre-arrival texts, service completion confirmations, and
            important account updates.
          </li>
          <li>
            <span className="font-medium">Message frequency:</span> varies.
          </li>
          <li>
            <span className="font-medium">Rates:</span> standard message and
            data rates may apply.
          </li>
          <li>
            <span className="font-medium">Opt-out:</span> customers can reply
            STOP to opt out; HELP for help.
          </li>
          <li>
            <span className="font-medium">Not required for purchase:</span>
            consent is not a condition of purchasing any goods or services.
          </li>
          <li>
            <span className="font-medium">Privacy:</span> you will not share
            customer phone numbers with third parties for marketing.
          </li>
        </ul>

        {/* NEW: give admins copy/paste compliant language they can use when collecting consent */}
        <div className="mt-2 rounded-lg border border-gray-200 bg-white p-3">
          <div className="text-xs font-semibold text-[#101828]">
            Suggested customer opt-in wording (copy/paste)
          </div>
          <div className="mt-2 text-xs text-[#344054]">
            “By providing your mobile number, you agree to receive
            service-related text messages from {companyName}. Message frequency
            varies. Message & data rates may apply. Reply STOP to opt out, HELP
            for help. Consent is not a condition of purchase.”
          </div>
        </div>

        <p>
          Pool Splasher provides tooling, but compliance is your responsibility.
          Keep records of consent and honor opt-outs promptly.
        </p>

        <p className="text-xs text-[#667085] pt-2">
          Last updated: January 13, 2026
        </p>
      </div>
    );
  }, [companyName, smsDocUrl]);

  const onAcceptEula = useCallback(() => {
    if (!canManage) {
      setError("Admins only: you do not have permission to accept this.");
      return;
    }

    if (!eulaChecked) {
      setError("Please check the box to accept the EULA.");
      return;
    }

    saveMutation.mutate({ eula_accepted: true });
  }, [canManage, eulaChecked, saveMutation]);

  const onAcceptSms = useCallback(() => {
    if (!canManage) {
      setError("Admins only: you do not have permission to accept this.");
      return;
    }

    if (!smsChecked) {
      setError("Please check the box to accept the SMS agreement.");
      return;
    }

    saveMutation.mutate({ sms_consent_accepted: true });
  }, [canManage, saveMutation, smsChecked]);

<<<<<<< ours
  const onSaveDocLinks = useCallback(() => {
    if (!canManage) {
      setError(
        "Admins only: you do not have permission to edit document links.",
      );
      return;
    }

    docsMutation.mutate({
      legal_sites_eula_url: sitesEulaUrl,
      legal_sms_opt_in_url: smsOptInUrl,
    });
  }, [canManage, docsMutation, sitesEulaUrl, smsOptInUrl]);

=======
  const onSaveDocuments = useCallback(() => {
    if (!canManage) {
      setError("Admins only: you do not have permission to change documents.");
      return;
    }

    saveMutation.mutate({
      eula_document_url: eulaDocumentUrl,
      sms_document_url: smsDocumentUrl,
    });
  }, [canManage, eulaDocumentUrl, saveMutation, smsDocumentUrl]);

>>>>>>> theirs
  const eulaActionDisabled =
    saveMutation.isPending || isLoading || eulaAccepted || !eulaChecked;
  const smsActionDisabled =
    saveMutation.isPending || isLoading || smsAccepted || !smsChecked;

<<<<<<< ours
  const docsActionDisabled = docsMutation.isPending || isLoading || !canManage;

=======
  const docSaveDisabled = Boolean(
    saveMutation.isPending || isLoading || !canManage,
  );

>>>>>>> theirs
  return (
    <AuthProtection>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <Scale className="text-white" size={22} />
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-[#101828]">
                  Legal & Compliance
                </h1>
                <p className="text-[#667085] mt-1">
                  Admin-only agreements for EULA and customer texting consent.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <a
                href="/settings"
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#344054] bg-white hover:bg-gray-50 border border-gray-200 rounded-lg"
              >
                Back to Settings
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8">
          {error ? <Notice kind="error">{error}</Notice> : null}
          {success ? <Notice kind="success">{success}</Notice> : null}

          {!canManage ? (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
              You can view these agreements, but only Admins can accept them.
            </div>
          ) : null}

          {isLoading && !data ? (
            <div className="text-sm text-[#667085]">Loading…</div>
          ) : (
            <div className="space-y-6">
<<<<<<< ours
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-base font-semibold text-[#101828]">
                  Agreement documents
                </div>
                <div className="text-sm text-[#667085] mt-1">
                  Optional: paste links to your official PDFs/docs. These links
                  will show up as “Open document”.
                </div>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#344054]">
                      Sites EULA document URL
                    </label>
                    <input
                      value={sitesEulaUrl}
                      onChange={(e) => setSitesEulaUrl(e.target.value)}
                      placeholder="https://..."
                      className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      disabled={!canManage}
                    />
                    {eulaDocUrl ? (
                      <a
                        href={eulaDocUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex text-sm text-blue-700 hover:text-blue-800"
                      >
                        Open current EULA doc
                      </a>
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#344054]">
                      SMS opt-in agreement document URL
                    </label>
                    <input
                      value={smsOptInUrl}
                      onChange={(e) => setSmsOptInUrl(e.target.value)}
                      placeholder="https://..."
                      className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      disabled={!canManage}
                    />
                    {smsDocUrl ? (
                      <a
                        href={smsDocUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex text-sm text-blue-700 hover:text-blue-800"
                      >
                        Open current SMS doc
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={onSaveDocLinks}
                    disabled={docsActionDisabled}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-950 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                  >
                    {docsMutation.isPending ? "Saving…" : "Save document links"}
                  </button>
                </div>
              </div>

=======
              {/* NEW: Document links (optional) */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
                    <Link2 className="text-white" size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="text-base font-semibold text-[#101828]">
                      Agreement documents (optional)
                    </div>
                    <div className="text-sm text-[#667085] mt-1">
                      If you already uploaded PDFs to Document Vault, paste
                      their URLs here so admins can open the exact documents.
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-[#101828]">
                          EULA document URL
                        </div>
                        <input
                          value={eulaDocumentUrl}
                          onChange={(e) => setEulaDocumentUrl(e.target.value)}
                          placeholder="https://..."
                          className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#101828]">
                          SMS agreement document URL
                        </div>
                        <input
                          value={smsDocumentUrl}
                          onChange={(e) => setSmsDocumentUrl(e.target.value)}
                          placeholder="https://..."
                          className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={onSaveDocuments}
                      disabled={docSaveDisabled}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                    >
                      Save document links
                    </button>
                  </div>
                </div>
              </div>

>>>>>>> theirs
              <AgreementCard
                icon={FileText}
                title="Sites EULA"
                subtitle="Applies to company use of Pool Splasher"
                accepted={eulaAccepted}
                acceptedAt={data?.eula_accepted_at}
                documentUrl={eulaDocUrl}
                body={eulaBody}
                checkboxLabel="I have read and agree to the Sites EULA on behalf of my company."
                checked={eulaChecked}
                onCheckedChange={setEulaChecked}
                actionLabel={saveMutation.isPending ? "Saving…" : "Accept EULA"}
                onAction={onAcceptEula}
                actionDisabled={eulaActionDisabled}
                docUrl={data?.documents?.eula_document_url}
              />

              <AgreementCard
                icon={MessageSquare}
                title="SMS/Text Messaging Opt-In Agreement"
                subtitle="Confirms you will only text customers who opted in"
                accepted={smsAccepted}
                acceptedAt={data?.sms_consent_accepted_at}
                documentUrl={smsDocUrl}
                body={smsBody}
                checkboxLabel={`I authorize ${companyName} to use Pool Splasher to send SMS/MMS messages to customers who have opted in, and I understand standard message/data rates may apply.`}
                checked={smsChecked}
                onCheckedChange={setSmsChecked}
                actionLabel={
                  saveMutation.isPending ? "Saving…" : "Accept SMS Agreement"
                }
                onAction={onAcceptSms}
                actionDisabled={smsActionDisabled}
                docUrl={data?.documents?.sms_document_url}
              />

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="text-white" size={20} />
                  </div>
                  <div>
                    <div className="text-base font-semibold text-[#101828]">
                      Next step (recommended)
                    </div>
                    <div className="text-sm text-[#667085] mt-1">
                      Want this to be fully Twilio-auditable? I can add a
                      customer-facing opt-in record (date, source, consent text)
                      stored per customer so you have proof of consent.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthProtection>
  );
}
