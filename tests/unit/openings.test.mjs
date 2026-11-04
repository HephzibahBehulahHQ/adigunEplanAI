import { test } from "node:test";
import assert from "node:assert/strict";
import { nativeProject } from "../fixtures/native-project.mjs";
import {
  addBuilding,
  addFloor,
} from "../../packages/building-design/structure.ts";
import {
  addPlanLayer,
  addWall,
  updateWall,
  removeWall,
  setPlanLayer,
} from "../../packages/building-design/walls.ts";
import {
  addWallOpening,
  removeWallOpening,
  openingGeometry,
  wallSegments,
} from "../../packages/building-design/openings.ts";
import {
  parseProject,
  serializeProject,
} from "../../packages/electrical-model/project.ts";
function fixture() {
  let p = addBuilding(nativeProject(), "B", "");
  p = addFloor(p, p.buildings[0].id, "F", 0, 3000);
  p = addPlanLayer(p, p.floors[0].id, "Architecture", "architectural");
  return addWall(
    p,
    p.architecturalLayers[0].id,
    "Wall",
    { x: 0, y: 0 },
    { x: 4000, y: 0 },
    200,
    3000,
  );
}
const door = {
  name: "D1",
  kind: "door",
  offsetMm: 500,
  widthMm: 900,
  heightMm: 2100,
  sillMm: 0,
  hinge: "start",
  swing: "left",
};
test("native openings preserve identities, exact door geometry and solid wall intervals", () => {
  const p = fixture(),
    next = addWallOpening(p, p.walls[0].id, door),
    w = next.walls[0],
    o = next.wallOpenings[0];
  assert.equal(p.wallOpenings.length, 0);
  const g = openingGeometry(w, o);
  assert.deepEqual(g.start, { x: 500, y: 0 });
  assert.deepEqual(g.end, { x: 1400, y: 0 });
  assert.deepEqual(g.leaf, { x: 500, y: 900 });
  assert.equal(g.arc, "M 1400 0 A 900 900 0 0 1 500 900");
  assert.deepEqual(
    wallSegments(w, next.wallOpenings).map((s) => [s.start.x, s.end.x]),
    [
      [0, 500],
      [1400, 4000],
    ],
  );
  assert.deepEqual(parseProject(serializeProject(next)).project, next);
  assert.throws(() => removeWall(next, w.id));
  assert.equal(removeWallOpening(next, o.id).wallOpenings.length, 0);
});
test("opening bounds, sill and rectangular overlaps reject invalid changes atomically", () => {
  const p = fixture(),
    id = p.walls[0].id;
  for (const change of [
    { offsetMm: -1 },
    { offsetMm: 3500 },
    { widthMm: 0 },
    { heightMm: 3100 },
    { sillMm: 1 },
  ])
    assert.throws(() => addWallOpening(p, id, { ...door, ...change }));
  const next = addWallOpening(p, id, door);
  assert.throws(() =>
    addWallOpening(next, id, { ...door, name: "collision", offsetMm: 1000 }),
  );
  const upper = addWallOpening(next, id, {
    ...door,
    name: "transom",
    kind: "window",
    heightMm: 500,
    sillMm: 2200,
  });
  assert.equal(upper.wallOpenings.length, 2);
  assert.deepEqual(
    wallSegments(upper.walls[0], upper.wallOpenings).map((s) => [
      s.start.x,
      s.end.x,
    ]),
    [
      [0, 500],
      [1400, 4000],
    ],
  );
  assert.equal(next.wallOpenings.length, 1);
});
test("wall edits retain opening references and reject shrinking or protected changes", () => {
  let p = fixture();
  p = addWallOpening(p, p.walls[0].id, door);
  const w = p.walls[0],
    o = p.wallOpenings[0];
  const moved = updateWall(p, w.id, {
    ...w,
    start: { x: 100, y: 200 },
    end: { x: 100, y: 4200 },
  });
  assert.equal(moved.walls[0].id, w.id);
  assert.deepEqual(moved.wallOpenings, p.wallOpenings);
  assert.deepEqual(openingGeometry(moved.walls[0], o).leaf, {
    x: -800,
    y: 700,
  });
  assert.throws(() => updateWall(p, w.id, { ...w, end: { x: 1000, y: 0 } }));
  assert.throws(() => updateWall(p, w.id, { ...w, heightMm: 2000 }));
  for (const change of [{ locked: true }, { visible: false }]) {
    const locked = setPlanLayer(p, w.layerId, change);
    assert.throws(() => updateWall(locked, w.id, w));
    assert.throws(() => removeWallOpening(locked, o.id));
    assert.throws(() =>
      addWallOpening(locked, w.id, { ...door, offsetMm: 2200 }),
    );
  }
  assert.deepEqual(p.walls[0], w);
});
test("schema ten migration preserves walls and starts with no invented openings", () => {
  const p = fixture(),
    old = structuredClone(p);
  old.schemaVersion = 10;
  delete old.wallOpenings;
  const migrated = parseProject(JSON.stringify(old));
  assert.equal(migrated.migratedFrom, 10);
  assert.deepEqual(migrated.project.walls, p.walls);
  assert.deepEqual(migrated.project.wallOpenings, []);
});
