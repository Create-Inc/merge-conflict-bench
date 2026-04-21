import { useMemo, useState, useCallback, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
<<<<<<< ours
import {
  ChevronDown,
  ChevronLeft,
  ExternalLink,
  Printer,
} from "lucide-react-native";
=======
import {
  ChevronLeft,
  ExternalLink,
  Printer,
  ChevronDown,
} from "lucide-react-native";
>>>>>>> theirs
import { useQuery } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { LinearGradient } from "expo-linear-gradient";

import { useApiAuthHeaders } from "@/hooks/useApiAuthHeaders";
import { buildStatementOptions, formatMoney } from "@/utils/formatters";
import { SelectModal } from "@/components/Dashboard/SelectModal";
import { WebModal } from "@/components/Dashboard/WebModal";

function pad2(value) {
  return String(value).padStart(2, "0");
}

function parsePeriod(period) {
  const raw = String(period || "");
  const parts = raw.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
  if (month < 1 || month > 12) return null;
  return { year, month };
}

function getPeriodRange(period) {
  const parsed = parsePeriod(period);
  if (!parsed) return null;
  const from = `${parsed.year}-${pad2(parsed.month)}-01`;

  let nextYear = parsed.year;
  let nextMonth = parsed.month + 1;
  if (nextMonth === 13) {
    nextMonth = 1;
    nextYear += 1;
  }

  const to = `${nextYear}-${pad2(nextMonth)}-01`;
  return { from, to };
}

<<<<<<< ours
function StatementsHeader({ title, subtitle, periodLabel, onBack, onPeriod }) {
=======
function StatementsHeader({ title, subtitle, onBack, onOpenPeriod }) {
>>>>>>> theirs
  return (
<<<<<<< ours
    <LinearGradient
      colors={["#0B4AA2", "#083A7A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
=======
    <LinearGradient
      colors={["#0B4AA2", "#0A3E86"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
>>>>>>> theirs
      style={{
        paddingHorizontal: 16,
<<<<<<< ours
        paddingTop: 10,
        paddingBottom: 12,
=======
        paddingTop: 14,
        paddingBottom: 14,
>>>>>>> theirs
        borderBottomWidth: 1,
<<<<<<< ours
        borderBottomColor: "rgba(255,255,255,0.18)",
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
=======
        borderBottomColor: "rgba(255,255,255,0.18)",
>>>>>>> theirs
      }}
    >
<<<<<<< ours
      <Pressable
        onPress={onBack}
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: "rgba(255,255,255,0.18)",
          alignItems: "center",
          justifyContent: "center",
        }}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <ChevronLeft size={20} color="#FFFFFF" />
      </Pressable>
=======
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Pressable
          onPress={onBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: "rgba(255,255,255,0.16)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.25)",
            alignItems: "center",
            justifyContent: "center",
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={20} color="#FFFFFF" />
        </Pressable>
>>>>>>> theirs

<<<<<<< ours
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 20, fontWeight: "900", color: "#FFFFFF" }}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{ marginTop: 2, color: "rgba(255,255,255,0.85)" }}
            numberOfLines={1}
          >
            {subtitle}
=======
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "900", color: "#FFFFFF" }}>
            {title}
>>>>>>> theirs
          </Text>
          {subtitle ? (
            <Text
              style={{ marginTop: 2, color: "rgba(255,255,255,0.85)" }}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {onOpenPeriod ? (
          <Pressable
            onPress={onOpenPeriod}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.16)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.25)",
            }}
            accessibilityRole="button"
            accessibilityLabel="Select statement period"
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "900" }}>Period</Text>
            <ChevronDown size={16} color="#FFFFFF" />
          </Pressable>
        ) : null}
      </View>
<<<<<<< ours

      <Pressable
        onPress={onPeriod}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.18)",
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          maxWidth: 160,
        }}
        accessibilityRole="button"
        accessibilityLabel="Change statement period"
      >
        <Text style={{ color: "#FFFFFF", fontWeight: "900" }} numberOfLines={1}>
          {periodLabel || "Period"}
        </Text>
        <ChevronDown size={16} color="#FFFFFF" />
      </Pressable>
    </LinearGradient>
=======
    </LinearGradient>
>>>>>>> theirs
  );
}

function getLast4(value) {
  const raw = String(value || "");
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 4) return digits.slice(-4);
  return raw.slice(-4);
}

export default function StatementsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const accountId = String(params?.accountId || "");
  const initialPeriod = params?.period ? String(params.period) : null;

  const authHeaders = useApiAuthHeaders();

  const statementOptions = useMemo(() => buildStatementOptions(), []);

  const [periodPickerOpen, setPeriodPickerOpen] = useState(false);
  const [webOpen, setWebOpen] = useState(false);

  const [period, setPeriod] = useState(() => {
    if (initialPeriod) return initialPeriod;
    return statementOptions[0]?.value || "";
  });

  useEffect(() => {
    if (!initialPeriod) return;
    setPeriod(initialPeriod);
  }, [initialPeriod]);

  const accountQuery = useQuery({
    queryKey: ["account", accountId],
    enabled: Boolean(accountId),
    queryFn: async () => {
      const response = await fetch(
        `/api/accounts/${encodeURIComponent(accountId)}`,
        {
          headers: authHeaders,
        },
      );
      if (!response.ok) {
        throw new Error(
          `When fetching /api/accounts/${accountId}, the response was [${response.status}] ${response.statusText}`,
        );
      }
      const json = await response.json();
      return json?.account || null;
    },
  });

  const range = useMemo(() => getPeriodRange(period), [period]);

  const txQuery = useQuery({
    queryKey: ["transactions", "statement", accountId, period],
    enabled: Boolean(accountId && range?.from && range?.to),
    queryFn: async () => {
      const url = `/api/transactions?accountId=${encodeURIComponent(accountId)}&from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}&limit=5000`;
      const response = await fetch(url, { headers: authHeaders });
      if (!response.ok) {
        throw new Error(
          `When fetching ${url}, the response was [${response.status}] ${response.statusText}`,
        );
      }
      const json = await response.json();
      return Array.isArray(json?.transactions) ? json.transactions : [];
    },
  });

  const account = accountQuery.data;

  const accountLabel = useMemo(() => {
    if (!account) return null;
    const type = String(account?.account_type || "Account");
    const last4 = getLast4(account?.account_number);
    if (last4) return `${type} ••••${last4}`;
    return type;
  }, [account]);

  const periodLabel = useMemo(() => {
    const found = statementOptions.find(
      (o) => String(o.value) === String(period),
    );
    return found ? found.label : "Period";
  }, [statementOptions, period]);

  const transactions = useMemo(() => {
    return Array.isArray(txQuery.data) ? txQuery.data : [];
  }, [txQuery.data]);

  const totals = useMemo(() => {
    let deposits = 0;
    let withdrawals = 0;

    for (const t of transactions) {
      const amount = Number(t?.amount || 0);
      if (amount > 0) deposits += amount;
      if (amount < 0) withdrawals += Math.abs(amount);
    }

    return { deposits, withdrawals };
  }, [transactions]);

  const baseURL = process.env.EXPO_PUBLIC_BASE_URL;
  const proxyURL = process.env.EXPO_PUBLIC_PROXY_BASE_URL;
  const root = baseURL || proxyURL || null;

  const printableUrl = useMemo(() => {
    if (!root) return null;
    if (!accountId || !period) return null;
    const acct = encodeURIComponent(String(accountId));
    const p = encodeURIComponent(String(period));
    return `${root}/statements/${acct}/${p}`;
  }, [root, accountId, period]);

  const onOpenBrowser = useCallback(async () => {
    if (!printableUrl) return;
    try {
      await Linking.openURL(printableUrl);
    } catch (e) {
      console.error(e);
    }
  }, [printableUrl]);

  const loading = accountQuery.isLoading || txQuery.isLoading;

  const errorText = useMemo(() => {
    const e = accountQuery.error || txQuery.error;
    if (!e) return null;
    const msg = String(e?.message || "");
    return msg || "Could not load statement.";
  }, [accountQuery.error, txQuery.error]);

  return (
    <View
      style={{ flex: 1, backgroundColor: "#F6F7F9", paddingTop: insets.top }}
    >
      <StatusBar style="light" />

      <StatementsHeader
        title="Statements"
        subtitle={accountLabel}
        periodLabel={periodLabel}
        onBack={() => router.back()}
<<<<<<< ours
        onPeriod={() => setPeriodPickerOpen(true)}
=======
        onOpenPeriod={() => setPeriodPickerOpen(true)}
>>>>>>> theirs
      />

      {loading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator />
        </View>
      ) : errorText ? (
        <View style={{ padding: 16 }}>
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              padding: 14,
            }}
          >
            <Text style={{ fontWeight: "900", color: "#111827" }}>
              Something went wrong
            </Text>
            <Text style={{ marginTop: 6, color: "#B91C1C" }}>{errorText}</Text>
          </View>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        >
<<<<<<< ours
          {/* Actions */}
=======
          {/* Actions / period (Chase-like) */}
>>>>>>> theirs
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              overflow: "hidden",
            }}
          >
<<<<<<< ours
            <Text style={{ fontSize: 16, fontWeight: "900", color: "#111827" }}>
              Statement
            </Text>
            <Text style={{ marginTop: 4, color: "#6B7280" }}>
              {periodLabel}
            </Text>
=======
            <View style={{ padding: 14 }}>
              <Text
                style={{ fontSize: 16, fontWeight: "900", color: "#111827" }}
              >
                Statement period
              </Text>
>>>>>>> theirs

              <Pressable
                onPress={() => setPeriodPickerOpen(true)}
                style={{
                  marginTop: 12,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "#D1D5DB",
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <View style={{ paddingRight: 10, flex: 1 }}>
                  <Text style={{ color: "#6B7280" }}>Selected</Text>
                  <Text
                    style={{
                      marginTop: 4,
                      fontWeight: "900",
                      color: "#111827",
                    }}
                    numberOfLines={1}
                  >
                    {subtitle || "Select period"}
                  </Text>
                </View>
                <ChevronDown size={18} color="#111827" />
              </Pressable>

              <View style={{ marginTop: 12, flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={() => setWebOpen(true)}
                  disabled={!printableUrl}
                  style={{
                    flex: 1,
                    backgroundColor: printableUrl ? "#0B4AA2" : "#E5E7EB",
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
<<<<<<< ours
                  View / Save
                </Text>
              </Pressable>
=======
                  <Printer
                    size={18}
                    color={printableUrl ? "#FFFFFF" : "#6B7280"}
                  />
                  <Text
                    style={{
                      color: printableUrl ? "#FFFFFF" : "#6B7280",
                      fontWeight: "900",
                    }}
                  >
                    View / Save
                  </Text>
                </Pressable>
>>>>>>> theirs

<<<<<<< ours
              <Pressable
                onPress={onOpenBrowser}
                disabled={!printableUrl}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: "#0B4AA2",
                  backgroundColor: "#FFFFFF",
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                  opacity: printableUrl ? 1 : 0.5,
                }}
              >
                <ExternalLink size={18} color="#0B4AA2" />
                <Text style={{ color: "#0B4AA2", fontWeight: "900" }}>
                  Browser
=======
                <Pressable
                  onPress={onOpenBrowser}
                  disabled={!printableUrl}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: printableUrl ? "#0B4AA2" : "#E5E7EB",
                    backgroundColor: "#FFFFFF",
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 8,
                    opacity: printableUrl ? 1 : 0.6,
                  }}
                >
                  <ExternalLink size={18} color="#0B4AA2" />
                  <Text style={{ color: "#0B4AA2", fontWeight: "900" }}>
                    Browser
                  </Text>
                </Pressable>
              </View>

              {!root ? (
                <Text style={{ marginTop: 10, color: "#B91C1C" }}>
                  Missing EXPO_PUBLIC_BASE_URL / EXPO_PUBLIC_PROXY_BASE_URL.
>>>>>>> theirs
                </Text>
              ) : null}
            </View>
          </View>

          {/* Summary */}
          <View
            style={{
              marginTop: 14,
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              padding: 14,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "900", color: "#111827" }}>
              Summary
            </Text>

            <View style={{ marginTop: 12, flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#6B7280" }}>Deposits</Text>
                <Text
                  style={{ marginTop: 6, fontWeight: "900", color: "#065F46" }}
                >
                  {formatMoney(totals.deposits)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#6B7280" }}>Withdrawals</Text>
                <Text
                  style={{ marginTop: 6, fontWeight: "900", color: "#B91C1C" }}
                >
                  {formatMoney(totals.withdrawals)}
                </Text>
              </View>
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={{ color: "#6B7280" }}>Transactions</Text>
              <Text
                style={{ marginTop: 6, fontWeight: "900", color: "#111827" }}
              >
                {transactions.length}
              </Text>
            </View>
          </View>

<<<<<<< ours
          {/* Activity */}
=======
          {/* Activity (more Chase-like list rows) */}
>>>>>>> theirs
          <View
            style={{
              marginTop: 14,
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              overflow: "hidden",
            }}
          >
            <View
              style={{
                padding: 14,
                borderBottomWidth: 1,
                borderBottomColor: "#E5E7EB",
              }}
            >
              <Text
                style={{ fontSize: 16, fontWeight: "900", color: "#111827" }}
              >
                Activity
              </Text>
              <Text style={{ marginTop: 4, color: "#6B7280" }}>
                {transactions.length} transaction
                {transactions.length === 1 ? "" : "s"}
              </Text>
            </View>

            {transactions.length === 0 ? (
              <View style={{ padding: 14 }}>
                <Text style={{ color: "#6B7280" }}>
                  No activity in this period.
                </Text>
              </View>
            ) : (
              <View>
                {transactions.map((tx, idx) => {
                  const desc = String(tx?.description || "Transaction");
                  const amt = Number(tx?.amount);
                  const amtLabel = formatMoney(amt);
                  const isNegative = Number.isFinite(amt) && amt < 0;
                  const amtColor = isNegative ? "#B91C1C" : "#065F46";

                  const d = tx?.created_at ? new Date(tx.created_at) : null;
                  const dateLabel =
                    d && !Number.isNaN(d.getTime())
                      ? d.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "";

<<<<<<< ours
                  const showBorder = idx !== transactions.length - 1;

=======
                  const showTopBorder = idx !== 0;

>>>>>>> theirs
                  return (
                    <View
                      key={String(tx?.id)}
                      style={{
<<<<<<< ours
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        borderBottomWidth: showBorder ? 1 : 0,
                        borderBottomColor: "#E5E7EB",
=======
                        paddingVertical: 12,
                        paddingHorizontal: 14,
                        borderTopWidth: showTopBorder ? 1 : 0,
                        borderTopColor: "#E5E7EB",
                        backgroundColor: "#FFFFFF",
>>>>>>> theirs
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          gap: 10,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{ fontWeight: "900", color: "#111827" }}
                            numberOfLines={2}
                          >
                            {desc}
                          </Text>
                          {dateLabel ? (
                            <Text style={{ marginTop: 4, color: "#6B7280" }}>
                              {dateLabel}
                            </Text>
                          ) : null}
                        </View>
                        <Text style={{ fontWeight: "900", color: amtColor }}>
                          {amtLabel}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      <View style={{ height: insets.bottom }} />

      <SelectModal
        title="Select statement period"
        visible={periodPickerOpen}
        onClose={() => setPeriodPickerOpen(false)}
        options={statementOptions.map((o) => ({
          value: o.value,
          label: o.label,
        }))}
        value={period}
        onSelect={(v) => {
          setPeriod(String(v));
          setPeriodPickerOpen(false);
        }}
      />

      <WebModal
        title="Statement"
        url={printableUrl}
        visible={webOpen}
        onClose={() => setWebOpen(false)}
      />
    </View>
  );
}
