const CACHE_NAME = "agrisense-shell-v4";
const SHELL = ["/", "/index.html", "/manifest.webmanifest", "/favicon.svg", "/icons.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith("agrisense-shell-") && key !== CACHE_NAME).map((key) => caches.delete(key)),
  )));
  self.clients.claim();
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }
  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || data.title || "AgriSense";
  const body = notification.body || data.body || "You have a new AgriSense update.";
  const url = data.url || "/";
  const tag = data.tag || "agrisense-alert";
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: notification.icon || "/favicon.svg",
      badge: "/favicon.svg",
      tag,
      data: { url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put("/index.html", response.clone());
      }
      return response;
    }).catch(async () => (await caches.match("/index.html")) || (await caches.match("/"))));
    return;
  }
  const cacheableStaticFile = url.pathname.startsWith("/assets/")
    || url.pathname.startsWith("/images/")
    || /\.(?:svg|png|jpe?g|webp|woff2?)$/i.test(url.pathname);
  if (cacheableStaticFile) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok && response.type === "basic") {
        await cache.put(request, response.clone());
      }
      return response;
    })());
  }
});
