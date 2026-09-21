import { NextResponse } from 'next/server';
import { sb, ACTIVE } from '../../../../lib/supabase';
import { DRIP, sendDrip } from '../../../../lib/email';
import { grantChapters, allChapterCodes } from '../../../../lib/access';

// Vercel Cron hits this daily (vercel.json). Sends day-2 / day-7 / day-14 emails to salons that haven't had them.
export async function GET(req) {
  const auth = req.headers.get('authorization') || '';
  if (process.env.CRON_SECRET && auth !== 'Bearer ' + process.env.CRON_SECRET) return NextResponse.json({ error: 'auth' }, { status: 401 });
  const db = sb();
  // Drops sweep: Whole Library owners on the $9.99/mo drops membership claim every chapter that landed since — kept forever, even after they cancel.
  let dropped = 0;
  const { data: subs } = await db.from('accounts').select('email').eq('library_all', true).eq('drops_status', 'active');
  const codes = allChapterCodes();
  for (const a of subs || []) {
    const { data: have } = await db.from('chapter_claims').select('chapter').eq('email', a.email);
    const had = new Set((have || []).map(c => c.chapter));
    const missing = codes.filter(c => !had.has(c));
    if (missing.length) { await grantChapters(db, a.email, missing, 'drops'); dropped += missing.length; }
  }
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ skipped: 'no RESEND_API_KEY', dropped });
  const { data: salons } = await db.from('salons').select('tenant,name,email,plan,created_at,emails_sent,status').in('status', ACTIVE).neq('plan', 'house');
  let sent = 0;
  for (const s of salons || []) {
    const age = (Date.now() - new Date(s.created_at).getTime()) / 864e5;
    const done = new Set(s.emails_sent || []);
    for (const step of DRIP) {
      if (age >= step.day && !done.has(step.key)) {
        try { await sendDrip(step, s); done.add(step.key); sent++; } catch (e) {}
        break; // one email per salon per day, oldest step first
      }
    }
    if (done.size !== (s.emails_sent || []).length) await db.from('salons').update({ emails_sent: [...done] }).eq('tenant', s.tenant);
  }
  return NextResponse.json({ sent, dropped });
}
