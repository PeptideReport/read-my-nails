import { NextResponse } from 'next/server';
import { sb, tenantOf, activeSalon } from '../../../../lib/supabase';
import { suggestSets, configured } from '../../../../lib/ai';
import { screenMarks } from '../../../../lib/trust';
import { setByCode } from '../../../../lib/library';

export const runtime = 'nodejs';
export const maxDuration = 30;

// POST { loves: [..], occasion, lang } with x-tenant (kiosk) → { sets: [library sets], fresh: [new sets], configured }
// "Say it for me": the customer tells the host three things; the engine picks.
export async function POST(req) {
  const tenant = tenantOf(req); if (!tenant || !(await activeSalon(tenant))) return NextResponse.json({ error: 'tenant' }, { status: 400 });
  const b = await req.json().catch(() => ({}));
  const loves = (Array.isArray(b.loves) ? b.loves : String(b.loves || '').split(/[,;\n]/)).map(s => String(s).trim().slice(0, 60)).filter(Boolean).slice(0, 5);
  const occasion = String(b.occasion || '').trim().slice(0, 60);
  const lang = b.lang === 'es' ? 'es' : 'en';
  if (!loves.length && !occasion) return NextResponse.json({ error: 'Tell me one thing she loves.' }, { status: 400 });
  const input = await screenMarks([...loves, occasion].filter(Boolean), { lang, context: 'These are things a customer said she loves, not marks; flag only if the request itself is out of bounds.' });
  if (!input.ok) return NextResponse.json({ sets: [], fresh: [], note: 'We can do a lot of things, not that one.' });
  const r = await suggestSets({ loves, occasion, lang, max: 6 });
  const sets = r.codes.map(setByCode).filter(Boolean).map(s => s.n ? { c: s.c, a: s.a, x: s.x, n: s.n } : { c: s.c, a: s.a, x: s.x, sp: s.sp, w: s.w });
  const fresh = [];
  for (const s of r.fresh) { const v = await screenMarks((s.n || s.sp.flat()).map(x => x.split('|')[0]), { lang }); if (v.ok) fresh.push({ ...s, c: 'CUSTOM' }); }
  try { await sb().from('requests').insert({ tenant, lang: lang.toUpperCase(), kind: 'suggest', phrase: [...loves, occasion].filter(Boolean).join(' / ') }); } catch (e) {}
  return NextResponse.json({ sets, fresh, configured: configured() });
}
