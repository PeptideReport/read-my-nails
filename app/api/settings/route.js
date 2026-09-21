import { NextResponse } from 'next/server';
import { sb, tenantOf, activeSalon, requirePin } from '../../../lib/supabase';
import { planHasApp } from '../../../lib/stripe';
import { entitlements } from '../../../lib/access';

// GET → this salon's kiosk settings (prices, polishes, chapters) + name/host from the salon row. 402 if the subscription lapsed.
export async function GET(req) {
  const tenant = tenantOf(req); if (!tenant) return NextResponse.json({ error: 'tenant' }, { status: 400 });
  const salon = await activeSalon(tenant);
  if (!salon || !planHasApp(salon.plan)) return NextResponse.json({ error: 'inactive' }, { status: 402 });
  const { data } = await sb().from('settings').select('data').eq('tenant', tenant).single();
  const s = data ? data.data : {}; delete s.pin;
  s.kiosk = s.kiosk || salon.name; s.host = salon.host || 'Host';
  // Chapters this salon (or the network) had the engine write; the kiosk app merges them into its library.
  const { data: cc } = await sb().from('custom_chapters').select('code,tenant,lang,title,blurb,sets').in('tenant', [tenant, '*']).order('created_at');
  s.chapters = (cc || []).map(c => ({ code: c.code, lang: c.lang, t: c.title, s: c.blurb || '', sets: c.sets, custom: true }));
  // Which library chapters this salon has claimed (PRICING-SPEC-v1). null = every chapter (house plan, Whole Library + Drops).
  const ent = await entitlements(sb(), salon.email, [salon]);
  s.claimed = ent.all ? null : [...ent.claimed];
  return NextResponse.json(s);
}

export async function PUT(req) {
  const tenant = tenantOf(req); if (!tenant) return NextResponse.json({ error: 'tenant' }, { status: 400 });
  if (!(await requirePin(req, tenant))) return NextResponse.json({ error: 'pin' }, { status: 401 });
  const s = await req.json(); delete s.pin; delete s.host; delete s.chapters; delete s.claimed;
  const { error } = await sb().from('settings').upsert({ tenant, data: s, updated_at: new Date().toISOString() });
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true });
}
