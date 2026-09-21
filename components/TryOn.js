'use client';
import { useEffect, useRef, useState } from 'react';

// Try-on + reveal clip. The customer uploads a photo of her hand; MediaPipe finds the fingertips; we paint the set on them.
// "Make a clip" records a six-second reveal (nails appearing one by one) with MediaRecorder for TikTok.
const POLISH = { '': '#FFF1F6', pink: '#F27BA5', lilac: '#C9B6F0', mint: '#A9E6D6', sun: '#FFE0A3', sky: '#BFE0FA', ink: '#2B2140' };
const TIPS = [4, 8, 12, 16, 20], DIPS = [3, 7, 11, 15, 19]; // MediaPipe hand landmark indices: fingertip and the joint below it
const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';

export default function TryOn({ hand, answer, code, es }) {
  const [img, setImg] = useState(null);
  const [status, setStatus] = useState('');
  const [landmarks, setLandmarks] = useState(null);
  const [recording, setRecording] = useState(false);
  const canvas = useRef(null); const detector = useRef(null); const fontReady = useRef(false);

  useEffect(() => { try { document.fonts.load('700 20px Fredoka').then(() => { fontReady.current = true; }); } catch (e) {} }, []);

  async function loadDetector() {
    if (detector.current) return detector.current;
    setStatus(es ? 'Cargando…' : 'Loading the hand finder…');
    const vision = await import(/* webpackIgnore: true */ `${MP}/vision_bundle.mjs`);
    const files = await vision.FilesetResolver.forVisionTasks(`${MP}/wasm`);
    detector.current = await vision.HandLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task' }, runningMode: 'IMAGE', numHands: 1 });
    return detector.current;
  }

  async function onFile(e) {
    const f = e.target.files?.[0]; if (!f) return;
    const url = URL.createObjectURL(f); const im = new Image(); im.onload = async () => {
      setImg(im); setLandmarks(null);
      try {
        const d = await loadDetector(); setStatus(es ? 'Buscando la mano…' : 'Finding your hand…');
        const res = d.detect(im);
        if (!res.landmarks?.length) { setStatus(es ? 'No vi una mano. Prueba con la palma hacia abajo, dedos separados, buena luz.' : 'No hand found. Try palm down, fingers apart, good light.'); return; }
        setLandmarks(res.landmarks[0]); setStatus('');
      } catch (x) { setStatus(es ? 'No se pudo cargar el buscador de manos.' : 'Could not load the hand finder. Check your connection.'); }
    }; im.src = url;
  }

  // Paint the photo and n nails (0–5) — used for the still and each frame of the clip.
  function paint(n = 5, glow = 0) {
    const c = canvas.current; if (!c || !img) return;
    const maxW = 1080; const sc = Math.min(1, maxW / img.width); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, c.width, c.height);
    if (!landmarks) return;
    // Which finger is the thumb on screen? Landmark order is thumb→pinky; if the thumb is on the right, the set reads right→left.
    const xs = TIPS.map(i => landmarks[i].x); const thumbRight = xs[0] > xs[4];
    const order = thumbRight ? [4, 3, 2, 1, 0] : [0, 1, 2, 3, 4]; // nail index → finger index
    const palm = Math.hypot((landmarks[0].x - landmarks[9].x) * c.width, (landmarks[0].y - landmarks[9].y) * c.height);
    for (let k = 0; k < Math.min(n, 5); k++) {
      const finger = order[k]; const tip = landmarks[TIPS[finger]], dip = landmarks[DIPS[finger]];
      const tx = tip.x * c.width, ty = tip.y * c.height, dx = tx - dip.x * c.width, dy = ty - dip.y * c.height;
      const ang = Math.atan2(dy, dx) - Math.PI / 2; const w = palm * (finger === 0 ? 0.30 : 0.26), hgt = w * 1.5;
      const spec = hand[k]; const mark = spec.t, polish = POLISH[spec.polish] || POLISH[''];
      ctx.save(); ctx.translate(tx - dx * 0.35, ty - dy * 0.35); ctx.rotate(ang);
      ctx.globalAlpha = 0.92;
      if (glow && k === n - 1) { ctx.shadowColor = '#F27BA5'; ctx.shadowBlur = 30 * glow; }
      roundRect(ctx, -w / 2, -hgt * 0.62, w, hgt, w / 2); ctx.fillStyle = polish; ctx.fill();
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      const emoji = /\p{Extended_Pictographic}/u.test(mark); const len = [...mark].length;
      ctx.font = `700 ${Math.round(w * (emoji ? 0.62 : len <= 2 ? 0.55 : len <= 4 ? 0.34 : 0.26))}px Fredoka, Nunito, sans-serif`;
      ctx.fillStyle = spec.polish === 'ink' ? '#fff' : '#111'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(mark, 0, hgt * 0.1); ctx.restore();
    }
  }
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r * 0.7); ctx.arcTo(x, y + h, x, y, r * 0.7); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  useEffect(() => { paint(5); }, [img, landmarks]); // eslint-disable-line react-hooks/exhaustive-deps

  function download() { const a = document.createElement('a'); a.href = canvas.current.toDataURL('image/jpeg', 0.92); a.download = `read-my-nails-${code}.jpg`; a.click(); }

  async function clip() {
    const c = canvas.current; if (!c || !landmarks || recording) return;
    const stream = c.captureStream(30); const mime = ['video/mp4;codecs=avc1', 'video/webm;codecs=vp9', 'video/webm'].find(m => window.MediaRecorder?.isTypeSupported(m));
    if (!mime) { setStatus(es ? 'Este navegador no graba video.' : 'This browser cannot record video. Save the still instead.'); return; }
    const rec = new MediaRecorder(stream, { mimeType: mime }); const chunks = []; rec.ondataavailable = e => chunks.push(e.data);
    rec.onstop = () => { const blob = new Blob(chunks, { type: mime }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `read-my-nails-${code}.${mime.includes('mp4') ? 'mp4' : 'webm'}`; a.click(); setRecording(false); paint(5); };
    setRecording(true); rec.start();
    const t0 = performance.now(); const total = 6000;
    const frame = () => {
      const t = performance.now() - t0; const n = Math.min(5, Math.floor(t / 900) + 1); const within = (t % 900) / 900;
      paint(n, 1 - within);
      if (t >= 4500 && t < 6000) { const ctx = c.getContext('2d'); ctx.font = `700 ${Math.round(c.width * 0.07)}px Fredoka, Nunito, sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(43,33,64,.9)'; ctx.fillText(`“${answer}”`, c.width / 2, c.height * 0.92); ctx.font = `800 ${Math.round(c.width * 0.03)}px Nunito, sans-serif`; ctx.fillStyle = '#D6335C'; ctx.fillText(`READMYNAILS.COM · ${code}`, c.width / 2, c.height * 0.97); }
      if (t < total) requestAnimationFrame(frame); else rec.stop();
    };
    requestAnimationFrame(frame);
  }

  return (
    <div className="card" id="tryon">
      <h3>{es ? 'Pruébalo en tu mano' : 'Try it on your hand'}</h3>
      <p className="muted" style={{ fontSize: '0.92rem' }}>{es ? 'Sube una foto de tu mano, palma abajo, dedos separados. Nada sale de tu teléfono.' : 'Upload a photo of your hand, palm down, fingers apart. It never leaves your phone.'}</p>
      <input id="tryon-file" type="file" accept="image/*" capture="environment" onChange={onFile} />
      {status && <p className="muted" role="status">{status}</p>}
      <canvas ref={canvas} style={{ width: '100%', borderRadius: 14, display: img ? 'block' : 'none', background: 'var(--surface-2)' }} />
      {img && landmarks && (
        <div className="inline">
          <button className="btn sm" onClick={download}>{es ? 'Guardar foto' : 'Save photo'}</button>
          <button className="btn pink sm" onClick={clip} disabled={recording}>{recording ? (es ? 'Grabando…' : 'Recording…') : (es ? 'Hacer clip de 6 s' : 'Make a 6-second clip')}</button>
        </div>
      )}
    </div>
  );
}
