/**
 * Paddle Billing (v2) client wrapper.
 *
 * Uses Paddle's customer-side JS to open a checkout overlay for subscription
 * sign-up. The Paddle account is in sandbox mode for now — switch
 * NEXT_PUBLIC_PADDLE_ENV to 'production' once products are approved.
 *
 * Env vars expected at build time (set in Cloud Run / Vercel):
 *   NEXT_PUBLIC_PADDLE_ENV              'sandbox' | 'production'
 *   NEXT_PUBLIC_PADDLE_CLIENT_TOKEN     client-side token from Paddle dashboard
 *   NEXT_PUBLIC_PADDLE_PRICE_STARTER    price ID for Starter plan
 *   NEXT_PUBLIC_PADDLE_PRICE_PRO        price ID for Pro plan
 *   NEXT_PUBLIC_PADDLE_PRICE_BUSINESS   price ID for Business plan
 */

import { initializePaddle, type Paddle } from '@paddle/paddle-js';

export type PaddlePriceKey = 'starter' | 'pro' | 'business';

const PRICE_IDS: Record<PaddlePriceKey, string | undefined> = {
  starter: process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER,
  pro: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO,
  business: process.env.NEXT_PUBLIC_PADDLE_PRICE_BUSINESS,
};

let instancePromise: Promise<Paddle | undefined> | null = null;

function getPaddle(): Promise<Paddle | undefined> {
  if (instancePromise) return instancePromise;
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  if (!token) {
    instancePromise = Promise.resolve(undefined);
    return instancePromise;
  }
  const env = process.env.NEXT_PUBLIC_PADDLE_ENV === 'production' ? 'production' : 'sandbox';
  instancePromise = initializePaddle({ environment: env, token });
  return instancePromise;
}

export function isPaddleConfigured(key?: PaddlePriceKey): boolean {
  if (!process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN) return false;
  if (key && !PRICE_IDS[key]) return false;
  return true;
}

export async function openPaddleCheckout(plan: PaddlePriceKey, opts?: { email?: string }) {
  const priceId = PRICE_IDS[plan];
  if (!priceId) {
    throw new Error(`Paddle price ID not configured for plan "${plan}"`);
  }
  const paddle = await getPaddle();
  if (!paddle) {
    throw new Error('Paddle client token not configured');
  }
  paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    customer: opts?.email ? { email: opts.email } : undefined,
    settings: {
      displayMode: 'overlay',
      theme: 'light',
      successUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard?welcome=1`,
    },
  });
}
