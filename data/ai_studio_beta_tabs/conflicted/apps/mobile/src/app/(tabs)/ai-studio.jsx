import React from "react";
<<<<<<< ours
import { Redirect } from "expo-router";
=======
import { View, Text } from "react-native";
import { Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
>>>>>>> theirs

<<<<<<< ours
// Beta is now the primary AI Studio experience.
// Keep this tab as an entry point, but immediately send users into the Beta flow.
export default function AIStudioTabRedirect() {
  return <Redirect href="/ai-studio-beta" />;
=======
export default function AIStudioScreen() {
  // AI Studio Beta is now the primary experience.
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
>>>>>>> theirs
}
