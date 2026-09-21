import { Nav, Footer } from '../../components/Site';

export const metadata = { title: 'Privacy — Read My Nails', alternates: { canonical: '/privacy' } };

export default function Privacy() {
return (
<>
<Nav />
<main className="wrap doc">
<p className="eyebrow">Privacy</p>
<h1>What we keep, and why.</h1>
<p className="muted">Effective September 2026. SeamlessLift LLC, Naples, Florida.</p>

<h2>Salon owners</h2>
<p>To run your subscription we keep your email, salon name, host&apos;s first name, the profile you choose to list (address, phone, Instagram, hours), your kiosk PIN, and billing status. Card numbers never touch our servers; Stripe holds them. We email you about your account and, for the first two weeks, three short set-up emails. Reply “stop” to any of them and they stop.</p>

<h2>Customers who send a set</h2>
<p>When you send a set to a salon from this site we store your first name, the set you chose, the salon you sent it to, and the party name if you came through a party link. The salon sees it in their queue. We don&apos;t ask for your email or phone, we don&apos;t sell anything about you, and we don&apos;t email you. Party links use a cookie on your device so the set goes to the right salon; it expires in 30 days.</p>
<p>At the kiosk, a customer may add her own photo to a nail (a pet, a name). It is stored with that order for the salon to print and is not used for anything else. Customers under 18 should have a parent present; salons agree to that in the session script.</p>

<h2>Trending</h2>
<p>Salons see which sets are ordered most across all Read My Nails locations. That view is counts by set code only. It never shows which salon, which customer, or any name.</p>

<h2>Cookies and analytics</h2>
<p>We use a login cookie for the dashboard, a party cookie described above, and a referral cookie if you arrived through a partner link, so the partner gets credit. We don&apos;t run advertising trackers.</p>

<h2>Where it lives</h2>
<p>Data is stored with Supabase and Vercel in the United States, payments with Stripe, and transactional email with Resend. Each is bound by its own privacy terms.</p>

<h2>Your choices</h2>
<p>Email <a href="mailto:hello@readmynails.com">hello@readmynails.com</a> to see, correct or delete what we hold about you or your salon. Deleting a subscription removes the profile and PIN; order history is kept for the salon&apos;s records for 12 months, then removed.</p>
</main>
<Footer />
</>
);
}
