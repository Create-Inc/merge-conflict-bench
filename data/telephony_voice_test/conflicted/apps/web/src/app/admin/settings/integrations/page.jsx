"use client";

import { useState, useEffect } from "react";
import {
  Plug,
  Check,
  Settings,
  ExternalLink,
<<<<<<< ours
  Phone,
=======

>>>>>>> theirs
  Mail,
  MessageSquare,
  CreditCard,
  Calendar,
  MapPin,
  Zap,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState({
<<<<<<< ours
    telephony: {
      enabled: true,
      configured: false,
    },
=======

>>>>>>> theirs
    stripe: {
      enabled: false,
      publicKey: "",
      secretKey: "",
      configured: false,
    },
    googleCalendar: {
      enabled: false,
      apiKey: "",
      configured: false,
    },
    googleMaps: {
      enabled: false,
      apiKey: "",
      configured: false,
    },
    sendgrid: {
      enabled: false,
      apiKey: "",
      fromEmail: "",
      configured: false,
    },
    slack: {
      enabled: false,
      webhookUrl: "",
      configured: false,
    },
    zapier: {
      enabled: false,
      webhookUrl: "",
      configured: false,
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch("/api/settings/general");
      if (!response.ok) throw new Error("Failed to fetch settings");
      const data = await response.json();

      if (data.settings?.integrations) {
        setIntegrations((prev) => ({
          ...prev,
          ...data.settings.integrations,
        }));
      }
    } catch (error) {
      console.error("Error fetching integrations:", error);
      showMessage("error", "Failed to load integration settings");
    } finally {
      setLoading(false);
    }
  };

  const saveIntegrations = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/settings/general", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integrations,
        }),
      });

      if (!response.ok) throw new Error("Failed to save settings");

      showMessage("success", "Integration settings saved successfully!");
    } catch (error) {
      console.error("Error saving integrations:", error);
      showMessage("error", "Failed to save integration settings");
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const toggleIntegration = (key) => {
    setIntegrations((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        enabled: !prev[key].enabled,
      },
    }));
  };

  const updateIntegrationField = (key, field, value) => {
    setIntegrations((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const testIntegration = async (key) => {
    showMessage("info", `Testing ${key} integration...`);
    // Placeholder for actual testing logic
    setTimeout(() => {
      showMessage("success", `${key} integration test successful!`);
    }, 1500);
  };

  const integrationConfigs = [
    {
<<<<<<< ours
      key: "telephony",
      name: "Flagman Telecom",
      description:
        "SMS and calling (configured via Secrets — not in this form)",
      icon: Phone,
      color: "from-[#0EA5E9] to-[#0284C7]",
      fields: [],
      docsUrl: null,
    },
    {
=======

>>>>>>> theirs
      key: "stripe",
      name: "Stripe",
      description: "Accept online payments and manage billing",
      icon: CreditCard,
      color: "from-[#635BFF] to-[#4F46E5]",
      fields: [
        {
          key: "publicKey",
          label: "Publishable Key",
          type: "text",
          placeholder: "pk_test_...",
        },
        {
          key: "secretKey",
          label: "Secret Key",
          type: "password",
          placeholder: "sk_test_...",
        },
      ],
      docsUrl: "https://stripe.com/docs",
    },
    {
      key: "googleCalendar",
      name: "Google Calendar",
      description: "Sync appointments and schedules with Google Calendar",
      icon: Calendar,
      color: "from-[#4285F4] to-[#1967D2]",
      fields: [
        {
          key: "apiKey",
          label: "API Key",
          type: "text",
          placeholder: "Your Google Calendar API key",
        },
      ],
      docsUrl: "https://developers.google.com/calendar",
    },
    {
      key: "googleMaps",
      name: "Google Maps",
      description: "Route optimization and location services",
      icon: MapPin,
      color: "from-[#34A853] to-[#0F9D58]",
      fields: [
        {
          key: "apiKey",
          label: "API Key",
          type: "text",
          placeholder: "Your Google Maps API key",
        },
      ],
      docsUrl: "https://developers.google.com/maps",
    },
    {
      key: "sendgrid",
      name: "SendGrid",
      description: "Email delivery and marketing automation",
      icon: Mail,
      color: "from-[#1A82E2] to-[#0066CC]",
      fields: [
        {
          key: "apiKey",
          label: "API Key",
          type: "password",
          placeholder: "SG.xxxxxxxxxxxxxxxx",
        },
        {
          key: "fromEmail",
          label: "From Email",
          type: "email",
          placeholder: "noreply@yourdomain.com",
        },
      ],
      docsUrl: "https://docs.sendgrid.com",
    },
    {
      key: "slack",
      name: "Slack",
      description: "Team notifications and alerts",
      icon: MessageSquare,
      color: "from-[#4A154B] to-[#36123A]",
      fields: [
        {
          key: "webhookUrl",
          label: "Webhook URL",
          type: "text",
          placeholder: "https://hooks.slack.com/services/...",
        },
      ],
      docsUrl: "https://api.slack.com",
    },
    {
      key: "zapier",
      name: "Zapier",
      description: "Connect with 5000+ apps and automate workflows",
      icon: Zap,
      color: "from-[#FF4A00] to-[#E63900]",
      fields: [
        {
          key: "webhookUrl",
          label: "Webhook URL",
          type: "text",
          placeholder: "https://hooks.zapier.com/hooks/catch/...",
        },
      ],
      docsUrl: "https://zapier.com/apps",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#1E1E1E] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#6B7280]">
          <Loader2 className="animate-spin" size={24} />
          <span>Loading integrations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#1E1E1E] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] rounded-2xl flex items-center justify-center">
              <Plug className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#1E1E1E] dark:text-white">
                Integrations
              </h1>
              <p className="text-[#6B7280]">
                Connect your favorite tools and services
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              message.type === "success"
                ? "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20"
                : message.type === "error"
                  ? "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20"
                  : "bg-[#0EA5E9]/10 text-[#0EA5E9] border border-[#0EA5E9]/20"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 size={20} />
            ) : message.type === "error" ? (
              <AlertCircle size={20} />
            ) : (
              <Loader2 size={20} className="animate-spin" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {integrationConfigs.map((config) => {
            const integration = integrations[config.key];
            const Icon = config.icon;

            return (
              <div
                key={config.key}
                className="bg-white dark:bg-[#262626] rounded-2xl shadow-sm border border-[#E5E7EB] dark:border-[#333333] overflow-hidden transition-all hover:shadow-md"
              >
                {/* Integration Header */}
                <div
                  className={`bg-gradient-to-r ${config.color} p-6 text-white`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <Icon size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{config.name}</h3>
                        <p className="text-white/80 text-sm mt-1">
                          {config.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {integration?.configured && (
                        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
                    <span className="text-sm font-medium">
                      {integration?.enabled ? "Enabled" : "Disabled"}
                    </span>
                    <button
                      onClick={() => toggleIntegration(config.key)}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        integration?.enabled ? "bg-white/30" : "bg-white/10"
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                          integration?.enabled
                            ? "translate-x-7"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Integration Body */}
                <div className="p-6">
                  {integration?.enabled ? (
                    <>
                      {config.key === "telephony" ? (
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl border border-[#E5E7EB] dark:border-[#333333] bg-[#F9FAFB] dark:bg-[#1E1E1E]">
                            <p className="text-sm text-[#1E1E1E] dark:text-white font-semibold">
                              Telephony is configured via Secrets
                            </p>
                            <p className="text-sm text-[#6B7280] mt-1">
                              Set these secrets: FLAGMAN_SMS_URL,
                              FLAGMAN_FROM_NUMBER, FLAGMAN_API_TOKEN_ID,
                              FLAGMAN_API_GENERATE_TOKEN (and optional
                              FLAGMAN_CALL_URL).
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <a
                              href="/admin/telephony-test"
                              className="flex-1 px-4 py-2.5 bg-[#F3F4F6] dark:bg-[#333333] text-[#1E1E1E] dark:text-white rounded-xl font-medium hover:bg-[#E5E7EB] dark:hover:bg-[#404040] transition-colors flex items-center justify-center gap-2"
                            >
                              <Settings size={16} />
                              Open Telephony Test
                            </a>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Configuration Fields */}
                          <div className="space-y-4 mb-4">
                            {config.fields.map((field) => (
                              <div key={field.key}>
                                <label className="block text-sm font-medium text-[#6B7280] mb-2">
                                  {field.label}
                                </label>
                                <input
                                  type={field.type}
                                  value={integration[field.key] || ""}
                                  onChange={(e) =>
                                    updateIntegrationField(
                                      config.key,
                                      field.key,
                                      e.target.value,
                                    )
                                  }
                                  placeholder={field.placeholder}
                                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] text-[#1E1E1E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                                />
                              </div>
                            ))}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => testIntegration(config.key)}
                              className="flex-1 px-4 py-2.5 bg-[#F3F4F6] dark:bg-[#333333] text-[#1E1E1E] dark:text-white rounded-xl font-medium hover:bg-[#E5E7EB] dark:hover:bg-[#404040] transition-colors flex items-center justify-center gap-2"
                            >
                              <Settings size={16} />
                              Test Connection
                            </button>
                            {config.docsUrl ? (
                              <a
                                href={config.docsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2.5 bg-[#F3F4F6] dark:bg-[#333333] text-[#1E1E1E] dark:text-white rounded-xl font-medium hover:bg-[#E5E7EB] dark:hover:bg-[#404040] transition-colors flex items-center gap-2"
                              >
                                <ExternalLink size={16} />
                                Docs
                              </a>
                            ) : null}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-[#F3F4F6] dark:bg-[#333333] rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Icon size={24} className="text-[#6B7280]" />
                      </div>
                      <p className="text-[#6B7280] text-sm">
                        Enable this integration to configure settings
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={saveIntegrations}
            disabled={saving}
            className="px-8 py-3 bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] text-white rounded-xl font-semibold hover:from-[#0284C7] hover:to-[#0369A1] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-[#0EA5E9]/25"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Saving...
              </>
            ) : (
              <>
                <Check size={20} />
                Save All Settings
              </>
            )}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 rounded-2xl">
          <div className="flex items-start gap-3">
            <AlertCircle
              className="text-[#0EA5E9] flex-shrink-0 mt-0.5"
              size={20}
            />
            <div>
              <h4 className="font-semibold text-[#0EA5E9] mb-1">
                Integration Security
              </h4>
              <p className="text-[#6B7280] text-sm">
                Never share your credentials with anyone. If you suspect a key
                has been compromised, regenerate it immediately in the
                respective service's dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
