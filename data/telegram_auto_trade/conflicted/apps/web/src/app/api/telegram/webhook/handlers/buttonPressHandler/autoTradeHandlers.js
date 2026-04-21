import { sendMessage } from "../../telegramApi.js";
import { showAutoTradeMenu } from "../../menus.js";
import sql from "@/app/api/utils/sql.js";
import { ensureAccessOrPrompt } from "./accessControl.js";

<<<<<<< ours
// ✅ AutoTrade is removed from the Telegram bot UI.
// Keep this handler in a safe "disabled" state in case it is referenced by legacy code.
const AUTOTRADE_BOT_DISABLED = true;
=======
// ⛔ AutoTrade is fully removed from the Telegram bot UI
const AUTOTRADE_BOT_DISABLED = true;
>>>>>>> theirs

export async function handleAutoTradeToggle(chatId, telegramId, text) {
  try {
    const raw = String(text || "").trim();
    const collapsed = raw.replace(/\s+/g, "");

    const wantsEnable =
      raw === "✅ تفعيل التداول الآلي" ||
      raw === "تفعيل التداول الآلي" ||
      collapsed === "تفعيلالتداولالآلي";

    const wantsDisable =
      raw === "⛔️ إيقاف التداول الآلي" ||
      raw === "ايقاف التداول الآلي" ||
      raw === "إيقاف التداول الآلي" ||
      collapsed === "ايقافالتداولالآلي" ||
      collapsed === "إيقافالتداولالآلي";

    if (!wantsEnable && !wantsDisable) {
      return false;
    }

    if (AUTOTRADE_BOT_DISABLED) {
<<<<<<< ours
      await sendMessage(
        chatId,
        "⛔ تم حذف زر التداول الآلي من البوت.\n\n✅ لتحديث الأزرار عندك: ارسل /start.",
      );
=======
      await sendMessage(
        chatId,
        "⛔ تم حذف زر (التداول الآلي) من البوت.\n\nاكتب /start لتحديث القائمة.",
      );
>>>>>>> theirs
      return true;
    }

    const ok = await ensureAccessOrPrompt(
      chatId,
      telegramId,
      "reply_autotrade",
    );
    if (!ok) return true;

    const [u] = await sql(
      "SELECT id FROM users WHERE telegram_id = $1 LIMIT 1",
      [telegramId],
    );
    const userId = u?.id;
    if (!userId) {
      await sendMessage(
        chatId,
        "❌ لم أجد حسابك. أرسل /start ثم أعد المحاولة.",
      );
      return true;
    }

    const [acct] = await sql(
      "SELECT id, status FROM mt_accounts WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1",
      [userId],
    );
    if (!acct?.id) {
      await sendMessage(
        chatId,
        "❌ لم يتم ربط حساب الميتاتريدر بعد. افتح (🤖 التداول الآلي) ثم اضغط (ربط/تغيير حساب الميتاتريدر).",
      );
      return true;
    }

    if (wantsEnable) {
      // ✅ If weekly settlement is pending, keep autotrade disabled and explain why
      const pending = await sql(
        `SELECT id
           FROM mt_daily_fees
          WHERE account_id = $1
            AND status = 'pending'
            AND COALESCE(period, 'daily') = 'weekly'
          LIMIT 1`,
        [acct.id],
      );

      if (pending && pending[0]) {
        await sql(
          `UPDATE mt_accounts
              SET status = 'suspended_fee',
                  is_enabled = FALSE,
                  updated_at = CURRENT_TIMESTAMP
            WHERE id = $1`,
          [acct.id],
        );

        await sendMessage(
          chatId,
          "🚫 لا يمكن تفعيل التداول الآلي الآن لأن هناك تسوية أسبوع (Pending).\n\n📤 ارفع إثبات تحويل أرباح الأسبوع من زر (رفع الإثبات)، وبعدها الإدارة تفعل الحساب.",
        );

        await showAutoTradeMenu(chatId, telegramId, null);
        return true;
      }

      await sql(
        `UPDATE mt_accounts
            SET is_enabled = TRUE,
                status = CASE WHEN status IN ('disabled','pending_setup') THEN 'active' ELSE status END,
                updated_at = CURRENT_TIMESTAMP
          WHERE id = $1`,
        [acct.id],
      );
      await sendMessage(chatId, "✅ تم تفعيل التداول الآلي.");
    } else {
      await sql(
        `UPDATE mt_accounts
            SET is_enabled = FALSE,
                status = 'disabled',
                updated_at = CURRENT_TIMESTAMP
          WHERE id = $1`,
        [acct.id],
      );
      await sendMessage(chatId, "⛔️ تم إيقاف التداول الآلي.");
    }

    await showAutoTradeMenu(chatId, telegramId, null);
    return true;
  } catch (e) {
    console.warn(
      "[handleAutoTradeToggle] autotrade enable/disable text failed:",
      e?.message,
    );
    return false;
  }
}

export async function handleAutoTradeEntry(chatId, telegramId, text) {
  try {
    const raw = String(text || "").trim();
    const collapsed = raw.replace(/\s+/g, "");
    const looksLikeAutoTrade =
      raw === "🤖 التداول الآلي" ||
      collapsed === "🤖التداولالآلي" ||
      raw === "التداول الآلي" ||
      collapsed === "التداولالآلي";

    if (!looksLikeAutoTrade) {
      return false;
    }

    if (AUTOTRADE_BOT_DISABLED) {
<<<<<<< ours
      await sendMessage(
        chatId,
        "⛔ تم حذف زر التداول الآلي من البوت.\n\n✅ لتحديث الأزرار عندك: ارسل /start.",
      );
=======
      await sendMessage(
        chatId,
        "⛔ تم حذف زر (التداول الآلي) من البوت.\n\nاكتب /start لتحديث القائمة.",
      );
>>>>>>> theirs
      return true;
    }

    const ok = await ensureAccessOrPrompt(
      chatId,
      telegramId,
      "reply_autotrade",
    );
    if (!ok) return true;

    await showAutoTradeMenu(chatId, telegramId, null);
    return true;
  } catch (e) {
    console.warn("[handleAutoTradeEntry] autotrade match failed:", e?.message);
    return false;
  }
}
