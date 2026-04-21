<<<<<<< ours
import { useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { fetchJson } from "@/utils/fetchJson";
import { useAuth, useRequireAuth } from "@/utils/auth/useAuth";

function money(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

export default function InvoicesScreen() {
  useRequireAuth({ mode: "signin" });

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { auth } = useAuth();
  const jwt = auth?.jwt || null;

  const query = useQuery({
    queryKey: ["invoices"],
    enabled: !!jwt,
    queryFn: async () => fetchJson("/api/invoices", undefined, jwt),
  });

  const onRefresh = useCallback(() => {
    query.refetch();
  }, [query]);

  const invoices = Array.isArray(query.data?.invoices)
    ? query.data.invoices
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", paddingTop: insets.top }}>
      <StatusBar style="dark" />

      <View
        style={{
          paddingHorizontal: 16,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: "#111827" }}>
            Invoices
          </Text>
          <Text style={{ color: "#6B7280" }}>
            Create → send → record payments
          </Text>
        </View>

        <Pressable
          onPress={() => router.push("/(tabs)/more/invoices-new")}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 999,
            backgroundColor: "#111827",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900" }}>New</Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={!!query.isFetching}
            onRefresh={onRefresh}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {query.isLoading ? (
          <ActivityIndicator />
        ) : query.isError ? (
          <Text style={{ color: "#B91C1C" }}>Could not load invoices</Text>
        ) : invoices.length === 0 ? (
          <Text style={{ color: "#6B7280" }}>No invoices yet.</Text>
        ) : (
          invoices.map((inv) => {
            const title = `${String(inv.invoice_number || "INV")} • ${String(inv.customer_name || "")}`;
            const status = String(inv.status || "draft");
            const subtitle = `${status} • Total ${money(inv.amount)} • Balance ${money(inv.balance_due)}`;

            const vat = Number(inv.vat_amount || 0);
            const vatLine =
              Number.isFinite(vat) && vat > 0 ? `VAT ${money(vat)}` : null;

            return (
              <View
                key={inv.id}
                style={{
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 16,
                  padding: 14,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "800", color: "#111827" }}
                >
                  {title}
                </Text>
                <View style={{ height: 6 }} />
                <Text style={{ color: "#6B7280" }}>{subtitle}</Text>
                {vatLine ? (
                  <Text style={{ color: "#6B7280", marginTop: 4 }}>
                    {vatLine}
                  </Text>
                ) : null}
              </View>
            );
          })
        )}

        <Text style={{ color: "#6B7280", fontSize: 12, marginTop: 8 }}>
          Tip: tax is a percentage (e.g. 15 for 15%).
        </Text>
      </ScrollView>
    </View>
  );
}
=======
import { useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { fetchJson } from "@/utils/fetchJson";
import { useAuth, useRequireAuth } from "@/utils/auth/useAuth";

function money(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

export default function InvoicesScreen() {
  useRequireAuth({ mode: "signin" });

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { auth } = useAuth();
  const jwt = auth?.jwt || null;

  const query = useQuery({
    queryKey: ["invoices"],
    enabled: !!jwt,
    queryFn: async () => fetchJson("/api/invoices", undefined, jwt),
  });

  const onRefresh = useCallback(() => {
    query.refetch();
  }, [query]);

  const invoices = Array.isArray(query.data?.invoices)
    ? query.data.invoices
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", paddingTop: insets.top }}>
      <StatusBar style="dark" />

      <View
        style={{
          paddingHorizontal: 16,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: "#111827" }}>
            Invoices
          </Text>
          <Text style={{ color: "#6B7280" }}>
            Create → send → record payments
          </Text>
        </View>

        <Pressable
          onPress={() => router.push("/(tabs)/more/invoices-new")}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 999,
            backgroundColor: "#111827",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900" }}>New</Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={!!query.isFetching}
            onRefresh={onRefresh}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {query.isLoading ? (
          <ActivityIndicator />
        ) : query.isError ? (
          <Text style={{ color: "#B91C1C" }}>Could not load invoices</Text>
        ) : invoices.length === 0 ? (
          <Text style={{ color: "#6B7280" }}>No invoices yet.</Text>
        ) : (
          invoices.map((inv) => {
            const title = `${String(inv.invoice_number || "INV")} • ${String(inv.customer_name || "")}`;
            const status = String(inv.status || "draft");
            const subtitle = `${status} • Total ${money(inv.amount)} • Balance ${money(inv.balance_due)}`;

            const vat = Number(inv.vat_amount || 0);
            const vatLine =
              Number.isFinite(vat) && vat > 0 ? `VAT ${money(vat)}` : null;

            return (
              <View
                key={inv.id}
                style={{
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 16,
                  padding: 14,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "800", color: "#111827" }}
                >
                  {title}
                </Text>
                <View style={{ height: 6 }} />
                <Text style={{ color: "#6B7280" }}>{subtitle}</Text>
                {vatLine ? (
                  <Text style={{ color: "#6B7280", marginTop: 4 }}>
                    {vatLine}
                  </Text>
                ) : null}
              </View>
            );
          })
        )}

        <Text style={{ color: "#6B7280", fontSize: 12, marginTop: 8 }}>
          Tax is set as a percentage on the create screen.
        </Text>
      </ScrollView>
    </View>
  );
}
>>>>>>> theirs
