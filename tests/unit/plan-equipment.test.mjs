import { test } from "node:test";
import assert from "node:assert/strict";
import { nativeProject } from "../fixtures/native-project.mjs";
import {
  addBuilding,
  addFloor,
  addRectangularRoom,
  removeRoom,
} from "../../packages/building-design/structure.ts";
import {
  addPlanLayer,
  setPlanLayer,
} from "../../packages/building-design/walls.ts";
import {
  savePlanEquipment,
  removePlanEquipment,
  equipmentCorners,
  roomEquipmentSchedule,
} from "../../packages/building-design/equipment.ts";
import { pointInPolygon } from "../../packages/engineering-core/polygon.ts";
import { updateRoom } from "../../packages/building-design/rooms.ts";
import {
  parseProject,
  serializeProject,
  validateProject,
} from "../../packages/electrical-model/project.ts";
import { remove } from "../../packages/schematic-editor/commands.ts";
function fixture() {
  let p = addBuilding(nativeProject(), "B", "");
  p = addFloor(p, p.buildings[0].id, "Ground", 0, 3000);
  p = addRectangularRoom(p, p.floors[0].id, "Office", 0, 0, 4000, 3000);
  return addPlanLayer(p, p.floors[0].id, "Electrical", "electrical");
}
function input(p) {
  return {
    floorId: p.floors[0].id,
    layerId: p.architecturalLayers[0].id,
    roomId: p.rooms[0].id,
    symbolInstanceId: "symbol-a",
    name: "Xa",
    position: { x: 1012, y: 493 },
    rotation: 0,
    symbolScale: 20,
    mountingHeightMm: 1200,
  };
}
test("room anchors include boundaries and handle concavity, reversed winding and negative coordinates", () => {
  const polygon = [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 2 },
    { x: 2, y: 2 },
    { x: 2, y: 4 },
    { x: 0, y: 4 },
  ];
  for (const points of [polygon, [...polygon].reverse()]) {
    for (const p of [
      { x: 1, y: 3 },
      { x: 0, y: 0 },
      { x: 4, y: 1 },
      { x: 2, y: 2 },
    ])
      assert.equal(pointInPolygon(p, points), true);
    for (const p of [
      { x: 3, y: 3 },
      { x: -1, y: 2 },
      { x: 4.1, y: 0 },
      { x: NaN, y: 1 },
    ])
      assert.equal(pointInPolygon(p, points), false);
  }
  assert.equal(
    pointInPolygon(
      { x: -9, y: -9 },
      polygon.map((p) => ({ x: p.x - 10, y: p.y - 10 })),
    ),
    true,
  );
});
test("floor equipment preserves native device wiring, snaps position and round trips", () => {
  const p = fixture();
  const a = savePlanEquipment(p, input(p), 50);
  assert.deepEqual(a.planEquipment[0].position, { x: 1000, y: 500 });
  for (const key of [
    "devices",
    "terminals",
    "pins",
    "wires",
    "symbolInstances",
  ])
    assert.deepEqual(a[key], p[key]);
  const b = savePlanEquipment(
    a,
    { ...input(p), position: { x: 1500, y: 800 }, rotation: 90 },
    50,
    a.planEquipment[0].id,
  );
  assert.equal(b.planEquipment[0].id, a.planEquipment[0].id);
  assert.deepEqual(parseProject(serializeProject(b)).project, b);
  assert.equal(
    removePlanEquipment(b, b.planEquipment[0].id).planEquipment.length,
    0,
  );
  assert.equal(p.planEquipment.length, 0);
});
test("placement rejects architectural, hidden and locked layers, duplicate devices and out-of-room anchors", () => {
  const p = fixture();
  const entry = input(p);
  const a = savePlanEquipment(p, entry, 50);
  assert.throws(() => savePlanEquipment(a, entry, 50), /one floor placement/);
  for (const change of [{ visible: false }, { locked: true }]) {
    const q = setPlanLayer(a, entry.layerId, change);
    assert.throws(() => savePlanEquipment(q, entry, 50, q.planEquipment[0].id));
    assert.throws(() => removePlanEquipment(q, q.planEquipment[0].id));
    assert.equal(roomEquipmentSchedule(q, q.floors[0].id).length, 1);
  }
  for (const bad of [
    { position: { x: 5000, y: 500 } },
    { symbolInstanceId: "missing" },
    { symbolScale: 0 },
    { mountingHeightMm: -1 },
    { rotation: 45 },
  ])
    assert.throws(() => savePlanEquipment(p, { ...entry, ...bad }, 50));
  const architecture = addPlanLayer(
    p,
    p.floors[0].id,
    "Walls",
    "architectural",
  );
  assert.throws(() =>
    savePlanEquipment(
      architecture,
      { ...entry, layerId: architecture.architecturalLayers[1].id },
      50,
    ),
  );
  assert.throws(() => savePlanEquipment(p, entry, 0));
});
test("room and schematic deletion are protected before mutation; shrinking rooms cannot orphan anchors", () => {
  const p = fixture();
  const a = savePlanEquipment(p, input(p), 50);
  const before = serializeProject(a);
  assert.throws(() => removeRoom(a, a.rooms[0].id), /equipment/);
  assert.throws(() => remove(a, ["symbol-a"]), /floor placement/);
  assert.equal(serializeProject(a), before);
  assert.throws(
    () =>
      updateRoom(a, a.rooms[0].id, "Small", [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 0, y: 100 },
      ]),
    /anchor/,
  );
  const invalid = structuredClone(a);
  invalid.planEquipment[0].position = { x: -100, y: 0 };
  assert.throws(() => validateProject(invalid), /anchor/);
});
test("equipment schedule uses canonical reference, explicit height and honest missing part data", () => {
  const p = fixture();
  const a = savePlanEquipment(p, input(p), 50);
  a.devices[0].reference = "L1";
  assert.deepEqual(roomEquipmentSchedule(a, a.floors[0].id), [
    {
      id: a.planEquipment[0].id,
      reference: "L1",
      name: a.devices[0].name,
      room: "Office",
      mountingHeightMm: 1200,
      partNumber: null,
    },
  ]);
  const e = { ...input(p) };
  delete e.roomId;
  delete e.mountingHeightMm;
  const b = savePlanEquipment(p, e, 50);
  assert.equal(
    roomEquipmentSchedule(b, b.floors[0].id)[0].mountingHeightMm,
    null,
  );
});
test("equipment bounds use actual symbol dimensions and orthogonal rotation; schema 14 migration invents no placements", () => {
  const p = fixture();
  p.symbolDefinitions[0].widthMm = 20;
  const a = savePlanEquipment(p, { ...input(p), rotation: 90 }, 50);
  assert.deepEqual(equipmentCorners(a, a.planEquipment[0])[0], {
    x: 1080,
    y: 300,
  });
  const legacy = { ...p, schemaVersion: 14 };
  delete legacy.planEquipment;
  const r = parseProject(JSON.stringify(legacy));
  assert.equal(r.migratedFrom, 14);
  assert.deepEqual(r.project.planEquipment, []);
  assert.deepEqual(r.project.rooms, p.rooms);
});
