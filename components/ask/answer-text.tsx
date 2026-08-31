"use client";

// A long rules answer read as one centered block of semibold text, roughly 40 lines on a phone.
export function AnswerText({ text }: { text: string }) {
  const long = text.length > 400;
  if (!long) {
    return (
      <p style={{ fontSize: "1.1rem", color: "var(--navy)", fontWeight: 600, textAlign: "center", lineHeight: 1.55 }}>{text}</p>
    );
  }
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [text];
  const joined = sentences.join("");
  if (joined.length < text.length) sentences.push(text.slice(joined.length));
  const paras: string[] = [];
  for (let i = 0; i < sentences.length; i += 3) paras.push(sentences.slice(i, i + 3).join("").trim());
  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      {paras.map((p, i) => (
        <p key={i} style={{ fontSize: "1.05rem", color: "var(--navy)", fontWeight: 500, textAlign: "left", lineHeight: 1.6, margin: "0 0 0.8rem" }}>
          {p}
        </p>
      ))}
    </div>
  );
}
