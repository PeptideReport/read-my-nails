import fs from 'fs';
import path from 'path';

// The buyer's guide: the single best traffic magnet on the site. Served as its own styled document with the site nav on top.
export const dynamic = 'force-static';
export function GET() {
const html = fs.readFileSync(path.join(process.cwd(), 'data', 'nail-printer-review.html'), 'utf8');
return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, s-maxage=86400' } });
}
