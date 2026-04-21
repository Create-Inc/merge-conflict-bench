"use client";

import { useState } from "react";

export default function VoiceTestPage() {
  const [toNumber, setToNumber] = useState("");
  const [message, setMessage] = useState("Hello, this is Praz Pure Water calling.");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const startCall = async () => {
    if (!toNumber.trim()) {
      alert("Please enter a phone number");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/voice/outbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to_number: toNumber.trim(),
          message: message.trim() || null,
        }),
      });

      const data = await response.json().catch(() => null);

      setResult({
        ok: response.ok,
        status: response.status,
        data,
      });
    } catch (error) {
      setResult({
        ok: false,
        status: 0,
        data: {
          error: error?.message || String(error),
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Outbound Call Tester</h1>
        <p className="text-gray-600 mb-8">
          This starts an outbound call using your configured telephony provider
          (Flagman).
        </p>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Number (E.164)
              </label>
              <input
                value={toNumber}
                onChange={(e) => setToNumber(e.target.value)}
                placeholder="+1234567890"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 min-h-[90px]"
              />
            </div>

            <button
              onClick={startCall}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {loading ? "Starting call..." : "Start Call"}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Result</h3>

            <div className="mb-4">
              <span
                className={`inline-block px-3 py-1 rounded ${
                  result.ok
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                Status: {result.status}
              </span>
            </div>

            <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Notes</h3>
          <ul className="list-disc list-inside space-y-2 text-blue-800">
            <li>
              Phone numbers must be in E.164 format (like <code>+15551234567</code>).
            </li>
            <li>
              If this fails, double check your Flagman secrets and the
              <code className="ml-1">FLAGMAN_CALL_URL</code> setting.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
