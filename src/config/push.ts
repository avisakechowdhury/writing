/**
 * VITE_VAPID_PUBLIC_KEY must be set when building the frontend (same public key as server).
 * Without it, PushManager.subscribe fails and web-push cannot target the browser.
 */
export function isWebPushClientConfigured(): boolean {
  return Boolean(import.meta.env.VITE_VAPID_PUBLIC_KEY);
}
