import HeroHand, { Hand } from '../components/Hand';
import Subscribe from '../components/Subscribe';
import PickPlan from '../components/PickPlan';
import { Nav, Footer } from '../components/Site';

// Real sets from the library, verbatim (mark|polish per nail).
const HERO = [
  { n: ['🐝|sun', 'U|', 'TI|', 'FUL|', '✨|sun'], a: 'Bee-U-tiful', c: 'EN-PUZZL-02' },
  { n: ['MAID|', 'OF|lilac', '🍯|', '👗|lilac', '💜|'], a: 'Maid of honey', c: 'EN-BRIDE-03' },
  { n: ['TÚ|', 'PUEDES|pink', '💪|', '✨|pink', '💗|'], a: 'Tú puedes', c: 'ES-INSPI-01' },
  { n: ['IN|', 'MY|pink', '🎀|', 'ERA|pink', '✨|'], a: 'In my bow era', c: 'EN-ERA-01' },
  { n: ['MIS|pink', 'QUINCE|', '1️⃣5️⃣|pink', '👑|', '💗|'], a: 'Mis quince', c: 'EN-QUINC-02' },
  { n: ['MOM|', 'IS|', 'MY|', 'BFF|pink', '💗|'], a: 'Mom is my BFF', c: 'EN-MOM-06' },
];
const SAMPLES = [
  { n: ['👁️|', '🐝|sun', 'LEAF|', 'IN|', 'U|'], a: 'I believe in you', c: 'EN-PUZZL-03' },
  { n: ['HOME|', 'COMING|pink', '👑|', '26|pink', '🌹|'], a: 'Homecoming 2026', c: 'EN-SCHOO-02' },
  { n: ['🐶|pink', 'MOM|', '📷|', '🦴|', '❤️|pink'], a: 'Dog mom — her real dog', c: 'EN-LOVE-01' },
  { n: ['GRAD|sun', '🎓|', '2026|sun', '🎉|', '✨|'], a: 'Graduation 2026', c: 'EN-OCCAS-01' },
  { n: ['NOT|ink', 'A|', 'PHASE|ink', '🖤|', '🖤|ink'], a: 'Not a phase', c: 'EN-ALT-01' },
  { n: ['R|pink', 'E|', 'I|pink', 'N|', 'A|pink'], a: 'Reina', c: 'ES-REINA-01' },
];
const CHAPTERS_EN = ['Real Puzzles', 'Slay Era', 'Besties', 'Sisters', 'My Era', 'Anime & Kawaii', 'Stan Era', 'Gamer', 'School Spirit', 'Game Day', 'Pet Names', 'Rep Your City', 'Zodiac', 'Mom & Me', 'Tween', 'Birthday', 'Quinceañera', 'Bride Tribe', 'Baby on the Way', 'Girls Trip', 'Faith', 'Holidays', 'Snack Era'];
const CHAPTERS_ES = ['Acertijos', 'Reina Era', 'Amigas', 'Familia', 'Abuela y Yo', 'Papá y Yo', 'Despedida', 'Fe', 'Antojitos'];

export default function Home() {
  return (
    <>
      <Nav />

      <main>
        <section className="wrap hero">
          <div>
            <p className="eyebrow">For salons and kiosks with a nail printer</p>
            <h1 style={{ margin: '12px 0 18px' }}>The menu your <span>nail printer</span> is missing.</h1>
            <p className="lede">Your printer can put anything on a nail. Your customers still stand there asking what they should get. Read My Nails is 1,379 named sets that <em>say something</em> across five nails, with the codes, the menu cards, the ordering app and the 12-minute session to sell them.</p>
            <div className="cta" style={{ marginTop: 26 }}>
              <a className="btn pink" href="#pricing">Start for $29 · 5 chapters</a>
              <a className="btn ghost" href="/library">Browse the library</a>
            </div>
            <p className="fine" style={{ marginTop: 14 }}>Works with O’2NAILS and any inkjet nail printer that takes PNG. English, Spanish, and more.</p>
          </div>
          <HeroHand sets={HERO} />
        </section>

        <section className="wrap" style={{ paddingBottom: 56 }}>
          <div className="stats">
            <div className="stat"><b>1,379</b><span>named, coded sets</span></div>
            <div className="stat"><b>123</b><span>chapters · English, Spanish, Portuguese, Vietnamese</span></div>
            <div className="stat"><b>2,073</b><span>print-ready tiles, loaded once</span></div>
            <div className="stat"><b>12 min</b><span>per hand, customer does the work</span></div>
          </div>
        </section>

        <section className="wrap" style={{ paddingBottom: 12 }}>
          <div className="measure" style={{ display: 'grid', gap: 8, textAlign: 'center', margin: '0 auto' }}>
            <p className="quote" style={{ margin: 0 }}>Every nail printer ships with the same clip art. This is the menu it&apos;s missing &mdash; named, coded and proven at a real kiosk, not a stock-art folder.</p>
          </div>
        </section>

        <section className="wrap section two">
          <div>
            <p className="eyebrow">The problem</p>
            <h2 style={{ marginTop: 10 }}>A butterfly doesn&apos;t get shown to anyone.</h2>
          </div>
          <div className="measure" style={{ display: 'grid', gap: 16 }}>
            <p>The printer ships with thousands of clip-art images. The customer scrolls for four minutes, picks a butterfly, and never comes back for another one. There is nothing to ask for, nothing to tell her friends, nothing to book a party around.</p>
            <p>A hand that reads <b>“MAID OF 🍯”</b> gets held up in every photo at the wedding. A hand that reads <b>“HOMECOMING 👑 26”</b> brings the whole friend group in on Thursday. That is what a menu does: it gives people a name for the thing they want.</p>
            <p className="quote">You already own the printer. This is the reason to use it.</p>
          </div>
        </section>

        <section className="wrap section" id="get">
          <div className="board">
            <p className="eyebrow" style={{ textAlign: 'center' }}>What you get</p>
            <h2>The Read My Nails library</h2>
            <p className="sub">Everything a location needs to sell sets from day one. One license per location.</p>
            <ul className="menu">
              <li><span className="name">The set library</span><span className="dots" /><span className="tag">1,379 sets</span><p className="what">Every set drawn, named and coded (<span className="mono">EN-BRIDE-03</span>). 70 English chapters, 51 written-in-Spanish chapters, and first chapters in Portuguese and Vietnamese. Split sets for two friends, Mom &amp; Me pairs, photo nails for her real dog or his last name.</p></li>
              <li><span className="name">The print tiles</span><span className="dots" /><span className="tag">2,073 PNGs</span><p className="what">Black-on-transparent, 1500 × 2250, sized for the nail. Load them into the printer once; the host taps five tiles per hand. Color comes from the polish, so ink cost stays under $2 a hand.</p></li>
              <li><span className="name">The ordering app</span><span className="dots" /><span className="tag">your name on it</span><p className="what">Customers browse and customize on the tablet, get a five-letter code and a QR. The host&apos;s phone shows the queue with the five tile codes and the polish. Day sheet, CSV export, party bookings. Your salon name, your prices, your host&apos;s name.</p></li>
              <li><span className="name">The book</span><span className="dots" /><span className="tag">140 pages</span><p className="what">Every set with its code, English and Spanish, the way a menu should look on the counter. Print one and let it get dog-eared.</p></li>
              <li><span className="name">Menu cards &amp; signs</span><span className="dots" /><span className="tag">print-ready</span><p className="what">Price board, how-it-works poster, station cards, counter cards. PDF to print, HTML to change the prices.</p></li>
              <li><span className="name">The 12-minute session</span><span className="dots" /><span className="tag">word for word</span><p className="what">The script that turns a print into a $25 ticket: the customer preps, applies and prints her own nails while the host coaches. Hands-off by design; the FAQ below says what that does and doesn&apos;t settle.</p></li>
              <li><span className="name">The set generator</span><span className="dots" /><span className="tag">any phrase</span><p className="what">Type what she wants. It splits across five nails; you pick the polish; the print tiles download in the library&apos;s format. Custom names, dates, teams and sponsors, without waiting for us.</p></li>
              <li><span className="name">The salon directory</span><span className="dots" /><span className="tag">leads</span><p className="what">Your own page on readmynails.com with a map pin. Customers pick a set here and send it to you before they walk in; party links put a whole quince court in your queue.</p></li>
              <li><span className="name">New chapters</span><span className="dots" /><span className="tag">monthly</span><p className="what">Prom, graduation, quince season, holidays, whatever the girls are saying this month. Drops straight into your dashboard.</p></li>
            </ul>
          </div>
        </section>

        <section className="wrap section" id="how">
          <p className="eyebrow">How it works</p>
          <h2 style={{ margin: '10px 0 28px' }}>Three steps. The customer does the third one.</h2>
          <div className="steps">
            <div className="step"><h3>Load the tiles once</h3><p>Upload the 2,073 PNGs to your printer. Every set in the library is five of those tiles by code.</p><span className="time">One afternoon</span></div>
            <div className="step"><h3>She picks a set on the tablet</h3><p>Browses by chapter, taps a nail to change a word or add a photo, gets a code. The host&apos;s phone shows the five tiles and the polish.</p><span className="time">2 minutes</span></div>
            <div className="step"><h3>The host taps, she prints</h3><p>Base coat, cure, the host taps the tile, the customer puts her own finger in. Five nails, top coat, done. She keeps the code for next time.</p><span className="time">12 minutes a hand</span></div>
          </div>
        </section>

        <section className="wrap section">
          <p className="eyebrow">From the library</p>
          <h2 style={{ margin: '10px 0 28px' }}>Six of the 1,379.</h2>
          <div className="samples">
            {SAMPLES.map(s => (
              <a className="sample setlink" href={'/s/' + s.c} key={s.c}>
                <Hand set={s} small />
                <div className="hand-meta"><span className="ans">“{s.a}”</span><span className="code mono">{s.c}</span></div>
              </a>
            ))}
          </div>
          <div className="chapters" aria-label="Chapters">
            {CHAPTERS_EN.map(c => <span className="chip" key={c}>{c}</span>)}
            {CHAPTERS_ES.map(c => <span className="chip es" key={c}>{c}</span>)}
            <a className="chip" href="/library" style={{ textDecoration: 'none', color: 'var(--pink-deep)' }}>+ 56 more →</a>
          </div>
        </section>

        <section className="wrap section two" id="customers">
          <div>
            <p className="eyebrow">For the girl with the phone</p>
            <h2 style={{ marginTop: 10 }}>Design it at home. Print it at a salon near you.</h2>
          </div>
          <div className="measure" style={{ display: 'grid', gap: 14 }}>
            <p>Every set on this site has its own page. Pick one, tap <b>Send to a salon</b>, choose a licensed location, and it&apos;s in their queue before you leave the house. You walk in with a five-letter code.</p>
            <p>Planning a party? Make one party link at the salon&apos;s page, send it to the group chat, and every friend picks her own set. Bride tribe, quince court, the whole team, one queue.</p>
            <div className="inline"><a className="btn" href="/library">Browse the sets</a><a className="btn ghost" href="/salons">Find a salon</a></div>
          </div>
        </section>

        <section className="wrap section two" id="generator">
          <div>
            <p className="eyebrow">For the salon</p>
            <h2 style={{ marginTop: 10 }}>1,379 sets is the menu. The generator is the kitchen.</h2>
          </div>
          <div className="measure" style={{ display: 'grid', gap: 14 }}>
            <p>A customer wants <b>SOFIA&apos;S 15 👑</b> and it isn&apos;t in the book. Type it. The generator splits it across five nails, you pick the polish, and the print tiles download in the same size and font as the library. Two minutes from &ldquo;can you do…&rdquo; to the printer.</p>
            <p>Names, dates, mascots, a sponsor&apos;s wordmark, the school across the street. Sets nobody else has, and a reason to come back every season.</p>
            <p className="quote">Every salon with a printer has the same clip art. Only yours has a menu that reads.</p>
          </div>
        </section>

        <section className="wrap section two" id="own-a-location">
          <div>
            <p className="eyebrow">Bring it to your city</p>
            <h2 style={{ marginTop: 10 }}>One kiosk, proven in Naples. Curious about yours?</h2>
          </div>
          <div className="measure" style={{ display: 'grid', gap: 14 }}>
            <p>Already run a salon or own a nail printer? The plans below get you licensed today. If instead you&apos;re picturing opening a Read My Nails location of your own, we&apos;re starting to have that conversation &mdash; no fees or terms to see yet, just a place to say you&apos;re interested.</p>
            <div className="inline"><a className="btn ghost" href="/own-a-location">Tell us you&apos;re interested</a></div>
          </div>
        </section>

        <section className="wrap section" id="pricing">
          <p className="eyebrow">Pricing</p>
          <h2 style={{ margin: '10px 0 8px' }}>Pay for the chapters you print.</h2>
          <p className="lede" style={{ marginBottom: 28 }}>A chapter is ten to twenty sets on one theme &mdash; Bride Tribe, Quincea&ntilde;era, Game Day. One credit claims a chapter: every set, the print tiles, the recipe sheet, yours to keep. A one-hand session is $25; one chapter pays for itself the first afternoon.</p>
          <div className="plans four">
            <div className="plan">
              <h3>Start</h3>
              <div className="price">$29<small> once</small></div>
              <ul>
                <li><b>5 chapter credits</b> &mdash; pick any five</li>
                <li>Tiles in your printer&apos;s format, codes, recipe sheets</li>
                <li>The book, menu cards, session script</li>
                <li>Then $9.99/mo for a new chapter every month, if you want it</li>
              </ul>
              <PickPlan plan="start">Choose Start</PickPlan>
            </div>
            <div className="plan best">
              <span className="save">Most salons</span>
              <h3>Salon</h3>
              <div className="price">$59<small> /month</small></div>
              <ul>
                <li><b>2 chapter credits every month</b></li>
                <li>The ordering app at your own address, your name on it</li>
                <li>The set generator: any phrase, five tiles</li>
                <li>Listed in the directory; customers send you sets from this site; party links</li>
              </ul>
              <PickPlan plan="salon" className="btn pink sm">Choose Salon</PickPlan>
            </div>
            <div className="plan">
              <h3>Multi-location</h3>
              <div className="price">$149<small> /month</small></div>
              <ul>
                <li>Everything in Salon, for up to 3 locations</li>
                <li><b>6 chapter credits every month</b>, shared</li>
                <li>Each location with its own kiosk, PIN and listing</li>
                <li>One bill</li>
              </ul>
              <PickPlan plan="multi">Choose Multi</PickPlan>
            </div>
            <div className="plan">
              <h3>Whole Library</h3>
              <div className="price">$699<small> once</small></div>
              <ul>
                <li><b>Every chapter</b> &mdash; 123 chapters, 1,379 sets, 2,073 tiles</li>
                <li>Yours forever, one download</li>
                <li>Add $9.99/mo for new chapters as they drop</li>
                <li>Files only &mdash; the app is the Salon plan</li>
              </ul>
              <PickPlan plan="library">Choose Whole Library</PickPlan>
            </div>
          </div>
          <Subscribe />
          <p className="muted" style={{ marginTop: 16, fontSize: '0.95rem' }}>Need one more chapter? <b>$14.99</b> each, or <b>three for $35</b>, from your dashboard. Credits bank for 12 months; chapters you claim never expire. Memberships cancel any time from your dashboard.</p>
        </section>

        <section className="wrap section">
          <p className="eyebrow">Questions</p>
          <h2 style={{ margin: '10px 0 24px' }}>The ones every owner asks.</h2>
          <div className="faq">
            <details><summary>Do I need an O’2NAILS printer?</summary><p>No. The tiles are plain PNGs. Any inkjet nail printer that lets you load your own images will print them: O’2NAILS X11 Plus, X12.5, V11, Jolimark, Nailbot-style machines. If your printer only offers its built-in gallery, it won&apos;t work.</p></details>
            <details><summary>Is it a nail service? Do I need a license for this?</summary><p>Read My Nails is built as a session: the host coaches and the customer applies every product to her own nails and puts her own finger in the printer. The script keeps the host&apos;s hands off. Whether that matters depends on your state; we give you the model and the script, you check it with your own board or attorney.</p></details>
            <details><summary>What&apos;s a chapter?</summary><p>Ten to twenty sets on one theme, drawn in the same hand &mdash; Real Puzzles, Bride Tribe, Quincea&ntilde;era, Nurse Era. A credit claims the whole chapter: the tiles in your printer&apos;s format and a recipe sheet with every set&apos;s code, its five tile codes and the polish. Browse every chapter in the <a href="/library">library</a> before you choose.</p></details>
            <details><summary>Can I put my own name on it?</summary><p>Yes. The app carries your salon name, your host&apos;s first name, your prices and your polish rack. Read My Nails stays as the name of the library, the way a menu credits the chef.</p></details>
            <details><summary>What if I have two locations?</summary><p>One kiosk license per location, each with its own address and queue. Chapters belong to your account, so every location prints the same chapters. The Multi-location plan covers three.</p></details>
            <details><summary>Does it connect to my printer?</summary><p>No nail printer on the market connects to outside software. The app shows the host the five tile codes; she taps them on the printer screen. Two seconds a nail.</p></details>
            <details><summary>Can I add my own sets?</summary><p>Customers can already swap any nail for their own word, number or photo. Custom chapters for your school, your city or a local sponsor come with the Multi-location plan, and we write them for you.</p></details>
            <details><summary>What happens if I cancel?</summary><p>Chapters you claimed are yours to keep and download. Unused credits from that membership are void; the kiosk address and the generator stop at the end of the paid period. Come back any time and your salon is where you left it.</p></details>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
