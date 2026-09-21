import { setByCode, handsOf } from '../../../../lib/library';
import { shareImage } from '../../../../lib/render';

export const runtime = 'nodejs';
export const revalidate = 86400;

// GET /api/og/EN-BRIDE-03 → 1200×630 PNG share image (public; used as og:image on every set page)
export async function GET(req, { params }) {
  const set = setByCode(params.code);
  if (!set) return new Response('not found', { status: 404 });
  const hand = handsOf(set)[0];
  return shareImage({ hand, answer: set.a, code: set.c, chapter: set.chapter.t });
}
