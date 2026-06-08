export function escapeHtml(input: unknown): string {
  if (input == null) return "";
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function isValidEmail(email: unknown): email is string {
  if (typeof email !== "string" || email.length > 254) return false;
  // Restrict the local and domain parts to RFC-safe characters. This also keeps
  // mailto-parameter characters (?, &, spaces) out of values we later render into
  // mailto: links in the admin dashboard.
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email);
}

export function clampText(input: unknown, max: number): string {
  if (input == null) return "";
  const s = String(input);
  return s.length > max ? s.slice(0, max) : s;
}

// Returns the URL only if it is a well-formed http(s) URL, else empty string.
// Blocks javascript:, data:, and other schemes from reaching href/src in emails.
export function safeHttpUrl(input: unknown): string {
  if (input == null) return "";
  const s = String(input).trim();
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:" ? s : "";
  } catch {
    return "";
  }
}
