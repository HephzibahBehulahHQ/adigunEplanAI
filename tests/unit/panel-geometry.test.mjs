import { test } from "node:test";
import assert from "node:assert/strict";
import {
  volumeBounds,
  volumesIntersect,
  volumeGapMm,
  outsideEnvelope,
  panelDiagnostics,
  projectedUtilization,
  projectPoint3d,
  projectedFaces,
  accessBounds,
} from "../../packages/panel-engineering/geometry.ts";

const enclosure = { widthMm: 600, heightMm: 800, depthMm: 200 };
const box = (id, positionMm, sizeMm = { x: 100, y: 50, z: 40 }) => ({
  id,
  name: id,
  positionMm,
  sizeMm,
});

test("quarter turns keep the minimum corner and swap a nonsquare footprint", () => {
  const item = { ...box("a", { x: 550, y: 700, z: 160 }), rotationDeg: 90 };
  assert.deepEqual(volumeBounds(item).max, { x: 600, y: 800, z: 200 });
  assert.equal(outsideEnvelope(volumeBounds(item), enclosure), false);
  assert.equal(
    outsideEnvelope(volumeBounds({ ...item, rotationDeg: 0 }), enclosure),
    true,
  );
  for (const rotationDeg of [45, NaN, Infinity])
    assert.throws(() => volumeBounds({ ...item, rotationDeg }));
  assert.throws(() => volumeBounds(box("a", { x: Infinity, y: 0, z: 0 })));
  assert.throws(() =>
    volumeBounds(box("a", { x: 0, y: 0, z: 0 }, { x: 0, y: 5, z: 5 })),
  );
});

test("face, edge and corner contact are allowed; positive volume overlap collides", () => {
  const a = volumeBounds(box("a", { x: 0, y: 0, z: 0 }));
  for (const position of [
    { x: 100, y: 0, z: 0 },
    { x: 100, y: 50, z: 0 },
    { x: 100, y: 50, z: 40 },
  ])
    assert.equal(volumesIntersect(a, volumeBounds(box("b", position))), false);
  assert.equal(
    volumesIntersect(a, volumeBounds(box("b", { x: 99.999, y: 0, z: 0 }))),
    true,
  );
  assert.equal(
    volumeGapMm(a, volumeBounds(box("b", { x: 103, y: 54, z: 40 }))),
    5,
  );
});

test("diagnostics separate collision, user clearance and boundary violations", () => {
  const a = { ...box("a", { x: 0, y: 0, z: 0 }), clearanceMm: 6 };
  const b = box("b", { x: 103, y: 54, z: 40 });
  const diagnostics = panelDiagnostics(enclosure, [a, b]);
  assert.deepEqual(diagnostics, [
    {
      code: "clearance",
      severity: "warning",
      objectIds: ["a", "b"],
      actualMm: 5,
      requiredMm: 6,
    },
  ]);
  b.positionMm = { x: 50, y: 0, z: 0 };
  assert.equal(panelDiagnostics(enclosure, [a, b])[0].code, "collision");
  b.positionMm = { x: 0, y: -0.01, z: 0 };
  assert.ok(
    panelDiagnostics(enclosure, [b]).some((d) => d.code === "out-of-bounds"),
  );
});

test("explicit mounting support permits contact and checks rail span and depth", () => {
  const rail = {
    ...box("rail", { x: 20, y: 100, z: 2 }, { x: 400, y: 35, z: 7.5 }),
    kind: "din-rail",
  };
  const item = {
    ...box("a", { x: 40, y: 90, z: 9.5 }),
    mountingStructureId: "rail",
    clearanceMm: 10,
  };
  assert.deepEqual(panelDiagnostics(enclosure, [item], [rail]), []);
  item.positionMm.z = 9;
  assert.ok(
    panelDiagnostics(enclosure, [item], [rail]).some(
      (d) => d.code === "collision",
    ),
  );
  item.positionMm.z = 10;
  assert.ok(
    panelDiagnostics(enclosure, [item], [rail]).some(
      (d) => d.code === "mounting-position",
    ),
  );
  item.positionMm = { x: 410, y: 90, z: 9.5 };
  assert.ok(
    panelDiagnostics(enclosure, [item], [rail]).some(
      (d) => d.code === "mounting-position",
    ),
  );
  assert.equal(
    panelDiagnostics(enclosure, [item], [{ ...rail, kind: "duct" }])[0].code,
    "mounting-support",
  );
});

test("flush-mounted equipment attaches to the inside face of a cabinet door", () => {
  const door = {
    ...box("door", { x: 0, y: 0, z: 198 }, { x: 600, y: 800, z: 2 }),
    kind: "door",
  };
  const relay = {
    ...box("relay", { x: 225, y: 100, z: 35 }, { x: 150, y: 266, z: 163 }),
    mountingStructureId: "door",
    clearanceMm: 5,
  };
  assert.deepEqual(panelDiagnostics(enclosure, [relay], [door]), []);
  relay.positionMm = { x: 451, y: 100, z: 35 };
  assert.ok(
    panelDiagnostics(enclosure, [relay], [door]).some(
      (diagnostic) => diagnostic.code === "mounting-position",
    ),
  );
});

test("projected utilization clips outside boxes and counts overlap only once", () => {
  const small = { widthMm: 100, heightMm: 100, depthMm: 100 };
  const items = [
    box("a", { x: -10, y: 0, z: 0 }, { x: 60, y: 50, z: 10 }),
    box("b", { x: 25, y: 0, z: 20 }, { x: 50, y: 50, z: 10 }),
  ];
  assert.deepEqual(projectedUtilization(small, items), {
    occupiedMm2: 3750,
    availableMm2: 10000,
    ratio: 0.375,
  });
  assert.equal(projectedUtilization(small, []).ratio, 0);
});

test("decimal contact does not become a false collision or boundary violation", () => {
  const plate = {
    ...box("plate", { x: 0, y: 0, z: 0.1 }, { x: 100, y: 100, z: 0.2 }),
    kind: "plate",
  };
  const item = {
    ...box("device", { x: 10, y: 10, z: 0.3 }, { x: 50, y: 50, z: 20 }),
    mountingStructureId: "plate",
  };
  assert.deepEqual(panelDiagnostics(enclosure, [item], [plate]), []);
  assert.equal(
    outsideEnvelope(
      volumeBounds(
        box("edge", { x: 0.1, y: 0, z: 0 }, { x: 0.2, y: 0.2, z: 0.2 }),
      ),
      { widthMm: 0.3, heightMm: 0.2, depthMm: 0.2 },
    ),
    false,
  );
  const a = volumeBounds(box("a", { x: 1e6 - 100, y: 0, z: 0 }));
  const b = volumeBounds(box("b", { x: 1e6 - 0.000001, y: 0, z: 0 }));
  assert.equal(volumesIntersect(a, b), true);
});

test("orthographic projection preserves 3D distance and only emits camera-facing faces", () => {
  const point = { x: 3, y: 4, z: 12 };
  const projected = projectPoint3d(point, 37, -26);
  assert.ok(
    Math.abs(Math.hypot(projected.x, projected.y, projected.z) - 13) < 1e-10,
  );
  const item = box("a", { x: 0, y: 0, z: 0 });
  const front = projectedFaces(item, 0, 0);
  assert.equal(front.length, 1);
  assert.equal(front[0].side, 5);
  assert.equal(projectedFaces(item, -30, 20).length, 3);
  assert.throws(
    () =>
      volumeBounds(
        box("huge", { x: 1e308, y: 0, z: 0 }, { x: 1e308, y: 1, z: 1 }),
      ),
    /range/,
  );
  assert.throws(() => projectPoint3d({ x: Infinity, y: 0, z: 0 }, 0, 0));
});

test("service access prisms use all six directions and detect positive obstruction only", () => {
  const item = {
    ...box("a", { x: 50, y: 60, z: 70 }, { x: 10, y: 20, z: 30 }),
    accessClearanceMm: 10,
  };
  const expected = {
    front: ["z", 100, 110],
    back: ["z", 60, 70],
    left: ["x", 40, 50],
    right: ["x", 60, 70],
    top: ["y", 50, 60],
    bottom: ["y", 80, 90],
  };
  for (const [accessDirection, [axis, min, max]] of Object.entries(expected)) {
    const access = accessBounds({ ...item, accessDirection });
    assert.equal(access.min[axis], min);
    assert.equal(access.max[axis], max);
  }
  const front = { ...item, accessDirection: "front" };
  const obstacle = box("b", { x: 50, y: 60, z: 105 });
  const region = {
    ...box("region", { x: 0, y: 0, z: 0 }, { x: 600, y: 800, z: 200 }),
    kind: "compartment",
  };
  assert.deepEqual(panelDiagnostics(enclosure, [front, obstacle], [region]), [
    {
      code: "access-obstructed",
      severity: "warning",
      objectIds: ["a", "b"],
      requiredMm: 10,
    },
  ]);
  obstacle.positionMm.z = 110;
  assert.deepEqual(
    panelDiagnostics(enclosure, [front, obstacle], [region]),
    [],
  );
  assert.throws(() => accessBounds({ ...item, accessDirection: undefined }));
});

test("mounting profile comparison uses explicit labels without inferring manufacturer fit", () => {
  const rail = {
    ...box("rail", { x: 0, y: 0, z: 0 }, { x: 100, y: 35, z: 7.5 }),
    kind: "din-rail",
    mountingProfile: "TS35",
  };
  const item = {
    ...box("a", { x: 20, y: 0, z: 7.5 }, { x: 10, y: 20, z: 30 }),
    mountingStructureId: "rail",
    requiredMountingProfile: "ts35",
  };
  assert.deepEqual(panelDiagnostics(enclosure, [item], [rail]), []);
  const issues = panelDiagnostics(
    enclosure,
    [item],
    [{ ...rail, mountingProfile: "TS15" }],
  );
  assert.equal(issues[0].code, "mounting-profile");
  assert.equal(issues[0].requiredProfile, "ts35");
  assert.equal(issues[0].actualProfile, "TS15");
  assert.equal(
    panelDiagnostics(
      enclosure,
      [{ ...item, mountingStructureId: undefined }],
      [rail],
    )[0].code,
    "mounting-profile",
  );
});

