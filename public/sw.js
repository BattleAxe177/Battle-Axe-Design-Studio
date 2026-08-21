// Battle Axe Design Studio v0.5.7.0
// Runtime-stabilization release: disable offline caching so GitHub deployments are never hidden by a stale PWA shell.
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('battle-axe-design-studio-')).map(k => caches.delete(k))))
    .then(() => self.registration.unregister())
    .then(() => self.clients.claim())
));
self.addEventListener('fetch', () => {});
