import { notFound } from 'next/navigation';
import { Nav, Footer } from '../../../components/Site';
import { Hand } from '../../../components/Hand';
import PartyMaker from '../../../components/PartyMaker';
import { sb } from '../../../lib/supabase';
import { allSets } from '../../../lib/library';

export const revalidate = 300;

async function load(tenant) {
  try { const { data } = await sb().from('salon_directory').select('*').eq('tenant', tenant).maybeSingle(); return data; } catch (e) { return null; }
}

export async function generateMetadata({ params }) {
  const s = await load(params.tenant); if (!s) return {};
  return { title: `${s.name} — Read My Nails salon${s.city ? ' in ' + s.city : ''}`, description: `Print a Read My Nails set at ${s.name}${s.city ? ', ' + s.city : ''}. Pick your set online and walk in with your code.`, alternates: { canonical: '/salons/' + s.tenant } };
}

export default async function Salon({ params }) {
  const s = await load(params.tenant); if (!s) notFound();
  const picks = allSets().filter(x => ['EN-PUZZL-02', 'EN-BRIDE-03', 'EN-MOM-06', 'ES-INSPI-01', 'EN-SCHOO-02', 'EN-ERA-01'].includes(x.c));
  const addr = [s.address, s.city, s.region, s.postal].filter(Boolean).join(', ');
  return (
    <>
      <Nav />
      <main className="wrap">
        <section className="setpage" style={{ paddingBlock: 28 }}>
          <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
            <a href="/salons" className="muted" style={{ fontWeight: 800, textDecoration: 'none' }}>← All salons</a>
            <p className="eyebrow">Licensed salon</p>
            <h1 style={{ fontSize: 'clamp(2rem,4.5vw,3rem)' }}>{s.name}</h1>
            {s.blurb && <p className="lede">{s.blurb}</p>}
            <dl className="kv">
              {addr && <><dt>Where</dt><dd>{addr}{s.lat ? <> · <a href={`https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`} target="_blank" rel="noreferrer">Map</a></> : null}</dd></>}
              {s.hours && <><dt>Hours</dt><dd>{s.hours}</dd></>}
              {s.phone && <><dt>Phone</dt><dd><a href={'tel:' + s.phone}>{s.phone}</a></dd></>}
              {s.instagram && <><dt>Instagram</dt><dd><a href={'https://instagram.com/' + s.instagram} target="_blank" rel="noreferrer">@{s.instagram}</a></dd></>}
              {s.website && <><dt>Web</dt><dd><a href={s.website.startsWith('http') ? s.website : 'https://' + s.website} target="_blank" rel="noreferrer">{s.website}</a></dd></>}
              {s.host && <><dt>Host</dt><dd>{s.host}</dd></>}
            </dl>
            <div className="inline"><a className="btn pink" href="/library">Pick a set to send here</a></div>
          </div>
          <div style={{ display: 'grid', gap: 18, alignContent: 'start' }}>
            <div className="card">
              <h2>Plan a party here</h2>
              <p className="muted">Bride tribe, quince court, team, birthday. Make one link, send it to everyone, each friend picks her own set. The salon sees the whole party in one queue.</p>
              <PartyMaker tenant={s.tenant} />
            </div>
          </div>
        </section>
        <section className="section" style={{ paddingBlock: 40 }}>
          <h2 style={{ marginBottom: 16 }}>Popular here</h2>
          <div className="samples">
            {picks.map(x => <a className="sample setlink" href={x.url} key={x.c}><Hand set={x} small /><div className="hand-meta"><span className="ans">“{x.a}”</span><span className="code mono">{x.c}</span></div></a>)}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
