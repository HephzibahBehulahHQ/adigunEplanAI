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
    assert.equal(part.verification, "source-reviewed-facts");
    assert.equal(part.licensing, "factual-metadata-only");
    assert.ok(catalogMissingData(part).includes("catalogSourceRevision"));
    assert.ok(catalogMissingData(part).includes("catalogTerminalMarkings"));
    assert.equal(
      catalogMissingData(part).includes("catalogDimensions"),
      !part.dimensionsMm,
    );
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

test("UT 2.5 dimensions preserve body and rail-mounted envelopes separately", () => {
  const part = catalog.find((p) => p.id === "phoenix-3044076");
  assert.deepEqual(part.dimensionsMm, {
    width: 5.2,
    height: 47.7,
    depth: 46.9,
  });
  assert.deepEqual(part.mountedDepthsMm, [
    { rail: "NS 35/7.5", depth: 47.5 },
    { rail: "NS 35/15", depth: 55 },
  ]);
  assert.ok(!catalogMissingData(part).includes("catalogMounting"));
  assert.ok(catalogMissingData(part).includes("catalogSourceRevision"));
  assert.equal(
    catalog.find((p) => p.id === "wago-2002-1201").dimensionsMm,
    undefined,
  );
});
