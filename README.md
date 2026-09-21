# readmynails.com — v2.3 (the complete engine)

<!-- GitHub → Vercel auto-deploy connected -->
<!-- staging preview test 2026-09-20 -->

**Developers start with `HANDOFF-DEV.md`.**

One Next.js app. Public: landing (EN + ES), the whole library as browsable pages (123 chapter pages, 1,379 set pages with share images), the nail-printer buyer's guide, the salon directory with a map, party links. Paid: Stripe subscription checkout in three tiers, salon dashboard (downloads, kiosk address, PIN, profile + directory listing, 30-day chapter sales, network trending, billing), the set generator, and every licensee's kiosk app at `/k/<salon>`. Supabase holds the data and the files. Vercel serves it. Resend sends the emails.

**Cost to run:** Vercel Hobby $0 (Pro $20/mo when you want a team) · Supabase Free $0 (Pro $25/mo past 500 MB storage) · Stripe 2.9% + 30¢ · Resend free to 3,000 emails/month · maps are OpenStreetMap, free. Domain already owned.

---

## Setup — about an hour, no code

Do these in order. Every value you copy goes into Vercel in step 5.

### 1. Supabase (15 min)
1. supabase.com → **New project**. Name `readmynails`, region US East, strong database password (you won't need it again).
2. **SQL Editor → New query** → paste the whole of `supabase/schema.sql` → **Run**. Safe to re-run any time; it upgrades a v2.0 database in place.
3. **Authentication → Providers → Email**: Email on, **Confirm email** OFF. **Authentication → URL Configuration**: Site URL `https://readmynails.com`; Redirect URLs `https://readmynails.com/dashboard`, `https://readmynails.com/generator`, `https://readmynails.com/**`.
4. **Authentication → Email Templates → Magic Link**: subject `Your Read My Nails login link`, body `Tap to open your dashboard: {{ .ConfirmationURL }}`. Supabase's own sender is capped at ~3 emails/hour, so also set **Authentication → SMTP** to Resend (step 4) before you have ten salons.
5. **Storage → New bucket** `library`, **Private**. Upload, with these exact names: `tiles.zip` (the original 1,671 tiles + the 402 in tiles-v2.zip, merged into one `tiles/` folder, plus sets.csv, tiles.csv, sets-v2.csv, tiles-v2.csv), `Read-My-Nails-Library.pdf` (the quick-reference book — regenerate any time with `node scripts/reference-pdf.js`, it reads `data/library.json`), `menu-cards.zip` (price board, how-it-works, station cards, counter cards — HTML + PDF), `session-script.pdf` (`data/host-script.md` exported to PDF — Google Docs → File → Download → PDF).
6. **Table editor → partners**: add a row per distributor you want paid — `code` (e.g. `MIAMI`), `name`, `email`, `share_pct`. Their link is `readmynails.com/?ref=MIAMI`.
7. **Project Settings → API**: copy **Project URL**, **anon public** key, **service_role** key.

### 2. Stripe (20 min) — PRICING-SPEC-v1
1. **Product catalog → Add product** `Read My Nails`. Add eight prices and copy each price ID (`price_…`) into the matching env var:
   - `STRIPE_PRICE_START` — **$29 one-time** (Start pack, 5 chapter credits)
   - `STRIPE_PRICE_MONTHLY` — **$9.99/month** recurring (Monthly chapter, 1 credit a month)
   - `STRIPE_PRICE_SALON` — **$59/month** recurring (Salon: app + generator + directory + 2 credits/month)
   - `STRIPE_PRICE_MULTI` — **$149/month** recurring (Multi-location, 3 locations, 6 credits/month)
   - `STRIPE_PRICE_LIBRARY` — **$699 one-time** (Whole Library)
   - `STRIPE_PRICE_DROPS` — **$9.99/month** recurring (New-chapter drops, Whole Library owners)
   - `STRIPE_PRICE_CHAPTER1` — **$14.99 one-time** (1 extra chapter)
   - `STRIPE_PRICE_CHAPTER3` — **$35 one-time** (3 extra chapters)
2. No coupons are needed. (Promotion codes still work at checkout if you make one.)
3. **Developers → API keys**: copy the Secret key. Test keys first if you want a dry run (card 4242 4242 4242 4242).
4. **Developers → Webhooks → Add endpoint**: `https://readmynails.com/api/stripe-webhook`; events `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`. Copy the signing secret.
5. **Settings → Billing → Customer portal**: on; allow update payment method, switch plan, cancel.

### 3. Domain (5 min)
At your registrar: **A** `@ → 76.76.21.21`, **CNAME** `www → cname.vercel-dns.com`. Vercel confirms when it's live.

### 4. Resend (5 min, optional but do it)
resend.com → add domain `readmynails.com` (three DNS records) → **API Keys → Create**. That key is `RESEND_API_KEY`; `EMAIL_FROM` is `Read My Nails <hello@readmynails.com>`. Emails: welcome on signup, set-up nudges on day 2 / 7 / 14, "a customer sent you a set." Without the key the site works and simply sends nothing.

### 4b. Anthropic (3 min) — the language and trust layers
console.anthropic.com → **API Keys → Create key**. That is `ANTHROPIC_API_KEY`. Leave `ANTHROPIC_MODEL` at the default unless you want a different Claude model. Cost at this stage is a few dollars a month: a 12-set chapter is about a cent, a screen is a fraction of that and cached forever. Without the key: the chapter writer is off (the dashboard says so), "Say it for me" falls back to keyword search, and the trust screen runs on the local denylist only.

### 5. Vercel (10 min)
1. vercel.com → **Add New → Project** → drag this folder in (or import from GitHub). Framework Next.js.
2. **Environment Variables** — every line of `.env.example`:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_START`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_SALON`, `STRIPE_PRICE_MULTI`, `STRIPE_PRICE_LIBRARY`, `STRIPE_PRICE_DROPS`, `STRIPE_PRICE_CHAPTER1`, `STRIPE_PRICE_CHAPTER3`, `NEXT_PUBLIC_SITE_URL=https://readmynails.com`, `ADMIN_EMAILS=scottdelboccio@gmail.com`, `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET` (any long random string; Vercel sends it with the daily cron), `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`.
3. **Deploy**, then **Settings → Domains** → `readmynails.com` and `www.readmynails.com`.
4. Open the site. Log in with your Gmail → the Naples salon (free, plan `house`) and every salon that signs up (admin view), plus the partners table.

### 6. Test the loop (10 min)
Pricing → fake salon → pay (test card) → Welcome → login link → dashboard shows the salon, PIN, kiosk address → fill in the profile, tick "List my salon" → `/salons` shows it on the map → open any set page → Send to a salon → your fake salon → code + QR → the kiosk app's Host tab shows the order with `web` as the source → Generator → type a phrase → zip downloads with five PNGs → Billing opens Stripe's portal. Switch to live keys.

---

## What each part does

| Path | What |
|---|---|
| `/`, `/es` | Landing, pricing (3 tiers), signup → Stripe. `?ref=CODE` credits a partner for 30 days. |
| `/library`, `/library/<lang>/<chapter>` | Every chapter as a public page, hands drawn in CSS, SEO titles. |
| `/s/<CODE>` | Every set as a public page: hand, share image (`/api/og/<CODE>`), Send to a salon, share buttons, recipe. 1,379 of them, prerendered. |
| `/salons`, `/salons/<salon>` | Directory with map (listed + paying salons only), salon profile, party-link maker. |
| `/party/<id>` | A party link: sets a 30-day cookie so every set sent lands at that salon under the party's name. |
| `/nail-printers` | The buyer's guide. Traffic magnet. Edit `data/nail-printer-review.html`. |
| `/guides`, `/terms`, `/privacy` | Printer loading guide, terms, privacy. Have counsel read terms once. |
| `/login`, `/welcome`, `/dashboard` | Magic-link login; dashboard with downloads, PIN, profile/listing, 30-day chapter sales, network trending, add-location (Multi), billing portal, admin partners table. |
| `/generator` | Licensees only: phrase → five nails → zip of print tiles + recipe (`/api/generator/zip`). |
| `/k/<salon>` | The kiosk app. Customer tab on the tablet, Host tab on the phone. Library plan has no app. |
| `/api/stripe-webhook` | Payment → salon row (slug, PIN, seats, referrer) + welcome email. Subscription changes → status. |
| `/api/orders` | Kiosk orders and web-sent orders (`web: true`), scoped by `x-tenant`; emails the salon on web orders. |
| `/api/cron/onboarding` | Daily (vercel.json): day 2 / 7 / 14 emails. |
| `/api/og/<CODE>`, `/api/tile?m=`, `/api/qr?t=` | Share image (public), print tile (licensees), QR (public). Satori + resvg, Fredoka Bold + Noto emoji, in-process. |
| `sitemap.xml`, `robots.txt` | ~1,500 URLs. Submit the sitemap in Google Search Console the day the domain is live. |

## The language layer (v2.2)
- **Write a chapter** (dashboard): theme + language + count → the engine writes in the house voice (`lib/ai.js`, `HOUSE` prompt, eight library sets as examples), screens every set, saves a draft. You edit marks and phrases, remove sets, then **Approve → my kiosk**. Approved chapters get a code (`EN-VBALL`, sets `EN-VBALL-01…`) and appear in that salon's kiosk app on the next load. Admins can **Publish to every salon**. 10 chapters per salon per day.
- **Say it for me** (kiosk, Customer tab): "Tell me three things you love" → keyword retrieval over the library, then the model picks the best fits and writes up to two fresh sets for her. Fresh sets order as `CUSTOM`.
- **What people are asking for** (dashboard): every generator phrase, chapter theme and "say it for me" request, tallied for 30 days. That list is next month's chapter.
- Ten languages in the writer's menu. English and Spanish have library examples; the others are written natively by the model — have a native speaker read a chapter before you publish it to every salon.

## The trust layer (v2.2)
Every mark that could reach a printer passes `lib/trust.js`: the generator, customer-typed nails at the kiosk, chapter drafts (and their themes), and "say it for me" inputs.
1. **Local denylist** (`data/denylist.json`): brands, characters, celebrities, profanity (EN/ES), sexual, substances, hate, self-harm, weapons; whole-word matches. Free and instant. Edit it freely; "allow" phrases override the brand list ("apple pie").
2. **Model judgment** when `ANTHROPIC_API_KEY` is set, with the house rule in the prompt ("SOFIA" fine, "TAYLOR SWIFT" not). Verdicts cache forever in `screen_cache`, so a phrase costs once.
The customer sees one line: *“Disney” can't go on a nail here — a brand or team name. Try another word.* Nothing is logged about who typed it.

## Layers added in v2.3
- **Photo intelligence** (`lib/photo.js`, `/api/photo`): a photo nail gets three print-ready looks in the kiosk editor — Photo (subject-aware crop, sharpened), Ink (line art, background gone), Stamp (two-tone). The order carries the full-res file for the host.
- **Host coach** (`/api/ai/host`, kiosk Host tab → Coach): a chat in the host's ear that knows the session script, the house rules, this salon's prices and polish rack. Needs `ANTHROPIC_API_KEY`.
- **Fit + printer profiles** (`lib/render.js`, `data/printers.json`, generator): nail length S/M/L, black or white ink per nail with a contrast warning, "reads to the wearer" mirroring, and export packs per printer (O’2NAILS verified; others marked assumed).
- **Try-on + reveal clip** (`components/TryOn.js`, every set page): upload a hand photo, MediaPipe finds the fingertips, the set is painted on; "Make a 6-second clip" records a reveal for TikTok. Runs entirely in the browser.
- **Creator chapters** (`/creators`, `/api/creators`, admin dashboard): public submissions, screened, published network-wide with credit; royalty report by chapter (30-day orders) for manual payout.
- **Community chapters** on `/library` and dynamic `/s/<code>` pages for network chapters (`lib/custom.js`).
- **SMS** (`lib/sms.js`, optional Twilio): the customer gets her code by text when she sends a set from the site.
- **Offline kiosk** (`public/sw.js`, `manifest.json`): the kiosk page and its script stay cached; add-to-home-screen works on the tablet and the host's phone.

## Library v2 (September 2026)
`data/library-v2.js` holds the 35 chapters written after the original 88 (376 sets: Homecoming, Halloween, Friendsgiving, Christmas, New Year, Valentine, Prom, Graduation, Sweet 16, Bridesmaids, Bach, Baby Shower, Birthdays by Decade, Free Era, Nurses, Teachers, Professions, Element Symbols, Math, Dates & Numbers, Cheer, Race Day, Military, Always With Me; Spanish Día de Muertos, Navidad, Año Nuevo, Día de las Madres, San Valentín, Graduación, Enfermeras, Corte de Quince, Boda; plus first chapters in Portuguese and Vietnamese, to be read by a native speaker before going network-wide). `node scripts/merge-library.js` merges it into `data/library.json` and the kiosk's LIB block; it is idempotent. Their 402 new tiles are in `tiles-v2.zip` (rendered with the same fonts; Nunito Black is the fallback face for Vietnamese, Portuguese and math symbols). To add more chapters: append to `library-v2.js`, run the merge, render tiles with the same script pattern (see `HANDOFF-DEV.md`), redeploy.

## Monthly chapter drops
Zip the new tiles + a one-page PDF, upload to the `library` bucket (e.g. `drops/2026-10-halloween.zip`), then **Table editor → releases → Insert**: `title`, `body`, `file_path`. Every dashboard shows it immediately. To add the sets to the public library and the kiosk app: add the chapter to `data/library.json` and to the `LIB` block in `public/app.html`, redeploy.

## Changing prices or copy
Prices are text in `app/page.js` / `app/es/page.js` and IDs in Vercel env vars: change both. `app/globals.css` is the look. `lib/email.js` is every email.

## Things to know
- Public set pages show the *hands* (CSS drawings and share images). The *print tiles* stay behind the license. That's deliberate: the hands are marketing, the tiles are the product.
- `past_due` keeps a kiosk alive while Stripe retries; `canceled` / `unpaid` shuts it and the downloads.
- Web-sent orders land in the queue with source `web` and the party name appended to the customer's name, so the kiosk app needs no change.
- Multi-location: one subscription, up to 3 salon rows sharing it; "Add location" on the dashboard.
- Partner payouts are manual: the admin table shows salons per code; pay `share_pct` of year one however you like.
- The kiosk pay-ahead (`/api/checkout`) sends money to *your* Stripe. Don't offer it to licensees without Stripe Connect.
- Photos on photo-nails are stored in the order row (~40 KB). Move to Storage if a salon does hundreds a day.
