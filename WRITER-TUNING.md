# Tuning the chapter writer — item (4)

The writer is `writeChapter()` in `lib/ai.js`: the HOUSE prompt, eight example sets pulled from the library, the theme, and a JSON contract. It has never run against a live key. This is the procedure for the first run and every run after.

## 0. Before the first run

- Put `ANTHROPIC_API_KEY` in `.env.local`. Model defaults to `claude-sonnet-5` (was `claude-sonnet-4-5`, two generations old — changed Sept 10). Override with `ANTHROPIC_MODEL`.
- Cost per chapter at 12 sets: roughly 1.5k input tokens (prompt + eight examples) and ~1.5k output → a couple of cents on Sonnet 5, about five on Opus 5. The panel of eight is under fifty cents. Run it as often as you like.
- The kiosk's "Say it for me," the trust screen and the host coach share `ask()`; the first eval run also proves the key, the model id and the JSON parsing for all of them.

## 1. Run the panel

```
npx --yes tsx scripts/chapter-eval.mjs
```

Eight themes, fixed, each chosen to test one thing (a team without a name, a place, overlap with an existing chapter, a kids' tone with a 5-letter note, an eras party that must not name the artist, Halloween without film titles, a Spanish quince court, a Spanish grandmother). Output lands in `eval/<timestamp>/REVIEW.md`.

`--dry` grades the hand-written library under the same rubric with no model call; `--dry --all` grades all 123 chapters. That is the bar: across 1,379 sets the library has 28 hard flags (all of them marks over 7 characters, the known long words), zero denylist hits, one repeated phrase, and about half a soft flag per set (6–7-character marks, a repeated word, ZWJ emoji). A writer run should land there: hard flags only for length, and not many.

## 2. Read it

The machine fills two columns per set — hard (breaks a rule) and soft (allowed but weak). You fill three: **Print?** (you'd put it on the kiosk), **Smile?** (the rebus landed), **Cut?**. Count at the end.

| Symptom | It's a… | Knob |
|---|---|---|
| Hard flags > 0 on any chapter | rules problem | Paste the failing set into HOUSE as a "never" example. One line. Don't rewrite the prompt. |
| Names an artist / brand / character | rules problem | Add the category to `data/denylist.json` *and* a HOUSE line. The screen catches it in production; the writer should not produce it. |
| Everything is correct and nothing smiles | voice problem | Examples, not instructions. `examples()` samples 8 sets evenly across the library; change it to sample from the two or three chapters whose voice you want (Real Puzzles, Slay Era, Besties) and raise `n` to 12. |
| Sets are literal (word · word · word · emoji · emoji) | voice problem | Same fix, plus raise the ask from "at least two rebus sets" to "at least half." |
| Sets repeat the library | retrieval problem | The prompt says "do not repeat them" only for the eight it showed. Pass the target chapter's existing phrases in `notes` ("already have: …") — the dashboard can do this for a salon rewriting its own chapter. |
| Spanish reads like translated English | voice problem | Give Spanish its own examples: `examples('ES')` already filters by language; check that ES chapters have enough rebus sets to sample from (they do — Acertijos has 14). |
| Marks over 5 letters when the notes said 5 | instruction-following | Put the length rule in the *user* turn next to the theme, not only in the system prompt. Notes from the salon are already injected there; make "keep marks to N letters" a first-class field. |
| Wrong count / blurb length / title length | format | Lower temperature from 0.9 to 0.7 for the structural fields, or ask for the sets first and the title/blurb in a second, cheaper call. |
| Same jokes every run | temperature | It's 0.9 already. Variety comes from examples and theme detail, not from temperature. |

Turn **one** knob, rerun the same panel, compare the two REVIEW.md files side by side. Keep every `eval/` folder; they are the record of what changed the voice.

## 3. Ship the voice

When a run scores at the library's bar on hard/soft and you print ≥60% and smile at ≥30%, freeze it: commit `lib/ai.js` and `data/denylist.json`, note the model id and the date at the top of HOUSE, and the dashboard "Write a chapter" button is live for salons. Salon-written chapters still pass through the screen and your approval; the writer's job is to make approval fast, not to skip it.

## 4. Things the eval cannot judge

- Whether the joke works on a hand held up across a table. Print the best two sets from each run on a practice tip.
- Native register in PT / VI. The eval's language panel is EN / ES; add PT / VI themes only after the native-reader brief comes back, and give those chapters to the same reader.
- Taste. The grader counts; you decide.
