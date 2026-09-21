'use client';
import { useEffect, useState } from 'react';
import { authedFetch } from '../lib/browser';

// Dashboard: credits, the chapter shelf, claim + download. PRICING-SPEC-v1.
const LANG = { EN: 'English', ES: 'Español', PT: 'Português', VI: 'Tiếng Việt' };
const PRINTERS = [['o2nails', 'O’2NAILS'], ['jolimark', 'Jolimark'], ['sunwin', 'Sunwin'], ['widermatrix', 'Widermatrix'], ['fingernails2go', 'Fingernails2Go'], ['generic', 'Any PNG printer']];

export default function Chapters({ payments = true, onChange }) {
  const [d, setD] = useState(null);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [printer, setPrinter] = useState('o2nails');
  const [tab, setTab] = useState('mine');

  async function load() { const r = await authedFetch('/api/claims'); if (r.ok) setD(await r.json()); }
  useEffect(() => { load(); try { const p = localStorage.getItem('rmn_printer'); if (p) setPrinter(p); } catch (e) {} }, []);

  async function claim(code) {
    setBusy(code); setErr('');
    const r = await authedFetch('/api/claims', { method: 'POST', body: JSON.stringify({ chapter: code }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) setErr(j.error || 'Try again'); else { await load(); onChange && onChange(); }
    setBusy('');
  }
  async function buy(product) {
    setBusy(product); setErr('');
    const r = await authedFetch('/api/subscribe', { method: 'POST', body: JSON.stringify({ product }) });
    const j = await r.json().catch(() => ({}));
    if (j.url) window.location.href = j.url; else { setErr(j.error || 'Could not open checkout'); setBusy(''); }
  }
  async function download(code) {
    setBusy('dl-' + code); setErr('');
    try {
      const r = await authedFetch(`/api/chapters/${code}/zip?printer=${printer}`);
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || 'Download failed'); }
      const blob = await r.blob(); const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `read-my-nails-${code.toLowerCase()}.zip`; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (x) { setErr(x.message); }
    setBusy('');
  }

  if (!d) return <section className="card"><h2>Your chapters</h2><p className="muted">Loading…</p></section>;
  const s = q.trim().toLowerCase();
  const mine = d.chapters.filter(c => c.claimed);
  const list = (tab === 'mine' ? mine : d.chapters).filter(c => !s || (c.title + ' ' + c.code + ' ' + c.blurb).toLowerCase().includes(s));
  const byLang = {}; for (const c of list) (byLang[c.lang] = byLang[c.lang] || []).push(c);
  const nothing = !d.all && mine.length === 0 && d.credits === 0;

  return (
    <section className="card" id="chapters">
      <div className="inline" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <h2>Your chapters</h2>
        {d.all ? <span className="pill ok">Every chapter</span> : <span className="pill ok">{d.credits} credit{d.credits === 1 ? '' : 's'} · {mine.length} chapter{mine.length === 1 ? '' : 's'} claimed</span>}
      </div>
      {!d.all && <p className="muted">A credit claims any chapter: every set in it, the print tiles, forever. Credits bank for 12 months.{d.monthly ? ' A new credit lands every month.' : ''}</p>}
      {err && <p role="alert" style={{ color: 'var(--pink-deep)', fontWeight: 700 }}>{err}</p>}

      {payments && !d.all && (
        <div className="inline" style={{ flexWrap: 'wrap' }}>
          <button className="btn sm" onClick={() => buy('chapter1')} disabled={!!busy}>+1 chapter · $14.99</button>
          <button className="btn sm" onClick={() => buy('chapter3')} disabled={!!busy}>+3 chapters · $35</button>
          {!d.monthly && <button className="btn ghost sm" onClick={() => buy('monthly')} disabled={!!busy}>1 chapter every month · $9.99/mo</button>}
          {!d.libraryAll && <button className="btn ghost sm" onClick={() => buy('library')} disabled={!!busy}>The Whole Library · $699 once</button>}
          {d.libraryAll && !d.drops && <button className="btn ghost sm" onClick={() => buy('drops')} disabled={!!busy}>New chapters as they drop · $9.99/mo</button>}
        </div>
      )}
      {nothing && <p className="muted">No chapters yet. Pick a pack above, or <a href="/#pricing">see the plans</a>.</p>}

      <div className="inline" style={{ justifyContent: 'space-between', flexWrap: 'wrap', marginTop: 8 }}>
        <div className="inline">
          <button type="button" className={'btn sm ' + (tab === 'mine' ? '' : 'ghost')} onClick={() => setTab('mine')}>Mine{d.all ? '' : ` (${mine.length})`}</button>
          <button type="button" className={'btn sm ' + (tab === 'all' ? '' : 'ghost')} onClick={() => setTab('all')}>All {d.chapters.length}</button>
          <input placeholder="Search chapters" value={q} onChange={e => setQ(e.target.value)} aria-label="Search chapters" style={{ width: '12em' }} />
        </div>
        <label className="inline" style={{ gap: 6, fontSize: '0.9rem', fontWeight: 800 }}>Tiles for
          <select value={printer} onChange={e => { setPrinter(e.target.value); try { localStorage.setItem('rmn_printer', e.target.value); } catch (x) {} }}>{PRINTERS.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select>
        </label>
      </div>

      {Object.entries(byLang).map(([lang, cs]) => (
        <div key={lang}>
          <h3 style={{ margin: '14px 0 8px' }}>{LANG[lang] || lang} <span className="muted" style={{ fontWeight: 400 }}>· {cs.length}</span></h3>
          <div className="dl">
            {cs.map(c => (
              <div key={c.code} className={c.claimed ? '' : 'off'} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', padding: '12px 16px', borderRadius: 14, background: c.claimed ? 'var(--surface-2)' : undefined, border: c.claimed ? 'none' : '2px solid var(--line)' }}>
                <span><b>{c.title}</b> <span className="mono muted" style={{ fontSize: '0.85rem' }}>{c.code}</span><small style={{ display: 'block', color: 'var(--ink-2)' }}>{c.sets} sets{c.blurb ? ' · ' + c.blurb : ''}</small></span>
                {c.claimed
                  ? <button className="btn sm" onClick={() => download(c.code)} disabled={busy === 'dl-' + c.code}>{busy === 'dl-' + c.code ? 'Rendering…' : 'Download tiles ↓'}</button>
                  : <button className="btn ghost sm" onClick={() => claim(c.code)} disabled={!!busy || d.credits < 1} title={d.credits < 1 ? 'No credits left' : 'Spend one credit'}>{busy === c.code ? '…' : 'Claim · 1 credit'}</button>}
              </div>
            ))}
          </div>
        </div>
      ))}
      {list.length === 0 && tab === 'mine' && !nothing && <p className="muted">Nothing claimed yet — switch to “All” and pick a chapter.</p>}
      <p className="muted" style={{ fontSize: '0.85rem', marginTop: 10 }}>Each download is the chapter&apos;s tiles in your printer&apos;s format plus a recipe sheet: every set, its code, the five tile codes and the polish. Load the tiles/ folder into the printer once.</p>
    </section>
  );
}
