import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const dist = path.join(root, "apps/web/dist");
const git = (...args) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const hash = (file) =>
  crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const safeAsset = (name) =>
  /^[A-Za-z0-9_-][A-Za-z0-9_.-]*$/.test(name) && !name.includes("..");

if (!fs.statSync(dist).isDirectory())
  throw new Error("Production build is missing");
const builtIndex = path.join(dist, "index.html");
const builtAssets = path.join(dist, "assets");
fs.mkdirSync(builtAssets, { recursive: true });
fs.copyFileSync(builtIndex, path.join(root, "index.html"));
fs.copyFileSync(
  path.join(dist, "cad-engine.js"),
  path.join(root, "cad-engine.js"),
);
for (const name of fs.readdirSync(builtAssets)) {
  if (!safeAsset(name)) throw new Error(`Unexpected build asset: ${name}`);
  const source = path.join(builtAssets, name);
  if (!fs.lstatSync(source).isFile())
    throw new Error(`Nonregular build asset: ${name}`);
  fs.copyFileSync(source, path.join(root, "assets", name));
}

const assets = {};
fs.copyFileSync(
  path.join(dist, "eplan-symbols.js"),
  path.join(root, "eplan-symbols.js"),
);
assets["eplan-symbols.js"] = hash(path.join(root, "eplan-symbols.js"));
assets["cad-engine.js"] = hash(path.join(root, "cad-engine.js"));
for (const name of fs.readdirSync(builtAssets)) {
  if (!safeAsset(name)) throw new Error(`Unexpected runtime asset: ${name}`);
  const file = path.join(builtAssets, name);
  if (!fs.lstatSync(file).isFile())
    throw new Error(`Nonregular runtime asset: ${name}`);
  assets[`assets/${name}`] = hash(file);
}
assets["index.html"] = hash(path.join(root, "index.html"));
assets["THIRD_PARTY_NOTICES.txt"] = hash(
  path.join(root, "THIRD_PARTY_NOTICES.txt"),
);
const pkg = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
);
const info = {
  sourceCommit: git("rev-parse", "HEAD"),
  sourceTree: git("rev-parse", "HEAD^{tree}"),
  version: pkg.version,
  stage: "development",
  milestone: "UI-001 compact CAD runtime",
  workflowRun: process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : "local-validation",
  assets,
};
const canonical = (value) =>
  JSON.stringify(value, (_key, item) =>
    item && !Array.isArray(item) && typeof item === "object"
      ? Object.fromEntries(
          Object.entries(item).sort(([a], [b]) => a.localeCompare(b)),
        )
      : item,
  );
info.artifactDigest = crypto
  .createHash("sha256")
  .update(canonical(info))
  .digest("hex");
info.artifactDigestAlgorithm =
  "SHA-256 of canonical build-info JSON excluding digest fields";
fs.writeFileSync(
  path.join(root, "build-info.json"),
  `${JSON.stringify(info, null, 2)}\n`,
);
console.log(
  `Prepared ${Object.keys(assets).length} verified runtime files from ${info.sourceCommit}`,
);
