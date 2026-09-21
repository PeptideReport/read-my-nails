// The language layer. One thin wrapper around the Anthropic API plus the three jobs the engine gives it:
// write a chapter, pick sets for a customer, and (in trust.js) judge marks. Every function degrades cleanly without a key.
import Anthropic from '@anthropic-ai/sdk';
import { chapters, allSets } from './library';
import { isEmoji, tileCode } from './marks';

export const configured = () => !!process.env.ANTHROPIC_API_KEY;
const MODEL = () => process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';
let _client;
const client = () => (_client ||= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }));

// ask({system, user, maxTokens, json}) → text, or parsed JSON when json:true (tolerates fences and chatter).
export async function ask({ system, user, maxTokens = 1500, json = false, temperature = 0.7 }) {
  if (!configured()) throw new Error('AI is not configured. Add ANTHROPIC_API_KEY.');
  const req = { model: MODEL(), max_tokens: maxTokens, temperature, system, messages: [{ role: 'user', content: user }] };
  let r;
  try { r = await client().messages.create(req); }
  catch (e) {
    // Newer models can reject temperature in some modes; the request is still worth making without it.
    if (e?.status === 400 && /temperature/i.test(String(e?.message))) { delete req.temperature; r = await client().messages.create(req); } else throw e;
  }
  const text = r.content.filter(b => b.type === 'text').map(b => b.text).join('');
  if (!json) return text;
  const m = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/); if (!m) throw new Error('no json');
  return JSON.parse(m[0]);
}

const POLISHES = ['', 'pink', 'lilac', 'mint', 'sun', 'sky', 'ink'];
const LANG_NAME = { EN: 'English', ES: 'Spanish (Latin American, written natively — puns must work in Spanish, never translated from English)', PT: 'Brazilian Portuguese, written natively', VI: 'Vietnamese, written natively', TL: 'Tagalog/Taglish, written natively', FR: 'French, written natively', IT: 'Italian, written natively', HT: 'Haitian Creole, written natively', KO: 'Korean, written natively', JA: 'Japanese, written natively' };

export const HOUSE = `You write Read My Nails sets. A set is five fingernails, thumb to pinky, that read as one phrase, joke, pun or affirmation when the hand is held up. Each nail carries one MARK: a single letter, a short word (ideally 2–5 characters, never more than 7), a number, or one emoji used as a word (🐝 = "be", 👁️ = "I/eye", 🍯 = "honey", 2 = "to/too"). Rebus is the house sport: the reader should have to sound it out for a second, then smile.
Rules: nothing a mom would frown at. No brand names, product names, teams by name, fictional characters, celebrities, song lyrics, or slurs. Names of ordinary people, places, schools by mascot, dates and generic words are fine. Keep every mark printable on a fingernail: short, upper-case letters, standard emoji only (no flags-as-text, no skin-tone modifiers).
Polish is the base color under the print, chosen per nail from: "" (bare), pink, lilac, mint, sun, sky, ink. Alternate bare and one color so the hand reads; use ink (black polish) only for dark/alt themes. Emoji nails usually take a color.
Format each set as {"n": ["MARK|polish", ... five], "a": "the phrase as read aloud", "x": "optional one-line note for the host (empty string if none)"}. For a split set across two friends use {"sp": [[five], [five]], "w": ["Her", "You"], "a": "...", "x": ""}.`;

function examples(lang, n = 8) {
  const L = lang.toUpperCase();
  const pool = allSets().filter(s => s.lang === (L === 'EN' || L === 'ES' ? L : 'EN'));
  const pick = []; const step = Math.max(1, Math.floor(pool.length / n));
  for (let i = 0; i < pool.length && pick.length < n; i += step) { const s = pool[i]; pick.push(s.n ? { n: s.n, a: s.a, x: s.x || '' } : { sp: s.sp, w: s.w, a: s.a, x: s.x || '' }); }
  return pick;
}

// Normalize + validate what the model returned. Drops anything malformed.
export function normalizeSets(raw) {
  const out = [];
  for (const s of Array.isArray(raw) ? raw : raw?.sets || []) {
    const fix = hand => Array.isArray(hand) && hand.length === 5 ? hand.map(x => { const [m, p = ''] = String(x).split('|'); const mark = isEmoji(m.trim()) ? m.trim() : m.trim().toUpperCase().slice(0, 10); /* >7 prints small: the dashboard shows it, the eval flags it */ return mark + '|' + (POLISHES.includes(p.trim()) ? p.trim() : ''); }) : null;
    if (!s || !s.a) continue;
    if (s.n) { const n = fix(s.n); if (n && n.every(x => x.split('|')[0])) out.push({ n, a: String(s.a).slice(0, 60), x: String(s.x || '').slice(0, 120) }); }
    else if (s.sp && Array.isArray(s.sp) && s.sp.length === 2) { const a = fix(s.sp[0]), b = fix(s.sp[1]); if (a && b) out.push({ sp: [a, b], w: Array.isArray(s.w) && s.w.length === 2 ? s.w.map(w => String(w).slice(0, 12)) : ['Her', 'You'], a: String(s.a).slice(0, 60), x: String(s.x || '').slice(0, 120) }); }
  }
  return out;
}

// Chapter on demand. theme: "volleyball team, regionals, purple and gold". Returns { title, blurb, sets[] } (unscreened; caller screens).
export async function writeChapter({ theme, lang = 'EN', count = 12, audience = '', notes = '' }) {
  const L = lang.toUpperCase();
  const out = await ask({
    system: HOUSE + `\nLanguage for this chapter: ${LANG_NAME[L] || L}.`,
    user: `Write a chapter of ${Math.min(24, Math.max(4, count))} sets.\nTheme: ${theme}\n${audience ? 'Audience: ' + audience + '\n' : ''}${notes ? 'Notes from the salon: ' + notes + '\n' : ''}
Include at least two rebus sets, one split set for two friends if the theme allows, and vary polish. No two sets should say the same thing.
Here are sets from the existing library in this house style, for voice and format only (do not repeat them):\n${JSON.stringify(examples(L), null, 0)}
Answer with JSON only: {"title": "chapter title, 1–3 words", "blurb": "one line, 8–14 words, how the library describes chapters", "sets": [ ... ]}`,
    maxTokens: 4000, json: true, temperature: 0.9,
  });
  return { title: String(out.title || theme).slice(0, 40), blurb: String(out.blurb || '').slice(0, 120), sets: normalizeSets(out.sets), raw: Array.isArray(out.sets) ? out.sets : (out.sets?.sets || []) };
}

// "Say it for me": a customer tells the host three things; we return library set codes that fit plus up to two fresh sets.
export async function suggestSets({ loves = [], occasion = '', lang = 'en', max = 6 }) {
  const L = lang.toUpperCase() === 'ES' ? 'ES' : 'EN';
  const pool = allSets().filter(s => s.lang === L);
  const q = [...loves, occasion].join(' ').toLowerCase().split(/[^a-záéíóúñ0-9]+/).filter(w => w.length > 2);
  // cheap retrieval first: score by keyword overlap in answer/chapter/marks
  const scored = pool.map(s => { const txt = (s.a + ' ' + s.chapter.t + ' ' + (s.x || '') + ' ' + (s.n || s.sp?.flat() || []).join(' ')).toLowerCase(); return { s, score: q.reduce((n, w) => n + (txt.includes(w) ? 1 : 0), 0) }; }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 40);
  let picks = scored.slice(0, max).map(x => x.s.c); let fresh = [];
  if (configured()) {
    try {
      const out = await ask({
        system: HOUSE + `\nLanguage: ${LANG_NAME[L]}. You are helping a host pick sets for one customer.`,
        user: `The customer loves: ${loves.join('; ') || '(nothing given)'}. Occasion: ${occasion || 'none'}.
Candidate library sets (code — phrase): \n${scored.slice(0, 40).map(x => `${x.s.c} — ${x.s.a}`).join('\n') || '(none matched)'}
Pick up to ${max} candidate codes that truly fit, best first, and write up to 2 brand-new sets just for her.
Answer with JSON only: {"codes": ["EN-...."], "fresh": [ set objects ]}`,
        maxTokens: 900, json: true, temperature: 0.8,
      });
      if (Array.isArray(out.codes)) picks = out.codes.filter(c => pool.some(s => s.c === c)).slice(0, max);
      fresh = normalizeSets(out.fresh).slice(0, 2);
    } catch (e) {}
  }
  return { codes: picks, fresh };
}

// Chapter code for a salon-written chapter: EN-VBALL (5 letters from the title), unique per tenant handled by caller.
export function chapterCode(lang, title) {
  const base = String(title).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5).padEnd(5, 'X');
  return lang.toUpperCase().slice(0, 2) + '-' + base;
}

export { tileCode };
