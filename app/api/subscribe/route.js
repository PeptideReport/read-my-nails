import { NextResponse } from 'next/server';
import { stripe, PRODUCTS } from '../../../lib/stripe';
import { sb, currentUser } from '../../../lib/supabase';
import { getAccount, norm } from '../../../lib/access';

// POST { product, email, salon?, host?, ref? }  →  { url }  (Stripe Checkout)
// product: start | monthly | salon | multi | library | drops | chapter1 | chapter3   (lib/stripe.js)
// Anonymous from the pricing page, or bearer from the dashboard (then the account's Stripe customer is reused).
export async function POST(req) {
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'Payments are not switched on yet.' }, { status: 400 });
  const b = await req.json().catch(() => ({}));
  const key = PRODUCTS[b.product] ? b.product : (PRODUCTS[b.plan] ? b.plan : 'start');
  const p = PRODUCTS[key];
  const price = p.price();
  if (!price) return NextResponse.json({ error: 'Price not configured for ' + key }, { status: 400 });

  const me = await currentUser(req).catch(() => null);
  const email = norm(me?.email || b.email);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: 'Enter a real email — your login link goes there.' }, { status: 400 });
  const salon = String(b.salon || '').trim().slice(0, 60);
  const host = String(b.host || '').trim().slice(0, 40);
  if (p.app && !salon) return NextResponse.json({ error: 'What is your salon or kiosk called?' }, { status: 400 });
  let ref = String(b.ref || '').trim().toUpperCase().slice(0, 24);
  const db = sb();
  if (ref) { const { data } = await db.from('partners').select('code').eq('code', ref).maybeSingle(); if (!data) ref = ''; }

  const acct = await getAccount(db, email);
  if (p.drops && !acct?.library_all) return NextResponse.json({ error: 'New-chapter drops are for Whole Library owners. Get the Whole Library first.' }, { status: 400 });
  if (p.all && acct?.library_all) return NextResponse.json({ error: 'You already own the Whole Library.' }, { status: 400 });
  if (key === 'monthly' && acct?.monthly_status === 'active') return NextResponse.json({ error: 'You already have the monthly chapter membership.' }, { status: 400 });
  if (p.drops && acct?.drops_status === 'active') return NextResponse.json({ error: 'You already get new-chapter drops.' }, { status: 400 });

  const site = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const metadata = { product: key, salon, host, email, plan: key, ref };
  const session = await stripe().checkout.sessions.create({
    mode: p.mode,
    ...(acct?.stripe_customer_id ? { customer: acct.stripe_customer_id } : { customer_email: email }),
    line_items: [{ price, quantity: 1 }],
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    ...(p.mode === 'subscription' ? { subscription_data: { metadata } } : { payment_intent_data: { metadata }, ...(acct?.stripe_customer_id ? {} : { customer_creation: 'always' }) }),
    metadata,
    success_url: site + '/welcome?session_id={CHECKOUT_SESSION_ID}&product=' + key,
    cancel_url: site + (me ? '/dashboard' : '/#pricing'),
  });
  return NextResponse.json({ url: session.url });
}
