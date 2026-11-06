import { test } from "node:test";
import assert from "node:assert/strict";
import { nativeProject } from "../fixtures/native-project.mjs";
import {
  parseProject,
  serializeProject,
} from "../../packages/electrical-model/project.ts";
import {
  saveEnclosure,
  removeEnclosure,
  savePanelStructure,
  removePanelStructure,
  savePanelPlacement,
  removePanelPlacement,
  createPanelDevice,
} from "../../packages/panel-engineering/commands.ts";
import {
  panelReport,
  panelLayoutSvg,
  panelGeometryObj,
} from "../../packages/panel-engineering/report.ts";
import {
  heatBalance,
  ductOccupancy,
} from "../../packages/panel-engineering/estimates.ts";

function fixture() {
  return saveEnclosure(nativeProject(), {
    name: "Control <cabinet>",
    widthMm: 600,
    heightMm: 800,
    depthMm: 200,
  });
}
const placement = (enclosureId) => ({
  name: "Terminal",
  deviceId: "device-a",
  enclosureId,
  positionMm: { x: 50, y: 100, z: 10 },
  sizeMm: { x: 60, y: 80, z: 40 },
  dimensionSource: "manual",
  rotationDeg: 0,
  clearanceMm: 5,
});

test("panel commands preserve native device identity, input immutability and reload", () => {
  const original = fixture();
  const before = JSON.stringify(original);
  let p = savePanelPlacement(original, placement(original.enclosures[0].id));
  assert.equal(JSON.stringify(original), before);
  const item = p.equipment3d[0];
  p = savePanelPlacement(
    p,
    { ...item, positionMm: { x: 100, y: 150, z: 20 }, rotationDeg: 90 },
    item.id,
  );
  const loaded = parseProject(serializeProject(p)).project;
  assert.deepEqual(loaded.equipment3d, p.equipment3d);
  assert.equal(
    loaded.devices.find((d) => d.id === item.deviceId).reference,
    "Xa",
  );
  assert.throws(
    () => savePanelPlacement(p, placement(p.enclosures[0].id)),
    /already/,
  );
  assert.throws(() => removeEnclosure(p, p.enclosures[0].id), /Remove/);
  p = removePanelPlacement(p, item.id);
  assert.equal(p.devices.length, original.devices.length);
  assert.equal(removeEnclosure(p, p.enclosures[0].id).enclosures.length, 0);
});

test("structures retain support references; removal requires explicit unassignment", () => {
  let p = fixture();
  p = savePanelStructure(p, {
    name: "DIN rail",
    enclosureId: p.enclosures[0].id,
    kind: "din-rail",
    positionMm: { x: 20, y: 100, z: 2.5 },
    sizeMm: { x: 400, y: 35, z: 7.5 },
  });
  p = savePanelPlacement(p, {
    ...placement(p.enclosures[0].id),
    mountingStructureId: p.panelStructures[0].id,
  });
  assert.throws(
    () => removePanelStructure(p, p.panelStructures[0].id),
    /Unassign/,
  );
  assert.deepEqual(panelReport(p, p.enclosures[0].id).diagnostics, []);
  const item = p.equipment3d[0];
  p = savePanelPlacement(
    p,
    { ...item, mountingStructureId: undefined },
    item.id,
  );
  assert.equal(
    removePanelStructure(p, p.panelStructures[0].id).panelStructures.length,
    0,
  );
});

test("catalog provenance cannot be forged for an unassigned generic device", () => {
  const p = fixture();
  assert.throws(
    () =>
      savePanelPlacement(p, {
        ...placement(p.enclosures[0].id),
        dimensionSource: "catalog",
      }),
    /source/,
  );
  const made = createPanelDevice(p, {
    ...placement(p.enclosures[0].id),
    reference: "K1",
    name: "User supplied relay",
  });
  assert.equal(made.equipment3d[0].dimensionSource, "manual");
  assert.equal(made.devices.at(-1).reference, "K1");
  assert.equal(made.symbolInstances.length, p.symbolInstances.length);
});

test("panel SVG escapes labels; OBJ exports actual rotated box coordinates", () => {
  let p = fixture();
  p = savePanelPlacement(p, {
    ...placement(p.enclosures[0].id),
    rotationDeg: 90,
  });
  const svg = panelLayoutSvg(p, p.enclosures[0].id, "User <dimensions>");
  assert.ok(svg.includes("Control &lt;cabinet&gt;"));
  assert.ok(svg.includes("User &lt;dimensions&gt;"));
  assert.ok(svg.includes('width="80" height="60"'));
  const obj = panelGeometryObj(p, p.enclosures[0].id);
  assert.equal(
    obj.split("\n").filter((line) => line.startsWith("v ")).length,
    8,
  );
  assert.equal(
    obj.split("\n").filter((line) => line.startsWith("f ")).length,
    6,
  );
  assert.ok(obj.includes("v 130 160 50"));
});

test("heat balance requires every loss and distinguishes unknown from explicit zero", () => {
  const assumptions = {
    ambientC: 30,
    heatTransferCoefficientWm2K: 5,
    exposedAreaM2: 2,
    additionalLossW: 20,
    coolingW: 10,
  };
  assert.deepEqual(heatBalance([40, 0], assumptions), {
    knownLossW: 60,
    unknownLossCount: 0,
    totalLossW: 60,
    riseK: 5,
    estimatedInternalC: 35,
  });
  assert.equal(
    heatBalance([40, undefined], assumptions).estimatedInternalC,
    null,
  );
  assert.equal(heatBalance([40, undefined], assumptions).knownLossW, 60);
  assert.throws(() => heatBalance([0], { ...assumptions, exposedAreaM2: 0 }));
});

test("duct fill uses circular outside areas and a user-entered capacity and threshold", () => {
  const fill = ductOccupancy([10, 10], 1000, 10);
  assert.ok(Math.abs(fill.occupiedMm2 - 50 * Math.PI) < 1e-10);
  assert.ok(Math.abs(fill.fillPercent - 5 * Math.PI) < 1e-10);
  assert.equal(fill.exceedsLimit, true);
  assert.equal(ductOccupancy([10]).fillPercent, null);
  assert.equal(ductOccupancy([], 1000, 10).fillPercent, 0);
  assert.throws(() => ductOccupancy([0], 1000));
});

test("moving a mounting structure carries its devices in one native change", () => {
  let p = fixture();
  const enclosureId = p.enclosures[0].id;
  p = savePanelStructure(p, {
    name: "Rail",
    enclosureId,
    kind: "din-rail",
    positionMm: { x: 20, y: 100, z: 2.5 },
    sizeMm: { x: 400, y: 35, z: 7.5 },
  });
  const rail = p.panelStructures[0];
  p = savePanelPlacement(p, {
    ...placement(enclosureId),
    mountingStructureId: rail.id,
  });
  const moved = savePanelStructure(
    p,
    { ...rail, positionMm: { x: 25.25, y: 120, z: 4.5 } },
    rail.id,
  );
  assert.deepEqual(moved.equipment3d[0].positionMm, {
    x: 55.25,
    y: 120,
    z: 12,
  });
  assert.deepEqual(p.equipment3d[0].positionMm, { x: 50, y: 100, z: 10 });
  assert.deepEqual(panelReport(moved, enclosureId).diagnostics, []);
});

test("assigned catalog dimensions remain exact through rotation and rename", () => {
  let p = fixture();
  p.manufacturerParts.push({
    id: "part",
    name: "Dimension fixture",
    manufacturer: "Test fixture",
    partNumber: "TEST",
    sourceUrl: "https://example.com/dimension-test-fixture",
    ratings: {},
    catalogSnapshot: {
      catalogId: "test-part",
      reviewedOn: "2026-11-01",
      category: "terminal",
      description: "Test-only dimensional fixture",
      mapping: { glyph: "terminal", electricalNodes: 1, connections: 1 },
      dimensionsMm: { width: 5.2, height: 46, depth: 47.5 },
    },
  });
  p.devices[0].partId = "part";
  p = savePanelPlacement(p, {
    ...placement(p.enclosures[0].id),
    dimensionSource: "catalog",
    sizeMm: { x: 5.2, y: 46, z: 47.5 },
    rotationDeg: 90,
  });
  const item = p.equipment3d[0];
  p = savePanelPlacement(p, { ...item, name: "Renamed exact box" }, item.id);
  assert.deepEqual(p.equipment3d[0].sizeMm, { x: 5.2, y: 46, z: 47.5 });
  assert.throws(
    () =>
      savePanelPlacement(
        p,
        { ...item, sizeMm: { x: 46, y: 5.2, z: 47.5 } },
        item.id,
      ),
    /source/,
  );
  assert.throws(
    () =>
      savePanelPlacement(p, { ...item, dimensionSource: "custom" }, item.id),
    /source/,
  );
});

test("finite input overflow is rejected before engineering estimates can be displayed", () => {
  const assumptions = {
    ambientC: 30,
    heatTransferCoefficientWm2K: 1e308,
    exposedAreaM2: 2,
    additionalLossW: 0,
    coolingW: 0,
  };
  assert.throws(() => heatBalance([0], assumptions), /range/);
  assert.throws(() => ductOccupancy([1e308], 1), /range/);
});
