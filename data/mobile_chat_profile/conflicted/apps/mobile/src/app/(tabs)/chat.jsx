<<<<<<< ours
import { Redirect } from "expo-router";
=======
import { useEffect } from "react";
import { View, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
>>>>>>> theirs

<<<<<<< ours

=======
import { useTheme } from "../../components/hooks/useTheme";
import { useLanguage } from "../../utils/LanguageContext";

>>>>>>> theirs
export default function ChatScreen() {
<<<<<<< ours
  // ✅ Live chat should only be accessed via Profile.
  return <Redirect href="/(tabs)/profile?openChat=1" />;
=======
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { translate } = useLanguage();

  // Redirect: live chat is only in Profile
  useEffect(() => {
    router.replace("/(tabs)/profile?openLiveChat=1");
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top + 16,
        paddingHorizontal: 20,
      }}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      <Text
        style={{
          color: colors.text,
          fontSize: 18,
          fontWeight: "700",
          marginBottom: 8,
        }}
      >
        {translate("openingLiveChat", {}, "Åpner live chat...")}
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
        {translate(
          "liveChatMovedToProfile",
          {},
          "Live chat finnes nå i Profil.",
        )}
      </Text>
    </View>
  );
>>>>>>> theirs
}
