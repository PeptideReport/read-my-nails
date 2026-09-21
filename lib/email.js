// Transactional email through Resend (resend.com — free tier is 3,000/month). Set RESEND_API_KEY and EMAIL_FROM.
// Every function is a no-op without a key, so the site works before email is wired.
const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || 'https://readmynails.com';

export async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) return { skipped: true };
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM || 'Read My Nails <hello@readmynails.com>', to, subject, html }),
  });
  if (!r.ok) throw new Error('resend ' + r.status);
  return r.json();
}

const wrap = body => `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:#2B2140;max-width:560px;margin:0 auto;padding:24px">
<p style="font-weight:800;letter-spacing:.08em;color:#D6335C;font-size:13px">READ MY NAILS</p>${body}
<p style="color:#8E819F;font-size:13px;margin-top:32px">SeamlessLift LLC · Naples, Florida · <a href="${SITE()}" style="color:#8E819F">readmynails.com</a></p></div>`;

export function sendWelcome({ email, name, tenant, pin, plan }) {
  const app = `${SITE()}/k/${tenant}`;
  return sendEmail({ to: email, subject: `You're in — ${name} on Read My Nails`, html: wrap(`
<h2 style="margin:0 0 12px">Welcome, ${esc(name)}.</h2>
<p>Your salon is ready. Log in with this email and everything is on your dashboard: your chapter credits, the book, the menu cards, the session script, and your kiosk app.</p>
<p><a href="${SITE()}/login?email=${encodeURIComponent(email)}" style="display:inline-block;background:#F27BA5;color:#2B2140;font-weight:800;padding:12px 20px;border-radius:999px;text-decoration:none">Open my dashboard</a></p>
<p><b>Your kiosk app:</b> <a href="${app}">${app}</a><br><b>Host PIN:</b> ${pin} (change it on the dashboard)</p>
<p><b>Today:</b> claim your first chapters with the credits on your dashboard, download the tiles and load them into your printer. <b>This week:</b> read the session script and run five practice sessions on friends. <b>Then:</b> print the price board and open.</p>
<p>Reply to this email with anything. A person reads it.</p>`) });
}

// Files-only purchases (Start pack, Whole Library, extra chapters, monthly / drops memberships): no kiosk, just the dashboard.
const PRODUCT_LINE = {
  start: 'Your Start pack is in: 5 chapter credits are waiting on your dashboard. Pick your five chapters and download the tiles tonight.',
  monthly: 'Your monthly chapter membership is on. A new credit lands on your dashboard every month; claim any chapter with it and it is yours to keep.',
  library: 'You own the Whole Library. Every chapter is unlocked on your dashboard, tiles and all.',
  drops: 'New-chapter drops are on. Every new chapter lands on your dashboard the day it ships.',
  chapter1: 'One more chapter credit is on your dashboard.',
  chapter3: 'Three more chapter credits are on your dashboard.',
};
export function sendAccountWelcome({ email, product }) {
  return sendEmail({ to: email, subject: 'Your Read My Nails chapters are ready', html: wrap(`
<h2 style="margin:0 0 12px">Thank you.</h2>
<p>${PRODUCT_LINE[product] || 'Your purchase is on your dashboard.'}</p>
<p><a href="${SITE()}/login?email=${encodeURIComponent(email)}" style="display:inline-block;background:#F27BA5;color:#2B2140;font-weight:800;padding:12px 20px;border-radius:999px;text-decoration:none">Open my dashboard</a></p>
<p>Log in with this email — no password, we send a link. Reply to this email with anything. A person reads it.</p>`) });
}

export const DRIP = [
  { day: 2, key: 'day2', subject: 'Are the tiles in your printer yet?', body: (s) => `<p>Two days in. The one thing that matters this week is getting the 2,073 tiles loaded so the library is a tap away. If your printer app only imports one image at a time, do the first 60 (chapter Real Puzzles and your best-selling occasion) and add the rest over the week.</p><p>Stuck on the upload? Reply with your printer model and we'll send the exact steps.</p>` },
  { day: 7, key: 'day7', subject: 'Run one session on a friend today', body: (s) => `<p>Before the first paying customer, run the 12-minute session on someone you know, script in hand. Where you stumble is where she will. Five practice sessions and it's automatic.</p><p>Then print the price board and put it where people wait. "$25 · one hand · you print it, we teach you." That line does the selling.</p>` },
  { day: 14, key: 'day14', subject: 'Post the first hand', body: (s) => `<p>Two weeks. If a customer has left with a Read My Nails hand, post it — the phrase in the caption, the set code in the corner, and tag @readmynails. We repost every salon's hands, and our feed sends people to the salon directory.</p><p>Not listed yet? Turn on "List my salon" on your dashboard so customers near you can find you and send you their set before they walk in.</p>` },
];

export function sendDrip(step, salon) {
  return sendEmail({ to: salon.email, subject: step.subject, html: wrap(`<h2 style="margin:0 0 12px">${esc(salon.name)}</h2>${step.body(salon)}<p><a href="${SITE()}/dashboard" style="color:#D6335C;font-weight:800">Your dashboard →</a></p>`) });
}

export function sendOrderNotice(salon, order) {
  return sendEmail({ to: salon.email, subject: `New set sent to ${salon.name}: ${order.answer} (${order.code})`, html: wrap(`
<p><b>${esc(order.name)}</b> designed <b>“${esc(order.answer)}”</b> on readmynails.com and sent it to your salon. Code <b style="font-size:20px;letter-spacing:.2em">${order.code}</b>.</p>
<p>It's in your queue now — open the Host tab on your kiosk app. ${order.party ? `Part of the party <b>${esc(order.party)}</b>.` : ''}</p>`) });
}

const esc = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
