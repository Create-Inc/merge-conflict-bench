import "react-native-gesture-handler"; // ✅ must be first import on Android for proper gesture + TextInput behavior

import { useAuth } from "@/utils/auth/useAuth";
import { Stack } from "expo-router";
import { preventAutoHideAsync, hideAsync } from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthModal } from "@/utils/auth/useAuthModal";
import { LanguageProvider } from "@/utils/LanguageContext";
import { ThemeProvider, useTheme } from "@/components/hooks/useTheme";
import { Platform } from "react-native";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

// ✅ Keep startup minimal + stable in Expo Go + web preview.
// (We can re-enable advanced push/deep-link setup later, once the app is stable.)

// Prevent auto hide of splash screen (guard for web / environments where it may throw)
try {
  preventAutoHideAsync();
} catch (e) {
  console.log(
    "SplashScreen.preventAutoHideAsync not available:",
    e?.message || e,
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppWithNotifications() {
  const { colors } = useTheme();

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: colors.background },
        }}
        initialRouteName="index"
      >
        <Stack.Screen name="index" />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            animation: "fade",
          }}
        />

        {/* Non-tab screens */}
        <Stack.Screen name="bank-accounts" options={{ headerShown: false }} />

        <Stack.Screen
          name="send-amount"
          options={{
            headerShown: false,
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />

        <Stack.Screen
          name="send-new"
          options={{
            headerShown: false,
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="request-money"
          options={{
            headerShown: false,
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
      </Stack>

      {/* No global chat button. Live chat lives in Profile only. */}
      <AuthModal />
    </>
  );
}

export default function RootLayout() {
  const { initiate, isReady } = useAuth();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // ✅ Expo web preview sometimes never reports fonts loaded.
  // Don't block rendering on web.
  const readyToRender = isReady && (Platform.OS === "web" ? true : fontsLoaded);

  useEffect(() => {
    initiate();
  }, [initiate]);

  useEffect(() => {
    if (readyToRender) {
      try {
        hideAsync();
      } catch (e) {
        console.log("SplashScreen.hideAsync not available:", e?.message || e);
      }
    }
  }, [readyToRender]);

  if (!readyToRender) {
    return null;
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <AppWithNotifications />
          </GestureHandlerRootView>
        </QueryClientProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
