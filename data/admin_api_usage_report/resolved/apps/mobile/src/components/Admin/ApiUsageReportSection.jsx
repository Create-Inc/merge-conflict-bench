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

export default function ApiUsageReportSection() {
  const qc = useQueryClient();

  const usageQuery = useQuery({
    queryKey: ["adminApiUsage"],
    queryFn: fetchApiUsageReport,
    staleTime: 10_000,
  });

  const groups = Array.isArray(usageQuery.data?.groups)
    ? usageQuery.data.groups
    : [];

  const serverReset = usageQuery.data?.reset || null;

  const [resetHour, setResetHour] = useState(RESET_DEFAULT.hour);
  const [resetAmpm, setResetAmpm] = useState(RESET_DEFAULT.ampm);
  const [resetTzLabel, setResetTzLabel] = useState(RESET_DEFAULT.timeZoneLabel);
  const [resetTzValue, setResetTzValue] = useState(RESET_DEFAULT.timeZone);

  useEffect(() => {
    if (!serverReset) return;

    // accept both hour and hour12, just in case
    const hour = Number(serverReset?.hour ?? serverReset?.hour12);
    const ampmRaw = String(serverReset?.ampm || "").toLowerCase();
    const ampm = ampmRaw === "pm" ? "pm" : "am";

    const tz =
      String(serverReset?.timeZone || "").trim() || RESET_DEFAULT.timeZone;

    const labelFromValue =
      TZ_OPTIONS.find((x) => x.value === tz)?.label || RESET_DEFAULT.timeZoneLabel;

    const tzLabel =
      String(serverReset?.timeZoneLabel || "").trim() || labelFromValue;

    if (Number.isFinite(hour) && hour >= 1 && hour <= 12) {
      setResetHour(hour);
    }

    setResetAmpm(ampm);
    setResetTzValue(tz);
    setResetTzLabel(tzLabel);
  }, [serverReset]);

  const saveResetMutation = useMutation({
    mutationFn: async () => {
      return await saveApiUsageReset({
        hour: resetHour,
        ampm: resetAmpm,
        timeZone: resetTzValue,
        timeZoneLabel: resetTzLabel,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminApiUsage"] });
    },
  });

  const confirmSaveReset = useCallback(() => {
    Alert.alert(
      "Save reset time?",
      `This changes what \"Today\" means in the API usage report.\n\nNew reset: ${resetHour} ${resetAmpm.toUpperCase()} ${resetTzLabel}`,
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

  const note = useMemo(() => {
    const todayStart = usageQuery.data?.windows?.todayStart || null;
    const todayTzLabel = usageQuery.data?.windows?.todayTimeZoneLabel || null;
    const monthStart = usageQuery.data?.windows?.monthStart || null;
    const yearStart = usageQuery.data?.windows?.yearStart || null;

    if (!todayStart && !monthStart && !yearStart) return null;

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

    const todayText = t
      ? `Today window starts ${t} ${todayTzLabel || ""}`.trim()
      : null;

    const resetText = `Resets daily at ${resetHour} ${resetAmpm.toUpperCase()} ${resetTzLabel}`;
    const restText = `MTD starts ${m || "?"} • YTD starts ${y || "?"}`;

    return todayText ? `${resetText} • ${todayText} • ${restText}` : `${resetText} • ${restText}`;
  }, [
    usageQuery.data?.windows?.todayStart,
    usageQuery.data?.windows?.todayTimeZoneLabel,
    usageQuery.data?.windows?.monthStart,
    usageQuery.data?.windows?.yearStart,
    resetHour,
    resetAmpm,
    resetTzLabel,
  ]);

  // Reset time picker modal
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerKind, setPickerKind] = useState(null); // 'hour' | 'tz'

  const closePicker = () => {
    setPickerOpen(false);
    setPickerKind(null);
  };

  // modal to drill down YouTube by hour
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

      {/* Daily reset controls */}
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
          Default is 3AM EST. This does not delete metrics — it only changes the
          cutoff used to compute the “Today” window.
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
            onPress={() => {
              setPickerKind("hour");
              setPickerOpen(true);
            }}
            activeOpacity={0.85}
            style={pillStyle()}
          >
            <Text style={pillTextStyle()}>{String(resetHour)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setResetAmpm((v) => (v === "am" ? "pm" : "am"))}
            activeOpacity={0.85}
            style={pillStyle()}
          >
            <Text style={pillTextStyle()}>{resetAmpm.toUpperCase()}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setPickerKind("tz");
              setPickerOpen(true);
            }}
            activeOpacity={0.85}
            style={pillStyle()}
          >
            <Text style={pillTextStyle()}>{resetTzLabel}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={confirmSaveReset}
            disabled={saveResetMutation.isPending || usageQuery.isLoading}
            activeOpacity={0.85}
            style={{
              ...pillStyle(),
              backgroundColor: saveResetMutation.isPending
                ? "rgba(255,255,255,0.10)"
                : "rgba(167,139,250,0.85)",
              borderColor: saveResetMutation.isPending
                ? "rgba(255,255,255,0.12)"
                : "rgba(167,139,250,0.35)",
              opacity: saveResetMutation.isPending ? 0.7 : 1,
            }}
          >
            <Text
              style={{
                color: "#0F0F23",
                fontWeight: "900",
                fontSize: 12,
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
            Saved.
          </Text>
        ) : null}
      </View>

      <Text style={{ color: "#9CA3AF", fontSize: 12, lineHeight: 18 }}>
        This tracks real external API calls (YouTube / Spotify / TMDB) and also
        the Movie Quotes provider chain.
      </Text>

      {note ? <Text style={{ color: "#6B7280", fontSize: 12 }}>{note}</Text> : null}

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
                      <Text style={{ color: "#6B7280", fontSize: 12, marginTop: 6 }}>
                        Note: YouTube “Search” costs 100 units per call. The
                        numbers here are quota units.
                      </Text>
                    ) : null}

                    {isYouTube && hasTimeline && biggestHourLabel ? (
                      <Text style={{ color: "#9CA3AF", fontSize: 12, marginTop: 6 }}>
                        Biggest hour today: {biggestHourLabel} • {String(biggestHourUnits)} units
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
                      <Text style={{ color: "#E5E7EB", fontWeight: "900", fontSize: 12 }}>
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
                    const mMisses = safeNum(m.misses);
                    const mBlocked = safeNum(m.blocked);

                    const yAttempts = safeNum(y.attempts);
                    const yMisses = safeNum(y.misses);
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
                        <Text style={{ color: "#E5E7EB", fontWeight: "900", fontSize: 12 }}>
                          {p.label || p.key}
                        </Text>
                        <Text style={{ color: "#6B7280", fontSize: 11, marginTop: 4 }}>
                          {p.key}
                        </Text>

                        <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                          <MiniUsageCol
                            title="Today"
                            amount={`${String(tAttempts)} ${unitLabel}`}
                            misses={`${String(tMisses)} misses`}
                            blocked={tBlocked ? `${String(tBlocked)} blocked` : null}
                          />
                          <MiniUsageCol
                            title="MTD"
                            amount={`${String(mAttempts)} ${unitLabel}`}
                            misses={`${String(mMisses)} misses`}
                            blocked={mBlocked ? `${String(mBlocked)} blocked` : null}
                          />
                          <MiniUsageCol
                            title="YTD"
                            amount={`${String(yAttempts)} ${unitLabel}`}
                            misses={`${String(yMisses)} misses`}
                            blocked={yBlocked ? `${String(yBlocked)} blocked` : null}
                          />
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

      {/* picker modal (hour / timezone) */}
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
                        style={pickerRowStyle(active, "tz")}
                      >
                        <Text style={{ color: "#E5E7EB", fontWeight: "900" }}>
                          {opt.label}
                        </Text>
                        <Text style={{ color: "#9CA3AF", fontSize: 12, marginTop: 4 }}>
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
                        style={pickerRowStyle(active, "hour")}
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
                <Text style={{ color: "#E5E7EB", fontWeight: "900" }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* YouTube hourly modal */}
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
            <Text style={{ color: "#9CA3AF", fontSize: 12, marginTop: 6, lineHeight: 16 }}>
              Each row is an hour. Search is expensive (100 units per call).
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
                        <Text style={{ color: "#9CA3AF", fontSize: 12, marginTop: 6 }}>
                          Total: {String(totalUnits)} units
                        </Text>
                        <Text style={{ color: "#9CA3AF", fontSize: 12, marginTop: 2 }}>
                          Search: {String(searchUnits)} • Videos: {String(videosUnits)}
                        </Text>
                        {isSpike ? (
                          <Text style={{ color: "#FCA5A5", fontSize: 12, marginTop: 6 }}>
                            Spike hour. This is usually ~{Math.round(searchUnits / 100)} search calls.
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
                <Text style={{ color: "#E5E7EB", fontWeight: "900" }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function pillStyle() {
  return {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
  };
}

function pillTextStyle() {
  return { color: "#E5E7EB", fontWeight: "900", fontSize: 12 };
}

function pickerRowStyle(active, kind) {
  const isTz = kind === "tz";
  return {
    backgroundColor: active
      ? isTz
        ? "rgba(167,139,250,0.20)"
        : "rgba(147,197,253,0.16)"
      : "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: active
      ? isTz
        ? "rgba(167,139,250,0.35)"
        : "rgba(147,197,253,0.25)"
      : "rgba(255,255,255,0.10)",
    borderRadius: 12,
    padding: 12,
  };
}

function MiniUsageCol({ title, amount, misses, blocked }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: "#9CA3AF", fontSize: 11 }}>{title}</Text>
      <Text style={{ color: "#E5E7EB", fontWeight: "900" }}>{amount}</Text>
      <Text style={{ color: "#9CA3AF", fontSize: 11, marginTop: 2 }}>{misses}</Text>
      {blocked ? (
        <Text style={{ color: "#FCA5A5", fontSize: 11, marginTop: 2 }}>{blocked}</Text>
      ) : null}
    </View>
  );
}
