// Pure helpers shared by server and browser — no library data in here, so client bundles stay small.
export const POLISH_NAME = { '': 'Bare', pink: 'Hot Pink', lilac: 'Lilac', mint: 'Mint', sun: 'Sunshine', sky: 'Sky', ink: 'Black' };
export const POLISH_HEX = { '': '#FFF1F6', pink: '#F27BA5', lilac: '#C9B6F0', mint: '#A9E6D6', sun: '#FFE0A3', sky: '#BFE0FA', ink: '#2B2140' };

// Same test the original engine used: a mark with no Latin letter, digit or punctuation is an emoji mark.
export const isEmoji = t => !/[A-Za-z0-9¿¡?!&=.'\/#>+%~→ÁÉÍÓÚÑáéíóúñ]/.test(t);

// Tile code: same scheme as the engine and the kiosk app.
export function tileCode(t) {
  if (t === '📷') return 'P-PHOTO';
  if (isEmoji(t)) return 'E-' + Array.from(t).map(c => c.codePointAt(0).toString(16)).join('_');
  // Mixed-case marks (element symbols like Ba, Ni) keep their case under an 'M' type so they never collide with the upper-case word.
  const mixed = /[a-z]/.test(t) && t !== t.toLowerCase();
  const src = mixed ? t : t.toUpperCase();
  // Legacy code units (surrogate halves, FE0F, 20E3) stay '_' so the 1,671 shipped tile names never change; new letters get _u<hex>.
  const s = src.replace(/[^A-Za-z0-9ÁÉÍÓÚÑ]/g, m => { const c = m.charCodeAt(0); if ((c >= 0xd800 && c <= 0xdfff) || c === 0xfe0f || c === 0x20e3) return '_'; return { '?': 'Q', '!': 'X', '&': 'AND', '=': 'EQ', '.': 'DOT', "'": '', '/': 'SL', '#': 'NUM', '>': 'GT', '+': 'PLUS', '%': 'PCT', '~': 'TLD', '→': 'ARR', '¿': 'IQ', '¡': 'IX', ' ': '_' }[m] ?? ('_u' + c.toString(16)); });
  const type = mixed ? 'M' : /^[0-9]+$/.test(t) ? 'N' : t.length === 1 ? 'L' : 'W';
  return type + '-' + s;
}


// Split a phrase into ≤5 nail marks for the generator: words stay whole, emoji stand alone, long words get hyphen-free chunks.
export function splitPhrase(phrase, max = 5) {
  const raw = String(phrase).trim().split(/\s+/).filter(Boolean);
  const parts = [];
  for (const w of raw) {
    // separate emoji glued to words
    const segs = w.match(/\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*|[^\p{Extended_Pictographic}]+/gu) || [w];
    parts.push(...segs);
  }
  // too many parts: merge shortest neighbours; too few: split long words
  while (parts.length > max) {
    let bi = 0, best = Infinity;
    for (let i = 0; i < parts.length - 1; i++) { const l = parts[i].length + parts[i + 1].length; if (!isEmoji(parts[i]) && !isEmoji(parts[i + 1]) && l < best) { best = l; bi = i; } }
    if (best === Infinity) { parts.splice(max); break; }
    parts.splice(bi, 2, parts[bi] + parts[bi + 1]);
  }
  while (parts.length < max) {
    let li = -1, ll = 0; parts.forEach((p, i) => { if (!isEmoji(p) && p.length > ll) { ll = p.length; li = i; } });
    if (li < 0 || ll < 4) { parts.push('✨'); continue; }
    const cut = Math.ceil(ll / 2); parts.splice(li, 1, parts[li].slice(0, cut), parts[li].slice(cut));
  }
  return parts.map(p => isEmoji(p) ? p : p.toUpperCase());
}
