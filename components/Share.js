'use client';
import { useState } from 'react';

export default function Share({ url, text, es }) {
  const [copied, setCopied] = useState(false);
  const full = (typeof window !== 'undefined' ? window.location.origin : 'https://readmynails.com') + url;
  const enc = encodeURIComponent;
  async function copy() { try { await navigator.clipboard.writeText(full); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch (e) {} }
  async function native() { if (navigator.share) { try { await navigator.share({ title: text, url: full }); } catch (e) {} } else copy(); }
  return (
    <div className="inline" aria-label="Share">
      <button className="btn ghost sm" onClick={native}>{es ? 'Compartir' : 'Share'}</button>
      <a className="btn ghost sm" target="_blank" rel="noreferrer" href={`https://pinterest.com/pin/create/button/?url=${enc(full)}&media=${enc('https://readmynails.com/api/og/' + url.split('/').pop())}&description=${enc(text)}`}>Pinterest</a>
      <a className="btn ghost sm" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${enc(text + ' ' + full)}`}>WhatsApp</a>
      <button className="btn ghost sm" onClick={copy}>{copied ? (es ? 'Copiado' : 'Copied') : (es ? 'Copiar enlace' : 'Copy link')}</button>
    </div>
  );
}
