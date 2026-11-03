import { test } from "node:test";
import assert from "node:assert/strict";
import { nativeProject } from "../fixtures/native-project.mjs";
import {
  addBuilding,
  addFloor,
} from "../../packages/building-design/structure.ts";
import {
  importPlanGeometry,
  removePlanGeometry,
} from "../../packages/building-design/plan-import.ts";
import { setPlanLayer } from "../../packages/building-design/walls.ts";
import {
  parseProject,
  serializeProject,
  validateProject,
} from "../../packages/electrical-model/project.ts";
const fixture = () => {
  let p = addBuilding(nativeProject(), "Building", "");
  return addFloor(p, p.buildings[0].id, "Floor", 0, 3000);
};
const draft = {
  sourceFile: "plan.svg",
  mmPerUnit: 100,
  issues: [],
  shapes: [
    {
      name: "outline",
      layer: "Architecture",
      closed: true,
      points: [
        { x: 0, y: 0 },
        { x: 4000, y: 0 },
        { x: 4000, y: 3000 },
      ],
    },
  ],
};
test("plan import retains geometry, source scale and separate native layer identities", () => {
  const p = fixture(),
    next = importPlanGeometry(p, p.floors[0].id, draft);
  assert.equal(p.planGeometry.length, 0);
  assert.deepEqual(next.planGeometry[0].points, draft.shapes[0].points);
  assert.equal(next.planGeometry[0].mmPerUnit, 100);
  assert.equal(next.architecturalLayers[0].name, "Architecture");
  assert.deepEqual(parseProject(serializeProject(next)).project, next);
  const again = importPlanGeometry(next, next.floors[0].id, draft);
  assert.notEqual(again.planGeometry[0].layerId, again.planGeometry[1].layerId);
});
test("plan geometry rejects invalid floor ownership, bounds and protected deletion", () => {
  const p = fixture(),
    next = importPlanGeometry(p, p.floors[0].id, draft),
    shape = next.planGeometry[0];
  assert.throws(() => importPlanGeometry(p, "missing", draft));
  assert.throws(() =>
    importPlanGeometry(p, p.floors[0].id, { ...draft, mmPerUnit: 0 }),
  );
  assert.throws(() =>
    importPlanGeometry(p, p.floors[0].id, {
      ...draft,
      shapes: [
        {
          ...draft.shapes[0],
          points: [
            { x: 0, y: 0 },
            { x: 1000001, y: 1 },
          ],
        },
      ],
    }),
  );
  for (const change of [{ locked: true }, { visible: false }])
    assert.throws(() =>
      removePlanGeometry(setPlanLayer(next, shape.layerId, change), shape.id),
    );
  assert.equal(removePlanGeometry(next, shape.id).planGeometry.length, 0);
  const bad = structuredClone(next);
  bad.architecturalLayers[0].kind = "electrical";
  assert.throws(() => validateProject(bad));
});
test("schema eleven migration adds no fictitious plan geometry", () => {
  const p = fixture();
  const legacy = { ...p, schemaVersion: 11 };
  delete legacy.planGeometry;
  const result = parseProject(JSON.stringify(legacy));
  assert.equal(result.migratedFrom, 11);
  assert.deepEqual(result.project.planGeometry, []);
  assert.deepEqual(result.project.floors, p.floors);
});
