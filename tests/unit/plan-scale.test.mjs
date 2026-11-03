import { test } from "node:test";
import assert from "node:assert/strict";
import {
  scaledPlanSize,
  setFloorDrawingScale,
} from "../../packages/building-design/scale.ts";
import {
  addBuilding,
  addFloor,
  addRectangularRoom,
} from "../../packages/building-design/structure.ts";
import { nativeProject } from "../fixtures/native-project.mjs";
import {
  parseProject,
  serializeProject,
  validateProject,
} from "../../packages/electrical-model/project.ts";
function fixture() {
  let p = addBuilding(nativeProject(), "B", "");
  p = addFloor(p, p.buildings[0].id, "Ground", 0, 3000);
  return addRectangularRoom(p, p.floors[0].id, "Office", 0, 0, 4000, 3000);
}
test("drawing scales convert millimetre bounds to physical sheet dimensions without changing origin", () => {
  assert.deepEqual(scaledPlanSize("-200 -200 4400 3400", 50), {
    widthMm: 88,
    heightMm: 68,
  });
  assert.deepEqual(scaledPlanSize("100,200,4000,3000", 100), {
    widthMm: 40,
    heightMm: 30,
  });
  assert.deepEqual(scaledPlanSize("0 0 4000 3000", 12.5), {
    widthMm: 320,
    heightMm: 240,
  });
  for (const scale of [0, -1, NaN, Infinity, 10001])
    assert.throws(() => scaledPlanSize("0 0 4000 3000", scale));
  for (const box of [
    "0 0 0 1",
    "0 0 -1 10",
    "0 0 1",
    "0 0 NaN 1",
    "0 0 Infinity 1",
  ])
    assert.throws(() => scaledPlanSize(box, 100));
});
test("floor scale changes preserve native geometry and persist with validation", () => {
  const p = fixture();
  const a = setFloorDrawingScale(p, p.floors[0].id, 50);
  assert.equal(p.floors[0].drawingScale, 100);
  assert.equal(a.floors[0].drawingScale, 50);
  assert.deepEqual(a.rooms, p.rooms);
  assert.deepEqual(parseProject(serializeProject(a)).project, a);
  assert.throws(() => setFloorDrawingScale(p, "missing", 50));
  for (const scale of [0, -1, Infinity, 10001])
    assert.throws(() => setFloorDrawingScale(p, p.floors[0].id, scale));
  const invalid = structuredClone(p);
  delete invalid.floors[0].drawingScale;
  assert.throws(() => validateProject(invalid));
});
test("schema 13 floors migrate to explicit 1:100 without scaling model geometry", () => {
  const p = fixture();
  const legacy = { ...p, schemaVersion: 13 };
  delete legacy.floors[0].drawingScale;
  const r = parseProject(JSON.stringify(legacy));
  assert.equal(r.migratedFrom, 13);
  assert.equal(r.project.schemaVersion, 14);
  assert.equal(r.project.floors[0].drawingScale, 100);
  assert.deepEqual(r.project.rooms, p.rooms);
});
