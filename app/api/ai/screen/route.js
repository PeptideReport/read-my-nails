import { NextResponse } from 'next/server';
import { currentUser, tenantOf, activeSalon } from '../../../../lib/supabase';
import { screenMarks, explainFlags } from '../../../../lib/trust';

export const runtime = 'nodejs';

// POST { marks: [..], lang } (bearer, or x-tenant from a kiosk) → { ok, flags, message }
export async function POST(req) {
  const me = await currentUser(req);
  const tenant = tenantOf(req);
  if (!me && !(tenant && await activeSalon(tenant))) return NextResponse.json({ error: 'login' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const marks = (Array.isArray(b.marks) ? b.marks : []).map(m => String(m || '').slice(0, 20)).filter(Boolean).slice(0, 10);
  const v = await screenMarks(marks, { lang: b.lang === 'es' ? 'es' : 'en' });
  return NextResponse.json({ ok: v.ok, flags: v.flags, source: v.source, message: v.ok ? '' : explainFlags(v.flags, b.lang === 'es' ? 'es' : 'en') });
}
