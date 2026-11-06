import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { orderProjectedFaces } from "../../packages/panel-engineering/visibility.ts";
import {
  projectedFaces,
  projectPoint3d,
} from "../../packages/panel-engineering/geometry.ts";

const volume = (id, x, y, z, width, height, depth, rotationDeg = 0) => ({
  id,
  name: id,
  positionMm: { x, y, z },
  sizeMm: { x: width, y: height, z: depth },
  rotationDeg,
});
// Exact instrument/marshalling layouts, independent of unpublished example builders.
const instrument = [
  volume("plate", 10, 10, 0, 240, 380, 2),
  volume("rail", 180, 80, 2, 200, 35, 8, 90),
  volume("G1", 40, 80, 2, 60, 100, 50),
  volume("A1", 175, 110, 10, 100, 45, 50, 90),
];
const marshalling = [
  volume("plate", 10, 10, 0, 530, 430, 2),
  volume("rail", 30, 90, 2, 460, 35, 8),
  volume("X1", 50, 85, 10, 160, 60, 35),
  volume("A1", 280, 70, 10, 130, 100, 60),
  volume("duct", 30, 220, 2, 460, 40, 40),
];

/** Independent ray/triangle depth interpolation, without BSP planes or classification. */
function rayDepth(face, point) {
  const a = face.points[0];
  for (let index = 1; index + 1 < face.points.length; index++) {
    const b = face.points[index],
      c = face.points[index + 1];
    const denominator = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
    if (Math.abs(denominator) < 1e-12) continue;
    const u =
      ((b.y - c.y) * (point.x - c.x) + (c.x - b.x) * (point.y - c.y)) /
      denominator;
    const v =
      ((c.y - a.y) * (point.x - c.x) + (a.x - c.x) * (point.y - c.y)) /
      denominator;
    const w = 1 - u - v;
    if (Math.min(u, v, w) >= -1e-9) return u * a.z + v * b.z + w * c.z;
  }
  return null;
}
function lastAt(faces, point) {
  return faces.findLast((face) => rayDepth(face, point) !== null);
}
function area(face) {
  const origin = face.points[0];
  return (
    Math.abs(
      face.points.reduce((sum, a, index) => {
        const b = face.points[(index + 1) % face.points.length];
        return (
          sum +
          (a.x - origin.x) * (b.y - origin.y) -
          (a.y - origin.y) * (b.x - origin.x)
        );
      }, 0),
    ) / 2
  );
}
function verifyRays(source, ordered) {
  const points = source.flatMap((face) => face.points);
  const minX = Math.min(...points.map((p) => p.x)),
    maxX = Math.max(...points.map((p) => p.x));
  const minY = Math.min(...points.map((p) => p.y)),
    maxY = Math.max(...points.map((p) => p.y));
  let checked = 0;
  for (let row = 0; row < 21; row++)
    for (let column = 0; column < 21; column++) {
      const point = {
        x: minX + ((column + 0.37) / 21) * (maxX - minX),
        y: minY + ((row + 0.61) / 21) * (maxY - minY),
      };
      const candidates = source
        .map((face) => ({ face, depth: rayDepth(face, point) }))
        .filter((item) => item.depth !== null);
      const actual = lastAt(ordered, point);
      if (!candidates.length) {
        assert.equal(actual, undefined);
        continue;
      }
      const nearest = Math.max(...candidates.map((item) => item.depth));
      assert(actual, "original visible area was lost");
      assert(
        Math.abs(rayDepth(actual, point) - nearest) < 1e-6,
        `wrong depth at ${JSON.stringify(point)}: ${actual.objectId}`,
      );
      checked++;
    }
  assert(checked > 40, "exercise a useful screen area");
}

test("large mounting plates cannot overpaint foreground instrument and terminal envelopes", () => {
  for (const [objects, id, centre] of [
    [instrument, "G1", { x: 70, y: 130, z: 52 }],
    [marshalling, "X1", { x: 130, y: 115, z: 45 }],
  ]) {
    const faces = objects.flatMap((item) => projectedFaces(item, 25, -18));
    const point = projectPoint3d(centre, 25, -18);
    assert.notEqual(
      lastAt(
        [...faces].sort((a, b) => a.depth - b.depth),
        point,
      ).objectId,
      id,
      "fixture reproduces the old centroid-order failure",
    );
    assert.equal(lastAt(orderProjectedFaces(faces), point).objectId, id);
  }
});

test("BSP drawing agrees with independent ray depths through front, oblique and rear views", () => {
  for (const objects of [instrument, marshalling])
    for (const [yaw, pitch] of [
      [25, -18],
      [-30, 20],
      [0, 0],
      [75, 60],
      [-75, -60],
      [140, 20],
      [-145, 40],
      [180, 0],
      [90, 0],
    ]) {
      const source = objects.flatMap((item) =>
        projectedFaces(item, yaw, pitch),
      );
      verifyRays(source, orderProjectedFaces(source));
    }
});

test("crossing depth planes split faces while preserving projected areas, native IDs and real edges", () => {
  const face = (objectId, sign) => ({
    objectId,
    side: 5,
    depth: 0,
    points: [
      { x: -2, y: -2, z: -2 * sign },
      { x: 2, y: -2, z: 2 * sign },
      { x: 2, y: 2, z: 2 * sign },
      { x: -2, y: 2, z: -2 * sign },
    ],
  });
  const source = [face("native-A", 1), face("native-B", -1)];
  const before = structuredClone(source);
  const ordered = orderProjectedFaces(source);
  assert(
    ordered.length > source.length,
    "actual splitting is required for intersecting depth planes",
  );
  assert.equal(lastAt(ordered, { x: 1, y: 0 }).objectId, "native-A");
  assert.equal(lastAt(ordered, { x: -1, y: 0 }).objectId, "native-B");
  for (const original of source) {
    const fragments = ordered.filter(
      (item) => item.objectId === original.objectId,
    );
    assert(fragments.every((item) => item.side === original.side));
    assert.equal(
      fragments.reduce((sum, item) => sum + area(item), 0),
      16,
    );
  }
  assert(
    ordered
      .flatMap((face) => face.edges)
      .every(([a, b]) => !(a.x === 0 && b.x === 0)),
    "BSP split edges are not fabricated cabinet edges",
  );
  assert.deepEqual(
    source,
    before,
    "projection/native geometry remains immutable",
  );
  verifyRays(source, ordered);
});

test("translated decimal geometry retains visibility and face identity at native coordinate limits", () => {
  const shifted = instrument.map((item) => ({
    ...item,
    positionMm: {
      x: item.positionMm.x + 900000.1,
      y: item.positionMm.y - 900000.2,
      z: item.positionMm.z + 0.3,
    },
  }));
  const source = shifted.flatMap((item) => projectedFaces(item, -37, 28));
  const ordered = orderProjectedFaces(source);
  verifyRays(source, ordered);
  for (const face of source) {
    const fragments = ordered.filter(
      (item) => item.objectId === face.objectId && item.side === face.side,
    );
    assert(
      Math.abs(
        fragments.reduce((sum, item) => sum + area(item), 0) - area(face),
      ) < 1e-5,
    );
  }
});

test("malformed projections are rejected and exactly edge-on faces produce no painted area", () => {
  const base = {
    objectId: "native",
    side: 0,
    depth: 0,
    points: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
    ],
  };
  for (const value of [NaN, Infinity, 1e8])
    assert.throws(
      () =>
        orderProjectedFaces([
          {
            ...base,
            points: [{ x: value, y: 0, z: 0 }, ...base.points.slice(1)],
          },
        ]),
      /finite/,
    );
  assert.throws(
    () => orderProjectedFaces([{ ...base, points: base.points.slice(1) }]),
    /three/,
  );
  assert.throws(
    () =>
      orderProjectedFaces([
        { ...base, points: [...base.points, { x: 1, y: 1, z: 1 }] },
      ]),
    /planar/,
  );
  assert.deepEqual(
    orderProjectedFaces([
      {
        ...base,
        points: [
          { x: 0, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 0, y: 1, z: 1 },
        ],
      },
    ]),
    [],
  );
  assert.deepEqual(orderProjectedFaces([]), []);
});

test("a nearly planar splitter is consumed despite tolerated coordinate roundoff", () => {
  const face = {
    objectId: "near-planar-native",
    side: 5,
    depth: 0,
    points: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 0, y: 1, z: 3e-14 },
    ],
  };
  const moduleUrl = new URL(
    "../../packages/panel-engineering/visibility.ts",
    import.meta.url,
  ).href;
  const ordered = JSON.parse(
    execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `import { orderProjectedFaces } from ${JSON.stringify(moduleUrl)};
process.stdout.write(JSON.stringify(orderProjectedFaces(${JSON.stringify([face])})));`,
      ],
      { encoding: "utf8", timeout: 3000 },
    ),
  );
  assert.equal(ordered.length, 1);
  assert.equal(ordered[0].objectId, face.objectId);
  assert.deepEqual(ordered[0].points, face.points);
  assert.equal(ordered[0].edges.length, 4);
});
