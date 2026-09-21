'use client';
import { useEffect, useState } from 'react';
import { browserSb } from '../../lib/browser';

export default function Login() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const q = new URLSearchParams(window.location.search); if (q.get('email')) setEmail(q.get('email'));
    browserSb().auth.getSession().then(({ data }) => { if (data?.session) window.location.replace('/dashboard'); });
  }, []);

  async function send(e) {
    e.preventDefault(); setState('sending'); setMsg('');
    const { error } = await browserSb().auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { emailRedirectTo: window.location.origin + '/dashboard' } });
    if (error) { setState('error'); setMsg(error.message); } else setState('sent');
  }

  return (
    <main className="login">
      <a className="logo" href="/" style={{ justifySelf: 'center' }}>READ MY NAILS <small>library</small></a>
      <h1 style={{ fontSize: '2rem' }}>Log in</h1>
      {state === 'sent' ? (
        <p className="muted">Check <b>{email}</b>. The login link is in your inbox; it opens your dashboard.</p>
      ) : (
        <form onSubmit={send}>
          <p className="muted">No password. We email you a link.</p>
          <input id="login-email" type="email" required placeholder="you@yoursalon.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
          <button className="btn pink" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Email me a login link'}</button>
          {msg && <p className="err" role="alert" style={{ color: 'var(--pink-deep)', fontWeight: 700 }}>{msg}</p>}
        </form>
      )}
      <p className="muted" style={{ fontSize: '0.9rem' }}>Use the email you paid with. Not a member yet? <a href="/#pricing">Get the library</a>.</p>
    </main>
  );
}
