const SHELL = "wg-shell-v1"
const PUBLIC_PAGES = new Set(["/", "/jobs", "/pricing", "/sources", "/login", "/signup"])

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) => cache.addAll(["/", "/brand/workgraph-icon-1024.png"])),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

function isPersonal(pathname) {
  return (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/tracker") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/applications")
  )
}

async function networkThenCache(request) {
  const cache = await caches.open(SHELL)
  try {
    const response = await fetch(request)
    if (response.ok) await cache.put(request, response.clone())
    return response
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached
    return new Response("You are offline. This page is not saved on this device.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }
}

async function cacheThenNetwork(request) {
  const cache = await caches.open(SHELL)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) await cache.put(request, response.clone())
  return response
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return
  if (event.request.method !== "GET") return
  if (isPersonal(url.pathname)) return

  const hasCookie = Boolean(event.request.headers.get("cookie"))
  if (event.request.mode === "navigate" && PUBLIC_PAGES.has(url.pathname) && !hasCookie) {
    event.respondWith(networkThenCache(event.request))
    return
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/brand/")) {
    event.respondWith(cacheThenNetwork(event.request))
  }
})
