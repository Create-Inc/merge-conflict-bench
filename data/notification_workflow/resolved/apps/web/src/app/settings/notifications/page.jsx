"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bell, Mail, Save } from "lucide-react";
import useUser from "@/utils/useUser";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";

function ToggleRow({ title, description, value, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="min-w-0">
        <div className="font-medium text-gray-900">{title}</div>
        <div className="text-sm text-gray-600 mt-1">{description}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          value ? "bg-blue-600" : "bg-gray-200"
        }`}
        aria-label={title}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
            value ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function NotificationSettingsPage() {
  const { data: user, loading: userLoading } = useUser();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window !== "undefined" && !userLoading && !user) {
      window.location.href =
        "/account/signin?callbackUrl=/settings/notifications";
    }
  }, [user, userLoading]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["notificationSettings"],
    queryFn: async () => {
      const response = await fetch("/api/notifications/settings");
      if (!response.ok) {
        throw new Error(
          `When fetching /api/notifications/settings, the response was [${response.status}] ${response.statusText}`,
        );
      }
      return response.json();
    },
    enabled: !!user,
  });

  const settings = data?.settings;

  const [local, setLocal] = useState(null);
  const hydrated = useMemo(() => local || settings || null, [local, settings]);

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await fetch("/api/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `When updating /api/notifications/settings, the response was [${response.status}] ${response.statusText}. ${text}`,
        );
      }
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.setQueryData(["notificationSettings"], result);
      setLocal(null);
      toast.success("Notification settings saved");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Could not save notification settings");
    },
  });

  const shouldRedirect = !userLoading && !user;
  const shouldShowAuthLoading = userLoading || shouldRedirect;

  if (shouldShowAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const onUpdate = (patch) => {
    if (!hydrated) {
      return;
    }
    setLocal({ ...hydrated, ...patch });
  };

  const isDirty = !!local;

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />

      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/settings" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-6 h-6" />
              </a>
              <div className="flex items-center gap-2">
                <Bell className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">
                  Notifications
                </h1>
              </div>
            </div>

            <button
              onClick={() => {
                if (!hydrated) {
                  return;
                }
                const payload = {
                  workflow_success: !!hydrated.workflow_success,
                  workflow_failure: !!hydrated.workflow_failure,
                  workflow_activity: hydrated.workflow_activity !== false,
                  team_invites: !!hydrated.team_invites,
                  billing_updates: !!hydrated.billing_updates,
                  performance_alerts: !!hydrated.performance_alerts,
                  product_updates: !!hydrated.product_updates,
                  important_updates: !!hydrated.important_updates,
                  email_on_broadcast: !!hydrated.email_on_broadcast,
                  email: hydrated.email || null,
                };
                saveMutation.mutate(payload);
              }}
              disabled={!hydrated || saveMutation.isPending || !isDirty}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              Save
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-12 text-gray-600">Loading...</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            Could not load notification settings
          </div>
        ) : !hydrated ? (
          <div className="text-center py-12 text-gray-600">No settings</div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                In-app alerts
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Control what shows up in your notifications feed.
              </p>

              <div className="divide-y divide-gray-200">
                <ToggleRow
                  title="Important updates"
                  description="Get critical product and service updates."
                  value={!!hydrated.important_updates}
                  onChange={(v) => onUpdate({ important_updates: v })}
                />
                <ToggleRow
                  title="New features"
                  description="Get notified when new features ship."
                  value={!!hydrated.product_updates}
                  onChange={(v) => onUpdate({ product_updates: v })}
                />
                <ToggleRow
                  title="Performance alerts"
                  description="Get notified when performance issues are detected."
                  value={!!hydrated.performance_alerts}
                  onChange={(v) => onUpdate({ performance_alerts: v })}
                />
                <ToggleRow
                  title="Workflow activity"
                  description="Workflow created/imported/installed events."
                  value={hydrated.workflow_activity !== false}
                  onChange={(v) => onUpdate({ workflow_activity: v })}
                />
                <ToggleRow
                  title="Workflow failures"
                  description="Get a notification when a workflow run fails."
                  value={!!hydrated.workflow_failure}
                  onChange={(v) => onUpdate({ workflow_failure: v })}
                />
                <ToggleRow
                  title="Workflow successes"
                  description="Get a notification when a workflow completes successfully."
                  value={!!hydrated.workflow_success}
                  onChange={(v) => onUpdate({ workflow_success: v })}
                />
                <ToggleRow
                  title="Team invites"
                  description="Get a notification when you're invited to a team."
                  value={!!hydrated.team_invites}
                  onChange={(v) => onUpdate({ team_invites: v })}
                />
                <ToggleRow
                  title="Billing updates"
                  description="Get a notification when subscription or billing changes happen."
                  value={!!hydrated.billing_updates}
                  onChange={(v) => onUpdate({ billing_updates: v })}
                />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Email</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Optional: send important broadcasts to email too.
              </p>

              <div className="divide-y divide-gray-200">
                <ToggleRow
                  title="Email on important updates"
                  description='When an "Important update" is broadcast, also send it to your email.'
                  value={!!hydrated.email_on_broadcast}
                  onChange={(v) => onUpdate({ email_on_broadcast: v })}
                />
              </div>

              <div className="mt-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email destination
                </label>
                <input
                  value={hydrated.email || ""}
                  onChange={(e) => onUpdate({ email: e.target.value })}
                  placeholder={user?.email || "you@example.com"}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Leave blank to use your account email.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
