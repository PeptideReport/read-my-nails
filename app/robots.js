export default function robots() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://readmynails.com';
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/dashboard', '/api/', '/k/', '/party/', '/welcome'] }], sitemap: site + '/sitemap.xml' };
}
