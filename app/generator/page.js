'use client';
import { useEffect, useState } from 'react';
import { Nav, Footer } from '../../components/Site';
import { Nail } from '../../components/Hand';
import { browserSb, authedFetch } from '../../lib/browser';
import { splitPhrase, tileCode, POLISH_NAME } from '../../lib/marks';

const POLISHES = ['', 'pink', 'lilac', 'mint', 'sun', 'sky', 'ink'];
const PRINTERS = [['o2nails', 'O’2NAILS (X11 Plus, X12.5, X30, V11)'], ['jolimark', 'Jolimark NP-101D / 311D'], ['sunwin', 'Sunwin NA03 / NA04'], ['wm860', 'Widermatrix WM860 upload'], ['fingernails2go', 'Fingernails2Go photo path'], ['generic', 'Any printer that takes PNG']];
const warn = (polish, ink) => (polish === 'ink' && ink !== 'white') ? 'black on black — switch to white ink' : (ink === 'white' && polish === '') ? 'white on bare — use black or a color' : '';

// Licensee tool: any phrase → five nails → print tiles. The library is the menu; this is the kitchen.
export default function Generator() {
  const [authed, setAuthed] = useState(null);
  const [phrase, setPhrase] = useState('SOFIA\'S 15 👑');
  const [nails, setNails] = useState(() => splitPhrase('SOFIA\'S 15 👑').map((t, i) => ({ t, polish: i % 2 ? 'pink' : '' })));
  const [name, setName] = useState('');
  const [size, setSize] = useState('M');
  const [printer, setPrinter] = useState('o2nails');
  const [mirror, setMirror] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { browserSb().auth.getSession().then(({ data }) => setAuthed(!!data?.session)); }, []);

  function applyPhrase(p) { setPhrase(p); const parts = splitPhrase(p); setNails(parts.map((t, i) => ({ t, polish: nails[i]?.polish ?? (i % 2 ? 'pink' : '') }))); }
  function edit(i, patch) { setNails(n => n.map((x, k) => k === i ? { ...x, ...patch } : x)); }

  async function download() {
    setErr(''); setBusy(true);
    try {
      const r = await authedFetch('/api/generator/zip', { method: 'POST', body: JSON.stringify({ name: name || phrase, nails: nails.map(n => ({ ...n, ink: n.ink === 'white' ? '#fff' : '#000' })), size, printer, mirror }) });
      if (r.status === 401) throw new Error('Log in with your salon account to render tiles.');
      if (!r.ok) throw new Error((await r.json()).error || 'Render failed');
      const blob = await r.blob(); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `read-my-nails-${(name || phrase).replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.zip`; a.click();
    } catch (x) { setErr(x.message); }
    setBusy(false);
  }

  return (
    <>
      <Nav />
      <main className="wrap" style={{ paddingBlock: 28, maxWidth: 900 }}>
        <p className="eyebrow">Set generator · licensees</p>
        <h1 style={{ margin: '8px 0 10px', fontSize: 'clamp(2rem,4.5vw,3rem)' }}>Any phrase. Five nails. Print tonight.</h1>
        <p className="lede" style={{ marginBottom: 22 }}>Type what she wants to say. We split it across the hand, you fix the nails, and the print tiles come down as a zip in the same format as the library.</p>

        <div className="card" style={{ gap: 16 }}>
          <label style={{ display: 'grid', gap: 6, fontWeight: 800 }}>Phrase
            <input id="gen-phrase" value={phrase} onChange={e => applyPhrase(e.target.value)} maxLength={60} placeholder="HOMECOMING 👑 26" style={{ fontSize: '1.1rem' }} />
          </label>
          <div className="hand-card" style={{ background: 'var(--surface-2)', boxShadow: 'none' }}>
            <div className="hand">{nails.map((n, i) => <Nail key={i} spec={n.t + '|' + n.polish} />)}</div>
          </div>
          <div className="gengrid">
            {nails.map((n, i) => (
              <div className="gennail" key={i}>
                <span className="eyebrow">Nail {i + 1}</span>
                <input id={'gen-n' + i} value={n.t} maxLength={14} onChange={e => edit(i, { t: e.target.value })} aria-label={'Nail ' + (i + 1) + ' mark'} />
                <select id={'gen-p' + i} value={n.polish} onChange={e => edit(i, { polish: e.target.value })} aria-label={'Nail ' + (i + 1) + ' polish'}>
                  {POLISHES.map(p => <option key={p} value={p}>{POLISH_NAME[p]}</option>)}
                </select>
                <select id={'gen-i' + i} value={n.ink || 'black'} onChange={e => edit(i, { ink: e.target.value })} aria-label={'Nail ' + (i + 1) + ' ink'}>
                  <option value="black">Black ink</option><option value="white">White ink</option>
                </select>
                {warn(n.polish, n.ink) && <span style={{ color: 'var(--pink-deep)', fontSize: '0.72rem', fontWeight: 800 }}>{warn(n.polish, n.ink)}</span>}
                <span className="mono muted" style={{ fontSize: '0.75rem' }}>{n.t ? tileCode(n.t) : ''}</span>
              </div>
            ))}
          </div>
          <div className="fitrow">
            <label>Nail length<select id="gen-size" value={size} onChange={e => setSize(e.target.value)}><option value="S">Short — bolder, smaller mark</option><option value="M">Medium</option><option value="L">Long</option></select></label>
            <label>Printer<select id="gen-printer" value={printer} onChange={e => setPrinter(e.target.value)}>{PRINTERS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
            <label className="check"><input type="checkbox" id="gen-mirror" checked={mirror} onChange={e => setMirror(e.target.checked)} /> Reads to the wearer (pinky → thumb)</label>
          </div>
          <div className="inline">
            <input id="gen-name" value={name} onChange={e => setName(e.target.value)} maxLength={40} placeholder="Set name (optional)" style={{ width: '14em' }} />
            <button className="btn pink" onClick={download} disabled={busy || authed === false}>{busy ? 'Rendering…' : 'Download print tiles (zip)'}</button>
            {authed === false && <a className="btn ghost sm" href="/login">Log in to render</a>}
            {err && <span role="alert" style={{ color: 'var(--pink-deep)', fontWeight: 700 }}>{err}</span>}
          </div>
          <p className="muted" style={{ fontSize: '0.9rem' }}>Tiles render at 1500 × 2250, black on transparent, in the same Fredoka Bold and Noto emoji as the library, so they sit next to the library tiles in your printer. Keep marks to 1–6 characters per nail; a nail is small. No brand names, characters or logos — customer names, dates, places and their own photos are fine.</p>
        </div>

        <section style={{ paddingBlock: 40 }}>
          <h2 style={{ marginBottom: 12 }}>Things that sell</h2>
          <div className="chapters">
            {['MRS 💍 SMITH 2 B', 'SOFIA\'S 15 👑', 'GO 🐯 TIGERS 26', 'PROM 👗 W/ LUCA', 'DOG MOM 🐶 BELLA', 'CLASS OF 2027 🎓', 'BACH 🌴 NAPLES', 'ABUELA ❤️ MIA', 'TEAM 🏐 CAPTAIN', 'SWEET 16 🎂'].map(p => <button type="button" className="chip" key={p} onClick={() => applyPhrase(p)} style={{ cursor: 'pointer', border: 0, font: 'inherit' }}>{p}</button>)}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
