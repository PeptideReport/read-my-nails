import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { currentUser, ACTIVE } from '../../../../lib/supabase';
import { tilePng, packTile, contrastWarning } from '../../../../lib/render';
import { tileCode, POLISH_NAME } from '../../../../lib/library';
import { screenMarks, explainFlags } from '../../../../lib/trust';
import { sb } from '../../../../lib/supabase';

export const runtime = 'nodejs';
export const maxDuration = 60;

// POST { name, nails: [{t, polish}] } (bearer, active) → zip of five print tiles + recipe.txt
export async function POST(req) {
  const me = await currentUser(req);
  if (!me || (!me.isAdmin && !me.salons.some(s => ACTIVE.includes(s.status)))) return NextResponse.json({ error: 'login' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  let nails = (b.nails || []).slice(0, 10).map(n => ({ t: String(n.t || '').trim().slice(0, 14), polish: n.polish || '', ink: n.ink === '#fff' || n.ink === 'white' ? '#fff' : '#000' })).filter(n => n.t);
  const size = ['S', 'M', 'L'].includes(b.size) ? b.size : 'M';
  const printer = String(b.printer || 'o2nails');
  if (b.mirror) nails = nails.slice().reverse(); // reading direction: the wearer's own view reads pinky → thumb
  if (!nails.length) return NextResponse.json({ error: 'nails' }, { status: 400 });
  const name = String(b.name || 'custom').slice(0, 40);
  // Trust layer: nothing renders that a mom would frown at or a lawyer would write about.
  const v = await screenMarks(nails.map(n => n.t), { lang: b.lang === 'es' ? 'es' : 'en' });
  if (!v.ok) return NextResponse.json({ error: explainFlags(v.flags, b.lang === 'es' ? 'es' : 'en'), flags: v.flags }, { status: 400 });
  try { await sb().from('requests').insert({ tenant: me.salons[0]?.tenant || null, lang: b.lang === 'es' ? 'ES' : 'EN', kind: 'generator', phrase: nails.map(n => n.t).join(' ') }); } catch (e) {}
  const zip = new JSZip();
  const seen = new Set(); const lines = [`Read My Nails — custom set "${name}"`, `Nail size: ${size} · Printer: ${printer}${b.mirror ? ' · mirrored for the wearer\'s view' : ''}`, '', 'Nail  Tile code        Mark        Polish       Ink'];
  const warnings = [];
  for (let i = 0; i < nails.length; i++) {
    const n = nails[i]; const code = tileCode(n.t) + (n.ink === '#fff' ? '-W' : '') + (size !== 'M' ? '-' + size : '');
    const w = contrastWarning(n.polish, n.ink); if (w) warnings.push(`Nail ${i + 1}: ${w}`);
    lines.push(`${String(i + 1).padEnd(5)} ${code.padEnd(16)} ${n.t.padEnd(11)} ${(POLISH_NAME[n.polish] || 'Bare').padEnd(12)} ${n.ink === '#fff' ? 'white' : 'black'}`);
    if (seen.has(code)) continue; seen.add(code);
    const png = await tilePng(n.t, { size, ink: n.ink });
    const packed = await packTile(png, printer);
    zip.file(`tiles/${code}.${packed.ext}`, packed.buf);
  }
  if (warnings.length) lines.push('', 'CHECK:', ...warnings);
  lines.push('', 'Load the tiles/ folder into your printer. Tap them in order 1–5. Polish is the base color under the print.', 'Licensed to ' + me.email + ' · readmynails.com');
  zip.file('recipe.txt', lines.join('\n'));
  const out = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  return new Response(out, { headers: { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="read-my-nails-${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.zip"` } });
}
