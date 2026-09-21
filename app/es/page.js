import HeroHand, { Hand } from '../../components/Hand';
import Subscribe from '../../components/Subscribe';
import PickPlan from '../../components/PickPlan';
import { Nav, Footer } from '../../components/Site';

export const metadata = {
  title: 'Read My Nails — el menú que le falta a tu impresora de uñas',
  description: '1,379 sets de nail art que dicen algo, en español e inglés. Códigos, tarjetas de menú, app de pedidos y la sesión de 12 minutos, para salones y kioscos con impresora de uñas.',
  alternates: { canonical: '/es', languages: { en: '/', es: '/es' } },
};

const HERO = [
  { n: ['TÚ|', 'PUEDES|pink', '💪|', '✨|pink', '💗|'], a: 'Tú puedes', c: 'ES-INSPI-01' },
  { n: ['R|pink', 'E|', 'I|pink', 'N|', 'A|pink'], a: 'Reina', c: 'ES-REINA-01' },
  { n: ['MIS|pink', 'QUINCE|', '1️⃣5️⃣|pink', '👑|', '💗|'], a: 'Mis quince', c: 'EN-QUINC-02' },
  { n: ['👁️|', 'ALÁ|sun', '👁️|', 'ALÁ|sun', '🙏|'], a: 'Ojalá, ojalá', c: 'ES-ACERT-01' },
  { n: ['🐝|sun', 'U|', 'TI|', 'FUL|', '✨|sun'], a: 'Bee-U-tiful', c: 'EN-PUZZL-02' },
];
const SAMPLES = [
  { n: ['👁️|', 'ALÁ|sun', '👁️|', 'ALÁ|sun', '🙏|'], a: 'Ojalá, ojalá', c: 'ES-ACERT-01' },
  { n: ['MIS|pink', 'QUINCE|', '1️⃣5️⃣|pink', '👑|', '💗|'], a: 'Mis quince', c: 'EN-QUINC-02' },
  { n: ['R|pink', 'E|', 'I|pink', 'N|', 'A|pink'], a: 'Reina', c: 'ES-REINA-01' },
  { n: ['GRAD|sun', '🎓|', '2026|sun', '🎉|', '✨|'], a: 'Graduación 2026', c: 'EN-OCCAS-01' },
  { n: ['MOM|', 'IS|', 'MY|', 'BFF|pink', '💗|'], a: 'Mom is my BFF', c: 'EN-MOM-06' },
  { n: ['NOT|ink', 'A|', 'PHASE|ink', '🖤|', '🖤|ink'], a: 'Not a phase', c: 'EN-ALT-01' },
];

export default function HomeES() {
  return (
    <>
      <Nav lang="es" />
      <main lang="es">
        <section className="wrap hero">
          <div>
            <p className="eyebrow">Para salones y kioscos con impresora de uñas</p>
            <h1 style={{ margin: '12px 0 18px' }}>El menú que le falta a tu <span>impresora de uñas</span>.</h1>
            <p className="lede">Tu impresora pone lo que sea en una uña. Tus clientas siguen preguntando qué se ponen. Read My Nails son 1,379 sets con nombre que <em>dicen algo</em> en cinco uñas, con los códigos, las tarjetas de menú, la app de pedidos y la sesión de 12 minutos para venderlos.</p>
            <div className="cta" style={{ marginTop: 26 }}>
              <a className="btn pink" href="#pricing">Empieza por $29 · 5 capítulos</a>
              <a className="btn ghost" href="/library#es">Ver los sets</a>
            </div>
            <p className="fine" style={{ marginTop: 14 }}>Funciona con O’2NAILS y cualquier impresora de uñas de inyección de tinta que acepte PNG. Español e inglés. Precios en USD.</p>
          </div>
          <HeroHand sets={HERO} />
        </section>

        <section className="wrap" style={{ paddingBottom: 56 }}>
          <div className="stats">
            <div className="stat"><b>1,379</b><span>sets con nombre y código</span></div>
            <div className="stat"><b>42</b><span>capítulos escritos en español, no traducidos</span></div>
            <div className="stat"><b>2,073</b><span>archivos de impresión, se cargan una vez</span></div>
            <div className="stat"><b>12 min</b><span>por mano; la clienta hace el trabajo</span></div>
          </div>
        </section>

        <section className="wrap" style={{ paddingBottom: 12 }}>
          <div className="measure" style={{ display: 'grid', gap: 8, textAlign: 'center', margin: '0 auto' }}>
            <p className="quote" style={{ margin: 0 }}>Toda impresora de uñas viene con el mismo clip art. Este es el menú que le falta &mdash; con nombre, con código y probado en un kiosco real, no en una carpeta de imágenes.</p>
          </div>
        </section>

        <section className="wrap section two">
          <div>
            <p className="eyebrow">El problema</p>
            <h2 style={{ marginTop: 10 }}>Una mariposa no se la enseñas a nadie.</h2>
          </div>
          <div className="measure" style={{ display: 'grid', gap: 16 }}>
            <p>La impresora trae miles de imágenes prediseñadas. La clienta pasa cuatro minutos buscando, escoge una mariposa y no vuelve por otra. No hay nada que pedir, nada que contarle a sus amigas, nada para organizar una fiesta.</p>
            <p>Una mano que dice <b>“MIS QUINCE 👑”</b> sale en todas las fotos de la fiesta. Una mano que dice <b>“ABUELA Y YO”</b> trae a la abuela. Eso hace un menú: le da a la gente un nombre para lo que quiere.</p>
            <p className="quote">Ya tienes la impresora. Esta es la razón para usarla.</p>
          </div>
        </section>

        <section className="wrap section" id="get">
          <div className="board">
            <p className="eyebrow" style={{ textAlign: 'center' }}>Qué incluye</p>
            <h2>La biblioteca Read My Nails</h2>
            <p className="sub">Todo lo que un local necesita para vender sets desde el primer día. Una licencia por local.</p>
            <ul className="menu">
              <li><span className="name">La biblioteca de sets</span><span className="dots" /><span className="tag">1,379 sets</span><p className="what">Cada set dibujado, con nombre y código (<span className="mono">ES-REINA-01</span>). 51 capítulos en español (Acertijos, Reina Era, Familia, Abuela y Yo, Papá y Yo, Despedida, Fe, Antojitos…) y 70 en inglés. Sets divididos para dos amigas, Mamá y Yo, uñas con foto.</p></li>
              <li><span className="name">Los archivos de impresión</span><span className="dots" /><span className="tag">2,073 PNG</span><p className="what">Negro sobre transparente, 1500 × 2250. Se cargan una vez; la anfitriona toca cinco por mano. El color viene del esmalte, así que la tinta cuesta menos de $2 por mano.</p></li>
              <li><span className="name">La app de pedidos</span><span className="dots" /><span className="tag">con tu nombre</span><p className="what">La clienta escoge y personaliza en la tablet y recibe un código de cinco letras y un QR. El teléfono de la anfitriona muestra la cola con los cinco archivos y el esmalte. Hoja del día, exportar CSV, reservas de fiestas.</p></li>
              <li><span className="name">El generador de sets</span><span className="dots" /><span className="tag">cualquier frase</span><p className="what">Escribe lo que ella quiere. Se reparte en cinco uñas, eliges el esmalte, y los archivos bajan en el mismo formato de la biblioteca.</p></li>
              <li><span className="name">El libro</span><span className="dots" /><span className="tag">140 páginas</span><p className="what">Cada set con su código, español e inglés. Imprime uno para el mostrador.</p></li>
              <li><span className="name">Tarjetas y letreros</span><span className="dots" /><span className="tag">listos para imprimir</span><p className="what">Tablero de precios, póster de cómo funciona, tarjetas de estación y de mostrador, en español e inglés.</p></li>
              <li><span className="name">La sesión de 12 minutos</span><span className="dots" /><span className="tag">palabra por palabra</span><p className="what">El guion que convierte una impresión en un ticket de $25: la clienta prepara, aplica e imprime sus propias uñas mientras la anfitriona la guía.</p></li>
              <li><span className="name">El directorio de salones</span><span className="dots" /><span className="tag">clientas</span><p className="what">Tu página en readmynails.com con tu pin en el mapa. Las clientas escogen un set aquí y te lo envían antes de llegar.</p></li>
              <li><span className="name">Capítulos nuevos</span><span className="dots" /><span className="tag">cada mes</span><p className="what">Quinces, graduación, Navidad, el Mundial, lo que las chicas estén diciendo este mes.</p></li>
            </ul>
          </div>
        </section>

        <section className="wrap section">
          <p className="eyebrow">De la biblioteca</p>
          <h2 style={{ margin: '10px 0 28px' }}>Seis de los 1,379.</h2>
          <div className="samples">
            {SAMPLES.map(s => <a className="sample setlink" href={'/s/' + s.c} key={s.c}><Hand set={s} small /><div className="hand-meta"><span className="ans">“{s.a}”</span><span className="code mono">{s.c}</span></div></a>)}
          </div>
        </section>

        <section className="wrap section two" id="own-a-location">
          <div>
            <p className="eyebrow">Llévalo a tu ciudad</p>
            <h2 style={{ marginTop: 10 }}>Un kiosco, probado en Naples. ¿Te imaginas el tuyo?</h2>
          </div>
          <div className="measure" style={{ display: 'grid', gap: 14 }}>
            <p>¿Ya tienes un salón o una impresora de uñas? Los planes de abajo te dan la licencia hoy mismo. Si en cambio te imaginas abrir tu propio local Read My Nails, apenas estamos empezando esa conversación &mdash; todavía no hay precios ni términos que mostrar, solo un lugar para decir que te interesa.</p>
            <div className="inline"><a className="btn ghost" href="/es/own-a-location">Dinos que te interesa</a></div>
          </div>
        </section>

        <section className="wrap section" id="pricing">
          <p className="eyebrow">Precios</p>
          <h2 style={{ margin: '10px 0 8px' }}>Paga por los capítulos que imprimes.</h2>
          <p className="lede" style={{ marginBottom: 28 }}>Un capítulo son de diez a veinte sets de un mismo tema &mdash; Despedida, Quinceañera, Amigas. Un crédito reclama un capítulo: todos los sets, los archivos de impresión, la hoja de receta, tuyo para siempre. Precios en dólares (USD).</p>
          <div className="plans four">
            <div className="plan"><h3>Inicio</h3><div className="price">$29<small> una vez</small></div><ul><li><b>5 créditos de capítulo</b> &mdash; elige cinco</li><li>Archivos en el formato de tu impresora, códigos, hojas de receta</li><li>Libro, tarjetas, guion de sesión</li><li>Luego $9.99/mes por un capítulo nuevo cada mes, si quieres</li></ul><PickPlan plan="start">Elegir Inicio</PickPlan></div>
            <div className="plan best"><span className="save">La mayoría</span><h3>Salón</h3><div className="price">$59<small> /mes</small></div><ul><li><b>2 créditos de capítulo cada mes</b></li><li>La app de pedidos en tu propia dirección</li><li>El generador: cualquier frase, cinco archivos</li><li>En el directorio; las clientas te envían sets desde este sitio</li></ul><PickPlan plan="salon" className="btn pink sm">Elegir Salón</PickPlan></div>
            <div className="plan"><h3>Multi-local</h3><div className="price">$149<small> /mes</small></div><ul><li>Todo lo de Salón, hasta 3 locales</li><li><b>6 créditos cada mes</b>, compartidos</li><li>Cada uno con su kiosco, PIN y página</li><li>Una sola factura</li></ul><PickPlan plan="multi">Elegir Multi</PickPlan></div>
            <div className="plan"><h3>Biblioteca completa</h3><div className="price">$699<small> una vez</small></div><ul><li><b>Todos los capítulos</b> &mdash; 123 capítulos, 1,379 sets, 2,073 archivos</li><li>Tuya para siempre, una descarga</li><li>Añade $9.99/mes para recibir los capítulos nuevos</li><li>Solo archivos &mdash; la app es el plan Salón</li></ul><PickPlan plan="library">Elegir Biblioteca</PickPlan></div>
          </div>
          <Subscribe lang="es" />
          <p className="muted" style={{ marginTop: 16, fontSize: '0.95rem' }}>¿Un capítulo más? <b>$14.99</b> cada uno, o <b>tres por $35</b>, desde tu panel. Los créditos duran 12 meses; los capítulos que reclamas nunca caducan. Cancela cuando quieras desde tu panel.</p>
        </section>

        <section className="wrap section">
          <p className="eyebrow">Preguntas</p>
          <h2 style={{ margin: '10px 0 24px' }}>Las que hace cada dueña.</h2>
          <div className="faq">
            <details><summary>¿Necesito una impresora O’2NAILS?</summary><p>No. Los archivos son PNG normales. Sirve cualquier impresora de uñas de inyección de tinta que acepte tus propias imágenes: O’2NAILS X11 Plus, X12.5, V11, Jolimark. Si la tuya solo muestra su galería interna, no sirve.</p></details>
            <details><summary>¿Es un servicio de manicura? ¿Necesito licencia?</summary><p>Read My Nails está diseñado como una sesión: la anfitriona guía y la clienta aplica cada producto en sus propias uñas y mete su propio dedo en la impresora. El guion mantiene las manos de la anfitriona fuera. Si eso importa depende de tu país o estado; te damos el modelo y el guion, tú lo confirmas con tu autoridad local.</p></details>
            <details><summary>¿Puedo ponerle mi nombre?</summary><p>Sí. La app lleva el nombre de tu salón, el nombre de tu anfitriona, tus precios y tus esmaltes. Read My Nails queda como el nombre de la biblioteca.</p></details>
            <details><summary>¿Y si tengo dos locales?</summary><p>Una licencia por local, cada uno con su propia dirección de kiosco y su cola, o el plan Multi-local para hasta tres.</p></details>
            <details><summary>¿Se conecta a mi impresora?</summary><p>Ninguna impresora de uñas del mercado se conecta a software externo. La app le muestra a la anfitriona los cinco códigos; ella los toca en la pantalla de la impresora. Dos segundos por uña.</p></details>
            <details><summary>¿Qué pasa si cancelo?</summary><p>Tu dirección de kiosco y las descargas se detienen al final del periodo pagado. Los sets que tus clientas ya llevan son suyos y te quedas con tus tarjetas impresas. Vuelve cuando quieras y tu salón está donde lo dejaste.</p></details>
          </div>
        </section>
      </main>
      <Footer lang="es" />
    </>
  );
}
