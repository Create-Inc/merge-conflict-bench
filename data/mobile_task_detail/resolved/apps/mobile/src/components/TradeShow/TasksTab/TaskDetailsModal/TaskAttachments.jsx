import { View, Text, TouchableOpacity } from "react-native";
import { Paperclip, Copy } from "lucide-react-native";
import { attachmentLabel } from "@/utils/taskFormatters";

export function TaskAttachments({ attachments, COLORS, onOpenUrl, onCopyUrl }) {
  const list = Array.isArray(attachments)
    ? attachments.filter((u) => typeof u === "string" && u.trim())
    : [];

  if (list.length === 0) return null;

  const canCopy = typeof onCopyUrl === "function";

  return (
    <View
      style={{
        marginTop: 14,
        borderWidth: 1,
        borderColor: COLORS.border.primary,
        backgroundColor: COLORS.bg.tertiary,
        borderRadius: 14,
        padding: 14,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Paperclip size={16} color={COLORS.text.secondary} />
        <Text style={{ color: COLORS.text.primary, fontWeight: "900" }}>
          Attachments
        </Text>
        <Text style={{ color: COLORS.text.tertiary, fontWeight: "800" }}>
          ({list.length})
        </Text>
      </View>

      <View style={{ marginTop: 10, gap: 8 }}>
        {list.map((u) => {
          const label = attachmentLabel(u);
          const onLongPress = canCopy ? () => onCopyUrl(u) : undefined;

          return (
            <View
              key={u}
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <TouchableOpacity
                onPress={() => onOpenUrl(u)}
                onLongPress={onLongPress}
                activeOpacity={0.9}
                style={{
                  flex: 1,
                  minWidth: 0,
                  borderWidth: 1,
                  borderColor: COLORS.border.primary,
                  backgroundColor: COLORS.bg.secondary,
                  borderRadius: 12,
                  padding: 10,
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
                  onPress={() => onCopyUrl(u)}
                  activeOpacity={0.9}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    backgroundColor: COLORS.bg.secondary,
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
      </View>

      {canCopy ? (
        <Text style={{ marginTop: 10, color: COLORS.text.tertiary, fontSize: 12 }}>
          Tip: long-press an attachment to copy the link.
        </Text>
      ) : null}

      <Text style={{ marginTop: 10, color: COLORS.text.tertiary, fontSize: 12 }}>
        To add or remove attachments, use Edit.
      </Text>
    </View>
  );
}
