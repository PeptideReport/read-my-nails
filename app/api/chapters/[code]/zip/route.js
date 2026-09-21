import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { sb, currentUser } from '../../../../../lib/supabase';
import { entitlements } from '../../../../../lib/access';
import { allChapters, handsOf, tileCode, POLISH_NAME } from '../../../../../lib/library';
import { tilePng, packTile } from '../../../../../lib/render';

export const runtime = 'nodejs';
export const maxDuration = 60;

// GET /api/chapters/EN-PUZZL/zip?printer=o2nails&size=M  (bearer, chapter claimed) → every tile the chapter uses + recipe.txt
// Tiles render on demand in the library's exact style, so a chapter download is always the current edition.
export async function GET(req, { params }) {
  const me = await currentUser(req); if (!me) return NextResponse.json({ error: 'login' }, { status: 401 });
  const code = String(params.code || '').toUpperCase();
  const chapter = allChapters().find(c => c.code === code); if (!chapter) return NextResponse.json({ error: 'No such chapter.' }, { status: 404 });
  const ent = await entitlements(sb(), me.email, me.salons);
  if (!(me.isAdmin || ent.all || ent.claimed.has(code))) return NextResponse.json({ error: 'Claim this chapter first.' }, { status: 403 });
  const u = new URL(req.url);
  const size = ['S', 'M', 'L'].includes(u.searchParams.get('size')) ? u.searchParams.get('size') : 'M';
  const printer = String(u.searchParams.get('printer') || 'o2nails');

  const zip = new JSZip();
  const lines = [`Read My Nails — ${chapter.t} (${code}) · ${chapter.lang}`, chapter.s || '', `Nail size: ${size} · Printer: ${printer}`, '', 'Load the tiles/ folder into your printer once. Each set below is five tiles by code, in order 1–5. Polish is the base color under the print.', ''];
  const seen = new Set();
  for (const s of chapter.sets) {
    const hands = handsOf(s);
    lines.push(`${s.c}  “${s.a}”${s.x ? '  — ' + s.x : ''}`);
    for (let h = 0; h < hands.length; h++) {
      const row = hands[h].map((n, i) => `${hands.length > 1 ? h + 1 + '.' : ''}${i + 1} ${tileCode(n.t)} (${n.t}${n.polish ? ' · ' + POLISH_NAME[n.polish] : ''})`);
      lines.push('   ' + row.join('   '));
      for (const n of hands[h]) {
        const tc = tileCode(n.t) + (size !== 'M' ? '-' + size : '');
        if (seen.has(tc) || n.t === '📷') continue; seen.add(tc);
        const png = await tilePng(n.t, { size, ink: '#000' });
        const packed = await packTile(png, printer);
        zip.file(`tiles/${tc}.${packed.ext}`, packed.buf);
      }
    }
    lines.push('');
  }
  lines.push(`${seen.size} tiles · Licensed to ${me.email} · readmynails.com · not for resale`);
  zip.file('recipe.txt', lines.join('\n'));
  const out = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  return new Response(out, { headers: { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="read-my-nails-${code.toLowerCase()}.zip"` } });
}
