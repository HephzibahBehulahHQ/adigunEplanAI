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
} from "../../packages/building-design/walls.ts";
import {
  removePlanRiser,
  riserSchedule,
  savePlanRiser,
} from "../../packages/building-design/risers.ts";
import {
  parseProject,
  serializeProject,
  validateProject,
} from "../../packages/electrical-model/project.ts";
import { ProjectHistory } from "../../packages/electrical-model/history.ts";

function fixture() {
  let p = addBuilding(nativeProject(), "Workshop", "");
  p = addFloor(p, p.buildings[0].id, "Ground", 0, 3000);
  p = addFloor(p, p.buildings[0].id, "Upper", 3000, 3000);
  for (const floor of p.floors)
    p = addPlanLayer(p, floor.id, "Electrical", "electrical");
  return p;
}
function input(p) {
  return {
    name: "R1",
    kind: "cable",
    position: { x: 1012.5, y: -986.25 },
    start: {
      floorId: p.floors[0].id,
      layerId: p.architecturalLayers[0].id,
      heightMm: 100,
    },
    end: {
      floorId: p.floors[1].id,
      layerId: p.architecturalLayers[1].id,
      heightMm: 200,
    },
  };
}

test("riser schedule derives explicit vertical distance and never creates electrical connectivity", () => {
  const p = fixture(),
    before = serializeProject(p);
  const q = savePlanRiser(p, input(p), 50);
  assert.equal(serializeProject(p), before);
  assert.deepEqual(q.planRisers[0].position, { x: 1000, y: -1000 });
  assert.deepEqual(q.devices, p.devices);
  assert.deepEqual(q.wires, p.wires);
  assert.deepEqual(q.wirePaths, p.wirePaths);
  assert.deepEqual(q.nets, p.nets);
  assert.deepEqual(q.cables, p.cables);
  assert.deepEqual(q.circuits, p.circuits);
  const row = riserSchedule(q, p.buildings[0].id)[0];
  assert.equal(row.startElevationMm, 100);
  assert.equal(row.endElevationMm, 3200);
  assert.equal(row.verticalLengthM, 3.1);
  assert.deepEqual(riserSchedule(q, "unrelated-building"), []);
  assert.deepEqual(parseProject(serializeProject(q)).project, q);
  const reversed = savePlanRiser(
    q,
    { ...input(p), start: input(p).end, end: input(p).start },
    0,
    q.planRisers[0].id,
  );
  assert.equal(riserSchedule(reversed)[0].verticalLengthM, 3.1);
});

test("riser updates preserve unsnapped geometry and are atomic undoable transactions", () => {
  const p = fixture(),
    history = new ProjectHistory(p);
  const q = history.execute((draft) => savePlanRiser(draft, input(draft), 0));
  const id = q.planRisers[0].id;
  const renamed = history.execute((draft) =>
    savePlanRiser(draft, { ...draft.planRisers[0], name: "Renamed" }, 0, id),
  );
  assert.deepEqual(renamed.planRisers[0].position, input(p).position);
  assert.equal(history.undo().planRisers[0].name, "R1");
  assert.equal(history.redo().planRisers[0].name, "Renamed");
  assert.throws(() =>
    history.execute((draft) =>
      savePlanRiser(
        draft,
        { ...input(draft), position: { x: Infinity, y: 0 } },
        50,
        id,
      ),
    ),
  );
  assert.equal(history.current.planRisers[0].name, "Renamed");
  assert.equal(removePlanRiser(renamed, id).planRisers.length, 0);
  for (const grid of [-1, Infinity, NaN])
    assert.throws(() => savePlanRiser(p, input(p), grid), /grid/);
});

test("both original and replacement riser endpoint layers must be editable", () => {
  const initial = fixture();
  const q = savePlanRiser(initial, input(initial), 0);
  const id = q.planRisers[0].id;
  for (const endpoint of ["start", "end"]) {
    for (const state of [{ visible: false }, { locked: true }]) {
      const protectedProject = setPlanLayer(
        q,
        q.planRisers[0][endpoint].layerId,
        state,
      );
      const before = serializeProject(protectedProject);
      assert.throws(() => removePlanRiser(protectedProject, id), /unlocked/);
      assert.throws(
        () => savePlanRiser(protectedProject, input(q), 0, id),
        /unlocked/,
      );
      const withReplacement = addPlanLayer(
        protectedProject,
        input(q)[endpoint].floorId,
        "Replacement",
        "electrical",
      );
      const replacement = {
        ...input(q),
        [endpoint]: {
          ...input(q)[endpoint],
          layerId: withReplacement.architecturalLayers.at(-1).id,
        },
      };
      assert.throws(
        () => savePlanRiser(withReplacement, replacement, 0, id),
        /unlocked/,
      );
      assert.equal(serializeProject(protectedProject), before);
      assert.throws(
        () => savePlanRiser(protectedProject, { ...input(q), name: "R2" }, 0),
        /unlocked/,
      );
    }
  }
});

for (const [label, change, pattern] of [
  ["same floor", (p, r) => (r.end = { ...r.start }), /different floors/],
  ["missing floor", (p, r) => (r.end.floorId = "missing"), /different floors/],
  [
    "wrong endpoint layer",
    (p, r) => (r.end.layerId = r.start.layerId),
    /electrical layer/,
  ],
  [
    "architectural layer",
    (p) => (p.architecturalLayers[1].kind = "architectural"),
    /electrical layer/,
  ],
  [
    "negative endpoint height",
    (p, r) => (r.start.heightMm = -1),
    /greater than|small/i,
  ],
  ["height outside floor", (p, r) => (r.end.heightMm = 3001), /floor height/],
  [
    "zero vertical length",
    (p, r) => {
      p.floors[1].elevationMm = 0;
      r.end.heightMm = r.start.heightMm;
    },
    /nonzero/,
  ],
  [
    "out of bounds position",
    (p, r) => (r.position.x = 1000001),
    /less than|big/i,
  ],
])
  test(`riser import rejects ${label}`, () => {
    const p = fixture(),
      r = { ...input(p), id: "riser" };
    change(p, r);
    p.planRisers.push(r);
    assert.throws(() => parseProject(JSON.stringify(p)), pattern);
  });

test("riser references block floor/layer deletion and cross-building endpoints", () => {
  let p = fixture();
  p = savePlanRiser(p, input(p), 0);
  for (const collection of ["floors", "architecturalLayers"]) {
    const broken = structuredClone(p);
    broken[collection].pop();
    assert.throws(() => validateProject(broken));
  }
  const duplicate = structuredClone(p);
  duplicate.planRisers.push({
    ...duplicate.planRisers[0],
    id: "duplicate",
    name: "r1",
  });
  assert.throws(() => validateProject(duplicate), /unique/);
  const otherBuilding = addBuilding(p, "Other building", "");
  otherBuilding.floors[1].buildingId = otherBuilding.buildings[1].id;
  assert.throws(() => validateProject(otherBuilding), /same building/);
});
