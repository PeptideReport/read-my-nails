import { notFound } from 'next/navigation';
import { Nav, Footer } from '../../../../components/Site';
import { Hand } from '../../../../components/Hand';
import { chapterBySlug, allChapters } from '../../../../lib/library';

export function generateStaticParams() { return allChapters().map(c => ({ lang: c.lang.toLowerCase(), chapter: c.slug })); }

export function generateMetadata({ params }) {
  const c = chapterBySlug(params.lang, params.chapter); if (!c) return {};
  const first = c.sets[0];
  return {
    title: `${c.t} nail art sets — Read My Nails`,
    description: `${c.s} ${c.sets.length} sets like “${first.a}”. Pick one and send it to a salon near you.`,
    alternates: { canonical: c.url },
    openGraph: { title: `${c.t} — Read My Nails`, description: c.s, images: [`/api/og/${first.c}`] },
  };
}

export default function Chapter({ params }) {
  const c = chapterBySlug(params.lang, params.chapter); if (!c) notFound();
  const es = c.lang === 'ES';
  return (
    <>
      <Nav lang={es ? 'es' : 'en'} />
      <main className="wrap">
        <section style={{ paddingBlock: '28px 20px' }}>
          <a href="/library" className="muted" style={{ fontWeight: 800, textDecoration: 'none' }}>← {es ? 'Biblioteca' : 'Library'}</a>
          <p className="eyebrow" style={{ marginTop: 14 }}>{es ? 'Capítulo' : 'Chapter'} · <span className="mono">{c.code}</span></p>
          <h1 style={{ margin: '8px 0 10px', fontSize: 'clamp(2rem,4.5vw,3.2rem)' }}>{c.t}</h1>
          <p className="lede">{c.s}</p>
        </section>
        <section style={{ paddingBlock: 8 }}>
          <div className="samples">
            {c.sets.map(s => (
              <a className="sample setlink" href={'/s/' + s.c} key={s.c}>
                {s.n ? <Hand set={s} small /> : <><Hand set={{ n: s.sp[0], a: s.a }} small /><Hand set={{ n: s.sp[1], a: s.a }} small /></>}
                <div className="hand-meta"><span className="ans">“{s.a}”</span><span className="code mono">{s.c}</span></div>
                {s.sp && <span className="muted" style={{ fontSize: '0.85rem', paddingInline: 8 }}>{es ? 'Set dividido' : 'Split set'} · {s.w ? s.w.join(' / ') : ''}</span>}
              </a>
            ))}
          </div>
        </section>
        <section className="section" style={{ paddingBlock: 48 }}>
          <div className="board" style={{ textAlign: 'center' }}>
            <h2>{es ? '¿Tienes una impresora de uñas?' : 'Own a nail printer?'}</h2>
            <p className="muted" style={{ margin: '8px auto 18px', maxWidth: '50ch' }}>{es ? 'Los archivos de impresión de este capítulo y los otros 122 están en la biblioteca con licencia.' : 'The print tiles for this chapter and the other 122 are in the licensed library.'}</p>
            <a className="btn pink" href={es ? '/es#pricing' : '/#pricing'}>{es ? 'Ver precios' : 'See pricing'}</a>
          </div>
        </section>
      </main>
      <Footer lang={es ? 'es' : 'en'} />
    </>
  );
}
