import { NextResponse } from 'next/server';
import { sb, ACTIVE } from '../../../lib/supabase';
import { PLANS } from '../../../lib/stripe';
import { allChapters } from '../../../lib/library';

export const dynamic = 'force-dynamic';

const COLS = 'tenant,name,host,city,region,country,address,postal,phone,instagram,website,hours,blurb,lat,lng';

// GET → public directory: listed, paying salons only. Used by the map and the send-to-salon picker.
// GET ?chapter=EN-PUZZL → only salons that can print that chapter (claimed it, or see everything).
export async function GET(req) {
  const chapter = String(new URL(req.url).searchParams.get('chapter') || '').toUpperCase().split('-').slice(0, 2).join('-');
  const db = sb();
  // Network/custom chapters aren't claimed — every listed salon can print them.
  if (!chapter || !allChapters().some(c => c.code === chapter)) {
    const { data } = await db.from('salon_directory').select('*').order('name');
    return NextResponse.json(data || [], { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } });
  }
  const { data } = await db.from('salons').select(COLS + ',email,plan').eq('listed', true).in('status', ACTIVE).order('name');
  const rows = data || [];
  const emails = [...new Set(rows.map(r => r.email))];
  const { data: cl } = emails.length ? await db.from('chapter_claims').select('email').eq('chapter', chapter).in('email', emails) : { data: [] };
  const { data: ac } = emails.length ? await db.from('accounts').select('email,library_all,drops_status').in('email', emails) : { data: [] };
  const can = new Set((cl || []).map(c => c.email));
  for (const a of ac || []) if (a.library_all && a.drops_status === 'active') can.add(a.email);
  const out = rows.filter(r => PLANS[r.plan]?.all || can.has(r.email)).map(({ email, plan, ...r }) => r);
  return NextResponse.json(out, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } });
}
