import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readResolved(relPath) {
  return readFileSync(join(__dirname, 'resolved', relPath), 'utf-8');
}

describe('telegram_auto_trade merge', () => {
  describe('base behaviors', () => {
    it('buttonPressHandler exports handleButtonPress function', () => {
      const src = readResolved('apps/web/src/app/api/telegram/webhook/handlers/buttonPressHandler.js');
      expect(src).toMatch(/export\s+async\s+function\s+handleButtonPress\s*\(/);
    });

    it('buttonPressHandler handles admin-only buttons in private chat check', () => {
      const src = readResolved('apps/web/src/app/api/telegram/webhook/handlers/buttonPressHandler.js');
      // The base behavior of checking admin buttons and redirecting to private chat must be preserved
      expect(src).toMatch(/adminOnlyButtons/);
      expect(src).toMatch(/isNotPrivate/);
    });

    it('buttonPressHandler has subscription expiry guard', () => {
      const src = readResolved('apps/web/src/app/api/telegram/webhook/handlers/buttonPressHandler.js');
      expect(src).toMatch(/checkAndHandleExpiredSubscription/);
    });

    it('autoTradeHandlers exports handleAutoTradeToggle and handleAutoTradeEntry', () => {
      const src = readResolved('apps/web/src/app/api/telegram/webhook/handlers/buttonPressHandler/autoTradeHandlers.js');
      expect(src).toMatch(/export\s+async\s+function\s+handleAutoTradeToggle/);
      expect(src).toMatch(/export\s+async\s+function\s+handleAutoTradeEntry/);
    });

    it('autoTradeHandlers has AUTOTRADE_BOT_DISABLED flag set to true', () => {
      const src = readResolved('apps/web/src/app/api/telegram/webhook/handlers/buttonPressHandler/autoTradeHandlers.js');
      expect(src).toMatch(/AUTOTRADE_BOT_DISABLED\s*=\s*true/);
    });

    it('autoTradeHandlers sends disabled message when AUTOTRADE_BOT_DISABLED is true', () => {
      const src = readResolved('apps/web/src/app/api/telegram/webhook/handlers/buttonPressHandler/autoTradeHandlers.js');
      // When disabled, both toggle and entry should inform the user and return early
      const disabledBlocks = src.match(/if\s*\(\s*AUTOTRADE_BOT_DISABLED\s*\)/g);
      expect(disabledBlocks).not.toBeNull();
      expect(disabledBlocks.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('ours behaviors', () => {
    it('buttonPressHandler has legacy autotrade text set for removed buttons', () => {
      const src = readResolved('apps/web/src/app/api/telegram/webhook/handlers/buttonPressHandler.js');
      // Ours consolidated legacy autotrade buttons into a Set-based check
      expect(src).toMatch(/legacyAutotradeTexts/);
    });

    it('buttonPressHandler handles all legacy autotrade button texts', () => {
      const src = readResolved('apps/web/src/app/api/telegram/webhook/handlers/buttonPressHandler.js');
      // Must handle Arabic autotrade button text
      expect(src).toContain('🤖 التداول الآلي');
      expect(src).toContain('تحكم التداول الالي');
      expect(src).toContain('تحكم التداول الآلي');
      expect(src).toContain('🔋 شحن رصيد');
    });

    it('buttonPressHandler sends removal message for legacy autotrade buttons', () => {
      const src = readResolved('apps/web/src/app/api/telegram/webhook/handlers/buttonPressHandler.js');
      // Must send a message telling user the autotrade button was removed
      expect(src).toMatch(/تم حذف/);
    });

    it('buttonPressHandler refreshes keyboard after legacy autotrade button press', () => {
      const src = readResolved('apps/web/src/app/api/telegram/webhook/handlers/buttonPressHandler.js');
      // After telling user the button is removed, refresh their keyboard via startCommand
      expect(src).toMatch(/handleStartCommand/);
    });
  });

  describe('theirs behaviors', () => {
    it('buttonPressHandler handles new menu entries (candles, subscription, forex, etc)', () => {
      const src = readResolved('apps/web/src/app/api/telegram/webhook/handlers/buttonPressHandler.js');
      // Theirs added new switch cases for these buttons
      expect(src).toContain('🕯️ إدخال الشموع');
      expect(src).toContain('📊 اشتراكي');
      expect(src).toContain('💱 الفوركس');
      expect(src).toContain('📨 التوصيات');
      expect(src).toContain('حلل انت');
      expect(src).toContain('📈 الإشارات');
      expect(src).toContain('👤 حسابي');
      expect(src).toContain('❓ المساعدة');
    });

    it('autoTradeHandlers disabled message instructs user to type /start to update menu', () => {
      const src = readResolved('apps/web/src/app/api/telegram/webhook/handlers/buttonPressHandler/autoTradeHandlers.js');
      // Both ours and theirs agreed autotrade is disabled; the message should tell user to refresh
      // Theirs used "اكتب /start لتحديث القائمة", ours used "لتحديث الأزرار عندك: ارسل /start"
      // Either way, the message must reference /start
      expect(src).toMatch(/\/start/);
    });
  });
});
