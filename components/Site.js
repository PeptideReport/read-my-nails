// Shared chrome: nav + footer, English and Spanish.
const T = {
  en: { library: 'Library', salons: 'Find a salon', printers: 'Nail printers', pricing: 'Pricing', login: 'Log in', cta: 'Get chapters', other: 'Español', otherHref: '/es', tag: 'library' },
  es: { library: 'Biblioteca', salons: 'Salones', printers: 'Impresoras', pricing: 'Precios', login: 'Entrar', cta: 'Obtener capítulos', other: 'English', otherHref: '/', tag: 'biblioteca' },
};

export function Nav({ lang = 'en' }) {
  const t = T[lang]; const home = lang === 'es' ? '/es' : '/';
  return (
    <header className="wrap nav">
    <a className="logo" href={home}>READ MY NAILS&trade; <small>{t.tag}</small></a>
    <nav className="navlinks">
    <a href="/library">{t.library}</a>
  <a href="/salons">{t.salons}</a>
  <a href="/nail-printers">{t.printers}</a>
  <a href={home + '#pricing'}>{t.pricing}</a>
<a href="/login">{t.login}</a>
<a href={t.otherHref} lang={lang === 'es' ? 'en' : 'es'}>{t.other}</a>
<a className="btn sm pink" href={home + '#pricing'}>{t.cta}</a>
  </nav>
  </header>
);
}

export function Footer({ lang = 'en' }) {
  return (
    <footer className="wrap foot">
    <div><b style={{ color: 'var(--ink)' }}>Read My Nails&trade;</b> · Naples, Florida · <a href="mailto:hello@readmynails.com">hello@readmynails.com</a> · <a href="/terms">{lang === 'es' ? 'Términos' : 'Terms'}</a> · <a href="/privacy">{lang === 'es' ? 'Privacidad' : 'Privacy'}</a> · <a href="/guides">{lang === 'es' ? 'Guías' : 'Guides'}</a> · <a href="/partners">{lang === 'es' ? 'Distribuidores' : 'Partners'}</a> · <a href="/salons">{lang === 'es' ? 'Salones' : 'Salon directory'}</a> · <a href={lang === 'es' ? '/es/own-a-location' : '/own-a-location'}>{lang === 'es' ? 'Abrir un local' : 'Open a location'}</a></div>
  <div>{lang === 'es'
        ? 'Read My Nails™ y la biblioteca de sets son propiedad de SeamlessLift LLC. Licencia por local, no para reventa. O’2NAILS es marca de Guangzhou Taiji Electronic Co., Ltd.; Read My Nails es un producto independiente sin afiliación con ningún fabricante de impresoras.'
  : 'Read My Nails™ and the set library are the property of SeamlessLift LLC. Licensed per location, not for resale. O’2NAILS is a trademark of Guangzhou Taiji Electronic Co., Ltd.; Read My Nails is an independent product and is not affiliated with or endorsed by any printer maker.'}</div>
<div>{lang === 'es' ? 'Probado en un kiosco con licencia en Naples, Florida. Ahora en el tuyo.' : 'Proven at a licensed kiosk in Naples, Florida. Now at yours.'}</div>
<div>{lang === 'es'
      ? `© ${new Date().getFullYear()} SeamlessLift LLC. Todos los derechos reservados. Patente en trámite.`
      : `© ${new Date().getFullYear()} SeamlessLift LLC. All rights reserved. Patent pending.`}</div>
  </footer>
);
}
