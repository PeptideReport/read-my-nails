'use client';
import { useEffect } from 'react';

// Remembers a partner code from ?ref=CODE for 30 days — the same rmn_ref cookie Subscribe.js reads at checkout.
export default function RefCookie() {
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get('ref');
      if (q) document.cookie = 'rmn_ref=' + encodeURIComponent(q.toUpperCase()) + '; path=/; max-age=' + 30 * 86400 + '; samesite=lax';
    } catch {}
  }, []);
  return null;
}
