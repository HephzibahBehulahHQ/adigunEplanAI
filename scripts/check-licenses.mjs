import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const approvedLicenses = new Set([
  "MIT",
  "ISC",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "0BSD",
  "CC0-1.0",
  "Unlicense",
  "BlueOak-1.0.0",
  "Python-2.0",
]);
export function licenseIssues(packages) {
  return Object.entries(packages)
    .filter(
      ([path, pkg]) =>
        path.includes("node_modules/") &&
        !pkg.link &&
        !approvedLicenses.has(pkg.license) &&
        !(
          pkg.license === "MPL-2.0" &&
          pkg.version === "1.33.0" &&
          /^node_modules\/lightningcss(?:-[a-z0-9-]+)?$/.test(path)
        ),
    )
    .map(([path, pkg]) => `${path}: ${pkg.license ?? "MISSING"}`);
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
  const issues = licenseIssues(lock.packages);
  if (issues.length) {
    console.error(issues.join("\n"));
    process.exitCode = 1;
  } else {
    const rows = Object.entries(lock.packages)
      .filter(([path, pkg]) => path.includes("node_modules/") && !pkg.link)
      .map(([path, pkg]) => ({
        path,
        version: pkg.version,
        license: pkg.license,
      }));
    if (process.argv.includes("--report"))
      writeFileSync(
        "docs/dependency-licenses.json",
        JSON.stringify(rows, null, 2) + "\n",
      );
    console.log(
      `License metadata passed for ${rows.length} locked dependency entries`,
    );
  }
}
