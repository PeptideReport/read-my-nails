import { NextResponse } from 'next/server';
import { sb, tenantOf, requirePin } from '../../../lib/supabase';

async function gate(req) { const tenant = tenantOf(req); if (!tenant) return [null, NextResponse.json({ error: 'tenant' }, { status: 400 })]; if (!(await requirePin(req, tenant))) return [null, NextResponse.json({ error: 'pin' }, { status: 401 })]; return [tenant, null]; }

export async function GET(req) { const [tenant, err] = await gate(req); if (err) return err; const { data } = await sb().from('bookings').select('*').eq('tenant', tenant).order('date'); return NextResponse.json(data || []); }
export async function POST(req) { const [tenant, err] = await gate(req); if (err) return err; const b = await req.json(); const { error } = await sb().from('bookings').insert({ tenant, id: b.id, name: b.name, phone: b.phone, date: b.date, time: b.time, head: b.head, pkg: b.pkg, notes: b.notes }); return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true }); }
export async function DELETE(req) { const [tenant, err] = await gate(req); if (err) return err; const { id } = await req.json(); await sb().from('bookings').delete().eq('tenant', tenant).eq('id', id); return NextResponse.json({ ok: true }); }
