import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { MapPin, X } from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/utils/auth/store";
import * as Haptics from "expo-haptics";
import {
  useFonts,
  BricolageGrotesque_700Bold,
} from "@expo-google-fonts/bricolage-grotesque";
import { Inter_400Regular, Inter_600SemiBold } from "@expo-google-fonts/inter";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

export default function ListingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { auth } = useAuthStore();
  const queryClient = useQueryClient();

  const [loaded, error] = useFonts({
    BricolageGrotesque_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["watchlist", auth?.id],
    queryFn: async () => {
      const token = useAuthStore.getState().auth?.token;
      if (typeof token !== "string" || token.length === 0) {
        return { watchlist: [] };
      }

      const response = await fetch("/api/watchlist", {
        headers: {
          // use lowercase key + extra header to survive proxies
          authorization: `Bearer ${token}`,
          "x-session-token": token,
        },
      });

      if (!response.ok) {
        return { watchlist: [] };
      }

      return response.json();
    },
    enabled: typeof auth?.token === "string" && auth.token.length > 0,
  });

  const removeFromWatchlistMutation = useMutation({
    mutationFn: async (listingId) => {
      const token = useAuthStore.getState().auth?.token;
      if (typeof token !== "string" || token.length === 0) {
        throw new Error("Unauthorized");
      }

      const response = await fetch("/api/watchlist", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
          "x-session-token": token,
        },
        body: JSON.stringify({ listing_id: listingId, token }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Failed to remove from watchlist");
      }

      return data;
    },
    onMutate: async (listingId) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await queryClient.cancelQueries({ queryKey: ["watchlist", auth?.id] });

      const previousWatchlist = queryClient.getQueryData([
        "watchlist",
        auth?.id,
      ]);

      queryClient.setQueryData(["watchlist", auth?.id], (old) => ({
        ...old,
        watchlist:
          old?.watchlist?.filter((item) => item.id !== listingId) || [],
      }));

      return { previousWatchlist };
    },
    onError: (err, listingId, context) => {
      queryClient.setQueryData(
        ["watchlist", auth?.id],
        context?.previousWatchlist,
      );
      console.error("Error removing from watchlist:", err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist", auth?.id] });
    },
  });

  if (!loaded && !error) {
    return null;
  }

  const styles = getStyles(isDark);
  const listings = data?.watchlist || [];

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Watchlist</Text>
            <Text style={styles.subtitle}>{listings.length} saved items</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!auth ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔐</Text>
            <Text style={styles.emptyTitle}>Sign in to save items</Text>
            <Text style={styles.emptySubtitle}>
              Create an account to track hardware you're interested in
            </Text>
          </View>
        ) : isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : listings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔖</Text>
            <Text style={styles.emptyTitle}>No saved items yet</Text>
            <Text style={styles.emptySubtitle}>
              Browse listings and tap the bookmark icon to save them here
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {listings.map((listing) => (
              <View key={listing.id} style={styles.card}>
                <TouchableOpacity
                  onPress={() => router.push(`/listing/${listing.id}`)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: listing.images[0] }}
                    style={styles.cardImage}
                    contentFit="cover"
                    transition={200}
                  />
                  <View style={styles.locationBadge}>
                    <MapPin size={10} color="#FFFFFF" />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {listing.location}
                    </Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {listing.title}
                    </Text>
                    <Text style={styles.cardPrice}>${listing.price}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeFromWatchlistMutation.mutate(listing.id)}
                  activeOpacity={0.7}
                >
                  <X size={16} color="#FFFFFF" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const getStyles = (isDark) => ({
  container: {
    flex: 1,
    backgroundColor: isDark ? "#121212" : "#FFFFFF",
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: isDark ? "#121212" : "#FFFFFF",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontFamily: "BricolageGrotesque_700Bold",
    fontSize: 32,
    color: isDark ? "rgba(255, 255, 255, 0.87)" : "#000000",
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: isDark ? "rgba(255, 255, 255, 0.6)" : "#6B6B6B",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: CARD_WIDTH,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: isDark ? "#1E1E1E" : "#F9F9F9",
    overflow: "hidden",
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: 180,
    backgroundColor: isDark ? "#2A2A2A" : "#E5E5EA",
  },
  locationBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  locationText: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: "#FFFFFF",
    maxWidth: 80,
  },
  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: isDark ? "rgba(255, 255, 255, 0.87)" : "#000000",
    marginBottom: 6,
    height: 36,
  },
  cardPrice: {
    fontFamily: "BricolageGrotesque_700Bold",
    fontSize: 16,
    color: isDark ? "rgba(255, 255, 255, 0.87)" : "#000000",
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: isDark ? "rgba(255, 255, 255, 0.6)" : "#6B6B6B",
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: "BricolageGrotesque_700Bold",
    fontSize: 20,
    color: isDark ? "rgba(255, 255, 255, 0.87)" : "#000000",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: isDark ? "rgba(255, 255, 255, 0.6)" : "#6B6B6B",
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
