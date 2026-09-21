// The Read My Nails Library — quick-reference PDF for salons (the dashboard download).
// One HTML → Chromium → PDF. Every set: hand, phrase, code, and the five tile codes + polish the host taps.
// Usage: node scripts/reference-pdf.js [out.pdf]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const L = JSON.parse(fs.readFileSync(path.join(root, 'data/library.json'), 'utf8'));
const fontF = fs.readFileSync(path.join(root, 'assets/Fredoka-Bold.ttf')).toString('base64');
const fontN = fs.readFileSync(path.join(root, 'assets/Nunito-Black.ttf')).toString('base64');
const fontNr = fs.readFileSync(path.join(root, '..', 'zip/engine/fonts/Nunito.ttf')).toString('base64');
const isEmoji = t => !/[A-Za-z0-9¿¡?!&=.'\/#>+%~→ÁÉÍÓÚÑáéíóúñ]/.test(t);
function tileCode(t) {
  if (t === '📷') return 'P-PHOTO';
  if (isEmoji(t)) return 'E-' + Array.from(t).map(c => c.codePointAt(0).toString(16)).join('_');
  const mixed = /[a-z]/.test(t) && t !== t.toLowerCase(); const src = mixed ? t : t.toUpperCase();
  const s = src.replace(/[^A-Za-z0-9ÁÉÍÓÚÑ]/g, m => { const c = m.charCodeAt(0); if ((c >= 0xd800 && c <= 0xdfff) || c === 0xfe0f || c === 0x20e3) return '_'; return { '?': 'Q', '!': 'X', '&': 'AND', '=': 'EQ', '.': 'DOT', "'": '', '/': 'SL', '#': 'NUM', '>': 'GT', '+': 'PLUS', '%': 'PCT', '~': 'TLD', '→': 'ARR', '¿': 'IQ', '¡': 'IX', ' ': '_' }[m] ?? ('_u' + c.toString(16)); });
  return (mixed ? 'M' : /^[0-9]+$/.test(t) ? 'N' : t.length === 1 ? 'L' : 'W') + '-' + s;
}
const POL = { '': 'Bare', pink: 'Hot Pink', lilac: 'Lilac', mint: 'Mint', sun: 'Sunshine', sky: 'Sky', ink: 'Black' };
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
const LANGN = { EN: 'English', ES: 'Español', PT: 'Português', VI: 'Tiếng Việt' };

function nail(spec) { const [t, c = ''] = spec.split('|'); const cls = 'nail' + (c ? ' ' + c : ''); const len = [...t].length; const inner = isEmoji(t) ? `<span class="e">${esc(t)}</span>` : `<span class="w ${len >= 6 ? 'xs' : len >= 4 ? 's' : len >= 3 ? 'm' : ''}">${esc(t)}</span>`; return `<div class="${cls}">${inner}</div>`; }
function hand(arr) { return `<div class="hand">${arr.map(nail).join('')}</div>`; }
function recipe(arr) { return arr.map(x => { const [t, c = ''] = x.split('|'); return `<span>${esc(tileCode(t))}<i>${POL[c] || 'Bare'}</i></span>`; }).join(''); }
function set(s) {
  const body = s.n ? hand(s.n) : `<div class="split"><div><b>${esc(s.w?.[0] || 'Her')}</b>${hand(s.sp[0])}</div><div><b>${esc(s.w?.[1] || 'You')}</b>${hand(s.sp[1])}</div></div>`;
  const rec = s.n ? recipe(s.n) : recipe(s.sp[0]) + '<span class="sep">/</span>' + recipe(s.sp[1]);
  return `<div class="set"><div class="top"><span class="code">${esc(s.c)}</span>${s.x ? `<span class="note">${esc(s.x)}</span>` : ''}</div>${body}<div class="ans">“${esc(s.a)}”</div><div class="rec">${rec}</div></div>`;
}
const langs = Object.keys(L).filter(k => L[k].length);
const totals = { chapters: langs.reduce((n, k) => n + L[k].length, 0), sets: langs.reduce((n, k) => n + L[k].reduce((m, c) => m + c.sets.length, 0), 0) };
const tiles = new Set(); langs.forEach(k => L[k].forEach(c => c.sets.forEach(s => (s.n || s.sp.flat()).forEach(x => tiles.add(tileCode(x.split('|')[0]))))));

const css = `
@font-face{font-family:F;src:url(data:font/ttf;base64,${fontF});font-weight:700}
@font-face{font-family:NB;src:url(data:font/ttf;base64,${fontN});font-weight:900}
@font-face{font-family:N;src:url(data:font/ttf;base64,${fontNr});font-weight:200 900}
@page{size:Letter;margin:0.5in 0.45in 0.55in 0.45in}
*{box-sizing:border-box}body{font-family:N,'Noto Color Emoji',sans-serif;color:#2B2140;font-size:9.5pt;line-height:1.35;margin:0}
h1{font-family:NB;font-size:28pt;margin:0 0 6pt;letter-spacing:-.02em}
h2{font-family:NB;font-size:15pt;margin:0 0 2pt;display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #EDE4F1;padding-bottom:3pt}
h2 .cc{font-family:N;font-weight:800;font-size:7.5pt;color:#9C93AC;letter-spacing:.08em}
.blurb{color:#6A5E80;margin:2pt 0 8pt;font-size:9pt}
.cover{height:9.4in;display:flex;flex-direction:column;justify-content:space-between;page-break-after:always}
.cover .big{font-family:NB;font-size:46pt;line-height:.95;letter-spacing:-.03em;margin:30pt 0 8pt}.cover .big span{color:#D6335C}
.cover .lede{font-size:13pt;color:#6A5E80;max-width:48ch}
.brand{font-family:F;font-size:18pt;color:#F27BA5;letter-spacing:.04em}.brand small{display:block;font-family:N;font-weight:900;font-size:7.5pt;letter-spacing:.2em;text-transform:uppercase;color:#9C7FD6;margin-top:2pt}
.stats{display:flex;gap:26pt;margin-top:16pt}.stats b{display:block;font-family:NB;font-size:22pt}.stats span{font-size:8.5pt;color:#6A5E80}
.how{page-break-after:always}.how p{max-width:72ch;margin:0 0 7pt}.how h3{font-family:NB;font-size:12pt;margin:12pt 0 3pt;color:#8E4F5A}
.toc{columns:3;column-gap:16pt;font-size:8.5pt;page-break-after:always}.toc h3{column-span:all;font-family:NB;font-size:12pt;margin:8pt 0 4pt}.toc a{display:flex;justify-content:space-between;color:inherit;text-decoration:none;border-bottom:1px dotted #E6DCEB;padding:1.5pt 0}.toc a i{font-style:normal;color:#9C93AC;font-family:N;font-size:7.5pt}
.chapter{page-break-before:always}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:7pt 10pt}
.set{border:1px solid #EFE6F1;border-radius:8pt;padding:5pt 7pt 6pt;page-break-inside:avoid;background:#fff}
.top{display:flex;justify-content:space-between;gap:6pt;font-size:7pt;color:#9C93AC}.top .code{font-family:N;font-weight:900;letter-spacing:.05em;color:#D6335C}.top .note{font-style:italic;text-align:right}
.hand{display:flex;gap:3pt;align-items:flex-end;justify-content:center;padding:5pt 0 1pt}
.nail{width:24pt;height:36pt;border-radius:12pt 12pt 9pt 9pt;background:#FFF1F6;border:1px solid #E9D9E2;display:flex;align-items:center;justify-content:center;overflow:hidden}
.nail:nth-child(1){transform:translateY(3pt) rotate(-7deg)}.nail:nth-child(2){transform:translateY(1pt) rotate(-3deg)}.nail:nth-child(4){transform:translateY(1pt) rotate(3deg)}.nail:nth-child(5){transform:translateY(4pt) rotate(8deg);width:20pt;height:31pt}
.nail.pink{background:#F27BA5}.nail.lilac{background:#C9B6F0}.nail.mint{background:#A9E6D6}.nail.sun{background:#FFE0A3}.nail.sky{background:#BFE0FA}.nail.ink{background:#2B2140}
.nail .w{font-family:F,NB,sans-serif;font-weight:700;font-size:8.5pt;color:#111;white-space:nowrap}.nail .w.m{font-size:6.5pt}.nail .w.s{font-size:5.2pt}.nail .w.xs{font-size:4.2pt}.nail.ink .w{color:#fff}
.nail .e{font-family:'Noto Color Emoji';font-size:11pt}
.split{display:flex;gap:6pt;justify-content:center}.split b{display:block;text-align:center;font-size:6.5pt;color:#9C93AC;font-weight:800}
.ans{font-family:NB;font-size:9.5pt;text-align:center;margin:2pt 0 3pt}
.rec{display:flex;flex-wrap:wrap;gap:2pt 6pt;justify-content:center;font-size:6pt;color:#6A5E80;font-family:N}.rec span{white-space:nowrap}.rec i{font-style:normal;color:#B9AFC6;margin-left:2pt}.rec .sep{color:#D6335C}
.foot{position:fixed;bottom:-0.35in;left:0;right:0;font-size:7pt;color:#B9AFC6;display:flex;justify-content:space-between}
`;

let html = `<!doctype html><html><head><meta charset="utf-8"><title>Read My Nails — Library</title><style>${css}</style></head><body>`;
html += `<section class="cover"><div><div class="brand">READ MY NAILS<small>the library · quick reference</small></div><div class="big">Every set.<br>Every code.<br><span>Five nails at a time.</span></div><p class="lede">The whole library for the counter and the printer: each set drawn, its phrase, its code, and the five tile codes and polish the host taps. Search this PDF by code, phrase or chapter.</p><div class="stats"><div><b>${totals.sets.toLocaleString()}</b><span>sets</span></div><div><b>${totals.chapters}</b><span>chapters</span></div><div><b>${tiles.size.toLocaleString()}</b><span>print tiles</span></div><div><b>${langs.length}</b><span>languages</span></div></div></div><div><p style="font-size:8.5pt;color:#9C93AC;max-width:60ch">Licensed to one location under the Read My Nails subscription. Not for resale or redistribution. SeamlessLift LLC, Naples, Florida · readmynails.com · edition ${new Date().toISOString().slice(0, 10)}</p></div></section>`;
html += `<section class="how"><h1>How to read a set</h1>
<h3>The code</h3><p><b>EN-BRIDE-03</b> is language, chapter, number. Customers say the code at the counter or send it from readmynails.com; the host finds it here or in the kiosk queue.</p>
<h3>The five nails</h3><p>Thumb to pinky, left to right, as the customer sees her own hand held up. Each nail is one mark: a letter, a short word, a number or an emoji used as a word (🐝 = be, 👁️ = I, 🍯 = honey, 2 = to). The polish color under the print is shown on each nail; <b>Bare</b> means no color.</p>
<h3>The recipe line</h3><p>Under every set: the five tile codes in order, each with its polish. Tile codes are the file names in your printer (<b>W-SLAY.png</b>, <b>E-1f41d.png</b>). Tap them in order. <b>P-PHOTO</b> means the customer's own photo goes on that nail.</p>
<h3>Split sets</h3><p>Two hands that read together across two people (Her / You, Big / Little). The recipe shows both hands separated by a slash.</p>
<h3>Custom nails</h3><p>Any nail can be changed at the kiosk ("Make it mine"). New words render as new tiles from the generator at readmynails.com/generator, in the same format.</p>
<h3>Polish names</h3><p>Bare · Hot Pink · Lilac · Mint · Sunshine · Sky · Black. Match them to your own rack in the kiosk's Settings; the recipe uses the library's names.</p></section>`;
html += `<section class="toc"><h3>Contents</h3>`;
for (const k of langs) { html += `<h3>${LANGN[k] || k}</h3>` + L[k].map(c => `<a href="#${c.code}"><span>${esc(c.t)}</span><i>${c.code} · ${c.sets.length}</i></a>`).join(''); }
html += `</section>`;
for (const k of langs) for (const c of L[k]) {
  html += `<section class="chapter" id="${c.code}"><h2><span>${esc(c.t)}</span><span class="cc">${LANGN[k] || k} · ${c.code} · ${c.sets.length} sets</span></h2><p class="blurb">${esc(c.s)}</p><div class="grid">${c.sets.map(set).join('')}</div></section>`;
}
html += `<div class="foot"><span>Read My Nails — Library</span><span>readmynails.com</span></div></body></html>`;

(async () => {
  const out = process.argv[2] || path.join(root, '..', 'Read-My-Nails-Library.pdf');
  fs.writeFileSync(path.join(root, '..', 'library-reference.html'), html);
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await b.newPage();
  await p.setContent(html, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: out, format: 'Letter', printBackground: true, preferCSSPageSize: true });
  await b.close();
  console.log('wrote', out);
})();
