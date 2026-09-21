// Offline kiosk shell: the app page and its one library script stay cached; API calls go to the network.
const C = 'rmn-shell-v1';
const SHELL = ['/app.html', 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(SHELL).catch(() => {}))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.pathname.startsWith('/api/')) return;
  const isShell = u.pathname.startsWith('/k/') || u.pathname === '/app.html' || SHELL.includes(e.request.url);
  if (!isShell) return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(C).then(c => c.put(u.pathname.startsWith('/k/') ? '/app.html' : e.request, copy)); return r; }).catch(() => caches.match(u.pathname.startsWith('/k/') ? '/app.html' : e.request)));
});
