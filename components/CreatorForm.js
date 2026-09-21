'use client';
import { useState } from 'react';
import { Nail } from './Hand';
import { POLISH_NAME } from '../lib/marks';

const POLISHES = ['', 'pink', 'lilac', 'mint', 'sun', 'sky', 'ink'];
const blank = () => ({ n: ['', '', '', '', ''], polish: ['', 'pink', '', 'pink', ''], a: '' });

export default function CreatorForm() {
  const [sets, setSets] = useState([blank(), blank(), blank(), blank(), blank()]);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [done, setDone] = useState(false);
  const edit = (i, patch) => setSets(ss => ss.map((s, k) => k === i ? { ...s, ...patch } : s));
  const editNail = (i, j, v) => setSets(ss => ss.map((s, k) => { if (k !== i) return s; const n = s.n.slice(); n[j] = v; return { ...s, n }; }));
  const editPolish = (i, j, v) => setSets(ss => ss.map((s, k) => { if (k !== i) return s; const p = s.polish.slice(); p[j] = v; return { ...s, polish: p }; }));

  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    const f = new FormData(e.currentTarget);
    const r = await fetch('/api/creators', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: f.get('name'), email: f.get('email'), instagram: f.get('instagram'), title: f.get('title'), blurb: f.get('blurb'), lang: f.get('lang'), sets }) });
    const j = await r.json(); if (!r.ok) setErr(j.error || 'Try again'); else setDone(true);
    setBusy(false);
  }
  if (done) return <div className="card"><h3>Got it.</h3><p className="muted">We read every chapter. If it goes live you&apos;ll get an email with your credit and the royalty details. Usually within a week.</p></div>;

  return (
    <form onSubmit={submit} className="card" style={{ gap: 18 }}>
      <div className="profgrid">
        <label>Your name<input name="name" id="cr-name" required maxLength={60} /></label>
        <label>Email<input name="email" id="cr-email" type="email" required maxLength={120} /></label>
        <label>Instagram<input name="instagram" id="cr-ig" maxLength={40} placeholder="without the @" /></label>
        <label>Language<select name="lang" id="cr-lang" defaultValue="EN"><option value="EN">English</option><option value="ES">Español</option><option value="PT">Português</option><option value="VI">Tiếng Việt</option><option value="TL">Tagalog</option><option value="FR">Français</option><option value="IT">Italiano</option><option value="HT">Kreyòl</option><option value="KO">한국어</option><option value="JA">日本語</option></select></label>
        <label>Chapter title<input name="title" id="cr-title" required maxLength={40} placeholder="Nurse Era" /></label>
        <label>One line about it<input name="blurb" id="cr-blurb" maxLength={120} placeholder="For the ones who work the night shift." /></label>
      </div>
      {sets.map((s, i) => (
        <div key={i} className="crset">
          <div className="inline" style={{ justifyContent: 'space-between' }}><b>Set {i + 1}</b>{sets.length > 5 && <button type="button" className="btn ghost sm" onClick={() => setSets(ss => ss.filter((_, k) => k !== i))}>Remove</button>}</div>
          <div className="hand" style={{ padding: '10px 0 4px' }}>{s.n.map((m, j) => <Nail key={j} spec={(m || '·') + '|' + s.polish[j]} small />)}</div>
          <div className="gengrid">
            {s.n.map((m, j) => (
              <div className="gennail" key={j}>
                <input id={`cr-${i}-${j}`} value={m} maxLength={7} placeholder={'Nail ' + (j + 1)} onChange={e => editNail(i, j, e.target.value)} aria-label={`Set ${i + 1} nail ${j + 1}`} />
                <select value={s.polish[j]} onChange={e => editPolish(i, j, e.target.value)} aria-label="Polish">{POLISHES.map(p => <option key={p} value={p}>{POLISH_NAME[p]}</option>)}</select>
              </div>
            ))}
          </div>
          <input id={'cr-a-' + i} value={s.a} maxLength={60} placeholder="The phrase, as read aloud" onChange={e => edit(i, { a: e.target.value })} aria-label="Phrase" />
        </div>
      ))}
      <div className="inline">
        {sets.length < 12 && <button type="button" className="btn ghost sm" onClick={() => setSets(ss => [...ss, blank()])}>+ Add a set</button>}
        <button className="btn pink" disabled={busy}>{busy ? 'Sending…' : 'Submit the chapter'}</button>
        {err && <span role="alert" style={{ color: 'var(--pink-deep)', fontWeight: 700 }}>{err}</span>}
      </div>
      <p className="muted" style={{ fontSize: '0.85rem' }}>By submitting you confirm the sets are your own work, contain no one else&apos;s trademarks or characters, and license SeamlessLift LLC to publish them in the library with credit to you under the royalty terms above.</p>
    </form>
  );
}
