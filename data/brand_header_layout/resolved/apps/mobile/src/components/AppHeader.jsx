import { useMemo, useState, useCallback } from "react";
import { View, Text, Image, Modal, TouchableOpacity } from "react-native";
import { useAuth } from "@/utils/auth/useAuth";
import {
  BRAND_TAGLINE,
  BRAND_LOGO_URL,
  BRAND_WORDMARK_URL,
  BRAND_NAME,
} from "@/utils/brand";
import { usePathname } from "expo-router";

export default function AppHeader({ hideConnectivityNote = false }) {
  const { auth, isReady, isAuthenticated, signIn, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [wordmarkFailed, setWordmarkFailed] = useState(false);
  const pathname = usePathname();

  // Extra safety: even if a screen forgets to pass hideConnectivityNote,
  // we never show the connectivity note on the Scribe screen.
  const isScribeScreen = useMemo(() => {
    if (typeof pathname !== "string") {
      return false;
    }
    return pathname.toLowerCase().includes("scribe");
  }, [pathname]);

  const initials = useMemo(() => {
    const label = auth?.user?.email || auth?.user?.name;
    if (!label || typeof label !== "string") {
      return "CA";
    }
    const cleaned = label.trim();
    if (!cleaned) {
      return "CA";
    }

    // Email: take first 2 chars, Name: take first letters of first 2 words.
    if (cleaned.includes("@")) {
      return cleaned.slice(0, 2).toUpperCase();
    }

    const parts = cleaned.split(/\s+/).filter(Boolean);
    const first = parts[0] ? parts[0][0] : "C";
    const second = parts[1] ? parts[1][0] : "A";
    return `${first}${second}`.toUpperCase();
  }, [auth?.user?.email, auth?.user?.name]);

  const tagline = BRAND_TAGLINE;

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const handlePrimaryAction = useCallback(() => {
    closeMenu();
    if (!isReady) {
      return;
    }
    if (isAuthenticated) {
      signOut();
      return;
    }
    signIn();
  }, [closeMenu, isAuthenticated, isReady, signIn, signOut]);

  const actionLabel = useMemo(() => {
    if (!isReady) {
      return "Loading…";
    }
    return isAuthenticated ? "Sign out" : "Sign in";
  }, [isAuthenticated, isReady]);

  const emailLabel = useMemo(() => {
    const email = auth?.user?.email;
    return typeof email === "string" && email.length > 0 ? email : null;
  }, [auth?.user?.email]);

  const actionSubLabel = useMemo(() => {
    if (!isReady) {
      return null;
    }
    return isAuthenticated ? "Sign back in anytime" : "Secure sign-in window";
  }, [isAuthenticated, isReady]);

  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
        paddingHorizontal: 16,
        paddingVertical: 10,
      }}
    >
      {/* Top row */}
      <View
        style={{
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
            style={{ width: 44, height: 44, borderRadius: 10 }}
            resizeMode="contain"
          />

          {/* Brand wordmark + tagline */}
          <View style={{ marginLeft: 10, flexShrink: 1 }}>
            {!wordmarkFailed ? (
              <Image
                source={{ uri: BRAND_WORDMARK_URL }}
                style={{ width: 225, height: 30 }}
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

            <Text
              style={{
                fontFamily: "System",
                fontWeight: "700",
                fontSize: 12,
                color: "#0D9488",
                lineHeight: 14,
                marginTop: 4,
              }}
            >
              {tagline}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setMenuOpen(true)}
          activeOpacity={0.8}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
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
              fontSize: 12,
              color: "#FFFFFF",
            }}
          >
            {initials}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Connectivity note */}
      {!hideConnectivityNote && !isScribeScreen ? (
        <View
          style={{
            marginTop: 8,
            backgroundColor: "#FFFBEB",
            borderWidth: 1,
            borderColor: "#FDE68A",
            borderRadius: 12,
            paddingHorizontal: 10,
            paddingVertical: 8,
          }}
        >
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "600",
              fontSize: 10,
              color: "#92400E",
              lineHeight: 13,
            }}
          >
            Using this App requires a robust connection (e.g. Wi-Fi) to the
            Internet.
          </Text>
        </View>
      ) : null}

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={closeMenu}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.35)",
            alignItems: "flex-end",
            paddingTop: 58,
            paddingRight: 14,
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={{
              width: 260,
              backgroundColor: "#FFFFFF",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              padding: 12,
            }}
          >
            <Text
              style={{
                fontFamily: "System",
                fontWeight: "800",
                fontSize: 12,
                color: "#111827",
                marginBottom: 6,
              }}
            >
              Account
            </Text>
            {emailLabel ? (
              <Text
                style={{
                  fontFamily: "System",
                  fontSize: 10,
                  color: "#6B7280",
                  marginBottom: 10,
                }}
              >
                {emailLabel}
              </Text>
            ) : null}

            <TouchableOpacity
              onPress={handlePrimaryAction}
              disabled={!isReady}
              style={{
                backgroundColor: isAuthenticated ? "#111827" : "#0D9488",
                paddingVertical: 10,
                borderRadius: 12,
                alignItems: "center",
                opacity: !isReady ? 0.6 : 1,
              }}
            >
              <Text
                style={{
                  fontFamily: "System",
                  fontWeight: "800",
                  fontSize: 12,
                  color: "#FFFFFF",
                  lineHeight: 16,
                }}
              >
                {actionLabel}
              </Text>
              {actionSubLabel ? (
                <Text
                  style={{
                    fontFamily: "System",
                    fontWeight: "600",
                    fontSize: 10,
                    color: "rgba(255,255,255,0.85)",
                    marginTop: 2,
                    lineHeight: 13,
                  }}
                >
                  {actionSubLabel}
                </Text>
              ) : null}
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
