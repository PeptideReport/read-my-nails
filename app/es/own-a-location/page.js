import { Nav, Footer } from '../../../components/Site';

// Interest-gauging page only (Spanish translation of /own-a-location). Deliberately
// carries no fees, terms, territory or system promises — publicly offering those
// would trigger FTC Franchise Rule disclosure requirements (a formal FDD, 14-day
// waiting period, state filings). This page exists to collect interest, not to
// make an offer. Do not add pricing, "franchise" ("franquicia"), "investment"
// ("inversión"), "territory" ("territorio"), or "royalty" language here without a
// franchise attorney's review first. Keep this in exact substantive sync with
// app/own-a-location/page.js — same claims, same disclaimers, translated only.

export const metadata = {
  title: 'Abrir un local de Read My Nails · Read My Nails',
  description: 'Un kiosco con licencia, probado en Naples, Florida. Si tienes curiosidad por traer Read My Nails a tu ciudad, cuéntanos sobre ti — esta es una primera conversación, no una oferta.',
  alternates: { canonical: '/es/own-a-location', languages: { en: '/own-a-location', es: '/es/own-a-location' } },
  openGraph: { title: '¿Te interesa un local de Read My Nails?', description: 'Un kiosco probado. Si quieres hablar de traerlo a tu ciudad, empieza aquí.' },
};

const EMAIL = 'hello@readmynails.com';
const INTEREST = `mailto:${EMAIL}?subject=${encodeURIComponent('Me interesa un local de Read My Nails')}&body=${encodeURIComponent('Nombre:\nCiudad / zona que tienes en mente:\n¿Ya tienes un espacio y/o una impresora de uñas?\nTiempo aproximado:\nUn poco sobre ti o tu negocio:\nMejor forma de contactarte (correo, teléfono):\n')}`;

const QUESTIONS = [
  ['¿Esto es una franquicia?', 'No. No hay cuota, no hay territorio y no se vende ningún sistema en esta página. Esta es una primera conversación para entender dónde hay interés — nada más, y no vamos a fingir lo contrario.'],
  ['¿Qué está realmente probado ahora mismo?', 'Un kiosco con licencia en Naples, Florida, que opera la biblioteca, la app y el modelo de sesión reales, día a día. Ese es todo el historial que tenemos por ahora — preferimos decírtelo con claridad que exagerarlo.'],
  ['Ya tengo un salón y una impresora de uñas — ¿esto es para mí?', 'Probablemente no — lo que quieres es la suscripción, no esta página. Ve a precios y pon la biblioteca a funcionar en tu local actual hoy mismo.'],
  ['¿Qué pasa después de que te contacte?', 'Te responderemos, te haremos algunas preguntas, y compartiremos más a medida que el modelo fuera de Naples tome forma. Si y cuando haya una oferta real que hacer, escucharás los términos reales directamente — no textos de marketing.'],
];

export default function OwnALocationES() {
  return (
    <>
      <Nav lang="es" />
      <main lang="es" className="wrap doc" style={{ maxWidth: 860 }}>
        <p className="eyebrow">Llévalo a tu ciudad</p>
        <h1>Un kiosco, probado en Naples. ¿Te imaginas el tuyo?</h1>
        <p className="lede">Read My Nails funciona hoy como un kiosco real y con licencia en Naples, Florida &mdash; la biblioteca, la app de pedidos y la sesión de 12 minutos, frente a clientas reales. Estamos empezando a escuchar de personas que quieren saber qué se necesitaría para traerlo a su propia ciudad. Esta página es para esa conversación.</p>

        <div className="card" style={{ background: 'var(--surface-2)' }}>
          <p style={{ margin: 0 }}><b>Qué es esto:</b> una forma temprana y sin compromiso de decir &ldquo;me interesa&rdquo; y contarnos un poco sobre ti.<br /><b>Qué no es esto:</b> una oferta de franquicia, un discurso de inversión, ni una promesa de territorio, precio o términos. Nada de eso existe todavía en una forma que te pondríamos enfrente, y no vamos a fingir que sí.</p>
        </div>

        <p style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
          <a className="btn pink" href={INTEREST}>Dinos que te interesa</a>
          <a className="btn ghost" href="/es#pricing">¿Ya tienes un salón? Ver precios</a>
        </p>

        <h2>Preguntas frecuentes</h2>
        {QUESTIONS.map(([q, a]) => <p key={q}><b>{q}</b><br />{a}</p>)}

        <div className="card" style={{ background: 'var(--ink)', color: 'var(--bg)' }}>
          <h2 style={{ color: 'var(--honey)' }}>Empecemos la conversación</h2>
          <p style={{ color: 'inherit' }}>Escríbenos a <a href={INTEREST}>{EMAIL}</a> con tu nombre, la ciudad que tienes en mente, y un poco sobre ti. Sin formularios, sin presión &mdash; leemos cada uno.</p>
          <p><a className="btn pink" href={INTEREST}>Dinos que te interesa</a></p>
        </div>
      </main>
      <Footer lang="es" />
    </>
  );
}
