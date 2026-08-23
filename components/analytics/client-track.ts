// Fire-and-forget client analytics. No React dependency, so any component, hook, or plain
// event handler can call it without a provider or context. A blocked, offline, or failed
// beacon must never affect the page it was fired from, so every failure mode here is silent.

const SESSION_KEY_STORAGE = "fmg_analytics_session";

function sessionKey(): string {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY_STORAGE);
    if (existing) return existing;
    const created = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_KEY_STORAGE, created);
    return created;
  } catch {
    return "";
  }
}

export function trackClient(name: string, props?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, props, sessionKey: sessionKey() }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // analytics must never break the calling page
  }
}
