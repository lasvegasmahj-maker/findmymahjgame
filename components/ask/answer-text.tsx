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

// Deliberately no truncation. Clipping the home card to the first paragraphs was tried
// on 2026-08-31 and reverted: house_note is appended last, so the clip always ate the
// "this is a house rule, not a League rule" disclaimer, and on misnamed-discard it left
// only "a call made on the wrong name does not stand" while hiding the payment and the
// dead hand. Half of a penalty rule reads as the whole rule. Length on the home card is
// a design question for the owner; showing the whole rule is not.
export function AnswerText({ text, className }: { text: string; className?: string }) {
  if (text.length <= LONG) {
    return className ? (
      <p className={className}>{text}</p>
    ) : (
      <p style={{ fontSize: "1.1rem", color: "var(--navy)", fontWeight: 600, textAlign: "center", lineHeight: 1.55 }}>{text}</p>
    );
  }
  const paras = splitIntoParagraphs(text);
  return (
    <div>
      {paras.map((p, i) => (
        <p
          key={i}
          className={className}
          style={
            className
              ? { fontWeight: 500, textAlign: "left", marginBottom: i === paras.length - 1 ? 0 : "0.8rem" }
              : { ...LONG_STYLE, margin: i === paras.length - 1 ? 0 : "0 0 0.8rem" }
          }
        >
          {p}
        </p>
      ))}
    </div>
  );
}
