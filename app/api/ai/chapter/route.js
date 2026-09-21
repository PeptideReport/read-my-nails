import { NextResponse } from 'next/server';
import { sb, currentUser, ACTIVE } from '../../../../lib/supabase';
import { configured, writeChapter, chapterCode, normalizeSets } from '../../../../lib/ai';
import { screenMarks } from '../../../../lib/trust';

export const runtime = 'nodejs';
export const maxDuration = 60;

const DAILY = 10; // drafts per salon per day; admins unlimited

async function gate(req) {
  const me = await currentUser(req); if (!me) return [null, NextResponse.json({ error: 'login' }, { status: 401 })];
  if (!me.isAdmin && !me.salons.some(s => ACTIVE.includes(s.status))) return [null, NextResponse.json({ error: 'Active subscription required.' }, { status: 402 })];
  return [me, null];
}
const marksOf = s => (s.n || s.sp?.flat() || []).map(x => x.split('|')[0]);

// GET → this account's drafts (admin: all)
export async function GET(req) {
  const [me, err] = await gate(req); if (err) return err;
  let q = sb().from('drafts').select('*').neq('status', 'discarded').order('created_at', { ascending: false }).limit(60);
  if (!me.isAdmin) q = q.in('tenant', me.salons.map(s => s.tenant)).neq('status', 'submitted');
  const { data } = await q;
  return NextResponse.json({ configured: configured(), drafts: data || [] });
}

// POST { tenant, theme, lang, count, audience, notes } → writes a chapter, screens every set, saves a draft
export async function POST(req) {
  const [me, err] = await gate(req); if (err) return err;
  if (!configured()) return NextResponse.json({ error: 'The writer is not switched on yet (ANTHROPIC_API_KEY).' }, { status: 400 });
  const b = await req.json().catch(() => ({}));
  const tenant = me.salons.find(s => s.tenant === b.tenant)?.tenant || (me.isAdmin ? null : me.salons[0]?.tenant);
  const theme = String(b.theme || '').trim().slice(0, 200); if (theme.length < 3) return NextResponse.json({ error: 'Give the chapter a theme.' }, { status: 400 });
  const db = sb();
  if (!me.isAdmin) {
    const { count } = await db.from('drafts').select('id', { count: 'exact', head: true }).eq('tenant', tenant).gte('created_at', new Date(Date.now() - 864e5).toISOString());
    if ((count || 0) >= DAILY) return NextResponse.json({ error: `That's ${DAILY} chapters today. Tomorrow.` }, { status: 429 });
  }
  // The theme itself goes through the screen first — no chapter about a brand.
  const themeCheck = await screenMarks([theme], { lang: b.lang || 'en', context: 'This is a requested chapter theme, not a nail mark.' });
  if (!themeCheck.ok) return NextResponse.json({ error: `Can't write that one: ${themeCheck.flags[0]?.note || themeCheck.flags[0]?.category}.`, flags: themeCheck.flags }, { status: 400 });

  let out;
  try { out = await writeChapter({ theme, lang: b.lang || 'EN', count: Number(b.count) || 12, audience: String(b.audience || '').slice(0, 120), notes: String(b.notes || '').slice(0, 300) }); }
  catch (e) { return NextResponse.json({ error: 'The writer stumbled. Try again.' }, { status: 502 }); }

  // Screen every set; keep the clean ones, report the rest.
  const kept = [], dropped = [];
  for (const s of out.sets) {
    const v = await screenMarks(marksOf(s), { lang: b.lang || 'en' });
    if (v.ok) kept.push(s); else dropped.push({ a: s.a, why: v.flags[0]?.note || v.flags[0]?.category });
  }
  if (!kept.length) return NextResponse.json({ error: 'Nothing survived the screen. Try a different theme.' , dropped }, { status: 422 });
  await db.from('requests').insert({ tenant, lang: b.lang || 'EN', kind: 'chapter', phrase: theme });
  const row = { tenant, lang: (b.lang || 'EN').toUpperCase(), theme, title: out.title, blurb: out.blurb, sets: kept, status: 'draft', created_by: me.email };
  const { data, error } = await db.from('drafts').insert(row).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ draft: data, dropped });
}

// PUT { id, sets?, title?, action: 'save'|'approve'|'global'|'discard' }
export async function PUT(req) {
  const [me, err] = await gate(req); if (err) return err;
  const b = await req.json().catch(() => ({}));
  const db = sb();
  const { data: d } = await db.from('drafts').select('*').eq('id', b.id).maybeSingle();
  if (!d || (!me.isAdmin && !me.salons.some(s => s.tenant === d.tenant))) return NextResponse.json({ error: 'not yours' }, { status: 403 });
  if (d.status === 'submitted' && !me.isAdmin) return NextResponse.json({ error: 'admin only' }, { status: 403 });
  const patch = { updated_at: new Date().toISOString() };
  if (b.title) patch.title = String(b.title).slice(0, 40);
  if (b.sets) {
    const sets = normalizeSets(b.sets); if (!sets.length) return NextResponse.json({ error: 'No valid sets.' }, { status: 400 });
    for (const s of sets) { const v = await screenMarks(marksOf(s), { lang: d.lang.toLowerCase() }); if (!v.ok) return NextResponse.json({ error: `“${s.a}”: ${v.flags[0]?.note || v.flags[0]?.category}` }, { status: 400 }); }
    patch.sets = sets;
  }
  const action = b.action || 'save';
  if (action === 'discard') patch.status = 'discarded';
  if (action === 'approve' || action === 'global') {
    if (action === 'global' && !me.isAdmin) return NextResponse.json({ error: 'admin only' }, { status: 403 });
    const sets = patch.sets || d.sets; const title = patch.title || d.title || d.theme;
    // unique chapter code for this scope
    let code = chapterCode(d.lang, title); const scope = action === 'global' ? '*' : d.tenant;
    for (let i = 2; i < 30; i++) { let q = db.from('custom_chapters').select('code').eq('code', code); q = q.eq('tenant', scope); const { data: x } = await q.maybeSingle(); if (!x || x.code === d.code) break; code = code.slice(0, -1) + String(i % 10); }
    const coded = sets.map((s, i) => ({ ...s, c: `${code}-${String(i + 1).padStart(2, '0')}` }));
    const credit = d.creator ? ` — by ${d.creator.name}${d.creator.instagram ? ' (@' + d.creator.instagram + ')' : ''}` : '';
    const row = { code, tenant: scope, lang: d.lang, title, blurb: (d.blurb || '') + credit, sets: coded, creator: d.creator || null };
    const { error } = await db.from('custom_chapters').upsert(row, { onConflict: 'code,tenant' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    patch.status = action; patch.code = code; patch.sets = coded;
  }
  const { data, error } = await db.from('drafts').update(patch).eq('id', d.id).select('*').single();
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ draft: data });
}
