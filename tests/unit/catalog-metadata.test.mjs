import { test } from "node:test";
import assert from "node:assert/strict";
import {
  catalog,
  catalogMissingData,
} from "../../packages/component-library/catalog.ts";

test("catalog warnings distinguish reviewed facts from missing manufacturer information", () => {
  const phoenix = catalog.find((p) => p.id === "phoenix-3044076");
  const wago = catalog.find((p) => p.id === "wago-2002-1201");
  assert.ok(!catalogMissingData(phoenix).includes("nominalVoltage"));
  assert.ok(catalogMissingData(wago).includes("nominalVoltage"));
  assert.ok(catalogMissingData(wago).includes("nominalCurrent"));
  for (const part of catalog) {
    assert.ok(catalogMissingData(part).includes("catalogSourceRevision"));
    assert.ok(catalogMissingData(part).includes("catalogTerminalMarkings"));
    assert.ok(catalogMissingData(part).includes("catalogDimensions"));
  }
  assert.match(phoenix.ratings.sectionRangeBasis, /ferrule ranges differ/);
  const completed = {
    ...phoenix,
    dimensionsMm: { width: 1, height: 2, depth: 3 },
    terminalMarkings: ["a", "b"],
    mounting: "test fixture",
    sourceRevision: "fixture revision",
  };
  assert.deepEqual(catalogMissingData(completed), []);
  assert.ok(
    catalogMissingData({ ...completed, sourceRevision: "  " }).includes(
      "catalogSourceRevision",
    ),
  );
});
