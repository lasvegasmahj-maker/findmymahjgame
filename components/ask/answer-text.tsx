"use client";

// 400 is where a centered single block stops being readable on a phone, about 8 lines.
const LONG = 400;
// Openers the rules answers use to start a new idea; breaking here keeps a thought whole.
const BREAK_CUE = /^(Two separate things|One limit applies|One more thing|Amounts:|Who pays:|Jokerless:|Settlement follows|Commitment decides|Put those together|One timing point|Keep this separate|After East|If any player|Anything beyond this|Play then|One thing this is not|Two points to settle)/;

const LONG_STYLE = { fontSize: "1.05rem", color: "var(--navy)", fontWeight: 500, textAlign: "left", lineHeight: 1.6 } as const;

export function splitIntoParagraphs(text: string): string[] {
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
    // A cue only earns its own paragraph once the current one has something in it worth
    // closing, or a cue landing right after a full group strands a single sentence.
    if (current.length >= 3 || (current.length >= 2 && BREAK_CUE.test(s))) {
      paras.push(current.join(" "));
      current = [];
    }
    current.push(s);
  }
  if (current.length) paras.push(current.join(" "));
  return paras;
}

/**
 * maxParagraphs clips the home card, whose job is to answer enough that the reader knows
 * the site has the answer, not to reprint a 1600 character rule in the hero. /ask leaves
 * it unset and shows everything.
 */
export function AnswerText({
  text,
  className,
  maxParagraphs,
}: {
  text: string;
  className?: string;
  maxParagraphs?: number;
}) {
  if (text.length <= LONG) {
    return className ? (
      <p className={className}>{text}</p>
    ) : (
      <p style={{ fontSize: "1.1rem", color: "var(--navy)", fontWeight: 600, textAlign: "center", lineHeight: 1.55 }}>{text}</p>
    );
  }
  const all = splitIntoParagraphs(text);
  const paras = maxParagraphs && all.length > maxParagraphs ? all.slice(0, maxParagraphs) : all;
  const clipped = paras.length < all.length;
  return (
    <div>
      {paras.map((p, i) => (
        <p
          key={i}
          className={className}
          style={
            className
              ? { fontWeight: 500, textAlign: "left", marginBottom: i === paras.length - 1 && !clipped ? 0 : "0.8rem" }
              : { ...LONG_STYLE, margin: i === paras.length - 1 ? 0 : "0 0 0.8rem" }
          }
        >
          {p}
        </p>
      ))}
      {clipped ? (
        <p
          className={className}
          style={className ? { fontWeight: 500, textAlign: "left", opacity: 0.75, margin: 0 } : { ...LONG_STYLE, opacity: 0.75, margin: 0 }}
        >
          Read the rest of this answer on the Ask page.
        </p>
      ) : null}
    </div>
  );
}
