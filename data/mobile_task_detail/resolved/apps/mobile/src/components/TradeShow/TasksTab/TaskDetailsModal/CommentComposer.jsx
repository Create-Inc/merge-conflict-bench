import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Paperclip, Trash2, X } from "lucide-react-native";

function initials(name) {
  const raw = String(name || "").trim();
  if (!raw) return "?";
  const parts = raw.split(/\s+/g).filter(Boolean);
  const first = parts[0] ? parts[0][0] : "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  const out = `${first}${last}`.toUpperCase();
  return out || "?";
}

export function CommentComposer({
  COLORS,
  commentText,
  setCommentText,
  commentSelection,
  setCommentSelection,
  pendingFiles,
  attachmentError,
  replyTo,
  mentionCandidates,
  isWorking,
  uploadLoading,
  onPickAttachments,
  onClearPendingFiles,
  onRemovePendingFile,
  onCancelReply,
  onInsertMention,
  onSubmitComment,
}) {
  const hasPending = pendingFiles.length > 0;
  const canPost = Boolean(String(commentText || "").trim()) && !isWorking;
  const attachButtonLabel = uploadLoading ? "Uploading…" : "Attach";

  return (
    <View
      style={{
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border.primary,
        gap: 10,
      }}
    >
      {/* Web-style: Post button top-right */}
      <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
        <TouchableOpacity
          onPress={onSubmitComment}
          disabled={!canPost}
          activeOpacity={0.9}
          style={{
            paddingHorizontal: 14,
            height: 40,
            borderRadius: 12,
            backgroundColor: COLORS.brand,
            alignItems: "center",
            justifyContent: "center",
            opacity: canPost ? 1 : 0.6,
            flexDirection: "row",
            gap: 10,
          }}
        >
          {isWorking ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ color: "#FFFFFF", fontWeight: "900" }}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Attach / Clear row */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <TouchableOpacity
          onPress={onPickAttachments}
          disabled={isWorking}
          activeOpacity={0.9}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: COLORS.border.primary,
            backgroundColor: COLORS.bg.secondary,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            opacity: isWorking ? 0.6 : 1,
          }}
        >
          <Paperclip size={16} color={COLORS.text.primary} />
          <Text
            style={{
              color: COLORS.text.primary,
              fontWeight: "900",
              fontSize: 12,
            }}
          >
            {attachButtonLabel}
          </Text>
        </TouchableOpacity>

        {hasPending ? (
          <TouchableOpacity
            onPress={onClearPendingFiles}
            disabled={isWorking}
            activeOpacity={0.9}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: COLORS.border.primary,
              backgroundColor: COLORS.bg.tertiary,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              opacity: isWorking ? 0.6 : 1,
            }}
          >
            <Trash2 size={16} color={COLORS.text.secondary} />
            <Text
              style={{
                color: COLORS.text.secondary,
                fontWeight: "900",
                fontSize: 12,
              }}
            >
              Clear
            </Text>
          </TouchableOpacity>
        ) : null}

        <View style={{ justifyContent: "center" }}>
          <Text style={{ color: COLORS.text.tertiary, fontSize: 12 }}>
            Attachments will be uploaded and shared as links.
          </Text>
        </View>
      </View>

      {attachmentError ? (
        <Text
          style={{
            color: COLORS.bad,
            fontWeight: "900",
            fontSize: 12,
          }}
        >
          {attachmentError}
        </Text>
      ) : null}

      {hasPending ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: COLORS.border.primary,
            backgroundColor: COLORS.bg.secondary,
            borderRadius: 12,
            padding: 10,
            gap: 8,
          }}
        >
          <Text
            style={{
              color: COLORS.text.secondary,
              fontWeight: "900",
              fontSize: 12,
            }}
          >
            Ready to send:
          </Text>

          {pendingFiles.map((f, idx) => {
            const name = String(f.name || `Attachment ${idx + 1}`);
            return (
              <View
                key={`${f.uri}-${idx}`}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ color: COLORS.text.primary }} numberOfLines={1}>
                    {name}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => onRemovePendingFile(idx)}
                  disabled={isWorking}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    backgroundColor: COLORS.bg.tertiary,
                    borderWidth: 1,
                    borderColor: COLORS.border.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: isWorking ? 0.6 : 1,
                  }}
                  activeOpacity={0.9}
                >
                  <X size={16} color={COLORS.text.secondary} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      ) : null}

      {replyTo ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: COLORS.border.primary,
            backgroundColor: COLORS.bg.secondary,
            borderRadius: 12,
            padding: 10,
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{
                color: COLORS.text.secondary,
                fontWeight: "900",
                fontSize: 12,
              }}
            >
              Replying to {replyTo.employee_name || "Employee"}
            </Text>
            {replyTo.preview ? (
              <Text
                style={{
                  marginTop: 4,
                  color: COLORS.text.tertiary,
                  fontSize: 12,
                }}
                numberOfLines={1}
              >
                “{replyTo.preview}”
              </Text>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={onCancelReply}
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
          >
            <X size={16} color={COLORS.text.secondary} />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Input + mention menu */}
      <View style={{ position: "relative" }}>
        <TextInput
          value={commentText}
          onChangeText={(t) => setCommentText(t)}
          onSelectionChange={(e) => {
            const sel = e?.nativeEvent?.selection;
            if (!sel) return;
            setCommentSelection({
              start: sel.start,
              end: sel.end,
            });
          }}
          selection={commentSelection}
          placeholder="Write a comment… Use @(Name) to mention a teammate"
          placeholderTextColor={COLORS.text.tertiary}
          multiline
          style={{
            minHeight: 44,
            borderWidth: 1,
            borderColor: COLORS.border.primary,
            backgroundColor: COLORS.bg.secondary,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: COLORS.text.primary,
            textAlignVertical: "top",
          }}
        />

        {mentionCandidates.length > 0 ? (
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 56,
              borderRadius: 12,
              backgroundColor: COLORS.bg.secondary,
              borderWidth: 1,
              borderColor: COLORS.border.primary,
              overflow: "hidden",
              shadowColor: "#000000",
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 10,
            }}
          >
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.border.primary,
              }}
            >
              <Text
                style={{
                  color: COLORS.text.secondary,
                  fontSize: 12,
                  fontWeight: "900",
                }}
              >
                Mention a teammate
              </Text>
            </View>

            <ScrollView
              style={{ maxHeight: 220 }}
              keyboardShouldPersistTaps="handled"
            >
              {mentionCandidates.map((e, idx) => {
                const borderTopColor =
                  idx === 0 ? "transparent" : COLORS.border.primary;

                const candidateName = String(e.name || "Employee");

                return (
                  <TouchableOpacity
                    key={String(e.id)}
                    onPress={() => onInsertMention(e)}
                    activeOpacity={0.9}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderTopWidth: 1,
                      borderTopColor,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
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
                      }}
                    >
                      <Text
                        style={{
                          color: COLORS.text.primary,
                          fontWeight: "900",
                          fontSize: 12,
                        }}
                      >
                        {initials(candidateName)}
                      </Text>
                    </View>

                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={{
                          color: COLORS.text.primary,
                          fontWeight: "900",
                        }}
                        numberOfLines={1}
                      >
                        {candidateName}
                      </Text>
                      {e.email ? (
                        <Text
                          style={{ color: COLORS.text.tertiary, fontSize: 12 }}
                          numberOfLines={1}
                        >
                          {String(e.email)}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </View>

      <Text style={{ color: COLORS.text.tertiary, fontSize: 12 }}>
        Tip: type @ then tap a name (we'll insert it as @(Name)). You can also
        tap an @tag in an older comment.
      </Text>
    </View>
  );
}
