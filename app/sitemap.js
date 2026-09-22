import { allChapters, allSets } from '../lib/library';

export default function sitemap() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://readmynails.com';
  const now = new Date();
  const fixed = ['/', '/es', '/library', '/salons', '/nail-printers', '/guides', '/partners', '/own-a-location', '/es/own-a-location', '/free', '/terms', '/privacy'].map(p => ({ url: site + p, lastModified: now, changeFrequency: 'weekly', priority: p === '/' ? 1 : 0.8 }));
  const ch = allChapters().map(c => ({ url: site + c.url, lastModified: now, changeFrequency: 'monthly', priority: 0.7 }));
  const sets = allSets().map(s => ({ url: site + s.url, lastModified: now, changeFrequency: 'monthly', priority: 0.5 }));
  return [...fixed, ...ch, ...sets];
}
