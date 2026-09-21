import QRCode from 'qrcode';

export const runtime = 'nodejs';

// GET /api/qr?t=RMN:ABCDE → PNG. Same payload the kiosk app encodes.
export async function GET(req) {
  const t = (new URL(req.url).searchParams.get('t') || '').slice(0, 200);
  if (!t) return new Response('t', { status: 400 });
  const buf = await QRCode.toBuffer(t, { width: 360, margin: 1, color: { dark: '#2B2140', light: '#FFFFFF' } });
  return new Response(buf, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' } });
}
