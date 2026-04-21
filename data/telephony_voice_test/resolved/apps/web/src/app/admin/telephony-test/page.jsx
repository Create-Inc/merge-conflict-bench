"use client";

import { useMemo, useState } from "react";
import { CheckCircle, XCircle, Loader, Phone, Send } from "lucide-react";

export default function TelephonyTestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [sendingTest, setSendingTest] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [smsResult, setSmsResult] = useState(null);

  const activeProvider = useMemo(() => {
    const provider = result?.data?.status?.provider;
    if (!provider) return null;
    return String(provider);
  }, [result]);

  const testConnection = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/telephony/test");
      const data = await response.json();

      setResult({
        success: Boolean(data?.success),
        data,
      });
    } catch (error) {
      setResult({
        success: false,
        data: {
          error: "Failed to connect",
          details: error?.message || String(error),
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTestSMS = async () => {
    if (!testPhone) {
      alert("Please enter a phone number");
      return;
    }

    setSendingTest(true);
    setSmsResult(null);

    try {
      const response = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testPhone,
          message:
            "Test message from Praz Pure Water. If you got this, Flagman SMS is working.",
        }),
      });

      const data = await response.json();
      setSmsResult(data);
    } catch (error) {
      setSmsResult({
        success: false,
        error: "Failed to send test SMS",
        details: error?.message || String(error),
      });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1E1E1E] dark:text-white mb-2 flex items-center">
          <Phone className="mr-3 text-[#0EA5E9]" size={32} />
          Telephony Test (Flagman Telecom)
        </h1>
        <p className="text-[#6B7280]">
          This checks your Flagman secrets and lets you send a quick test SMS.
        </p>
      </div>

      <div className="bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-[#333333] rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-6">
          <button
            onClick={testConnection}
            disabled={loading}
            className="px-8 py-4 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white rounded-xl font-semibold disabled:opacity-50 hover:shadow-lg transition-shadow flex items-center mx-auto"
          >
            {loading ? (
              <>
                <Loader className="animate-spin mr-2" size={20} />
                Testing...
              </>
            ) : (
              <>
                <Phone className="mr-2" size={20} />
                Test Configuration
              </>
            )}
          </button>
        </div>

        {result && (
          <div className="mt-8">
            <div
              className={`p-6 rounded-xl border-2 ${
                result.success
                  ? "bg-[#ECFDF5] border-[#10B981] dark:bg-[#064e3b]"
                  : "bg-[#FEE2E2] border-[#EF4444] dark:bg-[#7f1d1d]"
              }`}
            >
              <div className="flex items-start">
                {result.success ? (
                  <CheckCircle className="text-[#10B981] mr-3 mt-1" size={24} />
                ) : (
                  <XCircle className="text-[#EF4444] mr-3 mt-1" size={24} />
                )}
                <div className="flex-1">
                  <h3
                    className={`text-lg font-bold mb-2 ${
                      result.success ? "text-[#047857]" : "text-[#DC2626]"
                    }`}
                  >
                    {result.success ? "✓ Ready" : "✗ Not configured"}
                  </h3>

                  {result.success ? (
                    <div className="space-y-3">
                      <div className="bg-white dark:bg-[#1E1E1E] p-4 rounded-lg">
                        <p className="text-sm font-semibold text-[#6B7280] mb-2">
                          Active Provider
                        </p>
                        <p className="text-sm text-[#1E1E1E] dark:text-white">
                          <span className="font-semibold">Provider:</span>{" "}
                          {activeProvider || "unknown"}
                        </p>
                      </div>

                      <div className="bg-white dark:bg-[#1E1E1E] p-4 rounded-lg">
                        <p className="text-sm font-semibold text-[#6B7280] mb-2">
                          Flagman Telecom Secrets
                        </p>
                        <div className="space-y-1 text-sm text-[#1E1E1E] dark:text-white">
                          <p>
                            Endpoint URL (endpoint.php):{" "}
                            {result.data?.status?.flagman?.smsUrl
                              ? "✓ Set"
                              : "✗ Missing"}
                          </p>
                          <p>
                            From Number:{" "}
                            {result.data?.status?.flagman?.fromNumber
                              ? "✓ Set"
                              : "✗ Missing"}
                          </p>
                          <p>
                            Token ID:{" "}
                            {result.data?.status?.flagman?.tokenId
                              ? "✓ Set"
                              : "✗ Missing"}
                          </p>
                          <p>
                            Generate Token:{" "}
                            {result.data?.status?.flagman?.generateToken
                              ? "✓ Set"
                              : "✗ Missing"}
                          </p>
                          <p>
                            SMS Ready:{" "}
                            {result.data?.status?.flagman?.smsConfigured
                              ? "✓ Yes"
                              : "✗ No"}
                          </p>
                          <p>
                            Calls Ready (optional):{" "}
                            {result.data?.status?.flagman?.callConfigured
                              ? "✓ Yes"
                              : "✗ No"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-[#DC2626]">
                        {result.data?.error || "Missing configuration"}
                      </p>
                      {result.data?.instructions && (
                        <div className="bg-white dark:bg-[#1E1E1E] p-4 rounded-lg">
                          <p className="text-sm font-semibold text-[#6B7280] mb-2">
                            How to fix
                          </p>
                          <p className="text-sm text-[#1E1E1E] dark:text-white">
                            {result.data.instructions}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {result && result.success && (
        <div className="bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-[#333333] rounded-2xl p-8 shadow-sm mt-6">
          <h2 className="text-2xl font-bold text-[#1E1E1E] dark:text-white mb-4">
            Send Test SMS
          </h2>
          <p className="text-[#6B7280] mb-6">
            This sends an SMS using Flagman Telecom.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1E1E1E] dark:text-white mb-2">
                Your Phone Number (include country code, e.g., +1234567890)
              </label>
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+12345678901"
                className="w-full px-4 py-3 border border-[#E5E7EB] dark:border-[#333333] rounded-xl focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent bg-white dark:bg-[#262626] text-[#1E1E1E] dark:text-white"
              />
            </div>

            <button
              onClick={sendTestSMS}
              disabled={sendingTest || !testPhone}
              className="px-8 py-3 bg-green-600 text-white rounded-xl font-semibold disabled:opacity-50 hover:shadow-lg transition-shadow flex items-center"
            >
              {sendingTest ? (
                <>
                  <Loader className="animate-spin mr-2" size={20} />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2" size={20} />
                  Send Test SMS
                </>
              )}
            </button>

            {smsResult && (
              <div
                className={`p-6 rounded-xl border-2 ${
                  smsResult.success
                    ? "bg-[#ECFDF5] border-[#10B981] dark:bg-[#064e3b]"
                    : "bg-[#FEE2E2] border-[#EF4444] dark:bg-[#7f1d1d]"
                }`}
              >
                <div className="flex items-start">
                  {smsResult.success ? (
                    <CheckCircle
                      className="text-[#10B981] mr-3 mt-1"
                      size={24}
                    />
                  ) : (
                    <XCircle className="text-[#EF4444] mr-3 mt-1" size={24} />
                  )}
                  <div className="flex-1">
                    <h3
                      className={`text-lg font-bold mb-2 ${
                        smsResult.success ? "text-[#047857]" : "text-[#DC2626]"
                      }`}
                    >
                      {smsResult.success
                        ? "✓ SMS Sent Successfully"
                        : "✗ SMS Failed"}
                    </h3>

                    {smsResult.success ? (
                      <div className="space-y-3">
                        <div className="bg-white dark:bg-[#1E1E1E] p-4 rounded-lg space-y-2 text-sm">
                          <p className="text-[#047857] dark:text-[#10B981] font-semibold">
                            ✓ Message accepted by provider
                          </p>
                          {smsResult.provider && (
                            <p className="text-[#6B7280]">
                              <strong>Provider:</strong> {smsResult.provider}
                            </p>
                          )}
                          <p className="text-[#6B7280]">
                            <strong>Message ID:</strong> {smsResult.sid}
                          </p>
                          <p className="text-[#6B7280]">
                            <strong>Status:</strong> {smsResult.status}
                          </p>
                          <p className="text-[#6B7280]">
                            <strong>To:</strong> {smsResult.to}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm text-[#DC2626]">
                        <p>
                          <strong>Error:</strong> {smsResult.error}
                        </p>
                        {smsResult.details && (
                          <p>
                            <strong>Details:</strong> {smsResult.details}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 p-6 bg-[#F3F4F6] dark:bg-[#262626] rounded-xl">
        <h3 className="font-semibold text-[#1E1E1E] dark:text-white mb-3">
          Required Secrets (Flagman)
        </h3>
        <ul className="text-sm text-[#6B7280] space-y-2">
          <li>• FLAGMAN_SMS_URL (full endpoint.php URL)</li>
          <li>• FLAGMAN_FROM_NUMBER</li>
          <li>• FLAGMAN_API_TOKEN_ID</li>
          <li>• FLAGMAN_API_GENERATE_TOKEN</li>
          <li>• (optional, for calls) FLAGMAN_CALL_URL</li>
        </ul>
      </div>
    </div>
  );
}
