"use client";

// 400 is where a centered single block stops being readable on a phone, about 8 lines.
const LONG = 400;
// Openers the rules answers use to start a new idea; breaking here keeps a thought whole.
const BREAK_CUE = /^(Two separate things|One limit applies|One more thing|Amounts:|Who pays:|Jokerless:|Settlement follows|Timing decides|Put those together|One timing point|Keep this separate|After East|If any player|Anything beyond this|Play then|One thing this is not|Two points to settle)/;

export function AnswerText({ text, className }: { text: string; className?: string }) {
  if (text.length <= LONG) {
    return className ? (
      <p className={className}>{text}</p>
    ) : (
      <p style={{ fontSize: "1.1rem", color: "var(--navy)", fontWeight: 600, textAlign: "center", lineHeight: 1.55 }}>{text}</p>
    );
  }
  const sentences: string[] = [];
  let buf = "";
  for (const part of text.split(/(\s+)/)) {
    buf += part;
    if (/[.!?]["')\]]?\s*$/.test(part)) {
      sentences.push(buf.trim());
      buf = "";
    }
  }
  if (buf.trim()) sentences.push(buf.trim());
  const paras: string[] = [];
  let current: string[] = [];
  for (const s of sentences) {
    if (current.length && (BREAK_CUE.test(s) || current.length >= 3)) {
      paras.push(current.join(" "));
      current = [];
    }
    current.push(s);
  }
  if (current.length) paras.push(current.join(" "));
  return (
    <div>
      {paras.map((p, i) => (
        <p
          key={i}
          className={className}
          style={className ? { marginBottom: "0.8rem", textAlign: "left" } : { fontSize: "1.05rem", color: "var(--navy)", fontWeight: 500, textAlign: "left", lineHeight: 1.6, margin: "0 0 0.8rem" }}
        >
          {p}
        </p>
      ))}
    </div>
  );
}
