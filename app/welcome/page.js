'use client';
import { useEffect, useState } from 'react';
import { browserSb } from '../../lib/browser';

// Stripe sends the new salon here after payment. We send the login link to the email they paid with.
export default function Welcome() {
const [email, setEmail] = useState('');
const [state, setState] = useState('idle');
const [msg, setMsg] = useState('');

useEffect(() => {
const sid = new URLSearchParams(window.location.search).get('session_id');
if (!sid) return;
fetch('/api/subscribe/session?id=' + encodeURIComponent(sid)).then(r => r.json()).then(j => { if (j.email) setEmail(j.email); }).catch(() => {});
}, []);

async function send(e) {
e.preventDefault(); setState('sending');
const { error } = await browserSb().auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { emailRedirectTo: window.location.origin + '/dashboard' } });
if (error) { setState('error'); setMsg(error.message); } else setState('sent');
}

return (
<main className="login">
<a className="logo" href="/" style={{ justifySelf: 'center' }}>READ MY NAILS <small>library</small></a>
<h1 style={{ fontSize: '2rem' }}>You&apos;re in.</h1>
<p className="muted">Payment received. Your chapters, credits and downloads are being set up right now, it takes about ten seconds.</p>
{state === 'sent' ? (
<p className="muted">Check <b>{email}</b> for your login link. It opens your dashboard, where your chapters, the book and (on the Salon plan) your kiosk address are waiting.</p>
) : (
<form onSubmit={send}>
<input id="welcome-email" type="email" required placeholder="The email you paid with" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
<button className="btn pink" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Email me my login link'}</button>
{msg && <p role="alert" style={{ color: 'var(--pink-deep)', fontWeight: 700 }}>{msg}</p>}
</form>
)}
</main>
);
}
