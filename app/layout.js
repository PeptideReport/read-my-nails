import './globals.css';

export const metadata = {
  title: 'Read My Nails — the menu your nail printer is missing',
  description: '1,379 named nail-art sets that spell something, in English, Spanish, Portuguese and Vietnamese. Codes, menu cards, a customer ordering app and the 12-minute session, for salons and kiosks with a nail printer.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://readmynails.com'),
  openGraph: { title: 'Read My Nails', description: 'The menu your nail printer is missing.', images: ['/logo.png'] },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;700;800&family=DM+Mono:wght@400;500&display=swap" />
        <link rel="icon" href="/logo.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
