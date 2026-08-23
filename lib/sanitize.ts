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

// The player and cruise forms ask for "first name and last initial" but a form
// label is not enforcement; people type full names anyway and those names land
// on public, indexable pages. "First Last" with a multi letter surname becomes
// "First L."; a single name or an already abbreviated one passes through.
export function enforcePublicName(input: unknown): string {
  if (input == null) return "";
  const name = String(input).trim().replace(/\s+/g, " ");
  const parts = name.split(" ");
  if (parts.length >= 2) {
    const surnameLetters = parts[parts.length - 1].replace(/[^\p{L}]/gu, "");
    if (surnameLetters.length > 1) {
      const first = parts.slice(0, -1).join(" ");
      return `${first} ${surnameLetters[0].toUpperCase()}.`.slice(0, 40);
    }
  }
  return name.slice(0, 40);
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
