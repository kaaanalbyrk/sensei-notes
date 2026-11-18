// Service Worker: uygulama dosyalarını önbelleğe alır, çevrimdışı çalıştırır.
// Dosyaları güncellediğinde VERSION değerini artır.
const VERSION = 'sensei-v2';
const FILES = ['./','index.html','style.css','app.js','db.js','manifest.webmanifest','icons/icon-180.png','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, {ignoreSearch:true}).then(hit => hit || fetch(e.request).catch(() => caches.match('index.html'))));
});
