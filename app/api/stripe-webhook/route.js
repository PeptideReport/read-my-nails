import { NextResponse } from 'next/server';
import { stripe, PLANS, PRODUCTS, productOfPrice } from '../../../lib/stripe';
import { sb, randomPin, uniqueTenant } from '../../../lib/supabase';
import { sendWelcome, sendAccountWelcome } from '../../../lib/email';
import { ensureAccount, grantCredits, grantChapters, voidSubscriptionCredits, allChapterCodes, norm } from '../../../lib/access';

// Stripe changed payload shapes in the 2025 API versions (invoice.subscription → invoice.parent.subscription_details,
// line.price → line.pricing.price_details.price, subscription.current_period_end → items[].current_period_end). Read both.
const subOfInvoice = inv => { const s = inv.subscription ?? inv.parent?.subscription_details?.subscription; return typeof s === 'string' ? s : s?.id || null; };
const priceOfLine = line => line?.price?.id || line?.pricing?.price_details?.price || line?.plan?.id || null;
const periodEnd = sub => { const t = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end; return t ? new Date(t * 1000).toISOString() : null; };

// Stripe → us. Events to enable on the webhook endpoint:
// checkout.session.completed, invoice.paid, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed
export async function POST(req) {
const sig = req.headers.get('stripe-signature'); const body = await req.text();
let ev;
try { ev = stripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET); }
catch (e) { return NextResponse.json({ error: 'bad signature' }, { status: 400 }); }
const db = sb();

if (ev.type === 'checkout.session.completed') {
const s = ev.data.object;
const key = s.metadata?.product || s.metadata?.plan;
const email = norm(s.customer_details?.email || s.customer_email || s.metadata?.email);
const custId = typeof s.customer === 'string' ? s.customer : s.customer?.id;
if (s.mode === 'subscription') {
const p = PRODUCTS[key] || PRODUCTS.salon;
if (p.app) await createSalon(db, s, key);
else await recordMembership(db, s, key);
if (email) await ensureAccount(db, email, custId ? { stripe_customer_id: custId } : {});
} else if (s.mode === 'payment' && PRODUCTS[key]) {
// One-time purchases: Start pack, Whole Library, extra chapters, extra AI generations.
const p = PRODUCTS[key];
if (email) {
await ensureAccount(db, email, custId ? { stripe_customer_id: custId } : {});
if (p.all) {
await grantChapters(db, email, allChapterCodes(), 'library');
await ensureAccount(db, email, { library_all: true, library_all_at: new Date().toISOString() });
}
if (p.credits) await grantCredits(db, { email, amount: p.credits, reason: key, ref: s.id, kind: p.kind || 'chapter' });
try { await sendAccountWelcome({ email, product: key }); } catch (e) {}
}
} else if (s.metadata?.code && s.metadata?.tenant) {
// Kiosk pay-ahead for a single order.
await db.from('orders').update({ paid: true, paid_at: new Date().toISOString() }).eq('tenant', s.metadata.tenant).eq('code', s.metadata.code);
}
}

// Every paid subscription invoice (first and renewals) → that month's credits.
if (ev.type === 'invoice.paid') {
const inv = ev.data.object;
const subId = subOfInvoice(inv);
if (subId) {
const line = (inv.lines?.data || []).find(l => priceOfLine(l)) || inv.lines?.data?.[0];
const key = productOfPrice(priceOfLine(line)) || line?.metadata?.product || line?.metadata?.plan || (await productOfSubscription(subId));
const p = PLANS[key];
const email = norm(inv.customer_email || (await emailOfSubscription(db, subId)));
if (p?.credits && email) await grantCredits(db, { email, amount: p.credits, reason: key, ref: inv.id, subscriptionId: subId, kind: p.kind || 'chapter' });
if (p && email) await setSubStatus(db, email, key, subId, 'active');
}
}

if (ev.type === 'customer.subscription.updated' || ev.type === 'customer.subscription.deleted') {
const sub = ev.data.object;
const status = ev.type.endsWith('deleted') ? 'canceled' : sub.status;
const end = periodEnd(sub);
await db.from('salons').update({ status, current_period_end: end, updated_at: new Date().toISOString() }).eq('stripe_subscription_id', sub.id);
const key = productOfPrice(sub.items?.data?.[0]?.price?.id) || sub.metadata?.product || sub.metadata?.plan || (await productOfSubscription(sub.id));
const email = norm(sub.metadata?.email || (await emailOfSubscription(db, sub.id)));
if (email && key) await setSubStatus(db, email, key, sub.id, status);
if (status === 'canceled') await voidSubscriptionCredits(db, sub.id); // void on cancel; claimed chapters stay
}

if (ev.type === 'invoice.payment_failed') {
const inv = ev.data.object;
const subId = subOfInvoice(inv);
if (subId) {
await db.from('salons').update({ status: 'past_due', updated_at: new Date().toISOString() }).eq('stripe_subscription_id', subId);
const email = norm(inv.customer_email || (await emailOfSubscription(db, subId)));
const line = inv.lines?.data?.[0]; const key = productOfPrice(priceOfLine(line)) || (await productOfSubscription(subId));
if (email && key) await setSubStatus(db, email, key, subId, 'past_due');
}
}

return NextResponse.json({ received: true });
}

// monthly / drops memberships live on the account row.
async function setSubStatus(db, email, key, subId, status) {
if (key === 'monthly') await ensureAccount(db, email, { monthly_sub_id: subId, monthly_status: status });
else if (key === 'drops') await ensureAccount(db, email, { drops_sub_id: subId, drops_status: status });
}

// Last resort: ask Stripe which price the subscription is on (SDK-pinned API version, stable shape).
async function productOfSubscription(subId) {
try { const sub = await stripe().subscriptions.retrieve(subId); return productOfPrice(sub.items?.data?.[0]?.price?.id) || sub.metadata?.product || sub.metadata?.plan || null; } catch (e) { return null; }
}

async function emailOfSubscription(db, subId) {
const { data: s } = await db.from('salons').select('email').eq('stripe_subscription_id', subId).maybeSingle();
if (s?.email) return s.email;
const { data: a } = await db.from('accounts').select('email').or(`monthly_sub_id.eq.${subId},drops_sub_id.eq.${subId}`).maybeSingle();
if (a?.email) return a.email;
try { const sub = await stripe().subscriptions.retrieve(subId, { expand: ['customer'] }); return sub.customer?.email || sub.metadata?.email || ''; } catch (e) { return ''; }
}

async function recordMembership(db, s, key) {
const email = norm(s.customer_details?.email || s.customer_email || s.metadata?.email);
const subId = typeof s.subscription === 'string' ? s.subscription : s.subscription?.id;
const custId = typeof s.customer === 'string' ? s.customer : s.customer?.id;
if (!email) return;
await ensureAccount(db, email, { stripe_customer_id: custId });
await setSubStatus(db, email, key, subId, 'active');
try { await sendAccountWelcome({ email, product: key }); } catch (e) {}
}

async function createSalon(db, s, key) {
const email = norm(s.customer_details?.email || s.customer_email || s.metadata?.email);
const name = s.metadata?.salon || 'My Salon';
const host = s.metadata?.host || 'your host';
const plan = PLANS[key] ? key : 'salon';
const ref = s.metadata?.ref || null;
const subId = typeof s.subscription === 'string' ? s.subscription : s.subscription?.id;
const custId = typeof s.customer === 'string' ? s.customer : s.customer?.id;

// Idempotent: the same subscription never creates two salons.
const { data: existing } = await db.from('salons').select('tenant').eq('stripe_subscription_id', subId).maybeSingle();
if (existing) return existing.tenant;

let sub = null; try { sub = await stripe().subscriptions.retrieve(subId); } catch (e) {}
const status = sub?.status || 'active';
const period = sub?.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;

const tenant = await uniqueTenant(db, name);
await db.from('tenants').upsert({ id: tenant, name });
const pin = randomPin();
await db.from('salons').insert({ tenant, name, email, host, pin, status, plan, seats: PLANS[plan].seats || 1, referrer: ref, stripe_customer_id: custId, stripe_subscription_id: subId, current_period_end: period });
await ensureAccount(db, email, { stripe_customer_id: custId });
try { await sendWelcome({ email, name, tenant, pin, plan }); await db.from('salons').update({ emails_sent: ['welcome'] }).eq('tenant', tenant); } catch (e) {}
return tenant;
}
