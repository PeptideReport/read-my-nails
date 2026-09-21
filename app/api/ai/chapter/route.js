import { NextResponse } from 'next/server';
import { sb, currentUser, ACTIVE } from '../../../../lib/supabase';
import { configured, writeChapter, chapterCode, normalizeSets } from '../../../../lib/ai';
import { screenMarks } from '../../../../lib/trust';
import { allChapters } from '../../../../lib/library';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MONTHLY = 5; // AI chapter generations per salon per month; admins unlimited
// Built-in library codes a custom chapter must never reuse — otherwise it shadows/duplicates a real
// library chapter on the kiosk (e.g. a "Prom" chapter would grab EN-PROM, the library's own code).
const LIBRARY_CODES = new Set(allChapters().map(c => c.code));

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
const { count } = await db.from('drafts').select('id', { count: 'exact', head: true }).eq('tenant', tenant).neq('status', 'discarded').gte('created_at', new Date(Date.now() - 30 * 864e5).toISOString());
if ((count || 0) >= MONTHLY) return NextResponse.json({ error: `That's ${MONTHLY} custom chapters this month — your allowance resets next month.` }, { status: 429 });
}
// The theme itself goes through the screen first — no chapter about a brand.
const themeCheck = await screenMarks([theme], { lang: b.lang || 'en', context: 'This is a requested chapter theme, not a nail mark.' });
if (!themeCheck.ok) return NextResponse.json({ error: `Can't write that one: ${themeCheck.flags[0]?.note || themeCheck.flags[0]?.category}.`, flags: themeCheck.flags }, { status: 400 });

let out;
try { out = await writeChapter({ theme, lang: b.lang || 'EN', count: Number(b.count) || 12, audience: String(b.audience || '').slice(0, 120), notes: String(b.notes || '').slice(0, 300) }); }
catch (e) { console.error('[api/ai/chapter] writeChapter failed:', e?.message || e); return NextResponse.json({ error: 'The writer stumbled. Try again.' }, { status: 502 }); }

// Screen every set in parallel; keep the clean ones, report the rest. (Sequential screening blew past the 60s budget.)
const kept = [], dropped = [];
const verdicts = await Promise.all(out.sets.map(s => screenMarks(marksOf(s), { lang: b.lang || 'en' }).then(v => [s, v]).catch(() => [s, { ok: true, flags: [] }])));
for (const [s, v] of verdicts) {
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
//   plus admin-only { action: 'remove', code, tenant } to pull a live custom chapter that no draft owns
//   (e.g. one stranded before discard learned to clean up after itself).
export async function PUT(req) {
const [me, err] = await gate(req); if (err) return err;
const b = await req.json().catch(() => ({}));
const db = sb();
if (b.action === 'remove') {
if (!me.isAdmin) return NextResponse.json({ error: 'admin only' }, { status: 403 });
const code = String(b.code || '').toUpperCase().trim();
const tenant = b.tenant === '*' ? '*' : String(b.tenant || '').trim();
if (!code || !tenant) return NextResponse.json({ error: 'code and tenant required' }, { status: 400 });
const { error } = await db.from('custom_chapters').delete().eq('code', code).eq('tenant', tenant);
return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true, removed: { code, tenant } });
}
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
if (action === 'discard') {
patch.status = 'discarded';
// Discard means gone. If this draft was already live, pull the kiosk chapter too — otherwise a
// direct API call could approve → discard to keep the chapter live AND free a monthly-cap slot.
if (d.code && d.status === 'approved') await db.from('custom_chapters').delete().eq('code', d.code).eq('tenant', d.tenant);
else if (d.code && d.status === 'global' && me.isAdmin) await db.from('custom_chapters').delete().eq('code', d.code).eq('tenant', '*');
}
if (action === 'approve' || action === 'global') {
if (action === 'global' && !me.isAdmin) return NextResponse.json({ error: 'admin only' }, { status: 403 });
const sets = patch.sets || d.sets; const title = patch.title || d.title || d.theme;
// unique chapter code for this scope
let code = chapterCode(d.lang, title); const scope = action === 'global' ? '*' : d.tenant;
for (let i = 2; i < 30; i++) { const libClash = LIBRARY_CODES.has(code); const { data: x } = await db.from('custom_chapters').select('code').eq('code', code).eq('tenant', scope).maybeSingle(); const customClash = x && x.code !== d.code; if (!libClash && !customClash) break; code = code.slice(0, -1) + String(i % 10); }
const coded = sets.map((s, i) => ({ ...s, c: `${code}-${String(i + 1).padStart(2, '0')}` }));
const credit = d.creator ? ` — by ${d.creator.name}${d.creator.instagram ? ' (@' + d.creator.instagram + ')' : ''}` : '';
const row = { code, tenant: scope, lang: d.lang, title, blurb: (d.blurb || '') + credit, sets: coded, creator: d.creator || null };
const { error } = await db.from('custom_chapters').upsert(row, { onConflict: 'code,tenant' });
if (error) return NextResponse.json({ error: error.message }, { status: 500 });
patch.status = action === 'approve' ? 'approved' : action; patch.code = code; patch.sets = coded;
}
const { data, error } = await db.from('drafts').update(patch).eq('id', d.id).select('*').single();
return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ draft: data });
}
