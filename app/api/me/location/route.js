import { NextResponse } from 'next/server';
import { sb, currentUser, randomPin, uniqueTenant } from '../../../../lib/supabase';

// POST { tenant, name, host } (bearer) → adds a location on a multi-location subscription (up to `seats`)
export async function POST(req) {
  const me = await currentUser(req); if (!me) return NextResponse.json({ error: 'login' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const parent = me.salons.find(s => s.tenant === b.tenant);
  if (!parent) return NextResponse.json({ error: 'not yours' }, { status: 403 });
  const db = sb();
  const { count } = await db.from('salons').select('tenant', { count: 'exact', head: true }).eq('stripe_subscription_id', parent.stripe_subscription_id);
  if (!parent.stripe_subscription_id || (count || 1) >= (parent.seats || 1)) return NextResponse.json({ error: `Your plan covers ${parent.seats || 1} location${(parent.seats || 1) > 1 ? 's' : ''}. Upgrade to Multi-location to add more.` }, { status: 400 });
  const name = String(b.name || '').trim().slice(0, 60); if (!name) return NextResponse.json({ error: 'Name the location.' }, { status: 400 });
  const tenant = await uniqueTenant(db, name);
  await db.from('tenants').upsert({ id: tenant, name });
  const { error } = await db.from('salons').insert({ tenant, name, email: parent.email, host: String(b.host || parent.host || 'your host').slice(0, 40), pin: randomPin(), status: parent.status, plan: parent.plan, seats: parent.seats, referrer: parent.referrer, stripe_customer_id: parent.stripe_customer_id, stripe_subscription_id: parent.stripe_subscription_id, current_period_end: parent.current_period_end });
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true, tenant });
}
