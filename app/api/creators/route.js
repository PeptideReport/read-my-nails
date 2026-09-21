import { NextResponse } from 'next/server';
import { sb } from '../../../lib/supabase';
import { normalizeSets } from '../../../lib/ai';
import { screenMarks } from '../../../lib/trust';

export const runtime = 'nodejs';
export const maxDuration = 30;

// POST { name, email, instagram, title, blurb, lang, sets:[{n:[5 marks], polish:[5], a}] } → creator submission (public, screened)
// Lands as a draft with status 'submitted'; the admin publishes it to every kiosk with credit and pays a royalty on orders.
export async function POST(req) {
  const b = await req.json().catch(() => ({}));
  const name = String(b.name || '').trim().slice(0, 60), email = String(b.email || '').trim().toLowerCase().slice(0, 120), ig = String(b.instagram || '').trim().replace(/^@/, '').slice(0, 40);
  const title = String(b.title || '').trim().slice(0, 40), blurb = String(b.blurb || '').trim().slice(0, 120), lang = ['EN', 'ES', 'PT', 'VI', 'TL', 'FR', 'IT', 'HT', 'KO', 'JA'].includes(b.lang) ? b.lang : 'EN';
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !title) return NextResponse.json({ error: 'Name, email and a chapter title are required.' }, { status: 400 });
  const raw = (Array.isArray(b.sets) ? b.sets : []).slice(0, 12).map(s => ({ n: (s.n || []).map((m, i) => String(m || '').trim() + '|' + (s.polish?.[i] || '')), a: String(s.a || '').trim(), x: '' }));
  const sets = normalizeSets(raw).filter(s => s.n.every(x => x.split('|')[0]));
  if (sets.length < 5) return NextResponse.json({ error: 'At least five complete sets (five marks and a phrase each).' }, { status: 400 });
  for (const s of sets) {
    const v = await screenMarks(s.n.map(x => x.split('|')[0]), { lang: lang.toLowerCase() });
    if (!v.ok) return NextResponse.json({ error: `“${s.a}” can't be published: ${v.flags[0]?.note || v.flags[0]?.category}.` }, { status: 400 });
  }
  // Light abuse guard: 3 submissions per email per day.
  const db = sb();
  const { count } = await db.from('drafts').select('id', { count: 'exact', head: true }).eq('created_by', email).gte('created_at', new Date(Date.now() - 864e5).toISOString());
  if ((count || 0) >= 3) return NextResponse.json({ error: 'Three chapters a day per creator. Tomorrow.' }, { status: 429 });
  const { error } = await db.from('drafts').insert({ tenant: null, lang, theme: title, title, blurb, sets, status: 'submitted', created_by: email, creator: { name, email, instagram: ig } });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
