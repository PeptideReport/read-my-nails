'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

// Directory: search + list + Leaflet map (OpenStreetMap tiles, no API key).
export default function SalonMap({ es }) {
  const [salons, setSalons] = useState([]);
  const [q, setQ] = useState('');
  const [ready, setReady] = useState(false);
  const mapEl = useRef(null); const map = useRef(null); const layer = useRef(null);

  useEffect(() => { fetch('/api/salons').then(r => r.json()).then(setSalons).catch(() => {}); }, []);
  useEffect(() => {
    if (document.getElementById('leaflet-css')) { setReady(!!window.L); }
    const css = document.createElement('link'); css.id = 'leaflet-css'; css.rel = 'stylesheet'; css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'; document.head.appendChild(css);
    const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'; s.onload = () => setReady(true); document.head.appendChild(s);
  }, []);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return salons.filter(x => !t || [x.name, x.city, x.region, x.postal, x.country].filter(Boolean).join(' ').toLowerCase().includes(t));
  }, [salons, q]);

  useEffect(() => {
    if (!ready || !window.L || !mapEl.current) return;
    if (!map.current) {
      map.current = window.L.map(mapEl.current, { scrollWheelZoom: false }).setView([27.5, -82], 6);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map.current);
      layer.current = window.L.layerGroup().addTo(map.current);
    }
    layer.current.clearLayers();
    const pts = list.filter(s => s.lat && s.lng);
    pts.forEach(s => window.L.marker([s.lat, s.lng]).addTo(layer.current).bindPopup(`<b>${s.name}</b><br>${[s.city, s.region].filter(Boolean).join(', ')}<br><a href="/salons/${s.tenant}">${es ? 'Ver salón' : 'View salon'}</a>`));
    if (pts.length) map.current.fitBounds(pts.map(s => [s.lat, s.lng]), { padding: [40, 40], maxZoom: 12 });
  }, [ready, list, es]);

  return (
    <div className="dirwrap">
      <input id="dir-q" placeholder={es ? 'Ciudad, estado o nombre del salón' : 'City, state, or salon name'} value={q} onChange={e => setQ(e.target.value)} />
      <div className="dir">
        <div className="dirlist">
          {salons.length === 0 && <p className="muted">{es ? 'Cargando salones…' : 'Loading salons…'}</p>}
          {salons.length > 0 && list.length === 0 && <p className="muted">{es ? 'Nada cerca todavía. Comparte readmynails.com con tu salón.' : 'Nothing there yet. Send readmynails.com to your salon — they can be listed this week.'}</p>}
          {list.map(s => (
            <a className="dircard" href={'/salons/' + s.tenant} key={s.tenant}>
              <b>{s.name}</b>
              <span className="muted">{[s.address, s.city, s.region].filter(Boolean).join(', ')}</span>
              {s.blurb && <small className="muted">{s.blurb}</small>}
            </a>
          ))}
        </div>
        <div className="dirmap" ref={mapEl} aria-label="Map of licensed salons" />
      </div>
    </div>
  );
}
