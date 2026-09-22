import { NextResponse } from 'next/server';

// The outside-creator submission program has been discontinued. This endpoint stays in place (rather than
// removed) so any old bookmarked form or cached page fails safely with a clear message instead of a broken
// request. No chapter ever went live under this program (custom_chapters had 0 rows when it was shut down),
// so no royalty is owed to anyone as a result of ending it.
export async function POST() {
  return NextResponse.json({ error: 'The creator program is no longer accepting submissions.' }, { status: 410 });
}
