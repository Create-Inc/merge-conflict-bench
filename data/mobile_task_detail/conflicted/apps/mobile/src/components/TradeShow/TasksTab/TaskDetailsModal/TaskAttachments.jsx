import { View, Text, TouchableOpacity } from "react-native";
<<<<<<< ours
import { Paperclip, Copy } from "lucide-react-native";
=======
import { Paperclip } from "lucide-react-native";
>>>>>>> theirs
import { attachmentLabel } from "@/utils/taskFormatters";

<<<<<<< ours
export function TaskAttachments({ attachments, COLORS, onOpenUrl, onCopyUrl }) {
  const list = Array.isArray(attachments)
    ? attachments.filter((u) => typeof u === "string" && u.trim())
    : [];
=======
export function TaskAttachments({ attachments, COLORS, onOpenUrl }) {
  const list = Array.isArray(attachments)
    ? attachments.filter((u) => typeof u === "string" && u.trim())
    : [];
>>>>>>> theirs

<<<<<<< ours
  if (list.length === 0) return null;

  const canCopy = typeof onCopyUrl === "function";

=======
  if (list.length === 0) return null;

>>>>>>> theirs
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
<<<<<<< ours
        {list.map((u) => {
          const label = attachmentLabel(u);
          return (
            <View
              key={u}
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
=======
        {list.map((u) => (
          <TouchableOpacity
            key={u}
            onPress={() => onOpenUrl(u)}
            activeOpacity={0.9}
            style={{
              borderWidth: 1,
              borderColor: COLORS.border.primary,
              backgroundColor: COLORS.bg.secondary,
              borderRadius: 12,
              padding: 10,
              gap: 4,
            }}
          >
            <Text
              style={{
                color: COLORS.text.primary,
                fontWeight: "900",
              }}
              numberOfLines={1}
>>>>>>> theirs
            >
              <TouchableOpacity
                onPress={() => onOpenUrl(u)}
                onLongPress={canCopy ? () => onCopyUrl(u) : undefined}
                activeOpacity={0.9}
                style={{
                  flex: 1,
                  minWidth: 0,
                  borderWidth: 1,
                  borderColor: COLORS.border.primary,
                  backgroundColor: COLORS.bg.tertiary,
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
      </View>

      <Text
        style={{
          marginTop: 10,
          color: COLORS.text.tertiary,
          fontSize: 12,
        }}
      >
<<<<<<< ours
        Tip: long-press an attachment to copy the link.
      </Text>

      <Text
        style={{
          marginTop: 6,
          color: COLORS.text.tertiary,
          fontSize: 12,
        }}
      >
        To add or remove task attachments, use Edit.
=======
        To add or remove attachments, use Edit.
>>>>>>> theirs
      </Text>
    </View>
  );
}
