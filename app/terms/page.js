import { Nav, Footer } from '../../components/Site';

export const metadata = { title: 'Terms of service — Read My Nails', alternates: { canonical: '/terms' } };

// Plain-language terms. Have counsel read them before launch; the substance is what matters and it is all here.
export default function Terms() {
  return (
    <>
      <Nav />
      <main className="wrap doc">
        <p className="eyebrow">Terms of service</p>
        <h1>The deal, in plain words.</h1>
        <p className="muted">Effective September 2026. SeamlessLift LLC, Naples, Florida (“we”). These terms cover readmynails.com, the Read My Nails library, the kiosk app, the set generator and the salon directory.</p>

        <h2>1. What a license is</h2>
        <p>Chapters are licensed to <b>one account</b> (your email) for use at locations you operate. A <b>chapter credit</b> claims one chapter: its set designs, print tiles and recipe sheet. A claimed chapter stays licensed to you for as long as we exist, whether or not you keep a membership. The <b>Salon</b> plan additionally licenses the kiosk app, the set generator and a directory listing for <b>one physical location</b>; the Multi-location plan covers up to three locations under one bill. A second location on the Salon plan needs its own subscription.</p>
        <p>The kiosk app, the generator and the directory listing run while that subscription is paid. When it ends, so do they. Chapters you claimed, nails your customers already wear and printed cards you already have are yours.</p>

        <h2>2. What you can and can&apos;t do with it</h2>
        <p>You can print any set from a chapter you hold for any customer at a location you operate, charge whatever you like, put your own name and prices on the app, and post photos of finished hands anywhere. You can render custom sets with the generator for your own customers.</p>
        <p>You can&apos;t resell, share, upload or redistribute the tiles, the book or any part of the library; print chapters you haven&apos;t claimed; run the app at a location that isn&apos;t licensed; strip the Read My Nails name from the app or claim the library as your own product; or use the generator to render brand names, characters, logos or anyone else&apos;s trademark. One shared login per account.</p>

        <h2>3. Money</h2>
        <p>One-time purchases (the Start pack, the Whole Library, extra chapters) are charged once through Stripe and are not refundable once a chapter has been claimed or a download taken. Memberships (the monthly chapter, the Salon and Multi-location plans, new-chapter drops) are billed monthly in advance; cancel any time from your dashboard and keep access to the end of the paid period. Monthly plans are not refunded for partial months.</p>
        <p>Credits bank for 12 months from the day they land, then expire. Credits that came with a membership are void when that membership is canceled; chapters already claimed with them are unaffected. Prices can change with 30 days&apos; notice by email; a change never applies to a period you&apos;ve already paid for.</p>

        <h2>4. Your customers and the sets they send</h2>
        <p>When you list your salon in the directory, customers can send sets to your queue from this site and make party links for your location. You&apos;re under no obligation to honor a sent set, and prices shown to the customer are the ones you set in your app. Customer first names and set choices are stored so you can see your queue; we don&apos;t sell them and we don&apos;t email your customers.</p>

        <h2>5. Licenses, laws and your state</h2>
        <p>The session script is written so the host coaches and the customer applies every product to her own nails. Whether that model satisfies your state, province or country&apos;s cosmetology rules is <b>your responsibility to confirm</b> with your own regulator or attorney. We provide the method and the script, not legal advice, and we make no promise that any activity is license-exempt where you operate.</p>

        <h2>6. Ownership</h2>
        <p>The library, the set designs, the codes, the book, the app, the generator and the Read My Nails name are the property of SeamlessLift LLC. A license doesn&apos;t transfer any of it. Photos you post of hands printed at your location are yours; you give us permission to repost them with credit to your salon.</p>

        <h2>7. The service</h2>
        <p>We run the site and app on cloud providers and aim to keep them up, but we don&apos;t promise uninterrupted service. Keep a printed book and your price board so a bad Wi-Fi day doesn&apos;t stop a session. We can suspend a subscription that breaks section 2 after one written warning. Our liability to you is limited to what you paid us in the twelve months before the claim.</p>

        <h2>8. Changes and contact</h2>
        <p>We&apos;ll email subscribers about any material change to these terms 30 days ahead. Questions: <a href="mailto:hello@readmynails.com">hello@readmynails.com</a>. Florida law applies; disputes go to the courts of Collier County, Florida.</p>
      </main>
      <Footer />
    </>
  );
}
