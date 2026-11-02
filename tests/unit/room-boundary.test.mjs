import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateRoomBoundary,
  parseRoomBoundary,
  updateRoom,
} from "../../packages/building-design/rooms.ts";
import {
  addBuilding,
  addFloor,
  addRectangularRoom,
} from "../../packages/building-design/structure.ts";
import { nativeProject } from "../fixtures/native-project.mjs";
const pts = (values) => values.map(([x, y]) => ({ x, y }));
const lShape = pts([
  [0, 0],
  [4000, 0],
  [4000, 2000],
  [2000, 2000],
  [2000, 4000],
  [0, 4000],
]);
test("concave and reversed room boundaries preserve vertex order and normalize a closing duplicate", () => {
  assert.deepEqual(validateRoomBoundary(lShape), lShape);
  assert.deepEqual(validateRoomBoundary([...lShape, lShape[0]]), lShape);
  assert.deepEqual(
    validateRoomBoundary([...lShape].reverse()),
    [...lShape].reverse(),
  );
  assert.deepEqual(
    parseRoomBoundary("-1.5, 0\n2e3,0\n2000,3000\n-1.5,3000"),
    pts([
      [-1.5, 0],
      [2000, 0],
      [2000, 3000],
      [-1.5, 3000],
    ]),
  );
});
test("self-crossing, touching, repeated, overlapping and zero-area boundaries fail", () => {
  for (const boundary of [
    [
      [0, 0],
      [4, 4],
      [0, 4],
      [4, 0],
    ],
    [
      [0, 0],
      [4, 0],
      [4, 4],
      [2, 0],
      [0, 4],
    ],
    [
      [0, 0],
      [4, 0],
      [2, 0],
      [2, 4],
      [0, 4],
    ],
    [
      [0, 0],
      [4, 0],
      [4, 4],
      [0, 0],
      [0, 4],
    ],
    [
      [0, 0],
      [1, 0],
      [2, 0],
    ],
  ])
    assert.throws(() => validateRoomBoundary(pts(boundary)));
  for (const text of [
    "0,0\n,2\n3,4",
    "0,0\n0x10,2\n3,4",
    "0,0\nInfinity,2\n3,4",
    "0,0\n1,2,3\n3,4",
    "0,0\n1000001,0\n0,3",
  ])
    assert.throws(() => parseRoomBoundary(text));
  assert.throws(() =>
    validateRoomBoundary(
      Array.from({ length: 258 }, (_, i) => ({ x: i, y: i * i })),
    ),
  );
});
test("room edits retain identity, floor and board references and never mutate prior work", () => {
  let p = addBuilding(nativeProject(), "Building", "");
  p = addFloor(p, p.buildings[0].id, "Ground", 0, 3000);
  p = addRectangularRoom(p, p.floors[0].id, "Old", 0, 0, 4000, 4000);
  p.devices.push({ id: "db-device", name: "DB", reference: "DB1" });
  p.distributionBoards.push({
    id: "board",
    name: "DB1",
    deviceId: "db-device",
    roomId: p.rooms[0].id,
  });
  const before = structuredClone(p);
  const next = updateRoom(p, p.rooms[0].id, "L room", lShape);
  assert.equal(next.rooms[0].id, p.rooms[0].id);
  assert.equal(next.rooms[0].floorId, p.rooms[0].floorId);
  assert.deepEqual(next.distributionBoards, p.distributionBoards);
  assert.deepEqual(next.rooms[0].boundary, lShape);
  assert.deepEqual(p, before);
  assert.throws(() =>
    updateRoom(
      p,
      p.rooms[0].id,
      "Bad",
      pts([
        [0, 0],
        [1, 1],
        [0, 1],
        [1, 0],
      ]),
    ),
  );
  assert.deepEqual(p, before);
});
