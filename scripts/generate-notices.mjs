import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const names = [
  "react",
  "react-dom",
  "scheduler",
  "zod",
  "dxf-parser",
  "loglevel",
];
const text =
  "AdigunEplanAI third-party runtime notices\n\n" +
  names
    .map((name) => {
      const pkg = JSON.parse(
        readFileSync(`node_modules/${name}/package.json`, "utf8"),
      );
      return `${name} ${pkg.version}\n${readFileSync(
        `node_modules/${name}/${name === "loglevel" ? "LICENSE-MIT" : "LICENSE"}`,
        "utf8",
      )
        .replace(/\r\n/g, "\n")
        .trim()}\n`;
    })
    .join("\n---\n\n");
const path = "apps/web/public/THIRD_PARTY_NOTICES.txt";
if (process.argv.includes("--check")) {
  if (readFileSync(path, "utf8").replace(/\r\n/g, "\n") !== text)
    throw new Error("Runtime notices are stale; run npm run notices");
  console.log("Runtime notices match installed runtime package licenses");
} else {
  mkdirSync("apps/web/public", { recursive: true });
  writeFileSync(path, text);
}
