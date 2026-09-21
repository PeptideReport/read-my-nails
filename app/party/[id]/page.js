'use client';
import { useEffect, useState } from 'react';
import { Nav, Footer } from '../../../components/Site';

// A party link. Sets a cookie so every set page sends to this salon under this party name, then points at the library.
export default function Party({ params }) {
const [p, setP] = useState(undefined);
useEffect(() => {
fetch('/api/party?id=' + encodeURIComponent(params.id)).then(r => r.json()).then(j => {
setP(j);
if (j?.salon) document.cookie = 'rmn_party=' + encodeURIComponent(JSON.stringify({ id: j.id, name: j.name, tenant: j.salon.tenant })) + '; path=/; max-age=' + 30 * 86400 + '; samesite=lax';
}).catch(() => setP(null));
}, [params.id]);
return (
<>
<Nav />
<main className="wrap" style={{ paddingBlock: 40, maxWidth: 720 }}>
{p === undefined && <p className="muted">Loading…</p>}
{p === null && <p>This party link isn&apos;t valid any more.</p>}
{p && (
<div className="card" style={{ textAlign: 'center', gap: 16 }}>
<p className="eyebrow">You&apos;re invited</p>
<h1 style={{ fontSize: 'clamp(2rem,4.5vw,3rem)' }}>{p.name}</h1>
<p className="muted">{p.host ? `${p.host} is hosting at ` : 'At '}<b>{p.salon?.name}</b>{p.salon?.city ? `, ${p.salon.city}` : ''}{p.date ? ` · ${new Date(p.date + 'T12:00:00').toLocaleDateString()}` : ''}.</p>
<p>Pick the set you want on your nails. It goes straight to the salon under the party&apos;s name, and you walk in with your code. {p.orders > 0 && <b>{p.orders} picked so far.</b>}</p>
<a className="btn pink" href="/library">Pick my set</a>
<p className="muted" style={{ fontSize: '0.9rem' }}>Tip: split sets in Besties, Sisters and Bride Tribe read across two people&apos;s hands.</p>
</div>
)}
</main>
<Footer />
</>
);
}
