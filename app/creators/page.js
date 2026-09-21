import { Nav, Footer } from '../../components/Site';
import CreatorForm from '../../components/CreatorForm';

export const metadata = { title: 'Write a chapter — Read My Nails creators', description: 'Nail artists and writers: submit a chapter of five-nail sets. If it goes live in every salon, you earn a royalty on every order and a credit on the chapter.', alternates: { canonical: '/creators' } };

export default function Creators() {
return (
<>
<Nav />
<main className="wrap" style={{ paddingBlock: 28, maxWidth: 900 }}>
<p className="eyebrow">Creators</p>
<h1 style={{ margin: '8px 0 10px', fontSize: 'clamp(2rem,4.5vw,3rem)' }}>Write a chapter. Get paid when it prints.</h1>
<p className="lede" style={{ marginBottom: 18 }}>A chapter is five to twelve sets: five nails each that read as a phrase, a pun, a joke, a blessing. If we publish it, it goes into every Read My Nails kiosk with your name on it, and you earn 10% of the session price every time a customer orders one of your sets, paid monthly.</p>
<div className="board" style={{ marginBottom: 22 }}>
<h3>House rules, short version</h3>
<ul style={{ color: 'var(--ink-2)', margin: '8px 0 0', paddingLeft: '1.2em', display: 'grid', gap: 6 }}>
<li>Five nails, thumb to pinky. Each nail: one letter, a short word (up to 7 characters), a number, or one emoji used as a word. 🐝 = be, 👁️ = I, 🍯 = honey, 2 = to.</li>
<li>Nothing a mom would frown at. No brand names, teams, characters, celebrities, or lyrics; every set is screened on submit and again before publishing.</li>
<li>Write in the language you think in. Spanish jokes in Spanish, not translated.</li>
<li>Polish is the base color under the print, chosen per nail. Alternate bare and one color so the hand reads.</li>
</ul>
</div>
<CreatorForm />
</main>
<Footer />
</>
);
}
