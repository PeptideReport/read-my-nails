'use client';
import { useEffect, useState } from 'react';

// Checkout form under the pricing grid. PRICING-SPEC-v1: one-time packs and memberships in one picker.
const T = {
en: {
title: 'Get your chapters', sub: 'Card on the next screen. Your login link and downloads are ready the minute it clears.',
preview: "You pick your exact chapters in your dashboard after you join — nothing's locked in at checkout.", previewCta: 'Browse all 143 chapters first',
salon: 'Salon or kiosk name', host: "Host's first name", hostPh: 'Who runs the sessions', email: 'Email for your login', go: 'Continue to payment', busy: 'Opening checkout…',
fine: 'Chapters you claim are yours to keep · cancel memberships anytime',
plans: { start: 'Start · $29 · 5 chapters', salon: 'Salon · $59/mo · app + 2 chapters/mo', multi: 'Multi-location · $149/mo', library: 'Whole Library · $699 once', monthly: 'Monthly · $9.99/mo · 1 chapter' },
},
es: {
title: 'Obtén tus capítulos', sub: 'La tarjeta va en la siguiente pantalla. Tu enlace de acceso y las descargas quedan listos al instante.',
preview: 'Eliges tus capítulos exactos en tu panel después de unirte — nada queda fijo al pagar.', previewCta: 'Explora los 143 capítulos primero',
salon: 'Nombre del salón o kiosco', host: 'Nombre de quien atiende', hostPh: 'Quien dirige las sesiones', email: 'Email para tu acceso', go: 'Continuar al pago', busy: 'Abriendo el pago…',
fine: 'Los capítulos que reclamas son tuyos para siempre · cancela cuando quieras',
plans: { start: 'Inicio · $29 · 5 capítulos', salon: 'Salón · $59/mes · app + 2 capítulos/mes', multi: 'Multi-local · $149/mes', library: 'Biblioteca completa · $699 una vez', monthly: 'Mensual · $9.99/mes · 1 capítulo' },
},
};
const NEEDS_SALON = { salon: true, multi: true };

export default function Subscribe({ defaultPlan = 'start', lang = 'en' }) {
const t = T[lang];
const [plan, setPlan] = useState(defaultPlan);
const [busy, setBusy] = useState(false);
const [err, setErr] = useState('');
const [ref, setRef] = useState('');

useEffect(() => {
// Partner links: readmynails.com/?ref=CODE. Remembered for 30 days so the partner gets credit even if they come back later.
try {
const q = new URLSearchParams(window.location.search).get('ref');
if (q) document.cookie = 'rmn_ref=' + encodeURIComponent(q.toUpperCase()) + '; path=/; max-age=' + 30 * 86400 + '; samesite=lax';
const m = document.cookie.match(/(?:^|; )rmn_ref=([^;]+)/); if (m) setRef(decodeURIComponent(m[1]));
const p = new URLSearchParams(window.location.search).get('plan'); if (p && T.en.plans[p]) setPlan(p);
const pick = e => { const k = e.detail; if (T.en.plans[k]) setPlan(k); };
window.addEventListener('rmn:plan', pick); return () => window.removeEventListener('rmn:plan', pick);
} catch (e) {}
}, []);

async function go(e) {
e.preventDefault(); setErr(''); setBusy(true);
const f = new FormData(e.currentTarget);
try {
const r = await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product: plan, salon: f.get('salon'), host: f.get('host'), email: f.get('email'), ref }) });
const j = await r.json();
if (!r.ok || !j.url) throw new Error(j.error || 'Something went wrong. Try again.');
window.location.href = j.url;
} catch (x) { setErr(x.message); setBusy(false); }
}
const needsSalon = !!NEEDS_SALON[plan];
return (
<div className="signup" id="signup">
<h3 style={{ marginBottom: 6 }}>{t.title}</h3>
<p className="muted" style={{ marginBottom: 10 }}>{t.sub}</p>
<p className="muted" style={{ marginBottom: 18 }}>{t.preview} <a href="/library" style={{ color: 'var(--pink-deep)', fontWeight: 600, whiteSpace: 'nowrap' }}>{t.previewCta} →</a></p>
<form onSubmit={go}>
<div className="planpick" role="radiogroup" aria-label="Plan">
{Object.entries(t.plans).map(([k, label]) => <label key={k}><input type="radio" name="plan" id={'plan-' + k} value={k} checked={plan === k} onChange={() => setPlan(k)} /> {label}</label>)}
</div>
{needsSalon && <label>{t.salon}<input id="salon" name="salon" required maxLength={60} placeholder="Luxe Nails Tampa" autoComplete="organization" /></label>}
{needsSalon && <label>{t.host}<input id="host" name="host" required maxLength={40} placeholder={t.hostPh} autoComplete="given-name" /></label>}
<label style={{ gridColumn: '1 / -1' }}>{t.email}<input id="email" name="email" type="email" required placeholder="you@yoursalon.com" autoComplete="email" /></label>
<div className="row">
<button className="btn pink" type="submit" disabled={busy}>{busy ? t.busy : t.go}</button>
<span className="muted" style={{ fontSize: '0.9rem' }}>{t.fine}{ref ? ` · partner ${ref}` : ''}</span>
{err && <span className="err" role="alert">{err}</span>}
</div>
</form>
</div>
);
}
