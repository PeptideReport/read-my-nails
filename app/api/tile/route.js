import { NextResponse } from 'next/server';
import { currentUser, ACTIVE } from '../../../lib/supabase';
import { tileImage } from '../../../lib/render';

export const runtime = 'nodejs';

// GET /api/tile?m=SLAY (bearer, active salon) → 1500×2250 transparent PNG print tile.
// Tiles are the product, so this is licensee-only. The share images at /api/og are the public face.
export async function GET(req) {
  const me = await currentUser(req);
  if (!me || !me.salons.some(s => ACTIVE.includes(s.status)) && !me.isAdmin) return NextResponse.json({ error: 'login' }, { status: 401 });
  const u = new URL(req.url); const m = (u.searchParams.get('m') || '').trim().slice(0, 14);
  if (!m) return NextResponse.json({ error: 'm' }, { status: 400 });
  return tileImage(m, { size: u.searchParams.get('size') || 'M', ink: u.searchParams.get('ink') === 'white' ? '#fff' : '#000' });
}
