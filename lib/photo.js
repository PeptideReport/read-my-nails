// Photo intelligence. A customer's photo → something that prints well on a fingernail.
// Three looks, all from sharp, all in-process: Photo (color, subject-aware crop, sharpened), Ink (black line-art on transparent —
// the background disappears because only dark pixels survive), Stamp (high-contrast two-tone).
import sharp from 'sharp';

const W = 1500, H = 2250;

async function base(buf) {
  // Subject-aware crop to nail proportions. sharp's attention strategy finds the busiest region (a face, a pet, a word).
  return sharp(buf).rotate().resize(W, H, { fit: 'cover', position: sharp.strategy.attention }).toColourspace('srgb');
}

export async function photoLook(buf) {
  return base(buf).then(s => s.modulate({ saturation: 1.15 }).linear(1.12, -8).sharpen({ sigma: 1.2 }).jpeg({ quality: 88 }).toBuffer());
}

// Ink: line art. Edges (Laplacian) plus the darkest regions become black ink; everything else is transparent, so the background vanishes
// and a face or a pet keeps its features instead of collapsing into a blob.
export async function inkLook(buf) {
  const gray = await sharp(await (await base(buf)).grayscale().normalise().toBuffer()).blur(0.8).png().toBuffer();
  // edges: Laplacian → negate → threshold gives thin black lines on white; blur + threshold thickens them to a printable stroke
  // (sharp applies chained ops in its own fixed order, so each step that must happen in sequence gets its own sharp() call)
  const conv = await sharp(gray).convolve({ width: 3, height: 3, kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1] }).toBuffer();
  const thin = await sharp(await sharp(conv).negate().toBuffer()).threshold(215).toBuffer();
  const edges = await sharp(await sharp(thin).blur(1.6).toBuffer()).threshold(248).toBuffer();
  const dark = await sharp(await sharp(gray).linear(1.2, -20).toBuffer()).threshold(55).toBuffer(); // only the darkest areas stay solid
  const lines = await sharp(edges).composite([{ input: dark, blend: 'darken' }]).removeAlpha().toBuffer();
  const alpha = await sharp(lines).negate().extractChannel(0).toBuffer(); // single channel: opaque where the ink is
  return sharp({ create: { width: W, height: H, channels: 3, background: '#000000' } }).joinChannel(alpha).png().toBuffer();
}

// Stamp: two-tone (black + polish shows through) with soft edges — prints like a woodcut.
export async function stampLook(buf) {
  const s = await base(buf);
  const gray = await sharp(await s.clone().grayscale().normalise().toBuffer()).linear(1.6, -60).toBuffer();
  const alpha = await sharp(await sharp(gray).negate().toBuffer()).gamma(1.4).extractChannel(0).toBuffer();
  return sharp({ create: { width: W, height: H, channels: 3, background: '#000000' } }).joinChannel(alpha).png().toBuffer();
}

// Small previews for the kiosk (300 × 450) — data URLs.
export async function preview(buf, mime) { const p = await sharp(buf).resize(300, 450).toBuffer(); return `data:${mime};base64,${p.toString('base64')}`; }

export async function allLooks(input) {
  const [photo, ink, stamp] = await Promise.all([photoLook(input), inkLook(input), stampLook(input)]);
  return {
    photo: { full: photo, mime: 'image/jpeg' },
    ink: { full: ink, mime: 'image/png' },
    stamp: { full: stamp, mime: 'image/png' },
  };
}
