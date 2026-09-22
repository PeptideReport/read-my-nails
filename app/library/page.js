import { Nav, Footer } from '../../components/Site';
import { Hand } from '../../components/Hand';
import { chapters, stats } from '../../lib/library';
import { globalChapters } from '../../lib/custom';

export const revalidate = 300;

export const metadata = {
  title: 'The Read My Nails library — 1,379 nail art sets that say something',
  description: 'Browse every chapter: prom, quinceañera, bride tribe, besties, game day, anime, faith and 80 more. English and Spanish. Pick a set and send it to a salon near you.',
  alternates: { canonical: '/library' },
};

function ChapterCard({ c }) {
  const preview = c.sets.slice(0, 2);
  return (
    <a className="chcard" href={c.url}>
<div className="chhands">{preview.map(s => <div className="mini" key={s.c}><Hand set={s.n ? s : { n: s.sp[0], a: s.a }} small /></div>)}</div>
  <h3>{c.t}</h3>
<p className="muted" style={{ fontSize: '0.95rem' }}>{c.s}</p>
<span className="chmeta mono">{c.sets.length} sets · {c.code}</span>
  </a>
);
}

export default async function Library() {
  const st = stats(); const en = chapters('EN'); const es = chapters('ES'); const pt = chapters('PT'); const vi = chapters('VI'); const community = await globalChapters();
  return (
    <>
    <Nav />
    <main className="wrap">
    <section style={{ paddingBlock: '32px 24px' }}>
<p className="eyebrow">The library</p>
<h1 style={{ margin: '10px 0 14px', fontSize: 'clamp(2rem,4.5vw,3.2rem)' }}>{st.sets.toLocaleString()} sets. {st.chapters} chapters. Four languages.</h1>
<p className="lede">Every set is five nails that read as a phrase. Tap a chapter, pick a set, send it to a salon near you, walk in with your code.</p>
  </section>
<section id="en" style={{ paddingBlock: 16 }}>
<h2 style={{ marginBottom: 18 }}>English <span className="muted" style={{ fontSize: '1rem', fontFamily: 'Nunito' }}>· {en.length} chapters</span></h2>
  <div className="chgrid">{en.map(c => <ChapterCard c={c} key={c.code} />)}</div>
                                  </section>
                                  {community.length > 0 && (
  <section id="community" style={{ paddingBlock: 16 }}>
<h2 style={{ marginBottom: 18 }}>Community <span className="muted" style={{ fontSize: '1rem', fontFamily: 'Nunito' }}>· chapters written by salons, published to every kiosk</span></h2>
  <div className="chgrid">{community.map(c => (
  <div className="chcard" key={c.code}>
<div className="chhands">{c.sets.slice(0, 2).map(s => <div className="mini" key={s.c}><Hand set={s.n ? s : { n: s.sp[0], a: s.a }} small /></div>)}</div>
  <h3>{c.t}</h3>
<p className="muted" style={{ fontSize: '0.95rem' }}>{c.s}</p>
  <div className="chips" style={{ marginTop: 6 }}>{c.sets.slice(0, 4).map(s => <a className="chip" key={s.c} href={'/s/' + s.c} style={{ textDecoration: 'none' }}>“{s.a}”</a>)}</div>
  <span className="chmeta mono">{c.sets.length} sets · {c.code}</span>
  </div>
))}</div>
  </section>
)}
<section id="es" style={{ paddingBlock: 40 }}>
<h2 style={{ marginBottom: 18 }}>Español <span className="muted" style={{ fontSize: '1rem', fontFamily: 'Nunito' }}>· {es.length} capítulos, escritos en español, no traducidos</span></h2>
  <div className="chgrid">{es.map(c => <ChapterCard c={c} key={c.code} />)}</div>
                                  </section>
                                  {(pt.length + vi.length) > 0 && (
  <section id="more" style={{ paddingBlock: 16 }}>
  <h2 style={{ marginBottom: 18 }}>Português · Tiếng Việt <span className="muted" style={{ fontSize: '1rem', fontFamily: 'Nunito' }}>· first chapters, native-read before they grow</span></h2>
             <div className="chgrid">{[...pt, ...vi].map(c => <ChapterCard c={c} key={c.code} />)}</div>
                               </section>
                                                         )}
</main>
<Footer />
  </>
                                                               );
  }
  
