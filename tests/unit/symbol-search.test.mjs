import { test } from "node:test";
import assert from "node:assert/strict";
import {
  engineeringSymbols,
  searchSymbols,
  symbolCategories,
} from "../../packages/component-library/symbols.ts";

test("secondary categories expose power distribution and motor controls without duplicate entries or definition changes", () => {
  const before = JSON.stringify(engineeringSymbols);
  for (const [id, category] of [
    ["busbar-four-taps", "power"],
    ["distribution-three-way", "power"],
    ["variable-frequency-drive", "motors"],
    ["measurement-disconnect-terminal", "connections"],
  ]) {
    const symbol = engineeringSymbols.find((s) => s.id === id);
    assert.ok(searchSymbols("", category).includes(symbol));
    assert.ok(searchSymbols("", symbol.category).includes(symbol));
  }
  const all = searchSymbols("");
  assert.equal(new Set(all.map((s) => s.id)).size, engineeringSymbols.length);
  for (const symbol of all)
    assert.equal(
      new Set(symbolCategories(symbol)).size,
      symbolCategories(symbol).length,
    );
  assert.equal(JSON.stringify(engineeringSymbols), before);
  assert.deepEqual(searchSymbols("", "unknown"), []);
});

test("symbol search combines localized names/categories with normalized original terms and category filters", () => {
  const translate = (key) =>
    ({ "category-power": "Energie", "busbar-four-taps": "Sammelschiene" })[
      key
    ] ?? key;
  assert.deepEqual(
    searchSymbols("ＥＮＥＲＧＩＥ sammel", "power", translate).map((s) => s.id),
    ["busbar-four-taps"],
  );
  assert.deepEqual(searchSymbols("Sammelschiene", "motors", translate), []);
  assert.equal(
    searchSymbols("busbar-four-taps", "power")[0].id,
    "busbar-four-taps",
  );
});
