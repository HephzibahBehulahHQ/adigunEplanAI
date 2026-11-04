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
  serializeProject,
  parseProject,
} from "../../packages/electrical-model/project.ts";
const structure = () => {
  let p = addBuilding(nativeProject(), "Workshop", "Site A");
  p = addFloor(p, p.buildings[0].id, "Ground", -500, 3000);
  return p;
};
test("building/floor/room commands preserve coordinates, hierarchy and unrelated electrical data", () => {
  const p = structure();
  const original = structuredClone(p);
  const next = addRectangularRoom(
    p,
    p.floors[0].id,
    "Office",
    -1000,
    2000,
    4000,
    3000,
  );
  assert.deepEqual(p, original);
  assert.deepEqual(next.rooms[0].boundary, [
    { x: -1000, y: 2000 },
    { x: 3000, y: 2000 },
    { x: 3000, y: 5000 },
    { x: -1000, y: 5000 },
  ]);
  assert.deepEqual(next.devices, original.devices);
  assert.deepEqual(parseProject(serializeProject(next)).project, next);
  assert.equal(removeRoom(next, next.rooms[0].id).rooms.length, 0);
  assert.equal(next.rooms.length, 1);
});
test("invalid dimensions and orphan structures are rejected atomically", () => {
  const p = structure();
  const before = structuredClone(p);
  for (const width of [0, -1, Infinity, NaN, 1000001])
    assert.throws(() =>
      addRectangularRoom(p, p.floors[0].id, "Invalid", 0, 0, width, 1000),
    );
  assert.throws(() =>
    addRectangularRoom(p, "missing", "Room", 0, 0, 1000, 1000),
  );
  assert.throws(() => addFloor(p, "missing", "Floor", 0, 3000));
  assert.throws(() => addFloor(p, p.buildings[0].id, "Floor", 0, 0));
  assert.throws(() => addBuilding(p, "  ", ""));
  assert.deepEqual(p, before);
});
test("room removal preserves rooms referenced by distribution boards", () => {
  const p = structure();
  const next = addRectangularRoom(
    p,
    p.floors[0].id,
    "Board room",
    0,
    0,
    3000,
    3000,
  );
  next.devices.push({ id: "device", name: "Board device", reference: "DB1" });
  next.distributionBoards.push({
    id: "board",
    name: "DB",
    deviceId: "device",
    roomId: next.rooms[0].id,
  });
  assert.throws(() => removeRoom(next, next.rooms[0].id), /assigned board/);
  assert.equal(next.rooms.length, 1);
});
