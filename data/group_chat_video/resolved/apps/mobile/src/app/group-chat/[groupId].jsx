import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LynraskTextInput as TextInput } from "@/components/LynraskTextInput";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  Send,
  Users,
  MoreVertical,
  CheckCheck,
  Clock,
  ArrowLeft,
  Phone,
  Video,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../components/hooks/useTheme";
import { useUser } from "../../utils/auth/useUser";
import GroupModerationModal from "@/components/gruppe/GroupModerationModal";
import { useQueryClient } from "@tanstack/react-query";

export default function GroupChatScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { groupId } = useLocalSearchParams();
  const { user } = useUser();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [groupInfo, setGroupInfo] = useState(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef();
  const queryClient = useQueryClient();

  const startVideoCall = useCallback(async () => {
    const groupIdStr = Array.isArray(groupId) ? groupId[0] : groupId;
    if (!groupIdStr) {
      Alert.alert("Feil", "Mangler gruppe-id");
      return;
    }

    const safeGroupId = String(groupIdStr || "group").replace(
      /[^a-zA-Z0-9_-]/g,
      "-",
    );

    // ✅ Open video chat inside the app (works in Expo Go too)
    router.push(`/group-video/${safeGroupId}?audio=0`);
  }, [groupId]);

  const startAudioCall = useCallback(async () => {
    const groupIdStr = Array.isArray(groupId) ? groupId[0] : groupId;
    if (!groupIdStr) {
      Alert.alert("Feil", "Mangler gruppe-id");
      return;
    }

    const safeGroupId = String(groupIdStr || "group").replace(
      /[^a-zA-Z0-9_-]/g,
      "-",
    );

    // ✅ Audio-only mode via query param
    router.push(`/group-video/${safeGroupId}?audio=1`);
  }, [groupId]);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [showModeration, setShowModeration] = useState(false);
  const [memberActionLoadingId, setMemberActionLoadingId] = useState(null);
  const [leavingGroup, setLeavingGroup] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);

  const apiHeaders = useMemo(() => {
    const headers = {};

    // ✅ Always send a stable user id (works for guest + signed-in)
    if (user?.id) {
      headers["x-user-id"] = String(user.id);
    }

    // ✅ Send email when available (signed-in)
    if (user?.email) {
      headers["x-user-email"] = user.email;
    }

    return headers;
  }, [user]);

  const actorKey = useMemo(() => {
    if (user?.email) {
      return user.email;
    }
    if (user?.id) {
      return String(user.id);
    }
    return null;
  }, [user]);

  const isAdmin = Boolean(actorKey && groupInfo?.adminEmail === actorKey);

  const activeMemberCount = useMemo(() => {
    if (typeof groupInfo?.activeMemberCount === "number") {
      return groupInfo.activeMemberCount;
    }
    const members = Array.isArray(groupInfo?.members) ? groupInfo.members : [];
    return members.filter((m) => m.status === "active").length;
  }, [groupInfo]);

  // Load group info and messages
  useEffect(() => {
    loadGroupData({ silent: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // 🔁 Poll for new messages (simple + reliable)
  useEffect(() => {
    if (!groupId) {
      return;
    }

    const interval = setInterval(() => {
      loadGroupData({ silent: true });
    }, 4000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, apiHeaders]);

  const loadGroupData = async ({ silent } = { silent: false }) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      const response = await fetch(
        `/api/family/management?groupId=${groupId}`,
        {
          headers: apiHeaders,
        },
      );

      if (!response.ok) {
        throw new Error("Kunne ikke laste gruppe");
      }

      const data = await response.json();
      if (data?.group) {
        setGroupInfo(data.group);
      }
      if (Array.isArray(data?.messages)) {
        setMessages(data.messages);
      }
    } catch (error) {
      // Avoid spamming alerts during polling
      console.error("Error loading group:", error);
      if (!silent) {
        Alert.alert("Feil", "Kunne ikke laste gruppe. Prøv igjen.");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleToggleBlock = useCallback(
    async (member) => {
      if (!isAdmin) {
        return;
      }

      const memberName =
        member?.display_name || member?.member_email || "Ukjent";
      const isBlocked = member?.status === "blocked";
      const action = isBlocked ? "unblock_member" : "block_member";
      const actionLabel = isBlocked ? "fjerne blokkering" : "blokkere";

      Alert.alert("Moderering", `Vil du ${actionLabel} ${memberName}?`, [
        { text: "Avbryt", style: "cancel" },
        {
          text: isBlocked ? "Fjern blokk" : "Blokker",
          style: isBlocked ? "default" : "destructive",
          onPress: async () => {
            try {
              setMemberActionLoadingId(member.id);

              const response = await fetch("/api/family/management", {
                method: "PUT",
                headers: {
                  ...apiHeaders,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  action,
                  groupId,
                  memberId: member.id,
                }),
              });

              const data = await response.json().catch(() => ({}));

              if (!response.ok) {
                const err = data?.error || "Kunne ikke oppdatere blokkering";
                throw new Error(err);
              }

              // Update local groupInfo so the UI updates immediately
              setGroupInfo((prev) => {
                if (!prev) {
                  return prev;
                }
                const prevMembers = Array.isArray(prev.members)
                  ? prev.members
                  : [];
                const nextMembers = prevMembers.map((m) => {
                  if (m.id === member.id) {
                    return {
                      ...m,
                      status:
                        data?.member?.status ||
                        (isBlocked ? "active" : "blocked"),
                    };
                  }
                  return m;
                });
                const nextActiveCount = nextMembers.filter(
                  (m) => m.status === "active",
                ).length;
                return {
                  ...prev,
                  members: nextMembers,
                  activeMemberCount: nextActiveCount,
                };
              });
            } catch (e) {
              console.error(e);
              Alert.alert(
                "Feil",
                e.message || "Kunne ikke oppdatere blokkering",
              );
            } finally {
              setMemberActionLoadingId(null);
            }
          },
        },
      ]);
    },
    [apiHeaders, groupId, isAdmin],
  );

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || sending) return;

    const messageText = message.trim();
    setMessage("");
    setSending(true);

    try {
      Haptics.selectionAsync();

      const newMessage = {
        id: Date.now(),
        message: messageText,
        is_from_user: true,
        sender_name: user?.name || "Deg",
        created_at: new Date().toISOString(),
        status: "sent",
      };

      setMessages((prev) => [...prev, newMessage]);

      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: {
          ...apiHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupId,
          message: messageText,
          senderName: actorKey || user?.email || user?.id || "Unknown",
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const errMsg = data?.error || "Kunne ikke sende melding";
        throw new Error(errMsg);
      }

      // Update message status
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newMessage.id ? { ...msg, status: "delivered" } : msg,
          ),
        );
      }, 500);

      loadGroupData({ silent: true });
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert(
        "Feil",
        error.message || "Kunne ikke sende melding. Prøv igjen.",
      );
      setMessage(messageText);
    } finally {
      setSending(false);
    }
  }, [actorKey, apiHeaders, groupId, message, sending, user]);

  const handleLeaveGroup = useCallback(() => {
    Alert.alert(
      "Forlat gruppe",
      "Er du sikker på at du vil forlate denne gruppa?",
      [
        { text: "Avbryt", style: "cancel" },
        {
          text: "Forlat",
          style: "destructive",
          onPress: async () => {
            try {
              setLeavingGroup(true);
              const response = await fetch("/api/family/management", {
                method: "PUT",
                headers: {
                  ...apiHeaders,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  action: "leave_group",
                  groupId,
                }),
              });

              const data = await response.json().catch(() => ({}));
              if (!response.ok) {
                throw new Error(data?.error || "Kunne ikke forlate gruppa");
              }

              queryClient.invalidateQueries({ queryKey: ["family-management"] });

              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              setShowModeration(false);
              router.replace("/(tabs)/gruppe");
            } catch (e) {
              console.error(e);
              Alert.alert("Feil", e.message || "Kunne ikke forlate gruppa");
            } finally {
              setLeavingGroup(false);
            }
          },
        },
      ],
    );
  }, [apiHeaders, groupId, queryClient]);

  const handleDeleteGroup = useCallback(() => {
    Alert.alert("Slett gruppe", "Dette sletter gruppa for alle. Er du sikker?", [
      { text: "Avbryt", style: "cancel" },
      {
        text: "Slett",
        style: "destructive",
        onPress: async () => {
          try {
            setDeletingGroup(true);
            const response = await fetch("/api/family/management", {
              method: "PUT",
              headers: {
                ...apiHeaders,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                action: "delete_group",
                groupId,
              }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
              throw new Error(data?.error || "Kunne ikke slette gruppa");
            }

            queryClient.invalidateQueries({ queryKey: ["family-management"] });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowModeration(false);
            router.replace("/(tabs)/gruppe");
          } catch (e) {
            console.error(e);
            Alert.alert("Feil", e.message || "Kunne ikke slette gruppa");
          } finally {
            setDeletingGroup(false);
          }
        },
      },
    ]);
  }, [apiHeaders, groupId, queryClient]);

  const getMessageStatusIcon = (status) => {
    switch (status) {
      case "sent":
        return <Clock size={14} color={colors.textSecondary} />;
      case "delivered":
        return <CheckCheck size={14} color={colors.textSecondary} />;
      case "read":
        return <CheckCheck size={14} color={colors.primary} />;
      default:
        return null;
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("no-NO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMessage = useCallback(
    ({ item }) => {
      return (
        <View
          style={{
            paddingHorizontal: 16,
            marginBottom: 16,
            alignItems: item.is_from_user ? "flex-end" : "flex-start",
          }}
        >
          {!item.is_from_user && item.sender_name && (
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 12,
                color: colors.textSecondary,
                marginBottom: 4,
                marginLeft: 12,
              }}
            >
              {item.sender_name}
            </Text>
          )}

          <View
            style={{
              maxWidth: "80%",
              backgroundColor: item.is_from_user ? colors.primary : colors.surface,
              borderRadius: 16,
              padding: 12,
              borderWidth: item.is_from_user ? 0 : 1,
              borderColor: colors.surfaceBorder,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 15,
                color: item.is_from_user ? "#FFFFFF" : colors.text,
                lineHeight: 20,
                marginBottom: 4,
              }}
            >
              {item.message}
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: item.is_from_user ? "flex-end" : "flex-start",
                gap: 4,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 11,
                  color: item.is_from_user
                    ? "rgba(255,255,255,0.8)"
                    : colors.textSecondary,
                }}
              >
                {formatTime(item.created_at)}
              </Text>
              {item.is_from_user && item.status && (
                <View style={{ opacity: 0.8 }}>
                  {getMessageStatusIcon(item.status)}
                </View>
              )}
            </View>
          </View>
        </View>
      );
    },
    [colors, formatTime],
  );

  if (!fontsLoaded || loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: colors.text }}>Laster gruppe chat...</Text>
      </View>
    );
  }

  const headerMemberText = `${activeMemberCount} medlemmer`;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Group Chat Header */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 16,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.surfaceBorder,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.background,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12,
            }}
          >
            <ArrowLeft size={20} color={colors.text} />
          </Pressable>

          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: (groupInfo?.color || "#FF6B35") + "20",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Text style={{ fontSize: 24 }}>{groupInfo?.emoji || "👥"}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 18,
                color: colors.text,
                marginBottom: 2,
              }}
            >
              {groupInfo?.name || "Gruppe chat"}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Users color={colors.textSecondary} size={14} />
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 13,
                  color: colors.textSecondary,
                  marginLeft: 4,
                }}
              >
                {headerMemberText}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            onPress={startVideoCall}
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
            <Video size={18} color={colors.textSecondary} />
          </Pressable>

          <Pressable
            onPress={startAudioCall}
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
            <Phone size={18} color={colors.textSecondary} />
          </Pressable>

          <Pressable
            onPress={() => setShowModeration(true)}
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
            <MoreVertical size={18} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 16,
        }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }}
        ListEmptyComponent={() => (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 40,
            }}
          >
            <Text style={{ fontSize: 48, marginBottom: 16 }}>
              {groupInfo?.emoji || "👥"}
            </Text>
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 18,
                color: colors.text,
                marginBottom: 8,
              }}
            >
              {groupInfo?.name || "Gruppe chat"}
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 14,
                color: colors.textSecondary,
                textAlign: "center",
                paddingHorizontal: 40,
              }}
            >
              Send din første melding for å starte samtalen
            </Text>
          </View>
        )}
      />

      {/* Message Input */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.surfaceBorder,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            backgroundColor: colors.background,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: colors.surfaceBorder,
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          <TextInput
            style={{
              flex: 1,
              fontFamily: "Inter_400Regular",
              fontSize: 16,
              color: colors.text,
              maxHeight: 100,
              minHeight: 36,
              paddingTop: 8,
              paddingBottom: 8,
            }}
            placeholder="Skriv en melding..."
            placeholderTextColor={colors.textSecondary}
            value={message}
            onChangeText={setMessage}
            multiline
            editable={!sending}
            onFocus={() => {
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 300);
            }}
          />

          <Pressable
            onPress={handleSendMessage}
            disabled={!message.trim() || sending}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor:
                message.trim() && !sending
                  ? colors.primary
                  : colors.surfaceBorder,
              justifyContent: "center",
              alignItems: "center",
              marginLeft: 8,
            }}
          >
            <Send
              size={16}
              color={message.trim() && !sending ? "#FFFFFF" : colors.textSecondary}
            />
          </Pressable>
        </View>
      </View>

      <GroupModerationModal
        visible={showModeration}
        onClose={() => setShowModeration(false)}
        colors={colors}
        insets={insets}
        groupName={groupInfo?.name}
        members={groupInfo?.members}
        isAdmin={isAdmin}
        loadingMemberId={memberActionLoadingId}
        onToggleBlock={handleToggleBlock}
        onLeaveGroup={isAdmin ? undefined : handleLeaveGroup}
        onDeleteGroup={isAdmin ? handleDeleteGroup : undefined}
        leaving={leavingGroup}
        deleting={deletingGroup}
      />
    </KeyboardAvoidingView>
  );
}
