import { View, Text, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useRef, useState } from "react";
import Constants from "expo-constants";
import { useLocalSearchParams } from "expo-router";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  CreditCard,
  Building2,
  Info,
  Sparkles,
  LogOut,
  MessageCircle,
  Users,
} from "lucide-react-native";
import { useLocalSearchParams } from "expo-router";

import { useTheme } from "../../components/hooks/useTheme";
import { useSettings } from "../../hooks/useSettings";
import { useLanguage } from "../../utils/LanguageContext";
import useUser from "@/utils/auth/useUser";
import { useAuth } from "../../utils/auth/useAuth";
import { useAutoTransfer } from "../../hooks/useAutoTransfer";
import { useProfileColors } from "../../hooks/useProfileColors";
import { useProfileActions } from "../../hooks/useProfileActions";

import { ProfileHeader } from "../../components/profile/ProfileHeader";
import { ColorPicker } from "../../components/profile/ColorPicker";
import { AutoTransferCard } from "../../components/profile/AutoTransferCard";
import { PersonalInfoCard } from "../../components/profile/PersonalInfoCard";
import { ProfileActionButton } from "../../components/profile/ProfileActionButton";
import { ProfileModals } from "../../components/profile/ProfileModals";

import FamilyChildrenCard from "../../components/home/FamilyChildrenCard";
import AddChildModal from "../../components/home/AddChildModal";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { translate, language, supportedLanguages } = useLanguage();
<<<<<<< ours
  const params = useLocalSearchParams();
  const openChatParam = Array.isArray(params?.openChat)
    ? params.openChat[0]
    : params?.openChat;

  const openedFromParamRef = useRef(false);
=======
  const params = useLocalSearchParams();
>>>>>>> theirs
  const { data: user, refetch: refetchUser } = useUser();
  const { auth, signOut } = useAuth();

  const isExpoGo = Constants?.appOwnership === "expo";

  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showLiveChat, setShowLiveChat] = useState(false);

  // Add Child (moved from Home to Profile)
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [children, setChildren] = useState([]);
  const [loadingChildren, setLoadingChildren] = useState(false);

  const { settings, updateSettings, handleThemeToggle } = useSettings();

  const {
    selectedColor,
    showColorPicker,
    colorOptions,
    handleColorChange,
    toggleColorPicker,
  } = useProfileColors();

  // Keep auto-transfer logic running (loads settings / keeps state), but hide the UI in Expo Go.
  const { autoTransferEnabled, autoTransferUpdating, toggleAutoTransfer } =
    useAutoTransfer(auth, translate);

  const {
    handleLogout,
    handleAbout,
    handleHistory,
    navigateToBankAccounts,
    navigateToCards,
    navigateToInvite,
  } = useProfileActions(signOut, translate);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const currentLanguage =
    supportedLanguages.find((lang) => lang.code === language) ||
    supportedLanguages[0];

  useEffect(() => {
<<<<<<< ours
    const shouldOpen = openChatParam === "1" || openChatParam === "true";
    if (!shouldOpen) {
      return;
    }
    if (openedFromParamRef.current) {
      return;
    }
    openedFromParamRef.current = true;
    setShowLiveChat(true);
  }, [openChatParam]);

  useEffect(() => {
=======
    const raw = Array.isArray(params?.openLiveChat)
      ? params.openLiveChat[0]
      : params?.openLiveChat;

    const shouldOpen = raw === "1" || raw === "true";
    if (shouldOpen) {
      setShowLiveChat(true);
    }
  }, [params?.openLiveChat]);

  useEffect(() => {
>>>>>>> theirs
    const fetchChildren = async () => {
      if (!user?.email) {
        setChildren([]);
        return;
      }

      setLoadingChildren(true);
      try {
        const response = await fetch("/api/family/children");
        if (!response.ok) {
          setChildren([]);
          return;
        }
        const data = await response.json();
        setChildren(data.children || []);
      } catch (error) {
        console.error("Error fetching children (profile):", error);
        setChildren([]);
      } finally {
        setLoadingChildren(false);
      }
    };

    fetchChildren();
  }, [user?.email]);

  const handleChildAdded = (newChild) => {
    if (!newChild) {
      return;
    }
    setChildren((prev) => [newChild, ...prev]);
  };

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontFamily: "Inter_500Medium",
            color: colors.textSecondary,
          }}
        >
          {translate("loading")}
        </Text>
      </View>
    );
  }

  return (
    <View
      key={`profile-${language}`}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScrollView
        key={`scroll-${language}`}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER WITH LANGUAGE SELECTOR */}
        <ProfileHeader
          colors={colors}
          isDark={isDark}
          selectedColor={selectedColor}
          currentLanguage={currentLanguage}
          showColorPicker={showColorPicker}
          onLanguageSelectorPress={() => setShowLanguageSelector(true)}
          onColorPickerToggle={toggleColorPicker}
          onThemeToggle={handleThemeToggle}
          translate={translate}
        />

        {/* 👤 PERSONLIG INFORMASJON (moved up) */}
        <PersonalInfoCard
          colors={colors}
          isDark={isDark}
          selectedColor={selectedColor}
          user={user}
          translate={translate}
          onRefetch={refetchUser}
        />

        {/* Color Picker */}
        {showColorPicker && (
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <ColorPicker
              colors={colors}
              isDark={isDark}
              selectedColor={selectedColor}
              onColorChange={handleColorChange}
              colorOptions={colorOptions}
            />
          </View>
        )}

        {/* 🏦 AUTO-OVERFØRING TIL BANK */}
        {auth && !isExpoGo && (
          <AutoTransferCard
            colors={colors}
            autoTransferEnabled={autoTransferEnabled}
            autoTransferUpdating={autoTransferUpdating}
            onToggle={toggleAutoTransfer}
            translate={translate}
          />
        )}

        {/* 🏦 LEGG TIL BANK */}
        <ProfileActionButton
          icon={Building2}
          title={`🏦 ${translate("addBankAccount") || "Legg til bank"}`}
          onPress={navigateToBankAccounts}
          colors={colors}
          isDark={isDark}
          accentColor={selectedColor.color}
        />

        {/* 💳 LEGG TIL KORT */}
        <ProfileActionButton
          icon={CreditCard}
          title={`💳 ${translate("addCard") || "Legg til kort"}`}
          subtitle={translate("manageCards") || "Administrer bankkort"}
          onPress={navigateToCards}
          colors={colors}
          isDark={isDark}
          accentColor={selectedColor.color}
        />

        {/* 👶 Legg til barn (under Legg til kort) */}
        <FamilyChildrenCard
          children={children}
          onAddChild={() => setShowAddChildModal(true)}
        />

        {/* 💬 LIVE CHAT SUPPORT */}
        <ProfileActionButton
          icon={MessageCircle}
          title={`💬 ${translate("liveSupport") || "Live support"}`}
          subtitle={translate("chatWithSupport") || "Chat med oss"}
          onPress={() => setShowLiveChat(true)}
          colors={colors}
          isDark={isDark}
          accentColor={selectedColor.color}
        />

        {/* 👥 INVITER VENNER (skal ligge over historie i menyen) */}
        <ProfileActionButton
          icon={Users}
          title={`👥 ${translate("inviteFriends") || "Inviter venner"}`}
          subtitle={
            translate("inviteFriendsSubtitle") ||
            "Del en invitasjon og få belønninger"
          }
          onPress={navigateToInvite}
          colors={colors}
          isDark={isDark}
          accentColor={selectedColor.color}
        />

        {/* ℹ️ OM */}
        <ProfileActionButton
          icon={Info}
          title={`ℹ️ ${translate("about") || "Om"}`}
          subtitle={translate("aboutApp") || "Om Lynrask-appen"}
          onPress={handleAbout}
          colors={colors}
          isDark={isDark}
          accentColor={selectedColor.color}
        />

        {/* 🚀 HISTORIE BAK LYNRASK */}
        <ProfileActionButton
          icon={Sparkles}
          title={`⚡ ${translate("historyTitle") || "Historie bak Lynrask 🚀"}`}
          subtitle={
            translate("historySubtitle") ||
            translate("historyDescription") ||
            "Les om hvordan Lynrask ble til"
          }
          onPress={handleHistory}
          colors={colors}
          isDark={isDark}
          accentColor={selectedColor.color}
        />

        {/* 🚪 LOGOUT BUTTON */}
        {auth && (
          <ProfileActionButton
            icon={LogOut}
            title={`🚪 ${translate("logout") || "Logg ut"}`}
            subtitle={translate("logoutSubtitle") || "Avslutt økt"}
            onPress={handleLogout}
            colors={colors}
            isDark={isDark}
            accentColor={selectedColor.color}
            isDanger={true}
          />
        )}
      </ScrollView>

      {/* MODALS */}
      <ProfileModals
        showLiveChat={showLiveChat}
        showLanguageSelector={showLanguageSelector}
        onCloseLiveChat={() => setShowLiveChat(false)}
        onCloseLanguageSelector={() => setShowLanguageSelector(false)}
        colors={colors}
        isDark={isDark}
        accentColor={selectedColor.color}
      />

      <AddChildModal
        visible={showAddChildModal}
        onClose={() => setShowAddChildModal(false)}
        onChildAdded={handleChildAdded}
      />
    </View>
  );
}
