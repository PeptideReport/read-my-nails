import { NextResponse } from 'next/server';
import { sb, tenantOf, activeSalon, requirePin } from '../../../lib/supabase';
import { planHasApp } from '../../../lib/stripe';
import { setByCode, handsOf, tileCode, POLISH_NAME } from '../../../lib/library';
import { sendOrderNotice } from '../../../lib/email';
import { screenMarks, explainFlags } from '../../../lib/trust';
import { sendSms, normalizePhone } from '../../../lib/sms';

// Tenant comes from the x-tenant header (app.html) or ?t=. Every query is scoped to it.
// GET ?scope=active|today|all (host, PIN)    GET ?code=ABCDE (customer status)
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
//   from the kiosk: the full order object app.html builds
//   from readmynails.com: { web: true, setCode, name, party?, hand? } — we build the order from the library
export async function POST(req) {
  const tenant = tenantOf(req); if (!tenant) return NextResponse.json({ error: 'tenant' }, { status: 400 });
  const salon = await activeSalon(tenant);
  if (!salon || !planHasApp(salon.plan)) return NextResponse.json({ error: 'This kiosk is not active.' }, { status: 402 });
  const o = await req.json(); const db = sb();
  let row;
  if (o.web) {
    if (!salon.listed) return NextResponse.json({ error: 'This salon does not take web orders.' }, { status: 400 });
    const set = setByCode(o.setCode); if (!set) return NextResponse.json({ error: 'set' }, { status: 400 });
    const { data: st } = await db.from('settings').select('data').eq('tenant', tenant).maybeSingle();
    const prices = st?.data?.prices || { hand: 25, split: 45 };
    const hands = handsOf(set).map(h => h.map(n => ({ t: n.t, tile: tileCode(n.t), polish: POLISH_NAME[n.polish] || 'Bare', ink: 'Black', photo: null, changed: false })));
    const name = String(o.name || '').trim().slice(0, 40); if (!name) return NextResponse.json({ error: 'Add your first name.' }, { status: 400 });
    let party = null;
    if (o.party) { const { data: p } = await db.from('parties').select('id,name').eq('id', o.party).eq('tenant', tenant).maybeSingle(); if (p) party = p; }
    row = { tenant, code: genCode(), status: 'new', name: party ? `${name} · ${party.name}` : name, lang: set.lang.toLowerCase(), set_code: set.c, answer: set.a, split: !!set.sp, who: set.w || null, price: set.sp ? Number(prices.split) || 45 : Number(prices.hand) || 25, hands: set.sp ? hands : [hands[0]], kiosk: 'web', source: 'web', party: party?.id || null };
    try { await sendOrderNotice(salon, { ...row, party: party?.name }); } catch (e) {}
    const phone = normalizePhone(o.phone);
    if (phone) { row.phone = phone; try { await sendSms(phone, `Read My Nails: “${row.answer}” is in the queue at ${salon.name}. Your code: ${row.code}. Show it when you walk in.`); } catch (e) {} }
  } else {
    // Customer-typed marks ("make it mine") go through the trust layer before they reach the host's queue.
    const changed = (o.hands || []).flat().filter(n => n && (n.changed || o.setCode === 'CUSTOM') && n.t && n.t !== '?').map(n => String(n.t));
    if (changed.length) { const v = await screenMarks(changed, { lang: o.lang === 'es' ? 'es' : 'en' }); if (!v.ok) return NextResponse.json({ error: explainFlags(v.flags, o.lang === 'es' ? 'es' : 'en'), flags: v.flags }, { status: 400 }); }
    row = { tenant, code: o.code, status: 'new', name: String(o.name || '').slice(0, 40), lang: o.lang, set_code: o.setCode, answer: o.answer, split: !!o.split, who: o.who, price: Number(o.price) || 0, hands: o.hands, kiosk: o.kiosk, source: 'kiosk' };
  }
  const { error } = await db.from('orders').insert(row); if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
