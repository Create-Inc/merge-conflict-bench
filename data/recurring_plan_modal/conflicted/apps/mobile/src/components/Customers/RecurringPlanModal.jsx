<<<<<<< ours
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { X, Repeat, Check } from "lucide-react-native";

function Pill({ label, active, onPress, colors }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: active ? "rgba(37,99,235,0.12)" : colors.surfaceMuted,
        borderWidth: 1,
        borderColor: active ? "rgba(37,99,235,0.22)" : colors.border,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
      }}
    >
      {active ? <Check size={14} color={colors.primary} /> : null}
      <Text
        style={{
          color: active ? colors.primary : colors.text,
          fontWeight: "900",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function RecurringPlanModal({
  open,
  onClose,
  onSave,
  saving,
  colors,
  shadow,
  initialPlan,
  techOptions,
  canAssignTech,
}) {
  const [cadenceMonths, setCadenceMonths] = useState(6);
  const [preferredSlot, setPreferredSlot] = useState("am");
  const [status, setStatus] = useState("active");
  const [assignedTechId, setAssignedTechId] = useState(null);

  useEffect(() => {
    if (!open) return;

    const c = Number(initialPlan?.cadence_months);
    setCadenceMonths([3, 6, 12].includes(c) ? c : 6);

    const slot =
      typeof initialPlan?.preferred_slot === "string"
        ? initialPlan.preferred_slot
        : "am";
    setPreferredSlot(["am", "pm", "time"].includes(slot) ? slot : "am");

    const st =
      typeof initialPlan?.status === "string" ? initialPlan.status : "active";
    setStatus(["active", "paused"].includes(st) ? st : "active");

    const techId = initialPlan?.assigned_tech_id;
    setAssignedTechId(techId != null ? Number(techId) : null);
  }, [initialPlan, open]);

  const techLabel = useMemo(() => {
    if (!assignedTechId) return "Unassigned";
    const match = Array.isArray(techOptions)
      ? techOptions.find((t) => Number(t?.id) === Number(assignedTechId))
      : null;
    return match?.name || "Assigned";
  }, [assignedTechId, techOptions]);

  const handleSave = useCallback(() => {
    const payload = {
      cadence_months: cadenceMonths,
      preferred_slot: preferredSlot,
      status,
      assigned_tech_id: assignedTechId,
      duration_mins: 60,
      // start_at is optional; server defaults to now.
    };

    onSave(payload);
  }, [assignedTechId, cadenceMonths, onSave, preferredSlot, status]);

  if (!open) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={open}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.30)",
          padding: 18,
          justifyContent: "flex-end",
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 28,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: "hidden",
            ...shadow.float,
          }}
        >
          <View
            style={{
              paddingHorizontal: 18,
              paddingVertical: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 16,
                  backgroundColor: "rgba(37,99,235,0.12)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Repeat size={18} color={colors.primary} />
              </View>
              <View>
                <Text
                  style={{
                    color: colors.text,
                    fontWeight: "900",
                    fontSize: 16,
                  }}
                >
                  Recurring schedule
                </Text>
                <Text
                  style={{
                    color: colors.textMuted,
                    fontWeight: "700",
                    marginTop: 2,
                  }}
                >
                  Auto-create future jobs
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 40,
                height: 40,
                borderRadius: 16,
                backgroundColor: colors.surfaceMuted,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ maxHeight: 520 }}
            contentContainerStyle={{ padding: 18, paddingBottom: 18, gap: 16 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ gap: 10 }}>
              <Text
                style={{
                  color: colors.textMuted,
                  fontWeight: "900",
                  fontSize: 12,
                }}
              >
                Cadence
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                <Pill
                  label="Every 3 months"
                  active={cadenceMonths === 3}
                  onPress={() => setCadenceMonths(3)}
                  colors={colors}
                />
                <Pill
                  label="Every 6 months"
                  active={cadenceMonths === 6}
                  onPress={() => setCadenceMonths(6)}
                  colors={colors}
                />
                <Pill
                  label="Every 12 months"
                  active={cadenceMonths === 12}
                  onPress={() => setCadenceMonths(12)}
                  colors={colors}
                />
              </View>
            </View>

            <View style={{ gap: 10 }}>
              <Text
                style={{
                  color: colors.textMuted,
                  fontWeight: "900",
                  fontSize: 12,
                }}
              >
                Preferred time
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                <Pill
                  label="AM"
                  active={preferredSlot === "am"}
                  onPress={() => setPreferredSlot("am")}
                  colors={colors}
                />
                <Pill
                  label="PM"
                  active={preferredSlot === "pm"}
                  onPress={() => setPreferredSlot("pm")}
                  colors={colors}
                />
                <Pill
                  label="Specific time"
                  active={preferredSlot === "time"}
                  onPress={() => setPreferredSlot("time")}
                  colors={colors}
                />
              </View>
            </View>

            {canAssignTech ? (
              <View style={{ gap: 10 }}>
                <Text
                  style={{
                    color: colors.textMuted,
                    fontWeight: "900",
                    fontSize: 12,
                  }}
                >
                  Assigned technician
                </Text>

                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}
                >
                  <Pill
                    label="Unassigned"
                    active={!assignedTechId}
                    onPress={() => setAssignedTechId(null)}
                    colors={colors}
                  />

                  {(Array.isArray(techOptions) ? techOptions : [])
                    .slice(0, 8)
                    .map((t) => {
                      const techId = Number(t?.id);
                      if (!Number.isFinite(techId)) {
                        return null;
                      }

                      const isActive = Number(assignedTechId) === techId;
                      return (
                        <Pill
                          key={String(techId)}
                          label={String(t?.name || "Tech")}
                          active={isActive}
                          onPress={() => setAssignedTechId(techId)}
                          colors={colors}
                        />
                      );
                    })}
                </View>

                <Text
                  style={{
                    color: colors.textSubtle,
                    fontWeight: "800",
                    fontSize: 12,
                  }}
                >
                  Selected: {techLabel}
                </Text>
              </View>
            ) : null}

            <View style={{ gap: 10 }}>
              <Text
                style={{
                  color: colors.textMuted,
                  fontWeight: "900",
                  fontSize: 12,
                }}
              >
                Status
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                <Pill
                  label="Active"
                  active={status === "active"}
                  onPress={() => setStatus("active")}
                  colors={colors}
                />
                <Pill
                  label="Paused"
                  active={status === "paused"}
                  onPress={() => setStatus("paused")}
                  colors={colors}
                />
              </View>
            </View>

            <Text
              style={{
                color: colors.textSubtle,
                fontWeight: "800",
                fontSize: 12,
                lineHeight: 16,
              }}
            >
              Tip: after you save, the app will create a couple upcoming jobs so
              they show up on the schedule.
            </Text>
          </ScrollView>

          <View
            style={{
              padding: 16,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              flexDirection: "row",
              gap: 10,
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 18,
                backgroundColor: colors.surfaceMuted,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.text, fontWeight: "900" }}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={Boolean(saving)}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 18,
                backgroundColor: colors.primary,
                alignItems: "center",
                opacity: saving ? 0.7 : 1,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "900" }}>
                {saving ? "Saving…" : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
=======
import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView } from "react-native";
import { X } from "lucide-react-native";

function safeDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatLocalDateTime(d) {
  if (!d) return "—";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function setTimeForSlot(date, slot) {
  const d = new Date(date.getTime());
  if (slot === "pm") {
    d.setHours(13, 0, 0, 0);
    return d;
  }
  // default AM
  d.setHours(9, 0, 0, 0);
  return d;
}

function nextDow(fromDate, dow) {
  const d = new Date(fromDate.getTime());
  const current = d.getDay();
  const delta = (dow - current + 7) % 7;
  if (delta === 0) {
    return d;
  }
  d.setDate(d.getDate() + delta);
  return d;
}

export default function RecurringPlanModal({
  open,
  onClose,
  onSave,
  saving,
  colors,
  shadow,
  initialPlan,
  techOptions,
  canAssignTech,
}) {
  const [cadence, setCadence] = useState(6);
  const [slot, setSlot] = useState("am");
  const [dow, setDow] = useState(null);
  const [assignedTechId, setAssignedTechId] = useState(null);
  const [startAt, setStartAt] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  });

  useEffect(() => {
    if (!open) return;

    const existingStart = safeDate(initialPlan?.start_at);
    const nextCadence = Number(initialPlan?.cadence_months);
    const nextSlot =
      typeof initialPlan?.preferred_slot === "string"
        ? initialPlan.preferred_slot
        : null;

    const nextDowValue =
      initialPlan?.preferred_day_of_week === null ||
      initialPlan?.preferred_day_of_week === undefined
        ? null
        : Number(initialPlan.preferred_day_of_week);

    const nextTechId =
      initialPlan?.assigned_tech_id == null
        ? null
        : Number(initialPlan.assigned_tech_id);

    setCadence([3, 6, 12].includes(nextCadence) ? nextCadence : 6);
    setSlot(
      nextSlot === "pm" || nextSlot === "am" || nextSlot === "time"
        ? nextSlot
        : "am",
    );
    setDow(Number.isFinite(nextDowValue) ? Math.trunc(nextDowValue) : null);
    setAssignedTechId(
      Number.isFinite(nextTechId) ? Math.trunc(nextTechId) : null,
    );

    if (existingStart) {
      setStartAt(existingStart);
      return;
    }

    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 1);
    fallback.setHours(9, 0, 0, 0);
    setStartAt(fallback);
  }, [initialPlan, open]);

  const headerText = initialPlan?.id ? "Edit recurring" : "Set recurring";

  const cadenceOptions = useMemo(() => [3, 6, 12], []);

  const selectedTech = useMemo(() => {
    if (!assignedTechId) return null;
    const opts = Array.isArray(techOptions) ? techOptions : [];
    return opts.find((t) => String(t?.id) === String(assignedTechId)) || null;
  }, [assignedTechId, techOptions]);

  const canSave = Boolean(onSave) && Boolean(startAt) && Boolean(cadence);

  const shiftDay = useCallback(
    (deltaDays) => {
      setStartAt((prev) => {
        const d = new Date(prev.getTime());
        d.setDate(d.getDate() + deltaDays);

        // keep time aligned to slot if slot isn't custom
        if (slot === "am" || slot === "pm") {
          return setTimeForSlot(d, slot);
        }
        return d;
      });
    },
    [slot],
  );

  const setSlotAndTime = useCallback((nextSlot) => {
    setSlot(nextSlot);
    if (nextSlot === "am" || nextSlot === "pm") {
      setStartAt((prev) => setTimeForSlot(prev, nextSlot));
    }
  }, []);

  const setDowAndAlign = useCallback(
    (next) => {
      const nextValue = next === null ? null : Number(next);
      const normalized = Number.isFinite(nextValue)
        ? Math.trunc(nextValue)
        : null;
      setDow(normalized);

      if (normalized == null) return;

      setStartAt((prev) => {
        const aligned = nextDow(prev, normalized);
        if (slot === "am" || slot === "pm") {
          return setTimeForSlot(aligned, slot);
        }
        return aligned;
      });
    },
    [slot],
  );

  const handleSave = useCallback(() => {
    if (!canSave) return;

    const status =
      typeof initialPlan?.status === "string" ? initialPlan.status : "active";

    const payload = {
      cadence_months: cadence,
      start_at: startAt.toISOString(),
      duration_mins: 60,
      preferred_slot: slot,
      preferred_day_of_week: dow,
      assigned_tech_id: canAssignTech ? assignedTechId : null,
      status,
    };

    onSave(payload);
  }, [
    assignedTechId,
    cadence,
    canAssignTech,
    canSave,
    dow,
    initialPlan?.status,
    onSave,
    slot,
    startAt,
  ]);

  const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Modal visible={Boolean(open)} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.35)",
          justifyContent: "flex-end",
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={{ flex: 1 }}
        />

        <View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderWidth: 1,
            borderColor: colors.border,
            paddingBottom: 18,
            ...shadow.card,
          }}
        >
          <View
            style={{
              paddingHorizontal: 18,
              paddingTop: 14,
              paddingBottom: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text
              style={{ color: colors.text, fontWeight: "900", fontSize: 16 }}
            >
              {headerText}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 14,
                backgroundColor: colors.surfaceMuted,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ maxHeight: 520 }}
            contentContainerStyle={{ padding: 18, gap: 14 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Cadence */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 22,
                padding: 14,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  color: colors.textMuted,
                  fontWeight: "900",
                  fontSize: 12,
                }}
              >
                CADENCE
              </Text>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                {cadenceOptions.map((m) => {
                  const selected = cadence === m;
                  const bg = selected
                    ? "rgba(37,99,235,0.12)"
                    : colors.surfaceMuted;
                  const border = selected
                    ? "rgba(37,99,235,0.22)"
                    : colors.border;
                  const textColor = selected ? colors.primary : colors.text;
                  return (
                    <TouchableOpacity
                      key={String(m)}
                      onPress={() => setCadence(m)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: 16,
                        backgroundColor: bg,
                        borderWidth: 1,
                        borderColor: border,
                      }}
                    >
                      <Text style={{ color: textColor, fontWeight: "900" }}>
                        {m} mo
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Start */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 22,
                padding: 14,
                borderWidth: 1,
                borderColor: colors.border,
                gap: 10,
              }}
            >
              <Text
                style={{
                  color: colors.textMuted,
                  fontWeight: "900",
                  fontSize: 12,
                }}
              >
                START
              </Text>
              <Text
                style={{ color: colors.text, fontWeight: "900", fontSize: 16 }}
              >
                {formatLocalDateTime(startAt)}
              </Text>

              <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                <TouchableOpacity
                  onPress={() => shiftDay(-1)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 16,
                    backgroundColor: colors.surfaceMuted,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: "900" }}>
                    -1 day
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => shiftDay(1)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 16,
                    backgroundColor: colors.surfaceMuted,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: "900" }}>
                    +1 day
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                {[
                  { key: "am", label: "AM" },
                  { key: "pm", label: "PM" },
                ].map((opt) => {
                  const selected = slot === opt.key;
                  const bg = selected
                    ? "rgba(37,99,235,0.12)"
                    : colors.surfaceMuted;
                  const border = selected
                    ? "rgba(37,99,235,0.22)"
                    : colors.border;
                  const textColor = selected ? colors.primary : colors.text;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => setSlotAndTime(opt.key)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: 16,
                        backgroundColor: bg,
                        borderWidth: 1,
                        borderColor: border,
                      }}
                    >
                      <Text style={{ color: textColor, fontWeight: "900" }}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text
                style={{
                  color: colors.textSubtle,
                  fontWeight: "800",
                  fontSize: 12,
                }}
              >
                Tip: This is a simple picker for now. If you want an exact time
                picker, tell me.
              </Text>
            </View>

            {/* Weekday */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 22,
                padding: 14,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  color: colors.textMuted,
                  fontWeight: "900",
                  fontSize: 12,
                }}
              >
                PREFERRED DAY (OPTIONAL)
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 10,
                }}
              >
                <TouchableOpacity
                  onPress={() => setDowAndAlign(null)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    borderRadius: 14,
                    backgroundColor:
                      dow == null
                        ? "rgba(37,99,235,0.12)"
                        : colors.surfaceMuted,
                    borderWidth: 1,
                    borderColor:
                      dow == null ? "rgba(37,99,235,0.22)" : colors.border,
                  }}
                >
                  <Text
                    style={{
                      color: dow == null ? colors.primary : colors.text,
                      fontWeight: "900",
                    }}
                  >
                    Any
                  </Text>
                </TouchableOpacity>

                {DOW_LABELS.map((label, index) => {
                  const selected = dow === index;
                  const bg = selected
                    ? "rgba(37,99,235,0.12)"
                    : colors.surfaceMuted;
                  const border = selected
                    ? "rgba(37,99,235,0.22)"
                    : colors.border;
                  const textColor = selected ? colors.primary : colors.text;
                  return (
                    <TouchableOpacity
                      key={label}
                      onPress={() => setDowAndAlign(index)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        borderRadius: 14,
                        backgroundColor: bg,
                        borderWidth: 1,
                        borderColor: border,
                      }}
                    >
                      <Text style={{ color: textColor, fontWeight: "900" }}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Tech */}
            {canAssignTech ? (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 22,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    color: colors.textMuted,
                    fontWeight: "900",
                    fontSize: 12,
                  }}
                >
                  ASSIGNED TECH (OPTIONAL)
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
                    onPress={() => setAssignedTechId(null)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: 16,
                      backgroundColor: !assignedTechId
                        ? "rgba(37,99,235,0.12)"
                        : colors.surfaceMuted,
                      borderWidth: 1,
                      borderColor: !assignedTechId
                        ? "rgba(37,99,235,0.22)"
                        : colors.border,
                    }}
                  >
                    <Text
                      style={{
                        color: !assignedTechId ? colors.primary : colors.text,
                        fontWeight: "900",
                      }}
                    >
                      Unassigned
                    </Text>
                  </TouchableOpacity>

                  {(Array.isArray(techOptions) ? techOptions : [])
                    .slice(0, 8)
                    .map((t) => {
                      const id = t?.id;
                      const label = t?.name || t?.email || "Tech";
                      const selected = String(id) === String(assignedTechId);
                      const bg = selected
                        ? "rgba(37,99,235,0.12)"
                        : colors.surfaceMuted;
                      const border = selected
                        ? "rgba(37,99,235,0.22)"
                        : colors.border;
                      const textColor = selected ? colors.primary : colors.text;

                      return (
                        <TouchableOpacity
                          key={String(id)}
                          onPress={() => setAssignedTechId(id)}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            borderRadius: 16,
                            backgroundColor: bg,
                            borderWidth: 1,
                            borderColor: border,
                          }}
                        >
                          <Text style={{ color: textColor, fontWeight: "900" }}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </View>

                {selectedTech ? (
                  <Text
                    style={{
                      marginTop: 10,
                      color: colors.textSubtle,
                      fontWeight: "800",
                    }}
                  >
                    Assigned to: {selectedTech.name}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {/* Actions */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={!canSave || saving}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 18,
                paddingVertical: 14,
                alignItems: "center",
                opacity: !canSave || saving ? 0.6 : 1,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 15 }}>
                {saving ? "Saving…" : "Save recurring"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={{
                backgroundColor: colors.surfaceMuted,
                borderRadius: 18,
                paddingVertical: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{ color: colors.text, fontWeight: "900", fontSize: 15 }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
>>>>>>> theirs
