import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import {
  Paperclip,
  CornerDownRight,
  CornerUpLeft,
  Copy,
} from "lucide-react-native";
import { formatDateTime, attachmentLabel } from "@/utils/taskFormatters";

function initials(name) {
  const raw = String(name || "").trim();
  if (!raw) return "?";
  const parts = raw.split(/\s+/g).filter(Boolean);
  const first = parts[0] ? parts[0][0] : "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  const out = `${first}${last}`.toUpperCase();
  return out || "?";
}

function AvatarBubble({ avatarUrl, name, COLORS }) {
  const url = typeof avatarUrl === "string" ? avatarUrl.trim() : "";
  const showAvatar = Boolean(url && /^https?:\/\//i.test(url));
  const label = initials(name);

  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 999,
        backgroundColor: COLORS.bg.tertiary,
        borderWidth: 1,
        borderColor: COLORS.border.primary,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {showAvatar ? (
        <Image
          source={{ uri: url }}
          style={{ width: 28, height: 28 }}
          contentFit="cover"
          transition={100}
        />
      ) : (
        <Text
          style={{
            color: COLORS.text.primary,
            fontWeight: "900",
            fontSize: 12,
          }}
        >
          {label}
        </Text>
      )}
    </View>
  );
}

export function CommentCard({
  comment,
  COLORS,
  onReplyPress,
  onOpenAttachment,
  onCopyAttachment,
  renderBody,
  isReply = false,
}) {
  const name = comment?.employee_name
    ? String(comment.employee_name)
    : "Employee";

  const created = comment?.created_at ? formatDateTime(comment.created_at) : null;

  const bodyText = comment?.comment ? String(comment.comment) : "";

  const attachments = Array.isArray(comment?.attachments)
    ? comment.attachments.filter((v) => typeof v === "string" && v.trim())
    : [];

  const avatarUrl = comment?.employee_avatar_url
    ? String(comment.employee_avatar_url)
    : "";

  const canCopy = typeof onCopyAttachment === "function";

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: COLORS.border.primary,
        backgroundColor: COLORS.bg.secondary,
        borderRadius: 12,
        padding: 10,
      }}
    >
      <View style={{ flexDirection: "row", gap: 10 }}>
        <AvatarBubble avatarUrl={avatarUrl} name={name} COLORS={COLORS} />

        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {isReply ? (
              <CornerDownRight size={14} color={COLORS.text.tertiary} />
            ) : null}

            <Text
              style={{
                color: COLORS.text.primary,
                fontSize: 12,
                fontWeight: "900",
              }}
              numberOfLines={1}
            >
              {name}
            </Text>

            {created ? (
              <Text style={{ color: COLORS.text.tertiary, fontSize: 12 }}>
                {created}
              </Text>
            ) : null}

            <TouchableOpacity
              onPress={onReplyPress}
              activeOpacity={0.9}
              style={{
                marginLeft: "auto",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: COLORS.bg.tertiary,
                borderWidth: 1,
                borderColor: COLORS.border.primary,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <CornerUpLeft size={14} color={COLORS.text.secondary} />
              <Text
                style={{
                  color: COLORS.text.secondary,
                  fontWeight: "900",
                  fontSize: 12,
                }}
              >
                Reply
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 6 }}>{renderBody(bodyText)}</View>

          {attachments.length > 0 ? (
            <View style={{ marginTop: 10, gap: 8 }}>
              {attachments.map((u) => {
                const label = attachmentLabel(u);
                const onLongPress = canCopy
                  ? () => onCopyAttachment(u)
                  : undefined;

                return (
                  <View
                    key={u}
                    style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                  >
                    <TouchableOpacity
                      onPress={() => onOpenAttachment(u)}
                      onLongPress={onLongPress}
                      activeOpacity={0.9}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        borderRadius: 12,
                        backgroundColor: COLORS.bg.tertiary,
                        borderWidth: 1,
                        borderColor: COLORS.border.primary,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Paperclip size={14} color={COLORS.text.secondary} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          style={{
                            color: COLORS.text.primary,
                            fontWeight: "900",
                          }}
                          numberOfLines={1}
                        >
                          {label}
                        </Text>
                        <Text
                          style={{
                            color: COLORS.text.tertiary,
                            fontSize: 12,
                          }}
                          numberOfLines={1}
                        >
                          {u}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {canCopy ? (
                      <TouchableOpacity
                        onPress={() => onCopyAttachment(u)}
                        activeOpacity={0.9}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 12,
                          backgroundColor: COLORS.bg.tertiary,
                          borderWidth: 1,
                          borderColor: COLORS.border.primary,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        accessibilityLabel="Copy link"
                      >
                        <Copy size={16} color={COLORS.text.secondary} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              })}

              {canCopy ? (
                <Text style={{ color: COLORS.text.tertiary, fontSize: 12 }}>
                  Tip: long-press an attachment to copy the link.
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
