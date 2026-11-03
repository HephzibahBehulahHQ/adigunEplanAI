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
  savePlanZone,
  removePlanZone,
} from "../../packages/building-design/zones.ts";
import {
  parseProject,
  serializeProject,
  validateProject,
} from "../../packages/electrical-model/project.ts";
function fixture() {
  let p = addBuilding(nativeProject(), "Building", "");
  p = addFloor(p, p.buildings[0].id, "Ground", 0, 3000);
  p = addFloor(p, p.buildings[0].id, "Upper", 3000, 3000);
  p = addRectangularRoom(p, p.floors[0].id, "Office", 0, 0, 4000, 3000);
  p = addRectangularRoom(p, p.floors[0].id, "Hall", 4000, 0, 2000, 3000);
  p = addRectangularRoom(p, p.floors[1].id, "Store", 0, 0, 2000, 2000);
  return p;
}
function input(p) {
  return {
    floorId: p.floors[0].id,
    name: "Lighting zone",
    kind: "electrical",
    roomIds: p.rooms.slice(0, 2).map((r) => r.id),
  };
}
test("room zones preserve identity and membership through edit, reload and removal", () => {
  const p = fixture();
  const a = savePlanZone(p, input(p));
  const id = a.planZones[0].id;
  const b = savePlanZone(
    a,
    { ...input(p), name: "Office lighting", roomIds: [p.rooms[0].id] },
    id,
  );
  assert.equal(p.planZones.length, 0);
  assert.equal(a.planZones[0].roomIds.length, 2);
  assert.equal(b.planZones[0].id, id);
  assert.deepEqual(parseProject(serializeProject(b)).project, b);
  assert.throws(() => removeRoom(b, p.rooms[0].id), /zone/);
  const removed = removePlanZone(b, id);
  assert.equal(removeRoom(removed, p.rooms[0].id).rooms.length, 2);
  assert.throws(() => removePlanZone(b, "missing"), /Unknown/);
});
test("zones reject empty, duplicate, missing and cross-floor membership atomically", () => {
  const p = fixture();
  const before = serializeProject(p);
  for (const roomIds of [
    [],
    [p.rooms[0].id, p.rooms[0].id],
    ["missing"],
    [p.rooms[2].id],
  ])
    assert.throws(() => savePlanZone(p, { ...input(p), roomIds }));
  const a = savePlanZone(p, input(p));
  assert.throws(
    () =>
      savePlanZone(
        a,
        { ...input(p), floorId: p.floors[1].id, roomIds: [p.rooms[2].id] },
        a.planZones[0].id,
      ),
    /another floor/,
  );
  const invalid = structuredClone(a);
  invalid.planZones[0].roomIds = [p.rooms[2].id];
  assert.throws(() => validateProject(invalid), /floor/);
  assert.equal(serializeProject(p), before);
});
test("only distribution zones accept existing appropriately located boards", () => {
  const p = fixture();
  p.distributionBoards.push({
    id: "board",
    name: "DB1",
    deviceId: p.devices[0].id,
    roomId: p.rooms[0].id,
  });
  const entry = { ...input(p), kind: "distribution", boardId: "board" };
  const a = savePlanZone(p, entry);
  assert.equal(a.planZones[0].boardId, "board");
  assert.throws(
    () => savePlanZone(p, { ...entry, kind: "electrical" }),
    /distribution/,
  );
  assert.throws(() => savePlanZone(p, { ...entry, boardId: "missing" }));
  p.distributionBoards[0].roomId = p.rooms[2].id;
  assert.throws(() => savePlanZone(p, entry), /same floor/);
  delete p.distributionBoards[0].roomId;
  assert.equal(savePlanZone(p, entry).planZones.length, 1);
});
test("schema 12 migration preserves existing rooms and adds no invented zones", () => {
  const p = fixture();
  const legacy = { ...p, schemaVersion: 12 };
  delete legacy.planZones;
  const r = parseProject(JSON.stringify(legacy));
  assert.equal(r.migratedFrom, 12);
  assert.equal(r.project.schemaVersion, 13);
  assert.deepEqual(r.project.planZones, []);
  assert.deepEqual(r.project.rooms, p.rooms);
  assert.throws(() => validateProject({ ...p, planZones: undefined }));
});
