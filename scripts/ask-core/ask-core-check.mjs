#!/usr/bin/env node
// Verify this site's vendored Ask core against ask-core.lock.json and against the sibling site.
//
//   node scripts/ask-core/ask-core-check.mjs            # local integrity + sibling freshness (network)
//   node scripts/ask-core/ask-core-check.mjs --offline  # local integrity only
//
// Fails (exit 1) when: a vendored file differs from the lock (someone edited lib/ask-core in
// place), a locked file is missing or an unlocked file is present, the lock version does not
// match CORE_VERSION in the vendored code, or the sibling site's main branch has a NEWER core
// version than this lock (this site is stale). Being AHEAD of the sibling is allowed: the first
// mover in a serialized rollout is ahead by design, and the parity check reports it.

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SITE = process.cwd();
const LOCK = join(SITE, "ask-core.lock.json");
const offline = process.argv.includes("--offline");

const SIBLINGS = {
  findmymahjgame: "https://raw.githubusercontent.com/lasvegasmahj-maker/lasvegasmahj/main/ask-core.lock.json",
  lasvegasmahj: "https://raw.githubusercontent.com/lasvegasmahj-maker/findmymahjgame/main/ask-core.lock.json",
};

function walk(dir, base = dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, base, out);
    else out.push(relative(base, p));
  }
  return out;
}
const sha = (buf) => createHash("sha256").update(buf).digest("hex");
const cmp = (a, b) => {
  const pa = a.split(".").map(Number), pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return 0;
};

const problems = [];
if (!existsSync(LOCK)) {
  console.error("ask-core.lock.json is missing. Run node scripts/ask-core/ask-core-sync.mjs.");
  process.exit(1);
}
const lock = JSON.parse(readFileSync(LOCK, "utf8"));

const present = [
  ...walk(join(SITE, "lib", "ask-core")).map((r) => `lib/ask-core/${r}`),
  ...walk(join(SITE, "scripts", "ask-core")).map((r) => `scripts/ask-core/${r}`),
];
for (const rel of present) {
  const expected = lock.files[rel];
  if (!expected) { problems.push(`unlocked file present: ${rel} (run the sync; never add files under lib/ask-core by hand)`); continue; }
  const actual = sha(readFileSync(join(SITE, rel)));
  if (actual !== expected) problems.push(`vendored file differs from the lock: ${rel}. Shared behavior changes in mahj-ask-core, not here. Run the sync to restore it.`);
}
for (const rel of Object.keys(lock.files)) if (!present.includes(rel)) problems.push(`locked file missing: ${rel}`);

const versionFile = join(SITE, "lib", "ask-core", "version.ts");
if (existsSync(versionFile)) {
  const v = readFileSync(versionFile, "utf8").match(/CORE_VERSION = "([^"]+)"/)?.[1];
  if (v !== lock.version) problems.push(`lock says ${lock.version} but lib/ask-core/version.ts says ${v}`);
}
if (String(lock.source).startsWith("local:") && process.env.CI) problems.push(`lock was written from a local checkout (${lock.source}); sync from a release tag before merging`);

if (!offline) {
  const me = Object.keys(SIBLINGS).find((name) => SITE.includes(name)) || (existsSync(join(SITE, "lib", "rules")) ? "findmymahjgame" : "lasvegasmahj");
  const url = SIBLINGS[me];
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const theirs = await res.json();
      const c = cmp(lock.version, theirs.version);
      if (c < 0) problems.push(`STALE: the sibling site's main vendors mahj-ask-core ${theirs.version}; this site has ${lock.version}. Sync to ${theirs.version} (or newer) before merging.`);
      else if (c > 0) console.log(`Note: this site is AHEAD of the sibling (${lock.version} vs ${theirs.version}). Roll the sibling forward next; the parity check will flag production until it matches.`);
      else console.log(`Sibling site main vendors the same core version ${theirs.version}.`);
    } else if (res.status === 404) {
      console.log("Sibling site has no ask-core.lock.json on main yet (first rollout).");
    } else {
      console.log(`Sibling lock fetch returned ${res.status}; freshness not checked.`);
    }
  } catch (e) {
    console.log(`Sibling lock unreachable (${e?.message ?? e}); freshness not checked. Integrity was.`);
  }
}

if (problems.length) {
  console.error("ask-core check FAILED:\n  " + problems.join("\n  "));
  process.exit(1);
}
console.log(`ask-core check OK: ${Object.keys(lock.files).length} vendored files match mahj-ask-core ${lock.version} (${String(lock.commit).slice(0, 7)}).`);
