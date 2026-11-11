import { test } from "node:test";
import assert from "node:assert/strict";
import { nativeProject } from "../fixtures/native-project.mjs";
import {
  validateProject,
  parseProject,
  serializeProject,
} from "../../packages/electrical-model/project.ts";
import {
  saveEnclosure,
  savePanelStructure,
  savePanelPlacement,
} from "../../packages/panel-engineering/commands.ts";
import {
  savePanelFeature,
  removePanelFeature,
  panelFaceSize,
  facePoint3d,
  featureVertices,
  panelFaceSvg,
} from "../../packages/panel-engineering/features.ts";
import {
  panelReport,
  panelGeometryObj,
} from "../../packages/panel-engineering/report.ts";

const envelope = { widthMm: 600, heightMm: 800, depthMm: 200 };
const feature = {
  name: "Cable <entry>",
  kind: "cable-entry",
  face: "left",
  shape: "circle",
  positionMm: { x: 50, y: 100 },
  widthMm: 20,
  heightMm: 20,
};
function fixture() {
  return saveEnclosure(nativeProject(), { name: "Cabinet", ...envelope });
}

test("face dimensions and coordinates map independently to all six physical planes", () => {
  assert.deepEqual(panelFaceSize(envelope, "left"), {
    widthMm: 200,
    heightMm: 800,
  });
  assert.deepEqual(panelFaceSize(envelope, "top"), {
    widthMm: 600,
    heightMm: 200,
  });
  assert.deepEqual(panelFaceSize(envelope, "back"), {
    widthMm: 600,
    heightMm: 800,
  });
  const expected = {
    back: { x: 12, y: 34, z: 0 },
    front: { x: 12, y: 34, z: 200 },
    left: { x: 0, y: 34, z: 12 },
    right: { x: 600, y: 34, z: 12 },
    top: { x: 12, y: 0, z: 34 },
    bottom: { x: 12, y: 800, z: 34 },
  };
  for (const [face, point] of Object.entries(expected))
    assert.deepEqual(facePoint3d(envelope, face, 12, 34), point);
  const vertices = featureVertices(envelope, { ...feature, id: "hole" });
  assert.ok(vertices.every((point) => point.x === 0));
  assert.equal(Math.min(...vertices.map((point) => point.z)), 40);
  assert.equal(Math.max(...vertices.map((point) => point.z)), 60);
  assert.equal(Math.min(...vertices.map((point) => point.y)), 90);
  assert.equal(Math.max(...vertices.map((point) => point.y)), 110);
});

test("native features validate complete outlines, survive reload and export real face geometry", () => {
  let p = fixture();
  const id = p.enclosures[0].id;
  p = savePanelFeature(p, id, feature);
  assert.deepEqual(
    parseProject(serializeProject(p)).project.enclosures,
    p.enclosures,
  );
  const svg = panelFaceSvg(p, id, "left", "Machining positions <only>");
  assert.ok(svg.includes('width="200" height="800"'));
  assert.ok(svg.includes('cx="50" cy="100" r="10"'));
  assert.ok(svg.includes("Cable &lt;entry&gt;"));
  assert.ok(svg.includes("Machining positions &lt;only&gt;"));
  assert.throws(
    () =>
      savePanelFeature(p, id, { ...feature, positionMm: { x: 195, y: 100 } }),
    /fit/,
  );
  assert.throws(
    () => savePanelFeature(p, id, { ...feature, heightMm: 21 }),
    /circles/,
  );
  assert.throws(
    () =>
      savePanelFeature(p, id, {
        ...feature,
        face: "top",
        positionMm: { x: 50, y: 210 },
      }),
    /fit/,
  );
  const featureId = p.enclosures[0].features[0].id;
  p = removePanelFeature(p, id, featureId);
  assert.equal(p.enclosures[0].features.length, 0);
});

test("compartments are non-solid regions while closed doors collide with equipment", () => {
  let p = fixture();
  const enclosureId = p.enclosures[0].id;
  p = savePanelStructure(p, {
    name: "Zone",
    enclosureId,
    kind: "compartment",
    positionMm: { x: 0, y: 0, z: 0 },
    sizeMm: { x: 600, y: 400, z: 200 },
  });
  p = savePanelPlacement(p, {
    name: "Device",
    enclosureId,
    deviceId: "device-a",
    positionMm: { x: 20, y: 30, z: 180 },
    sizeMm: { x: 40, y: 50, z: 20 },
  });
  assert.deepEqual(panelReport(p, enclosureId).diagnostics, []);
  let obj = panelGeometryObj(p, enclosureId);
  assert.equal(
    obj.split("\n").filter((line) => line.startsWith("f ")).length,
    6,
  );
  assert.equal(
    obj.split("\n").filter((line) => line.startsWith("l ")).length,
    12,
  );
  p = savePanelStructure(p, {
    name: "Closed door",
    enclosureId,
    kind: "door",
    positionMm: { x: 0, y: 0, z: 198 },
    sizeMm: { x: 600, y: 800, z: 2 },
  });
  const issues = panelReport(p, enclosureId).diagnostics;
  assert.equal(issues.length, 1);
  assert.equal(issues[0].code, "collision");
  assert.ok(!issues[0].objectIds.includes(p.panelStructures[0].id));
  obj = panelGeometryObj(p, enclosureId);
  assert.equal(
    obj.split("\n").filter((line) => line.startsWith("f ")).length,
    12,
  );
});

test("native import rejects unsupported numeric ranges, invalid support and duct metadata on nonducts", () => {
  const p = fixture();
  p.enclosures[0].widthMm = 1e308;
  assert.throws(() => validateProject(p));
  p.enclosures[0].widthMm = 600;
  let changed = savePanelStructure(p, {
    name: "Plate",
    enclosureId: p.enclosures[0].id,
    kind: "plate",
    positionMm: { x: 0, y: 0, z: 0 },
    sizeMm: { x: 500, y: 700, z: 2 },
  });
  changed.panelStructures[0].cableDiametersMm = [];
  assert.throws(() => validateProject(changed), /Only cable ducts/);
  delete changed.panelStructures[0].cableDiametersMm;
  changed.panelStructures[0].kind = "compartment";
  assert.throws(
    () =>
      savePanelPlacement(changed, {
        name: "Bad support",
        enclosureId: p.enclosures[0].id,
        deviceId: "device-a",
        mountingStructureId: changed.panelStructures[0].id,
        positionMm: { x: 0, y: 0, z: 2 },
        sizeMm: { x: 50, y: 50, z: 20 },
      }),
    /plate, rail, or door/,
  );
  changed = savePanelFeature(p, p.enclosures[0].id, feature);
  changed.enclosures[0].features.push(
    structuredClone(changed.enclosures[0].features[0]),
  );
  assert.throws(() => validateProject(changed), /Duplicate panel feature/);
  assert.throws(
    () =>
      savePanelPlacement(p, {
        name: "Incomplete rule",
        enclosureId: p.enclosures[0].id,
        deviceId: "device-a",
        positionMm: { x: 10, y: 20, z: 30 },
        sizeMm: { x: 40, y: 50, z: 60 },
        accessDirection: "front",
      }),
    /geometry|direction/,
  );
});
