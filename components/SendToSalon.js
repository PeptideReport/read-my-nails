'use client';
import { useEffect, useMemo, useState } from 'react';

// Set page: pick a salon, add your name, get a code + QR. Reads a party cookie set by /party/<id>.
export function readParty() {
  try { const m = document.cookie.match(/(?:^|; )rmn_party=([^;]+)/); return m ? JSON.parse(decodeURIComponent(m[1])) : null; } catch (e) { return null; }
}

export default function SendToSalon({ set, es }) {
  const [salons, setSalons] = useState([]);
  const [q, setQ] = useState('');
  const [tenant, setTenant] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [party, setParty] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch('/api/salons?chapter=' + encodeURIComponent(set.c)).then(r => r.json()).then(setSalons).catch(() => {});
    const p = readParty(); if (p) { setParty(p); setTenant(p.tenant); setOpen(true); }
  }, []);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return salons.filter(x => !s || [x.name, x.city, x.region, x.postal].filter(Boolean).join(' ').toLowerCase().includes(s)).slice(0, 12);
  }, [salons, q]);
  const chosen = salons.find(s => s.tenant === tenant);

  async function send(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const r = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-tenant': tenant }, body: JSON.stringify({ web: true, setCode: set.c, name, phone, party: party?.id || null }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Try again');
      setDone(j);
    } catch (x) { setErr(x.message); }
    setBusy(false);
  }

  const t = es ? { btn: 'Enviar a un salón', title: 'Envíalo a un salón', find: 'Busca por ciudad o nombre', pick: 'Elige tu salón', name: 'Tu nombre', go: 'Obtener mi código', none: 'Ningún salón tiene este capítulo todavía. Comparte esta página con tu salón.', show: 'Muestra este código en el salón. Ya está en su cola.', party: 'Fiesta' }
    : { btn: 'Send to a salon', title: 'Send it to a salon', find: 'Search by city or salon name', pick: 'Pick your salon', name: 'Your first name', go: 'Get my code', none: 'No salon carries this chapter yet. Share this page with your salon.', show: 'Show this code at the salon. It is already in their queue.', party: 'Party' };

  if (done) return (
    <div className="card" style={{ textAlign: 'center' }}>
      <p className="eyebrow">{done.salon}</p>
      <div className="bigcode mono">{done.code}</div>
      <img src={'/api/qr?t=' + encodeURIComponent('RMN:' + done.code)} width="160" height="160" alt="" style={{ margin: '0 auto', borderRadius: 12 }} />
      <p className="muted">{t.show}</p>
      <p><b>“{done.answer}”</b> · ${done.price}</p>
    </div>
  );

  if (!open) return <button className="btn pink" onClick={() => setOpen(true)}>{t.btn}</button>;

  return (
    <form className="card" onSubmit={send}>
      <h3>{t.title}</h3>
      {party && <p className="pill ok" style={{ justifySelf: 'start' }}>{t.party}: {party.name}</p>}
      {!party && (
        <>
          <input id="salon-q" placeholder={t.find} value={q} onChange={e => setQ(e.target.value)} autoComplete="off" />
          {salons.length === 0 ? <p className="muted">{t.none}</p> : (
            <div className="salonlist" role="listbox" aria-label={t.pick}>
              {list.map(s => <button type="button" key={s.tenant} role="option" aria-selected={s.tenant === tenant} className={'salonopt' + (s.tenant === tenant ? ' on' : '')} onClick={() => setTenant(s.tenant)}><b>{s.name}</b><small>{[s.city, s.region].filter(Boolean).join(', ')}</small></button>)}
            </div>
          )}
        </>
      )}
      {chosen && party && <p className="muted"><b>{chosen.name}</b> · {[chosen.city, chosen.region].filter(Boolean).join(', ')}</p>}
      <input id="order-name" placeholder={t.name} value={name} onChange={e => setName(e.target.value)} required maxLength={40} autoComplete="given-name" />
      <input id="order-phone" placeholder={es ? 'Celular (opcional, te mandamos el código)' : 'Mobile (optional — we text you the code)'} value={phone} onChange={e => setPhone(e.target.value)} maxLength={20} inputMode="tel" autoComplete="tel" />
      <div className="inline">
        <button className="btn pink" disabled={!tenant || busy}>{busy ? '…' : t.go}</button>
        {err && <span role="alert" style={{ color: 'var(--pink-deep)', fontWeight: 700 }}>{err}</span>}
      </div>
    </form>
  );
}
