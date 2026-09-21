'use client';
import { useEffect, useState } from 'react';
import { Hand } from './Hand';
import { authedFetch } from '../lib/browser';

const LANGS = [['EN', 'English'], ['ES', 'Español'], ['PT', 'Português'], ['VI', 'Tiếng Việt'], ['TL', 'Tagalog'], ['FR', 'Français'], ['IT', 'Italiano'], ['HT', 'Kreyòl'], ['KO', '한국어'], ['JA', '日本語']];
const STATUS = { draft: ['warn', 'Draft'], submitted: ['warn', 'Creator submission'], approved: ['ok', 'Live in your kiosk'], global: ['ok', 'Live everywhere'] };

// Chapter on demand. The salon types a theme; the engine writes, screens and saves a draft; the salon edits and approves.
export default function ChapterWriter({ salons, isAdmin, ai }) {
  const [drafts, setDrafts] = useState([]);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [dropped, setDropped] = useState([]);
  const [open, setOpen] = useState(null);

  async function load() { const r = await authedFetch('/api/ai/chapter'); if (r.ok) setDrafts((await r.json()).drafts); }
  useEffect(() => { load(); }, []);

  async function write(e) {
    e.preventDefault(); setErr(''); setDropped([]); setBusy('write');
    const f = new FormData(e.currentTarget);
    const r = await authedFetch('/api/ai/chapter', { method: 'POST', body: JSON.stringify({ tenant: f.get('tenant'), theme: f.get('theme'), lang: f.get('lang'), count: Number(f.get('count')), audience: f.get('audience'), notes: f.get('notes') }) });
    const j = await r.json();
    if (!r.ok) setErr(j.error || 'Try again'); else { setDropped(j.dropped || []); setOpen(j.draft.id); await load(); }
    setBusy('');
  }
  async function act(d, action, sets) {
    setBusy(action + d.id); setErr('');
    const r = await authedFetch('/api/ai/chapter', { method: 'PUT', body: JSON.stringify({ id: d.id, action, sets }) });
    const j = await r.json(); if (!r.ok) setErr(j.error || 'Try again'); else await load();
    setBusy('');
  }
  function edit(d, i, k, v) {
    const sets = d.sets.map((s, idx) => idx !== i ? s : k === 'a' ? { ...s, a: v } : s);
    setDrafts(ds => ds.map(x => x.id === d.id ? { ...x, sets } : x));
  }
  function editNail(d, i, j, v) {
    const sets = d.sets.map((s, idx) => { if (idx !== i || !s.n) return s; const n = s.n.slice(); const [, p = ''] = n[j].split('|'); n[j] = v + '|' + p; return { ...s, n }; });
    setDrafts(ds => ds.map(x => x.id === d.id ? { ...x, sets } : x));
  }
  function remove(d, i) { setDrafts(ds => ds.map(x => x.id === d.id ? { ...x, sets: x.sets.filter((_, idx) => idx !== i) } : x)); }

  return (
    <section className="card" id="writer">
      <h2>Write a chapter</h2>
      <p className="muted">Type the occasion, the team, the school, the joke you keep hearing. The engine writes twelve sets in the house voice, screens every one, and you approve what goes on your menu.</p>
      {!ai && <p className="pill warn" style={{ justifySelf: 'start' }}>Writer not switched on yet — add ANTHROPIC_API_KEY in Vercel.</p>}
      <form onSubmit={write} className="profgrid" style={{ marginTop: 4 }}>
        <label style={{ gridColumn: '1 / -1' }}>Theme<input name="theme" id="ch-theme" required maxLength={200} placeholder="Volleyball team, regionals this Saturday, purple and gold" /></label>
        <label>Language<select name="lang" id="ch-lang" defaultValue="EN">{LANGS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label>How many<select name="count" id="ch-count" defaultValue="12">{[6, 8, 12, 16, 24].map(n => <option key={n} value={n}>{n} sets</option>)}</select></label>
        <label>Audience<input name="audience" id="ch-aud" maxLength={120} placeholder="high-school girls, the team's moms" /></label>
        {salons.length > 1 && <label>For<select name="tenant" id="ch-tenant">{salons.map(s => <option key={s.tenant} value={s.tenant}>{s.name}</option>)}</select></label>}
        {salons.length <= 1 && <input type="hidden" name="tenant" value={salons[0]?.tenant || ''} />}
        <label style={{ gridColumn: '1 / -1' }}>Notes<input name="notes" id="ch-notes" maxLength={300} placeholder="Mascot is a tiger. Coach is Ms. Rivera. Keep it sweet." /></label>
        <div className="inline" style={{ gridColumn: '1 / -1' }}><button className="btn pink sm" disabled={busy === 'write' || !ai}>{busy === 'write' ? 'Writing…' : 'Write it'}</button>{err && <span role="alert" style={{ color: 'var(--pink-deep)', fontWeight: 700 }}>{err}</span>}</div>
      </form>
      {dropped.length > 0 && <p className="muted" style={{ fontSize: '0.9rem' }}>Screened out: {dropped.map(d => `“${d.a}” (${d.why})`).join(' · ')}</p>}

      {drafts.length > 0 && <div className="dl" style={{ marginTop: 8 }}>
        {drafts.map(d => {
          const [cls, label] = STATUS[d.status] || ['warn', d.status];
          const isOpen = open === d.id;
          return (
            <div key={d.id} className="draft">
              <button type="button" className="drafthead" onClick={() => setOpen(isOpen ? null : d.id)}>
                <span><b>{d.title || d.theme}</b> <small className="muted">· {d.lang} · {d.sets.length} sets{d.code ? ' · ' + d.code : ''}{d.creator ? ' · by ' + d.creator.name + (d.creator.instagram ? ' @' + d.creator.instagram : '') : ''}</small></span>
                <span className={'pill ' + cls}>{label}</span>
              </button>
              {isOpen && (
                <div className="draftbody">
                  <p className="muted" style={{ fontSize: '0.9rem' }}>{d.blurb}</p>
                  <div className="samples">
                    {d.sets.map((s, i) => (
                      <div className="sample" key={i} style={{ position: 'relative' }}>
                        {s.n ? <Hand set={s} small /> : <><Hand set={{ n: s.sp[0], a: s.a }} small /><Hand set={{ n: s.sp[1], a: s.a }} small /></>}
                        {(d.status === 'draft' || d.status === 'submitted') && s.n && <div className="nailedit">{s.n.map((x, j) => <input key={j} value={x.split('|')[0]} maxLength={7} onChange={e => editNail(d, i, j, e.target.value)} aria-label={'Nail ' + (j + 1)} />)}</div>}
                        {(d.status === 'draft' || d.status === 'submitted') ? <input className="ansedit" value={s.a} onChange={e => edit(d, i, 'a', e.target.value)} aria-label="Phrase" /> : <div className="hand-meta"><span className="ans">“{s.a}”</span><span className="code mono">{s.c || ''}</span></div>}
                        {s.x && <small className="muted" style={{ paddingInline: 8 }}>{s.x}</small>}
                        {(d.status === 'draft' || d.status === 'submitted') && <button type="button" className="btn ghost sm" onClick={() => remove(d, i)} style={{ position: 'absolute', top: 6, right: 6, padding: '2px 8px' }} aria-label="Remove set">✕</button>}
                      </div>
                    ))}
                  </div>
                  {(d.status === 'draft' || d.status === 'submitted') && (
                    <div className="inline" style={{ marginTop: 12 }}>
                      {d.status === 'draft' && <button className="btn pink sm" onClick={() => act(d, 'approve', d.sets)} disabled={!!busy}>Approve → my kiosk</button>}
                      {isAdmin && <button className="btn sm" onClick={() => act(d, 'global', d.sets)} disabled={!!busy}>Publish to every salon</button>}
                      <button className="btn ghost sm" onClick={() => act(d, 'save', d.sets)} disabled={!!busy}>Save edits</button>
                      <button className="btn ghost sm" onClick={() => act(d, 'discard')} disabled={!!busy}>Discard</button>
                    </div>
                  )}
                  {d.status !== 'draft' && d.status !== 'submitted' && <p className="muted" style={{ fontSize: '0.9rem', marginTop: 8 }}>On the kiosk under “{d.title}”. Turn it off any time from the kiosk&apos;s Settings → chapters.</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>}
    </section>
  );
}
