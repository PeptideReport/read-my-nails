// Credits, claims and entitlements — PRICING-SPEC-v1.
// An account is an email. Salons (kiosk licenses) hang off the same email; chapters and credits belong to the account.
import { sb, ACTIVE } from './supabase';
import { PLANS, CREDIT_MONTHS } from './stripe';
import { allChapters } from './library';

const now = () => new Date().toISOString();
export const norm = e => String(e || '').trim().toLowerCase();

export async function getAccount(db, email) {
  email = norm(email); if (!email) return null;
  const { data } = await db.from('accounts').select('*').eq('email', email).maybeSingle();
  return data || null;
}

export async function ensureAccount(db, email, patch = {}) {
  email = norm(email);
  const { data } = await db.from('accounts').upsert({ email, ...patch, updated_at: now() }, { onConflict: 'email' }).select().single();
  return data;
}

// Live grants: not voided, not expired. Balance = sum(remaining).
export async function grants(db, email) {
  const { data } = await db.from('credit_grants').select('*').eq('email', norm(email)).eq('voided', false).gt('remaining', 0).order('expires_at', { ascending: true, nullsFirst: false });
  return (data || []).filter(g => !g.expires_at || new Date(g.expires_at) > new Date());
}
export async function balance(db, email) { return (await grants(db, email)).reduce((a, g) => a + g.remaining, 0); }

// Add credits. `ref` (a Stripe invoice or checkout session id) makes it idempotent — the same event never grants twice.
export async function grantCredits(db, { email, amount, reason, ref, subscriptionId = null }) {
  email = norm(email); if (!email || !amount) return null;
  await ensureAccount(db, email);
  if (ref) { const { data: dup } = await db.from('credit_grants').select('id').eq('ref', ref).maybeSingle(); if (dup) return dup; }
  const expires = new Date(); expires.setMonth(expires.getMonth() + CREDIT_MONTHS);
  const { data } = await db.from('credit_grants').insert({ email, amount, remaining: amount, reason, ref, subscription_id: subscriptionId, expires_at: expires.toISOString() }).select().single();
  return data;
}

// Subscription canceled → its unspent credits are void. Claimed chapters stay.
export async function voidSubscriptionCredits(db, subscriptionId) {
  if (!subscriptionId) return;
  await db.from('credit_grants').update({ voided: true }).eq('subscription_id', subscriptionId).gt('remaining', 0);
}

export async function claims(db, email) {
  const { data } = await db.from('chapter_claims').select('chapter,source,created_at').eq('email', norm(email));
  return data || [];
}

// Whole-library owners and house/legacy-library salons see everything; everyone else sees what they claimed.
export async function entitlements(db, email, salons = []) {
  email = norm(email);
  const acct = await getAccount(db, email);
  const activeSalons = salons.filter(s => ACTIVE.includes(s.status));
  // Whole Library buyers had every chapter claimed at purchase; `all` is only for house/legacy salons and active Drops (new chapters as they land).
  const all = activeSalons.some(s => PLANS[s.plan]?.all) || (!!acct?.library_all && acct?.drops_status === 'active');
  const cl = await claims(db, email);
  const credits = await balance(db, email);
  const claimed = new Set(cl.map(c => c.chapter));
  const hasApp = activeSalons.some(s => PLANS[s.plan]?.app);
  const paying = all || claimed.size > 0 || credits > 0 || activeSalons.length > 0 || acct?.monthly_status === 'active';
  return { account: acct, all, claimed, claims: cl, credits, hasApp, paying, libraryAll: !!acct?.library_all, drops: acct?.drops_status === 'active', monthly: acct?.monthly_status === 'active' };
}

export function chapterExists(code) { return allChapters().some(c => c.code === code); }

// Spend one credit on a chapter (oldest-expiring grant first). Returns { ok } or { error }.
export async function claimChapter(db, email, chapter, source = 'credit') {
  email = norm(email); chapter = String(chapter || '').toUpperCase();
  if (!chapterExists(chapter)) return { error: 'No such chapter.' };
  const { data: had } = await db.from('chapter_claims').select('chapter').eq('email', email).eq('chapter', chapter).maybeSingle();
  if (had) return { ok: true, already: true };
  const gs = await grants(db, email);
  const g = gs[0]; if (!g) return { error: 'No credits left. Add a chapter for $14.99 or three for $35.' };
  const { error } = await db.from('credit_grants').update({ remaining: g.remaining - 1 }).eq('id', g.id).eq('remaining', g.remaining);
  if (error) return { error: error.message };
  const { error: e2 } = await db.from('chapter_claims').insert({ email, chapter, source, grant_id: g.id });
  if (e2) { await db.from('credit_grants').update({ remaining: g.remaining }).eq('id', g.id); return { error: e2.message }; }
  return { ok: true };
}

// Free claim (no credit): Whole Library purchase, drops sweep, admin grant.
export async function grantChapters(db, email, codes, source) {
  email = norm(email); if (!codes.length) return;
  await ensureAccount(db, email);
  await db.from('chapter_claims').upsert(codes.map(chapter => ({ email, chapter, source })), { onConflict: 'email,chapter', ignoreDuplicates: true });
}

export const allChapterCodes = () => allChapters().map(c => c.code);
