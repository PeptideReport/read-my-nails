import { Nav, Footer } from '../../components/Site';

// Partner program for nail-printer distributors, resellers and makers.
// Mechanics already in the engine: /?ref=CODE → rmn_ref cookie (30 days) → /api/subscribe validates against `partners` →
// Stripe metadata.ref → webhook writes salons.referrer. Admin sees per-code counts on /dashboard. Payouts are manual.

export const metadata = {
title: 'Partner program for nail-printer distributors · Read My Nails',
description: 'Sell a nail printer, ship a menu. Distributors earn 20% of every Read My Nails subscription for a year; their buyers get the founding rate; their printers get a verified export profile.',
alternates: { canonical: '/partners' },
openGraph: { title: 'The printer prints. We give the salon something worth printing.', description: 'Read My Nails partner program for nail-printer distributors and makers.' },
};

const EMAIL = 'hello@readmynails.com';
const APPLY = `mailto:${EMAIL}?subject=${encodeURIComponent('Read My Nails partner program')}&body=${encodeURIComponent('Company:\nWebsite:\nCountry / region:\nPrinters we sell (brand + models):\nRough machines per month:\nBest contact (name, email, WhatsApp):\n')}`;

const GET = [
['20% of every payment', 'from salons who join through your link — packs and memberships — for the first 12 months of each salon. Paid monthly. No cap, no minimum.'],
['A Start pack for every buyer.', 'Five chapters for $29 the day the machine arrives — the menu is on the screen before the box is in the recycling.'],
['A “where to buy” box in the Nail Printer Buyer’s Guide', 'with your link and contact, above the model comparison.'],
['Your printers by name in the generator.', '“Export for O’2NAILS X11 Plus” — tiles come out in your machine’s size, resolution and file format, confirmed with your spec.'],
['A free Salon license for your showroom.', 'Your demo unit runs the kiosk app and the full library, so the printer sells with a menu on the screen.'],
['The sample kit.', 'Three free sets, a price board and a one-page how-it-works your customers can print the day the machine arrives.'],
];

const ASK = [
'Put the card (or the link) in every printer you ship.',
'One email to the salons that already own your printers.',
'Ten minutes to confirm your printer’s file spec — tile size, DPI, color mode, transparency.',
];

const FAQ = [
['Who qualifies?', 'Anyone who sells nail printers to salons: distributors, resellers, makers, and the Alibaba storefront that ships one machine a week. If a salon buys a printer from you, you qualify.'],
['Which printers?', 'Any printer that loads your own images. The library is 1500 × 2250 transparent PNG tiles; export profiles exist for O’2NAILS, Jolimark, Sunwin, Widermatrix and Fingernails2Go; each is confirmed against the maker’s spec or a test print, and yours is added from the spec you send.'],
['How is attribution tracked?', 'Your code rides on the link and is remembered for 30 days in the salon’s browser, then saved with the subscription at checkout. Send salons to your link, not the bare home page.'],
['What about a salon that already subscribes?', 'Existing subscribers stay where they are. New locations that sign up through your link are yours.'],
['Can I resell the subscription myself?', 'Not yet. Salons subscribe directly so the app, updates and billing stay in one place. Ask about bundling if you want the subscription in your price.'],
['Currency and tax?', 'Salons are billed in USD through Stripe. Partner payments are in USD by PayPal or wire; you handle your own tax.'],
];

export default function Partners() {
return (
<>
<Nav />
<main className="wrap doc" style={{ maxWidth: 860 }}>
<p className="eyebrow">Partner program · distributors &amp; makers</p>
<h1>The printer prints. We give the salon something worth printing.</h1>
<p className="lede">Read My Nails is a licensed library of nail-art <b>sets</b> — five nails that spell a phrase — plus the kiosk app, generator and public catalog that let a salon sell them. Every printer you sell is a salon that needs a menu. Put ours in the box and earn on every subscription.</p>

<div className="stats" style={{ marginTop: 6 }}>
<div className="stat"><b>1,623</b><span>coded sets</span></div>
<div className="stat"><b>143</b><span>chapters</span></div>
<div className="stat"><b>EN · ES</b><span>+ PT · VI starters</span></div>
<div className="stat"><b>&lt; 1 min</b><span>phrase → 5 tiles</span></div>
</div>

<p style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
<a className="btn pink" href={APPLY}>Apply for a code</a>
<a className="btn ghost" href="/nail-printers">The buyer’s guide</a>
<a className="btn ghost" href="/partners/Read-My-Nails-Partner-Program.pdf">One-page PDF</a>
</p>

<div className="card" style={{ background: 'var(--surface-2)' }}>
<h2>What you get</h2>
<ol style={{ margin: 0, paddingLeft: '1.2em', display: 'grid', gap: 8 }}>
{GET.map(([h, t]) => <li key={h}><b>{h}</b> {t}</li>)}
</ol>
</div>

<div className="card">
<h2>What we ask</h2>
<ul style={{ margin: 0, paddingLeft: '1.2em', display: 'grid', gap: 6 }}>
{ASK.map(t => <li key={t}>{t}</li>)}
</ul>
</div>

<h2>Why a salon pays for it</h2>
<p>The first thing every printer buyer asks is <i>“what do I print?”</i> Clip-art and phone photos don’t make a menu. A named, coded, chaptered catalog does: a customer picks <span className="mono">EN-BRIDE-03</span> at home, sends it to the salon, and it is waiting in the queue with a code and QR when she walks in. Bride tribes, quince courts, prom, teams, nurses, teachers, Spanish written as Spanish — not translated. The one salon we found with a printed-art menu lists $75–115 a set; the Naples session model runs $25 a hand. Either way, the menu is the product. We are the menu.</p>

<h2>What the salon gets</h2>
<table className="ptable">
<thead><tr><th>Plan</th><th>Includes</th><th style={{ textAlign: 'right' }}>Price</th></tr></thead>
<tbody>
<tr><td><b>Start</b></td><td>5 chapter credits, tiles in the printer&apos;s format, the book, cards and script. Then $9.99/mo for a chapter a month.</td><td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>$29 once</td></tr>
<tr><td><b>Salon</b></td><td>Kiosk app, phrase generator, directory listing, party links, try-on · 2 chapter credits every month</td><td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>$59/mo</td></tr>
<tr><td><b>Multi-location</b></td><td>Salon plan for 3 locations · 6 credits a month</td><td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>$149/mo</td></tr>
<tr><td><b>Whole Library</b></td><td>Every chapter, forever · optional $9.99/mo for new drops</td><td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>$699 once</td></tr>
</tbody>
</table>
<p className="muted" style={{ fontSize: '0.9rem' }}>No free trial — the tiles are the product. Cancel any time. Billing in USD via Stripe.</p>

<h2>How it works</h2>
<ol style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
<li className="card"><b>1 · You get a code and a link.</b> <span className="mono">readmynails.com/?ref=YOURCODE</span></li>
<li className="card"><b>2 · A salon buys through it.</b> The link remembers you for 30 days; every purchase and membership on that account is credited to you.</li>
<li className="card"><b>3 · You get paid.</b> Statement on the 1st of each month; payment by PayPal or wire.</li>
</ol>

<h2>Questions distributors ask</h2>
{FAQ.map(([q, a]) => <p key={q}><b>{q}</b><br />{a}</p>)}

<div className="card" style={{ background: 'var(--ink)', color: 'var(--bg)' }}>
<h2 style={{ color: 'var(--honey)' }}>Get a code</h2>
<p style={{ color: 'inherit' }}>Email <a href={APPLY}>{EMAIL}</a> with your company, the printers you sell and roughly how many machines a month. You’ll have a code, a link and the sample kit within two business days.</p>
<p><a className="btn pink" href={APPLY}>Apply for a code</a></p>
</div>
</main>
<Footer />
</>
);
}
