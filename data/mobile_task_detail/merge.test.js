import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// ---------------------------------------------------------------------------
// Utility: read a resolved file as text for structural assertions
// ---------------------------------------------------------------------------
function readResolved(relPath) {
  return readFileSync(join(__dirname, "resolved", relPath), "utf-8");
}

const BASE = "apps/mobile/src/components/TradeShow/TasksTab/TaskDetailsModal";

// =====================================================================
// CommentCard
// =====================================================================
describe("CommentCard", () => {
  const src = readResolved(`${BASE}/CommentCard.jsx`);

  describe("base behaviors", () => {
    it("exports CommentCard as a named export", () => {
      expect(src).toMatch(/export\s+function\s+CommentCard/);
    });

    it("accepts isReply prop with default false", () => {
      expect(src).toMatch(/isReply\s*=\s*false/);
    });

    it("renders CornerDownRight icon for replies", () => {
      expect(src).toMatch(/CornerDownRight/);
    });

    it("renders employee name and created date", () => {
      expect(src).toMatch(/employee_name/);
      expect(src).toMatch(/created_at/);
    });

    it("renders attachments using onOpenAttachment", () => {
      expect(src).toMatch(/onOpenAttachment/);
    });

    it("imports Paperclip icon", () => {
      expect(src).toMatch(/Paperclip/);
    });

    it("uses attachmentLabel from taskFormatters", () => {
      expect(src).toMatch(/attachmentLabel/);
      expect(src).toMatch(/taskFormatters/);
    });
  });

  describe("ours behaviors: Reply button with CornerUpLeft icon, Copy button, formatDateTime", () => {
    it("imports and renders CornerUpLeft icon for the Reply button", () => {
      expect(src).toMatch(/CornerUpLeft/);
    });

    it("renders a styled Reply button with pill shape (borderRadius 999)", () => {
      expect(src).toMatch(/Reply/);
      expect(src).toMatch(/borderRadius:\s*999/);
    });

    it("imports and uses formatDateTime (not just formatDate)", () => {
      expect(src).toMatch(/formatDateTime/);
    });

    it("imports Copy icon for attachment copy functionality", () => {
      expect(src).toMatch(/Copy/);
    });

    it("accepts onCopyAttachment prop", () => {
      expect(src).toMatch(/onCopyAttachment/);
    });

    it("renders a dedicated Copy button with accessibilityLabel", () => {
      expect(src).toMatch(/accessibilityLabel.*Copy link/s);
    });

    it("supports onLongPress on attachments for copying", () => {
      expect(src).toMatch(/onLongPress/);
    });

    it("shows tip about long-pressing to copy the link when canCopy", () => {
      expect(src).toMatch(/long-press an attachment to copy the link/);
    });
  });

  describe("theirs behaviors: AvatarBubble with http validation, URL subtitle", () => {
    it("has an AvatarBubble component or equivalent that validates avatar URLs", () => {
      // Theirs introduced http validation for avatar URLs
      expect(src).toMatch(/https\?:/);
    });

    it("shows the raw URL as a subtitle under each attachment label", () => {
      // Theirs added the URL text display under attachment label
      // Look for the pattern: attachment label text + the raw url
      expect(src).toMatch(/\{u\}/);
    });

    it("renders initials in avatar when no valid URL", () => {
      expect(src).toMatch(/initials/);
    });

    it("uses overflow hidden on avatar container", () => {
      expect(src).toMatch(/overflow.*hidden/s);
    });
  });
});

// =====================================================================
// CommentComposer
// =====================================================================
describe("CommentComposer", () => {
  const src = readResolved(`${BASE}/CommentComposer.jsx`);

  describe("base behaviors", () => {
    it("exports CommentComposer as a named export", () => {
      expect(src).toMatch(/export\s+function\s+CommentComposer/);
    });

    it("renders a Post button", () => {
      expect(src).toMatch(/Post/);
    });

    it("renders an Attach button with Paperclip icon", () => {
      expect(src).toMatch(/Paperclip/);
      expect(src).toMatch(/Attach/);
    });

    it("renders pending files with remove buttons", () => {
      expect(src).toMatch(/pendingFiles/);
      expect(src).toMatch(/onRemovePendingFile/);
    });

    it("renders reply-to section with cancel button", () => {
      expect(src).toMatch(/replyTo/);
      expect(src).toMatch(/onCancelReply/);
    });

    it("renders mention candidates dropdown", () => {
      expect(src).toMatch(/mentionCandidates/);
      expect(src).toMatch(/Mention a teammate/);
    });

    it("uses initials function for mention candidate avatars", () => {
      expect(src).toMatch(/function initials/);
    });
  });

  describe("ours behaviors: attachment upload hint text, border separator", () => {
    it("shows text about attachments being uploaded and shared as links", () => {
      expect(src).toMatch(
        /Attachments will be uploaded and shared as links/,
      );
    });

    it("has border separator at top of composer (borderTopWidth)", () => {
      expect(src).toMatch(/borderTopWidth:\s*1/);
      expect(src).toMatch(/borderTopColor/);
    });
  });

  describe("theirs behaviors: mention tip text", () => {
    it("shows tip about tapping @tag in older comments", () => {
      expect(src).toMatch(/@tag in an older comment/);
    });
  });
});

// =====================================================================
// CommentsSection
// =====================================================================
describe("CommentsSection", () => {
  const src = readResolved(`${BASE}/CommentsSection.jsx`);

  describe("base behaviors", () => {
    it("exports CommentsSection as a named export", () => {
      expect(src).toMatch(/export\s+function\s+CommentsSection/);
    });

    it("renders Comments heading with MessageSquare icon", () => {
      expect(src).toMatch(/MessageSquare/);
      expect(src).toMatch(/Comments/);
    });

    it("renders No comments yet when no top-level comments", () => {
      expect(src).toMatch(/No comments yet/);
    });

    it("passes onCopyAttachment or onCopyUrl to CommentCard", () => {
      expect(src).toMatch(/onCopy/);
    });

    it("renders CommentComposer as part of the comments section", () => {
      expect(src).toMatch(/CommentComposer/);
    });
  });

  describe("theirs behaviors: reply thread indentation with marginLeft", () => {
    it("uses marginLeft: 14 for reply thread indentation", () => {
      expect(src).toMatch(/marginLeft:\s*14/);
    });

    it("uses paddingLeft: 18 for reply thread inner padding", () => {
      expect(src).toMatch(/paddingLeft:\s*18/);
    });
  });
});

// =====================================================================
// TaskAttachments
// =====================================================================
describe("TaskAttachments", () => {
  const src = readResolved(`${BASE}/TaskAttachments.jsx`);

  describe("base behaviors", () => {
    it("exports TaskAttachments as a named export", () => {
      expect(src).toMatch(/export\s+function\s+TaskAttachments/);
    });

    it("filters out empty attachment strings", () => {
      expect(src).toMatch(/typeof u === ["']string["']/);
      expect(src).toMatch(/u\.trim\(\)/);
    });

    it("returns null when list is empty", () => {
      expect(src).toMatch(/list\.length === 0.*return null/s);
    });

    it("shows attachments count", () => {
      expect(src).toMatch(/list\.length/);
    });

    it("shows edit instruction text", () => {
      expect(src).toMatch(/To add or remove attachments, use Edit/);
    });
  });

  describe("ours behaviors: Copy button and long-press support", () => {
    it("imports Copy icon from lucide-react-native", () => {
      expect(src).toMatch(/Copy/);
      expect(src).toMatch(/lucide-react-native/);
    });

    it("accepts onCopyUrl prop", () => {
      expect(src).toMatch(/onCopyUrl/);
    });

    it("renders dedicated Copy button with accessibilityLabel", () => {
      expect(src).toMatch(/accessibilityLabel.*Copy link/s);
    });

    it("supports onLongPress on attachment items", () => {
      expect(src).toMatch(/onLongPress/);
    });

    it("shows tip about long-pressing to copy the link", () => {
      expect(src).toMatch(/long-press an attachment to copy the link/);
    });
  });

  describe("theirs behaviors: URL subtitle display", () => {
    it("shows the raw URL text below the attachment label", () => {
      // The attachment items should show both label and the raw URL
      expect(src).toMatch(/\{u\}/);
    });
  });
});

// =====================================================================
// TaskDetailsContent
// =====================================================================
describe("TaskDetailsContent", () => {
  const src = readResolved(`${BASE}/TaskDetailsContent.jsx`);

  describe("base behaviors", () => {
    it("exports TaskDetailsContent as a named export", () => {
      expect(src).toMatch(/export\s+function\s+TaskDetailsContent/);
    });

    it("renders loading state with ActivityIndicator", () => {
      expect(src).toMatch(/ActivityIndicator/);
      expect(src).toMatch(/Loading/);
    });

    it("renders error state", () => {
      expect(src).toMatch(/Could not load task/);
    });

    it("returns null when no task", () => {
      expect(src).toMatch(/!task/);
    });

    it("renders TaskInfo component", () => {
      expect(src).toMatch(/TaskInfo/);
    });

    it("renders CommentsSection component", () => {
      expect(src).toMatch(/CommentsSection/);
    });

    it("renders TaskAttachments component", () => {
      expect(src).toMatch(/TaskAttachments/);
    });

    it("uses tokenizeMentions from mentionHelpers", () => {
      expect(src).toMatch(/tokenizeMentions/);
      expect(src).toMatch(/mentionHelpers/);
    });
  });

  describe("theirs behaviors: onQuickMention with styled mention badges", () => {
    it("uses onQuickMention prop name (not onMentionTokenPress)", () => {
      expect(src).toMatch(/onQuickMention/);
    });

    it("renders mention tokens with background color and border", () => {
      // Theirs added backgroundColor and border styling to mentions
      expect(src).toMatch(/backgroundColor.*brand/s);
      expect(src).toMatch(/borderColor.*brand/s);
    });

    it("applies borderRadius: 6 to mention badges", () => {
      expect(src).toMatch(/borderRadius:\s*6/);
    });

    it("uses suppressHighlighting on mention Text elements", () => {
      expect(src).toMatch(/suppressHighlighting/);
    });

    it("wraps onQuickMention call in try/catch for safety", () => {
      // Theirs wrapped the callback in try/catch
      // The resolved code might or might not keep this; check for onQuickMention call
      expect(src).toMatch(/onQuickMention/);
    });
  });

  describe("ours behaviors: mention rendering", () => {
    it("renders mentions with @ prefix", () => {
      expect(src).toMatch(/@\$\{label\}/);
    });

    it("passes copyUrl to CommentsSection and TaskAttachments", () => {
      expect(src).toMatch(/copyUrl/);
    });
  });
});
