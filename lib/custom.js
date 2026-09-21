// Network (global) chapters written by salons, creators, or the admin, published to every kiosk and to the public library.
import { sb } from './supabase';
import { slugify } from './library';

export async function globalChapters() {
  try {
    const { data } = await sb().from('custom_chapters').select('code,lang,title,blurb,sets,created_at').eq('tenant', '*').order('created_at', { ascending: false });
    return (data || []).map(c => ({ ...c, t: c.title, s: c.blurb || '', slug: slugify(c.title), url: '/library/' + c.lang.toLowerCase() + '/' + slugify(c.title) + '?c=' + c.code, custom: true }));
  } catch (e) { return []; }
}

export async function findCustomSet(code) {
  const c = String(code).toUpperCase(); const prefix = c.split('-').slice(0, 2).join('-');
  try {
    const { data } = await sb().from('custom_chapters').select('code,lang,title,blurb,sets').eq('tenant', '*').eq('code', prefix).maybeSingle();
    if (!data) return null;
    const set = (data.sets || []).find(s => s.c === c); if (!set) return null;
    return { ...set, lang: data.lang, url: '/s/' + c, chapter: { t: data.title, code: data.code, s: data.blurb || '', url: '/library#community', slug: slugify(data.title) } };
  } catch (e) { return null; }
}
