import posthog from "posthog-js";

export function initPostHog() {
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  if (!key) return;
  posthog.init(key, {
    api_host: (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? "https://us.i.posthog.com",
    capture_pageview: true,
    capture_pageleave: true,
    persistence: "localStorage",
  });
}

export function track(event: string, properties?: Record<string, unknown>) {
  try { posthog.capture(event, properties); } catch { /* no-op if not init */ }
}

export function identifyUser(id: string | number, properties?: Record<string, unknown>) {
  try { posthog.identify(String(id), properties); } catch { /* no-op */ }
}

export function resetUser() {
  try { posthog.reset(); } catch { /* no-op */ }
}
