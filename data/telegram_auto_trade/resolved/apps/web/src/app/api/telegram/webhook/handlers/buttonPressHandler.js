import { sendMessage } from "../telegramApi.js";
import * as AccessControl from "./buttonPressHandler/accessControl.js";
import { handlePaymentMethodsEntry } from "./buttonPressHandler/publicHandlers.js";
import { handleFavoritesEntry } from "./buttonPressHandler/favoritesHandlers.js";
import { handleForexEntry } from "./buttonPressHandler/forexHandlers.js";
import { handleAnalyzeEntry } from "./buttonPressHandler/analyzeHandlers.js";
import { handlePiggyEntry } from "./buttonPressHandler/piggyHandlers.js";
import {
  handleManualCandlesEntry,
  handleAdminUnlockEntry,
  handleAdminButtonsEntry,
  handleAdminDashboardEntry,
  handleAdminStatsEntry,
  handleAdminSubscribersEntry,
  handleAdminAnalyzeLimitEntry,
  handleAdminClearSignalsEntry,
  handleAdminUsersManagementEntry,
  handleAdminAddInvestmentEntry,
  // ✅ NEW: reference values
  handleAdminReferenceValuesEntry,
} from "./buttonPressHandler/adminHandlers.js";
import {
  handleBrokerRegisterEntry,
  handleFullDisconnectEntry,
} from "./buttonPressHandler/publicHandlers.js";
import {
  handleSubscriptionEntry,
  handleRecommendationsEntry,
  handleSignalsEntry,
  handleAccountInfoEntry,
  handleHelpEntry,
  handleAcademyEntry,
} from "./buttonPressHandler/userHandlers.js";
import { startBroadcastFlow } from "../callbacks/adminBroadcast.js";

// ⛔ AutoTrade is removed from the Telegram bot UI.
// We keep backend routes intact, but we don't allow entry from Telegram buttons/text anymore.

export async function handleButtonPress(chatId, telegramId, text, firstName) {
  const rawText = String(text || "");
  const normalizedText = rawText.trim();
  console.log(`🔘 Button pressed: ${normalizedText}`);

  // 🧹 Legacy/old keyboards: some users may still see removed buttons until they hit /start.
  // If they press an old AutoTrade-related button, guide them to refresh (and refresh for them if possible).
  const legacyAutotradeTexts = new Set([
    "🤖 التداول الآلي",
    "تحكم التداول الالي",
    "تحكم التداول الآلي",
    "🔋 شحن رصيد",
    "شحن رصيد",
    "🔋 شحن الرصيد",
    "شحن الرصيد",
  ]);
  if (legacyAutotradeTexts.has(normalizedText)) {
    await sendMessage(
      chatId,
      "⛔ تم حذف زر التداول الآلي من البوت.\n\n✅ لتحديث الأزرار عندك: ارسل /start.",
      {
        no_protect: true,
        no_watermark: true,
        no_protection_tail: true,
        allow_text_image_auto: false,
        force_text_message: true,
      },
    );

    // Best-effort: refresh their reply keyboard automatically
    try {
      const { handleStartCommand } = await import("../commands/startCommand.js");
      await handleStartCommand(chatId, telegramId, firstName);
    } catch (_) {}

    return;
  }

  // ✅ Admin menus are meant to run in PRIVATE chat with the bot.
  // In groups (esp. discussion groups), outbound messages/edits may be blocked by design.
  // So we gently redirect the admin to the bot private chat.
  const adminOnlyButtons = new Set([
    "🧩 إدارة الأزرار",
    "فتح لوحة التحكم",
    "📊 إحصائيات",
    "👥 المشتركون",
    "⚙️ سقف التحليل",
    "🧹 مسح الإشارات",
    "👥 إدارة المستخدمين",
    "➕ إضافة مشترك",
    "🕯️ إدخال الشموع",
    "القيم المرجعية",
    "📌 القيم المرجعية",
  ]);

  const isAdminButton = adminOnlyButtons.has(normalizedText);
  const isNotPrivate = Number(chatId) !== Number(telegramId);
  if (isAdminButton && isNotPrivate) {
    // Try to notify in the group (may be blocked), and always notify in private.
    try {
      await sendMessage(
        chatId,
        "⚠️ لوحة الأدمن تعمل فقط داخل الخاص مع البوت.\n\nافتح الخاص مع البوت ثم اكتب /admin.",
        {
          no_protect: true,
          no_watermark: true,
          no_protection_tail: true,
          allow_text_image_auto: false,
          force_text_message: true,
        },
      );
    } catch (_) {}

    try {
      await sendMessage(
        telegramId,
        "⚠️ لوحة الأدمن تعمل فقط داخل الخاص مع البوت.\n\nاكتب /admin لفتح لوحة الأدمن.",
        {
          no_protect: true,
          no_watermark: true,
          no_protection_tail: true,
          allow_text_image_auto: false,
          force_text_message: true,
        },
      );
    } catch (_) {}

    return;
  }

  // ✅ Subscription expiry guard: if the user's last subscription expired,
  // pause services + deactivate expired subscriptions + tell them "subscription ended".
  // We still allow opening (📊 اشتراكي) so they can renew.
  const allowWhenExpired = normalizedText === "📊 اشتراكي";
  try {
    const expired = await AccessControl.checkAndHandleExpiredSubscription(
      chatId,
      telegramId,
    );
    if (expired?.expired && !allowWhenExpired) {
      return;
    }
  } catch (_) {}

  // Try Favorites entry
  if (await handleFavoritesEntry(chatId, telegramId, normalizedText)) return;

  // Try Forex entry
  if (await handleForexEntry(chatId, telegramId, normalizedText)) return;

  // Try Analyze entry
  if (await handleAnalyzeEntry(chatId, telegramId, normalizedText)) return;

  // Try Piggy entry
  if (await handlePiggyEntry(chatId, telegramId, normalizedText)) return;

  // Full disconnect button
  if (normalizedText === "🔌 الفصل الكامل") {
    await handleFullDisconnectEntry(chatId);
    return;
  }

  // ✅ normalize common admin-unlock strings (so typing works even with extra spaces / missing emoji)
  const unlockText = normalizedText.replace(/^👑\s*/, "").replace(/\s+/g, " ");
  const isUnlockIntent =
    unlockText === "تفعيل الأدمن" ||
    unlockText === "تفعيل الادمن" ||
    unlockText === "تفعيل الادمن" ||
    unlockText === "تفعيل الأدمن";

  if (isUnlockIntent) {
    await handleAdminUnlockEntry(chatId, telegramId);
    return;
  }

  // Switch statement for exact matches
  switch (normalizedText) {
    // ✅ NEW: Admin Reference Values (Pivot)
    case "القيم المرجعية":
    case "📌 القيم المرجعية": {
      await handleAdminReferenceValuesEntry(chatId, telegramId);
      break;
    }

    case "🕯️ إدخال الشموع":
      await handleManualCandlesEntry(chatId, telegramId);
      break;

    case "📊 اشتراكي":
      await handleSubscriptionEntry(chatId, telegramId);
      break;

    case "💱 الفوركس":
      await handleForexEntry(chatId, telegramId, normalizedText);
      break;

    case "📨 التوصيات":
      await handleRecommendationsEntry(chatId, telegramId);
      break;

    case "حلل انت":
      await handleAnalyzeEntry(chatId, telegramId, normalizedText);
      break;

    case "📈 الإشارات":
      await handleSignalsEntry(chatId, telegramId);
      break;

    case "👤 حسابي":
      await handleAccountInfoEntry(chatId, telegramId, firstName);
      break;

    case "❓ المساعدة":
      await handleHelpEntry(chatId, telegramId);
      break;

    // ✅ Admin unlock (handled above by isUnlockIntent)

    case "حصّالتي":
      await handlePiggyEntry(chatId, telegramId, normalizedText);
      break;

    case "الاكاديمية":
      await handleAcademyEntry(chatId, telegramId);
      break;

    case "🧩 إدارة الأزرار":
      await handleAdminButtonsEntry(chatId, telegramId);
      break;

    case "فتح لوحة التحكم":
      await handleAdminDashboardEntry(chatId, telegramId);
      break;

    case "التسجيل في البروكر":
      await handleBrokerRegisterEntry(chatId);
      break;

    case "طرق التحويل":
      await handlePaymentMethodsEntry(chatId);
      break;

    case "📊 إحصائيات":
      await handleAdminStatsEntry(chatId, telegramId);
      break;

    case "👥 المشتركون":
      await handleAdminSubscribersEntry(chatId, telegramId);
      break;

    case "📨 إرسال توصية":
      await startBroadcastFlow(chatId, telegramId);
      break;

    case "📈 إرسال إشارة":
      await showSendSignal(chatId, telegramId);
      break;

    case "⚙️ سقف التحليل":
      await handleAdminAnalyzeLimitEntry(chatId, telegramId);
      break;

    case "🧹 مسح الإشارات":
      await handleAdminClearSignalsEntry(chatId, telegramId);
      break;

    case "👥 إدارة المستخدمين":
      await handleAdminUsersManagementEntry(chatId, telegramId);
      break;

    case "➕ إضافة مشترك":
      await handleAdminAddInvestmentEntry(chatId, telegramId);
      break;

    case "🔙 القائمة الرئيسية": {
      const { handleStartCommand } = await import("../commands/startCommand.js");
      await handleStartCommand(chatId, telegramId, firstName);
      break;
    }

    default:
      await sendMessage(chatId, "استخدم الأزرار بالأسفل للتصفح 👇");
  }
}

// Legacy admin helper (kept for backward compatibility)
async function showSendSignal(chatId, telegramId) {
  const userResponse = await fetch(
    `${process.env.APP_URL}/api/users/get?telegramId=${telegramId}`,
  );
  const userData = await userResponse.json();

  if (!userData.success || !userData.user.is_admin) {
    await sendMessage(chatId, "❌ غير مصرح لك بهذا الأمر");
    return;
  }

  await sendMessage(
    chatId,
    "📈 <b>إرسال إشارة</b>\n\nلإرسال إشارة جديدة، استخدم لوحة التحكم على الويب أو TradingView.",
  );
}
