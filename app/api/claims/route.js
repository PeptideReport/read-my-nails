import { NextResponse } from 'next/server';
import { sb, currentUser } from '../../../lib/supabase';
import { entitlements, claimChapter } from '../../../lib/access';
import { allChapters } from '../../../lib/library';

// GET (bearer) → { credits, all, chapters: [{code, lang, title, blurb, sets, claimed, source}] }
export async function GET(req) {
  const me = await currentUser(req); if (!me) return NextResponse.json({ error: 'login' }, { status: 401 });
  const db = sb();
  const ent = await entitlements(db, me.email, me.salons);
  const all = ent.all || me.isAdmin;
  const bySrc = Object.fromEntries(ent.claims.map(c => [c.chapter, c.source]));
  const chapters = allChapters().map(c => ({ code: c.code, lang: c.lang, title: c.t, blurb: c.s, sets: c.sets.length, claimed: all || ent.claimed.has(c.code), source: all ? 'all' : bySrc[c.code] || null }));
  return NextResponse.json({ credits: ent.credits, all, libraryAll: ent.libraryAll, monthly: ent.monthly, drops: ent.drops, chapters });
}

// POST { chapter } (bearer) → spend one credit on a chapter
export async function POST(req) {
  const me = await currentUser(req); if (!me) return NextResponse.json({ error: 'login' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const r = await claimChapter(sb(), me.email, b.chapter);
  return r.error ? NextResponse.json({ error: r.error }, { status: 400 }) : NextResponse.json(r);
}
