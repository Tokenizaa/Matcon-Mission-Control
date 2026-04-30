// Guarded PWA registration — only in production, not inside iframes (Lovable preview).
export function registerPWA() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const isInIframe = (() => {
    try { return window.self !== window.top; } catch { return true; }
  })();
  const host = window.location.hostname;
  const isPreviewHost =
    host.includes("id-preview--") ||
    host.includes("lovableproject.com") ||
    host.includes("lovable.app") && host.includes("preview");
  const isLocalhost = host === "localhost" || host === "127.0.0.1";

  if (isInIframe || isPreviewHost || isLocalhost || import.meta.env.DEV) {
    // Cleanup any previously-registered SW so dev/preview never serves stale assets.
    navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
