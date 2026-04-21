<<<<<<< ours
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import { fetchJson } from "@/utils/fetchJson";
import { useAuth, useRequireAuth } from "@/utils/auth/useAuth";

function cleanText(v) {
  return String(v || "").trim();
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function clampPct(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

function money(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

function computeFromSubtotal(subtotalAmount, taxRatePct) {
  const subtotal = Number(subtotalAmount || 0);
  const pct = clampPct(taxRatePct);
  const rate = pct / 100;

  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return { tax: 0, total: 0 };
  }

  if (!pct) {
    const safeSubtotal = Math.round(subtotal * 100) / 100;
    return { tax: 0, total: safeSubtotal };
  }

  const tax = Math.round(subtotal * rate * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  return { tax, total };
}

export default function InvoicesNewScreen() {
  useRequireAuth({ mode: "signin" });

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { auth } = useAuth();
  const jwt = auth?.jwt || null;

  const [error, setError] = useState(null);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [status, setStatus] = useState("draft");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [amount, setAmount] = useState(""); // subtotal (excl tax)
  const [taxRate, setTaxRate] = useState("0");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const computed = useMemo(() => {
    const subtotal = toNumber(amount);
    if (!Number.isFinite(subtotal) || subtotal < 0) {
      return { tax: 0, total: 0 };
    }
    return computeFromSubtotal(subtotal, taxRate);
  }, [amount, taxRate]);

  const createMutation = useMutation({
    mutationFn: async (payload) =>
      fetchJson(
        "/api/invoices",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        jwt,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setError(null);
      router.back();
    },
    onError: (err) => {
      console.error(err);
      const msg = err?.message
        ? String(err.message)
        : "Could not create invoice";
      setError(msg);
    },
  });

  const onSubmit = useCallback(() => {
    setError(null);

    const name = cleanText(customerName);
    if (!name) {
      setError("Customer name is required");
      return;
    }

    const subtotal = toNumber(amount);
    if (!Number.isFinite(subtotal) || subtotal < 0) {
      setError("Subtotal must be a non-negative number");
      return;
    }

    const taxRatePct = clampPct(taxRate);

    createMutation.mutate({
      invoiceNumber: cleanText(invoiceNumber) || null,
      status,
      customerName: name,
      customerEmail: cleanText(customerEmail) || null,
      // Amount is subtotal (excl. tax)
      amount: subtotal,
      taxRate: taxRatePct,
      taxInclusive: false,
      // send vatAmount too (backward compatible)
      vatAmount: computed.tax,
      issueDate: cleanText(issueDate) || null,
      dueDate: cleanText(dueDate) || null,
      notes: cleanText(notes) || null,
    });
  }, [
    customerName,
    amount,
    taxRate,
    status,
    invoiceNumber,
    customerEmail,
    issueDate,
    dueDate,
    notes,
    computed.tax,
    createMutation,
  ]);

  const busy = createMutation.isPending;

  return (
    <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
      <View
        style={{ flex: 1, backgroundColor: "#fff", paddingTop: insets.top }}
      >
        <StatusBar style="dark" />

        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#E5E7EB",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{ paddingVertical: 10, paddingRight: 10 }}
          >
            <Text style={{ color: "#111827", fontWeight: "800" }}>Back</Text>
          </Pressable>
          <Text style={{ color: "#111827", fontWeight: "900", fontSize: 16 }}>
            New invoice
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 16,
              padding: 14,
              backgroundColor: "#fff",
            }}
          >
            <Text style={{ fontWeight: "900", color: "#111827" }}>Basics</Text>
            <View style={{ height: 12 }} />

            <Text style={{ fontSize: 12, color: "#6B7280" }}>
              Invoice # (optional)
            </Text>
            <View style={{ height: 6 }} />
            <TextInput
              value={invoiceNumber}
              onChangeText={setInvoiceNumber}
              placeholder="INV-2026-0001"
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: "#111827",
              }}
            />

            <View style={{ height: 12 }} />

            <Text style={{ fontSize: 12, color: "#6B7280" }}>Status</Text>
            <View style={{ height: 6 }} />
            <View
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {[
                { key: "draft", label: "draft" },
                { key: "pending", label: "pending" },
              ].map((opt) => {
                const active = status === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setStatus(opt.key)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      borderTopWidth: opt.key === "draft" ? 0 : 1,
                      borderTopColor: "#F3F4F6",
                      backgroundColor: active ? "#111827" : "#fff",
                    }}
                  >
                    <Text
                      style={{
                        color: active ? "#fff" : "#111827",
                        fontWeight: "900",
                      }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ height: 12 }} />

            <Text style={{ fontSize: 12, color: "#6B7280" }}>
              Customer name *
            </Text>
            <View style={{ height: 6 }} />
            <TextInput
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Customer"
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: "#111827",
              }}
            />

            <View style={{ height: 12 }} />

            <Text style={{ fontSize: 12, color: "#6B7280" }}>
              Customer email (optional)
            </Text>
            <View style={{ height: 6 }} />
            <TextInput
              value={customerEmail}
              onChangeText={setCustomerEmail}
              placeholder="billing@customer.com"
              autoCapitalize="none"
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: "#111827",
              }}
            />

            <View style={{ height: 12 }} />

            <Text style={{ fontSize: 12, color: "#6B7280" }}>
              Subtotal (excl. tax) *
            </Text>
            <View style={{ height: 6 }} />
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="numeric"
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: "#111827",
              }}
            />

            <View style={{ height: 12 }} />

            <Text style={{ fontSize: 12, color: "#6B7280" }}>Tax rate (%)</Text>
            <View style={{ height: 6 }} />
            <TextInput
              value={taxRate}
              onChangeText={setTaxRate}
              placeholder="0"
              keyboardType="numeric"
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: "#111827",
              }}
            />
            <Text style={{ color: "#6B7280", fontSize: 12, marginTop: 6 }}>
              Tax: {money(computed.tax)} • Total: {money(computed.total)}
            </Text>

            <View style={{ height: 12 }} />

            <Text style={{ fontSize: 12, color: "#6B7280" }}>Issue date</Text>
            <View style={{ height: 6 }} />
            <TextInput
              value={issueDate}
              onChangeText={setIssueDate}
              placeholder="YYYY-MM-DD"
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: "#111827",
              }}
            />

            <View style={{ height: 12 }} />

            <Text style={{ fontSize: 12, color: "#6B7280" }}>Due date</Text>
            <View style={{ height: 6 }} />
            <TextInput
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="YYYY-MM-DD"
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: "#111827",
              }}
            />

            <View style={{ height: 12 }} />

            <Text style={{ fontSize: 12, color: "#6B7280" }}>Notes</Text>
            <View style={{ height: 6 }} />
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional"
              multiline
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                minHeight: 80,
                color: "#111827",
                textAlignVertical: "top",
              }}
            />
          </View>

          {error ? (
            <Text
              style={{ color: "#B91C1C", marginTop: 10, fontWeight: "800" }}
            >
              {error}
            </Text>
          ) : null}

          <View style={{ height: 14 }} />

          <Pressable
            onPress={onSubmit}
            disabled={busy}
            style={{
              paddingVertical: 12,
              borderRadius: 14,
              backgroundColor: "#111827",
              opacity: busy ? 0.7 : 1,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>
              {busy ? "Creating…" : "Create invoice"}
            </Text>
          </Pressable>

          {busy ? (
            <View style={{ paddingTop: 12 }}>
              <ActivityIndicator />
            </View>
          ) : null}

          <Text style={{ color: "#6B7280", fontSize: 12, marginTop: 10 }}>
            Tip: tax is a percentage (e.g. 15 for 15%).
          </Text>
        </ScrollView>
      </View>
    </KeyboardAvoidingAnimatedView>
  );
}
=======
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import { fetchJson } from "@/utils/fetchJson";
import { useAuth, useRequireAuth } from "@/utils/auth/useAuth";

function cleanText(v) {
  return String(v || "").trim();
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function clampPct(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

function money(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

function computeVatFromTotal(totalAmount, taxRatePct) {
  const total = Number(totalAmount || 0);
  const pct = clampPct(taxRatePct);
  const rate = pct / 100;

  if (!Number.isFinite(total) || total <= 0 || !pct) {
    return 0;
  }

  const subtotal = total / (1 + rate);
  const vat = total - subtotal;
  const safe = Math.round(vat * 100) / 100;
  return safe;
}

export default function InvoicesNewScreen() {
  useRequireAuth({ mode: "signin" });

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { auth } = useAuth();
  const jwt = auth?.jwt || null;

  const [error, setError] = useState(null);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [status, setStatus] = useState("draft");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [taxRate, setTaxRate] = useState("0");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const computedVat = useMemo(() => {
    const amt = toNumber(amount);
    if (!Number.isFinite(amt) || amt < 0) {
      return 0;
    }
    return computeVatFromTotal(amt, taxRate);
  }, [amount, taxRate]);

  const createMutation = useMutation({
    mutationFn: async (payload) =>
      fetchJson(
        "/api/invoices",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        jwt,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setError(null);
      router.back();
    },
    onError: (err) => {
      console.error(err);
      const msg = err?.message
        ? String(err.message)
        : "Could not create invoice";
      setError(msg);
    },
  });

  const onSubmit = useCallback(() => {
    setError(null);

    const name = cleanText(customerName);
    if (!name) {
      setError("Customer name is required");
      return;
    }

    const amt = toNumber(amount);
    if (!Number.isFinite(amt) || amt < 0) {
      setError("Amount must be a non-negative number");
      return;
    }

    const taxRatePct = clampPct(taxRate);

    createMutation.mutate({
      invoiceNumber: cleanText(invoiceNumber) || null,
      status,
      customerName: name,
      customerEmail: cleanText(customerEmail) || null,
      // Amount is total (incl. tax)
      amount: amt,
      taxRate: taxRatePct,
      taxInclusive: true,
      // send vatAmount too (backward compatible)
      vatAmount: computedVat,
      issueDate: cleanText(issueDate) || null,
      dueDate: cleanText(dueDate) || null,
      notes: cleanText(notes) || null,
    });
  }, [
    customerName,
    amount,
    taxRate,
    status,
    invoiceNumber,
    customerEmail,
    issueDate,
    dueDate,
    notes,
    computedVat,
    createMutation,
  ]);

  const busy = createMutation.isPending;

  return (
    <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
      <View
        style={{ flex: 1, backgroundColor: "#fff", paddingTop: insets.top }}
      >
        <StatusBar style="dark" />

        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#E5E7EB",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{ paddingVertical: 10, paddingRight: 10 }}
          >
            <Text style={{ color: "#111827", fontWeight: "800" }}>Back</Text>
          </Pressable>
          <Text style={{ color: "#111827", fontWeight: "900", fontSize: 16 }}>
            New invoice
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 16,
              padding: 14,
              backgroundColor: "#fff",
            }}
          >
            <Text style={{ fontWeight: "900", color: "#111827" }}>Basics</Text>
            <View style={{ height: 12 }} />

            <Text style={{ fontSize: 12, color: "#6B7280" }}>
              Invoice # (optional)
            </Text>
            <View style={{ height: 6 }} />
            <TextInput
              value={invoiceNumber}
              onChangeText={setInvoiceNumber}
              placeholder="INV-2026-0001"
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: "#111827",
              }}
            />

            <View style={{ height: 12 }} />

            <Text style={{ fontSize: 12, color: "#6B7280" }}>Status</Text>
            <View style={{ height: 6 }} />
            <View
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {[
                { key: "draft", label: "draft" },
                { key: "pending", label: "pending" },
              ].map((opt) => {
                const active = status === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setStatus(opt.key)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      borderTopWidth: opt.key === "draft" ? 0 : 1,
                      borderTopColor: "#F3F4F6",
                      backgroundColor: active ? "#111827" : "#fff",
                    }}
                  >
                    <Text
                      style={{
                        color: active ? "#fff" : "#111827",
                        fontWeight: "900",
                      }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ height: 12 }} />

            <Text style={{ fontSize: 12, color: "#6B7280" }}>
              Customer name *
            </Text>
            <View style={{ height: 6 }} />
            <TextInput
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Customer"
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: "#111827",
              }}
            />

            <View style={{ height: 12 }} />

            <Text style={{ fontSize: 12, color: "#6B7280" }}>
              Customer email (optional)
            </Text>
            <View style={{ height: 6 }} />
            <TextInput
              value={customerEmail}
              onChangeText={setCustomerEmail}
              placeholder="billing@customer.com"
              autoCapitalize="none"
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: "#111827",
              }}
            />

            <View style={{ height: 12 }} />

            <Text style={{ fontSize: 12, color: "#6B7280" }}>
              Amount (total, incl. tax) *
            </Text>
            <View style={{ height: 6 }} />
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="numeric"
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: "#111827",
              }}
            />

            <View style={{ height: 12 }} />

            <Text style={{ fontSize: 12, color: "#6B7280" }}>Tax rate (%)</Text>
            <View style={{ height: 6 }} />
            <TextInput
              value={taxRate}
              onChangeText={setTaxRate}
              placeholder="0"
              keyboardType="numeric"
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: "#111827",
              }}
            />
            <Text style={{ color: "#6B7280", fontSize: 12, marginTop: 6 }}>
              VAT amount (calculated): {money(computedVat)}
            </Text>

            <View style={{ height: 12 }} />

            <Text style={{ fontSize: 12, color: "#6B7280" }}>Issue date</Text>
            <View style={{ height: 6 }} />
            <TextInput
              value={issueDate}
              onChangeText={setIssueDate}
              placeholder="YYYY-MM-DD"
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: "#111827",
              }}
            />

            <View style={{ height: 12 }} />

            <Text style={{ fontSize: 12, color: "#6B7280" }}>Due date</Text>
            <View style={{ height: 6 }} />
            <TextInput
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="YYYY-MM-DD"
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: "#111827",
              }}
            />

            <View style={{ height: 12 }} />

            <Text style={{ fontSize: 12, color: "#6B7280" }}>Notes</Text>
            <View style={{ height: 6 }} />
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional"
              multiline
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                minHeight: 80,
                color: "#111827",
                textAlignVertical: "top",
              }}
            />
          </View>

          {error ? (
            <Text
              style={{ color: "#B91C1C", marginTop: 10, fontWeight: "800" }}
            >
              {error}
            </Text>
          ) : null}

          <View style={{ height: 14 }} />

          <Pressable
            onPress={onSubmit}
            disabled={busy}
            style={{
              paddingVertical: 12,
              borderRadius: 14,
              backgroundColor: "#111827",
              opacity: busy ? 0.7 : 1,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>
              {busy ? "Creating…" : "Create invoice"}
            </Text>
          </Pressable>

          {busy ? (
            <View style={{ paddingTop: 12 }}>
              <ActivityIndicator />
            </View>
          ) : null}

          <Text style={{ color: "#6B7280", fontSize: 12, marginTop: 10 }}>
            Tip: tax is a percentage (e.g. 15 for 15%).
          </Text>
        </ScrollView>
      </View>
    </KeyboardAvoidingAnimatedView>
  );
}
>>>>>>> theirs
