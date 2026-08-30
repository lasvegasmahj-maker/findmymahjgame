import Link from "next/link";
import type { ReactNode } from "react";
import { POLICY_LINKS } from "@/content/policy";

export type PolicyBlock = { type: "p"; text: string } | { type: "ul"; items: string[] } | { type: "ol"; items: string[] };
export type PolicySection = { heading: string; blocks: PolicyBlock[] };
export type PolicyDocument = {
  route: string;
  title: string;
  updated: string;
  intro: PolicyBlock[];
  sections: PolicySection[];
};

const linkStyle = { color: "var(--pink-text)", fontWeight: 600 } as const;
const h2Style = { color: "var(--navy)", fontSize: "1.1rem", marginBottom: "0.7rem" } as const;
const EMAIL = "hello@findmymahjgame.com";
// Bold, markdown links, and the support email are the only inline forms the drafts use.
const TOKEN = /(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))|(hello@findmymahjgame\.com)/g;

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of Array.from(text.matchAll(TOKEN))) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const tok = m[0];
    const k = `${key}-${i++}`;
    if (tok.startsWith("**")) {
      out.push(<strong key={k}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("[")) {
      const mm = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const label = mm ? mm[1] : tok;
      const href = mm ? mm[2] : "/";
      out.push(<Link key={k} href={href} style={linkStyle}>{label}</Link>);
    } else {
      out.push(<a key={k} href={`mailto:${EMAIL}`} style={linkStyle}>{EMAIL}</a>);
    }
    last = at + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function Blocks({ blocks, keyBase }: { blocks: PolicyBlock[]; keyBase: string }) {
  return (
    <>
      {blocks.map((b, i) => {
        const k = `${keyBase}-${i}`;
        if (b.type === "p") return <p key={k} style={{ marginTop: i === 0 ? 0 : "0.8rem" }}>{inline(b.text, k)}</p>;
        const ListTag = b.type === "ul" ? "ul" : "ol";
        return (
          <ListTag key={k} style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
            {b.items.map((item, j) => <li key={`${k}-${j}`} style={{ marginBottom: "0.35rem" }}>{inline(item, `${k}-${j}`)}</li>)}
          </ListTag>
        );
      })}
    </>
  );
}

function PolicyNav({ current }: { current: string }) {
  return (
    <nav aria-label="Policy documents" style={{ borderTop: "1px solid var(--border)", paddingTop: "1.2rem", fontSize: "0.88rem" }}>
      <p style={{ margin: "0 0 0.4rem", color: "var(--navy)", fontWeight: 700 }}>Our policies</p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexWrap: "wrap", gap: "0.4rem 1.2rem" }}>
        {POLICY_LINKS.map((l) =>
          l.route === current ? (
            <li key={l.route} aria-current="page" style={{ color: "var(--navy)", fontWeight: 700 }}>{l.title}</li>
          ) : (
            <li key={l.route}><Link href={l.route} style={linkStyle}>{l.title}</Link></li>
          ),
        )}
      </ul>
    </nav>
  );
}

export default function PolicyPage({ doc }: { doc: PolicyDocument }) {
  return (
    <>
      <div className="page-hero">
        <div className="eyebrow">Legal</div>
        <h1>{doc.title}</h1>
        <p>Last updated: {doc.updated}</p>
      </div>
      <div className="page-body" style={{ maxWidth: 740 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem", color: "var(--muted)", lineHeight: 1.75, fontSize: "0.93rem" }}>
          {doc.intro.length > 0 && (
            <section>
              <Blocks blocks={doc.intro} keyBase="intro" />
            </section>
          )}
          {doc.sections.map((s, i) => (
            <section key={`s${i}`}>
              <h2 style={h2Style}>{s.heading}</h2>
              <Blocks blocks={s.blocks} keyBase={`s${i}`} />
            </section>
          ))}
          <PolicyNav current={doc.route} />
        </div>
      </div>
    </>
  );
}
