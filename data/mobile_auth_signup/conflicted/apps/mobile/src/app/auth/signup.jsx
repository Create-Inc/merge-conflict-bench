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

export default function SignUpPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setAuth } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      setError("Vennligst fyll ut alle felt");
      return;
    }

    if (password.length < 6) {
      setError("Passordet må være minst 6 tegn");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create account
      const signupResponse = await fetch("/api/auth/token", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const signupData = await signupResponse.json();

      if (!signupResponse.ok) {
        throw new Error(signupData.error || "Kunne ikke opprette konto");
      }

      // Our backend returns token+user on signup now
      if (signupData.token) {
        await setAuth({ token: signupData.token, user: signupData.user });
        router.replace("/");
        return;
      }

      // Fallback: Sign in
      const signinResponse = await fetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const signinData = await signinResponse.json();

      if (!signinResponse.ok) {
        throw new Error(
          signinData.error || "Konto opprettet, men kunne ikke logge inn",
        );
      }

<<<<<<< ours
      if (signinData.token) {
        await setAuth({ token: signinData.token, user: signinData.user });
=======
      const data = await signinResponse.json();

      if (data.token && data.user) {
        await setAuth({ token: data.token, user: data.user });
>>>>>>> theirs
        router.replace("/");
      } else {
        throw new Error("Ingen token mottatt");
      }
    } catch (err) {
      console.error("Sign up error:", err);
      setError(err.message || "Noe gikk galt");
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
            Opprett konto
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: "#6B7280",
              marginBottom: 40,
            }}
          >
            Registrer deg for å komme i gang
          </Text>

          {/* Name Input */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: "#111827",
                marginBottom: 8,
              }}
            >
              Navn
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ditt navn"
              autoCapitalize="words"
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
              placeholder="Minst 6 tegn"
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

          {/* Sign Up Button */}
          <TouchableOpacity
            onPress={handleSignUp}
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
                Opprett konto
              </Text>
            )}
          </TouchableOpacity>

          {/* Sign In Link */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              marginTop: 24,
            }}
          >
            <Text style={{ fontSize: 15, color: "#6B7280" }}>
              Har du allerede konto?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.replace("/auth/signin")}>
              <Text
                style={{ fontSize: 15, fontWeight: "600", color: "#111827" }}
              >
                Logg inn
              </Text>
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <Text
            style={{
              fontSize: 13,
              color: "#9CA3AF",
              textAlign: "center",
              lineHeight: 18,
              paddingHorizontal: 20,
              marginTop: 32,
            }}
          >
            Ved å registrere deg godtar du våre vilkår og personvernregler
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
