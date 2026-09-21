import { Nav, Footer } from '../../components/Site';
import SalonMap from '../../components/SalonMap';

export const metadata = {
  title: 'Find a Read My Nails salon near you',
  description: 'Licensed salons and kiosks where you can print a Read My Nails set. Pick your set online, send it to the salon, walk in with your code.',
  alternates: { canonical: '/salons' },
};

export default function Salons() {
  return (
    <>
      <Nav />
      <main className="wrap">
        <section style={{ paddingBlock: '32px 20px' }}>
          <p className="eyebrow">Salon directory</p>
          <h1 style={{ margin: '10px 0 14px', fontSize: 'clamp(2rem,4.5vw,3.2rem)' }}>Where to get it on your nails.</h1>
          <p className="lede">Every location below runs the Read My Nails library and takes sets sent from this site. Pick a set, send it, walk in with your code.</p>
        </section>
        <SalonMap />
        <section className="section" style={{ paddingBlock: 48 }}>
          <div className="board" style={{ textAlign: 'center' }}>
            <h2>Own a salon or a printer?</h2>
            <p className="muted" style={{ margin: '8px auto 18px', maxWidth: '52ch' }}>Get listed here the day you subscribe. Customers near you design at home and send the set to you before they walk in.</p>
            <a className="btn pink" href="/#pricing">See pricing</a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
