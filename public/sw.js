/* Balcão service worker — production only.
   Network-first for HTML navigations (avoids stale shells),
   stale-while-revalidate for JS/CSS/fonts/images, and a small
   precache of the app shell so main routes work offline. */

const VERSION = "v1";
const APP_SHELL = "balcao-shell-" + VERSION;
const RUNTIME = "balcao-runtime-" + VERSION;

const SHELL_URLS = ["/", "/manifest.webmanifest", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL).then((cache) => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== APP_SHELL && k !== RUNTIME).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Don't cache Supabase / API calls — let them go to network (or fail when offline)
  if (url.hostname.endsWith(".supabase.co") || url.hostname.endsWith(".supabase.in")) return;

  // HTML navigations: network-first, fallback to cached shell ("/")
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(APP_SHELL);
          cache.put("/", fresh.clone()).catch(() => {});
          return fresh;
        } catch {
          const cache = await caches.open(APP_SHELL);
          return (await cache.match("/")) || Response.error();
        }
      })()
    );
    return;
  }

  // Same-origin static assets: stale-while-revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME);
        const cached = await cache.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res && res.status === 200) cache.put(req, res.clone()).catch(() => {});
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })()
    );
  }
});
