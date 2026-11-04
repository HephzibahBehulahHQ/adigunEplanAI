import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  defaults,
  restorePreferences,
} from "../../apps/web/src/preferences.ts";
test("preferences recover malformed storage and bound untrusted layout values", () => {
  assert.deepEqual(restorePreferences("{"), defaults());
  const result = restorePreferences(
    JSON.stringify({
      language: "xx",
      color: "bad",
      panels: {
        project: { dock: "floating", size: 9999, visible: false },
        bom: { size: -10 },
      },
    }),
  );
  assert.equal(result.language, "en");
  assert.equal(result.color, "#ffffff");
  assert.equal(result.panels.project.dock, "left");
  assert.equal(result.panels.project.size, 600);
  assert.equal(result.panels.project.visible, false);
  assert.equal(result.panels.bom.size, 140);
});
test("layout/theme/locale preferences round trip independently", () => {
  const value = defaults();
  value.theme = "light";
  value.language = "yo";
  value.background = "custom";
  value.color = "#abcdef";
  value.panels.panel3d.dock = "bottom";
  value.panels.project.collapsed = true;
  assert.deepEqual(restorePreferences(JSON.stringify(value)), value);
});
test("four dictionaries have identical keys and nonempty translated strings", () => {
  const dictionaries = ["en", "de", "yo", "pcm"].map((l) =>
    JSON.parse(
      readFileSync(
        new URL(`../../packages/localization/${l}.json`, import.meta.url),
        "utf8",
      ),
    ),
  );
  const keys = Object.keys(dictionaries[0]).sort();
  for (const d of dictionaries) {
    assert.deepEqual(Object.keys(d).sort(), keys);
    for (const text of Object.values(d))
      assert.ok(typeof text === "string" && text.trim().length > 0);
  }
});

test("corporate token values match pinned canonical manifests", () => {
  const corporate = JSON.parse(
    readFileSync(
      new URL("../../packages/design-tokens/corporate.json", import.meta.url),
      "utf8",
    ),
  );
  const brands = JSON.parse(
    readFileSync(
      new URL("../../packages/design-tokens/brands.json", import.meta.url),
      "utf8",
    ),
  );
  const css = readFileSync(
    new URL("../../packages/design-tokens/tokens.css", import.meta.url),
    "utf8",
  ).toLowerCase();
  for (const color of [
    ...Object.values(corporate.colors),
    brands.elektroniker.accent,
  ])
    assert.ok(css.includes(color.toLowerCase()));
});
