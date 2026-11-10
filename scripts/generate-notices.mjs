import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
const names = [
  "react",
  "react-dom",
  "scheduler",
  "zod",
  "dxf-parser",
  "loglevel",
  "@supabase/supabase-js",
  "@supabase/auth-js",
  "@supabase/functions-js",
  "@supabase/postgrest-js",
  "@supabase/realtime-js",
  "@supabase/storage-js",
  "@supabase/phoenix",
  "iceberg-js",
  "tslib",
];
const text =
  "AdigunEplanAI third-party runtime notices\n\n" +
  names
    .map((name) => {
      const pkg = JSON.parse(
        readFileSync(`node_modules/${name}/package.json`, "utf8"),
      );
      const licensePath = [
        "LICENSE",
        "LICENSE.md",
        "LICENSE.txt",
        "LICENSE-MIT",
      ]
        .map((file) => `node_modules/${name}/${file}`)
        .find((file) => existsSync(file));
      if (!licensePath) throw new Error(`Missing runtime license for ${name}`);
      return `${name} ${pkg.version}\n${readFileSync(licensePath, "utf8")
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
