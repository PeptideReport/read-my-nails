// SMS through Twilio's REST API (no SDK). Optional: without TWILIO_* env vars nothing is sent.
export async function sendSms(to, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID, tok = process.env.TWILIO_AUTH_TOKEN, from = process.env.TWILIO_FROM;
  if (!sid || !tok || !from || !to) return { skipped: true };
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST', headers: { Authorization: 'Basic ' + Buffer.from(sid + ':' + tok).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: to, From: from, Body: body.slice(0, 320) }),
  });
  if (!r.ok) throw new Error('twilio ' + r.status);
  return r.json();
}
export const normalizePhone = p => { const d = String(p || '').replace(/\D/g, ''); if (d.length === 10) return '+1' + d; if (d.length === 11 && d[0] === '1') return '+' + d; if (d.length > 10) return '+' + d; return null; };
