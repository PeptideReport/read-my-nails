import { NextResponse } from 'next/server';
import { sb, currentUser, ACTIVE, geocode } from '../../../lib/supabase';
import { planHasApp } from '../../../lib/stripe';
import { setByCode } from '../../../lib/library';
import { entitlements } from '../../../lib/access';

const FILES = [
  { key: 'tiles', path: 'tiles.zip', title: 'The whole tile library', note: '2,073 print-ready PNGs + sets.csv + tiles.csv, every chapter at once. Whole Library owners.', all: true },
  { key: 'book', path: 'Read-My-Nails-Library.pdf', title: 'The Library — quick reference', note: 'Every set with its code, the five tile codes and the polish. Searchable PDF for the counter and the printer.' },
  { key: 'menu', path: 'menu-cards.zip', title: 'Menu & station cards', note: 'Price board, how-it-works poster, station cards, counter cards. HTML to edit, PDF to print.' },
  { key: 'script', path: 'session-script.pdf', title: 'The 12-minute session', note: 'How the host runs a session, word for word. Practice five times before opening.' },
];

// GET (bearer) → { email, isAdmin, salons[], downloads[], releases[], analytics, trending[], partners? }
export async function GET(req) {
  const me = await currentUser(req); if (!me) return NextResponse.json({ error: 'login' }, { status: 401 });
  const site = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const db = sb();
  // PRICING-SPEC-v1: the book, cards and script come with any purchase; the all-tiles zip only with the Whole Library (or house plan).
  const ent = await entitlements(db, me.email, me.salons);
  const anyActive = me.isAdmin || ent.paying;
  const wholeLib = me.isAdmin || ent.all || ent.libraryAll;
  let downloads = [];
  if (anyActive) {
    for (const f of FILES) {
      if (f.all && !wholeLib) continue;
      const { data } = await db.storage.from('library').createSignedUrl(f.path, 3600);
      downloads.push({ ...f, url: data?.signedUrl || null });
    }
  }
  const { data: releases } = await db.from('releases').select('id,title,body,file_path,published_at').order('published_at', { ascending: false }).limit(12);
  const rel = [];
  for (const r of releases || []) {
    let url = null;
    if (anyActive && r.file_path) { const { data } = await db.storage.from('library').createSignedUrl(r.file_path, 3600); url = data?.signedUrl || null; }
    rel.push({ ...r, url });
  }

  // Analytics: last 30 days by chapter, per salon; plus what's trending across the whole network this week.
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const analytics = {};
  for (const s of me.salons) {
    const { data: rows } = await db.from('orders').select('set_code,price,status,source,created_at').eq('tenant', s.tenant).gte('created_at', since).limit(5000);
    const byChapter = {}; let revenue = 0, done = 0, web = 0;
    for (const r of rows || []) {
      const ch = r.set_code ? r.set_code.split('-').slice(0, 2).join('-') : 'CUSTOM';
      byChapter[ch] = (byChapter[ch] || 0) + 1;
      if (r.status === 'done') { done++; revenue += Number(r.price) || 0; }
      if (r.source === 'web') web++;
    }
    analytics[s.tenant] = { orders: (rows || []).length, done, revenue, web, chapters: Object.entries(byChapter).sort((a, b) => b[1] - a[1]).slice(0, 8) };
  }
  const { data: tr } = await db.from('trending_sets').select('*').limit(10);
  const trending = (tr || []).map(t => { const s = setByCode(t.set_code); return { code: t.set_code, orders: t.orders, answer: s?.a || t.set_code, url: s ? s.url : null }; });

  // Request mining: what people typed into the generator and "say it for me" — next month's chapters.
  let reqq = db.from('requests').select('phrase,kind,lang,created_at').gte('created_at', since).order('created_at', { ascending: false }).limit(500);
  if (!me.isAdmin) reqq = reqq.in('tenant', me.salons.map(s => s.tenant));
  const { data: reqs } = await reqq;
  const tally = {}; for (const r of reqs || []) { const k = r.phrase.toLowerCase().trim(); tally[k] = (tally[k] || 0) + 1; }
  const requests = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([phrase, n]) => ({ phrase, n }));

  let partners = null, royalties = null;
  if (me.isAdmin) {
    const { data: cc } = await db.from('custom_chapters').select('code,title,creator').eq('tenant', '*').not('creator', 'is', null);
    const { data: co } = await db.from('creator_orders').select('*');
    royalties = (cc || []).map(c => ({ code: c.code, title: c.title, creator: c.creator, orders: (co || []).find(x => x.chapter === c.code)?.orders || 0 }));
    const { data: p } = await db.from('partners').select('*');
    const { data: refd } = await db.from('salons').select('referrer,status,created_at').not('referrer', 'is', null);
    partners = (p || []).map(x => ({ ...x, salons: (refd || []).filter(r => r.referrer === x.code).length, active: (refd || []).filter(r => r.referrer === x.code && ACTIVE.includes(r.status)).length }));
  }

  const salons = me.salons.map(s => ({
    tenant: s.tenant, name: s.name, host: s.host, pin: s.pin, status: s.status, plan: s.plan, seats: s.seats || 1, email: s.email, current_period_end: s.current_period_end, referrer: s.referrer,
    app_url: planHasApp(s.plan) ? site + '/k/' + s.tenant : null, active: ACTIVE.includes(s.status), hasApp: planHasApp(s.plan),
    listed: !!s.listed, address: s.address || '', city: s.city || '', region: s.region || '', postal: s.postal || '', country: s.country || 'US', phone: s.phone || '', instagram: s.instagram || '', website: s.website || '', hours: s.hours || '', blurb: s.blurb || '', geocoded: !!s.lat,
    profile_url: site + '/salons/' + s.tenant, stripe_subscription_id: s.stripe_subscription_id,
  }));
  const account = { credits: ent.credits, claimed: ent.claims.length, all: me.isAdmin || ent.all, libraryAll: ent.libraryAll, monthly: ent.monthly, drops: ent.drops, hasApp: ent.hasApp, paying: anyActive, stripe_customer_id: ent.account?.stripe_customer_id || null };
  return NextResponse.json({ email: me.email, isAdmin: me.isAdmin, salons, account, downloads, releases: rel, analytics, trending, partners, royalties, requests, ai: !!process.env.ANTHROPIC_API_KEY, payments: !!process.env.STRIPE_SECRET_KEY });
}

// PUT { tenant, host?, name?, listed?, address?, city?, region?, postal?, country?, phone?, instagram?, website?, hours?, blurb? } (bearer)
export async function PUT(req) {
  const me = await currentUser(req); if (!me) return NextResponse.json({ error: 'login' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const salon = me.salons.find(s => s.tenant === b.tenant);
  if (!salon) return NextResponse.json({ error: 'not yours' }, { status: 403 });
  const patch = { updated_at: new Date().toISOString() };
  const str = (k, n) => { if (b[k] !== undefined) patch[k] = String(b[k] || '').trim().slice(0, n) || null; };
  if (b.host) patch.host = String(b.host).slice(0, 40);
  if (b.name) patch.name = String(b.name).slice(0, 60);
  if (b.listed !== undefined) patch.listed = !!b.listed;
  str('address', 120); str('city', 60); str('region', 40); str('postal', 20); str('country', 40); str('phone', 30); str('instagram', 40); str('website', 120); str('hours', 200); str('blurb', 240);
  if (patch.instagram) patch.instagram = patch.instagram.replace(/^@/, '');
  // Geocode when the address changed (or was never geocoded).
  const addrChanged = ['address', 'city', 'region', 'postal', 'country'].some(k => b[k] !== undefined && (b[k] || '') !== (salon[k] || ''));
  const merged = { ...salon, ...patch };
  if ((addrChanged || !salon.lat) && (merged.city || merged.address)) {
    const g = await geocode([merged.address, merged.city, merged.region, merged.postal, merged.country].filter(Boolean).join(', '));
    if (g) { patch.lat = g.lat; patch.lng = g.lng; }
  }
  const { error } = await sb().from('salons').update(patch).eq('tenant', b.tenant);
  if (!error && patch.name) await sb().from('tenants').update({ name: patch.name }).eq('id', b.tenant);
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true, geocoded: !!(patch.lat || salon.lat) });
}
