import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { sb, tenantOf, requirePin } from '../../../../lib/supabase';
import { ask, configured } from '../../../../lib/ai';

export const runtime = 'nodejs';
export const maxDuration = 30;

let _script;
const script = () => (_script ||= fs.readFileSync(path.join(process.cwd(), 'data', 'host-script.md'), 'utf8'));

// POST { messages: [{role:'user'|'assistant', content}], lang } with x-tenant + x-kiosk-pin → { reply }
// The coach in the host's ear. Knows the session script, the house rules, this salon's prices and polish rack, and the printer basics.
export async function POST(req) {
  const tenant = tenantOf(req); if (!tenant) return NextResponse.json({ error: 'tenant' }, { status: 400 });
  const salon = await requirePin(req, tenant); if (!salon) return NextResponse.json({ error: 'pin' }, { status: 401 });
  if (!configured()) return NextResponse.json({ reply: 'The coach is not switched on yet (ANTHROPIC_API_KEY). The session script is in your dashboard downloads.' });
  const b = await req.json().catch(() => ({}));
  const msgs = (Array.isArray(b.messages) ? b.messages : []).slice(-12).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 1500) }));
  if (!msgs.length) return NextResponse.json({ error: 'Say something.' }, { status: 400 });
  const { data: st } = await sb().from('settings').select('data').eq('tenant', tenant).maybeSingle();
  const s = st?.data || {};
  const prices = s.prices ? Object.entries(s.prices).map(([k, v]) => `${k}: $${v}`).join(', ') : 'default menu ($25 one hand, $40 both, $45 duo/mom&me, $20 workshop each, $5 try-it)';
  const polishes = s.polishes ? s.polishes.map(p => p.n).join(', ') : 'default rack';
  const lang = b.lang === 'es' ? 'Spanish' : 'English';
  const system = `You are the coach for ${salon.host || 'the host'} at ${salon.name}, a Read My Nails location. You speak in the host's ear between customers: short, warm, practical, ${lang}. Two or three sentences unless asked for steps. Never invent policy; the script below is the policy.

THE ONE RULE: the host teaches, the customer does. The host never touches a customer's hand, finger or nail, never files, buffs, cuts or removes anything, and never calls this a service, manicure, or salon. If asked to bend that, say no kindly and give the line from the script.

This salon's prices: ${prices}. Polish rack: ${polishes}. Printer: an inkjet nail printer (O'2NAILS-class); the host taps the five tile codes on its screen, the customer places her own finger. Reprints cost pennies — when in doubt, wipe and reprint. Under 18: parent present or parent signs the card; under 10: parent does the brushing.

If the question is medical (allergies, skin conditions, injuries): do not diagnose; the allergy card on the counter and "let's do a press-on tip today" are the answers. If the question is legal beyond the script: "check with the owner."

THE SCRIPT:
${script()}`;
  // Fold the conversation into one user turn with clear speaker labels — simple and robust.
  const convo = msgs.map(m => (m.role === 'assistant' ? 'Coach: ' : 'Host: ') + m.content).join('\n');
  try {
    const reply = await ask({ system, user: convo + '\nCoach:', maxTokens: 400, temperature: 0.4 });
    return NextResponse.json({ reply: reply.trim() });
  } catch (e) { return NextResponse.json({ reply: 'The coach is busy. The script is in your dashboard downloads — the answer is almost always "wipe it and let her try again."' }); }
}
