import Stripe from 'stripe';
export const stripe = () => new Stripe(process.env.STRIPE_SECRET_KEY);

// PRICING-SPEC-v1 (Audible-style). Price IDs live in Vercel env vars; the numbers on the page live in app/page.js — change both.
//   start     $29 one-time     → 5 chapter credits
//   monthly   $9.99/mo         → 1 chapter credit every month
//   salon     $59/mo           → kiosk app + generator + directory listing + 2 credits/mo
//   multi     $149/mo          → Salon for up to 3 locations + 6 credits/mo (2 per location)
//   library   $699 one-time    → every chapter in the library, forever
//   drops     $9.99/mo         → new chapters as they drop (files only; for Whole Library owners)
//   chapter1  $14.99 one-time  → 1 credit
//   chapter3  $35 one-time     → 3 credits
// Credits bank for 12 months, then expire. Credits that came with a subscription are voided when it is canceled.
// A claimed chapter is kept forever.
export const CREDIT_MONTHS = 12;

export const PRODUCTS = {
  start:    { price: () => process.env.STRIPE_PRICE_START,    mode: 'payment',      credits: 5, label: 'Start pack',        amount: '$29',       app: false, seats: 0 },
  monthly:  { price: () => process.env.STRIPE_PRICE_MONTHLY,  mode: 'subscription', credits: 1, label: 'Monthly chapter',   amount: '$9.99/mo',  app: false, seats: 0 },
  salon:    { price: () => process.env.STRIPE_PRICE_SALON,    mode: 'subscription', credits: 2, label: 'Salon',             amount: '$59/mo',    app: true,  seats: 1 },
  multi:    { price: () => process.env.STRIPE_PRICE_MULTI,    mode: 'subscription', credits: 6, label: 'Multi-location',    amount: '$149/mo',   app: true,  seats: 3 },
  library:  { price: () => process.env.STRIPE_PRICE_LIBRARY,  mode: 'payment',      credits: 0, label: 'Whole Library',     amount: '$699',      app: false, seats: 0, all: true },
  drops:    { price: () => process.env.STRIPE_PRICE_DROPS,    mode: 'subscription', credits: 0, label: 'New-chapter drops', amount: '$9.99/mo',  app: false, seats: 0, drops: true },
  chapter1: { price: () => process.env.STRIPE_PRICE_CHAPTER1, mode: 'payment',      credits: 1, label: '1 extra chapter',   amount: '$14.99',    app: false, seats: 0 },
  chapter3: { price: () => process.env.STRIPE_PRICE_CHAPTER3, mode: 'payment',      credits: 3, label: '3 extra chapters',  amount: '$35',       app: false, seats: 0 },
};

// Legacy plan names still stored on old salon rows. Kept so those rows keep working; nothing new is sold under them.
export const PLANS = {
  ...PRODUCTS,
  house:        { price: () => null, mode: 'subscription', credits: 0, label: 'House', amount: '', app: true, seats: 1, all: true },
  salon_annual: { price: () => process.env.STRIPE_PRICE_SALON_ANNUAL, mode: 'subscription', credits: 2, label: 'Salon — annual', amount: '$499/yr', app: true, seats: 1 },
  library_mo:   { price: () => null, mode: 'subscription', credits: 0, label: 'Library (legacy)', amount: '$29/mo', app: false, seats: 0, all: true },
  annual:       { price: () => process.env.STRIPE_PRICE_SALON_ANNUAL, mode: 'subscription', credits: 2, label: 'Salon — annual', amount: '$499/yr', app: true, seats: 1 },
};

export const planHasApp = plan => !!PLANS[plan]?.app;
// Which product key does a Stripe price id belong to? Used by the webhook.
export function productOfPrice(priceId) {
  if (!priceId) return null;
  for (const [k, p] of Object.entries(PLANS)) { if (p.price() && p.price() === priceId) return k; }
  return null;
}
