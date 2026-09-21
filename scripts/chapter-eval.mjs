// Chapter writer evaluation. Runs the engine's writeChapter() over a fixed panel of themes, grades every set against the
// house rules, and writes a review sheet for a human read. This is how the voice gets tuned: run, read, turn one knob, run again.
//
//   npx --yes tsx scripts/chapter-eval.mjs            # live: needs ANTHROPIC_API_KEY (and optional ANTHROPIC_MODEL) in .env.local
//   npx --yes tsx scripts/chapter-eval.mjs --dry      # no key: grades 11 library chapters (baseline + proves the grader); --dry --all grades all 123
//   npx --yes tsx scripts/chapter-eval.mjs --panel my-panel.json --count 12
//
// Output: eval/<timestamp>/chapters.json (raw), grades.json, REVIEW.md (read this one).

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const flag = n => args.includes(n);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const DRY = flag('--dry');
const COUNT = Number(opt('--count', 12));

// .env.local → process.env (Next does this for the app; scripts have to do it themselves)
for (const f of ['.env.local', '.env']) if (fs.existsSync(f)) for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const { writeChapter, configured, normalizeSets } = await import('../lib/ai.js');
const { allSets } = await import('../lib/library.js');
const { isEmoji } = await import('../lib/marks.js');
const DENY = JSON.parse(fs.readFileSync('data/denylist.json', 'utf8'));

// ---- the panel -------------------------------------------------------------------------------------------------------
// Each theme tests something. Keep the panel stable between runs so scores are comparable.
const DEFAULT_PANEL = [
  { lang: 'EN', theme: 'volleyball team, regionals, purple and gold', tests: 'the documented example; team without a name' },
  { lang: 'EN', theme: 'bride tribe bachelorette weekend in Nashville', tests: 'places are allowed; split sets for friends' },
  { lang: 'EN', theme: 'nurses week', audience: 'ER and L&D nurses', tests: 'overlap with the existing Nurses chapter — should not repeat it' },
  { lang: 'EN', theme: '13th birthday sleepover', audience: 'the birthday girl and five friends', notes: 'short nails, keep marks to 5 letters', tests: 'kids tone; the 5-letter note' },
  { lang: 'EN', theme: 'eras-themed party for a pop-star fan', tests: 'must not name the artist, albums or lyrics' },
  { lang: 'EN', theme: 'Halloween girls night', tests: 'seasonal; no characters or brands (no film names)' },
  { lang: 'ES', theme: 'quinceañera, corte de honor, tema mariposas', tests: 'Spanish written as Spanish; a court split set' },
  { lang: 'ES', theme: 'Día de las Madres para abuela', tests: 'family register in Spanish; no translation-ese' },
];
const panel = opt('--panel') ? JSON.parse(fs.readFileSync(opt('--panel'), 'utf8')) : DEFAULT_PANEL;

// ---- grading ---------------------------------------------------------------------------------------------------------
const POLISHES = ['', 'pink', 'lilac', 'mint', 'sun', 'sky', 'ink'];
const norm = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
const hit = (phrase, term) => new RegExp('(^|[^a-z0-9])' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + 's?([^a-z0-9]|$)').test(phrase);
let LIB_PHRASES = new Set(allSets().map(s => norm(s.a)));
let LIB_HANDS = new Set(allSets().map(s => (s.n || s.sp?.[0] || []).map(x => x.split('|')[0]).join(' ')));
const handKey = s => (s.n || s.sp?.[0] || []).map(x => x.split('|')[0]).join(' ');

function gradeSet(s, seen) {
  const hard = [], soft = [];
  if (!s || typeof s !== 'object') return { hard: ['not an object'], soft: [], rebus: false, split: false };
  const hands = Array.isArray(s.n) ? [s.n] : (Array.isArray(s.sp) ? s.sp.filter(Array.isArray) : []);
  if (!hands.length) hard.push('no nails');
  for (const hand of hands) {
    if (hand.length !== 5) hard.push(`${hand.length} nails, not five`);
    const pol = [];
    for (const x of hand) {
      const [m, p = ''] = String(x).split('|'); pol.push(p);
      if (!m) hard.push('empty mark');
      else if (isEmoji(m)) {
        if (/[\u{1F3FB}-\u{1F3FF}]/u.test(m)) hard.push(`skin-tone modifier: ${m}`);
        if (/‍/.test(m)) soft.push(`ZWJ sequence may not render on the tile: ${m}`);
        else if ([...m.replace(/️/g, '')].length > 2) soft.push(`more than one emoji on a nail: ${m}`);
      } else {
        const len = [...m].length;
        if (len > 7) hard.push(`mark over 7 chars: ${m}`);
        else if (len > 5) soft.push(`mark ${len} chars (small on a short nail): ${m}`);
        if (m !== m.toUpperCase()) soft.push(`not upper case: ${m}`);
      }
      if (!POLISHES.includes(p)) hard.push(`bad polish: ${p}`);
    }
    if (new Set(pol).size === 1) soft.push('all five nails the same polish');
  }
  const marks = hands.flat().map(x => x.split('|')[0]);
  const phrase = norm(marks.join(' ') + ' ' + s.a);
  for (const cat of Object.keys(DENY)) { if (cat[0] === '_' || cat === 'allow') continue; for (const term of DENY[cat]) if (hit(phrase, norm(term))) hard.push(`denylist ${cat}: ${term}`); }
  if (!s.a || norm(s.a).length < 2) hard.push('no phrase');
  const key = norm(s.a);
  if (!hands.every(h => h.every(x => typeof x === 'string'))) hard.push('non-string mark');
  if (seen.has(key)) soft.push('same phrase as another set in this chapter'); seen.add(key);
  if (LIB_PHRASES.has(key)) soft.push('phrase already in the library');
  if (LIB_HANDS.has(handKey(s))) hard.push('identical hand already in the library');
  // rebus: an emoji or number stands in for a word, i.e. the phrase has a word the letters alone do not spell
  const letters = norm(marks.filter(m => !isEmoji(m)).join(' ')).replace(/[^a-z0-9]/g, '');
  const rebus = marks.some(m => isEmoji(m) || /^\d+$/.test(m)) && key.split(' ').some(w => w.length > 1 && !letters.includes(w.replace(/[^a-z0-9]/g, '')));
  const words = marks.filter(m => !isEmoji(m) && /[a-z0-9]/i.test(m));
  const repeated = new Set(words).size < words.length;
  if (repeated) soft.push('a word repeats on two nails');
  return { hard, soft, rebus, split: !!s.sp };
}

function gradeChapter(ch, req) {
  const seen = new Set();
  const sets = (ch.sets || []).map(s => ({ set: s, g: gradeSet(s, seen) }));
  const words = String(ch.blurb || '').trim().split(/\s+/).filter(Boolean).length;
  const chapterFlags = [];
  if (sets.length !== req.count) chapterFlags.push(`${sets.length} sets returned, ${req.count} asked`);
  if (String(ch.title || '').split(/\s+/).length > 3) chapterFlags.push('title over 3 words');
  if (words < 8 || words > 14) chapterFlags.push(`blurb ${words} words (asked 8–14)`);
  const rebus = sets.filter(x => x.g.rebus).length;
  if (rebus < 2) chapterFlags.push(`${rebus} rebus set(s), asked for at least two`);
  const hard = sets.reduce((n, x) => n + x.g.hard.length, 0), soft = sets.reduce((n, x) => n + x.g.soft.length, 0);
  return { sets, chapterFlags, hard, soft, rebus, split: sets.some(x => x.g.split), n: sets.length };
}

// ---- run -------------------------------------------------------------------------------------------------------------
const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
const dir = path.join('eval', stamp + (DRY ? '-dry' : ''));
if (!DRY && !configured()) { console.error('No ANTHROPIC_API_KEY. Put it in .env.local, or run with --dry.'); process.exit(1); }
fs.mkdirSync(dir, { recursive: true });
const results = [];

if (DRY) {
  // Baseline: how the hand-written library scores under the same rubric. Also proves the grader runs.
  const { chapters } = await import('../lib/library.js');
  const ALL = flag('--all'); // --all grades every chapter (123); default samples 11 for a quick read
  for (const lang of ['EN', 'ES', 'PT', 'VI']) for (const c of (ALL ? chapters(lang) : chapters(lang).slice(0, lang === 'EN' ? 6 : 3))) {
    const ch = { title: c.t, blurb: c.s, sets: c.sets };
    // grade the chapter against the rest of the library, not against itself
    const own = new Set(c.sets.map(x => norm(x.a))), ownH = new Set(c.sets.map(handKey));
    const P = LIB_PHRASES, H = LIB_HANDS; LIB_PHRASES = new Set([...P].filter(k => !own.has(k))); LIB_HANDS = new Set([...H].filter(k => !ownH.has(k)));
    const grade = gradeChapter(ch, { count: c.sets.length }); LIB_PHRASES = P; LIB_HANDS = H;
    results.push({ req: { lang, theme: c.t, count: c.sets.length, tests: 'library baseline' }, ch, grade, ms: 0 });
  }
} else {
  console.log('model:', process.env.ANTHROPIC_MODEL || '(default in lib/ai.js)');
  for (const req of panel) {
    const t0 = Date.now(); let ch, err = null;
    try { ch = await writeChapter({ theme: req.theme, lang: req.lang, count: COUNT, audience: req.audience, notes: req.notes }); }
    catch (e) { err = String(e.message || e); ch = { title: '', blurb: '', sets: [] }; }
    const ms = Date.now() - t0;
    // Grade what the model wrote, not what normalizeSets() cleaned up — the rules the panel tests must be able to fail.
    const graded = { ...ch, sets: ch.raw && ch.raw.length ? ch.raw : ch.sets };
    const grade = gradeChapter(graded, { count: COUNT });
    results.push({ req: { ...req, count: COUNT }, ch: graded, grade, ms, err });
    console.log(`${req.lang} "${req.theme}" → ${grade.n} sets, ${grade.hard} hard, ${grade.soft} soft, ${grade.rebus} rebus, ${Math.round(ms / 1000)}s${err ? '  ERROR ' + err : ''}`);
  }
}

fs.writeFileSync(path.join(dir, 'chapters.json'), JSON.stringify(results.map(r => ({ req: r.req, ch: r.ch, ms: r.ms, err: r.err })), null, 1));
fs.writeFileSync(path.join(dir, 'grades.json'), JSON.stringify(results.map(r => ({ theme: r.req.theme, lang: r.req.lang, ...r.grade, sets: r.grade.sets.map(x => ({ a: x.set.a, hard: x.g.hard, soft: x.g.soft, rebus: x.g.rebus })) })), null, 1));

// ---- review sheet ----------------------------------------------------------------------------------------------------
const L = [];
L.push(`# Chapter writer review — ${stamp}${DRY ? ' (library baseline, no model call)' : ''}`);
L.push('');
L.push(`Model: ${DRY ? '—' : (process.env.ANTHROPIC_MODEL || 'default in lib/ai.js')} · sets per chapter: ${DRY ? 'as written' : COUNT} · temperature: 0.9 (lib/ai.js writeChapter)`);
L.push('');
L.push('**Hard** = breaks a house rule, would be cut by the screen or fail to print. **Soft** = allowed but weak. The machine grades those two. You grade the third column: would you print it, and did it make you smile.');
L.push('');
L.push('| # | Lang | Theme | Sets | Hard | Soft | Rebus | Split | Time | Tests |');
L.push('|---|---|---|---|---|---|---|---|---|---|');
results.forEach((r, i) => L.push(`| ${i + 1} | ${r.req.lang} | ${r.req.theme} | ${r.grade.n} | ${r.grade.hard} | ${r.grade.soft} | ${r.grade.rebus} | ${r.grade.split ? 'yes' : 'no'} | ${r.ms ? Math.round(r.ms / 1000) + 's' : '—'} | ${r.req.tests || ''} |`));
L.push('');
results.forEach((r, i) => {
  L.push(`## ${i + 1}. ${r.req.lang} — ${r.req.theme}`);
  L.push('');
  L.push(`**${r.ch.title || '(no title)'}** — ${r.ch.blurb || '(no blurb)'}${r.err ? `\n\n**ERROR:** ${r.err}` : ''}`);
  if (r.grade.chapterFlags.length) L.push('\nChapter flags: ' + r.grade.chapterFlags.join(' · '));
  L.push('');
  L.push('| Nails (thumb → pinky) | Reads as | Host note | Machine | Print? | Smile? | Cut? |');
  L.push('|---|---|---|---|---|---|---|');
  for (const { set, g } of r.grade.sets) {
    const mk = h => (Array.isArray(h) ? h : []).map(x => String(x).split('|')[0]).join(' · ');
    const nails = Array.isArray(set?.n) ? mk(set.n) : Array.isArray(set?.sp) ? set.sp.map((h, j) => `${set.w?.[j] || ''}: ${mk(h)}`).join(' / ') : '(malformed)';
    const machine = [...g.hard.map(h => '**' + h + '**'), ...g.soft].join('; ') || (g.rebus ? 'rebus' : '');
    L.push(`| ${nails} | ${set?.a || ''} | ${set?.x || ''} | ${machine} | ☐ | ☐ | ☐ |`);
  }
  L.push('');
});
L.push('## What to do with this');
L.push('');
L.push('Fill the three boxes per set, then count. Under 60% "print" or under 30% "smile" is a voice problem, not a rules problem — see WRITER-TUNING.md for which knob to turn. Hard flags above zero on any chapter are a prompt problem: quote the failing set back into the HOUSE prompt as a "never" example.');
fs.writeFileSync(path.join(dir, 'REVIEW.md'), L.join('\n'));
console.log('\nwrote', dir + '/REVIEW.md');
