import { NextResponse } from 'next/server';
import { sb, tenantOf, activeSalon, requirePin } from '../../../lib/supabase';
import { planHasApp } from '../../../lib/stripe';
import { setByCode, handsOf, tileCode, POLISH_NAME } from '../../../lib/library';
import { sendOrderNotice } from '../../../lib/email';
import { screenMarks, explainFlags } from '../../../lib/trust';
import { sendSms, normalizePhone } from '../../../lib/sms';

// Tenant comes from the x-tenant header (app.html) or ?t=. Every query is scoped to it.
// GET ?scope=active|today|all (host, PIN) GET ?code=ABCDE (customer status)
export async function GET(req) {
const tenant = tenantOf(req); if (!tenant) return NextResponse.json({ error: 'tenant' }, { status: 400 });
const u = new URL(req.url); const code = u.searchParams.get('code'); const db = sb();
if (code) {
const { data } = await db.from('orders').select('code,status,answer,price,created_at').eq('tenant', tenant).eq('code', code.toUpperCase()).single();
return NextResponse.json(data || null);
}
if (!(await requirePin(req, tenant))) return NextResponse.json({ error: 'pin' }, { status: 401 });
let q = db.from('orders').select('*').eq('tenant', tenant).order('created_at', { ascending: false }).limit(500);
const scope = u.searchParams.get('scope') || 'active';
if (scope === 'active') q = q.in('status', ['new', 'in_progress']);
if (scope === 'today') q = q.gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());
const { data, error } = await q; if (error) return NextResponse.json({ error: error.message }, { status: 500 });
return NextResponse.json(data);
}

const genCode = () => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 5; i++) s += a[Math.floor(Math.random() * a.length)]; return s; };

// POST — customer creates an order (no PIN; salon must be active and on a plan with the app)
// from the kiosk: the full order object app.html builds
// from readmynails.com: { web: true, setCode, name, party?, hand? } — we build the order from the library
export async function POST(req) {
const tenant = tenantOf(req); if (!tenant) return NextResponse.json({ error: 'tenant' }, { status: 400 });
const salon = await activeSalon(tenant);
if (!salon || !planHasApp(salon.plan)) return NextResponse.json({ error: 'This kiosk is not active.' }, { status: 402 });
  // This endpoint takes no PIN (walk-in customers place their own orders), so guard it three ways:
  // 1) Cap the whole request body (not just the hands blob) so nobody parks megabytes in any field.
  const raw = await req.text();
  if (raw.length > 20000) return NextResponse.json({ error: 'That order is too large.' }, { status: 400 });
  let o; try { o = JSON.parse(raw); } catch (e) { return NextResponse.json({ error: 'bad request' }, { status: 400 }); }
  if (!o || typeof o !== 'object') return NextResponse.json({ error: 'bad request' }, { status: 400 });
  const db = sb();
  // 2) Rate limit per salon — a bad actor who knows the kiosk URL can't flood one queue. A real party rush
  // (a dozen friends tapping at once) stays well under this; sustained spam gets a 429. Web orders (which
  // text a customer-supplied number) get a tighter cap so the endpoint can't be used to pump SMS.
  const since = new Date(Date.now() - 60000).toISOString();
  const { count: recent, error: rlErr } = await db.from('orders').select('id', { count: 'exact', head: true }).eq('tenant', tenant).gte('created_at', since);
  if (rlErr) return NextResponse.json({ error: 'Try again in a moment.' }, { status: 503 });
  if ((recent || 0) >= 20) return NextResponse.json({ error: 'Too many orders in the last minute. Give it a moment and try again.' }, { status: 429 });
  if (o.web) {
    const { count: recentWeb } = await db.from('orders').select('id', { count: 'exact', head: true }).eq('tenant', tenant).eq('source', 'web').gte('created_at', since);
    if ((recentWeb || 0) >= 5) return NextResponse.json({ error: 'Too many orders in the last minute. Give it a moment and try again.' }, { status: 429 });
  }
  let row; let notify = null;
  if (o.web) {
    if (!salon.listed) return NextResponse.json({ error: 'This salon does not take web orders.' }, { status: 400 });
    const set = setByCode(o.setCode); if (!set) return NextResponse.json({ error: 'set' }, { status: 400 });
    const { data: st } = await db.from('settings').select('data').eq('tenant', tenant).maybeSingle();
    const prices = st?.data?.prices || { hand: 25, split: 45 };
    const hands = handsOf(set).map(h => h.map(n => ({ t: n.t, tile: tileCode(n.t), polish: POLISH_NAME[n.polish] || 'Bare', ink: 'Black', photo: null, changed: false })));
    const name = String(o.name || '').trim().slice(0, 40); if (!name) return NextResponse.json({ error: 'Add your first name.' }, { status: 400 });
    let party = null;
    if (o.party) { const { data: p } = await db.from('parties').select('id,name').eq('id', String(o.party).slice(0, 80)).eq('tenant', tenant).maybeSingle(); if (p) party = p; }
    row = { tenant, code: genCode(), status: 'new', name: party ? `${name} \u00b7 ${party.name}` : name, lang: set.lang.toLowerCase(), set_code: set.c, answer: set.a, split: !!set.sp, who: set.w || null, price: set.sp ? Number(prices.split) || 45 : Number(prices.hand) || 25, hands: set.sp ? hands : [hands[0]], kiosk: 'web', source: 'web', party: party?.id || null };
    const phone = normalizePhone(o.phone); if (phone) row.phone = phone;
    // 3) Notify only after the row is actually in the queue — never text a code that doesn't exist.
    notify = { partyName: party?.name, phone };
  } else {
    // Customer-typed marks ("make it mine") go through the trust layer before they reach the host's queue.
    const changed = (Array.isArray(o.hands) ? o.hands : []).flat().filter(n => n && (n.changed || o.setCode === 'CUSTOM') && n.t && n.t !== '?').map(n => String(n.t));
    if (changed.length) { const v = await screenMarks(changed, { lang: o.lang === 'es' ? 'es' : 'en' }); if (!v.ok) return NextResponse.json({ error: explainFlags(v.flags, o.lang === 'es' ? 'es' : 'en'), flags: v.flags }, { status: 400 }); }
    const code = String(o.code || '').toUpperCase().slice(0, 12); if (!code) return NextResponse.json({ error: 'code' }, { status: 400 });
    row = { tenant, code, status: 'new', name: String(o.name || '').slice(0, 40), lang: String(o.lang || 'en').slice(0, 5), set_code: String(o.setCode || '').slice(0, 40), answer: String(o.answer || '').slice(0, 200), split: !!o.split, who: o.who ?? null, price: Number(o.price) || 0, hands: Array.isArray(o.hands) ? o.hands : [], kiosk: String(o.kiosk || '').slice(0, 40), source: 'kiosk' };
  }
  const { error } = await db.from('orders').insert(row);
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'That order code is already in use. Try again.' }, { status: 409 });
    return NextResponse.json({ error: 'Could not save the order.' }, { status: 500 });
  }
  if (notify) {
    try { await sendOrderNotice(salon, { ...row, party: notify.partyName }); } catch (e) {}
    if (notify.phone) { try { await sendSms(notify.phone, `Read My Nails: "${row.answer}" is in the queue at ${salon.name}. Your code: ${row.code}. Show it when you walk in.`); } catch (e) {} }
  }
  return NextResponse.json({ ok: true, code: row.code, answer: row.answer, price: row.price, salon: salon.name });
}

// PATCH — host updates status (PIN)
export async function PATCH(req) {
const tenant = tenantOf(req); if (!tenant) return NextResponse.json({ error: 'tenant' }, { status: 400 });
if (!(await requirePin(req, tenant))) return NextResponse.json({ error: 'pin' }, { status: 401 });
const { code, status } = await req.json();
const patch = { status }; if (status === 'done') patch.completed_at = new Date().toISOString();
const { error } = await sb().from('orders').update(patch).eq('tenant', tenant).eq('code', code); if (error) return NextResponse.json({ error: error.message }, { status: 500 });
return NextResponse.json({ ok: true });
}
