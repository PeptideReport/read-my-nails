import { Nav, Footer } from '../../components/Site';

// Interest-gauging page only. Deliberately carries no fees, terms, territory or
// system promises — publicly offering those would trigger FTC Franchise Rule
// disclosure requirements (a formal FDD, 14-day waiting period, state filings).
// This page exists to collect interest, not to make an offer. Do not add
// pricing, "franchise," "investment," "territory," or "royalty" language here
// without a franchise attorney's review first.

export const metadata = {
  title: 'Open a Read My Nails location · Read My Nails',
  description: 'One licensed kiosk is proven in Naples, Florida. If you’re curious about bringing Read My Nails to your city, tell us about yourself — this is a first conversation, not an offer.',
  alternates: { canonical: '/own-a-location', languages: { en: '/own-a-location', es: '/es/own-a-location' } },
  openGraph: { title: 'Interested in a Read My Nails location?', description: 'One proven kiosk. If you want to talk about bringing it to your city, start here.' },
};

const EMAIL = 'hello@readmynails.com';
const INTEREST = `mailto:${EMAIL}?subject=${encodeURIComponent('Interested in a Read My Nails location')}&body=${encodeURIComponent('Name:\nCity / area you’re thinking about:\nDo you already have a space and/or a nail printer?\nRough timeline:\nA little about you or your business:\nBest contact (email, phone):\n')}`;

const QUESTIONS = [
  ['Is this a franchise?', 'No. There’s no fee, no territory and no system being sold on this page. This is a first conversation so we can understand where there’s interest — nothing more, and we’re not going to pretend otherwise.'],
  ['What’s actually proven right now?', 'One licensed kiosk in Naples, Florida, running the real library, app and session model day to day. That’s the whole track record so far — we’d rather tell you that plainly than oversell it.'],
  ['I already have a salon and a nail printer — is this for me?', 'Probably not — you want the subscription, not this page. Go to pricing and get the library running at your existing location today.'],
  ['What happens after I reach out?', 'We’ll get back to you, ask a few questions, and share more as the model outside Naples takes shape. If and when there’s a real offer to make, you’ll hear the actual terms directly — not marketing copy.'],
];

export default function OwnALocation() {
  return (
    <>
      <Nav />
      <main className="wrap doc" style={{ maxWidth: 860 }}>
        <p className="eyebrow">Bring it to your city</p>
        <h1>One kiosk, proven in Naples. Curious about yours?</h1>
        <p className="lede">Read My Nails runs today as a real, licensed kiosk in Naples, Florida &mdash; the library, the ordering app and the 12-minute session, in front of real customers. We&apos;re starting to hear from people who want to know what it would take to bring it to their own city. This page is for that conversation.</p>

        <div className="card" style={{ background: 'var(--surface-2)' }}>
          <p style={{ margin: 0 }}><b>What this is:</b> an early, no-commitment way to say &ldquo;I&apos;m interested&rdquo; and tell us a bit about yourself.<br /><b>What this isn&apos;t:</b> a franchise offer, an investment pitch, or a promise of territory, pricing or terms. None of that exists yet in a form we&apos;d put in front of you, and we&apos;re not going to pretend it does.</p>
        </div>

        <p style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
          <a className="btn pink" href={INTEREST}>Tell us you&apos;re interested</a>
          <a className="btn ghost" href="/#pricing">Already have a salon? See pricing</a>
        </p>

        <h2>Questions people ask</h2>
        {QUESTIONS.map(([q, a]) => <p key={q}><b>{q}</b><br />{a}</p>)}

        <div className="card" style={{ background: 'var(--ink)', color: 'var(--bg)' }}>
          <h2 style={{ color: 'var(--honey)' }}>Start the conversation</h2>
          <p style={{ color: 'inherit' }}>Email <a href={INTEREST}>{EMAIL}</a> with your name, the city you have in mind, and a little about yourself. No forms, no pressure &mdash; we read every one.</p>
          <p><a className="btn pink" href={INTEREST}>Tell us you&apos;re interested</a></p>
        </div>
      </main>
      <Footer />
    </>
  );
}
