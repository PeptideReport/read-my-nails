import { NextResponse } from 'next/server';
import { sb, activeSalon } from '../../../lib/supabase';

const id = () => { const a = 'abcdefghjkmnpqrstuvwxyz23456789'; let s = ''; for (let i = 0; i < 8; i++) s += a[Math.floor(Math.random() * a.length)]; return s; };

// POST { tenant, name, host, date } → { id, url }  (anyone; a bride, a quince mom, a coach)
export async function POST(req) {
  const b = await req.json().catch(() => ({}));
  const tenant = String(b.tenant || '').toLowerCase();
  const salon = await activeSalon(tenant);
  if (!salon || !salon.listed) return NextResponse.json({ error: 'Pick a listed salon.' }, { status: 400 });
  const name = String(b.name || '').trim().slice(0, 60); if (!name) return NextResponse.json({ error: 'Name the party.' }, { status: 400 });
  const row = { id: id(), tenant, name, host: String(b.host || '').trim().slice(0, 40) || null, date: b.date || null };
  const { error } = await sb().from('parties').insert(row);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const site = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  return NextResponse.json({ id: row.id, url: site + '/party/' + row.id });
}

// GET ?id= → party + salon name
export async function GET(req) {
  const pid = new URL(req.url).searchParams.get('id');
  const { data: p } = await sb().from('parties').select('*').eq('id', pid).maybeSingle();
  if (!p) return NextResponse.json(null);
  const { data: s } = await sb().from('salon_directory').select('tenant,name,city,region').eq('tenant', p.tenant).maybeSingle();
  const { count } = await sb().from('orders').select('id', { count: 'exact', head: true }).eq('party', pid);
  return NextResponse.json({ ...p, salon: s, orders: count || 0 });
}
