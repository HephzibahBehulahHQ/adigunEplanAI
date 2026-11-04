import { test } from "node:test";
import assert from "node:assert/strict";
import { dxfFixture } from "../fixtures/dxf-plan.mjs";
import { parseDxfPlan } from "../../packages/building-design/dxf-import.ts";
import {
  importPlanGeometry,
  removePlanGeometry,
} from "../../packages/building-design/plan-import.ts";
import {
  addBuilding,
  addFloor,
} from "../../packages/building-design/structure.ts";
import { nativeProject } from "../fixtures/native-project.mjs";
import {
  parseProject,
  serializeProject,
} from "../../packages/electrical-model/project.ts";
test("verified DXF parser preserves line/polyline geometry, declared inches and unsupported records", () => {
  const d = parseDxfPlan(
    dxfFixture({ units: 1, extra: [0, "UNSUPPORTED_ENTITY", 5, "A4"] }),
    "original.dxf",
  );
  assert.equal(d.mmPerUnit, 25.4);
  assert.equal(d.shapes.length, 2);
  assert.deepEqual(d.shapes[0].points, [
    { x: 0, y: 0 },
    { x: 254, y: -127 },
  ]);
  assert.equal(d.shapes[1].closed, true);
  assert.ok(Math.abs(d.shapes[1].points[2].y + 76.2) < 1e-9);
  assert.equal(d.shapes[1].points[2].x, 101.6);
  assert.ok(d.issues.some((s) => s === "A3: unsupported CIRCLE"));
  assert.ok(d.issues.some((s) => s === "A4: unsupported UNSUPPORTED_ENTITY"));
});
test("DXF import retains hidden/locked native layers, identities and reload", () => {
  for (const [layerFlags, layerColor, visible, locked] of [
    [4, 7, true, true],
    [1, 7, false, false],
    [0, -7, false, false],
  ]) {
    const d = parseDxfPlan(
      dxfFixture({ layerFlags, layerColor }),
      "layers.dxf",
    );
    let p = addBuilding(nativeProject(), "B", "");
    p = addFloor(p, p.buildings[0].id, "F", 0, 3000);
    const next = importPlanGeometry(p, p.floors[0].id, d);
    assert.equal(next.architecturalLayers[0].visible, visible);
    assert.equal(next.architecturalLayers[0].locked, locked);
    assert.throws(() => removePlanGeometry(next, next.planGeometry[0].id));
    assert.deepEqual(parseProject(serializeProject(next)).project, next);
    assert.equal(p.planGeometry.length, 0);
  }
});
test("missing DXF units require explicit override; malformed input fails without guessing", () => {
  for (const units of [null, 0, 99]) {
    assert.throws(() => parseDxfPlan(dxfFixture({ units }), "unitless.dxf"));
    assert.equal(
      parseDxfPlan(dxfFixture({ units }), "manual.dxf", 10).mmPerUnit,
      10,
    );
  }
  for (const text of [
    "AutoCAD Binary DXF\0",
    "0\nSECTION\n2\nENTITIES\n",
    "0\nEOF\n",
    "x\nEOF\n",
    " ".repeat(1024 * 1024 + 1),
  ])
    assert.throws(() => parseDxfPlan(text, "bad.dxf", 1));
  assert.throws(() => parseDxfPlan(dxfFixture(), "bad-scale.dxf", NaN));
});
test("bulges, extrusion changes and oversized counts are reported instead of flattened or allocated", () => {
  for (const options of [
    { bulge: 1 },
    { extrusionZ: -1 },
    { vertexCount: 1000000000 },
  ]) {
    const d = parseDxfPlan(dxfFixture(options), "unsupported.dxf");
    assert.equal(d.shapes.length, 1);
    assert.equal(d.shapes[0].name, "A1");
    assert.ok(d.issues.some((s) => s.startsWith("A2:")));
  }
  const d = parseDxfPlan(
    dxfFixture().replace("11\n10\n", "11\n10oops\n"),
    "bad-number.dxf",
  );
  assert.equal(d.shapes.length, 1);
  assert.ok(d.issues.includes("A1: Invalid DXF numeric value"));
});
