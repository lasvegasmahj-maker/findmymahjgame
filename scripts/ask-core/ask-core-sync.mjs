#!/usr/bin/env node
// Vendor the shared Ask core into this site.
//
//   node scripts/ask-core/ask-core-sync.mjs            # latest release tag of mahj-ask-core
//   node scripts/ask-core/ask-core-sync.mjs v1.2.0     # a specific tag
//   node scripts/ask-core/ask-core-sync.mjs --path ../mahj-ask-core   # a local checkout (development only; lock records the commit)
//
// Copies the core's src/ into lib/ask-core/ byte for byte, copies its tooling/ into
// scripts/ask-core/, and writes ask-core.lock.json (version, commit, per-file sha256). The
// check script (ask-core-check.mjs) verifies the vendored files against the lock, so a local
// edit to lib/ask-core is caught in CI: shared behavior is changed in the core, never in a site.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";

const REPO = process.env.ASK_CORE_REPO || "https://github.com/lasvegasmahj-maker/mahj-ask-core.git";
const SITE = process.cwd();
const DEST = join(SITE, "lib", "ask-core");
const TOOLS = join(SITE, "scripts", "ask-core");
const LOCK = join(SITE, "ask-core.lock.json");

// The script vendors into the current working directory. Refuse to run inside the core itself
// (it would copy the core into its own tree) or anywhere that is not a site checkout.
if (existsSync(join(SITE, "src", "corpus", "entries-fmg.ts")) && existsSync(join(SITE, "tooling", "ask-core-sync.mjs"))) {
  console.error("ask-core-sync: the current directory is the mahj-ask-core repository. cd into the site checkout first.");
  process.exit(2);
}
if (!existsSync(join(SITE, "package.json")) || !existsSync(join(SITE, "app"))) {
  console.error("ask-core-sync: the current directory is not a site checkout (no package.json + app/). cd into the site first.");
  process.exit(2);
}

const args = process.argv.slice(2);
const pathIdx = args.indexOf("--path");
const localPath = pathIdx > -1 ? resolve(args[pathIdx + 1]) : null;
const wanted = args.find((a) => /^v?\d+\.\d+\.\d+$/.test(a)) ?? null;

function git(cwd, ...cmd) {
  return execFileSync("git", cmd, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function walk(dir, base = dir, out = []) {
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, base, out);
    else out.push(relative(base, p));
  }
  return out;
}

function sha(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

let src;
let cleanup = () => {};
if (localPath) {
  src = localPath;
} else {
  const tmp = mkdtempSync(join(tmpdir(), "mahj-ask-core-"));
  cleanup = () => rmSync(tmp, { recursive: true, force: true });
  execFileSync("git", ["clone", "--quiet", REPO, tmp], { stdio: ["ignore", "pipe", "pipe"] });
  const tags = git(tmp, "tag", "--list", "v*", "--sort=-v:refname").split("\n").filter(Boolean);
  const tag = wanted ? (wanted.startsWith("v") ? wanted : `v${wanted}`) : tags[0];
  if (!tag) throw new Error("mahj-ask-core has no release tags yet; run its release script first");
  if (!tags.includes(tag)) throw new Error(`tag ${tag} not found in mahj-ask-core (have ${tags.slice(0, 5).join(", ")})`);
  git(tmp, "checkout", "--quiet", tag);
  src = tmp;
}

const commit = git(src, "rev-parse", "HEAD");
const dirty = localPath ? git(src, "status", "--porcelain").length > 0 : false;
const versionSrc = readFileSync(join(src, "src", "version.ts"), "utf8");
const version = versionSrc.match(/CORE_VERSION = "([^"]+)"/)?.[1];
if (!version) throw new Error("could not read CORE_VERSION from the core");

// Replace lib/ask-core wholesale so removed core files do not linger.
rmSync(DEST, { recursive: true, force: true });
mkdirSync(DEST, { recursive: true });
const files = {};
for (const rel of walk(join(src, "src"))) {
  const buf = readFileSync(join(src, "src", rel));
  const target = join(DEST, rel);
  mkdirSync(join(target, ".."), { recursive: true });
  writeFileSync(target, buf);
  files[`lib/ask-core/${rel}`] = sha(buf);
}
mkdirSync(TOOLS, { recursive: true });
for (const rel of walk(join(src, "tooling"))) {
  const buf = readFileSync(join(src, "tooling", rel));
  writeFileSync(join(TOOLS, rel), buf);
  files[`scripts/ask-core/${rel}`] = sha(buf);
}

const lock = {
  package: "mahj-ask-core",
  version,
  commit,
  source: localPath ? `local:${localPath}${dirty ? " (dirty working tree)" : ""}` : `${REPO}#v${version}`,
  synced_at: new Date().toISOString().slice(0, 10),
  files,
};
writeFileSync(LOCK, JSON.stringify(lock, null, 2) + "\n");
cleanup();
console.log(`Vendored mahj-ask-core ${version} (${commit.slice(0, 7)}${dirty ? ", DIRTY local tree" : ""}) into lib/ask-core: ${Object.keys(files).length} files. Lock written to ask-core.lock.json.`);
if (dirty) console.log("WARNING: synced from a dirty local checkout. Commit and tag the core before merging this site.");
