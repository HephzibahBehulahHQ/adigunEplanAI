import { test } from "node:test";
import assert from "node:assert/strict";
import { nativeProject } from "../fixtures/native-project.mjs";
import {
  addBuilding,
  addFloor,
  addRectangularRoom,
} from "../../packages/building-design/structure.ts";
import {
  addPlanLayer,
  setPlanLayer,
} from "../../packages/building-design/walls.ts";
import {
  createFloorDevice,
  floorDeviceKinds,
} from "../../packages/building-design/floor-devices.ts";
import {
  parseProject,
  serializeProject,
} from "../../packages/electrical-model/project.ts";
import { ProjectHistory } from "../../packages/electrical-model/history.ts";

function fixture() {
  let p = addBuilding(nativeProject(), "Workshop", "");
  p = addFloor(p, p.buildings[0].id, "Ground", 0, 3000);
  p = addRectangularRoom(p, p.floors[0].id, "Office", 0, 0, 6000, 4000);
  return addPlanLayer(p, p.floors[0].id, "Electrical", "electrical");
}
function input(p, kind = "luminaire-l-n-pe") {
  return {
    kind,
    pageId: "page",
    reference: "LIGHT1",
    description: "Office light",
    floorId: p.floors[0].id,
    layerId: p.architecturalLayers[0].id,
    roomId: p.rooms[0].id,
    position: { x: 1012, y: 986 },
    rotation: 0,
    symbolScale: 20,
    mountingHeightMm: 2600,
  };
}

test("floor-first creation supplies native device, typed pins and placement without changing existing wires", () => {
  for (const kind of floorDeviceKinds) {
    const p = fixture(),
      before = serializeProject(p);
    const q = createFloorDevice(p, input(p, kind), 50);
    assert.equal(serializeProject(p), before);
    assert.equal(q.devices.length, p.devices.length + 1);
    assert.deepEqual(q.wires, p.wires);
    assert.deepEqual(q.wirePaths, p.wirePaths);
    assert.deepEqual(q.planEquipment[0].position, { x: 1000, y: 1000 });
    const symbol = q.symbolInstances.find(
      (s) => s.id === q.planEquipment[0].symbolInstanceId,
    );
    const device = q.devices.find((d) => d.id === symbol.deviceId);
    assert.equal(device.reference, "LIGHT1");
    assert.equal(device.name, "Office light");
    assert.equal(device.partId, undefined);
    assert.equal(q.manufacturerParts.length, p.manufacturerParts.length);
    const terminals = q.terminals.filter((t) => t.deviceId === device.id);
    assert.ok(terminals.length >= 2);
    if (kind !== "wall-switch-single-pole") {
      assert.ok(terminals.some((t) => t.kind === "neutral"));
      assert.ok(terminals.some((t) => t.kind === "pe"));
    }
    assert.deepEqual(parseProject(serializeProject(q)).project, q);
  }
});

test("floor-first creation respects both floor and schematic layer protection atomically", () => {
  const p = fixture(),
    entry = input(p),
    before = serializeProject(p);
  for (const state of [{ visible: false }, { locked: true }]) {
    const protectedPlan = setPlanLayer(p, entry.layerId, state);
    assert.throws(
      () => createFloorDevice(protectedPlan, entry, 50),
      /editable/,
    );
    const protectedSheet = structuredClone(p);
    Object.assign(protectedSheet.layers[0], state);
    assert.throws(
      () => createFloorDevice(protectedSheet, entry, 50),
      /protected/,
    );
  }
  for (const change of [
    { reference: "Xa" },
    { reference: " " },
    { description: " " },
    { position: { x: -1000, y: 0 } },
    { pageId: "missing" },
    { kind: "unavailable" },
    { layerId: "missing" },
  ])
    assert.throws(() => createFloorDevice(p, { ...entry, ...change }, 50));
  assert.throws(() => createFloorDevice(p, entry, -1));
  assert.equal(serializeProject(p), before);
});

test("floor equipment is one undoable transaction and generic board definitions are reused", () => {
  const p = fixture(),
    history = new ProjectHistory(p);
  const q = history.execute((draft) =>
    createFloorDevice(draft, input(draft, "distribution-board-l-n-pe"), 50),
  );
  assert.equal(history.undo().devices.length, p.devices.length);
  assert.equal(history.redo().planEquipment.length, 1);
  const r = createFloorDevice(
    q,
    {
      ...input(q, "distribution-board-l-n-pe"),
      reference: "DB2",
      position: { x: 3000, y: 1000 },
    },
    50,
  );
  assert.equal(
    r.symbolDefinitions.filter(
      (d) => d.id === "building-distribution-board-l-n-pe",
    ).length,
    1,
  );
  assert.equal(r.planEquipment.length, 2);
});

test("an empty schematic page obtains its first layer without bypassing existing protected layers", () => {
  const p = fixture();
  p.pages.push({ ...p.pages[0], id: "empty-page", order: 1 });
  const q = createFloorDevice(p, { ...input(p), pageId: "empty-page" }, 50);
  assert.equal(q.layers.filter((l) => l.pageId === "empty-page").length, 1);
  assert.equal(p.layers.filter((l) => l.pageId === "empty-page").length, 0);
});
