import { createClient } from '@supabase/supabase-js';

// Server-side client (service role). Never import this into a client component.
export const sb = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

export const ACTIVE = ['active', 'trialing', 'past_due']; // past_due keeps the kiosk running while Stripe retries the card

const SLUG = /^[a-z0-9][a-z0-9-]{1,40}$/;

// Which salon is this request for? Header from app.html, or ?t= on the URL.
export function tenantOf(req) {
  const h = req.headers.get('x-tenant');
  const q = new URL(req.url).searchParams.get('t');
  const t = (h || q || '').toLowerCase();
  return SLUG.test(t) ? t : null;
}

// Load the salon row; null if the tenant doesn't exist or the subscription lapsed.
export async function activeSalon(tenant) {
  if (!tenant) return null;
  const { data } = await sb().from('salons').select('*').eq('tenant', tenant).single();
  if (!data || !ACTIVE.includes(data.status)) return null;
  return data;
}

// Host PIN check for a tenant. Returns the salon row on success, null otherwise.
export async function requirePin(req, tenant) {
  const pin = req.headers.get('x-kiosk-pin');
  if (!pin) return null;
  const s = await activeSalon(tenant);
  return s && s.pin === pin ? s : null;
}

// Logged-in salon owner (Supabase Auth bearer token from the dashboard). Returns { user, salons[] }.
export async function currentUser(req) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const db = sb();
  const { data, error } = await db.auth.getUser(token);
  if (error || !data?.user?.email) return null;
  const email = data.user.email.toLowerCase();
  const admins = (process.env.ADMIN_EMAILS || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  const isAdmin = admins.includes(email);
  const q = db.from('salons').select('*').order('created_at', { ascending: false });
  const { data: salons } = isAdmin ? await q : await q.eq('email', email);
  return { user: data.user, email, isAdmin, salons: salons || [] };
}

export function slugify(name) {
  const base = String(name || 'salon').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'salon';
  return base;
}

export function randomPin() { return String(Math.floor(1000 + Math.random() * 9000)); }

// my-salon, my-salon-2, my-salon-3 …
export async function uniqueTenant(db, name) {
  const base = slugify(name); let tenant = base;
  for (let i = 2; i < 100; i++) {
    const { data } = await db.from('salons').select('tenant').eq('tenant', tenant).maybeSingle();
    if (!data) break; tenant = base + '-' + i;
  }
  return tenant;
}

// Free geocoder (OpenStreetMap Nominatim). One request per save; fine at this scale.
export async function geocode(q) {
  try {
    const r = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(q), { headers: { 'User-Agent': 'readmynails.com (hello@readmynails.com)' } });
    const j = await r.json(); if (j?.[0]) return { lat: +j[0].lat, lng: +j[0].lon };
  } catch (e) {}
  return null;
}
