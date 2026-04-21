import { View, Text, Pressable, Alert, Platform, Linking } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft, ExternalLink } from "lucide-react-native";
import Constants from "expo-constants";
import { WebView } from "react-native-webview";
import { useMemo, useCallback, useState } from "react";
import { useTheme } from "@/components/hooks/useTheme";

function sanitizeRoomName(value) {
  const raw = String(value || "");
  const normalized = raw.replace(/[^a-zA-Z0-9-_]/g, "-");
  const trimmed = normalized.replace(/-+/g, "-").replace(/^-|-$/g, "");
  return trimmed || "lynrask-group";
}

export default function GroupVideoScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams();

  const isExpoGo = Constants?.appOwnership === "expo";

  const groupIdParam = Array.isArray(params?.groupId)
    ? params.groupId[0]
    : params?.groupId;

  const audioParam = Array.isArray(params?.audio)
    ? params.audio[0]
    : params?.audio;
  const isAudioOnly = audioParam === "1" || audioParam === "true";

  const room = useMemo(() => {
    const safe = sanitizeRoomName(groupIdParam);
    return `lynrask-${safe}`;
  }, [groupIdParam]);

  const meetUrl = useMemo(() => {
    const base = `https://meet.jit.si/${encodeURIComponent(room)}`;

    // Jitsi config via hash
    // In audio-only mode we start muted video.
    const hash = isAudioOnly
      ? "#config.startWithVideoMuted=true&config.startWithAudioMuted=false"
      : "#config.prejoinPageEnabled=false";

    return `${base}${hash}`;
  }, [isAudioOnly, room]);

  const openExternal = useCallback(async () => {
    try {
      const supported = await Linking.canOpenURL(meetUrl);
      if (!supported) {
        Alert.alert(
          "Kunne ikke åpne lenke",
          "Telefonen din støtter ikke denne lenken.",
        );
        return;
      }
      await Linking.openURL(meetUrl);
    } catch (e) {
      console.error(e);
      Alert.alert("Feil", "Kunne ikke åpne videochat.");
    }
  }, [meetUrl]);

  const [webViewError, setWebViewError] = useState(null);

  const errorText = webViewError
    ? "Kunne ikke laste videochat i appen. Prøv å åpne i nettleser."
    : null;

<<<<<<< ours
  const expoGoHint = isExpoGo
    ? "Du kjører i Expo Go. Kamera/mikrofon i innebygd nettleser kan være litt ustabilt — hvis det ikke virker, trykk på lenke-ikonet for å åpne i nettleser."
    : null;

=======
  const expoGoWarningText = isExpoGo
    ? "Du kjører i Expo Go. Kamera/mikrofon i WebView kan være begrenset. Hvis det ikke funker, trykk på ekstern lenke."
    : null;

>>>>>>> theirs
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top,
      }}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      <View
        style={{
          paddingHorizontal: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.surfaceBorder,
          backgroundColor: colors.surface,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.surfaceBorder,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ArrowLeft size={18} color={colors.text} />
        </Pressable>

        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>
            {isAudioOnly ? "Lydchat" : "Videochat"}
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 12,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {room}
          </Text>
        </View>

        <Pressable
          onPress={openExternal}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.surfaceBorder,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ExternalLink size={18} color={colors.text} />
        </Pressable>
      </View>

<<<<<<< ours
      {expoGoHint ? (
        <View style={{ padding: 12, backgroundColor: colors.surface }}>
          <Text style={{ color: colors.textSecondary, lineHeight: 18 }}>
            {expoGoHint}
          </Text>
        </View>
      ) : null}

=======
      {expoGoWarningText ? (
        <View style={{ padding: 12, backgroundColor: "#FFFBEB" }}>
          <Text style={{ color: "#92400E", fontWeight: "600" }}>
            {expoGoWarningText}
          </Text>
        </View>
      ) : null}

>>>>>>> theirs
      {errorText ? (
        <View style={{ padding: 12, backgroundColor: "#FEF2F2" }}>
          <Text style={{ color: "#991B1B", fontWeight: "600" }}>
            {errorText}
          </Text>
          <Pressable
            onPress={openExternal}
            style={({ pressed }) => ({
              marginTop: 10,
              backgroundColor: pressed ? "#2563EB" : colors.primary,
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderRadius: 12,
              alignSelf: "flex-start",
            })}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
              Åpne i nettleser
            </Text>
          </Pressable>
        </View>
      ) : null}

      <WebView
        source={{ uri: meetUrl }}
        style={{ flex: 1, backgroundColor: "#000000" }}
        onError={(event) => {
          console.error("WebView error", event?.nativeEvent);
          setWebViewError(event?.nativeEvent?.description || "error");
        }}
<<<<<<< ours
        onHttpError={(event) => {
          console.error("WebView http error", event?.nativeEvent);
          setWebViewError(String(event?.nativeEvent?.statusCode || "http"));
        }}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["*"]}
=======
        // Some Jitsi builds also fire a httpError for blocked resources
        onHttpError={(event) => {
          console.error("WebView http error", event?.nativeEvent);
          setWebViewError(
            event?.nativeEvent?.description ||
              `HTTP ${event?.nativeEvent?.statusCode}`,
          );
        }}
>>>>>>> theirs
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsBackForwardNavigationGestures={Platform.OS === "ios"}
      />
    </View>
  );
}
