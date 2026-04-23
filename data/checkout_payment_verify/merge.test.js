import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function readResolved(filePath) {
  return fs.readFileSync(path.join(__dirname, 'resolved', filePath), 'utf-8');
}

describe('checkout_payment_verify', () => {
  // ─── base behaviors ───

  describe('base behaviors', () => {
    it('checkout page has form with required shipping fields', () => {
      const src = readResolved('apps/web/src/app/checkout/page.jsx');
      expect(src).toContain('customerName');
      expect(src).toContain('customerEmail');
      expect(src).toContain('shippingAddress');
      expect(src).toContain('shippingCity');
      expect(src).toContain('shippingState');
      expect(src).toContain('shippingZip');
    });

    it('checkout page has discount code system with GG and TREATS20', () => {
      const src = readResolved('apps/web/src/app/checkout/page.jsx');
      expect(src).toContain('"GG"');
      expect(src).toContain('"TREATS20"');
      expect(src).toContain('discountApplied');
    });

    it('checkout page calculates subtotal, shipping, discount, and total', () => {
      const src = readResolved('apps/web/src/app/checkout/page.jsx');
      expect(src).toContain('subtotal');
      expect(src).toContain('shippingCost');
      expect(src).toContain('discount');
      expect(src).toContain('total');
    });

    it('checkout page has free shipping threshold at $60', () => {
      const src = readResolved('apps/web/src/app/checkout/page.jsx');
      expect(src).toMatch(/shippingThreshold\s*=\s*60/);
    });

    it('checkout page posts to /api/create-checkout-session', () => {
      const src = readResolved('apps/web/src/app/checkout/page.jsx');
      expect(src).toContain('/api/create-checkout-session');
    });

    it('checkout page stores order in sessionStorage', () => {
      const src = readResolved('apps/web/src/app/checkout/page.jsx');
      expect(src).toContain('sessionStorage.setItem');
      expect(src).toContain('pendingOrder');
    });

    it('create-checkout-session uses Stripe REST API with fetch', () => {
      const src = readResolved('apps/web/src/app/api/create-checkout-session/route.js');
      expect(src).toContain('api.stripe.com');
      expect(src).toContain('STRIPE_SECRET_KEY');
      expect(src).toContain('checkout/sessions');
    });

    it('create-checkout-session validates STRIPE_SECRET_KEY', () => {
      const src = readResolved('apps/web/src/app/api/create-checkout-session/route.js');
      expect(src).toContain('STRIPE_SECRET_KEY');
      expect(src).toContain('Payment system not configured');
    });

    it('create-checkout-session validates items and customer email', () => {
      const src = readResolved('apps/web/src/app/api/create-checkout-session/route.js');
      expect(src).toContain('No items in cart');
      expect(src).toContain('Customer email is required');
    });

    it('create-checkout-session has buildDiscountedUnitAmounts function', () => {
      const src = readResolved('apps/web/src/app/api/create-checkout-session/route.js');
      expect(src).toContain('buildDiscountedUnitAmounts');
      expect(src).toContain('unit_amount_cents');
      expect(src).toContain('remainder_cents');
    });

    it('create-checkout-session adds shipping as line item', () => {
      const src = readResolved('apps/web/src/app/api/create-checkout-session/route.js');
      expect(src).toContain('Shipping');
      expect(src).toContain('shipping_cost');
    });

    it('verify-payment route checks payment_status is paid', () => {
      const src = readResolved('apps/web/src/app/api/verify-payment/route.js');
      expect(src).toContain('payment_status');
      expect(src).toMatch(/!==\s*"paid"/);
    });

    it('verify-payment route checks for existing orders by sessionId', () => {
      const src = readResolved('apps/web/src/app/api/verify-payment/route.js');
      expect(src).toContain('existingOrders');
      expect(src).toContain('alreadyCreated');
    });

    it('verify-payment route creates order with GG- prefix order number', () => {
      const src = readResolved('apps/web/src/app/api/verify-payment/route.js');
      expect(src).toMatch(/GG-/);
      expect(src).toContain('INSERT INTO orders');
    });

    it('verify-payment route sends confirmation email', () => {
      const src = readResolved('apps/web/src/app/api/verify-payment/route.js');
      expect(src).toContain('orderConfirmationEmail');
      expect(src).toContain('sendEmail');
    });

    it('verify-payment route detects first-time orders and sends thank you email', () => {
      const src = readResolved('apps/web/src/app/api/verify-payment/route.js');
      expect(src).toContain('isFirstOrder');
      expect(src).toContain('firstOrderThankYouEmail');
    });

    it('verify-payment route sends owner notification email', () => {
      const src = readResolved('apps/web/src/app/api/verify-payment/route.js');
      expect(src).toContain('ownerNotificationEmail');
    });
  });

  // ─── theirs behaviors ───

  describe('theirs behaviors', () => {
    it('checkout page opens Stripe URL in popup (theirs)', () => {
      const src = readResolved('apps/web/src/app/checkout/page.jsx');
      // theirs: open in popup for iframe context
      expect(src).toContain('window.open');
      expect(src).toContain('_blank');
      expect(src).toContain('popup');
    });

    it('stripeGet in verify-payment stores status on error object (theirs)', () => {
      const src = readResolved('apps/web/src/app/api/verify-payment/route.js');
      expect(src).toContain('err.status');
      expect(src).toContain('err.stripePayload');
    });

    it('verify-payment returns 500 with detail message for missing Stripe config (theirs)', () => {
      const src = readResolved('apps/web/src/app/api/verify-payment/route.js');
      expect(src).toContain('Stripe not configured');
    });

    it('verify-payment route sends owner notification to hello@gunnersgoodies.com (ours)', () => {
      const src = readResolved('apps/web/src/app/api/verify-payment/route.js');
      // ours used hello@; theirs used owner@
      expect(src).toContain('hello@gunnersgoodies.com');
    });

    it('verify-payment uses resolvedOrderData for order fields (ours)', () => {
      const src = readResolved('apps/web/src/app/api/verify-payment/route.js');
      expect(src).toContain('resolvedOrderData');
      expect(src).toContain('resolvedOrderData.customer_email');
      expect(src).toContain('resolvedOrderData.customer_name');
    });
  });

  // ─── ours behaviors ───

  describe('ours behaviors', () => {
    it('create-checkout-session uses APP_URL fallback for baseURL (ours)', () => {
      const src = readResolved('apps/web/src/app/api/create-checkout-session/route.js');
      expect(src).toContain('process.env.APP_URL');
    });

    it('create-checkout-session has encodeForm helper (ours)', () => {
      const src = readResolved('apps/web/src/app/api/create-checkout-session/route.js');
      expect(src).toContain('encodeForm');
      expect(src).toContain('URLSearchParams');
    });

    it('create-checkout-session applies discount via buildDiscountedUnitAmounts (ours)', () => {
      const src = readResolved('apps/web/src/app/api/create-checkout-session/route.js');
      // ours had the full discount calculation function
      expect(src).toContain('buildDiscountedUnitAmounts');
      expect(src).toContain('discounted');
    });

    it('create-checkout-session stores compact metadata in Stripe session (ours)', () => {
      const src = readResolved('apps/web/src/app/api/create-checkout-session/route.js');
      expect(src).toContain('compactMeta');
      expect(src).toContain('metadata[order_data]');
    });

    it('verify-payment prefers orderData from browser sessionStorage (ours)', () => {
      const src = readResolved('apps/web/src/app/api/verify-payment/route.js');
      // ours preferred orderData from the client
      expect(src).toContain('resolvedOrderData');
    });

    it('verify-payment returns error when order details missing (ours)', () => {
      const src = readResolved('apps/web/src/app/api/verify-payment/route.js');
      expect(src).toContain('Missing order details');
    });
  });
});
