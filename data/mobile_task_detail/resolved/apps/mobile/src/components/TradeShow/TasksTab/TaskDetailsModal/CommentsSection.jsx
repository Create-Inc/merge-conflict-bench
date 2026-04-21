import { View, Text } from "react-native";
import { MessageSquare } from "lucide-react-native";
import { CommentCard } from "./CommentCard";
import { CommentComposer } from "./CommentComposer";

export function CommentsSection({
  COLORS,
  comments,
  threads,
  onReplyPress,
  onOpenUrl,
  onCopyUrl,
  renderCommentBody,
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
  onLayout,
}) {
  const commentCount = comments.length;
  const hasTop = threads.top.length > 0;

  return (
    <View
      onLayout={onLayout}
      style={{
        backgroundColor: COLORS.bg.tertiary,
        borderWidth: 1,
        borderColor: COLORS.border.primary,
        borderRadius: 14,
        padding: 14,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <MessageSquare size={16} color={COLORS.text.primary} />
        <Text style={{ color: COLORS.text.primary, fontWeight: "900" }}>
          Comments
        </Text>
        <Text style={{ color: COLORS.text.tertiary, fontWeight: "800" }}>
          {commentCount}
        </Text>
      </View>

      <View style={{ marginTop: 12, gap: 10 }}>
        {!hasTop ? (
          <Text style={{ color: COLORS.text.tertiary }}>No comments yet.</Text>
        ) : (
          threads.top.map((c) => {
            const replies = threads.repliesByParent.get(Number(c.id)) || [];
            const hasReplies = replies.length > 0;

            return (
              <View key={String(c.id)} style={{ gap: 8 }}>
                <CommentCard
                  comment={c}
                  COLORS={COLORS}
                  onReplyPress={() => onReplyPress(c)}
                  onOpenAttachment={onOpenUrl}
                  onCopyAttachment={onCopyUrl}
                  renderBody={renderCommentBody}
                />

                {hasReplies ? (
                  <View
                    style={{
                      marginLeft: 14,
                      paddingLeft: 18,
                      borderLeftWidth: 1,
                      borderLeftColor: COLORS.border.primary,
                      gap: 8,
                    }}
                  >
                    {replies.map((r) => (
                      <CommentCard
                        key={String(r.id)}
                        comment={r}
                        COLORS={COLORS}
                        onReplyPress={() => onReplyPress(r)}
                        onOpenAttachment={onOpenUrl}
                        onCopyAttachment={onCopyUrl}
                        renderBody={renderCommentBody}
                        isReply
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })
        )}

        <CommentComposer
          COLORS={COLORS}
          commentText={commentText}
          setCommentText={setCommentText}
          commentSelection={commentSelection}
          setCommentSelection={setCommentSelection}
          pendingFiles={pendingFiles}
          attachmentError={attachmentError}
          replyTo={replyTo}
          mentionCandidates={mentionCandidates}
          isWorking={isWorking}
          uploadLoading={uploadLoading}
          onPickAttachments={onPickAttachments}
          onClearPendingFiles={onClearPendingFiles}
          onRemovePendingFile={onRemovePendingFile}
          onCancelReply={onCancelReply}
          onInsertMention={onInsertMention}
          onSubmitComment={onSubmitComment}
        />
      </View>
    </View>
  );
}
