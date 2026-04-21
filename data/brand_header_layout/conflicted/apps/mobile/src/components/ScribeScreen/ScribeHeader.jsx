import { useState } from "react";
import { View, Text, Image } from "react-native";
import {
  BRAND_TAGLINE,
  BRAND_LOGO_URL,
  BRAND_WORDMARK_URL,
  BRAND_NAME,
} from "@/utils/brand";

export function ScribeHeader() {
  const tagline = BRAND_TAGLINE;
  const [wordmarkFailed, setWordmarkFailed] = useState(false);

  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
        paddingHorizontal: 16,
        paddingVertical: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
        <Image
          source={{
            uri: BRAND_LOGO_URL,
          }}
          style={{ width: 44, height: 44, borderRadius: 8 }}
          resizeMode="contain"
        />

<<<<<<< ours
        <View style={{ marginLeft: 10, flexShrink: 1 }}>
          <Image
            source={{ uri: BRAND_WORDMARK_URL }}
            // Bigger + taller so it’s readable (keep width a bit tighter so it fits on all iPhones)
            style={{ width: 225, height: 30 }}
            resizeMode="contain"
          />
=======
        <View style={{ marginLeft: 10 }}>
          {!wordmarkFailed ? (
            <Image
              source={{ uri: BRAND_WORDMARK_URL }}
              style={{ width: 240, height: 24 }}
              resizeMode="contain"
              onError={() => setWordmarkFailed(true)}
            />
          ) : (
            <Text
              style={{
                fontFamily: "System",
                fontWeight: "900",
                fontSize: 18,
                color: "#0D9488",
                lineHeight: 22,
              }}
            >
              {BRAND_NAME}
            </Text>
          )}
>>>>>>> theirs
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "700",
              fontSize: 12,
              color: "#0D9488",
              marginTop: 4,
              lineHeight: 14,
            }}
          >
            {tagline}
          </Text>
        </View>
      </View>

      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: "#0D9488",
          alignItems: "center",
          justifyContent: "center",
          marginLeft: 10,
        }}
      >
        <Text
          style={{
            fontFamily: "System",
            fontWeight: "600",
            fontSize: 14,
            color: "#FFFFFF",
          }}
        >
          JD
        </Text>
      </View>
    </View>
  );
}
