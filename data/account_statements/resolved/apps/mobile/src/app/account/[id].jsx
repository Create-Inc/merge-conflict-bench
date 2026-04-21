import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  ChevronDown,
  ChevronLeft,
  ExternalLink,
  Printer,
} from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { LinearGradient } from "expo-linear-gradient";

import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import { SelectModal } from "@/components/Dashboard/SelectModal";
import { SegmentedControl } from "@/components/Dashboard/SegmentedControl";
import { TransferSection } from "@/components/Dashboard/TransferSection";
import { TransactionHistorySection } from "@/components/Dashboard/TransactionHistorySection";
import { WebModal } from "@/components/Dashboard/WebModal";
import { useApiAuthHeaders } from "@/hooks/useApiAuthHeaders";
import { useTransferForm } from "@/hooks/useTransferForm";
import { buildStatementOptions, formatMoney } from "@/utils/formatters";

function AccountHeader({ title, subtitle, onBack, onOpenAccountPicker }) {
  return (
    <LinearGradient
      colors={["#0B4AA2", "#0A3E86"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.18)",
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
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

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 18, fontWeight: "900", color: "#FFFFFF" }}>
          {title}
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

      {onOpenAccountPicker ? (
        <Pressable
          onPress={onOpenAccountPicker}
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
          accessibilityLabel="Switch account"
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "900" }}>Account</Text>
          <ChevronDown size={16} color="#FFFFFF" />
        </Pressable>
      ) : null}
    </LinearGradient>
  );
}

function getLast4(value) {
  const raw = String(value || "");
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 4) return digits.slice(-4);
  return raw.slice(-4);
}

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

export default function AccountDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const accountId = String(params?.id || "");
  const authHeaders = useApiAuthHeaders();

  const [accountSwitchOpen, setAccountSwitchOpen] = useState(false);
  const [transferAccountPickerOpen, setTransferAccountPickerOpen] =
    useState(false);

  const statementOptions = useMemo(() => buildStatementOptions(), []);
  const [periodPickerOpen, setPeriodPickerOpen] = useState(false);
  const [webOpen, setWebOpen] = useState(false);
  const [period, setPeriod] = useState(() => statementOptions[0]?.value || "");

  const [activeSegment, setActiveSegment] = useState("activity");

  const segments = useMemo(() => {
    return [
      { value: "activity", label: "Activity" },
      { value: "transfer", label: "Transfer" },
      { value: "statements", label: "Statements" },
    ];
  }, []);

  const accountsQuery = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const response = await fetch("/api/accounts", { headers: authHeaders });
      if (!response.ok) {
        throw new Error(
          `When fetching /api/accounts, the response was [${response.status}] ${response.statusText}`,
        );
      }
      const json = await response.json();
      return Array.isArray(json?.accounts) ? json.accounts : [];
    },
  });

  const accountQuery = useQuery({
    queryKey: ["account", accountId],
    enabled: Boolean(accountId),
    queryFn: async () => {
      const response = await fetch(
        `/api/accounts/${encodeURIComponent(accountId)}`,
        { headers: authHeaders },
      );

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(
          `When fetching /api/accounts/${accountId}, the response was [${response.status}] ${response.statusText}${text ? ` - ${text}` : ""}`,
        );
      }

      const json = await response.json();
      return json?.account || null;
    },
  });

  const txQuery = useQuery({
    queryKey: ["transactions", "account", accountId],
    enabled: Boolean(accountId),
    queryFn: async () => {
      const url = `/api/transactions?accountId=${encodeURIComponent(accountId)}&limit=200`;
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

  const accounts = useMemo(() => {
    return Array.isArray(accountsQuery.data) ? accountsQuery.data : [];
  }, [accountsQuery.data]);

  const accountOptions = useMemo(() => {
    return accounts
      .filter((a) => a?.id !== undefined && a?.id !== null)
      .map((a) => {
        const accountType = String(a?.account_type || "Account");
        const last4 = getLast4(a?.account_number);
        const label = last4 ? `${accountType} ••••${last4}` : accountType;
        return { value: String(a.id), label };
      });
  }, [accounts]);

  const account = accountQuery.data;

  const title = useMemo(() => {
    if (!account) return "Account";
    const type = String(account?.account_type || "Account");
    const last4 = getLast4(account?.account_number);
    return last4 ? `${type} ••••${last4}` : type;
  }, [account]);

  const subtitle = useMemo(() => {
    if (!account) return null;
    return account?.group_name ? String(account.group_name) : null;
  }, [account]);

  const balanceLabel = useMemo(() => {
    return formatMoney(Number(account?.balance || 0));
  }, [account]);

  const {
    transferMode,
    setTransferMode,
    transferAccountId,
    setTransferAccountId,
    transferAmount,
    setTransferAmount,
    transferCounterparty,
    setTransferCounterparty,
    transferError,
    transferSuccess,
    onSubmitTransfer,
    isSubmitting,
  } = useTransferForm();

  // Default the transfer form to this account.
  useEffect(() => {
    if (!accountId) return;
    if (transferAccountId) return;
    setTransferAccountId(String(accountId));
  }, [accountId, transferAccountId, setTransferAccountId]);

  const transactions = useMemo(() => {
    return Array.isArray(txQuery.data) ? txQuery.data : [];
  }, [txQuery.data]);

  const overallLoading =
    accountsQuery.isLoading || accountQuery.isLoading || txQuery.isLoading;

  const errorText = useMemo(() => {
    const e = accountsQuery.error || accountQuery.error || txQuery.error;
    if (!e) return null;
    const msg = String(e?.message || "");
    return msg || "Could not load account.";
  }, [accountsQuery.error, accountQuery.error, txQuery.error]);

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

  const statementRange = useMemo(() => getPeriodRange(period), [period]);

  const statementTxQuery = useQuery({
    queryKey: ["transactions", "statement-preview", accountId, period],
    enabled: Boolean(
      activeSegment === "statements" &&
        statementRange?.from &&
        statementRange?.to &&
        accountId,
    ),
    queryFn: async () => {
      const url = `/api/transactions?accountId=${encodeURIComponent(accountId)}&from=${encodeURIComponent(statementRange.from)}&to=${encodeURIComponent(statementRange.to)}&limit=5000`;
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

  const statementTransactions = useMemo(() => {
    return Array.isArray(statementTxQuery.data) ? statementTxQuery.data : [];
  }, [statementTxQuery.data]);

  const statementTotals = useMemo(() => {
    let deposits = 0;
    let withdrawals = 0;

    for (const t of statementTransactions) {
      const amount = Number(t?.amount || 0);
      if (amount > 0) deposits += amount;
      if (amount < 0) withdrawals += Math.abs(amount);
    }

    return { deposits, withdrawals };
  }, [statementTransactions]);

  return (
    <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
      <View style={{ flex: 1, backgroundColor: "#F6F7F9", paddingTop: insets.top }}>
        <StatusBar style="light" />

        <AccountHeader
          title={title}
          subtitle={subtitle}
          onBack={() => router.back()}
          onOpenAccountPicker={() => setAccountSwitchOpen(true)}
        />

        {overallLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
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
              <Pressable
                onPress={() => router.replace(`/account/${encodeURIComponent(accountId)}`)}
                style={{
                  marginTop: 12,
                  backgroundColor: "#0B4AA2",
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "900" }}>Retry</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Balance card (Chase-like) */}
            <LinearGradient
              colors={["#0B4AA2", "#0A3E86"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 18, overflow: "hidden" }}
            >
              <View style={{ padding: 16 }}>
                <Text style={{ color: "rgba(255,255,255,0.85)" }}>
                  Available balance
                </Text>
                <Text
                  style={{
                    marginTop: 8,
                    fontSize: 36,
                    fontWeight: "900",
                    color: "#FFFFFF",
                    letterSpacing: 0.2,
                  }}
                >
                  {balanceLabel}
                </Text>

                <View style={{ marginTop: 14, flexDirection: "row", gap: 10 }}>
                  <Pressable
                    onPress={() => setActiveSegment("transfer")}
                    style={{
                      flex: 1,
                      backgroundColor: "rgba(255,255,255,0.16)",
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.25)",
                      paddingVertical: 12,
                      borderRadius: 12,
                      alignItems: "center",
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Transfer"
                  >
                    <Text style={{ color: "#FFFFFF", fontWeight: "900" }}>
                      Transfer
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setActiveSegment("statements")}
                    style={{
                      flex: 1,
                      backgroundColor: "#FFFFFF",
                      paddingVertical: 12,
                      borderRadius: 12,
                      alignItems: "center",
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Statements"
                  >
                    <Text style={{ color: "#0B4AA2", fontWeight: "900" }}>
                      Statements
                    </Text>
                  </Pressable>
                </View>
              </View>
            </LinearGradient>

            {/* Segmented control */}
            <View style={{ marginTop: 14 }}>
              <SegmentedControl
                options={segments}
                value={activeSegment}
                onChange={(v) => setActiveSegment(String(v))}
              />
            </View>

            {/* Activity */}
            {activeSegment === "activity" ? (
              <View style={{ marginTop: 14 }}>
                <TransactionHistorySection transactions={transactions} />
              </View>
            ) : null}

            {/* Transfer */}
            {activeSegment === "transfer" ? (
              <TransferSection
                transferMode={transferMode}
                onTransferModeChange={setTransferMode}
                transferAccountId={transferAccountId}
                onAccountPickerOpen={() => setTransferAccountPickerOpen(true)}
                accountOptions={accountOptions}
                transferAmount={transferAmount}
                onTransferAmountChange={setTransferAmount}
                transferCounterparty={transferCounterparty}
                onTransferCounterpartyChange={setTransferCounterparty}
                transferError={transferError}
                transferSuccess={transferSuccess}
                onSubmitTransfer={onSubmitTransfer}
                isSubmitting={isSubmitting}
              />
            ) : null}

            {/* Statements */}
            {activeSegment === "statements" ? (
              <View style={{ marginTop: 14 }}>
                <View
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    padding: 14,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: "900", color: "#111827" }}>
                    Statements
                  </Text>
                  <Text style={{ marginTop: 4, color: "#6B7280" }}>
                    Pick a period and view / save the PDF.
                  </Text>

                  <Pressable
                    onPress={() => setPeriodPickerOpen(true)}
                    style={{
                      marginTop: 12,
                      borderWidth: 1,
                      borderColor: "#D1D5DB",
                      borderRadius: 14,
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      backgroundColor: "#FFFFFF",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Select statement period"
                  >
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={{ color: "#6B7280" }}>Selected</Text>
                      <Text
                        style={{ marginTop: 4, fontWeight: "900", color: "#111827" }}
                        numberOfLines={1}
                      >
                        {statementOptions.find((o) => String(o.value) === String(period))?.label || "Select period"}
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
                      <Printer size={18} color={printableUrl ? "#FFFFFF" : "#6B7280"} />
                      <Text
                        style={{
                          color: printableUrl ? "#FFFFFF" : "#6B7280",
                          fontWeight: "900",
                        }}
                      >
                        View / Save
                      </Text>
                    </Pressable>

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
                    </Text>
                  ) : null}

                  <View
                    style={{
                      marginTop: 14,
                      borderTopWidth: 1,
                      borderTopColor: "#E5E7EB",
                      paddingTop: 12,
                      flexDirection: "row",
                      gap: 12,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#6B7280" }}>Deposits</Text>
                      <Text style={{ marginTop: 4, fontWeight: "900", color: "#065F46" }}>
                        {formatMoney(statementTotals.deposits)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#6B7280" }}>Withdrawals</Text>
                      <Text style={{ marginTop: 4, fontWeight: "900", color: "#B91C1C" }}>
                        {formatMoney(statementTotals.withdrawals)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : null}
          </ScrollView>
        )}

        <View style={{ height: insets.bottom }} />

        {/* Transfer account picker */}
        <SelectModal
          title="Select account"
          visible={transferAccountPickerOpen}
          onClose={() => setTransferAccountPickerOpen(false)}
          options={accountOptions}
          value={transferAccountId}
          onSelect={(v) => {
            setTransferAccountId(String(v));
            setTransferAccountPickerOpen(false);
          }}
        />

        {/* Account switcher (changes the screen) */}
        <SelectModal
          title="Switch account"
          visible={accountSwitchOpen}
          onClose={() => setAccountSwitchOpen(false)}
          options={accountOptions}
          value={String(accountId)}
          onSelect={(v) => {
            const nextId = String(v);
            setAccountSwitchOpen(false);
            if (!nextId) return;
            router.replace(`/account/${encodeURIComponent(nextId)}`);
          }}
        />

        {/* Statement period */}
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
    </KeyboardAvoidingAnimatedView>
  );
}
