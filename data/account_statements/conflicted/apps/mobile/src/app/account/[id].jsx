import { useEffect, useMemo, useState, useCallback } from "react";
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
  ChevronLeft,
  ChevronDown,
  ExternalLink,
  Printer,
} from "lucide-react-native";
=======
import { ChevronLeft, FileText, ChevronDown } from "lucide-react-native";
>>>>>>> theirs
import { useQuery } from "@tanstack/react-query";
<<<<<<< ours
import * as Linking from "expo-linking";
import { LinearGradient } from "expo-linear-gradient";
=======
import { LinearGradient } from "expo-linear-gradient";
>>>>>>> theirs

import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import { useApiAuthHeaders } from "@/hooks/useApiAuthHeaders";
import { useTransferForm } from "@/hooks/useTransferForm";
import { SelectModal } from "@/components/Dashboard/SelectModal";
import { TransferSection } from "@/components/Dashboard/TransferSection";
import { TransactionHistorySection } from "@/components/Dashboard/TransactionHistorySection";
import { WebModal } from "@/components/Dashboard/WebModal";
import { SegmentedControl } from "@/components/Dashboard/SegmentedControl";
import { buildStatementOptions, formatMoney } from "@/utils/formatters";

<<<<<<< ours
function AccountHeader({ title, subtitle, onBack, onSwitchAccount }) {
=======
function AccountHeader({ title, subtitle, onBack, onOpenAccountPicker }) {
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
<<<<<<< ours
          backgroundColor: "rgba(255,255,255,0.18)",
=======
          backgroundColor: "rgba(255,255,255,0.16)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.25)",
>>>>>>> theirs
          alignItems: "center",
          justifyContent: "center",
        }}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <ChevronLeft size={20} color="#FFFFFF" />
      </Pressable>

      <View style={{ flex: 1 }}>
<<<<<<< ours
        <Text style={{ fontSize: 20, fontWeight: "900", color: "#FFFFFF" }}>
=======
        <Text style={{ fontSize: 18, fontWeight: "900", color: "#FFFFFF" }}>
>>>>>>> theirs
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
<<<<<<< ours

      <Pressable
        onPress={onSwitchAccount}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.18)",
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        }}
        accessibilityRole="button"
        accessibilityLabel="Switch account"
      >
        <Text style={{ color: "#FFFFFF", fontWeight: "900" }}>Account</Text>
        <ChevronDown size={16} color="#FFFFFF" />
      </Pressable>
    </LinearGradient>
=======

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
>>>>>>> theirs
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

<<<<<<< ours
  const [accountSwitchOpen, setAccountSwitchOpen] = useState(false);
  const [transferAccountPickerOpen, setTransferAccountPickerOpen] =
    useState(false);
=======
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);
  const [accountSwitchOpen, setAccountSwitchOpen] = useState(false);
>>>>>>> theirs

  const statementOptions = useMemo(() => buildStatementOptions(), []);
  const [periodPickerOpen, setPeriodPickerOpen] = useState(false);
  const [webOpen, setWebOpen] = useState(false);
  const [period, setPeriod] = useState(() => {
    return statementOptions[0]?.value || "";
  });

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
        {
          headers: authHeaders,
        },
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
    if (last4) return `${type} ••••${last4}`;
    return type;
  }, [account]);

  const subtitle = useMemo(() => {
    if (!account) return null;
    const groupName = account?.group_name ? String(account.group_name) : null;
    if (groupName) return groupName;
    return null;
  }, [account]);

  const balanceLabel = useMemo(() => {
    const n = Number(account?.balance || 0);
    return formatMoney(n);
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
        statementRange?.to,
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

  const onQuickTransfer = useCallback(() => {
    setActiveSegment("transfer");
  }, []);

  const onQuickStatements = useCallback(() => {
    setActiveSegment("statements");
  }, []);

  return (
    <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
      <View
        style={{ flex: 1, backgroundColor: "#F6F7F9", paddingTop: insets.top }}
      >
        <StatusBar style="light" />

        <AccountHeader
          title={title}
          subtitle={subtitle}
          onBack={() => router.back()}
<<<<<<< ours
          onSwitchAccount={() => setAccountSwitchOpen(true)}
=======
          onOpenAccountPicker={() => setAccountSwitchOpen(true)}
>>>>>>> theirs
        />

        {overallLoading ? (
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
              <Text style={{ marginTop: 6, color: "#B91C1C" }}>
                {errorText}
              </Text>
              <Pressable
                onPress={() =>
                  router.replace(`/account/${encodeURIComponent(accountId)}`)
                }
                style={{
                  marginTop: 12,
                  backgroundColor: "#0B4AA2",
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "900" }}>
                  Retry
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
            showsVerticalScrollIndicator={false}
          >
<<<<<<< ours
            {/* Balance + quick actions */}
            <LinearGradient
              colors={["#0B4AA2", "#083A7A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
=======
            {/* Balance card (Chase-like) */}
            <LinearGradient
              colors={["#0B4AA2", "#0A3E86"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
>>>>>>> theirs
              style={{
<<<<<<< ours
                borderRadius: 18,
                padding: 16,
=======
                borderRadius: 18,
                overflow: "hidden",
>>>>>>> theirs
              }}
            >
<<<<<<< ours
              <Text
                style={{ color: "rgba(255,255,255,0.85)", fontWeight: "700" }}
              >
                Available balance
              </Text>
              <Text
                style={{
                  marginTop: 6,
                  fontSize: 34,
                  fontWeight: "900",
                  color: "#FFFFFF",
                }}
              >
                {balanceLabel}
              </Text>
=======
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
>>>>>>> theirs

<<<<<<< ours
              <View style={{ marginTop: 14, flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={onQuickTransfer}
=======
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/statements/[accountId]",
                      params: { accountId: String(accountId) },
                    })
                  }
>>>>>>> theirs
                  style={{
<<<<<<< ours
                    flex: 1,
                    backgroundColor: "rgba(255,255,255,0.16)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.28)",
                    paddingVertical: 12,
                    borderRadius: 12,
=======
                    marginTop: 14,
                    borderRadius: 14,
                    backgroundColor: "rgba(255,255,255,0.16)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.25)",
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    flexDirection: "row",
>>>>>>> theirs
                    alignItems: "center",
<<<<<<< ours

=======
                    justifyContent: "space-between",
>>>>>>> theirs
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Transfer"
                >
<<<<<<< ours
                  <Text style={{ color: "#FFFFFF", fontWeight: "900" }}>
                    Transfer
                  </Text>
                </Pressable>

                <Pressable
                  onPress={onQuickStatements}
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
=======
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <FileText size={18} color="#FFFFFF" />
                    <Text style={{ color: "#FFFFFF", fontWeight: "900" }}>
                      Statements
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.9)",
                      fontWeight: "900",
                    }}
                  >
                    Open
>>>>>>> theirs
                  </Text>
<<<<<<< ours
                </Pressable>
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
=======
                </Pressable>
              </View>
            </LinearGradient>
>>>>>>> theirs

            {/* Content */}
            {activeSegment === "activity" ? (
              <View style={{ marginTop: 14 }}>
                <TransactionHistorySection transactions={transactions} />
              </View>
            ) : null}

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
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "900",
                      color: "#111827",
                    }}
                  >
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
                      borderColor: "#E5E7EB",
                      borderRadius: 12,
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      backgroundColor: "#FFFFFF",
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Select statement period"
                  >
                    <Text style={{ color: "#6B7280" }}>Period</Text>
                    <Text
                      style={{
                        marginTop: 4,
                        fontWeight: "900",
                        color: "#111827",
                      }}
                    >
                      {statementOptions.find(
                        (o) => String(o.value) === String(period),
                      )?.label || "Select period"}
                    </Text>
                  </Pressable>

                  <View
                    style={{ marginTop: 12, flexDirection: "row", gap: 10 }}
                  >
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
                      <Text
                        style={{
                          marginTop: 4,
                          fontWeight: "900",
                          color: "#065F46",
                        }}
                      >
                        {formatMoney(statementTotals.deposits)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#6B7280" }}>Withdrawals</Text>
                      <Text
                        style={{
                          marginTop: 4,
                          fontWeight: "900",
                          color: "#B91C1C",
                        }}
                      >
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

<<<<<<< ours
        {/* Switch account */}
=======
        {/* Transfer account picker */}
>>>>>>> theirs
        <SelectModal
          title="Select account"
          visible={accountSwitchOpen}
          onClose={() => setAccountSwitchOpen(false)}
          options={accountOptions}
          value={accountId}
          onSelect={(v) => {
            const next = String(v);
            setAccountSwitchOpen(false);
            if (!next) return;
            setTransferAccountId(next);
            router.replace(`/account/${encodeURIComponent(next)}`);
          }}
        />

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
<<<<<<< ours

        <WebModal
          title="Statement"
          url={printableUrl}
          visible={webOpen}
          onClose={() => setWebOpen(false)}
        />
=======

        {/* Account switcher (changes the screen) */}
        <SelectModal
          title="Switch account"
          visible={accountSwitchOpen}
          onClose={() => setAccountSwitchOpen(false)}
          options={accountOptions.map((o) => ({
            value: o.value,
            label: o.label,
          }))}
          value={String(accountId)}
          onSelect={(v) => {
            const nextId = String(v);
            setAccountSwitchOpen(false);
            router.replace(`/account/${encodeURIComponent(nextId)}`);
          }}
        />
>>>>>>> theirs
      </View>
    </KeyboardAvoidingAnimatedView>
  );
}
