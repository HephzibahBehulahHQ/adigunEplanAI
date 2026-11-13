import fs from "node:fs";
import { fileURLToPath } from "node:url";
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
console.log(
  "Copied the source interface without transforming HTML, styles, or scripts.",
);
