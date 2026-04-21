import React from "react";
import { View, Text } from "react-native";
import { Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";

// AI Studio Beta is now the primary experience.
// Keep this tab as an entry point, but immediately send users into the Beta flow.
export default function AIStudioScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <StatusBar style="dark" />
      <Redirect href="/ai-studio-beta" />
      <View style={{ padding: 16 }}>
        <Text style={{ color: "#111827", fontWeight: "700" }}>
          Loading AI Studio…
        </Text>
      </View>
    </View>
  );
}
