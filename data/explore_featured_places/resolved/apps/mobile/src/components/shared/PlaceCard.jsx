import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { Bookmark } from "lucide-react-native";
import { SEMANTIC_COLORS } from "@/components/consumer/ExploreScreen/constants";

function normalizeText(s) {
  return typeof s === "string" ? s.trim() : "";
}

function safeObj(x) {
  return x && typeof x === "object" ? x : null;
}

function normalizeStringList(list, limit) {
  const arr = Array.isArray(list) ? list : [];
  const out = [];
  for (const v of arr) {
    const s = normalizeText(v);
    if (!s) continue;
    out.push(s);
  }

  const seen = new Set();
  const deduped = [];
  for (const v of out) {
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(v);
  }

  if (Number.isFinite(limit)) {
    return deduped.slice(0, limit);
  }

  return deduped;
}

function pickFirstGalleryUrl(place) {
  const fd = safeObj(place?.full_data);
  const media = safeObj(fd?.media);
  const gallery = Array.isArray(media?.gallery) ? media.gallery : [];

  for (const item of gallery) {
    if (typeof item === "string" && item.trim()) {
      return item.trim();
    }
    if (item && typeof item === "object") {
      const url = normalizeText(item.url || item.uri || item.src);
      if (url) return url;
    }
  }

  // Governance mapping: Explore cards use gallery[0] only.
  // If missing, we render the card without an image.
  return "";
}

function pickSecondaryContext(place, primaryCategory) {
  const fd = safeObj(place?.full_data);
  const categories = safeObj(fd?.categories);
  const secondary = normalizeStringList(categories?.secondary, 10);

  const primaryKey = normalizeText(primaryCategory).toLowerCase();
  const filtered = secondary.filter((s) => s.toLowerCase() !== primaryKey);

  return filtered.slice(0, 2);
}

function pickOperationalFlag(place) {
  const fd = safeObj(place?.full_data);
  const rawFlags = normalizeStringList(fd?.operational_flags, 20);
  const flags = safeObj(fd?.flags);

  const hasSeasonal =
    rawFlags.some((f) => f.toLowerCase() === "seasonal") ||
    Boolean(flags?.seasonal);
  if (hasSeasonal) return "Seasonal";

  return "";
}

export function PlaceCard({ place, onPress, onToggleSave, saved }) {
  const title =
    normalizeText(place?.title) || normalizeText(place?.name) || "Untitled";
  const category = normalizeText(place?.category);

  const imageUrl = pickFirstGalleryUrl(place);
  const secondaryTags = pickSecondaryContext(place, category);
  const operationalFlag = pickOperationalFlag(place);

  const rankNumber = Number.isFinite(Number(place?.xplr_approved_rank))
    ? Number(place.xplr_approved_rank)
    : null;

  // Phase 14.1: perk badge injection (USER-safe boolean comes from /api/system/places)
  const hasActivePerk =
    Boolean(place?.hasActivePerk) || Boolean(place?.has_active_perk);

  const placeColors = SEMANTIC_COLORS.place;
  const perkGold = "#FFD23F";

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#141414",
        borderWidth: 1,
        borderColor: "#232323",
        borderRadius: 20,
        // NOTE: do NOT set overflow: 'hidden' here, otherwise the outer shadow/glow gets clipped.

        // Shadow box (semantic: places = XPLR Red)
        shadowColor: placeColors.primary,
        shadowOpacity: 0.4,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 12 },
        elevation: 10,
      }}
    >
      {/* Open surface */}
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          flex: 1,
          borderRadius: 20,
          opacity: pressed ? 0.88 : 1,
        })}
      >
        {/* Inner clip layer so images respect rounded corners without clipping the shadow */}
        <View style={{ flex: 1, borderRadius: 20, overflow: "hidden" }}>
          <View style={{ height: 120, backgroundColor: "#0f0f0f" }}>
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={100}
              />
            ) : null}

            {/* Save button */}
            <View style={{ position: "absolute", top: 10, left: 10 }}>
              <Pressable
                onPress={(e) => {
                  e?.stopPropagation?.();
                  onToggleSave?.(place);
                }}
                style={({ pressed }) => ({
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: pressed
                    ? "rgba(0,0,0,0.7)"
                    : "rgba(0,0,0,0.55)",
                  borderWidth: 1,
                  borderColor: saved
                    ? "rgba(255,49,49,0.6)"
                    : "rgba(255,255,255,0.16)",
                  alignItems: "center",
                  justifyContent: "center",
                })}
              >
                <Bookmark
                  size={18}
                  color={saved ? placeColors.primary : "#E5E7EB"}
                  fill={saved ? placeColors.primary : "transparent"}
                />
              </Pressable>
            </View>

            {/* Top-right badges */}
            {hasActivePerk || rankNumber ? (
              <View
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  alignItems: "flex-end",
                }}
              >
                {hasActivePerk ? (
                  <View
                    style={{
                      backgroundColor: "rgba(0,0,0,0.6)",
                      borderWidth: 1,
                      borderColor: "rgba(255,210,63,0.65)",
                      borderRadius: 999,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      marginBottom: rankNumber ? 8 : 0,
                    }}
                  >
                    <Text
                      style={{
                        color: perkGold,
                        fontSize: 11,
                        fontWeight: "900",
                      }}
                      numberOfLines={1}
                    >
                      🎁 Member Perk
                    </Text>
                  </View>
                ) : null}

                {rankNumber ? (
                  <View
                    style={{
                      backgroundColor: "rgba(0,0,0,0.55)",
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.18)",
                      borderRadius: 999,
                      paddingHorizontal: 8,
                      paddingVertical: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.92)",
                        fontSize: 11,
                        fontWeight: "900",
                      }}
                      numberOfLines={1}
                    >
                      Rank #{rankNumber}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {operationalFlag ? (
              <View
                style={{
                  position: "absolute",
                  bottom: 10,
                  left: 10,
                  backgroundColor: "rgba(0,0,0,0.55)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.14)",
                  borderRadius: 999,
                  paddingHorizontal: 8,
                  paddingVertical: 6,
                }}
              >
                <Text
                  style={{
                    color: "rgba(229,231,235,0.92)",
                    fontSize: 11,
                    fontWeight: "900",
                  }}
                >
                  {operationalFlag}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={{ padding: 12 }}>
            {category ? (
              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: placeColors.darkBg,
                  borderWidth: 1,
                  borderColor: placeColors.darkAccent,
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    color: placeColors.soft,
                    fontSize: 11,
                    fontWeight: "900",
                  }}
                  numberOfLines={1}
                >
                  {category}
                </Text>
              </View>
            ) : null}

            <Text
              style={{
                color: "#fff",
                fontSize: 13,
                fontWeight: "900",
              }}
              numberOfLines={2}
            >
              {title}
            </Text>

            {secondaryTags.length ? (
              <View
                style={{
                  marginTop: 8,
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {secondaryTags.map((tag) => {
                  return (
                    <View
                      key={tag}
                      style={{
                        backgroundColor: "#101010",
                        borderWidth: 1,
                        borderColor: "#232323",
                        borderRadius: 999,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: "#9CA3AF",
                          fontSize: 11,
                          fontWeight: "900",
                        }}
                        numberOfLines={1}
                      >
                        {tag}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    </View>
  );
}

export function PlaceCardSkeleton() {
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
