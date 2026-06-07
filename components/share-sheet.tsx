"use client";

// Big one-tap share buttons with prewritten copy. Senior-simple: full-width,
// large, labeled in plain words. Used on the "table is up" and table pages.
export default function ShareSheet({ url, message }: { url: string; message: string }) {
  const text = `${message} ${url}`;
  const enc = encodeURIComponent;

  const buttons: { label: string; href: string; bg: string }[] = [
    { label: "📲  Text my friends", href: `sms:?&body=${enc(text)}`, bg: "#1a1f5e" },
    { label: "💬  Share on WhatsApp", href: `https://wa.me/?text=${enc(text)}`, bg: "#25D366" },
    { label: "📧  Share by email", href: `mailto:?subject=${enc("Come play mahjong with me")}&body=${enc(text)}`, bg: "#6b7280" },
    { label: "📘  Share on Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, bg: "#1877F2" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
      {buttons.map((b) => (
        <a
          key={b.label}
          href={b.href}
          target={b.href.startsWith("http") ? "_blank" : undefined}
          rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            minHeight: 64, borderRadius: 14, background: b.bg, color: "white",
            fontSize: "1.2rem", fontWeight: 800, textDecoration: "none",
          }}
        >
          {b.label}
        </a>
      ))}
    </div>
  );
}
