# Read My Nails Engine — developer handoff (v2.3, September 9, 2026)

For Syed Faisal Hussain, deploying on behalf of Scott DelBoccio / Read My Nails, Inc. Read this first, then `README.md` for the click-through.

## 1. What this is

One Next.js 14 (App Router, JavaScript, no TypeScript) application that is, at once: the public site (EN/ES landing, 1,379 prerendered set pages, 123 chapter pages, salon directory, buyer's guide), a Stripe-subscription SaaS (three tiers, dashboard, downloads), a multi-tenant kiosk app served at `/k/<salon>`, and an "engine" of AI-backed services (chapter writer, suggestions, trust screen, host coach, photo looks, tile renderer, try-on). Data in Supabase (Postgres + Auth + Storage). Hosted on Vercel. Emails via Resend, SMS via Twilio (optional), model calls via Anthropic.

Everything compiles clean (`next build`, 1,543 pages). **Nothing has been run against live Stripe, Supabase, Anthropic, Resend or Twilio accounts.** Section 6 is the test plan that closes that gap.

## 2. Repo map

```
app/                      routes (App Router)
  page.js, es/page.js     landing EN / ES
  library/                /library, /library/[lang]/[chapter]
  s/[code]/               set pages (SSG for library codes, dynamic for network chapters)
  salons/, party/[id]/    directory + salon profile, party links
  generator/, creators/   licensee generator; public creator submissions
  login/, welcome/, dashboard/
  terms/, privacy/, guides/, nail-printers/route.js (serves data/nail-printer-review.html)
  sitemap.js, robots.js
  api/
    subscribe/, subscribe/session/, stripe-webhook/, billing-portal/
    me/, me/pin/, me/location/            dashboard (bearer = Supabase Auth JWT)
    orders/, bookings/, settings/, checkout/   kiosk (x-tenant header; host actions need x-kiosk-pin)
    salons/, party/, qr/, og/[code]/      public
    tile/, generator/zip/, photo/         licensee / kiosk
    ai/chapter/, ai/suggest/, ai/screen/, ai/host/   language + trust layers
    creators/                             public submissions
    cron/onboarding/                      daily drip (vercel.json)
components/               React client components (Hand, Subscribe, SendToSalon, Share, TryOn, SalonMap, PartyMaker, ChapterWriter, CreatorForm, Site)
lib/
  supabase.js   service-role client, tenant/PIN/user gates, geocode, uniqueTenant
  stripe.js     PLANS (price ids from env), planHasApp
  library.js    the 1,379-set library (EN/ES/PT/VI) (data/library.json) + helpers; marks.js = pure helpers shared with the browser
  render.js     Satori + resvg: print tiles (size S/M/L, ink), share images, printer profiles (data/printers.json), contrast check
  photo.js      sharp: Photo / Ink / Stamp looks (subject-aware crop, line art, two-tone)
  ai.js         Anthropic wrapper; HOUSE prompt; writeChapter, suggestSets, normalizeSets, chapterCode
  trust.js      denylist (data/denylist.json) + model screen, cached in screen_cache
  custom.js     network chapters (tenant '*') for the public library and dynamic set pages
  email.js      Resend: welcome, drip (DRIP), order notice
  sms.js        Twilio REST (optional)
  browser.js    anon Supabase client for the dashboard/generator
public/app.html           the kiosk app (single file, vanilla JS; LIB block = the library; talks to /api/* with x-tenant + x-kiosk-pin)
public/sw.js, manifest.json   offline shell for the kiosk
data/                     library.json, denylist.json, printers.json, host-script.md, nail-printer-review.html
assets/                   Fredoka-Bold.ttf + Nunito-Black.ttf (static instances; Nunito is the glyph fallback), resvg.wasm — traced into functions by next.config.js
supabase/schema.sql       the whole database; idempotent; re-run to migrate
sales/                    outreach playbook, launch checklist
```

## 3. Environment variables

All in `.env.example`. Required: Supabase (URL, anon, service role), Stripe (secret, webhook secret, four price ids), `NEXT_PUBLIC_SITE_URL`, `ADMIN_EMAILS`. Optional but expected: `ANTHROPIC_API_KEY` (+ `ANTHROPIC_MODEL`), `RESEND_API_KEY` + `EMAIL_FROM`, `CRON_SECRET`, `TWILIO_*`. Every optional integration degrades to a no-op with a visible message; nothing throws for a missing key.

## 4. Deploy

Follow README §1–5 exactly (Supabase → Stripe → domain → Resend/Anthropic → Vercel). Order matters only in that Vercel needs the values. Notes that aren't in the README:

- `next.config.js`: `serverComponentsExternalPackages: ['satori','@resvg/resvg-wasm','sharp']` and `outputFileTracingIncludes` for `assets/` and `data/` — keep both or the renderer and the buyer's guide break on Vercel.
- Function limits: `/api/generator/zip` and `/api/ai/chapter` declare `maxDuration = 60`; `/api/photo`, `/api/ai/host`, `/api/ai/suggest` 30. Hobby plan caps at 60s; Pro raises it. Rendering five tiles is ~2–4s.
- Emoji in tiles/share images are fetched at render time from `raw.githubusercontent.com/googlefonts/noto-emoji` (fallback jsdelivr) and cached in memory per function instance. If you want zero external calls, vendor the ~3,600 SVGs into `assets/emoji/` and point `loadEmoji` at disk.
- Storage bucket `library` must be **private**; the dashboard signs URLs for one hour.
- `vercel.json` cron hits `/api/cron/onboarding` daily at 14:00 UTC with `Authorization: Bearer $CRON_SECRET`.
- Supabase Auth emails: switch SMTP to Resend early; the built-in sender is rate-limited to ~3/hour.

## 5. Data model (supabase/schema.sql)

`salons` (licensees; `tenant` slug = kiosk URL; `plan`, `seats`, `status` mirrors Stripe; profile fields; `lat/lng` geocoded via Nominatim), `tenants` (legacy FK target), `settings` (kiosk prices/polishes/chapters-off per tenant), `orders` (kiosk + web; `source`, `party`, `phone`; `hands` jsonb includes full-res photo data URLs for photo nails), `bookings`, `parties`, `partners` (referral codes), `releases` (monthly drops), `drafts` (engine-written or creator-submitted chapters; statuses draft/submitted/approved/global/discarded), `custom_chapters` (approved chapters; `tenant='*'` = network-wide; PK code+tenant), `screen_cache`, `requests`. Views: `sales_by_chapter`, `salon_directory`, `trending_sets`, `creator_orders`. RLS is enabled on every table; the app only uses the service role server-side, the anon key only for Auth.

Photo nails: a full-res JPEG/PNG data URL (~100–600 KB) is stored in `orders.hands`. Fine for the first hundred salons; move to Storage with a signed URL when a busy salon complains about queue load.

## 6. Test plan (do this once, live keys in test mode)

1. **Money:** `/` → Salon plan → test card `4242…` → `/welcome` → login email → `/dashboard` shows the salon, PIN, kiosk address, plan; Stripe → Customers shows the subscription; `salons` row has `stripe_subscription_id`. Cancel in the portal → webhook sets `status='canceled'` → `/k/<salon>` says "not active".
2. **Kiosk:** `/k/<salon>` Customer tab: pick a set, "Make it mine" with a word → order code + QR. Host tab: PIN → queue shows it. Type `DISNEY` on a nail → blocked with a one-line reason. Photo nail: upload → three looks appear (Photo / Ink / Stamp) → pick → order carries `look` and full-res `photo`.
3. **Web → salon:** dashboard profile → fill city, tick listed → `/salons` shows the pin → any `/s/CODE` → Send to a salon → code + QR (+ SMS if Twilio set) → Host queue shows `source='web'` and the salon got the email. Party: `/salons/<salon>` → make link → open in another browser → pick a set → order name has the party appended.
4. **Language layer:** dashboard "Write a chapter" → theme → 12 sets in ~20s → edit one nail → Approve → `/k/<salon>` reloads with the new chapter; kiosk "Say it for me" returns sets. Admin: Publish to every salon → chapter appears under `/library#community` and `/s/<NEWCODE>` resolves.
5. **Generator:** `/generator` → phrase → size S, printer Jolimark, white ink on black polish → zip has 5 PNGs on white at 1200×1800 + recipe.txt with the CHECK line for contrast.
6. **Try-on:** `/s/EN-PUZZL-02` → upload a hand photo (palm down) → nails painted on fingertips → "Make a 6-second clip" → a webm/mp4 downloads.
7. **Coach:** Host tab → Coach → "she has acrylics" → a two-sentence answer from the script.
8. **Creators:** `/creators` → 5 sets → submit → admin sees it in Write a chapter → Publish → royalty row appears after an order.
9. **Cron:** `curl -H "Authorization: Bearer $CRON_SECRET" https://readmynails.com/api/cron/onboarding` → `{sent: n}`.
10. **SEO:** `/sitemap.xml` (~1,500 URLs), `/robots.txt`, `/api/og/EN-BRIDE-03` renders with emoji; submit the sitemap in Search Console.

## 7. Known assumptions and soft spots

- `data/printers.json`: only the O’2NAILS profile is verified (it is the library's own format). The others are marked `assumed: true`; confirm against each printer's manual.
- Tile fit sizes (S/M/L) scale the mark 0.82/1.0/1.1; tune after printing on real short nails.
- The Ink look is edge detection + darkest regions (`lib/photo.js`). Works on clear subjects; busy backgrounds produce noise. A real segmentation model (rembg / a hosted API) is the upgrade path — the API contract (`/api/photo` → three looks) stays the same.
- Try-on loads MediaPipe from jsDelivr and the model from Google's storage at runtime, client-side. Vendoring both into `public/` removes the dependency (~10 MB).
- `MediaRecorder` mp4 works on Safari 14.1+; older browsers get webm; some get "cannot record" and the still image.
- The model screen in `lib/trust.js` fails open if the API is down (local denylist still applies). Flip to fail-closed by returning `{ok:false}` in the catch if the owner prefers.
- Rate limits are per-day counters in Postgres (chapters 10/salon/day, creators 3/email/day). No IP limiting on public routes; add Upstash or Vercel WAF rules before a launch post.
- `/api/checkout` (kiosk pay-ahead) routes money to the platform's Stripe, not the salon's. Leave it unused for licensees unless Stripe Connect is added.
- Multi-location shares one `stripe_subscription_id` across up to `seats` salon rows; status updates fan out by that id.
- The landing page's sample hands are CSS drawings. Real hand photos from the first licensed kiosk should replace the "Six of the 1,020" section once available.
- Terms/privacy are plain-language drafts for counsel review.

## 8. Change control

Scott integrates all changes into the canonical package. For any fix or feature in production: keep it in a branch, send Scott the changed files (or a PR diff) with a one-paragraph note of what and why, and do not fork the schema without adding the migration to `supabase/schema.sql` (idempotent `add column if not exists` style, as the file already does).

## 9. Roadmap that isn't code yet

Per-nail sizing from a hand scan; a segmentation model for photo cutouts; vendored emoji and MediaPipe; Stripe Connect for salon pay-ahead; Upstash rate limits; PostHog analytics; Portuguese/Vietnamese chapters written and native-read; sponsored-chapter checkout; SMS on kiosk orders.
