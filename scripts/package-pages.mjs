import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const target = process.argv[2] && path.resolve(process.argv[2]);
if (!target || target === root)
  throw new Error("Provide an empty Pages staging directory");
if (fs.existsSync(target) && fs.readdirSync(target).length)
  throw new Error("Pages staging directory is not empty");
const info = JSON.parse(
  fs.readFileSync(path.join(root, "build-info.json"), "utf8"),
);
if (
  !/^[a-f0-9]{40}$/.test(info.sourceCommit ?? "") ||
  !/^[a-f0-9]{40}$/.test(info.sourceTree ?? "") ||
  !/^[a-f0-9]{64}$/.test(info.artifactDigest ?? "")
)
  throw new Error("Invalid release provenance");
const files = Object.entries(info.assets ?? {});
if (files.length < 3 || files.length > 128)
  throw new Error("Invalid runtime manifest size");
const allowed = (name) =>
  ["index.html", "cad-engine.js", "THIRD_PARTY_NOTICES.txt"].includes(name) ||
  /^assets\/[A-Za-z0-9_-][A-Za-z0-9_.-]*$/.test(name);
const regular = (name) => {
  const stat = fs.lstatSync(path.join(root, name));
  if (!stat.isFile() || stat.isSymbolicLink())
    throw new Error(`Nonregular release file: ${name}`);
};
for (const [name, expected] of files) {
  if (!allowed(name) || !/^[a-f0-9]{64}$/.test(expected))
    throw new Error("Invalid runtime manifest entry");
  regular(name);
  const actual = crypto
    .createHash("sha256")
    .update(fs.readFileSync(path.join(root, name)))
    .digest("hex");
  if (actual !== expected)
    throw new Error(`Runtime checksum mismatch: ${name}`);
}
if (!info.assets["index.html"] || !info.assets["THIRD_PARTY_NOTICES.txt"])
  throw new Error("Incomplete runtime manifest");
const git = (...args) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
if (git("rev-parse", `${info.sourceCommit}^{tree}`) !== info.sourceTree)
  throw new Error("Source tree mismatch");
git("merge-base", "--is-ancestor", info.sourceCommit, "HEAD");
regular("CNAME");
if (
  fs.readFileSync(path.join(root, "CNAME"), "utf8").trim() !==
  "adiguneplanai.hephzibahbehulah.com"
)
  throw new Error("Unexpected public domain");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
for (const match of html.matchAll(
  /(?:src|href)=["'](\/assets\/[^"'?#]+)(?:[?#][^"']*)?["']/g,
)) {
  if (!info.assets[match[1].slice(1)])
    throw new Error("Entry page references an unverified asset");
}
// Publish only the exact-copy runtime; the rejected shell is not retained.
for (const name of [
  ...files.map(([name]) => name),
  "index.html",
  "THIRD_PARTY_NOTICES.txt",
  "build-info.json",
  "CNAME",
  ".nojekyll",
]) {
  regular(name);
  fs.mkdirSync(path.dirname(path.join(target, name)), { recursive: true });
  fs.copyFileSync(path.join(root, name), path.join(target, name));
}
console.log(
  JSON.stringify({
    sourceCommit: info.sourceCommit,
    verifiedRuntimeFiles: files.length,
    retainedAssets: 0,
  }),
);
