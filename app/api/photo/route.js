import { NextResponse } from 'next/server';
import { tenantOf, activeSalon, currentUser } from '../../../lib/supabase';
import { allLooks, preview } from '../../../lib/photo';

export const runtime = 'nodejs';
export const maxDuration = 30;

// POST { image: dataURL } with x-tenant (kiosk) or bearer → { looks: { photo, ink, stamp } } each { preview: dataURL(300×450), full: dataURL(1500×2250) }
// The customer picks a look on the tablet; the host prints the full one.
export async function POST(req) {
  const tenant = tenantOf(req);
  const me = tenant ? null : await currentUser(req);
  if (!(tenant && await activeSalon(tenant)) && !me) return NextResponse.json({ error: 'login' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const m = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(String(b.image || ''));
  if (!m) return NextResponse.json({ error: 'Send a photo.' }, { status: 400 });
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 12 * 1024 * 1024) return NextResponse.json({ error: 'Photo is too large (12 MB max).' }, { status: 413 });
  try {
    const looks = await allLooks(buf);
    const out = {};
    for (const [k, v] of Object.entries(looks)) out[k] = { preview: await preview(v.full, v.mime), full: `data:${v.mime};base64,${v.full.toString('base64')}` };
    return NextResponse.json({ looks: out });
  } catch (e) {
    return NextResponse.json({ error: 'That photo could not be read. Try a JPG or PNG.' }, { status: 400 });
  }
}
