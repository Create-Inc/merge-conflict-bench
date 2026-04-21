import { Pressable, ScrollView, Text, View } from "react-native";
import { Map as MapIcon } from "lucide-react-native";
import { SEMANTIC_COLORS } from "../constants";
<<<<<<< ours
import PlaceCard from "@/components/shared/PlaceCard";
=======
import { PlaceCard, PlaceCardSkeleton } from "@/components/shared/PlaceCard";
>>>>>>> theirs

<<<<<<< ours
function SkeletonCard() {
  const placeColors = SEMANTIC_COLORS.place;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#141414",
        borderWidth: 1,
        borderColor: "#232323",
        borderRadius: 20,
        // NOTE: keep shadow visible (no overflow here)

        shadowColor: placeColors.primary,
        shadowOpacity: 0.28,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 10 },
        elevation: 8,
      }}
    >
      <View style={{ flex: 1, borderRadius: 20, overflow: "hidden" }}>
        <View style={{ height: 120, backgroundColor: "#0f0f0f" }} />
        <View style={{ padding: 12 }}>
          <View
            style={{
              height: 26,
              borderRadius: 999,
              backgroundColor: "#111111",
              width: 108,
              borderWidth: 1,
              borderColor: "#232323",
              marginBottom: 10,
            }}
          />
          <View
            style={{
              height: 14,
              borderRadius: 8,
              backgroundColor: "#1f1f1f",
              width: "92%",
            }}
          />
          <View
            style={{
              height: 12,
              borderRadius: 8,
              backgroundColor: "#1f1f1f",
              width: "70%",
              marginTop: 10,
            }}
          />
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <View
              style={{
                height: 24,
                borderRadius: 999,
                backgroundColor: "#111111",
                width: 86,
                borderWidth: 1,
                borderColor: "#232323",
              }}
            />
            <View
              style={{
                height: 24,
                borderRadius: 999,
                backgroundColor: "#111111",
                width: 66,
                borderWidth: 1,
                borderColor: "#232323",
              }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

=======

>>>>>>> theirs
export function FeaturedPlacesSection({
  enabled,
  isLoading,
  places,
  onOpenMap,
  onOpenPlace,
  onToggleSavePlace,
  isPlaceSaved,
  emptyState,
}) {
  if (!enabled) {
    return null;
  }

  const list = Array.isArray(places) ? places.slice(0, 4) : [];
  const showEmpty = !isLoading && list.length === 0;

  const emptyTitle = emptyState?.title ? String(emptyState.title) : "";
  const emptyBody = emptyState?.body ? String(emptyState.body) : "";
  const emptyActionLabel = emptyState?.actionLabel
    ? String(emptyState.actionLabel)
    : "";
  const onEmptyAction =
    typeof emptyState?.onAction === "function" ? emptyState.onAction : null;

  const showFilteredEmpty = Boolean(showEmpty && emptyTitle);

  return (
    <View style={{ marginTop: 18 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <View>
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "900" }}>
            Featured Places
          </Text>
          <Text
            style={{
              marginTop: 2,
              color: "#9CA3AF",
              fontSize: 12,
              fontWeight: "700",
            }}
          >
            Curated picks from the XPLR team
          </Text>
        </View>

        <Pressable
          onPress={onOpenMap}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 999,
            // Phase 14.1: use XPLR Red accents (Field Guide brand)
            backgroundColor: pressed
              ? "rgba(255,49,49,0.14)"
              : "rgba(255,49,49,0.10)",
            borderWidth: 1,
            borderColor: "rgba(255,49,49,0.45)",
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <MapIcon size={16} color={SEMANTIC_COLORS.place.primary} />
          <Text
            style={{
              color: SEMANTIC_COLORS.place.primary,
              fontWeight: "900",
              fontSize: 12,
            }}
          >
            Map
          </Text>
        </Pressable>
      </View>

      {showEmpty ? (
        <View
          style={{
            backgroundColor: "#141414",
            borderWidth: 1,
            borderColor: "#232323",
            borderRadius: 20,
            padding: 14,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 13 }}>
            {showFilteredEmpty ? emptyTitle : "No featured places yet"}
          </Text>
          <Text
            style={{
              color: "#9CA3AF",
              fontWeight: "700",
              fontSize: 12,
              marginTop: 6,
            }}
          >
            {showFilteredEmpty
              ? emptyBody || "Try adjusting your filters."
              : "Check back soon. We’re adding more vetted spots."}
          </Text>

          {showFilteredEmpty && emptyActionLabel && onEmptyAction ? (
            <Pressable
              onPress={onEmptyAction}
              style={({ pressed }) => ({
                marginTop: 10,
                alignSelf: "flex-start",
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: "#232323",
                backgroundColor: pressed ? "#0f0f0f" : "#000",
              })}
            >
              <Text
                style={{
                  color: SEMANTIC_COLORS.place.primary,
                  fontWeight: "900",
                  fontSize: 12,
                }}
              >
                {emptyActionLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* Horizontal row (4 cards) to avoid stacked/vertical look */}
      <ScrollView
        horizontal
        style={{ flexGrow: 0 }}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingRight: 20 }}
      >
        {isLoading ? (
          <>
            <View style={{ width: 260 }}>
              <PlaceCardSkeleton />
            </View>
            <View style={{ width: 260 }}>
              <PlaceCardSkeleton />
            </View>
            <View style={{ width: 260 }}>
              <PlaceCardSkeleton />
            </View>
            <View style={{ width: 260 }}>
              <PlaceCardSkeleton />
            </View>
          </>
        ) : (
          list.map((p, idx) => {
            const key = p?.id ? String(p.id) : `featured-${idx}`;
            const placeId = p?.id ? String(p.id) : "";
            const saved =
              placeId && typeof isPlaceSaved === "function"
                ? isPlaceSaved(placeId)
                : false;

            return (
              <View key={key} style={{ width: 260 }}>
                <PlaceCard
                  place={p}
                  saved={saved}
                  onToggleSave={onToggleSavePlace}
                  onPress={() => onOpenPlace(p)}
                />
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
