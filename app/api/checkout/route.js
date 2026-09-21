import { NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe';
import { tenantOf, activeSalon } from '../../../lib/supabase';

// Optional pay-ahead for a kiosk order. POST { code, price, answer } → Stripe Checkout URL.
// Money goes to the Read My Nails Stripe account — only use this for the house kiosk, or wire Stripe Connect before offering it to licensees.
export async function POST(req) {
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'stripe_not_configured' }, { status: 400 });
  const tenant = tenantOf(req); if (!tenant || !(await activeSalon(tenant))) return NextResponse.json({ error: 'tenant' }, { status: 400 });
  const { code, price, answer } = await req.json();
  const site = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const session = await stripe().checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price_data: { currency: 'usd', unit_amount: Math.round(price * 100), product_data: { name: 'Read My Nails — ' + answer, description: 'Order ' + code } }, quantity: 1 }],
    metadata: { code, tenant },
    success_url: site + '/k/' + tenant + '?paid=' + code, cancel_url: site + '/k/' + tenant + '?cancel=' + code,
  });
  return NextResponse.json({ url: session.url });
}
