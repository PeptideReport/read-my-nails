import { Nav, Footer } from '../../components/Site';
import RefCookie from '../../components/RefCookie';

// The QR on the box card lands here: three free sets, then the founding offer. ?ref=CODE credits the partner.
export const metadata = {
title: 'Three free sets for your nail printer · Read My Nails',
description: 'Print three Read My Nails sets at your counter today — Bee-U-tiful, Maid of honey, Tú puedes — then get the library.',
alternates: { canonical: '/free' },
};

export default function Free() {
return (
<>
<Nav />
<RefCookie />
<main className="wrap doc">
<p className="eyebrow">Three free sets</p>
<h1>Print these at your counter today.</h1>
<p className="lede">Three sets (fourteen tile files — two share the ✨), a price board and a one-page how-it-works. Load <span className="mono">tiles/</span> into your printer, tap the five tiles in order, watch the reaction.</p>
<p><a className="btn pink" href="/free/read-my-nails-sample-kit.zip">Download the kit (1.5 MB)</a></p>
<div className="card">
<h2>What’s in it</h2>
<p><b>EN-PUZZL-02 “Bee-U-tiful”</b> · 🐝 U TI FUL ✨ — the puzzle that sells the idea.</p>
<p><b>EN-BRIDE-03 “Maid of honey”</b> · MAID OF 🍯 👗 💜 — every bridesmaid wants her own.</p>
<p><b>ES-INSPI-01 “Tú puedes”</b> · TÚ PUEDES 💪 ✨ 💗 — Spanish written as Spanish.</p>
<p className="muted">PNG, 1500 × 2250, transparent. Works with any nail printer that loads your own images.</p>
</div>
<h2>Then the other 1,376.</h2>
<p>Start with five chapters for $29 and print them tonight. The Salon plan adds the kiosk app in your name, the phrase generator, party links, a directory listing and two new chapters every month.</p>
<p><a className="btn" href="/#pricing">See the plans</a> <a className="btn ghost" href="/library">Browse the library</a></p>
</main>
<Footer />
</>
);
}
