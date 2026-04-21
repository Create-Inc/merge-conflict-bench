<<<<<<< ours
import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
=======
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
>>>>>>> theirs
import { BarChart3, RefreshCw } from "lucide-react-native";
import safeFetchJson from "@/utils/safeFetchJson";

async function fetchApiUsageReport() {
  return await safeFetchJson(
    "/api/admin/reports?kind=api-usage",
    { method: "GET" },
    { name: "/api/admin/reports?kind=api-usage" },
  );
}

async function saveApiUsageReset(reset) {
  return await safeFetchJson(
    "/api/admin/reports?kind=api-usage",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set-reset", reset }),
    },
    { name: "POST /api/admin/reports?kind=api-usage" },
  );
}

function safeNum(n) {
  const x = Number(n || 0);
  return Number.isFinite(x) ? x : 0;
}

function formatHourLabel(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch (_) {
    return String(iso || "");
  }
}

<<<<<<< ours
const RESET_DEFAULT = {
  hour: 3,
  ampm: "am",
  timeZone: "America/New_York",
  timeZoneLabel: "EST",
};

const TZ_OPTIONS = [
  { label: "EST", value: "America/New_York" },
  { label: "PST", value: "America/Los_Angeles" },
  { label: "UTC", value: "UTC" },
];

=======
function tzLabel(tz) {
  if (tz === "America/New_York") return "EST";
  if (tz === "America/Los_Angeles") return "PST";
  if (tz === "UTC") return "UTC";
  return String(tz || "EST");
}

function normalizeReset(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const hour12 = Math.max(1, Math.min(12, Number(r.hour12 || 3)));
  const ampm = String(r.ampm || "pm").toLowerCase() === "am" ? "am" : "pm";

  const tzRaw = String(r.timeZone || "America/New_York");
  const allowed = ["America/New_York", "America/Los_Angeles", "UTC"];
  const timeZone = allowed.includes(tzRaw) ? tzRaw : "America/New_York";

  return { hour12, ampm, timeZone };
}

>>>>>>> theirs
export default function ApiUsageReportSection() {
  const qc = useQueryClient();

  const usageQuery = useQuery({
    queryKey: ["adminApiUsage"],
    queryFn: fetchApiUsageReport,
    staleTime: 10_000,
  });

  const serverReset = usageQuery.data?.reset || null;

  const [resetHour, setResetHour] = useState(RESET_DEFAULT.hour);
  const [resetAmpm, setResetAmpm] = useState(RESET_DEFAULT.ampm);
  const [resetTzLabel, setResetTzLabel] = useState(RESET_DEFAULT.timeZoneLabel);
  const [resetTzValue, setResetTzValue] = useState(RESET_DEFAULT.timeZone);

  useEffect(() => {
    if (!serverReset) return;

    const hour = Number(serverReset?.hour);
    const ampm =
      String(serverReset?.ampm || "").toLowerCase() === "pm" ? "pm" : "am";

    const tz =
      String(serverReset?.timeZone || "").trim() || RESET_DEFAULT.timeZone;
    const tzLabel =
      String(serverReset?.timeZoneLabel || "").trim() ||
      RESET_DEFAULT.timeZoneLabel;

    if (Number.isFinite(hour) && hour >= 1 && hour <= 12) {
      setResetHour(hour);
    }
    setResetAmpm(ampm);
    setResetTzValue(tz);
    setResetTzLabel(tzLabel);
  }, [serverReset]);

  const saveResetMutation = useMutation({
    mutationFn: async () => {
      return await safeFetchJson(
        "/api/admin/reports?kind=api-usage",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "set-reset",
            reset: {
              hour: resetHour,
              ampm: resetAmpm,
              timeZone: resetTzValue,
              timeZoneLabel: resetTzLabel,
            },
          }),
        },
        { name: "/api/admin/reports?kind=api-usage (set-reset)" },
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminApiUsage"] });
    },
  });

  const confirmSaveReset = useCallback(() => {
    Alert.alert(
      "Save reset time?",
      `This changes what "Today" means in the API usage report.\n\nNew reset: ${resetHour} ${resetAmpm.toUpperCase()} ${resetTzLabel}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save",
          style: "default",
          onPress: () => saveResetMutation.mutate(),
        },
      ],
    );
  }, [resetHour, resetAmpm, resetTzLabel, saveResetMutation]);

  const groups = Array.isArray(usageQuery.data?.groups)
    ? usageQuery.data.groups
    : [];

  const resetFromServer = useMemo(
    () => normalizeReset(usageQuery.data?.reset),
    [usageQuery.data?.reset],
  );

  const [resetDraft, setResetDraft] = useState(resetFromServer);

  useEffect(() => {
    setResetDraft(resetFromServer);
  }, [resetFromServer]);

  const saveResetMutation = useMutation({
    mutationFn: async (nextReset) => {
      return await saveApiUsageReset(nextReset);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminApiUsage"] });
    },
  });

  const note = useMemo(() => {
    const todayStart = usageQuery.data?.windows?.todayStart || null;
    const todayTzLabel = usageQuery.data?.windows?.todayTimeZoneLabel || null;
    const monthStart = usageQuery.data?.windows?.monthStart || null;
    const yearStart = usageQuery.data?.windows?.yearStart || null;
    if (!todayStart && !monthStart && !yearStart) return null;

    const reset = normalizeReset(usageQuery.data?.reset);
    const resetText = `Resets daily at ${reset.hour12} ${reset.ampm.toUpperCase()} ${tzLabel(reset.timeZone)}`;

    const t = todayStart
      ? new Date(todayStart).toLocaleString(undefined, {
          hour: "numeric",
          minute: "2-digit",
          month: "numeric",
          day: "numeric",
        })
      : null;
    const m = monthStart ? new Date(monthStart).toLocaleDateString() : null;
    const y = yearStart ? new Date(yearStart).toLocaleDateString() : null;

<<<<<<< ours
    const todayText = t
      ? `Today starts ${t} ${todayTzLabel || ""}`.trim()
      : null;
=======
    const todayText = t
      ? `Today window starts ${t} (${tzLabel(todayTz)})`
      : null;
>>>>>>> theirs
    const restText = `MTD starts ${m || "?"} • YTD starts ${y || "?"}`;

    return todayText
      ? `${resetText} • ${todayText} • ${restText}`
      : `${resetText} • ${restText}`;
  }, [
    usageQuery.data?.windows?.todayStart,
    usageQuery.data?.windows?.todayTimeZoneLabel,
    usageQuery.data?.windows?.monthStart,
    usageQuery.data?.windows?.yearStart,
    usageQuery.data?.reset,
  ]);

<<<<<<< ours
  // NEW: Reset time picker modal
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerKind, setPickerKind] = useState(null); // 'hour' | 'tz'

  const openHourPicker = () => {
    setPickerKind("hour");
    setPickerOpen(true);
  };

  const openTzPicker = () => {
    setPickerKind("tz");
    setPickerOpen(true);
  };

  const closePicker = () => {
    setPickerOpen(false);
    setPickerKind(null);
  };

  // NEW: modal to drill down YouTube by hour
=======
  // Modal to drill down YouTube by hour
>>>>>>> theirs
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [timelineGroupKey, setTimelineGroupKey] = useState(null);

  const timelineRows = useMemo(() => {
    if (!timelineGroupKey) return [];
    const g = groups.find((x) => x.groupKey === timelineGroupKey);
    return Array.isArray(g?.timeline) ? g.timeline : [];
  }, [groups, timelineGroupKey]);

  const biggestHour = useMemo(() => {
    if (!timelineRows.length) return null;
    let best = null;
    for (const r of timelineRows) {
      const total = safeNum(r?.totals?.attempts);
      if (!best || total > safeNum(best?.totals?.attempts)) {
        best = r;
      }
    }
    return best;
  }, [timelineRows]);

  // Reset picker modal
  const [resetPickerOpen, setResetPickerOpen] = useState(false);
  const [resetPickerField, setResetPickerField] = useState(null); // 'hour' | 'ampm' | 'tz'

  const tzOptions = useMemo(
    () => [
      { label: "EST", value: "America/New_York" },
      { label: "PST", value: "America/Los_Angeles" },
      { label: "UTC", value: "UTC" },
    ],
    [],
  );

  const hourOptions = useMemo(
    () => Array.from({ length: 12 }, (_, i) => i + 1),
    [],
  );

  const canSaveReset =
    !usageQuery.isLoading &&
    !saveResetMutation.isPending &&
    resetDraft?.hour12 &&
    resetDraft?.ampm &&
    resetDraft?.timeZone;

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <BarChart3 size={18} color="#93C5FD" />
        <Text style={{ color: "#E5E7EB", fontWeight: "900" }}>
          API usage (Today / MTD / YTD)
        </Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={() => usageQuery.refetch()}
          activeOpacity={0.85}
          style={{
            backgroundColor: "rgba(255,255,255,0.08)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.10)",
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            opacity: usageQuery.isFetching ? 0.7 : 1,
          }}
        >
          <RefreshCw size={16} color="#E5E7EB" />
          <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "800" }}>
            Refresh
          </Text>
        </TouchableOpacity>
      </View>

      {/* NEW: daily reset control */}
      <View
        style={{
          backgroundColor: "rgba(0,0,0,0.35)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.12)",
          borderRadius: 14,
          padding: 12,
        }}
      >
        <Text style={{ color: "#E5E7EB", fontWeight: "900" }}>
          Daily reset time (Today counters)
        </Text>
        <Text style={{ color: "#9CA3AF", fontSize: 12, marginTop: 6 }}>
          This does not delete or reset the raw metrics. It just changes the
          cutoff used when we compute “Today”. Default is 3AM EST.
        </Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
            marginTop: 10,
          }}
        >
          <TouchableOpacity
            onPress={openHourPicker}
            activeOpacity={0.85}
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.12)",
              borderRadius: 999,
              paddingVertical: 10,
              paddingHorizontal: 12,
            }}
          >
            <Text style={{ color: "#E5E7EB", fontWeight: "900" }}>
              {String(resetHour)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setResetAmpm((v) => (v === "am" ? "pm" : "am"))}
            activeOpacity={0.85}
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.12)",
              borderRadius: 999,
              paddingVertical: 10,
              paddingHorizontal: 12,
            }}
          >
            <Text style={{ color: "#E5E7EB", fontWeight: "900" }}>
              {resetAmpm.toUpperCase()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={openTzPicker}
            activeOpacity={0.85}
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.12)",
              borderRadius: 999,
              paddingVertical: 10,
              paddingHorizontal: 12,
            }}
          >
            <Text style={{ color: "#E5E7EB", fontWeight: "900" }}>
              {resetTzLabel}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={confirmSaveReset}
            disabled={saveResetMutation.isPending || usageQuery.isLoading}
            activeOpacity={0.85}
            style={{
              backgroundColor: saveResetMutation.isPending
                ? "rgba(255,255,255,0.10)"
                : "rgba(167,139,250,0.85)",
              borderWidth: 1,
              borderColor: saveResetMutation.isPending
                ? "rgba(255,255,255,0.12)"
                : "rgba(167,139,250,0.35)",
              borderRadius: 999,
              paddingVertical: 10,
              paddingHorizontal: 12,
              opacity: saveResetMutation.isPending ? 0.7 : 1,
            }}
          >
            <Text
              style={{
                color: "#0F0F23",
                fontWeight: "900",
              }}
            >
              {saveResetMutation.isPending ? "Saving…" : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        {saveResetMutation.isError ? (
          <Text style={{ color: "#FCA5A5", fontSize: 12, marginTop: 8 }}>
            {saveResetMutation.error?.message || "Could not save reset time."}
          </Text>
        ) : null}
        {saveResetMutation.isSuccess ? (
          <Text style={{ color: "#34D399", fontSize: 12, marginTop: 8 }}>
            Saved. “Today” now starts at {String(resetHour)}{" "}
            {resetAmpm.toUpperCase()} {resetTzLabel}.
          </Text>
        ) : null}
      </View>

      <Text style={{ color: "#9CA3AF", fontSize: 12, lineHeight: 18 }}>
        This tracks real external API calls (YouTube / Spotify / TMDB) and also
        the Movie Quotes provider chain.
      </Text>

      {/* Daily reset controls */}
      <View
        style={{
          backgroundColor: "rgba(255,255,255,0.04)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.10)",
          borderRadius: 14,
          padding: 12,
          gap: 10,
        }}
      >
        <Text style={{ color: "#E5E7EB", fontWeight: "900" }}>
          Daily reset (Today counters)
        </Text>
        <Text style={{ color: "#9CA3AF", fontSize: 12, lineHeight: 18 }}>
          Pick when the "Today" window resets for ALL tracked providers. Default
          is 3 PM EST.
        </Text>

        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
          <PillButton
            label={String(resetDraft.hour12)}
            onPress={() => {
              setResetPickerField("hour");
              setResetPickerOpen(true);
            }}
          />
          <PillButton
            label={resetDraft.ampm.toUpperCase()}
            onPress={() => {
              setResetPickerField("ampm");
              setResetPickerOpen(true);
            }}
          />
          <PillButton
            label={tzLabel(resetDraft.timeZone)}
            onPress={() => {
              setResetPickerField("tz");
              setResetPickerOpen(true);
            }}
          />

          <View style={{ flex: 1 }} />

          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                "Save reset time",
                `Set daily reset to ${resetDraft.hour12} ${resetDraft.ampm.toUpperCase()} ${tzLabel(resetDraft.timeZone)}?`,
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Save",
                    style: "default",
                    onPress: () => saveResetMutation.mutate(resetDraft),
                  },
                ],
              );
            }}
            disabled={!canSaveReset}
            activeOpacity={0.85}
            style={{
              backgroundColor: canSaveReset
                ? "rgba(147,197,253,0.18)"
                : "rgba(255,255,255,0.06)",
              borderWidth: 1,
              borderColor: canSaveReset
                ? "rgba(147,197,253,0.35)"
                : "rgba(255,255,255,0.10)",
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 10,
              opacity: canSaveReset ? 1 : 0.8,
            }}
          >
            <Text style={{ color: "#E5E7EB", fontWeight: "900" }}>
              {saveResetMutation.isPending ? "Saving…" : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        {saveResetMutation.isError ? (
          <Text style={{ color: "#FCA5A5", fontSize: 12 }}>
            {saveResetMutation.error?.message || "Could not save reset time."}
          </Text>
        ) : null}
      </View>

      {note ? (
        <Text style={{ color: "#6B7280", fontSize: 12 }}>{note}</Text>
      ) : null}

      {usageQuery.isLoading ? (
        <Text style={{ color: "#9CA3AF", fontSize: 12 }}>Loading…</Text>
      ) : usageQuery.error ? (
        <Text style={{ color: "#FCA5A5", fontSize: 12 }}>
          {usageQuery.error?.message || "Could not load usage."}
        </Text>
      ) : (
        <View style={{ gap: 12 }}>
          {groups.map((g) => {
            const providers = Array.isArray(g?.providers) ? g.providers : [];
            const isYouTube = g.groupKey === "youtube";
            const unitLabel = isYouTube ? "units" : "calls";

            const hasTimeline = Array.isArray(g?.timeline) && g.timeline.length;

            const biggestHourLabel =
              isYouTube && hasTimeline && biggestHour?.windowStart
                ? formatHourLabel(biggestHour.windowStart)
                : null;
            const biggestHourUnits =
              isYouTube && hasTimeline
                ? safeNum(biggestHour?.totals?.attempts)
                : null;

            return (
              <View
                key={g.groupKey}
                style={{
                  backgroundColor: "rgba(0,0,0,0.35)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.12)",
                  borderRadius: 14,
                  padding: 12,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#E5E7EB", fontWeight: "900" }}>
                      {g.label || g.groupKey}
                    </Text>
                    {isYouTube ? (
                      <Text
                        style={{ color: "#6B7280", fontSize: 12, marginTop: 6 }}
                      >
                        Note: YouTube “Search” costs 100 units per call. The
                        numbers here are quota units.
                      </Text>
                    ) : null}

                    {isYouTube && hasTimeline && biggestHourLabel ? (
                      <Text
                        style={{ color: "#9CA3AF", fontSize: 12, marginTop: 6 }}
                      >
                        Biggest hour today: {biggestHourLabel} •{" "}
                        {String(biggestHourUnits)} units
                      </Text>
                    ) : null}
                  </View>

                  {isYouTube && hasTimeline ? (
                    <TouchableOpacity
                      onPress={() => {
                        setTimelineGroupKey(g.groupKey);
                        setTimelineOpen(true);
                      }}
                      activeOpacity={0.85}
                      style={{
                        backgroundColor: "rgba(255,255,255,0.08)",
                        borderWidth: 1,
                        borderColor: "rgba(255,255,255,0.10)",
                        borderRadius: 12,
                        paddingHorizontal: 10,
                        paddingVertical: 10,
                      }}
                    >
                      <Text
                        style={{
                          color: "#E5E7EB",
                          fontWeight: "900",
                          fontSize: 12,
                        }}
                      >
                        Hourly breakdown
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <View style={{ marginTop: 10, gap: 10 }}>
                  {providers.map((p) => {
                    const t = p?.usage?.today || {};
                    const m = p?.usage?.month || {};
                    const y = p?.usage?.year || {};

                    const tAttempts = safeNum(t.attempts);
                    const tMisses = safeNum(t.misses);
                    const tBlocked = safeNum(t.blocked);

                    const mAttempts = safeNum(m.attempts);
                    const yAttempts = safeNum(y.attempts);

                    const mMisses = safeNum(m.misses);
                    const yMisses = safeNum(y.misses);

                    const mBlocked = safeNum(m.blocked);
                    const yBlocked = safeNum(y.blocked);

                    return (
                      <View
                        key={`${g.groupKey}:${p.key}`}
                        style={{
                          backgroundColor: "rgba(255,255,255,0.04)",
                          borderWidth: 1,
                          borderColor: "rgba(255,255,255,0.08)",
                          borderRadius: 12,
                          padding: 12,
                        }}
                      >
                        <Text
                          style={{
                            color: "#E5E7EB",
                            fontWeight: "900",
                            fontSize: 12,
                          }}
                        >
                          {p.label || p.key}
                        </Text>
                        <Text
                          style={{
                            color: "#6B7280",
                            fontSize: 11,
                            marginTop: 4,
                          }}
                        >
                          {p.key}
                        </Text>

                        <View
                          style={{
                            flexDirection: "row",
                            gap: 10,
                            marginTop: 10,
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: "#9CA3AF", fontSize: 11 }}>
                              Today
                            </Text>
                            <Text
                              style={{ color: "#E5E7EB", fontWeight: "900" }}
                            >
                              {String(tAttempts)} {unitLabel}
                            </Text>
                            <Text
                              style={{
                                color: "#9CA3AF",
                                fontSize: 11,
                                marginTop: 2,
                              }}
                            >
                              {String(tMisses)} misses
                            </Text>
                            {tBlocked ? (
                              <Text
                                style={{
                                  color: "#FCA5A5",
                                  fontSize: 11,
                                  marginTop: 2,
                                }}
                              >
                                {String(tBlocked)} blocked
                              </Text>
                            ) : null}
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text style={{ color: "#9CA3AF", fontSize: 11 }}>
                              MTD
                            </Text>
                            <Text
                              style={{ color: "#E5E7EB", fontWeight: "900" }}
                            >
                              {String(mAttempts)} {unitLabel}
                            </Text>
                            <Text
                              style={{
                                color: "#9CA3AF",
                                fontSize: 11,
                                marginTop: 2,
                              }}
                            >
                              {String(mMisses)} misses
                            </Text>
                            {mBlocked ? (
                              <Text
                                style={{
                                  color: "#FCA5A5",
                                  fontSize: 11,
                                  marginTop: 2,
                                }}
                              >
                                {String(mBlocked)} blocked
                              </Text>
                            ) : null}
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text style={{ color: "#9CA3AF", fontSize: 11 }}>
                              YTD
                            </Text>
                            <Text
                              style={{ color: "#E5E7EB", fontWeight: "900" }}
                            >
                              {String(yAttempts)} {unitLabel}
                            </Text>
                            <Text
                              style={{
                                color: "#9CA3AF",
                                fontSize: 11,
                                marginTop: 2,
                              }}
                            >
                              {String(yMisses)} misses
                            </Text>
                            {yBlocked ? (
                              <Text
                                style={{
                                  color: "#FCA5A5",
                                  fontSize: 11,
                                  marginTop: 2,
                                }}
                              >
                                {String(yBlocked)} blocked
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      )}

<<<<<<< ours
      {/* NEW: picker modal (hour / timezone) */}
=======
      {/* Timeline modal */}
>>>>>>> theirs
      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={closePicker}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.65)",
            padding: 16,
            justifyContent: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "#0B1220",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.10)",
              padding: 14,
              maxHeight: "80%",
            }}
          >
            <Text style={{ color: "#E5E7EB", fontWeight: "900", fontSize: 14 }}>
              {pickerKind === "tz" ? "Time Zone" : "Hour"}
            </Text>

            <ScrollView
              style={{ marginTop: 12 }}
              contentContainerStyle={{ gap: 10, paddingBottom: 6 }}
              showsVerticalScrollIndicator={false}
            >
              {pickerKind === "tz"
                ? TZ_OPTIONS.map((opt) => {
                    const active = opt.label === resetTzLabel;
                    return (
                      <TouchableOpacity
                        key={opt.label}
                        onPress={() => {
                          setResetTzLabel(opt.label);
                          setResetTzValue(opt.value);
                          closePicker();
                        }}
                        activeOpacity={0.85}
                        style={{
                          backgroundColor: active
                            ? "rgba(167,139,250,0.20)"
                            : "rgba(255,255,255,0.06)",
                          borderWidth: 1,
                          borderColor: active
                            ? "rgba(167,139,250,0.35)"
                            : "rgba(255,255,255,0.10)",
                          borderRadius: 12,
                          padding: 12,
                        }}
                      >
                        <Text style={{ color: "#E5E7EB", fontWeight: "900" }}>
                          {opt.label}
                        </Text>
                        <Text
                          style={{
                            color: "#9CA3AF",
                            fontSize: 12,
                            marginTop: 4,
                          }}
                        >
                          {opt.value}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                : Array.from({ length: 12 }).map((_, i) => {
                    const h = i + 1;
                    const active = h === resetHour;
                    return (
                      <TouchableOpacity
                        key={String(h)}
                        onPress={() => {
                          setResetHour(h);
                          closePicker();
                        }}
                        activeOpacity={0.85}
                        style={{
                          backgroundColor: active
                            ? "rgba(147,197,253,0.16)"
                            : "rgba(255,255,255,0.06)",
                          borderWidth: 1,
                          borderColor: active
                            ? "rgba(147,197,253,0.25)"
                            : "rgba(255,255,255,0.10)",
                          borderRadius: 12,
                          padding: 12,
                        }}
                      >
                        <Text style={{ color: "#E5E7EB", fontWeight: "900" }}>
                          {String(h)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
            </ScrollView>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <TouchableOpacity
                onPress={closePicker}
                activeOpacity={0.9}
                style={{
                  flex: 1,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.12)",
                  borderRadius: 12,
                  paddingVertical: 10,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#E5E7EB", fontWeight: "900" }}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={timelineOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTimelineOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.65)",
            padding: 16,
            justifyContent: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "#0B1220",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.10)",
              padding: 14,
              maxHeight: "80%",
            }}
          >
            <Text style={{ color: "#E5E7EB", fontWeight: "900", fontSize: 14 }}>
              YouTube hourly quota usage
            </Text>
            <Text
              style={{
                color: "#9CA3AF",
                fontSize: 12,
                marginTop: 6,
                lineHeight: 16,
              }}
            >
              This is the "story" behind the YouTube totals: each row is an
              hour. Search is expensive (100 units per call).
            </Text>

            <ScrollView
              style={{ marginTop: 12 }}
              contentContainerStyle={{ gap: 10, paddingBottom: 6 }}
              showsVerticalScrollIndicator={false}
            >
              {timelineRows.length === 0 ? (
                <Text style={{ color: "#9CA3AF" }}>No hourly data yet.</Text>
              ) : (
                timelineRows
                  .slice()
                  .reverse()
                  .map((r) => {
                    const searchUnits = safeNum(r?.providers?.search?.attempts);
                    const videosUnits = safeNum(r?.providers?.videos?.attempts);
                    const totalUnits = safeNum(r?.totals?.attempts);

                    const isSpike = totalUnits >= 800;

                    return (
                      <View
                        key={String(r?.windowStart)}
                        style={{
                          backgroundColor: isSpike
                            ? "rgba(239,68,68,0.10)"
                            : "rgba(255,255,255,0.06)",
                          borderWidth: 1,
                          borderColor: isSpike
                            ? "rgba(239,68,68,0.25)"
                            : "rgba(255,255,255,0.10)",
                          borderRadius: 12,
                          padding: 12,
                        }}
                      >
                        <Text style={{ color: "#E5E7EB", fontWeight: "900" }}>
                          {formatHourLabel(r.windowStart)}
                        </Text>
                        <Text
                          style={{
                            color: "#9CA3AF",
                            fontSize: 12,
                            marginTop: 6,
                          }}
                        >
                          Total: {String(totalUnits)} units
                        </Text>
                        <Text
                          style={{
                            color: "#9CA3AF",
                            fontSize: 12,
                            marginTop: 2,
                          }}
                        >
                          Search: {String(searchUnits)} • Videos:{" "}
                          {String(videosUnits)}
                        </Text>
                        {isSpike ? (
                          <Text
                            style={{
                              color: "#FCA5A5",
                              fontSize: 12,
                              marginTop: 6,
                            }}
                          >
                            Spike hour. This is usually ~
                            {Math.round(searchUnits / 100)} search calls.
                          </Text>
                        ) : null}
                      </View>
                    );
                  })
              )}
            </ScrollView>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <TouchableOpacity
                onPress={() => setTimelineOpen(false)}
                activeOpacity={0.9}
                style={{
                  flex: 1,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.12)",
                  borderRadius: 12,
                  paddingVertical: 10,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#E5E7EB", fontWeight: "900" }}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reset picker modal */}
      <Modal
        visible={resetPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setResetPickerOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.65)",
            padding: 16,
            justifyContent: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "#0B1220",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.10)",
              padding: 14,
              maxHeight: "75%",
            }}
          >
            <Text style={{ color: "#E5E7EB", fontWeight: "900", fontSize: 14 }}>
              {resetPickerField === "hour"
                ? "Pick hour"
                : resetPickerField === "ampm"
                  ? "Pick AM / PM"
                  : "Pick time zone"}
            </Text>

            <ScrollView
              style={{ marginTop: 12 }}
              contentContainerStyle={{ gap: 10, paddingBottom: 6 }}
              showsVerticalScrollIndicator={false}
            >
              {resetPickerField === "hour"
                ? hourOptions.map((h) => (
                    <PickerRow
                      key={`h:${h}`}
                      label={String(h)}
                      active={resetDraft.hour12 === h}
                      onPress={() => {
                        setResetDraft((prev) => ({ ...prev, hour12: h }));
                        setResetPickerOpen(false);
                      }}
                    />
                  ))
                : resetPickerField === "ampm"
                  ? ["am", "pm"].map((a) => (
                      <PickerRow
                        key={`a:${a}`}
                        label={a.toUpperCase()}
                        active={resetDraft.ampm === a}
                        onPress={() => {
                          setResetDraft((prev) => ({ ...prev, ampm: a }));
                          setResetPickerOpen(false);
                        }}
                      />
                    ))
                  : tzOptions.map((t) => (
                      <PickerRow
                        key={`t:${t.value}`}
                        label={t.label}
                        subLabel={t.value}
                        active={resetDraft.timeZone === t.value}
                        onPress={() => {
                          setResetDraft((prev) => ({
                            ...prev,
                            timeZone: t.value,
                          }));
                          setResetPickerOpen(false);
                        }}
                      />
                    ))}
            </ScrollView>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <TouchableOpacity
                onPress={() => setResetPickerOpen(false)}
                activeOpacity={0.9}
                style={{
                  flex: 1,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.12)",
                  borderRadius: 12,
                  paddingVertical: 10,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#E5E7EB", fontWeight: "900" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function PillButton({ label, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        backgroundColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 10,
      }}
    >
      <Text style={{ color: "#E5E7EB", fontWeight: "900", fontSize: 12 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function PickerRow({ label, subLabel, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{
        backgroundColor: active
          ? "rgba(147,197,253,0.18)"
          : "rgba(255,255,255,0.06)",
        borderWidth: 1,
        borderColor: active
          ? "rgba(147,197,253,0.35)"
          : "rgba(255,255,255,0.10)",
        borderRadius: 12,
        padding: 12,
      }}
    >
      <Text style={{ color: "#E5E7EB", fontWeight: "900" }}>{label}</Text>
      {subLabel ? (
        <Text style={{ color: "#6B7280", fontSize: 11, marginTop: 4 }}>
          {subLabel}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}
