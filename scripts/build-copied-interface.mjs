import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import "./export-eplan-symbols.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
const dist = `${root}apps/web/dist`;
// This fixed build-output directory contains no source files.
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
for (const [source, target] of [
  ["apps/web/index.html", "index.html"],
  ["apps/web/public/cad-engine.js", "cad-engine.js"],
  ["apps/web/public/eplan-symbols.js", "eplan-symbols.js"],
  ["THIRD_PARTY_NOTICES.txt", "THIRD_PARTY_NOTICES.txt"],
]) {
  fs.copyFileSync(`${root}${source}`, `${dist}/${target}`);
}
// Stable asset names otherwise let returning browsers reuse an older engine.
// Version script requests by their actual content without changing the UI.
let html = fs.readFileSync(`${dist}/index.html`, "utf8");
const planImport = "assets/compact-plan-import.js";
await build({
  configFile: false,
  publicDir: false,
  build: {
    outDir: dist,
    emptyOutDir: false,
    lib: {
      entry: `${root}apps/web/src/compactPlanImport.ts`,
      formats: ["es"],
      fileName: () => planImport,
    },
  },
});
const importDigest = crypto
  .createHash("sha256")
  .update(fs.readFileSync(`${dist}/${planImport}`))
  .digest("hex")
  .slice(0, 16);
html = html.replace(
  "./src/compactPlanImport.ts",
  `./${planImport}?v=${importDigest}`,
);
const accountScript = "assets/workspace-account.js";
const accountStyles = "assets/workspace-account.css";
await build({
  configFile: false,
  publicDir: false,
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    outDir: `${dist}/assets`,
    emptyOutDir: false,
    lib: {
      entry: `${root}apps/web/src/copiedInterfaceAccount.tsx`,
      formats: ["es"],
      fileName: () => "workspace-account.js",
      cssFileName: "workspace-account",
    },
  },
  esbuild: { jsx: "automatic" },
});
const versionedAccountAsset = (asset) => {
  const digest = crypto
    .createHash("sha256")
    .update(fs.readFileSync(`${dist}/${asset}`))
    .digest("hex")
    .slice(0, 16);
  return `./${asset}?v=${digest}`;
};
html = html.replace(
  "./src/copiedInterfaceAccount.tsx",
  versionedAccountAsset(accountScript),
);
html = html.replace(
  "</head>",
  `<link rel="stylesheet" href="${versionedAccountAsset(accountStyles)}" />\n</head>`,
);
for (const asset of ["cad-engine.js", "eplan-symbols.js"]) {
  const digest = crypto
    .createHash("sha256")
    .update(fs.readFileSync(`${dist}/${asset}`))
    .digest("hex")
    .slice(0, 16);
  html = html.replace(`src="./${asset}"`, `src="./${asset}?v=${digest}"`);
}
fs.writeFileSync(`${dist}/index.html`, html);
console.log("Copied the fixed interface with content-versioned script URLs.");
