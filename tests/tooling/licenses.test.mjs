import { test } from "node:test";
import assert from "node:assert/strict";
import { licenseIssues } from "../../scripts/check-licenses.mjs";

test("license gate rejects missing and unreviewed licenses", () => {
  assert.deepEqual(
    licenseIssues({
      "": {},
      "node_modules/good": { license: "MIT" },
      "node_modules/missing": {},
      "node_modules/review": { license: "GPL-3.0-only" },
      "node_modules/local": { link: true },
    }),
    ["node_modules/missing: MISSING", "node_modules/review: GPL-3.0-only"],
  );
});

test("MPL exception is limited to reviewed Lightning CSS release", () => {
  assert.deepEqual(
    licenseIssues({
      "node_modules/lightningcss": { license: "MPL-2.0", version: "1.33.0" },
      "node_modules/lightningcss-win32-x64-msvc": {
        license: "MPL-2.0",
        version: "1.33.0",
      },
      "node_modules/lightningcss-future": {
        license: "MPL-2.0",
        version: "2.0.0",
      },
      "node_modules/unreviewed": { license: "MPL-2.0", version: "1.33.0" },
    }),
    [
      "node_modules/lightningcss-future: MPL-2.0",
      "node_modules/unreviewed: MPL-2.0",
    ],
  );
});
