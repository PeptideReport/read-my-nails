import { NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe';
import { currentUser, sb } from '../../../lib/supabase';
import { getAccount } from '../../../lib/access';

// POST { tenant? } (bearer) → Stripe customer portal URL (update card, cancel a membership). Falls back to the account's customer.
export async function POST(req) {
  const me = await currentUser(req); if (!me) return NextResponse.json({ error: 'login' }, { status: 401 });
  const { tenant } = await req.json().catch(() => ({}));
  const salon = tenant ? me.salons.find(s => s.tenant === tenant) : null;
  let customer = salon?.stripe_customer_id;
  if (!customer) { const acct = await getAccount(sb(), me.email); customer = acct?.stripe_customer_id || me.salons.find(s => s.stripe_customer_id)?.stripe_customer_id; }
  if (!customer) return NextResponse.json({ error: 'No billing account on this email yet.' }, { status: 400 });
  const site = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const portal = await stripe().billingPortal.sessions.create({ customer, return_url: site + '/dashboard' });
  return NextResponse.json({ url: portal.url });
}
