import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function read(relPath) {
  return readFileSync(join(__dirname, 'resolved', relPath), 'utf-8');
}

describe('account_statements', () => {
  describe('base behaviors (account/[id].jsx)', () => {
    it('exports AccountDetailsScreen as default', () => {
      const src = read('apps/mobile/src/app/account/[id].jsx');
      expect(src).toMatch(/export\s+default\s+function\s+AccountDetailsScreen/);
    });

    it('fetches accounts from /api/accounts', () => {
      const src = read('apps/mobile/src/app/account/[id].jsx');
      expect(src).toMatch(/\/api\/accounts/);
    });

    it('fetches account details by id from /api/accounts/:id', () => {
      const src = read('apps/mobile/src/app/account/[id].jsx');
      expect(src).toMatch(/\/api\/accounts\/\$/);
    });

    it('fetches transactions from /api/transactions with accountId', () => {
      const src = read('apps/mobile/src/app/account/[id].jsx');
      expect(src).toMatch(/\/api\/transactions\?accountId/);
    });

    it('has a transfer form via useTransferForm hook', () => {
      const src = read('apps/mobile/src/app/account/[id].jsx');
      expect(src).toMatch(/useTransferForm/);
      expect(src).toMatch(/transferMode/);
      expect(src).toMatch(/onSubmitTransfer/);
    });

    it('has segmented control with activity, transfer, statements segments', () => {
      const src = read('apps/mobile/src/app/account/[id].jsx');
      expect(src).toMatch(/SegmentedControl/);
      expect(src).toMatch(/activity/);
      expect(src).toMatch(/transfer/);
      expect(src).toMatch(/statements/);
    });

    it('displays balance in the header card', () => {
      const src = read('apps/mobile/src/app/account/[id].jsx');
      expect(src).toMatch(/Available balance/);
      expect(src).toMatch(/balanceLabel/);
    });

    it('uses formatMoney for currency display', () => {
      const src = read('apps/mobile/src/app/account/[id].jsx');
      expect(src).toMatch(/formatMoney/);
    });

    it('shows error state with retry button', () => {
      const src = read('apps/mobile/src/app/account/[id].jsx');
      expect(src).toMatch(/Something went wrong/);
      expect(src).toMatch(/Retry/);
    });

    it('has statement period picker (SelectModal)', () => {
      const src = read('apps/mobile/src/app/account/[id].jsx');
      expect(src).toMatch(/SelectModal/);
      expect(src).toMatch(/Select statement period/);
    });

    it('has printable URL for statement PDF', () => {
      const src = read('apps/mobile/src/app/account/[id].jsx');
      expect(src).toMatch(/printableUrl/);
      expect(src).toMatch(/EXPO_PUBLIC_BASE_URL/);
    });

    it('has WebModal for viewing statements', () => {
      const src = read('apps/mobile/src/app/account/[id].jsx');
      expect(src).toMatch(/WebModal/);
    });

    it('shows deposits and withdrawals totals in statements', () => {
      const src = read('apps/mobile/src/app/account/[id].jsx');
      expect(src).toMatch(/Deposits/);
      expect(src).toMatch(/Withdrawals/);
    });

    it('renders TransactionHistorySection for activity tab', () => {
      const src = read('apps/mobile/src/app/account/[id].jsx');
      expect(src).toMatch(/TransactionHistorySection/);
    });

    it('renders TransferSection for transfer tab', () => {
      const src = read('apps/mobile/src/app/account/[id].jsx');
      expect(src).toMatch(/TransferSection/);
    });

    it('has account switcher via SelectModal', () => {
      const src = read('apps/mobile/src/app/account/[id].jsx');
      expect(src).toMatch(/Switch account/);
    });
  });

  describe('theirs behaviors (account header with conditional account picker)', () => {
    it('AccountHeader accepts onOpenAccountPicker prop', () => {
      const src = read('apps/mobile/src/app/account/[id].jsx');
      expect(src).toMatch(/onOpenAccountPicker/);
    });

    it('AccountHeader conditionally renders account picker button', () => {
      const src = read('apps/mobile/src/app/account/[id].jsx');
      // Should check if onOpenAccountPicker exists before rendering
      expect(src).toMatch(/onOpenAccountPicker\s*\?/);
    });

    it('AccountHeader uses rounded border with borderColor for back button', () => {
      const src = read('apps/mobile/src/app/account/[id].jsx');
      // Theirs approach uses borderWidth + borderColor
      expect(src).toMatch(/borderColor.*rgba\(255,255,255/);
    });
  });

  describe('base behaviors (statements/[accountId].jsx)', () => {
    it('exports StatementsScreen as default', () => {
      const src = read('apps/mobile/src/app/statements/[accountId].jsx');
      expect(src).toMatch(/export\s+default\s+function\s+StatementsScreen/);
    });

    it('reads accountId from route params', () => {
      const src = read('apps/mobile/src/app/statements/[accountId].jsx');
      expect(src).toMatch(/params\?\.accountId/);
    });

    it('supports initial period from route params', () => {
      const src = read('apps/mobile/src/app/statements/[accountId].jsx');
      expect(src).toMatch(/initialPeriod/);
    });

    it('fetches transactions for the selected period range', () => {
      const src = read('apps/mobile/src/app/statements/[accountId].jsx');
      expect(src).toMatch(/from.*to.*limit.*5000/);
    });

    it('shows Summary section with deposits and withdrawals', () => {
      const src = read('apps/mobile/src/app/statements/[accountId].jsx');
      expect(src).toMatch(/Summary/);
      expect(src).toMatch(/Deposits/);
      expect(src).toMatch(/Withdrawals/);
    });

    it('shows transaction count in summary', () => {
      const src = read('apps/mobile/src/app/statements/[accountId].jsx');
      expect(src).toMatch(/transactions\.length/);
    });

    it('shows Activity section with transaction list', () => {
      const src = read('apps/mobile/src/app/statements/[accountId].jsx');
      expect(src).toMatch(/Activity/);
      expect(src).toMatch(/No activity in this period/);
    });

    it('formats dates as en-US with month/day/year', () => {
      const src = read('apps/mobile/src/app/statements/[accountId].jsx');
      expect(src).toMatch(/en-US/);
      expect(src).toMatch(/month.*short/);
    });

    it('has View/Save and Browser buttons for statement', () => {
      const src = read('apps/mobile/src/app/statements/[accountId].jsx');
      expect(src).toMatch(/View \/ Save/);
      expect(src).toMatch(/Browser/);
    });

    it('opens browser via Linking.openURL', () => {
      const src = read('apps/mobile/src/app/statements/[accountId].jsx');
      expect(src).toMatch(/Linking\.openURL/);
    });

    it('shows error when EXPO_PUBLIC_BASE_URL is missing', () => {
      const src = read('apps/mobile/src/app/statements/[accountId].jsx');
      expect(src).toMatch(/Missing EXPO_PUBLIC_BASE_URL/);
    });
  });

  describe('theirs behaviors (StatementsHeader with onOpenPeriod)', () => {
    it('StatementsHeader accepts onOpenPeriod prop', () => {
      const src = read('apps/mobile/src/app/statements/[accountId].jsx');
      expect(src).toMatch(/onOpenPeriod/);
    });

    it('StatementsHeader: back button has border styling', () => {
      const src = read('apps/mobile/src/app/statements/[accountId].jsx');
      expect(src).toMatch(/borderColor.*rgba\(255,255,255/);
    });

    it('StatementsHeader renders Period button in header', () => {
      const src = read('apps/mobile/src/app/statements/[accountId].jsx');
      // The Period button should be in the header via onOpenPeriod
      const headerSection = src.slice(
        src.indexOf('function StatementsHeader'),
        src.indexOf('function getLast4')
      );
      expect(headerSection).toMatch(/Period/);
    });
  });

  describe('merged behaviors (period range computation)', () => {
    it('getPeriodRange handles December to January rollover', () => {
      const src = read('apps/mobile/src/app/statements/[accountId].jsx');
      // Should handle month 13 -> January next year
      expect(src).toMatch(/nextMonth === 13/);
      expect(src).toMatch(/nextYear \+= 1/);
    });

    it('parsePeriod validates month is between 1 and 12', () => {
      const src = read('apps/mobile/src/app/statements/[accountId].jsx');
      expect(src).toMatch(/month < 1.*month > 12/);
    });
  });
});
