import satori from 'satori';
import { initWasm, Resvg } from '@resvg/resvg-wasm';
import fs from 'fs';
import path from 'path';
import { isEmoji, POLISH_HEX } from './marks';
import PRINTERS from '../data/printers.json';
import sharp from 'sharp';

// One renderer for print tiles and share images: Satori (JSX → SVG) + resvg (SVG → PNG), all in-process, no browser.
// Fonts and the wasm live in /assets and are traced into the serverless bundle by next.config.js.
let _font, _font2, _wasm;
const asset = f => path.join(process.cwd(), 'assets', f);
function fredoka() { if (!_font) _font = fs.readFileSync(asset('Fredoka-Bold.ttf')); return _font; }
// Nunito Black carries Vietnamese, Portuguese and the math symbols Fredoka lacks; Satori falls back per glyph.
function nunito() { if (!_font2) _font2 = fs.readFileSync(asset('Nunito-Black.ttf')); return _font2; }
async function ready() { if (!_wasm) { _wasm = initWasm(fs.readFileSync(asset('resvg.wasm'))).catch(e => { if (!/already/i.test(String(e))) throw e; }); } await _wasm; }

// Emoji as SVG from Google's Noto Emoji — the same family the original 1,671 tiles were rendered with.
// Every emoji the library uses is vendored in assets/emoji/ (Apache-2.0, see assets/emoji/LICENSE) and read from disk.
// Anything else (generator phrases, AI chapters) falls back to the Noto repo. Noto moved its SVGs to 2D/svg/ and pads
// code points to 4 hex digits (emoji_u0031_20e3); flags live in third_party/region-flags/waved-svg/.
const emojiCache = new Map();
async function loadEmoji(code, segment) {
  if (code !== 'emoji') return '';
  const cps = Array.from(segment).map(c => c.codePointAt(0)).filter(cp => cp !== 0xfe0f);
  const key = cps.map(cp => cp.toString(16)).join('_');
  if (emojiCache.has(key)) return emojiCache.get(key);
  let svg = '';
  try { svg = fs.readFileSync(asset(path.join('emoji', `emoji_u${key}.svg`)), 'utf8'); } catch (e) {}
  if (!svg) {
    const noto = cps.map(cp => cp.toString(16).padStart(4, '0')).join('_');
    const isFlag = cps.length === 2 && cps.every(cp => cp >= 0x1f1e6 && cp <= 0x1f1ff);
    const dir = isFlag ? 'third_party/region-flags/waved-svg' : '2D/svg';
    const urls = [
      `https://raw.githubusercontent.com/googlefonts/noto-emoji/main/${dir}/emoji_u${noto}.svg`,
      `https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji@main/${dir}/emoji_u${noto}.svg`,
    ];
    for (const u of urls) { try { const r = await fetch(u); if (r.ok) { svg = await r.text(); break; } } catch (e) {} }
  }
  const data = svg ? 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64') : '';
  emojiCache.set(key, data);
  return data;
}

async function png(element, width, height, { transparent = false } = {}) {
  await ready();
  const svg = await satori(element, { width, height, fonts: [{ name: 'Fredoka', data: fredoka(), weight: 700, style: 'normal' }, { name: 'Nunito', data: nunito(), weight: 900, style: 'normal' }], loadAdditionalAsset: loadEmoji });
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: width }, background: transparent ? undefined : undefined });
  return Buffer.from(r.render().asPng());
}

// Print tile: 1500 × 2250, black mark on transparent, sized like the engine.
// Fit layer: size = 'S' | 'M' | 'L' scales the mark for short, medium, long nails (the printer fits the whole canvas to the nail,
// so a short nail needs a proportionally smaller, bolder mark to stay legible). ink = '#000' | '#fff' for dark polish.
const FIT = { S: 0.82, M: 1, L: 1.1 };
export async function tilePng(mark, { size = 'M', ink = '#000' } = {}) {
  const emoji = isEmoji(mark);
  const len = [...mark].length;
  const base = emoji ? 1250 : len === 1 ? 1300 : len === 2 ? 1000 : len === 3 ? 760 : len === 4 ? 600 : len === 5 ? 500 : len <= 7 ? 380 : len <= 9 ? 300 : 240;
  const fs = Math.round(base * (FIT[size] || 1));
  const el = { type: 'div', props: { style: { width: 1500, height: 2250, display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: { type: 'span', props: { style: { fontFamily: 'Fredoka', fontWeight: 700, fontSize: fs, color: ink, lineHeight: 1, letterSpacing: emoji ? 0 : (size === 'S' ? '0.03em' : '0.01em'), whiteSpace: 'nowrap' }, children: mark } } } };
  return png(el, 1500, 2250, { transparent: true });
}

// Printer profiles: pack a rendered tile to a machine's expected size/background/format (data/printers.json).
export const printers = () => Object.fromEntries(Object.entries(PRINTERS).filter(([k]) => !k.startsWith('_')));
export async function packTile(pngBuf, profileKey = 'o2nails') {
  const p = PRINTERS[profileKey] || PRINTERS.o2nails;
  let s = sharp(pngBuf).resize(p.width, p.height, { fit: 'contain', background: p.background || { r: 0, g: 0, b: 0, alpha: 0 } });
  if (p.background) s = s.flatten({ background: p.background });
  const buf = p.format === 'jpg' ? await s.jpeg({ quality: 92 }).toBuffer() : await s.png().toBuffer();
  return { buf, ext: p.format === 'jpg' ? 'jpg' : 'png', profile: p };
}

// Contrast check: does this ink read on this polish? Returns a warning string or null.
const DARK = new Set(['ink', 'Black']);
export function contrastWarning(polish, ink = '#000') {
  const dark = DARK.has(polish);
  if (dark && ink === '#000') return 'Black ink on black polish will not read — switch this nail to white ink or a lighter polish.';
  if (!dark && ink === '#fff' && (polish === '' || polish === 'Bare' || polish === 'White')) return 'White ink on a bare nail will not read — use black ink or a colored polish.';
  return null;
}
export async function tileImage(mark, opts) {
  const buf = await tilePng(mark, opts);
  return new Response(buf, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'private, max-age=3600' } });
}

// A nail for share images (Satori element objects, no JSX so this file stays a plain .js module).
function nail(t, polish, w) {
  const emoji = isEmoji(t); const len = [...t].length;
  const fs = Math.round(w * (emoji ? 0.55 : len <= 2 ? 0.5 : len <= 3 ? 0.36 : len <= 4 ? 0.3 : len <= 5 ? 0.25 : 0.2));
  return { type: 'div', props: { style: { width: w, height: w * 1.55, borderRadius: `${w / 2}px ${w / 2}px ${w * 0.4}px ${w * 0.4}px`, background: POLISH_HEX[polish] || POLISH_HEX[''], display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 24px rgba(43,33,64,0.18)', border: '2px solid rgba(43,33,64,0.08)' }, children: { type: 'span', props: { style: { fontFamily: 'Fredoka', fontWeight: 700, fontSize: fs, color: polish === 'ink' ? '#fff' : '#111', whiteSpace: 'nowrap' }, children: t } } } };
}

// Share image 1200 × 630: the hand, the phrase, the code, the wordmark.
export async function sharePng({ hand, answer, code, chapter }) {
  const w = 150;
  const el = { type: 'div', props: { style: { width: 1200, height: 630, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#FFF8FB', fontFamily: 'Fredoka', position: 'relative' }, children: [
    { type: 'div', props: { style: { display: 'flex', alignItems: 'flex-end', gap: 18 }, children: hand.map((n, i) => ({ type: 'div', props: { style: { display: 'flex', transform: `translateY(${[18, 4, 0, 6, 26][i]}px) rotate(${[-8, -3, 0, 3, 10][i]}deg)` }, children: nail(n.t, n.polish, i === 4 ? w * 0.85 : w) } })) } },
    { type: 'div', props: { style: { display: 'flex', fontSize: 54, color: '#2B2140', marginTop: 52, fontWeight: 700 }, children: `“${answer}”` } },
    { type: 'div', props: { style: { display: 'flex', gap: 24, fontSize: 24, color: '#8E819F', marginTop: 12 }, children: [{ type: 'span', props: { children: chapter } }, { type: 'span', props: { children: '·' } }, { type: 'span', props: { children: code } }] } },
    { type: 'div', props: { style: { position: 'absolute', bottom: 28, right: 40, fontSize: 26, color: '#D6335C', fontWeight: 700, letterSpacing: 2 }, children: 'READMYNAILS.COM' } },
  ] } };
  return png(el, 1200, 630);
}
export async function shareImage(args) {
  const buf = await sharePng(args);
  return new Response(buf, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400, s-maxage=604800' } });
}
