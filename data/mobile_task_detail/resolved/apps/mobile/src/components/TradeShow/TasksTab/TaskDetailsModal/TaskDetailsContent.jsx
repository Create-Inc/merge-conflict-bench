import { useCallback } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { TaskInfo } from "./TaskInfo";
import { CommentsSection } from "./CommentsSection";
import { TaskAttachments } from "./TaskAttachments";
import { tokenizeMentions } from "@/utils/mentionHelpers";

export function TaskDetailsContent({
  task,
  isLoading,
  error,
  COLORS,
  canEdit,
  assignedLine,
  onToggleDone,
  onEdit,
  confirmDelete,
  updateTaskPending,
  comments,
  threads,
  onReplyPress,
  openUrl,
  copyUrl,
  onQuickMention,
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
  onCommentsLayout,
  taskAttachments,
}) {
  const renderCommentBody = useCallback(
    (text) => {
      const tokens = tokenizeMentions(text);

      return (
        <Text style={{ color: COLORS.text.primary, lineHeight: 18 }}>
          {tokens.map((t, idx) => {
            const key = `${t.type}-${idx}`;

            if (t.type === "mention") {
              const label = String(t.value || "").trim();
              const hasLabel = Boolean(label);
              const mentionLabel = hasLabel ? `@${label}` : "@";

              const pressable =
                typeof onQuickMention === "function" && Boolean(label);

              const onPress = pressable ? () => onQuickMention(label) : undefined;

              const bgColor = `${COLORS.brand}18`;
              const borderColor = `${COLORS.brand}40`;

              return (
                <Text
                  key={key}
                  onPress={onPress}
                  suppressHighlighting
                  style={{
                    color: COLORS.brand,
                    fontWeight: "900",
                    backgroundColor: bgColor,
                    borderWidth: 1,
                    borderColor,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 6,
                  }}
                >
                  {mentionLabel}
                </Text>
              );
            }

            return <Text key={key}>{t.value}</Text>;
          })}
        </Text>
      );
    },
    [COLORS.brand, COLORS.text.primary, onQuickMention],
  );

  if (isLoading) {
    return (
      <View style={{ paddingTop: 28, alignItems: "center" }}>
        <ActivityIndicator color={COLORS.brand} />
        <Text style={{ marginTop: 10, color: COLORS.text.secondary }}>
          Loading…
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          padding: 12,
          borderRadius: 14,
          backgroundColor: "#EF444420",
          borderWidth: 1,
          borderColor: "#EF444440",
        }}
      >
        <Text style={{ color: "#FCA5A5", fontWeight: "800" }}>
          {error instanceof Error ? error.message : "Could not load task"}
        </Text>
      </View>
    );
  }

  if (!task) {
    return null;
  }

  return (
    <>
      <TaskInfo
        task={task}
        COLORS={COLORS}
        canEdit={canEdit}
        assignedLine={assignedLine}
        onToggleDone={onToggleDone}
        onEdit={onEdit}
        confirmDelete={confirmDelete}
        updateTaskPending={updateTaskPending}
      />

      <View style={{ height: 14 }} />

      <CommentsSection
        COLORS={COLORS}
        comments={comments}
        threads={threads}
        onReplyPress={onReplyPress}
        onOpenUrl={openUrl}
        onCopyUrl={copyUrl}
        renderCommentBody={renderCommentBody}
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
        onLayout={onCommentsLayout}
      />

      <TaskAttachments
        attachments={taskAttachments}
        COLORS={COLORS}
        onOpenUrl={openUrl}
        onCopyUrl={copyUrl}
      />
    </>
  );
}
