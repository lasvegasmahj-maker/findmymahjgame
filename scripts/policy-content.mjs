// Generates content/policy/*.ts from the policy drafts in docs/policy/drafts. The drafts are
// the source of truth; the site renders the generated modules. Refuses to generate a published
// document that still carries an owner bracket, so an unresolved decision can never ship.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const DRAFTS = path.join(ROOT, "docs/policy/drafts");
const OUT = path.join(ROOT, "content/policy");

const DOCS = [
  { file: "terms-of-use", slug: "terms-of-use", route: "/terms", title: "Terms of Use", updated: "August 29, 2026", publish: true },
  { file: "privacy-policy", slug: "privacy-policy", route: "/privacy", title: "Privacy Policy", updated: "August 29, 2026", publish: true },
  { file: "provider-terms", slug: "provider-terms", route: "/provider-terms", title: "Provider Terms", updated: "August 29, 2026", publish: true },
  { file: "billing-disclosures", slug: "billing-disclosures", route: "/billing-disclosures", title: "Billing Disclosures", updated: "August 29, 2026", publish: true },
  { file: "matching-community-standards", slug: "matching-community-standards", route: "/matching-standards", title: "Matching Community Standards", updated: "August 29, 2026", publish: true },
];

function parse(markdown) {
  const lines = markdown.split("\n");
  const first = lines.indexOf("---");
  if (first < 0) throw new Error("draft has no --- separator");
  let last = lines.length;
  for (let i = lines.length - 1; i > first; i--) if (lines[i].trim() === "---") { last = i; break; }
  const body = lines.slice(first + 1, last);
  // Nothing but the italic effective-date trailer may follow the last separator, so a section
  // pasted below it cannot vanish silently.
  for (const line of lines.slice(last + 1)) {
    const t = line.trim();
    if (t && !t.startsWith("*") && !t.endsWith("*") && !/^docs\//.test(t) && !/\.md\.\*$/.test(t)) throw new Error(`content after the closing separator would be dropped: "${t.slice(0, 60)}"`);
  }

  const intro = [];
  const sections = [];
  let current = null;
  let para = [];
  let list = null;
  const blocksOf = () => (current ? current.blocks : intro);
  const flushPara = () => { if (para.length) { blocksOf().push({ type: "p", text: para.join(" ") }); para = []; } };
  const flushList = () => { if (list) { blocksOf().push(list); list = null; } };

  for (const raw of body) {
    const line = raw.replace(/\s+$/, "");
    if (line.startsWith("## ")) { flushPara(); flushList(); current = { heading: line.slice(3).trim(), blocks: [] }; sections.push(current); continue; }
    if (line.trim() === "") { flushPara(); flushList(); continue; }
    const ul = line.match(/^- (.*)$/);
    const ol = line.match(/^\d+\. (.*)$/);
    if (ul || ol) {
      flushPara();
      const type = ul ? "ul" : "ol";
      if (!list || list.type !== type) { flushList(); list = { type, items: [] }; }
      list.items.push((ul ? ul[1] : ol[1]).trim());
      continue;
    }
    if (list && /^\s{2,}/.test(line)) { list.items[list.items.length - 1] += " " + line.trim(); continue; }
    flushList();
    para.push(line.trim());
  }
  flushPara(); flushList();
  return { intro, sections };
}

function clean(text) {
  return text.replace(/`([^`]+)`/g, "$1");
}
function cleanBlocks(blocks) {
  return blocks.map((b) => (b.type === "p" ? { type: "p", text: clean(b.text) } : { type: b.type, items: b.items.map(clean) }));
}

const CHECK = process.argv.includes("--check");
fs.mkdirSync(OUT, { recursive: true });
let drift = 0;
const emit = (file, text) => {
  const target = path.join(OUT, file);
  if (CHECK) {
    const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
    if (current !== text) { drift++; console.error(`drift: content/policy/${file} differs from its draft`); }
    return;
  }
  fs.writeFileSync(target, text);
  console.log(`wrote content/policy/${file}`);
};
const links = [];
for (const d of DOCS) {
  const src = fs.readFileSync(path.join(DRAFTS, `${d.file}.md`), "utf8");
  links.push({ route: d.route, title: d.title });
  if (!d.publish) { continue; }
  if (/OWNER TO CONFIRM/.test(src)) throw new Error(`${d.file}.md still carries an owner bracket; not generating`);
  // Policy pages link only within the site; an external URL must be verified by hand first.
  for (const m of src.matchAll(/\]\(([^)]+)\)/g)) {
    if (!m[1].startsWith("/")) throw new Error(`${d.file}.md links outside the site (${m[1]}); not generating`);
  }
  const { intro, sections } = parse(src);
  const doc = { route: d.route, title: d.title, updated: d.updated, intro: cleanBlocks(intro), sections: sections.map((s) => ({ heading: clean(s.heading), blocks: cleanBlocks(s.blocks) })) };
  const json = JSON.stringify(doc, null, 2);
  if (/OWNER TO CONFIRM|DRAFT FOR OWNER REVIEW/.test(json)) throw new Error(`${d.file}: draft-only text leaked into generated content`);
  const out = `// Generated from docs/policy/drafts/${d.file}.md by scripts/policy-content.mjs. Do not edit by\n// hand: edit the draft and run \`node scripts/policy-content.mjs\`.\nimport type { PolicyDocument } from "@/components/policy-doc";\n\nexport const doc: PolicyDocument = ${json};\n`;
  emit(`${d.slug}.ts`, out);
}
const nav = `// Generated by scripts/policy-content.mjs. The five policy documents, in reading order.\nexport const POLICY_LINKS = ${JSON.stringify(links, null, 2)} as const;\n`;
emit("index.ts", nav);
if (CHECK) {
  if (drift) { console.error(`${drift} generated file(s) out of date; run node scripts/policy-content.mjs`); process.exit(1); }
  console.log("content/policy is up to date with the drafts");
}
