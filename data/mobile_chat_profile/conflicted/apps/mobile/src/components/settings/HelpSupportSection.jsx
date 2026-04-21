import React from "react";
import { Alert, Linking } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  Mail,
  HelpCircle,
  BookOpen,
  AlertTriangle,
  Globe,
  Shield,
} from "lucide-react-native";
import { SettingsSection } from "./SettingsSection";
import { SettingsItem } from "./SettingsItem";
import { useLanguage } from "../../utils/LanguageContext";
import useUser from "../../utils/auth/useUser";

export function HelpSupportSection() {
  const { translate } = useLanguage();
  const { data: user } = useUser();

  const handlePasswordResetPress = async () => {
    Haptics.selectionAsync();

    if (!user?.email) {
      Alert.alert("Feil", "Du må være logget inn for å tilbakestille passord");
      return;
    }

    Alert.alert(
      "🔐 Tilbakestill passord",
      `Vi sender en tilbakestillingslenke til:\n${user.email}\n\nLenken utløper om 1 time.`,
      [
        { text: "Avbryt", style: "cancel" },
        {
          text: "Send lenke",
          onPress: async () => {
            try {
              const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email }),
              });

              if (response.ok) {
                Alert.alert(
                  "✅ Sendt!",
                  "Sjekk e-posten din for tilbakestillingslenke. Lenken utløper om 1 time.",
                  [{ text: "OK" }],
                );
              } else {
                throw new Error("Kunne ikke sende e-post");
              }
            } catch (error) {
              Alert.alert(
                "Feil",
                "Kunne ikke sende tilbakestillingslenke. Prøv igjen senere.",
              );
            }
          },
        },
      ],
    );
  };

  const handleFAQPress = () => {
    Haptics.selectionAsync();
    Alert.alert(
      translate("frequentlyAskedQuestions"),
      translate("faqCategoryMessage"),
      [
        { text: translate("back"), style: "cancel" },
        {
          text: translate("sending"),
          onPress: () => showSendingFAQ(),
        },
        {
          text: translate("security"),
          onPress: () => showSecurityFAQ(),
        },
        {
          text: translate("fees"),
          onPress: () => showFeesFAQ(),
        },
      ],
    );
  };

  const showSendingFAQ = () => {
    Alert.alert(translate("sendingMoneyFAQ"), translate("sendingFAQContent"), [
      { text: translate("ok") },
    ]);
  };

  const showSecurityFAQ = () => {
    Alert.alert(translate("securityFAQ"), translate("securityFAQContent"), [
      { text: translate("ok") },
    ]);
  };

  const showFeesFAQ = () => {
    Alert.alert(translate("feesFAQ"), translate("feesFAQContent"), [
      { text: translate("ok") },
    ]);
  };

  const handleUserGuidePress = () => {
    Haptics.selectionAsync();
    Alert.alert(translate("userManual"), translate("userManualMessage"), [
      { text: translate("back"), style: "cancel" },
      {
        text: translate("gettingStarted"),
        onPress: () => showGettingStarted(),
      },
    ]);
  };

  const showGettingStarted = () => {
    Alert.alert(
      translate("gettingStartedWithVippsus"),
      translate("gettingStartedContent"),
      [{ text: translate("understood") }],
    );
  };

  const handleReportPress = () => {
    Haptics.selectionAsync();
    Alert.alert(translate("reportProblem"), translate("reportProblemMessage"), [
      { text: translate("cancel"), style: "cancel" },
      {
        text: translate("technicalError"),
        onPress: () => reportTechnicalIssue(),
      },
      {
        text: translate("improvementSuggestion"),
        onPress: () => sendFeatureRequest(),
      },
    ]);
  };

  const reportTechnicalIssue = () => {
    const subject = "🐛 Teknisk feil - Lynrask";
    const body = `Hei Lynrask support,

Jeg opplever en teknisk feil:

PROBLEMBESKRIVELSE:
[Beskriv hva som skjer]

Takk for hjelpen!`;

    Linking.openURL(
      `mailto:persvein3@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    );
  };

  const sendFeatureRequest = () => {
    const subject = "💡 Forbedringsforslag - Lynrask";
    const body = `Hei Lynrask team,

Jeg har et forslag til forbedring av appen:

FORSLAG:
[Beskriv ditt forslag]

Takk for at dere lytter til brukerne!`;

    Linking.openURL(
      `mailto:persvein3@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    );
  };

  const handleLiveChatPress = () => {
    Haptics.selectionAsync();
<<<<<<< ours
    // ✅ Live chat should only live in Profile.
    router.push("/(tabs)/profile?openChat=1");
=======
    // Live chat lives in Profile
    router.push("/(tabs)/profile?openLiveChat=1");
>>>>>>> theirs
  };

  return (
    <SettingsSection title={translate("helpAndSupport")}>
      <SettingsItem
        icon={<Mail size={22} color="#FFFFFF" />}
        iconBgColor="#3B82F6"
        title={translate("liveChatSupport")}
        subtitle={translate("chatWithExpert")}
        onPress={handleLiveChatPress}
      />
      <SettingsItem
        icon={<HelpCircle size={22} color="#FFFFFF" />}
        iconBgColor="#8B5CF6"
        title={translate("frequentlyAskedQuestions")}
        subtitle={`${translate("findAnswers")} & ${translate("userManual")}`}
        onPress={handleFAQPress}
      />
      <SettingsItem
        icon={<AlertTriangle size={22} color="#FFFFFF" />}
        iconBgColor="#EF4444"
        title={translate("reportProblem")}
        subtitle="Rapporter feil eller be om hjelp"
        onPress={handleReportPress}
      />
    </SettingsSection>
  );
}
