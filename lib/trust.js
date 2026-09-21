// The trust layer. House rule: nothing a mom would frown at, nothing that is someone else's trademark or character.
// Two passes: a local denylist (instant, free) and, when a key is present, a model judgment cached by phrase.
import DENY from '../data/denylist.json';
import { sb } from './supabase';
import { ask } from './ai';

const CATS = ['brand', 'character', 'celebrity', 'profanity', 'sexual', 'substances', 'hate', 'selfharm', 'weapons'];
const norm = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

// Local pass. Returns [{mark, category, term}] — empty means clean as far as the list knows.
export function localScreen(marks) {
  const phrase = norm(marks.join(' '));
  const flags = [];
  const allowed = DENY.allow.some(a => phrase.includes(a));
  const hit = term => new RegExp('(^|[^a-z0-9])' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + 's?([^a-z0-9]|$)').test(phrase);
  for (const cat of CATS) {
    for (const term of DENY[cat]) {
      if (hit(term)) {
        if (allowed && ['brand'].includes(cat)) continue; // "apple pie" is not Apple
        const mark = marks.find(m => norm(m).includes(term)) || marks.join(' ');
        flags.push({ mark, category: cat, term });
      }
    }
  }
  return flags;
}

const REASONS = {
  brand: 'a brand or team name', character: 'a character someone else owns', celebrity: 'a real person\'s name', profanity: 'language we don\'t print',
  sexual: 'something we keep off nails', substances: 'something we keep off nails', hate: 'hate', selfharm: 'something we don\'t print', weapons: 'something we don\'t print', taste: 'something a mom would frown at',
};
export const reasonFor = f => REASONS[f.category] || 'house rules';

// Full screen: local list, then the model when configured, cached by normalized phrase.
// Returns { ok, flags: [{mark, category, term?, note?}], source: 'local'|'model'|'cache'|'none' }
export async function screenMarks(marks, { lang = 'en', context = '' } = {}) {
  const clean = (marks || []).map(m => String(m || '').trim()).filter(Boolean);
  if (!clean.length) return { ok: true, flags: [], source: 'none' };
  const local = localScreen(clean);
  if (local.length) return { ok: false, flags: local, source: 'local' };
  if (!process.env.ANTHROPIC_API_KEY) return { ok: true, flags: [], source: 'local' };

  const key = norm(clean.join(' | ')).slice(0, 200);
  const db = sb();
  try {
    const { data } = await db.from('screen_cache').select('verdict').eq('mark_key', key).maybeSingle();
    if (data?.verdict) return { ...data.verdict, source: 'cache' };
  } catch (e) {}

  let verdict = { ok: true, flags: [] };
  try {
    const out = await ask({
      system: `You screen short marks that will be printed on fingernails at a family-friendly salon. Language: ${lang}. ${context}
Flag a mark ONLY if it is: a trademark, brand, team, or product name; a fictional character someone owns; a real living person's name (celebrities, athletes, politicians); profanity or slurs in any language; sexual content; drugs or alcohol references; hate; self-harm; weapons/violence. Names of ordinary people (SOFIA, MRS SMITH), places, dates, schools by mascot, generic words (QUEEN, SLAY, BOSS), affirmations, emoji, and mild attitude (NOT A PHASE, IN MY VILLAIN ERA) are fine.
Answer with JSON only: {"ok": true|false, "flags": [{"mark": "...", "category": "brand|character|celebrity|profanity|sexual|substances|hate|selfharm|weapons|taste", "note": "six words max"}]}`,
      user: 'Marks, one per nail, in order:\n' + clean.map((m, i) => `${i + 1}. ${m}`).join('\n'),
      maxTokens: 300, json: true,
    });
    if (out && typeof out.ok === 'boolean') verdict = { ok: out.ok, flags: Array.isArray(out.flags) ? out.flags.slice(0, 5) : [] };
  } catch (e) { /* model down → local verdict stands */ }
  try { await db.from('screen_cache').upsert({ mark_key: key, verdict }); } catch (e) {}
  return { ...verdict, source: 'model' };
}

// One-line message for a customer or host.
export function explainFlags(flags, lang = 'en') {
  const f = flags[0]; if (!f) return '';
  const what = f.mark ? `“${f.mark}”` : (lang === 'es' ? 'eso' : 'that');
  return lang === 'es' ? `${what} no se puede imprimir aquí (${reasonFor(f)}). Prueba otra palabra.` : `${what} can't go on a nail here — ${reasonFor(f)}. Try another word.`;
}
