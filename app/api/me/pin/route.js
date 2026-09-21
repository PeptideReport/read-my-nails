import { NextResponse } from 'next/server';
import { sb, currentUser } from '../../../../lib/supabase';

// PUT { tenant, pin } (bearer) → change the host PIN for that salon's kiosk
export async function PUT(req) {
  const me = await currentUser(req); if (!me) return NextResponse.json({ error: 'login' }, { status: 401 });
  const { tenant, pin } = await req.json().catch(() => ({}));
  if (!me.salons.some(s => s.tenant === tenant)) return NextResponse.json({ error: 'not yours' }, { status: 403 });
  if (!/^\d{4,6}$/.test(String(pin || ''))) return NextResponse.json({ error: 'PIN must be 4–6 digits' }, { status: 400 });
  const { error } = await sb().from('salons').update({ pin: String(pin), updated_at: new Date().toISOString() }).eq('tenant', tenant);
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true });
}
