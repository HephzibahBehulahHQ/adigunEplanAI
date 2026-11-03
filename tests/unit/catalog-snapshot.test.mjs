import { test } from "node:test";
import assert from "node:assert/strict";
import { nativeProject } from "../fixtures/native-project.mjs";
import { place } from "../../packages/schematic-editor/commands.ts";
import { assignCatalogPart } from "../../packages/component-library/catalog.ts";
import {
  parseProject,
  serializeProject,
  validateProject,
} from "../../packages/electrical-model/project.ts";
const assigned = () => {
  const p = nativeProject();
  place(p, "page", "layer", "terminal", { x: 100, y: 100 }, 5);
  return assignCatalogPart(p, p.devices[0].id, "phoenix-3044076");
};
test("catalog assignment freezes mechanical and source metadata through native round trip", () => {
  const p = assigned();
  const snapshot = p.manufacturerParts[0].catalogSnapshot;
  assert.deepEqual(snapshot.dimensionsMm, {
    width: 5.2,
    height: 47.7,
    depth: 46.9,
  });
  assert.equal(snapshot.mountedDepthsMm[1].depth, 55);
  assert.equal(snapshot.reviewedOn, "2026-11-03");
  assert.equal(snapshot.sourceRevision, undefined);
  assert.deepEqual(parseProject(serializeProject(p)).project, p);
  assert.equal(
    assignCatalogPart(p, p.devices[0].id, "phoenix-3044076").manufacturerParts
      .length,
    1,
  );
});
test("reassignment preserves older catalog snapshots and migration never fabricates metadata", () => {
  const p = assigned();
  p.manufacturerParts[0].catalogSnapshot.reviewedOn = "2026-11-02";
  const original = structuredClone(p.manufacturerParts[0]);
  const next = assignCatalogPart(p, p.devices[0].id, "phoenix-3044076");
  assert.equal(next.manufacturerParts.length, 2);
  assert.deepEqual(next.manufacturerParts[0], original);
  assert.notEqual(next.devices[0].partId, original.id);
  const legacy = structuredClone(p);
  legacy.schemaVersion = 8;
  delete legacy.manufacturerParts[0].catalogSnapshot;
  const migrated = parseProject(JSON.stringify(legacy));
  assert.equal(migrated.migratedFrom, 8);
  assert.equal(migrated.project.schemaVersion, 11);
  assert.equal(
    migrated.project.manufacturerParts[0].catalogSnapshot,
    undefined,
  );
  assert.deepEqual(migrated.project.devices, p.devices);
});
test("invalid native catalog metadata is rejected rather than silently discarded", () => {
  for (const mutate of [
    (s) => {
      s.dimensionsMm.width = -1;
    },
    (s) => {
      s.mountedDepthsMm[0].depth = 0;
    },
    (s) => {
      s.reviewedOn = "2026-02-30";
    },
    (s) => {
      s.verification = "certified";
    },
    (s) => {
      s.mapping.connections = 0;
    },
  ]) {
    const p = assigned();
    mutate(p.manufacturerParts[0].catalogSnapshot);
    assert.throws(() => validateProject(p));
  }
});
