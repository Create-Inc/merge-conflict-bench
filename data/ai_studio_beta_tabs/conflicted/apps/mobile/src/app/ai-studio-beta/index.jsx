import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Sparkles, ArrowRight } from "lucide-react-native";
import { useAIStudioBeta } from "./_context";
import { isDarkHexColor } from "@/utils/themePresets";

// Tiles have text baked into the image (per product requirement)
const TILE_ASSETS = {
  "virtual-try-on":
    "https://raw.createusercontent.com/e52254c1-c3b0-4ee2-83aa-492092d72539/",
  eyelashes:
    "https://raw.createusercontent.com/e2e54b94-c6a2-43ae-a41a-54df1048c986/",
  "hair-system":
    "https://raw.createusercontent.com/75d6f095-4091-4b8c-a284-0184b8aa75c7/",
};

export default function AIStudioBetaHubScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useAIStudioBeta();

  const bg = theme?.backgroundColor || "#fff";
  const bgImage =
    theme?.backgroundImage ||
    "https://ucarecdn.com/60d4ef4e-285b-418b-bfb4-e8336e2203fa/-/format/auto/";
  const tileBg =
    theme?.tileStyle?.background ||
    theme?.colors?.surface ||
    "rgba(255,255,255,0.82)";
  const tileRadius =
    typeof theme?.tileStyle?.borderRadius === "number"
      ? theme.tileStyle.borderRadius
      : 18;
  const border = theme?.colors?.border || "rgba(17,24,39,0.08)";
  const textPrimary = theme?.colors?.textPrimary || "#111827";
  const textSecondary = theme?.colors?.textSecondary || "rgba(17,24,39,0.7)";
  const primaryBtnBg = theme?.buttonStyle?.primary?.background || "#111827";
  const primaryBtnText = theme?.buttonStyle?.primary?.text || "#fff";

  const isDark = isDarkHexColor(theme?.backgroundColor);
  const statusBarStyle = isDark ? "light" : "dark";

  const tiles = [
    {
      key: "virtual-try-on",
      href: "/ai-studio-beta/virtual-try-on",
    },
    {
      key: "eyelashes",
      href: "/ai-studio-beta/eyelashes",
    },
    {
      key: "hair-system",
      href: "/ai-studio-beta/hair-system",
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top }}>
      <StatusBar style={statusBarStyle} />

      {bgImage ? (
        <Image
          source={{ uri: bgImage }}
          style={[StyleSheet.absoluteFill, { opacity: isDark ? 0.22 : 0.16 }]}
          contentFit="cover"
          pointerEvents="none"
        />
      ) : null}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
<<<<<<< ours
            <View
=======
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 999,
                backgroundColor: "rgba(16,185,129,0.12)",
                borderWidth: 1,
                borderColor: "rgba(16,185,129,0.22)",
              }}
            >
              <Sparkles size={18} color="#065F46" />
              <Text style={{ color: "#065F46", fontWeight: "800" }}>
                AI Studio
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/ai-studio-beta/start")}
>>>>>>> theirs
              style={{
                backgroundColor: primaryBtnBg,
                borderRadius: 999,
                paddingVertical: 10,
                paddingHorizontal: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
<<<<<<< ours
              <Sparkles size={18} color="#065F46" />
              <Text style={{ color: "#065F46", fontWeight: "800" }}>
                AI Studio
=======
              <Text
                style={{
                  color: primaryBtnText,
                  fontWeight: "800",
                  fontSize: 12,
                }}
              >
                Photo
>>>>>>> theirs
              </Text>
              <ArrowRight size={16} color={primaryBtnText} />
            </TouchableOpacity>
          </View>

          <Text
            style={{
              fontSize: 28,
              fontWeight: "900",
              color: textPrimary,
              marginTop: 16,
            }}
          >
            Choose a mode
          </Text>
          <Text style={{ fontSize: 14, color: textSecondary, marginTop: 6 }}>
<<<<<<< ours
            Pick a mode below, then start with a photo.
=======
            Bigger tiles, less scrolling.
>>>>>>> theirs
          </Text>

          <View style={{ height: 14 }} />

          <TouchableOpacity
            onPress={() => router.push("/ai-studio-beta/start")}
            style={{
              backgroundColor: primaryBtnBg,
              borderRadius: 999,
              paddingVertical: 14,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <Text
              style={{ color: primaryBtnText, fontWeight: "800", fontSize: 14 }}
            >
              Start with a photo
            </Text>
            <ArrowRight size={18} color={primaryBtnText} />
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            {tiles.map((t) => {
              const imgUrl = TILE_ASSETS[t.key];
              return (
                <TouchableOpacity
                  key={t.key}
                  onPress={() => router.push(t.href)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${t.key.replace(/-/g, " ")}`}
                  style={{
                    width: "48%",
                    backgroundColor: tileBg,
                    borderRadius: tileRadius,
                    padding: 10,
                    borderWidth: 1,
                    borderColor: border,
                    marginBottom: 12,
                  }}
                >
                  {imgUrl ? (
                    <View
                      style={{
                        borderRadius: Math.max(12, tileRadius - 4),
                        overflow: "hidden",
                        borderWidth: 1,
                        borderColor: "rgba(17,24,39,0.06)",
                      }}
                    >
                      <Image
                        source={{ uri: imgUrl }}
                        style={{ width: "100%", aspectRatio: 1 }}
                        contentFit="cover"
                        transition={120}
                      />
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}

            {/* spacer to keep alignment */}
            <View style={{ width: "48%" }} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
