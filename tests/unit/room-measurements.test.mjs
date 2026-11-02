import { test } from "node:test";
import assert from "node:assert/strict";
import { measureRoom } from "../../packages/building-design/rooms.ts";
const points = (values) => values.map(([x, y]) => ({ x, y }));
test("room measurements use native millimetres for rectangle, concave and diagonal boundaries", () => {
  const rectangle = measureRoom(
    points([
      [0, 0],
      [4000, 0],
      [4000, 3000],
      [0, 3000],
    ]),
  );
  assert.equal(rectangle.areaMm2, 12000000);
  assert.equal(rectangle.perimeterMm, 14000);
  assert.deepEqual(
    rectangle.edges.map((e) => e.lengthMm),
    [4000, 3000, 4000, 3000],
  );
  const concave = measureRoom(
    points([
      [0, 0],
      [4000, 0],
      [4000, 2000],
      [2000, 2000],
      [2000, 4000],
      [0, 4000],
    ]),
  );
  assert.equal(concave.areaMm2, 12000000);
  assert.equal(concave.perimeterMm, 16000);
  const triangle = measureRoom(
    points([
      [0, 0],
      [3000, 0],
      [0, 4000],
    ]),
  );
  assert.equal(triangle.areaMm2, 6000000);
  assert.equal(triangle.perimeterMm, 12000);
});
test("room measurements are translation/orientation invariant and reject invalid geometry", () => {
  const boundary = points([
    [0, 0],
    [3000, 0],
    [0, 4000],
  ]);
  const moved = boundary
    .map((p) => ({ x: p.x + 900000, y: p.y - 900000 }))
    .reverse();
  assert.equal(measureRoom(moved).areaMm2, 6000000);
  assert.equal(measureRoom(moved).perimeterMm, 12000);
  assert.throws(() =>
    measureRoom(
      points([
        [0, 0],
        [4, 4],
        [0, 4],
        [4, 0],
      ]),
    ),
  );
  assert.throws(() =>
    measureRoom(
      points([
        [0, 0],
        [1, 0],
        [2, 0],
      ]),
    ),
  );
});
