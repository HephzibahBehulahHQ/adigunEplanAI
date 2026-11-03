import { test } from "node:test";
import assert from "node:assert/strict";
import { nativeProject } from "../fixtures/native-project.mjs";
import {
  addBuilding,
  addFloor,
} from "../../packages/building-design/structure.ts";
import {
  addPlanLayer,
  setPlanLayer,
  addWall,
  removeWall,
  wallFootprint,
} from "../../packages/building-design/walls.ts";
import {
  validateProject,
  parseProject,
  serializeProject,
} from "../../packages/electrical-model/project.ts";
const fixture = () => {
  let p = addBuilding(nativeProject(), "B", "");
  p = addFloor(p, p.buildings[0].id, "Ground", 0, 3000);
  return addPlanLayer(p, p.floors[0].id, "Walls", "architectural");
};
const wall = (p) =>
  addWall(
    p,
    p.architecturalLayers[0].id,
    "W1",
    { x: 0, y: 0 },
    { x: 4000, y: 0 },
    200,
    3000,
  );
test("walls preserve exact thickness, native identities and persistence", () => {
  const p = fixture();
  const next = wall(p);
  assert.equal(p.walls.length, 0);
  assert.deepEqual(wallFootprint(next.walls[0]), [
    { x: 0, y: 100 },
    { x: 4000, y: 100 },
    { x: 4000, y: -100 },
    { x: 0, y: -100 },
  ]);
  const diagonal = { ...next.walls[0], end: { x: 3000, y: 4000 } };
  const shape = wallFootprint(diagonal);
  assert.ok(
    Math.abs(
      Math.hypot(shape[0].x - shape[3].x, shape[0].y - shape[3].y) - 200,
    ) < 1e-9,
  );
  assert.deepEqual(parseProject(serializeProject(next)).project, next);
  assert.equal(removeWall(next, next.walls[0].id).walls.length, 0);
});
test("wall commands respect layer visibility, locking, discipline and floor ownership", () => {
  const p = wall(fixture());
  const id = p.architecturalLayers[0].id;
  for (const change of [{ locked: true }, { visible: false }]) {
    const protectedProject = setPlanLayer(p, id, change);
    assert.throws(() => wall(protectedProject));
    assert.throws(() => removeWall(protectedProject, p.walls[0].id));
  }
  const electrical = structuredClone(p);
  electrical.architecturalLayers[0].kind = "electrical";
  assert.throws(() => validateProject(electrical));
  const other = addFloor(p, p.buildings[0].id, "Upper", 3000, 3000);
  other.walls[0].floorId = other.floors[1].id;
  assert.throws(() => validateProject(other));
  assert.throws(() =>
    addWall(p, id, "Bad", { x: 0, y: 0 }, { x: 0, y: 0 }, 200, 3000),
  );
  assert.throws(() =>
    addWall(p, id, "Bad", { x: 0, y: 0 }, { x: 4000, y: 0 }, 0, 3000),
  );
});
test("schema nine migrates with empty architectural collections without inventing walls", () => {
  const legacy = nativeProject();
  legacy.schemaVersion = 9;
  delete legacy.architecturalLayers;
  delete legacy.walls;
  const result = parseProject(JSON.stringify(legacy));
  assert.equal(result.migratedFrom, 9);
  assert.equal(result.project.schemaVersion, 15);
  assert.deepEqual(result.project.walls, []);
  assert.deepEqual(result.project.architecturalLayers, []);
  assert.deepEqual(result.project.devices, legacy.devices);
  const invalid = { ...result.project };
  delete invalid.walls;
  assert.throws(() => validateProject(invalid));
});
