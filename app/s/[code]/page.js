import { notFound } from 'next/navigation';
import { Nav, Footer } from '../../../components/Site';
import { Hand } from '../../../components/Hand';
import SendToSalon from '../../../components/SendToSalon';
import Share from '../../../components/Share';
import TryOn from '../../../components/TryOn';
import { setByCode, allSets, handsOf, tileCode, POLISH_NAME } from '../../../lib/library';
import { findCustomSet } from '../../../lib/custom';

export const dynamicParams = true;

export function generateStaticParams() { return allSets().map(s => ({ code: s.c })); }

export async function generateMetadata({ params }) {
  const s = setByCode(params.code) || await findCustomSet(params.code); if (!s) return {};
  const title = `“${s.a}” nail set — ${s.chapter.t} · Read My Nails`;
  const description = `Five nails that read “${s.a}”. Set ${s.c} from the ${s.chapter.t} chapter. Send it to a licensed salon near you and walk in with your code.`;
  return { title, description, alternates: { canonical: s.url }, openGraph: { title, description, images: [{ url: `/api/og/${s.c}`, width: 1200, height: 630 }] }, twitter: { card: 'summary_large_image', title, description, images: [`/api/og/${s.c}`] } };
}

export default async function SetPage({ params }) {
  const s = setByCode(params.code) || await findCustomSet(params.code); if (!s) notFound();
  const es = s.lang === 'ES';
  const hands = handsOf(s);
  let sets = allSets().filter(x => x.chapter.code === s.chapter.code);
  if (!sets.length) sets = [s];
  const i = Math.max(0, sets.findIndex(x => x.c === s.c));
  const prev = sets[(i - 1 + sets.length) % sets.length], next = sets[(i + 1) % sets.length];
  const more = sets.filter(x => x.c !== s.c).slice(0, 3);
  return (
    <>
      <Nav lang={es ? 'es' : 'en'} />
      <main className="wrap">
        <section className="setpage">
          <div>
            <a href={s.chapter.url} className="muted" style={{ fontWeight: 800, textDecoration: 'none' }}>← {s.chapter.t}</a>
            <div className="hand-card" style={{ marginTop: 16 }}>
              {hands.map((h, k) => <div key={k}>{hands.length > 1 && <p className="eyebrow" style={{ textAlign: 'center', marginTop: 8 }}>{s.w ? s.w[k] : (k ? 'Friend' : 'You')}</p>}<Hand set={{ n: h.map(n => n.t + '|' + n.polish), a: s.a }} /></div>)}
              <div className="hand-meta"><span className="ans">“{s.a}”</span><span className="code mono">{s.c}</span></div>
            </div>
            <div className="inline" style={{ justifyContent: 'space-between', marginTop: 12 }}>
              <a className="btn ghost sm" href={prev.url}>← {prev.a}</a>
              <a className="btn ghost sm" href={next.url}>{next.a} →</a>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 18, alignContent: 'start' }}>
            <div>
              <p className="eyebrow">{s.chapter.t} · {es ? 'Español' : 'English'}{s.sp ? (es ? ' · set dividido' : ' · split set') : ''}</p>
              <h1 style={{ margin: '8px 0 10px', fontSize: 'clamp(2rem,4.5vw,3rem)' }}>“{s.a}”</h1>
              {s.x && <p className="muted">{s.x}</p>}
              <p className="muted">{es ? 'Cinco uñas que se leen como una frase. Tú la imprimes en un salón con licencia; ellos te enseñan.' : 'Five nails that read as a phrase. You print it at a licensed salon; they teach you. About 12 minutes a hand.'}</p>
            </div>
            <SendToSalon set={{ c: s.c, a: s.a }} es={es} />
            <Share url={s.url} text={`“${s.a}” on my nails — Read My Nails`} es={es} />
            <TryOn hand={hands[0]} answer={s.a} code={s.c} es={es} />
            <details className="recipe">
              <summary>{es ? 'Receta para el salón' : 'Recipe for the salon'}</summary>
              <table className="mono">
                <thead><tr><th>#</th><th>{es ? 'Uña' : 'Nail'}</th><th>{es ? 'Archivo' : 'Tile'}</th><th>{es ? 'Esmalte' : 'Polish'}</th></tr></thead>
                <tbody>{hands.flatMap((h, k) => h.map((n, j) => <tr key={k + '-' + j}><td>{hands.length > 1 ? `${k + 1}.` : ''}{j + 1}</td><td>{n.t}</td><td>{tileCode(n.t)}</td><td>{POLISH_NAME[n.polish]}</td></tr>))}</tbody>
              </table>
              <p className="muted" style={{ fontSize: '0.85rem' }}>{es ? 'Los archivos de impresión están en la biblioteca con licencia.' : 'Print tiles are in the licensed library; the host taps these five on the printer.'}</p>
            </details>
          </div>
        </section>
        <section className="section" style={{ paddingBlock: 40 }}>
          <h2 style={{ marginBottom: 16 }}>{es ? 'Más de' : 'More from'} {s.chapter.t}</h2>
          <div className="samples">
            {more.map(x => <a className="sample setlink" href={x.url} key={x.c}><Hand set={x.n ? x : { n: x.sp[0], a: x.a }} small /><div className="hand-meta"><span className="ans">“{x.a}”</span><span className="code mono">{x.c}</span></div></a>)}
          </div>
        </section>
      </main>
      <Footer lang={es ? 'es' : 'en'} />
    </>
  );
}
