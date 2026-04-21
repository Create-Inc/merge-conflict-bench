import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft } from "lucide-react-native";
import { useAuth } from "@/utils/auth/useAuth";

export default function SignInPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    if (!email || !password) {
      setError("Vennligst fyll ut alle felt");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Kunne ikke logge inn");
      }

<<<<<<< ours
      if (data.token) {
        // Store both token + user so native can work offline and useUser has a fallback
        await setAuth({ token: data.token, user: data.user });
=======
      const data = await response.json();

      if (data.token && data.user) {
        await setAuth({ token: data.token, user: data.user });
>>>>>>> theirs
        router.replace("/");
      } else {
        throw new Error("Ingen token mottatt");
      }
    } catch (err) {
      console.error("Sign in error:", err);
      setError(err.message || "Feil brukernavn eller passord");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="dark" />

      <View style={{ flex: 1, paddingTop: insets.top }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 16,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
              marginLeft: -8,
            }}
          >
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 20 }}>
          <Text
            style={{
              fontSize: 36,
              fontWeight: "800",
              color: "#111827",
              marginBottom: 8,
            }}
          >
            Velkommen tilbake
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: "#6B7280",
              marginBottom: 40,
            }}
          >
            Logg inn for å fortsette
          </Text>

          {/* Email Input */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: "#111827",
                marginBottom: 8,
              }}
            >
              E-post
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="din@epost.no"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                backgroundColor: "#F9FAFB",
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: "#111827",
              }}
            />
          </View>

          {/* Password Input */}
          <View style={{ marginBottom: 12 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: "#111827",
                marginBottom: 8,
              }}
            >
              Passord
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                backgroundColor: "#F9FAFB",
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: "#111827",
              }}
            />
          </View>

          {/* Error Message */}
          {error ? (
            <View
              style={{
                backgroundColor: "#FEE2E2",
                borderRadius: 8,
                padding: 12,
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 14, color: "#DC2626" }}>{error}</Text>
            </View>
          ) : null}

          {/* Sign In Button */}
          <TouchableOpacity
            onPress={handleSignIn}
            disabled={loading}
            style={{
              backgroundColor: loading ? "#9CA3AF" : "#111827",
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: "center",
              marginTop: 8,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "700",
                  color: "#fff",
                }}
              >
                Logg inn
              </Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              marginTop: 24,
            }}
          >
            <Text style={{ fontSize: 15, color: "#6B7280" }}>
              Har du ikke konto?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.replace("/auth/signup")}>
              <Text
                style={{ fontSize: 15, fontWeight: "600", color: "#111827" }}
              >
                Registrer deg
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
