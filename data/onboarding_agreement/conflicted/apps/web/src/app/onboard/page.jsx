"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle,
  Loader2,
  ShieldCheck,
  FileText,
  CreditCard,
} from "lucide-react";
import { buildServiceAgreementHtml } from "@/app/api/utils/service-agreement";

const INVENTORY_SIZE_OPTIONS = [
  { value: "0-25", label: "0–25 vehicles" },
  { value: "26-50", label: "26–50 vehicles" },
  { value: "51-100", label: "51–100 vehicles" },
  { value: "101-250", label: "101–250 vehicles" },
  { value: "251+", label: "251+ vehicles" },
];

export default function OnboardPage() {
  const [token, setToken] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [acceptedQuote, setAcceptedQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const todayIso = useMemo(() => {
    try {
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return "";
    }
  }, []);

  const ONE_TIME_SETUP_FEE = 25;

  const [formData, setFormData] = useState({
    // account
    fullName: "",
    phone: "",
    password: "",
    confirmPassword: "",

    // dealership
    dealershipName: "",
    dealershipPhone: "",
    dealershipAddress: "",

    // billing
    invoicePreference: "manual", // 'manual' | 'stripe_monthly'

    // questionnaire
    inventorySize: "",
    wantsDmsSync: true,
    currentDmsProvider: "",

    // agreement
    agreementAccepted: false,
    agreementPrintedName: "",
    agreementDate: "",
    agreementEffectiveDate: "",
  });

  const email = invitation?.email || "";
  const companyName = invitation?.company_name || "";

  const resolvedMonthlyFee = useMemo(() => {
    const quoteMonthly = Number(acceptedQuote?.total_monthly);
    if (Number.isFinite(quoteMonthly) && quoteMonthly > 0) return quoteMonthly;

    const inviteMonthly = Number(invitation?.monthly_price);
    if (Number.isFinite(inviteMonthly) && inviteMonthly > 0)
      return inviteMonthly;

    return null;
  }, [acceptedQuote, invitation]);

<<<<<<< ours
  const agreementPreviewSrc = useMemo(() => {
    if (!token) return "";

    const p = new URLSearchParams();
    p.set("token", token);
    p.set("format", "html");
    p.set("dealershipName", formData.dealershipName || "");
    p.set("dealershipAddress", formData.dealershipAddress || "");
    p.set("primaryContact", formData.fullName || "");
    p.set("dealershipEmail", email || "");
    if (resolvedMonthlyFee !== null && resolvedMonthlyFee !== undefined) {
      p.set("monthlySubscriptionFee", String(resolvedMonthlyFee));
    }
    p.set("effectiveDate", formData.agreementEffectiveDate || todayIso);
    p.set("dealerPrintedName", formData.agreementPrintedName || "");
    p.set("dealerSignedDate", formData.agreementDate || todayIso);

    return `/api/onboarding/agreement-preview?${p.toString()}`;
  }, [token, formData, email, resolvedMonthlyFee, todayIso]);

=======
  // NEW: build a full agreement preview right on the page, and keep it auto-filled as the user types
  const agreementPreviewHtml = useMemo(() => {
    if (!invitation) return "";

    const primaryContact =
      formData.fullName ||
      `${invitation.first_name || ""} ${invitation.last_name || ""}`.trim();

    const addressParts = [];
    const addr = String(formData.dealershipAddress || "").trim();
    if (addr) addressParts.push(addr);
    if (!addr && invitation.state) addressParts.push(String(invitation.state));

    const phone = String(formData.dealershipPhone || "").trim();
    const invitePhone = String(invitation.phone || "").trim();
    const phoneToShow = phone || invitePhone;
    if (phoneToShow) addressParts.push(`Phone: ${phoneToShow}`);

    const dealershipAddressForAgreement = addressParts.join(" • ");

    return buildServiceAgreementHtml({
      dealershipName: formData.dealershipName || invitation.company_name || "",
      dealershipAddress: dealershipAddressForAgreement,
      primaryContact,
      dealershipEmail: invitation.email || "",
      monthlySubscriptionFee: resolvedMonthlyFee,
      oneTimeSetupFee: formData.agreementSetupFee || null,
      effectiveDate: formData.agreementEffectiveDate || todayIso,
      dealerPrintedName: formData.agreementPrintedName || "",
      dealerTitle: formData.agreementTitle || "",
      dealerSignedDate: formData.agreementDate || "",
      lotlyPrintedName: "Alec Sennertt",
      lotlyTitle: "Founder",
      lotlySignedDate: formData.agreementDate || "",
    });
  }, [formData, invitation, resolvedMonthlyFee, todayIso]);

  const agreementPreviewUrlHtml = useMemo(() => {
    if (!token) return "";
    return `/api/onboarding/agreement-preview?token=${encodeURIComponent(token)}&format=html`;
  }, [token]);

  const agreementPreviewUrlPdf = useMemo(() => {
    if (!token) return "";
    return `/api/onboarding/agreement-preview?token=${encodeURIComponent(token)}&format=pdf`;
  }, [token]);

>>>>>>> theirs
  const canSubmit = useMemo(() => {
    if (!token) return false;
    if (!email) return false;
    if (!hasStarted) return false;

    if (!formData.fullName.trim()) return false;
    if (!formData.password || formData.password.length < 8) return false;
    if (formData.password !== formData.confirmPassword) return false;
    if (!formData.dealershipName.trim()) return false;

    // agreement required
    if (!formData.agreementAccepted) return false;
    if (!formData.agreementPrintedName.trim()) return false;
    if (!formData.agreementDate) return false;

    return true;
  }, [token, email, hasStarted, formData]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");

    setToken(t);
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/onboarding/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const msg = data?.error || "Invalid or expired invitation";
          throw new Error(msg);
        }
        const data = await res.json();
        setInvitation(data.invitation);
        setAcceptedQuote(data.acceptedQuote || null);

        const prefillName = data?.invitation?.first_name
          ? `${data.invitation.first_name} ${data.invitation.last_name || ""}`.trim()
          : "";

        setFormData((prev) => ({
          ...prev,
          fullName: prev.fullName || prefillName,
          phone: prev.phone || data?.invitation?.phone || "",
          dealershipName:
            prev.dealershipName || data?.invitation?.company_name || "",
          // NEW: prefill dealership phone from what we know at invite-time
          dealershipPhone:
            prev.dealershipPhone || data?.invitation?.phone || "",
          currentDmsProvider:
            prev.currentDmsProvider || data?.invitation?.dms_provider || "",
          agreementPrintedName:
            prev.agreementPrintedName || prev.fullName || prefillName,
          agreementDate: prev.agreementDate || todayIso,
          agreementEffectiveDate: prev.agreementEffectiveDate || todayIso,
          invoicePreference:
            prev.invoicePreference === "stripe_monthly"
              ? "stripe_monthly"
              : "manual",
        }));
      } catch (e) {
        console.error(e);
        setError(e.message || "Could not load your setup link");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [token, todayIso]);

  const update = useCallback((patch) => {
    setFormData((prev) => ({ ...prev, ...patch }));
  }, []);

  const onStart = useCallback(() => {
    setHasStarted(true);
    setError(null);
  }, []);

  const onSubmit = useCallback(async () => {
    setError(null);

    if (!canSubmit) {
      setError("Please fill out all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: formData.password,
          dealershipName: formData.dealershipName,
          dealershipPhone: formData.dealershipPhone,
          dealershipAddress: formData.dealershipAddress,
          userName: formData.fullName,
          userPhone: formData.phone,
          inventorySize: formData.inventorySize,
          wantsDmsSync: Boolean(formData.wantsDmsSync),
          currentDmsProvider: formData.currentDmsProvider,
          invoicePreference: formData.invoicePreference,
          agreement: {
            dealerPrintedName: formData.agreementPrintedName,
            dealerSignedDate: formData.agreementDate,
            monthlySubscriptionFee: resolvedMonthlyFee,
            oneTimeSetupFee: ONE_TIME_SETUP_FEE,
            effectiveDate: formData.agreementEffectiveDate,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.error || "Failed to create your account";
        throw new Error(msg);
      }

      setSuccess(true);
    } catch (e) {
      console.error(e);
      setError(e.message || "Could not complete setup");
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, formData, token, resolvedMonthlyFee, ONE_TIME_SETUP_FEE]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700">Loading your setup link…</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Missing setup link
          </h1>
          <p className="text-gray-600">
            This link is missing a token. Please request a new setup email.
          </p>
          <a
            href="/"
            className="inline-block mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Setup link not valid
          </h1>
          <p className="text-gray-600">{error}</p>
          <a
            href="/"
            className="inline-block mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-7 w-7 text-green-700" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Setup complete
          </h1>
          <p className="text-gray-700">Thanks — we’ve received your details.</p>
          <p className="text-gray-600 mt-3">
            Your first invoice will be sent within <strong>24 hours</strong>.
            Once it’s paid, we’ll enable your account and email you when you can
            sign in.
          </p>
          <a
            href="/"
            className="inline-block mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-xl p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome to Lotly
                </h1>
                <p className="text-gray-600 mt-2">
                  You're about to set up <strong>{companyName}</strong>.
                </p>
                <div className="mt-3 text-sm text-gray-600 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  You'll review & sign the service agreement and choose billing
                  in the next step.
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                <Building2 className="h-4 w-4" />
                <span className="text-sm font-medium">Lotly Setup</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="text-sm text-gray-700 leading-6">
              This will take about 2–3 minutes.
            </div>

            <button
              type="button"
              onClick={onStart}
              className="mt-6 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Start onboarding
            </button>

            <p className="text-xs text-gray-500 mt-4">
              By continuing, you confirm you’re authorized to set up this
              account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Get set up</h1>
              <p className="text-gray-600 mt-2">
                Create your admin account and confirm a few details for{" "}
                <strong>{companyName}</strong>.
              </p>
              <div className="mt-3 text-sm text-gray-600 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                Integration setup is handled by Lotly — no API setup needed
                here.
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <Building2 className="h-4 w-4" />
              <span className="text-sm font-medium">Lotly Setup</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Admin account
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin email
                </label>
                <input
                  value={email}
                  disabled
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 bg-gray-50 text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full name *
                </label>
                <input
                  value={formData.fullName}
                  onChange={(e) => update({ fullName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  value={formData.phone}
                  onChange={(e) => update({ phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => update({ password: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="At least 8 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm password *
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => update({ confirmPassword: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <div className="text-xs text-gray-500">
                Passwords must be at least 8 characters.
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Dealership details
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dealership name *
                </label>
                <input
                  value={formData.dealershipName}
                  onChange={(e) => update({ dealershipName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Your dealership name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dealership phone
                </label>
                <input
                  value={formData.dealershipPhone}
                  onChange={(e) => update({ dealershipPhone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dealership address
                </label>
                <textarea
                  value={formData.dealershipAddress}
                  onChange={(e) =>
                    update({ dealershipAddress: e.target.value })
                  }
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <div className="border-t border-gray-200 pt-4" />

              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-gray-600" />
                Billing preference
              </h3>
              <p className="text-xs text-gray-600 -mt-2">
                This just tells us how you want billing handled. You can change
                it later.
              </p>

              <div className="space-y-2">
                <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="invoicePreference"
                    checked={formData.invoicePreference === "stripe_monthly"}
                    onChange={() =>
                      update({ invoicePreference: "stripe_monthly" })
                    }
                    className="mt-1"
                  />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      Recurring monthly invoice (recommended)
                    </div>
                    <div className="text-xs text-gray-600">
                      We set up an invoice that gets emailed automatically each
                      month.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="invoicePreference"
                    checked={formData.invoicePreference === "manual"}
                    onChange={() => update({ invoicePreference: "manual" })}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      Manual invoice
                    </div>
                    <div className="text-xs text-gray-600">
                      Our team sends you an invoice each month. (This may delay
                      access if missed.)
                    </div>
                  </div>
                </label>
              </div>

              <div className="border-t border-gray-200 pt-4" />

              <h3 className="text-sm font-semibold text-gray-900">
                Quick questionnaire
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated inventory size
                </label>
                <select
                  value={formData.inventorySize}
                  onChange={(e) => update({ inventorySize: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                >
                  <option value="">Select one</option>
                  {INVENTORY_SIZE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="wantsDmsSync"
                  type="checkbox"
                  checked={Boolean(formData.wantsDmsSync)}
                  onChange={(e) => update({ wantsDmsSync: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="wantsDmsSync" className="text-sm text-gray-700">
                  Yes — I want Lotly to pull my inventory from my DMS
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current DMS provider
                </label>
                <input
                  value={formData.currentDmsProvider}
                  onChange={(e) =>
                    update({ currentDmsProvider: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Type your DMS name (e.g. Dominion, Autosoft)"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">
                Service agreement
              </h2>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Please review and sign the Lotly Service Agreement to complete
              setup.
            </p>

<<<<<<< ours
            {agreementPreviewSrc ? (
              <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                <iframe
                  title="Service Agreement Preview"
                  src={agreementPreviewSrc}
                  className="w-full h-[360px]"
                />
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm text-gray-700">
                  Loading agreement preview…
                </div>
              </div>
            )}
=======
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
              <a
                href={agreementPreviewUrlHtml}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-800"
              >
                View full agreement (web)
              </a>
              <a
                href={agreementPreviewUrlPdf}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-800"
              >
                Download PDF
              </a>
            </div>
>>>>>>> theirs

            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              <iframe
                title="Lotly Service Agreement Preview"
                srcDoc={agreementPreviewHtml}
                className="w-full h-[520px]"
              />
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Signature (type your full name) *
                </label>
                <input
                  value={formData.agreementPrintedName}
                  onChange={(e) =>
                    update({ agreementPrintedName: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-4 text-lg italic focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Type your name"
                />
                <div className="text-xs text-gray-500 mt-2">
                  This will be used as your signature on the service agreement.
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.agreementDate}
                  onChange={(e) => update({ agreementDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  One-time setup fee
                </label>
                <input
                  value={`$${ONE_TIME_SETUP_FEE}.00`}
                  disabled
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 bg-gray-50 text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Effective date
                </label>
                <input
                  type="date"
                  value={formData.agreementEffectiveDate}
                  onChange={(e) =>
                    update({ agreementEffectiveDate: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-4 flex items-start gap-3">
              <input
                id="agreementAccepted"
                type="checkbox"
                checked={Boolean(formData.agreementAccepted)}
                onChange={(e) =>
                  update({ agreementAccepted: e.target.checked })
                }
                className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="agreementAccepted"
                className="text-sm text-gray-700"
              >
                I agree to the Lotly Automotive Solutions LLC – Service
                Agreement.
              </label>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
            <a
              href="/"
              className="sm:w-auto w-full px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-center"
            >
              Cancel
            </a>
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting || !canSubmit}
              className="sm:flex-1 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
              Create account & continue
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            By continuing, you confirm you’re authorized to set up this account.
          </p>
        </div>
      </div>
    </div>
  );
}
