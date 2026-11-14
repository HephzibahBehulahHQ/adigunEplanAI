import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = path.join(
  root,
  "docs/3000-solid-engineering-projects-to-work-on",
);
const staging = process.argv[2] && path.resolve(process.argv[2]);
if (
  !staging ||
  staging === root ||
  !fs.existsSync(path.join(staging, "build-info.json"))
)
  throw new Error("Provide the already verified Pages staging directory");
execFileSync("python3", [path.join(source, "catalog.py"), "--complete"], {
  stdio: "inherit",
});
const target = path.join(staging, "engineering-projects");
if (fs.existsSync(target))
  throw new Error("Catalog staging destination already exists");
const files = [];
const visit = (dir, prefix = "") => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink())
      throw new Error("Catalog symlinks are forbidden");
    const rel = `${prefix}${entry.name}`;
    if (entry.isDirectory()) {
      if (!/^(projects|indexes)(\/|$)/.test(rel)) continue;
      visit(path.join(dir, entry.name), `${rel}/`);
    } else if (
      [
        "README.md",
        "TEMPLATE.md",
        "CONTINUITY.md",
        "NEXT_AGENT.md",
        "domains.json",
        "variants.json",
      ].includes(rel) ||
      /^indexes\/[a-z-]+\.json$/.test(rel) ||
      /^projects\/[a-z-]+\/ENG-\d{4}\.md$/.test(rel)
    ) {
      if (!entry.isFile()) throw new Error("Nonregular catalog file");
      const bytes = fs.readFileSync(path.join(dir, entry.name));
      if (bytes.length > 500000) throw new Error("Oversized catalog document");
      files.push({
        path: rel,
        sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
        bytes: bytes.length,
      });
      const out = path.join(target, rel);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, bytes);
    }
  }
};
visit(source);
files.sort((a, b) => a.path.localeCompare(b.path));
const manifest = {
  title: "3000 Solid Engineering Projects to Work On",
  sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  }).trim(),
  status: "planning library; not validated native projects",
  projectCount: files.filter((file) => file.path.startsWith("projects/"))
    .length,
  sheetsPerProject: 30,
  files,
};
fs.writeFileSync(
  path.join(target, "publication-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
console.log(
  `Packaged ${manifest.projectCount} project briefs and ${files.length} catalog files`,
);
