'use client';
import { useState } from 'react';

export default function PartyMaker({ tenant }) {
  const [out, setOut] = useState(null); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [copied, setCopied] = useState(false);
  async function make(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      const r = await fetch('/api/party', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenant, name: f.get('name'), host: f.get('host'), date: f.get('date') || null }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Try again'); setOut(j);
    } catch (x) { setErr(x.message); }
    setBusy(false);
  }
  if (out) return (
    <div style={{ display: 'grid', gap: 10 }}>
      <p><b>Your party link:</b></p>
      <input readOnly value={out.url} id="party-url" onFocus={e => e.target.select()} />
      <div className="inline">
        <button className="btn pink sm" onClick={async () => { try { await navigator.clipboard.writeText(out.url); setCopied(true); } catch (e) {} }}>{copied ? 'Copied' : 'Copy link'}</button>
        <a className="btn ghost sm" href={'https://wa.me/?text=' + encodeURIComponent('Pick your nails for the party: ' + out.url)} target="_blank" rel="noreferrer">WhatsApp</a>
      </div>
      <p className="muted" style={{ fontSize: '0.9rem' }}>Everyone who opens it picks a set and it lands at the salon under this party&apos;s name.</p>
    </div>
  );
  return (
    <form onSubmit={make} style={{ display: 'grid', gap: 10 }}>
      <input id="party-name" name="name" required maxLength={60} placeholder="Party name (Maria's quince court)" />
      <div className="inline">
        <input id="party-host" name="host" maxLength={40} placeholder="Your name" style={{ flex: 1, minWidth: 140 }} />
        <input id="party-date" name="date" type="date" style={{ minWidth: 150 }} />
      </div>
      <div className="inline"><button className="btn sm" disabled={busy}>{busy ? '…' : 'Make the party link'}</button>{err && <span role="alert" style={{ color: 'var(--pink-deep)', fontWeight: 700 }}>{err}</span>}</div>
    </form>
  );
}
