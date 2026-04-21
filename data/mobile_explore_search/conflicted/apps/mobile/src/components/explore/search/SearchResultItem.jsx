<<<<<<< ours
import { Pressable, Text, View } from "react-native";
import { Bookmark } from "lucide-react-native";
import {
  iconForKind,
  normalizeStr,
  semanticChipForKind,
} from "@/utils/explore/search/helpers";
import { EXPLORATION_YELLOW } from "@/utils/explore/search/constants";

function withAlpha(hex, alphaHex) {
  const raw = typeof hex === "string" ? hex.trim() : "";
  if (!raw.startsWith("#") || raw.length !== 7) {
    return hex;
  }
  return `${raw}${alphaHex}`;
}

export function SearchResultItem({
  item,
  isMember,
  mode,
  tripDraft,
  onPress,
  isSaved,
  onToggleSave,
}) {
  const Icon = iconForKind(item?.kind);
  const title = normalizeStr(item?.title);
  const subtitle = normalizeStr(item?.subtitle);
  const kind = normalizeStr(item?.kind).toUpperCase();
  const kindChip = semanticChipForKind(kind);

  const locked = Boolean(item?.isPremium) && !isMember;
  const previewTag = locked;
  const secretMissionTag = Boolean(item?.hasSecretMission);

  const showAdd = mode === "trip";
  const draftArr = Array.isArray(tripDraft) ? tripDraft : [];
  const alreadyAdded = showAdd
    ? draftArr.some(
        (d) =>
          String(d?.id) === String(item?.id) &&
          normalizeStr(d?.kind).toUpperCase() === kind,
      )
    : false;

  const canSave =
    !showAdd &&
    [
      "PLACES",
      "PLACE",
      "ITINERARY",
      "LIST",
      "DESTINATION",
      "DISCOVERY",
    ].includes(kind);

  const saved = Boolean(isSaved);

  const accent = kindChip?.colors?.primary || "#9CA3AF";
  const saveBorderColor = saved
    ? withAlpha(accent, "88")
    : kindChip
      ? withAlpha(accent, "33")
      : "rgba(255,255,255,0.10)";

  const saveIconColor = saved ? accent : "#E5E7EB";
  const saveIconFill = saved ? accent : "transparent";
  const saveBg = saved ? withAlpha(accent, "12") : "#141414";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: pressed ? "#0f0f0f" : "transparent",
        borderTopWidth: 1,
        borderTopColor: "#1f1f1f",
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      })}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: "#141414",
          borderWidth: 1,
          borderColor: "#232323",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={18} color="#E5E7EB" />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: "#fff",
            fontWeight: "900",
            fontSize: 13,
          }}
          numberOfLines={1}
        >
          {title || "Untitled"}
        </Text>

        {subtitle ? (
          <Text
            style={{
              color: "#9CA3AF",
              fontWeight: "700",
              fontSize: 12,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}

        {kindChip || previewTag || secretMissionTag ? (
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              marginTop: 6,
              flexWrap: "wrap",
            }}
          >
            {kindChip ? (
              <View
                style={{
                  backgroundColor: kindChip.colors.darkBg,
                  borderWidth: 1,
                  borderColor: kindChip.colors.darkAccent,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 999,
                }}
              >
                <Text
                  style={{
                    color: kindChip.colors.soft,
                    fontSize: 10,
                    fontWeight: "900",
                    letterSpacing: 0.2,
                  }}
                >
                  {kindChip.label}
                </Text>
              </View>
            ) : null}

            {previewTag ? (
              <View
                style={{
                  backgroundColor: "#141414",
                  borderWidth: 1,
                  borderColor: "#232323",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 999,
                }}
              >
                <Text
                  style={{
                    color: "#9CA3AF",
                    fontSize: 10,
                    fontWeight: "900",
                  }}
                >
                  Preview
                </Text>
              </View>
            ) : null}

            {secretMissionTag ? (
              <View
                style={{
                  backgroundColor: "#1f1f1f",
                  borderWidth: 1,
                  borderColor: "#232323",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 999,
                }}
              >
                <Text
                  style={{
                    color: EXPLORATION_YELLOW,
                    fontSize: 10,
                    fontWeight: "900",
                  }}
                >
                  Secret mission
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        {canSave ? (
          <Pressable
            onPress={(e) => {
              e?.stopPropagation?.();
              onToggleSave?.(item);
            }}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: pressed ? "#171717" : saveBg,
              borderWidth: 1,
              borderColor: saveBorderColor,
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <Bookmark size={18} color={saveIconColor} fill={saveIconFill} />
          </Pressable>
        ) : null}

        {showAdd ? (
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: alreadyAdded ? "#0f0f0f" : "#141414",
              borderWidth: 1,
              borderColor: "#232323",
            }}
          >
            <Text
              style={{
                color: alreadyAdded ? "#9CA3AF" : EXPLORATION_YELLOW,
                fontWeight: "900",
                fontSize: 11,
              }}
            >
              {alreadyAdded ? "Added" : "Add"}
            </Text>
          </View>
        ) : locked ? (
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: "#141414",
              borderWidth: 1,
              borderColor: "#232323",
            }}
          >
            <Text
              style={{
                color: "#9CA3AF",
                fontWeight: "900",
                fontSize: 11,
              }}
            >
              Preview
            </Text>
          </View>
        ) : kind === "PERKS" ? (
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: "#141414",
              borderWidth: 1,
              borderColor: "#232323",
            }}
          >
            <Text
              style={{
                color: EXPLORATION_YELLOW,
                fontWeight: "900",
                fontSize: 11,
              }}
            >
              Perk
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
=======
import { Pressable, Text, View } from "react-native";
import {
  iconForKind,
  normalizeStr,
  semanticChipForKind,
} from "@/app/(tabs)/explore/search/utils/helpers";
import { EXPLORATION_YELLOW } from "@/app/(tabs)/explore/search/constants";
import { Bookmark } from "lucide-react-native";

function withAlpha(hex, alphaHex) {
  const raw = typeof hex === "string" ? hex.trim() : "";
  if (!raw.startsWith("#") || raw.length !== 7) {
    return hex;
  }
  return `${raw}${alphaHex}`;
}

export function SearchResultItem({
  item,
  isMember,
  mode,
  tripDraft,
  onPress,
  isSaved,
  onToggleSave,
}) {
  const Icon = iconForKind(item.kind);
  const title = normalizeStr(item.title);
  const subtitle = normalizeStr(item.subtitle);
  const kind = normalizeStr(item.kind).toUpperCase();
  const kindChip = semanticChipForKind(kind);

  const showMemberTag = Boolean(item?.isPremium);
  const locked = Boolean(item?.isPremium) && !isMember;
  const previewTag = locked;

  const secretMissionTag = Boolean(item?.hasSecretMission);

  const showAdd = mode === "trip";
  const alreadyAdded = showAdd
    ? tripDraft.some(
        (d) =>
          String(d.id) === String(item?.id) &&
          normalizeStr(d.kind).toUpperCase() === kind,
      )
    : false;

  const canSave =
    !showAdd &&
    [
      "PLACES",
      "PLACE",
      "ITINERARY",
      "LIST",
      "DESTINATION",
      "DISCOVERY",
    ].includes(kind);

  const saved = Boolean(isSaved);

  const accent = kindChip?.colors?.primary || "#9CA3AF";
  const saveBorderColor = saved
    ? withAlpha(accent, "88")
    : kindChip
      ? withAlpha(accent, "33")
      : "rgba(255,255,255,0.10)";

  const saveIconColor = saved ? accent : "#E5E7EB";
  const saveIconFill = saved ? accent : "transparent";

  const saveBg = saved ? withAlpha(accent, "12") : "#141414";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: pressed ? "#0f0f0f" : "transparent",
        borderTopWidth: 1,
        borderTopColor: "#1f1f1f",
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      })}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: "#141414",
          borderWidth: 1,
          borderColor: "#232323",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={18} color="#E5E7EB" />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: "#fff",
            fontWeight: "900",
            fontSize: 13,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              color: "#9CA3AF",
              fontWeight: "700",
              fontSize: 12,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}

        {kindChip || previewTag || secretMissionTag ? (
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              marginTop: 6,
              flexWrap: "wrap",
            }}
          >
            {kindChip ? (
              <View
                style={{
                  backgroundColor: kindChip.colors.darkBg,
                  borderWidth: 1,
                  borderColor: kindChip.colors.darkAccent,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 999,
                }}
              >
                <Text
                  style={{
                    color: kindChip.colors.soft,
                    fontSize: 10,
                    fontWeight: "900",
                    letterSpacing: 0.2,
                  }}
                >
                  {kindChip.label}
                </Text>
              </View>
            ) : null}

            {previewTag ? (
              <View
                style={{
                  backgroundColor: "#141414",
                  borderWidth: 1,
                  borderColor: "#232323",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 999,
                }}
              >
                <Text
                  style={{
                    color: "#9CA3AF", // governance: locked states use neutral
                    fontSize: 10,
                    fontWeight: "900",
                  }}
                >
                  Preview
                </Text>
              </View>
            ) : null}

            {secretMissionTag ? (
              <View
                style={{
                  backgroundColor: "#1f1f1f",
                  borderWidth: 1,
                  borderColor: "#232323",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 999,
                }}
              >
                <Text
                  style={{
                    color: EXPLORATION_YELLOW,
                    fontSize: 10,
                    fontWeight: "900",
                  }}
                >
                  Secret mission
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        {canSave ? (
          <Pressable
            onPress={(e) => {
              // Prevent row-open when tapping save
              e?.stopPropagation?.();
              onToggleSave?.(item);
            }}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: pressed ? "#171717" : saveBg,
              borderWidth: 1,
              borderColor: saveBorderColor,
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <Bookmark size={18} color={saveIconColor} fill={saveIconFill} />
          </Pressable>
        ) : null}

        {showAdd ? (
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: alreadyAdded ? "#0f0f0f" : "#141414",
              borderWidth: 1,
              borderColor: "#232323",
            }}
          >
            <Text
              style={{
                color: alreadyAdded ? "#9CA3AF" : EXPLORATION_YELLOW,
                fontWeight: "900",
                fontSize: 11,
              }}
            >
              {alreadyAdded ? "Added" : "Add"}
            </Text>
          </View>
        ) : showMemberTag ? (
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: "#141414",
              borderWidth: 1,
              borderColor: "#232323",
            }}
          >
            <Text
              style={{
                color: "#FDE68A",
                fontWeight: "900",
                fontSize: 11,
              }}
            >
              Member
            </Text>
          </View>
        ) : kind === "PERKS" ? (
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: "#141414",
              borderWidth: 1,
              borderColor: "#232323",
            }}
          >
            <Text
              style={{
                color: EXPLORATION_YELLOW,
                fontWeight: "900",
                fontSize: 11,
              }}
            >
              Perk
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
>>>>>>> theirs
