const CACHE = 'battle-axe-design-studio-v0332';
const CORE = [
  './', './index.html', './src/styles/app.css', './src/main.js',
  './src/app/state.js', './src/data/paviaProject.js',
  './src/modules/navigation.js', './src/modules/mapView.js',
  './src/modules/featureReview.js', './src/modules/geometryExplorer.js',
  './src/modules/battlefieldDetector.js', './projects/pavia/battlefield.svg',
  './manifest.webmanifest', './icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const request = event.request;
  const url = new URL(request.url);

  // During active development, navigations and application code are network-first.
  // This prevents an older installed PWA shell from masking a newly deployed release.
  if (request.mode === 'navigate' || /\.(?:js|css|html)$/.test(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }

  // Large/static map assets remain cache-first for fast mobile/offline use.
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(request, copy));
      return response;
    }))
  );
});
