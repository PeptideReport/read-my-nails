'use client';
import { useEffect, useState } from 'react';
import { browserSb, authedFetch } from '../../lib/browser';
import ChapterWriter from '../../components/ChapterWriter';
import Chapters from '../../components/Chapters';

const STATUS = { active: ['ok', 'Active'], trialing: ['ok', 'Trial'], past_due: ['warn', 'Card failed — update billing'], canceled: ['bad', 'Canceled'], unpaid: ['bad', 'Unpaid'], incomplete: ['warn', 'Setting up'] };
const PLAN = { salon: 'Salon', multi: 'Multi-location', house: 'House', library: 'Library (legacy)', salon_annual: 'Salon · annual', monthly: 'Salon', annual: 'Salon · annual' };

export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');
  const [ok, setOk] = useState('');

async function load() {
  const { data } = await browserSb().auth.getSession();
  if (!data?.session) { window.location.replace('/login'); return; }
  const r = await authedFetch('/api/me');
  if (r.status === 401) { window.location.replace('/login'); return; }
  setMe(await r.json());
}
  useEffect(() => {
    const sub = browserSb().auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_IN' || ev === 'INITIAL_SESSION') load(); });
    load();
    return () => sub.data.subscription.unsubscribe();
  }, []);

async function call(key, path, method, body, done) {
  setBusy(key); setErr(''); setOk('');
  const r = await authedFetch(path, { method, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) setErr(j.error || 'Something went wrong'); else { setOk(done || 'Saved'); await load(); }
  setBusy('');
}
  async function billing(tenant) {
    setBusy('billing');
    const r = await authedFetch('/api/billing-portal', { method: 'POST', body: JSON.stringify({ tenant }) });
    const j = await r.json(); if (j.url) window.location.href = j.url; else { setErr(j.error || 'Could not open billing'); setBusy(''); }
  }
  async function buyPlan(product) {
    setBusy(product); setErr('');
    const salon = window.prompt('Salon or kiosk name for the app:'); if (!salon) { setBusy(''); return; }
    const host = window.prompt("Host's first name (who runs the sessions):") || '';
    const r = await authedFetch('/api/subscribe', { method: 'POST', body: JSON.stringify({ product, salon, host }) });
    const j = await r.json().catch(() => ({}));
    if (j.url) window.location.href = j.url; else { setErr(j.error || 'Could not open checkout'); setBusy(''); }
  }
  async function logout() { await browserSb().auth.signOut(); window.location.href = '/'; }

if (!me) return <main className="dash"><p className="muted">Loading your salon…</p></main>;
  const none = me.salons.length === 0;

return (
  <main className="dash">
  <header className="nav" style={{ paddingInline: 0 }}>
<a className="logo" href="/">READ MY NAILS <small>dashboard</small></a>
  <nav className="navlinks"><a href="/generator">Generator</a><a href="/library">Library</a><span className="muted">{me.email}</span><button className="btn ghost sm" onClick={logout}>Log out</button></nav>
  </header>

{err && <p role="alert" style={{ color: 'var(--pink-deep)', fontWeight: 700 }}>{err}</p>}
{ok && <p role="status" style={{ color: 'var(--mint)', fontWeight: 700 }}>{ok}</p>}

{none && !me.account?.paying && (
  <section className="card">
  <h2>Nothing on this email yet</h2>
 <p className="muted">If you just paid, give it a minute and refresh. If you paid with a different email, log in with that one. Otherwise <a href="/#pricing">see the plans</a>.</p>
  </section>
 )}
{none && me.account?.paying && (
  <section className="card">
  <div className="inline" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
<h2>Your account</h2>
<span className="pill ok">{me.account.libraryAll ? 'Whole Library' : me.account.monthly ? 'Monthly member' : 'Chapters'}</span>
  </div>
<p className="muted">Files-only account: your chapters and downloads are below. Want the kiosk app, the generator and a directory listing at your location? That&apos;s the Salon plan.</p>
<div className="inline">
{me.payments && <button className="btn sm" onClick={() => buyPlan('salon')} disabled={busy === 'salon'}>Add the Salon plan · $59/mo</button>}
{me.account.stripe_customer_id && <button className="btn ghost sm" onClick={() => billing(null)} disabled={busy === 'billing'}>Billing · card · memberships</button>}
  </div>
  </section>
)}

{me.salons.map(s => {
  const [cls, label] = STATUS[s.status] || ['warn', s.status];
  const a = me.analytics?.[s.tenant];
  const max = a?.chapters?.[0]?.[1] || 1;
  return (
    <section className="card" key={s.tenant} id={'salon-' + s.tenant}>
               <div className="inline" style={{ justifyContent: 'space-between' }}>
<h2>{s.name}</h2>
<span className={'pill ' + cls}>{label}</span>
  </div>
<dl className="kv">
{s.hasApp ? <><dt>Kiosk app</dt><dd><a href={s.app_url} target="_blank" rel="noreferrer">{s.app_url}</a><br /><small className="muted">Open on the tablet (Customer tab) and on the host&apos;s phone (Host tab). Add it to the home screen on both.</small></dd></>
: <><dt>Kiosk app</dt><dd><span className="muted">Not on this plan. </span><button className="btn ghost sm" onClick={() => buyPlan('salon')}>Add the Salon plan</button></dd></>}
{s.hasApp && <><dt>Host PIN</dt><dd><span className="mono" style={{ fontSize: '1.2rem', letterSpacing: '0.2em' }}>{s.pin}</span></dd></>}
<dt>Plan</dt><dd>{PLAN[s.plan] || s.plan}{s.seats > 1 ? ` · ${s.seats} locations` : ''}{s.current_period_end ? <small className="muted"> · renews {new Date(s.current_period_end).toLocaleDateString()}</small> : null}</dd>
<dt>Public page</dt><dd>{s.listed ? <a href={s.profile_url} target="_blank" rel="noreferrer">{s.profile_url}</a> : <span className="muted">Not listed yet — turn it on below so customers can send you sets.</span>}</dd>
  </dl>

{s.hasApp && (
  <form className="inline" onSubmit={e => { e.preventDefault(); call('pin', '/api/me/pin', 'PUT', { tenant: s.tenant, pin: e.currentTarget.pin.value }, 'PIN changed'); }}>
<label htmlFor={'pin-' + s.tenant} style={{ fontWeight: 800 }}>New PIN</label>
<input id={'pin-' + s.tenant} name="pin" inputMode="numeric" pattern="\d{4,6}" placeholder="4–6 digits" required />
  <button className="btn ghost sm" disabled={busy === 'pin'}>Change PIN</button>
  </form>
)}

<details className="profile">
  <summary>Salon profile &amp; directory listing</summary>
<form onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); const b = { tenant: s.tenant, listed: f.get('listed') === 'on' }; for (const k of ['name', 'host', 'address', 'city', 'region', 'postal', 'country', 'phone', 'instagram', 'website', 'hours', 'blurb']) b[k] = f.get(k); call('profile', '/api/me', 'PUT', b, 'Profile saved' + (b.listed ? ' — you are on the map' : '')); }} className="profgrid">
  <label>Salon name<input name="name" defaultValue={s.name} maxLength={60} required /></label>
<label>Host&apos;s first name<input name="host" defaultValue={s.host} maxLength={40} required /></label>
<label style={{ gridColumn: '1 / -1' }}>Street address<input name="address" defaultValue={s.address} maxLength={120} placeholder="2 Coastland Center" /></label>
<label>City<input name="city" defaultValue={s.city} maxLength={60} /></label>
<label>State / region<input name="region" defaultValue={s.region} maxLength={40} /></label>
<label>Postal code<input name="postal" defaultValue={s.postal} maxLength={20} /></label>
<label>Country<input name="country" defaultValue={s.country} maxLength={40} /></label>
<label>Phone<input name="phone" defaultValue={s.phone} maxLength={30} /></label>
<label>Instagram<input name="instagram" defaultValue={s.instagram} maxLength={40} placeholder="without the @" /></label>
<label>Website<input name="website" defaultValue={s.website} maxLength={120} /></label>
<label>Hours<input name="hours" defaultValue={s.hours} maxLength={200} placeholder="Mon–Sat 10–8, Sun 12–6" /></label>
<label style={{ gridColumn: '1 / -1' }}>One line about you<input name="blurb" defaultValue={s.blurb} maxLength={240} placeholder="Mall kiosk by the food court. Walk-ins welcome, parties by appointment." /></label>
<label className="check" style={{ gridColumn: '1 / -1' }}><input type="checkbox" name="listed" defaultChecked={s.listed} /> List my salon in the directory and take sets sent from readmynails.com</label>
<div className="inline" style={{ gridColumn: '1 / -1' }}><button className="btn sm" disabled={busy === 'profile'}>Save profile</button>{s.listed && !s.geocoded && <span className="muted">Add a city so you appear on the map.</span>}</div>
  </form>
  </details>

{a && (
  <div className="stats30">
  <div className="inline" style={{ justifyContent: 'space-between' }}><h3>Last 30 days</h3><span className="muted" style={{ fontSize: '0.9rem' }}>{a.orders} orders · {a.done} done · {a.web} sent from the web · ${a.revenue.toFixed(0)}</span></div>
{a.chapters.length === 0 ? <p className="muted">No orders yet. The first one shows up here.</p> : (
 <div className="bars">{a.chapters.map(([ch, n]) => <div className="bar" key={ch}><span className="mono">{ch}</span><i style={{ width: (n / max * 100) + '%' }} /><b>{n}</b></div>)}</div>
  )}
  </div>
)}

<div className="inline">
{s.plan !== 'house' && <button className="btn sm" onClick={() => billing(s.tenant)} disabled={busy === 'billing'}>Billing · card · plan · cancel</button>}
{s.seats > 1 && (
  <form className="inline" onSubmit={e => { e.preventDefault(); call('loc', '/api/me/location', 'POST', { tenant: s.tenant, name: e.currentTarget.locname.value, host: e.currentTarget.lochost.value }, 'Location added'); }}>
<input name="locname" placeholder="New location name" required maxLength={60} style={{ width: '13em' }} /><input name="lochost" placeholder="Host" maxLength={40} style={{ width: '8em' }} /><button className="btn ghost sm" disabled={busy === 'loc'}>Add location</button>
  </form>
)}
</div>
  </section>
);
})}

<Chapters payments={me.payments} onChange={load} />

  <section className="card">
  <h2>Downloads</h2>
{me.downloads.length === 0 ? <p className="muted">The book, menu cards and session script unlock with any purchase.</p> : (
 <div className="dl">
{me.downloads.map(d => d.url
                  ? <a key={d.key} href={d.url}><span><b>{d.title}</b><small>{d.note}</small></span><span className="go">Download ↓</span></a>
: <div className="off" key={d.key}><span><b>{d.title}</b><small>Not uploaded yet — coming shortly.</small></span></div>)}
{me.account?.hasApp || me.isAdmin ? <a href="/generator"><span><b>Set generator</b><small>Any phrase → five print tiles. Custom names, dates, teams, sponsors.</small></span><span className="go">Open →</span></a>
: <div className="off"><span><b>Set generator</b><small>Comes with the Salon plan.</small></span></div>}
  </div>
)}
<p className="muted" style={{ fontSize: '0.9rem' }}>Links work for one hour. Come back for a fresh one any time.</p>
  </section>

{me.salons.length > 0 && <ChapterWriter salons={me.salons} isAdmin={me.isAdmin} ai={me.ai} />}

<section className="card">
  <h2>What people are asking for</h2>
{me.requests?.length ? (
  <div className="chapters">{me.requests.map(r => <span className="chip" key={r.phrase} title={r.n + ' times'}>{r.phrase}{r.n > 1 ? ` · ${r.n}` : ''}</span>)}</div>
  ) : <p className="muted">Every phrase typed into the generator or "Say it for me" lands here. That list is next month&apos;s chapter.</p>}
  </section>

<section className="card">
  <h2>Trending across the network this week</h2>
 {me.trending?.length ? (
   <ol className="trend">{me.trending.map(t => <li key={t.code}>{t.url ? <a href={t.url}>"{t.answer}"</a> : t.answer} <span className="mono muted">{t.code}</span><span className="muted"> · {t.orders}</span></li>)}</ol>
  ) : <p className="muted">Shows what customers are ordering most across every Read My Nails salon, once there are orders this week.</p>}
    </section>

 <section className="card">
    <h2>New chapters</h2>
  {me.releases.length === 0 ? <p className="muted">The first monthly drop lands here.</p> : (
   <div className="dl">
  {me.releases.map(r => r.url
                   ? <a key={r.id} href={r.url}><span><b>{r.title}</b><small>{r.body}</small></span><span className="go">Download ↓</span></a>
  : <div className="off" key={r.id}><span><b>{r.title}</b><small>{r.body}</small></span></div>)}
 </div>
 )}
</section>

<section className="card">
  <h2>Set up in an afternoon</h2>
<ol style={{ margin: 0, paddingLeft: '1.2em', display: 'grid', gap: 8, color: 'var(--ink-2)' }}>
<li>Claim your chapters above, download the tiles and load them into your printer (<a href="/guides">printer guides</a>).</li>
  <li>Open the kiosk app on the tablet and the host&apos;s phone. Host tab → PIN → Settings: your prices and your polish rack.</li>
<li>Fill in your salon profile above and turn on the listing, so customers near you can send you sets.</li>
<li>Print the price board and how-it-works poster from the menu cards, laminate the station cards.</li>
<li>Read the session script. Run five practice sessions on friends before the first paying customer.</li>
  </ol>
  </section>

{me.isAdmin && (
  <section className="card">
  <h2>Admin · partners</h2>
 <p className="muted" style={{ fontSize: '0.9rem' }}>Every salon that signed up through a partner link (readmynails.com/?ref=CODE). Add partners in Supabase → partners.</p>
{me.partners?.length ? <table className="ptable"><thead><tr><th>Code</th><th>Partner</th><th>Share</th><th>Salons</th><th>Active</th></tr></thead><tbody>{me.partners.map(p => <tr key={p.code}><td className="mono">{p.code}</td><td>{p.name}</td><td>{p.share_pct}%</td><td>{p.salons}</td><td>{p.active}</td></tr>)}</tbody></table> : <p className="muted">No partners yet.</p>}
<p className="muted" style={{ fontSize: '0.85rem' }}>Admin view: showing every salon above.</p>
  </section>
)}
</main>
);
}
