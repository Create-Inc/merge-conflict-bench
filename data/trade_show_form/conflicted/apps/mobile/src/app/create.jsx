<<<<<<< ours
import { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Pressable,
  Modal,
  Keyboard,
  Platform,
} from "react-native";
=======
import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
>>>>>>> theirs
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
<<<<<<< ours
import { Calendar } from "react-native-calendars";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
} from "lucide-react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
=======
import { ArrowLeft, Plus } from "lucide-react-native";
>>>>>>> theirs
import { useAuth } from "@/utils/auth/useAuth";
import { useColors, useTheme } from "@/utils/theme";
import BrandLogo from "@/components/BrandLogo";
import useViewerEmployee from "@/hooks/useViewerEmployee";
<<<<<<< ours
import { openWebPath } from "@/utils/openWeb";
=======
import UsDateField from "@/components/UsDateField";
import { usDateToIso } from "@/utils/usDate";
import TaskTemplateSelectorMobile from "@/components/TaskTemplateSelectorMobile";
>>>>>>> theirs

<<<<<<< ours
function normalizeRole(role) {
  const r = String(role || "")
    .trim()
    .toLowerCase();
  if (r === "member") return "employee";
  if (r === "finance") return "manager";
  if (r === "coordinator") return "employee";
  return r;
}

function canCreateTradeShowsFromEmployee(employee) {
  const role = normalizeRole(employee?.role);
  return role === "admin" || role === "manager";
}

function pad2(n) {
  const s = String(n);
  return s.length === 1 ? `0${s}` : s;
}

function normalizeUsDateInput(raw) {
  const digits = String(raw || "")
    .replace(/\D/g, "")
    .slice(0, 8);

  const mm = digits.slice(0, 2);
  const dd = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);

  if (digits.length <= 2) return mm;
  if (digits.length <= 4) return `${mm}/${dd}`;
  return `${mm}/${dd}/${yyyy}`;
}

function formatIsoToUsDate(value) {
  const raw = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "";
  const [y, m, d] = raw.split("-");
  return `${m}/${d}/${y}`;
}

function isValidDateParts({ year, month, day }) {
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return false;
  }
  if (year < 1900 || year > 2200) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const dt = new Date(year, month - 1, day);
  return (
    dt.getFullYear() === year &&
    dt.getMonth() === month - 1 &&
    dt.getDate() === day
  );
}

function usDateToIso(value) {
  const raw = String(value || "").trim();
  if (!raw) return { iso: "", error: "Date is required" };

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { iso: raw, error: null };
  }

  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 8) {
    return { iso: null, error: "Use 8 digits (MMDDYYYY)" };
  }

  const month = Number(digits.slice(0, 2));
  const day = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));

  if (!isValidDateParts({ year, month, day })) {
    return { iso: null, error: "Invalid date" };
  }

  return { iso: `${year}-${pad2(month)}-${pad2(day)}`, error: null };
}

async function fetchJson(url, options) {
  const r = await fetch(url, options);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error(
      data?.error ||
        `When fetching ${url}, the response was [${r.status}] ${r.statusText}`,
    );
  }
  return data;
}

async function createTradeShowApi(payload) {
  return fetchJson("/api/tradeshows", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function markedSingleDate(iso, color) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(String(iso))) return {};
  return {
    [iso]: {
      selected: true,
      selectedColor: color,
      selectedTextColor: "#FFFFFF",
    },
  };
}

=======
function normalizeRole(role) {
  const r = String(role || "")
    .trim()
    .toLowerCase();
  if (r === "member") return "employee";
  if (r === "finance") return "manager";
  if (r === "coordinator") return "employee";
  return r;
}

function canCreateTradeShowsFromEmployee(employee) {
  const role = normalizeRole(employee?.role);
  return role === "admin" || role === "manager";
}

async function createTradeShowApi(payload) {
  const r = await fetch("/api/tradeshows", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error(
      data?.error ||
        `When fetching /api/tradeshows, the response was [${r.status}] ${r.statusText}`,
    );
  }
  return data;
}

>>>>>>> theirs
export default function CreateScreen() {
  const COLORS = useColors();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { isReady, isAuthenticated, signIn } = useAuth();
  const { data: meData, loading: meLoading } = useViewerEmployee(
    isReady && isAuthenticated,
  );

  const canCreate = useMemo(() => {
    return canCreateTradeShowsFromEmployee(meData?.employee);
  }, [meData?.employee]);

  const [form, setForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
    city: "",
    venue: "",
    task_template_id: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

<<<<<<< ours
  const inputRefs = useRef({});
  const [dateKeyOpen, setDateKeyOpen] = useState(null); // 'start_date' | 'end_date' | null
  const [typingKey, setTypingKey] = useState(null); // allow typing without reopening calendar

  const qc = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ["task-templates"],
    queryFn: async () => fetchJson("/api/task-templates"),
    staleTime: 1000 * 60,
=======
    task_template_id: "",
>>>>>>> theirs
  });

<<<<<<< ours
  const templates = useMemo(() => {
    const list = Array.isArray(templatesQuery.data?.templates)
      ? templatesQuery.data.templates
      : [];
    return list;
  }, [templatesQuery.data]);
=======
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
>>>>>>> theirs

<<<<<<< ours
  const selectedTemplateId = useMemo(() => {
    const n = Number(form.task_template_id);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  }, [form.task_template_id]);

  const selectedTemplateIndex = useMemo(() => {
    if (!selectedTemplateId) return -1;
    return templates.findIndex((t) => Number(t?.id) === selectedTemplateId);
  }, [templates, selectedTemplateId]);
=======
  const inputStyle = {
    height: 46,
    paddingHorizontal: 16,
    backgroundColor: COLORS.bg.tertiary,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    borderRadius: 12,
    color: COLORS.text.primary,
    fontSize: 14,
  };
>>>>>>> theirs

<<<<<<< ours
  const selectedTemplate = useMemo(() => {
    return selectedTemplateIndex >= 0 ? templates[selectedTemplateIndex] : null;
  }, [templates, selectedTemplateIndex]);

  const goPrevTemplate = useCallback(() => {
    if (!templates.length) return;
    const idx = selectedTemplateIndex >= 0 ? selectedTemplateIndex : 0;
    const nextIdx = idx <= 0 ? templates.length - 1 : idx - 1;
    setForm((prev) => ({
      ...prev,
      task_template_id: String(templates[nextIdx]?.id || ""),
    }));
  }, [selectedTemplateIndex, templates]);

  const goNextTemplate = useCallback(() => {
    if (!templates.length) return;
    const idx = selectedTemplateIndex >= 0 ? selectedTemplateIndex : -1;
    const nextIdx = idx >= templates.length - 1 ? 0 : idx + 1;
    setForm((prev) => ({
      ...prev,
      task_template_id: String(templates[nextIdx]?.id || ""),
    }));
  }, [selectedTemplateIndex, templates]);

  const [createTplOpen, setCreateTplOpen] = useState(false);
  const [tplName, setTplName] = useState("");
  const [tplDesc, setTplDesc] = useState("");
  const [tplItems, setTplItems] = useState([
    { title: "", relative_days: 0 },
    { title: "", relative_days: 0 },
    { title: "", relative_days: 0 },
  ]);

  const createTplMutation = useMutation({
    mutationFn: async (payload) =>
      fetchJson("/api/task-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: ["task-templates"] });
      const createdId = data?.template?.id;
      if (createdId) {
        setForm((prev) => ({ ...prev, task_template_id: String(createdId) }));
      }
      setCreateTplOpen(false);
      setTplName("");
      setTplDesc("");
      setTplItems([
        { title: "", relative_days: 0 },
        { title: "", relative_days: 0 },
        { title: "", relative_days: 0 },
      ]);
    },
  });

  const inputStyle = useMemo(
    () => ({
      height: 46,
      paddingHorizontal: 16,
      backgroundColor: COLORS.bg.tertiary,
      borderWidth: 1,
      borderColor: COLORS.border.primary,
      borderRadius: 12,
      color: COLORS.text.primary,
      fontSize: 14,
    }),
    [COLORS],
  );

  const labelStyle = useMemo(
    () => ({
      color: COLORS.text.secondary,
      fontSize: 12,
      fontWeight: "800",
      marginBottom: 8,
    }),
    [COLORS],
  );

=======

>>>>>>> theirs
  const handleBack = useCallback(() => {
    try {
      const canGoBack =
        typeof router?.canGoBack === "function" ? router.canGoBack() : false;
      if (canGoBack) {
        router.back();
        return;
      }
      router.replace("/(tabs)/tradeshows");
    } catch (e) {
      console.error(e);
      router.replace("/(tabs)/tradeshows");
    }
  }, [router]);

<<<<<<< ours
  const setField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const openDatePicker = useCallback(
    (key) => {
      setDateKeyOpen(key);
      setTypingKey(null);
      try {
        Keyboard.dismiss();
        inputRefs.current[key]?.blur?.();
      } catch {
        // ignore
      }
    },
    [setDateKeyOpen],
  );

  const closePickerToType = useCallback(
    (key) => {
      setDateKeyOpen(null);
      setTypingKey(key);
      try {
        setTimeout(() => {
          inputRefs.current[key]?.focus?.();
        }, 50);
      } catch {
        // ignore
      }
    },
    [setDateKeyOpen],
  );

  const selectedIsoForPicker = useMemo(() => {
    const key = dateKeyOpen;
    if (!key) return null;
    const raw = String(form[key] || "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const parsed = usDateToIso(raw);
    return parsed?.error ? null : parsed.iso;
  }, [dateKeyOpen, form]);

  const dateDisplayValue = useCallback((raw) => {
    const s = String(raw || "");
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return formatIsoToUsDate(s);
    return normalizeUsDateInput(s);
  }, []);

  const submit = useCallback(async () => {
    setError(null);

    const name = String(form.name || "").trim();
    if (!name) {
      setError("Show name is required");
      return;
    }

    const startParsed = usDateToIso(form.start_date);
    if (startParsed?.error) {
      setError(`Start date: ${startParsed.error}`);
      return;
    }

    const endParsed = usDateToIso(form.end_date);
    if (endParsed?.error) {
      setError(`End date: ${endParsed.error}`);
      return;
    }

    const taskTemplateId = selectedTemplateId;

    const payload = {
      name,
      start_date: startParsed.iso,
      end_date: endParsed.iso,
      city: String(form.city || "").trim() || null,
      venue: String(form.venue || "").trim() || null,
      task_template_id: taskTemplateId,
    };

    setSaving(true);
    try {
      const created = await createTradeShowApi(payload);
      const id = created?.id;
      if (id) {
        router.replace(`/tradeshow/${id}`);
      } else {
        router.replace("/(tabs)/tradeshows");
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Could not create trade show");
    } finally {
      setSaving(false);
    }
  }, [form, router, selectedTemplateId]);

  const submitCreateTemplate = useCallback(() => {
    const name = String(tplName || "").trim();
    if (!name) return;

    const items = tplItems
      .map((it, idx) => {
        const title = String(it?.title || "").trim();
        if (!title) return null;
        const rel = Number(it?.relative_days);
        const relative_days = Number.isFinite(rel) ? Math.trunc(rel) : 0;
        return {
          title,
          description: null,
          category: "Other",
          priority: "medium",
          relative_days,
          sort_order: idx,
        };
      })
      .filter(Boolean);

    if (items.length === 0) return;

    createTplMutation.mutate({
      name,
      description: String(tplDesc || "").trim() || null,
      items,
    });
  }, [createTplMutation, tplDesc, tplItems, tplName]);

=======
  const onChange = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const submit = useCallback(async () => {
    setError(null);

    const name = String(form.name || "").trim();
    if (!name) {
      setError("Show name is required");
      return;
    }

    const startParsed = usDateToIso(form.start_date);
    if (startParsed?.error) {
      setError(`Start date: ${startParsed.error}`);
      return;
    }

    const endParsed = usDateToIso(form.end_date);
    if (endParsed?.error) {
      setError(`End date: ${endParsed.error}`);
      return;
    }

    const templateIdNum = Number(form.task_template_id);
    const taskTemplateId =
      Number.isFinite(templateIdNum) && templateIdNum > 0
        ? templateIdNum
        : null;

    const payload = {
      ...form,
      name,
      start_date: startParsed.iso,
      end_date: endParsed.iso,
      task_template_id: taskTemplateId,
    };

    setSaving(true);
    try {
      const created = await createTradeShowApi(payload);
      const id = created?.id;
      if (id) {
        router.replace(`/tradeshow/${id}`);
      } else {
        router.replace("/(tabs)/tradeshows");
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Could not create trade show");
    } finally {
      setSaving(false);
    }
  }, [form, router]);

>>>>>>> theirs
  if (isReady && !isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg.primary }}>
        <StatusBar style={theme === "light" ? "dark" : "light"} />

        <View style={{ paddingTop: insets.top + 18, paddingHorizontal: 20 }}>
          <BrandLogo size="auth" />
          <Text
            style={{
              marginTop: 10,
              color: COLORS.text.secondary,
              fontSize: 14,
            }}
          >
            Sign in to create a trade show.
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 20,
          }}
        >
          <TouchableOpacity
            onPress={() => signIn()}
            activeOpacity={0.9}
            style={{
              width: "100%",
              maxWidth: 360,
              paddingVertical: 14,
              backgroundColor: COLORS.brand,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "800" }}>
              Sign in
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isReady && isAuthenticated && !meLoading && !canCreate) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg.primary }}>
        <StatusBar style={theme === "light" ? "dark" : "light"} />

        <View
          style={{
            paddingTop: insets.top + 18,
            paddingHorizontal: 20,
            paddingBottom: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <TouchableOpacity
            onPress={handleBack}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: COLORS.bg.chip,
              borderWidth: 1,
              borderColor: COLORS.border.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowLeft size={18} color={COLORS.text.primary} />
          </TouchableOpacity>

          <Text
            style={{
              color: COLORS.text.primary,
              fontSize: 20,
              fontWeight: "900",
            }}
          >
            Create show
          </Text>
        </View>

        <View style={{ padding: 20 }}>
          <View
            style={{
              borderRadius: 18,
              backgroundColor: COLORS.bg.tertiary,
              borderWidth: 1,
              borderColor: COLORS.border.primary,
              padding: 16,
            }}
          >
            <Text style={{ color: COLORS.text.primary, fontWeight: "900" }}>
              You don’t have access
            </Text>
            <Text
              style={{
                marginTop: 6,
                color: COLORS.text.secondary,
                fontSize: 13,
              }}
            >
              Ask an Admin to upgrade your role to Manager.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const isPickerOpen = Boolean(dateKeyOpen);
  const pickerTitle =
    dateKeyOpen === "start_date"
      ? "Start date"
      : dateKeyOpen === "end_date"
        ? "End date"
        : "";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.bg.primary }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style={theme === "light" ? "dark" : "light"} />

<<<<<<< ours
        <View
          style={{
            paddingTop: insets.top + 18,
            paddingHorizontal: 20,
            paddingBottom: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TouchableOpacity
              onPress={handleBack}
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: COLORS.bg.chip,
                borderWidth: 1,
                borderColor: COLORS.border.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ArrowLeft size={18} color={COLORS.text.primary} />
            </TouchableOpacity>
=======
      <View
        style={{
          paddingTop: insets.top + 18,
          paddingHorizontal: 20,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity
            onPress={handleBack}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: COLORS.bg.chip,
              borderWidth: 1,
              borderColor: COLORS.border.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowLeft size={18} color={COLORS.text.primary} />
          </TouchableOpacity>
>>>>>>> theirs

<<<<<<< ours
            <View>
              <Text
                style={{
                  color: COLORS.text.primary,
                  fontSize: 20,
                  fontWeight: "900",
                }}
              >
                Create show
              </Text>
              <Text
                style={{
                  color: COLORS.text.secondary,
                  fontSize: 12,
                  fontWeight: "700",
                  marginTop: 2,
                }}
              >
                Tap a date to pick, or X out and type 8 digits.
              </Text>
            </View>
          </View>

          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: `${COLORS.brand}15`,
              borderWidth: 1,
              borderColor: COLORS.border.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Plus size={18} color={COLORS.brand} />
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 24,
=======
          <View>
            <Text
              style={{
                color: COLORS.text.primary,
                fontSize: 20,
                fontWeight: "900",
              }}
            >
              Create show
            </Text>
            <Text
              style={{
                color: COLORS.text.secondary,
                fontSize: 12,
                fontWeight: "700",
                marginTop: 2,
              }}
            >
              Tap a date to pick, or type 8 digits.
            </Text>
          </View>
        </View>

        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: `${COLORS.brand}15`,
            borderWidth: 1,
            borderColor: COLORS.border.primary,
            alignItems: "center",
            justifyContent: "center",
>>>>>>> theirs
          }}
<<<<<<< ours
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
=======

>>>>>>> theirs
        >
<<<<<<< ours
          {error ? (
            <View
              style={{
                borderRadius: 16,
                backgroundColor: `${COLORS.bad}15`,
                borderWidth: 1,
                borderColor: COLORS.bad,
                padding: 12,
                marginTop: 10,
              }}
            >
              <Text style={{ color: COLORS.bad, fontWeight: "900" }}>
                {error}
              </Text>
            </View>
          ) : null}
=======
          <Plus size={18} color={COLORS.brand} />
        </View>
      </View>
>>>>>>> theirs

<<<<<<< ours
          <View style={{ marginTop: 14 }}>
            <Text style={labelStyle}>Trade show name</Text>
            <TextInput
              value={form.name}
              onChangeText={(t) => setField("name", t)}
              placeholder="e.g., CES 2026"
              placeholderTextColor={COLORS.text.tertiary}
              style={inputStyle}
            />
          </View>
=======
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View
            style={{
              borderRadius: 16,
              backgroundColor: `${COLORS.bad}15`,
              borderWidth: 1,
              borderColor: COLORS.bad,
              padding: 12,
              marginTop: 10,
            }}
          >
            <Text style={{ color: COLORS.bad, fontWeight: "900" }}>
              {error}
            </Text>
          </View>
        ) : null}

        <View style={{ marginTop: 14 }}>
          <Text
            style={{
              color: COLORS.text.secondary,
              fontSize: 12,
              fontWeight: "800",
              marginBottom: 8,
            }}
          >
            Trade show name
          </Text>
          <TextInput
            value={form.name}
            onChangeText={(t) => onChange("name", t)}
            placeholder="e.g., CES 2026"
            placeholderTextColor={COLORS.text.tertiary}
            style={inputStyle}
          />
        </View>

        <View style={{ marginTop: 16, gap: 16 }}>
          <UsDateField
            label="Start date"
            value={form.start_date}
            onChange={(v) => onChange("start_date", v)}
            COLORS={COLORS}
            inputStyle={inputStyle}
            placeholder="01312026"
          />

          <UsDateField
            label="End date"
            value={form.end_date}
            onChange={(v) => onChange("end_date", v)}
            COLORS={COLORS}
            inputStyle={inputStyle}
            placeholder="02022026"
          />
        </View>
>>>>>>> theirs

<<<<<<< ours
          <View style={{ marginTop: 16, gap: 16 }}>
            <View>
              <Text style={labelStyle}>Start date</Text>
              <Pressable onPress={() => openDatePicker("start_date")}>
                <TextInput
                  ref={(r) => {
                    inputRefs.current.start_date = r;
                  }}
                  value={dateDisplayValue(form.start_date)}
                  onChangeText={(t) =>
                    setField("start_date", normalizeUsDateInput(t))
                  }
                  onFocus={() => {
                    if (typingKey === "start_date") return;
                    openDatePicker("start_date");
                  }}
                  onBlur={() => {
                    if (typingKey === "start_date") setTypingKey(null);
                  }}
                  placeholder="01312026"
                  placeholderTextColor={COLORS.text.tertiary}
                  keyboardType={
                    Platform.OS === "ios" ? "number-pad" : "numeric"
                  }
                  inputMode="numeric"
                  style={inputStyle}
                />
              </Pressable>
            </View>
=======
        <View style={{ marginTop: 16 }}>
          <Text
            style={{
              color: COLORS.text.secondary,
              fontSize: 12,
              fontWeight: "800",
              marginBottom: 8,
            }}
          >
            City
          </Text>
          <TextInput
            value={form.city}
            onChangeText={(t) => onChange("city", t)}
            placeholder="e.g., Las Vegas"
            placeholderTextColor={COLORS.text.tertiary}
            style={inputStyle}
          />
        </View>
>>>>>>> theirs

<<<<<<< ours
            <View>
              <Text style={labelStyle}>End date</Text>
              <Pressable onPress={() => openDatePicker("end_date")}>
                <TextInput
                  ref={(r) => {
                    inputRefs.current.end_date = r;
                  }}
                  value={dateDisplayValue(form.end_date)}
                  onChangeText={(t) =>
                    setField("end_date", normalizeUsDateInput(t))
                  }
                  onFocus={() => {
                    if (typingKey === "end_date") return;
                    openDatePicker("end_date");
                  }}
                  onBlur={() => {
                    if (typingKey === "end_date") setTypingKey(null);
                  }}
                  placeholder="02022026"
                  placeholderTextColor={COLORS.text.tertiary}
                  keyboardType={
                    Platform.OS === "ios" ? "number-pad" : "numeric"
                  }
                  inputMode="numeric"
                  style={inputStyle}
                />
              </Pressable>
            </View>
          </View>
=======
        <View style={{ marginTop: 16 }}>
          <Text
            style={{
              color: COLORS.text.secondary,
              fontSize: 12,
              fontWeight: "800",
              marginBottom: 8,
            }}
          >
            Venue
          </Text>
          <TextInput
            value={form.venue}
            onChangeText={(t) => onChange("venue", t)}
            placeholder="Convention Center"
            placeholderTextColor={COLORS.text.tertiary}
            style={inputStyle}
          />
        </View>
>>>>>>> theirs

<<<<<<< ours
          <View style={{ marginTop: 16 }}>
            <Text style={labelStyle}>City</Text>
            <TextInput
              value={form.city}
              onChangeText={(t) => setField("city", t)}
              placeholder="e.g., Las Vegas"
              placeholderTextColor={COLORS.text.tertiary}
              style={inputStyle}
            />
          </View>
=======
        <TaskTemplateSelectorMobile
          COLORS={COLORS}
          value={form.task_template_id}
          onChange={(id) => onChange("task_template_id", id)}
        />
>>>>>>> theirs

<<<<<<< ours
          <View style={{ marginTop: 16 }}>
            <Text style={labelStyle}>Venue</Text>
            <TextInput
              value={form.venue}
              onChangeText={(t) => setField("venue", t)}
              placeholder="Convention Center"
              placeholderTextColor={COLORS.text.tertiary}
              style={inputStyle}
            />
          </View>
=======
        <TouchableOpacity
          onPress={submit}
          activeOpacity={0.9}
          disabled={saving}
          style={{
            marginTop: 18,
            height: 52,
            borderRadius: 18,
            backgroundColor: COLORS.brand,
            alignItems: "center",
            justifyContent: "center",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ color: "#FFFFFF", fontWeight: "900", fontSize: 15 }}>
              Create show
            </Text>
          )}
        </TouchableOpacity>
>>>>>>> theirs

<<<<<<< ours
          <View
            style={{
              marginTop: 16,
              borderRadius: 18,
              backgroundColor: COLORS.bg.tertiary,
              borderWidth: 1,
              borderColor: COLORS.border.primary,
              padding: 14,
            }}
          >
            <Text style={{ color: COLORS.text.primary, fontWeight: "900" }}>
              Task template
            </Text>
            <Text
              style={{
                color: COLORS.text.secondary,
                marginTop: 6,
                fontSize: 12,
              }}
            >
              Optional: apply a saved company checklist when you create the
              show.
            </Text>

            {templatesQuery.isLoading ? (
              <View style={{ marginTop: 12 }}>
                <ActivityIndicator color={COLORS.brand} />
              </View>
            ) : templatesQuery.error ? (
              <View style={{ marginTop: 12 }}>
                <Text style={{ color: COLORS.bad, fontWeight: "800" }}>
                  Could not load templates
                </Text>
              </View>
            ) : templates.length === 0 ? (
              <View style={{ marginTop: 12 }}>
                <Text style={{ color: COLORS.text.secondary, fontSize: 13 }}>
                  No templates yet.
                </Text>

                <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                  <Pressable
                    onPress={() => setCreateTplOpen(true)}
                    style={{
                      flex: 1,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: COLORS.bg.chip,
                      borderWidth: 1,
                      borderColor: COLORS.border.primary,
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      gap: 8,
                    }}
                  >
                    <Plus size={18} color={COLORS.text.primary} />
                    <Text
                      style={{ color: COLORS.text.primary, fontWeight: "900" }}
                    >
                      Create
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => openWebPath("/tradeshows/create")}
                    style={{
                      height: 44,
                      borderRadius: 14,
                      paddingHorizontal: 14,
                      backgroundColor: COLORS.bg.chip,
                      borderWidth: 1,
                      borderColor: COLORS.border.primary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{ color: COLORS.text.primary, fontWeight: "900" }}
                    >
                      Web
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={{ marginTop: 12 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Pressable
                    onPress={goPrevTemplate}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      backgroundColor: COLORS.bg.chip,
                      borderWidth: 1,
                      borderColor: COLORS.border.primary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ChevronLeft size={18} color={COLORS.text.primary} />
                  </Pressable>

                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={{ color: COLORS.text.primary, fontWeight: "900" }}
                      numberOfLines={1}
                    >
                      {selectedTemplate
                        ? String(selectedTemplate.name || "").trim()
                        : "(No template)"}
                    </Text>
                    <Text
                      style={{
                        color: COLORS.text.secondary,
                        fontSize: 12,
                        marginTop: 4,
                      }}
                      numberOfLines={1}
                    >
                      {selectedTemplate
                        ? selectedTemplate.description
                          ? String(selectedTemplate.description)
                          : `${Number(selectedTemplate.item_count || 0)} tasks`
                        : ""}
                    </Text>
                  </View>

                  <Pressable
                    onPress={goNextTemplate}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      backgroundColor: COLORS.bg.chip,
                      borderWidth: 1,
                      borderColor: COLORS.border.primary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ChevronRight size={18} color={COLORS.text.primary} />
                  </Pressable>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 12,
                  }}
                >
                  <Pressable
                    onPress={() => setField("task_template_id", "")}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: COLORS.border.primary,
                      backgroundColor: COLORS.bg.chip,
                    }}
                  >
                    <Text
                      style={{ color: COLORS.text.primary, fontWeight: "900" }}
                    >
                      No template
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setCreateTplOpen(true)}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: COLORS.border.primary,
                      backgroundColor: COLORS.bg.chip,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Plus size={18} color={COLORS.text.primary} />
                    <Text
                      style={{ color: COLORS.text.primary, fontWeight: "900" }}
                    >
                      New
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={submit}
            activeOpacity={0.9}
            disabled={saving}
            style={{
              marginTop: 18,
              height: 52,
              borderRadius: 18,
              backgroundColor: COLORS.brand,
              alignItems: "center",
              justifyContent: "center",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                style={{ color: "#FFFFFF", fontWeight: "900", fontSize: 15 }}
              >
                Create show
              </Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 18 }} />
        </ScrollView>

        <Modal visible={isPickerOpen} transparent animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.45)",
              padding: 18,
              justifyContent: "center",
            }}
          >
            <View
              style={{
                borderRadius: 18,
                backgroundColor: COLORS.bg.primary,
                borderWidth: 1,
                borderColor: COLORS.border.primary,
                padding: 14,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: COLORS.text.primary, fontWeight: "900" }}>
                  {pickerTitle || "Select date"}
                </Text>

                <Pressable
                  onPress={() => {
                    const key = dateKeyOpen;
                    if (!key) {
                      setDateKeyOpen(null);
                      return;
                    }
                    closePickerToType(key);
                  }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    backgroundColor: COLORS.bg.tertiary,
                    borderWidth: 1,
                    borderColor: COLORS.border.primary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={18} color={COLORS.text.primary} />
                </Pressable>
              </View>

              <Calendar
                current={selectedIsoForPicker || undefined}
                markedDates={markedSingleDate(
                  selectedIsoForPicker,
                  COLORS.brand,
                )}
                onDayPress={(day) => {
                  const key = dateKeyOpen;
                  const iso = day?.dateString;
                  if (!key || !iso) return;
                  setField(key, iso);
                  setDateKeyOpen(null);
                  setTypingKey(null);
                }}
                enableSwipeMonths
                theme={{
                  calendarBackground: COLORS.bg.primary,
                  dayTextColor: COLORS.text.primary,
                  monthTextColor: COLORS.text.primary,
                  textMonthFontWeight: "800",
                  textDayFontWeight: "600",
                  textDayHeaderFontWeight: "800",
                  arrowColor: COLORS.text.primary,
                  todayTextColor: COLORS.brand,
                }}
              />

              <Text
                style={{
                  marginTop: 10,
                  color: COLORS.text.secondary,
                  fontSize: 12,
                }}
              >
                Tip: press X to type 8 digits like 01312026.
              </Text>
            </View>
          </View>
        </Modal>

        <Modal visible={createTplOpen} transparent animationType="slide">
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.45)",
              paddingTop: 80,
              paddingHorizontal: 18,
            }}
          >
            <View
              style={{
                flex: 1,
                borderRadius: 18,
                backgroundColor: COLORS.bg.primary,
                borderWidth: 1,
                borderColor: COLORS.border.primary,
                padding: 14,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    color: COLORS.text.primary,
                    fontWeight: "900",
                    fontSize: 16,
                  }}
                >
                  Create template
                </Text>
                <Pressable
                  onPress={() => setCreateTplOpen(false)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    backgroundColor: COLORS.bg.chip,
                    borderWidth: 1,
                    borderColor: COLORS.border.primary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={18} color={COLORS.text.primary} />
                </Pressable>
              </View>

              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
              >
                <Text
                  style={{
                    color: COLORS.text.secondary,
                    marginTop: 8,
                    fontSize: 12,
                  }}
                >
                  Quick builder: name + a few tasks.
                </Text>

                <Text
                  style={{
                    color: COLORS.text.secondary,
                    marginTop: 16,
                    fontSize: 12,
                    fontWeight: "800",
                  }}
                >
                  Name
                </Text>
                <TextInput
                  value={tplName}
                  onChangeText={setTplName}
                  placeholder="e.g., Standard Booth Checklist"
                  placeholderTextColor={COLORS.text.tertiary}
                  style={{
                    marginTop: 8,
                    height: 46,
                    paddingHorizontal: 14,
                    borderRadius: 14,
                    backgroundColor: COLORS.bg.tertiary,
                    borderWidth: 1,
                    borderColor: COLORS.border.primary,
                    color: COLORS.text.primary,
                  }}
                />

                <Text
                  style={{
                    color: COLORS.text.secondary,
                    marginTop: 16,
                    fontSize: 12,
                    fontWeight: "800",
                  }}
                >
                  Description (optional)
                </Text>
                <TextInput
                  value={tplDesc}
                  onChangeText={setTplDesc}
                  placeholder="What is this used for?"
                  placeholderTextColor={COLORS.text.tertiary}
                  style={{
                    marginTop: 8,
                    height: 46,
                    paddingHorizontal: 14,
                    borderRadius: 14,
                    backgroundColor: COLORS.bg.tertiary,
                    borderWidth: 1,
                    borderColor: COLORS.border.primary,
                    color: COLORS.text.primary,
                  }}
                />

                <Text
                  style={{
                    color: COLORS.text.secondary,
                    marginTop: 18,
                    fontSize: 12,
                    fontWeight: "800",
                  }}
                >
                  Tasks
                </Text>

                <View style={{ marginTop: 8, gap: 10 }}>
                  {tplItems.map((it, idx) => (
                    <View
                      key={String(idx)}
                      style={{
                        borderRadius: 16,
                        backgroundColor: COLORS.bg.tertiary,
                        borderWidth: 1,
                        borderColor: COLORS.border.primary,
                        padding: 12,
                      }}
                    >
                      <Text
                        style={{
                          color: COLORS.text.secondary,
                          fontSize: 12,
                          fontWeight: "800",
                        }}
                      >
                        Task {idx + 1}
                      </Text>

                      <TextInput
                        value={String(it.title || "")}
                        onChangeText={(txt) => {
                          setTplItems((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], title: txt };
                            return next;
                          });
                        }}
                        placeholder="Title"
                        placeholderTextColor={COLORS.text.tertiary}
                        style={{
                          marginTop: 8,
                          height: 44,
                          paddingHorizontal: 12,
                          borderRadius: 12,
                          backgroundColor: COLORS.bg.primary,
                          borderWidth: 1,
                          borderColor: COLORS.border.primary,
                          color: COLORS.text.primary,
                        }}
                      />

                      <TextInput
                        value={String(it.relative_days ?? 0)}
                        onChangeText={(txt) => {
                          setTplItems((prev) => {
                            const next = [...prev];
                            const n = Number(txt);
                            next[idx] = {
                              ...next[idx],
                              relative_days: Number.isFinite(n)
                                ? Math.trunc(n)
                                : 0,
                            };
                            return next;
                          });
                        }}
                        placeholder="Days from show start (e.g. -30)"
                        placeholderTextColor={COLORS.text.tertiary}
                        keyboardType="numeric"
                        style={{
                          marginTop: 10,
                          height: 44,
                          paddingHorizontal: 12,
                          borderRadius: 12,
                          backgroundColor: COLORS.bg.primary,
                          borderWidth: 1,
                          borderColor: COLORS.border.primary,
                          color: COLORS.text.primary,
                        }}
                      />
                    </View>
                  ))}
                </View>

                <Pressable
                  onPress={() =>
                    setTplItems((prev) => [
                      ...prev,
                      { title: "", relative_days: 0 },
                    ])
                  }
                  style={{
                    marginTop: 12,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: COLORS.bg.chip,
                    borderWidth: 1,
                    borderColor: COLORS.border.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 8,
                  }}
                >
                  <Plus size={18} color={COLORS.text.primary} />
                  <Text
                    style={{ color: COLORS.text.primary, fontWeight: "900" }}
                  >
                    Add task
                  </Text>
                </Pressable>
              </ScrollView>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={() => setCreateTplOpen(false)}
                  style={{
                    flex: 1,
                    height: 46,
                    borderRadius: 16,
                    backgroundColor: COLORS.bg.chip,
                    borderWidth: 1,
                    borderColor: COLORS.border.primary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{ color: COLORS.text.primary, fontWeight: "900" }}
                  >
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  onPress={submitCreateTemplate}
                  disabled={createTplMutation.isPending}
                  style={{
                    flex: 1,
                    height: 46,
                    borderRadius: 16,
                    backgroundColor: COLORS.brand,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: createTplMutation.isPending ? 0.7 : 1,
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontWeight: "900" }}>
                    {createTplMutation.isPending ? "Saving…" : "Save"}
                  </Text>
                </Pressable>
              </View>

              {createTplMutation.error ? (
                <Text
                  style={{
                    marginTop: 10,
                    color: COLORS.bad,
                    fontWeight: "800",
                  }}
                >
                  {createTplMutation.error instanceof Error
                    ? createTplMutation.error.message
                    : "Could not save template"}
                </Text>
              ) : null}
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingAnimatedView>
=======
        <View style={{ height: 18 }} />
      </ScrollView>
    </KeyboardAvoidingView>
>>>>>>> theirs
  );
}
