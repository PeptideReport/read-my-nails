// The Read My Nails library, server-side. Same data the kiosk app carries.
import LIB from '../data/library.json';

export const LANGS = ['EN', 'ES', 'PT', 'VI'];
export { POLISH_NAME, POLISH_HEX, isEmoji, tileCode, splitPhrase } from './marks';
import { isEmoji, tileCode } from './marks';

export const slugify = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Chapters with URL slugs: /library/en/real-puzzles
export function chapters(lang) {
  return (LIB[lang] || []).map(c => ({ ...c, lang, slug: slugify(c.t), url: `/library/${lang.toLowerCase()}/${slugify(c.t)}` }));
}
export function allChapters() { return LANGS.flatMap(chapters); }

export function chapterBySlug(lang, slug) { return chapters(lang.toUpperCase()).find(c => c.slug === slug) || null; }

// Every set, flattened, with its chapter.
let _sets;
export function allSets() {
  if (!_sets) _sets = allChapters().flatMap(c => c.sets.map(s => ({ ...s, chapter: { t: c.t, code: c.code, slug: c.slug, url: c.url, s: c.s }, lang: c.lang, url: '/s/' + s.c })));
  return _sets;
}
export function setByCode(code) { return allSets().find(s => s.c === String(code).toUpperCase()) || null; }

// Nails of a set as [{t, polish}] per hand (split sets have two hands).
export function handsOf(set) {
  const parse = n => { const [t, polish = ''] = n.split('|'); return { t, polish }; };
  return set.n ? [set.n.map(parse)] : set.sp.map(h => h.map(parse));
}

export function stats() {
  const ch = allChapters(); const sets = allSets();
  const tiles = new Set(); sets.forEach(s => handsOf(s).flat().forEach(n => tiles.add(tileCode(n.t))));
  return { chapters: ch.length, en: chapters('EN').length, es: chapters('ES').length, sets: sets.length, tiles: tiles.size };
}

