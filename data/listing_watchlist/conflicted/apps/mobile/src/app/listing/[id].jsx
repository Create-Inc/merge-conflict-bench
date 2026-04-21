import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import Carousel from "react-native-reanimated-carousel";
import {
  ArrowLeft,
  MapPin,
  Star,
  Edit3,
  CheckCircle,
  Bookmark,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useFonts,
  BricolageGrotesque_700Bold,
} from "@expo-google-fonts/bricolage-grotesque";
import { Inter_400Regular, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { useAuthStore } from "@/utils/auth/store";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ListingDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { auth } = useAuthStore();
  const [showBuyerModal, setShowBuyerModal] = useState(false);
  const queryClient = useQueryClient();

  const [loaded, error] = useFonts({
    BricolageGrotesque_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const response = await fetch(`/api/listings/${id}`);
      if (!response.ok) throw new Error("Failed to fetch listing");
      return response.json();
    },
  });

  // Check if listing is in watchlist
  const { data: watchlistData } = useQuery({
    queryKey: ["watchlist", auth?.id],
    queryFn: async () => {
      const currentAuth = useAuthStore.getState().auth;
      const token = currentAuth?.token;

<<<<<<< ours
      if (!token) {
=======
      if (typeof token !== "string" || token.length === 0) {
>>>>>>> theirs
        return { watchlist: [] };
      }

      const response = await fetch("/api/watchlist", {
        headers: {
<<<<<<< ours
          // Some environments strip Authorization, so we send both
          Authorization: `Bearer ${token}`,
          "x-session-token": token,
=======
          authorization: `Bearer ${token}`,
>>>>>>> theirs
        },
      });

      if (!response.ok) {
<<<<<<< ours
        // don’t throw here; we want the screen to still work even if watchlist fails
=======

>>>>>>> theirs
        return { watchlist: [] };
      }

      return response.json();
    },
<<<<<<< ours
    enabled: !!auth?.id,
=======
    enabled: typeof auth?.token === "string" && auth.token.length > 0,
>>>>>>> theirs
  });

  const listing = data?.listing;
  const isSold = !!(listing?.sold_to_user_id && listing?.sold_at);
  const isOwner = Number(auth?.id) === Number(listing?.seller_id);
  const isSaved = watchlistData?.watchlist?.some(
    (item) => Number(item.id) === Number(id),
  );

  // Toggle watchlist mutation
  const toggleWatchlistMutation = useMutation({
    mutationFn: async (shouldSave) => {
<<<<<<< ours
      const token = useAuthStore.getState().auth?.token;
      if (!token) {
        throw new Error("Unauthorized");
      }
=======
      // Get fresh auth from store at fetch time
      const currentAuth = useAuthStore.getState().auth;
      const token = currentAuth?.token;
>>>>>>> theirs

<<<<<<< ours

=======
      if (typeof token !== "string" || token.length === 0) {
        throw new Error("Unauthorized");
      }

>>>>>>> theirs
      const response = await fetch("/api/watchlist", {
        method: shouldSave ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
<<<<<<< ours
          Authorization: `Bearer ${token}`,
          "x-session-token": token,
=======
          authorization: `Bearer ${token}`,
>>>>>>> theirs
        },
        // also send token in body as a fallback
        body: JSON.stringify({ listing_id: parseInt(id), token }),
      });

<<<<<<< ours
      const responseData = await response.json().catch(() => ({}));
=======
      const responseData = await response.json();
>>>>>>> theirs

      if (!response.ok) {
        throw new Error(
          responseData.error ||
            `Failed to ${shouldSave ? "add to" : "remove from"} watchlist`,
        );
      }

      return responseData;
    },
    onMutate: async (shouldSave) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["watchlist", auth?.id] });

      // Snapshot previous value
      const previousWatchlist = queryClient.getQueryData([
        "watchlist",
        auth?.id,
      ]);

      // Optimistically update
      queryClient.setQueryData(["watchlist", auth?.id], (old) => {
        if (shouldSave) {
          // Add to watchlist - create an item that matches the API response structure
          const watchlistItem = {
            ...listing,
            watchlist_id: Date.now(), // temporary ID
            saved_at: new Date().toISOString(),
          };
          return {
            ...old,
            watchlist: [...(old?.watchlist || []), watchlistItem],
          };
        } else {
          // Remove from watchlist
          return {
            ...old,
            watchlist:
              old?.watchlist?.filter(
                (item) => Number(item.id) !== Number(id),
              ) || [],
          };
        }
      });

      return { previousWatchlist };
    },
    onError: (err, shouldSave, context) => {
      console.log("[Watchlist Mutation] Error:", err);

      // Rollback on error
      queryClient.setQueryData(
        ["watchlist", auth?.id],
        context?.previousWatchlist,
      );

      // Check if it's an authentication error
      if (
        String(err?.message || "").includes("Invalid or expired token") ||
        String(err?.message || "").includes("Unauthorized")
      ) {
        Alert.alert(
          "Session Expired",
          "Please sign in again to save listings.",
          [
            {
              text: "Sign In",
              onPress: () => {
                useAuthStore.getState().setAuth(null);
                router.push("/auth-landing");
              },
            },
            { text: "Cancel", style: "cancel" },
          ],
        );
        return;
      }

      Alert.alert("Error", err.message);
    },
    onSuccess: (data, shouldSave) => {
      console.log("[Watchlist Mutation] Success:", data);
      // Don't show alert - the visual update is enough
    },
    onSettled: () => {
      console.log("[Watchlist Mutation] Settled, invalidating queries");
      // Refetch to ensure sync
      queryClient.invalidateQueries({ queryKey: ["watchlist", auth?.id] });
    },
  });

  const handleToggleWatchlist = () => {
<<<<<<< ours
    const token = useAuthStore.getState().auth?.token;
    if (!token) {
      Alert.alert("Sign in required", "Please sign in to save listings");
=======
    const token = useAuthStore.getState().auth?.token;

    if (typeof token !== "string" || token.length === 0) {
      Alert.alert("Sign in required", "Please sign in to save listings", [
        { text: "Sign In", onPress: () => router.push("/auth-landing") },
        { text: "Cancel", style: "cancel" },
      ]);
>>>>>>> theirs
      return;
    }

    toggleWatchlistMutation.mutate(!isSaved);
  };

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: parseInt(id),
          user1_id: auth?.id,
          user2_id: data?.listing?.seller_id,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create conversation");
      }
      return response.json();
    },
    onSuccess: (data) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push(`/chat/${data.conversation.id}`);
    },
    onError: (error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message);
    },
  });

  // Fetch conversations for this listing to get potential buyers (2 most recent)
  const {
    data: conversationsData,
    isLoading: isLoadingConversations,
    error: conversationsError,
  } = useQuery({
    queryKey: ["listing-conversations", id, auth?.id, showBuyerModal],
    queryFn: async () => {
      if (!auth?.id) {
        throw new Error("Not authenticated");
      }

      const url = `/api/conversations?userId=${auth.id}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch conversations: ${response.status}`);
      }

      const result = await response.json();

      // Filter conversations for this listing and get 2 most recent
      const filtered = result.conversations
        .filter((c) => c.listing_id === parseInt(id))
        .slice(0, 2);

      return { conversations: filtered };
    },
    enabled: showBuyerModal && !!auth?.id && isOwner,
  });

  const markAsSoldMutation = useMutation({
    mutationFn: async ({ buyerUserId, conversationId }) => {
      // Get fresh auth from store at fetch time
      const currentAuth = useAuthStore.getState().auth;

      const response = await fetch(`/api/listings/${id}/mark-sold`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentAuth?.token}`,
        },
        body: JSON.stringify({ buyer_user_id: buyerUserId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to mark as sold");
      }
      const result = await response.json();
      return { result, conversationId };
    },
    onSuccess: ({ conversationId }, { buyerUserId }) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowBuyerModal(false);
      queryClient.invalidateQueries({ queryKey: ["listing", id] });

      // Navigate to chat with buyer if a specific buyer was selected
      if (buyerUserId !== null && conversationId) {
        setTimeout(() => {
          router.push(`/chat/${conversationId}`);
        }, 300);
      } else {
        Alert.alert("Success", "Listing marked as sold!");
      }
    },
    onError: (error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message);
    },
  });

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/edit-listing",
      params: {
        id: listing.id,
        title: listing.title,
        price: listing.price,
        description: listing.description || "",
        category: listing.category || "",
        location: listing.location || "",
        images: JSON.stringify(listing.images || []),
      },
    });
  };

  if (!loaded && !error) {
    return null;
  }

  const styles = getStyles(isDark);
  const potentialBuyers = conversationsData?.conversations || [];

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#76B900" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Save/Unsave button - only show if not owner */}
        {!isOwner && (
          <TouchableOpacity
            onPress={handleToggleWatchlist}
            style={styles.saveButton}
            activeOpacity={0.7}
          >
            <Bookmark
              size={24}
              color="#FFFFFF"
              fill={isSaved ? "#FFFFFF" : "transparent"}
              strokeWidth={isSaved ? 0 : 2}
            />
          </TouchableOpacity>
        )}

        {isSold && (
          <View style={styles.soldBadge}>
            <Text style={styles.soldBadgeText}>SOLD</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Carousel */}
        <View style={styles.carouselSection}>
          <Carousel
            loop={false}
            width={SCREEN_WIDTH}
            height={400}
            data={listing?.images || []}
            scrollAnimationDuration={300}
            onSnapToItem={setActiveImageIndex}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={styles.carouselImage}
                contentFit="cover"
                transition={200}
              />
            )}
          />
          <View style={styles.pageIndicator}>
            {listing?.images?.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.pageDot,
                  activeImageIndex === index
                    ? styles.pageDotActive
                    : styles.pageDotInactive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Price and Title */}
          <View style={styles.titleSection}>
            <Text style={styles.price}>${listing?.price}</Text>
            <Text style={styles.title}>{listing?.title}</Text>
            {listing?.location && (
              <View style={styles.locationRow}>
                <MapPin
                  size={16}
                  color={isDark ? "rgba(255, 255, 255, 0.6)" : "#8E8E93"}
                />
                <Text style={styles.location}>{listing.location}</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Description */}
          {listing?.description && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>{listing.description}</Text>
              </View>
              <View style={styles.divider} />
            </>
          )}

          {/* Seller Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seller</Text>
            <TouchableOpacity
              style={styles.sellerCard}
              onPress={() => router.push(`/seller/${listing.seller_id}`)}
              activeOpacity={0.7}
            >
              {listing?.seller_avatar ? (
                <Image
                  source={{ uri: listing.seller_avatar }}
                  style={styles.sellerAvatar}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={styles.sellerAvatar}>
                  <Text style={styles.sellerAvatarText}>
                    {listing?.username?.charAt(0).toUpperCase() || "?"}
                  </Text>
                </View>
              )}
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>{listing?.username}</Text>
                {listing?.seller_location && (
                  <View style={styles.sellerLocationRow}>
                    <MapPin
                      size={14}
                      color={isDark ? "rgba(255, 255, 255, 0.6)" : "#8E8E93"}
                    />
                    <Text style={styles.sellerLocation}>
                      {listing.seller_location}
                    </Text>
                  </View>
                )}
                {listing?.seller_rating > 0 && (
                  <View style={styles.ratingRow}>
                    <Star size={14} color="#FFD700" fill="#FFD700" />
                    <Text style={styles.rating}>
                      {Number(listing.seller_rating).toFixed(1)}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Buttons - show Edit/Mark as Sold for your own listings, Message Seller for others */}
      {isOwner ? (
        <View
          style={[
            styles.buttonContainer,
            { paddingBottom: insets.bottom + 16 },
          ]}
        >
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.ownerEditButton}
              onPress={handleEdit}
              activeOpacity={0.8}
            >
              <Edit3 size={20} color="#FFFFFF" />
              <Text style={styles.ownerEditButtonText}>Edit</Text>
            </TouchableOpacity>
            {!isSold && (
              <TouchableOpacity
                style={styles.soldButton}
                onPress={() => setShowBuyerModal(true)}
                activeOpacity={0.8}
              >
                <CheckCircle size={20} color="#FFFFFF" />
                <Text style={styles.soldButtonText}>Mark as Sold</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.buttonContainer,
            { paddingBottom: insets.bottom + 16 },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.messageButton,
              isSold && styles.messageButtonDisabled,
            ]}
            onPress={() => createConversationMutation.mutate()}
            activeOpacity={0.8}
            disabled={createConversationMutation.isPending || isSold}
          >
            <Text style={styles.messageButtonText}>
              {isSold
                ? "Sold"
                : createConversationMutation.isPending
                  ? "Loading..."
                  : "Message Seller"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Buyer Selection Modal */}
      <Modal
        visible={showBuyerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBuyerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}
          >
            <Text style={styles.modalTitle}>Who bought this item?</Text>
            <Text style={styles.modalSubtitle}>
              {isLoadingConversations
                ? "Loading conversations..."
                : "Select the buyer"}
            </Text>

            {conversationsError && (
              <View style={{ paddingVertical: 20, alignItems: "center" }}>
                <Text style={[styles.modalSubtitle, { color: "#FF3B30" }]}>
                  Error: {conversationsError.message}
                </Text>
              </View>
            )}

            <ScrollView
              style={styles.buyerList}
              showsVerticalScrollIndicator={false}
            >
              {isLoadingConversations ? (
                <ActivityIndicator
                  size="large"
                  color="#76B900"
                  style={{ marginVertical: 20 }}
                />
              ) : conversationsError ? null : potentialBuyers.length === 0 ? (
                <View style={{ paddingVertical: 20, alignItems: "center" }}>
                  <Text style={styles.modalSubtitle}>No conversations yet</Text>
                  <Text
                    style={[
                      styles.modalSubtitle,
                      { fontSize: 12, marginTop: 8 },
                    ]}
                  >
                    No one has messaged you about this listing
                  </Text>
                </View>
              ) : (
                potentialBuyers.map((conversation) => (
                  <TouchableOpacity
                    key={conversation.id}
                    style={styles.buyerCard}
                    onPress={() => {
                      markAsSoldMutation.mutate({
                        buyerUserId: conversation.other_user_id,
                        conversationId: conversation.id,
                      });
                    }}
                    disabled={markAsSoldMutation.isPending}
                    activeOpacity={0.7}
                  >
                    {conversation.other_avatar ? (
                      <Image
                        source={{ uri: conversation.other_avatar }}
                        style={styles.buyerAvatar}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={styles.buyerAvatar}>
                        <Text style={styles.buyerAvatarText}>
                          {conversation.other_username?.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.buyerName}>
                      {conversation.other_username}
                    </Text>
                    {markAsSoldMutation.isPending && (
                      <ActivityIndicator size="small" color="#76B900" />
                    )}
                  </TouchableOpacity>
                ))
              )}

              {/* Sold Somewhere Else option */}
              <TouchableOpacity
                style={styles.soldElsewhereCard}
                onPress={() => {
                  markAsSoldMutation.mutate({
                    buyerUserId: null,
                    conversationId: null,
                  });
                }}
                disabled={markAsSoldMutation.isPending}
                activeOpacity={0.7}
              >
                <Text style={styles.soldElsewhereText}>
                  Sold Somewhere Else
                </Text>
                {markAsSoldMutation.isPending && (
                  <ActivityIndicator
                    size="small"
                    color="#76B900"
                    style={{ marginLeft: 8 }}
                  />
                )}
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowBuyerModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (isDark) => ({
  container: {
    flex: 1,
    backgroundColor: isDark ? "#121212" : "#FFFFFF",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {},
  carouselSection: {
    position: "relative",
  },
  carouselImage: {
    width: SCREEN_WIDTH,
    height: 400,
    backgroundColor: isDark ? "#2A2A2A" : "#E5E5EA",
  },
  pageIndicator: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  pageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pageDotActive: {
    backgroundColor: "#FFFFFF",
  },
  pageDotInactive: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  content: {
    paddingHorizontal: 24,
  },
  titleSection: {
    paddingVertical: 24,
  },
  price: {
    fontFamily: "BricolageGrotesque_700Bold",
    fontSize: 32,
    color: isDark ? "rgba(255, 255, 255, 0.87)" : "#000000",
    marginBottom: 8,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 20,
    color: isDark ? "rgba(255, 255, 255, 0.87)" : "#000000",
    lineHeight: 28,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  location: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: isDark ? "rgba(255, 255, 255, 0.6)" : "#8E8E93",
  },
  divider: {
    height: 1,
    backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#E5E5EA",
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: "BricolageGrotesque_700Bold",
    fontSize: 18,
    color: isDark ? "rgba(255, 255, 255, 0.87)" : "#000000",
    marginBottom: 12,
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: isDark ? "rgba(255, 255, 255, 0.87)" : "#000000",
    lineHeight: 22,
  },
  sellerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: isDark ? "#1E1E1E" : "#F9F9F9",
    borderRadius: 12,
  },
  sellerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: isDark ? "#2C2C2E" : "#E5E5EA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sellerAvatarText: {
    fontFamily: "BricolageGrotesque_700Bold",
    fontSize: 24,
    color: isDark ? "rgba(255, 255, 255, 0.87)" : "#000000",
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: isDark ? "rgba(255, 255, 255, 0.87)" : "#000000",
    marginBottom: 4,
  },
  sellerLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  sellerLocation: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: isDark ? "rgba(255, 255, 255, 0.6)" : "#8E8E93",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rating: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: isDark ? "rgba(255, 255, 255, 0.87)" : "#000000",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: isDark ? "#121212" : "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#E5E5EA",
  },
  messageButton: {
    backgroundColor: isDark ? "#2C2C2E" : "#1C1C1E",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  messageButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  soldBadge: {
    position: "absolute",
    top: 60,
    right: 16,
    backgroundColor: "#FF3B30",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  soldBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  ownerEditButton: {
    flex: 1,
    backgroundColor: isDark ? "#2C2C2E" : "#1C1C1E",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  ownerEditButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  soldButton: {
    flex: 1,
    backgroundColor: "#76B900",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  soldButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  messageButtonDisabled: {
    backgroundColor: isDark ? "#2C2C2E" : "#E5E5EA",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 24,
    maxHeight: "80%",
  },
  modalTitle: {
    fontFamily: "BricolageGrotesque_700Bold",
    fontSize: 24,
    color: isDark ? "rgba(255, 255, 255, 0.87)" : "#000000",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: isDark ? "rgba(255, 255, 255, 0.6)" : "#8E8E93",
    marginBottom: 24,
    textAlign: "center",
  },
  buyerList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  buyerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: isDark ? "#2C2C2E" : "#F9F9F9",
    borderRadius: 12,
    marginBottom: 12,
  },
  buyerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: isDark ? "#3A3A3C" : "#E5E5EA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  buyerAvatarText: {
    fontFamily: "BricolageGrotesque_700Bold",
    fontSize: 20,
    color: isDark ? "rgba(255, 255, 255, 0.87)" : "#000000",
  },
  buyerName: {
    flex: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: isDark ? "rgba(255, 255, 255, 0.87)" : "#000000",
  },
  soldElsewhereCard: {
    padding: 16,
    backgroundColor: "transparent",
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#76B900",
    flexDirection: "row",
    justifyContent: "center",
  },
  soldElsewhereText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#76B900",
  },
  modalCancelButton: {
    backgroundColor: isDark ? "#2C2C2E" : "#E5E5EA",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  modalCancelText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: isDark ? "rgba(255, 255, 255, 0.87)" : "#000000",
  },
});
