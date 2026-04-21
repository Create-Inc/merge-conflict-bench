<<<<<<< ours
import { Pressable, ScrollView, Text } from "react-native";
import { FILTERS } from "@/utils/explore/search/constants";

function withAlpha(hex, alphaHex) {
  const raw = typeof hex === "string" ? hex.trim() : "";
  if (!raw.startsWith("#") || raw.length !== 7) {
    return raw || hex;
  }
  return `${raw}${alphaHex}`;
}

export function FilterBar({ activeFilter, setActiveFilter, accentColor }) {
  const accent = typeof accentColor === "string" ? accentColor : "";
  const showAccent = Boolean(accent);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0, paddingHorizontal: 14 }}
      contentContainerStyle={{ paddingRight: 14, gap: 8 }}
    >
      {FILTERS.map((f) => {
        const active = f.key === activeFilter;

        const activeBg = showAccent ? withAlpha(accent, "14") : "#fff";
        const activeBorder = showAccent ? withAlpha(accent, "66") : "#fff";
        const activeText = showAccent ? accent : "#000";

        return (
          <Pressable
            key={f.key}
            onPress={() => setActiveFilter(f.key)}
            style={({ pressed }) => ({
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: active
                ? activeBg
                : pressed
                  ? "#101010"
                  : "#141414",
              borderWidth: 1,
              borderColor: active ? activeBorder : "#232323",
            })}
          >
            <Text
              style={{
                color: active ? activeText : "#E5E7EB",
                fontWeight: "900",
                fontSize: 12,
              }}
            >
              {f.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
=======
import { Pressable, ScrollView, Text } from "react-native";
import { FILTERS } from "@/app/(tabs)/explore/search/constants";

function withAlpha(hex, alphaHex) {
  const raw = typeof hex === "string" ? hex.trim() : "";
  if (!raw.startsWith("#") || raw.length !== 7) {
    return raw || hex;
  }
  return `${raw}${alphaHex}`;
}

export function FilterBar({ activeFilter, setActiveFilter, accentColor }) {
  const accent = typeof accentColor === "string" ? accentColor : "";
  const showAccent = Boolean(accent);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0, paddingHorizontal: 14 }}
      contentContainerStyle={{ paddingRight: 14, gap: 8 }}
    >
      {FILTERS.map((f) => {
        const active = f.key === activeFilter;

        const activeBg = showAccent ? withAlpha(accent, "14") : "#fff";
        const activeBorder = showAccent ? withAlpha(accent, "66") : "#fff";
        const activeText = showAccent ? accent : "#000";

        return (
          <Pressable
            key={f.key}
            onPress={() => setActiveFilter(f.key)}
            style={({ pressed }) => ({
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: active
                ? activeBg
                : pressed
                  ? "#101010"
                  : "#141414",
              borderWidth: 1,
              borderColor: active ? activeBorder : "#232323",
            })}
          >
            <Text
              style={{
                color: active ? activeText : "#E5E7EB",
                fontWeight: "900",
                fontSize: 12,
              }}
            >
              {f.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
>>>>>>> theirs
