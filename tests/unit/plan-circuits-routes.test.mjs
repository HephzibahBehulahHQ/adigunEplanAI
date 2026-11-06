import { test } from "node:test";
import assert from "node:assert/strict";
import { nativeProject } from "../fixtures/native-project.mjs";
import { place } from "../../packages/schematic-editor/commands.ts";
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
  savePlanEquipment,
  removePlanEquipment,
} from "../../packages/building-design/equipment.ts";
import {
  saveDistributionBoard,
  removeDistributionBoard,
  savePlanCircuit,
  removePlanCircuit,
  circuitSchedule,
} from "../../packages/building-design/circuits.ts";
import {
  savePlanRoute,
  removePlanRoute,
  planRouteLengthM,
} from "../../packages/building-design/routes.ts";
import { savePlanZone } from "../../packages/building-design/zones.ts";
import {
  validateProject,
  serializeProject,
  parseProject,
} from "../../packages/electrical-model/project.ts";

function fixture() {
  let p = nativeProject();
  place(p, "page", "layer", "lamp", { x: 100, y: 50 }, 5);
  p = addBuilding(p, "Building", "");
  p = addFloor(p, p.buildings[0].id, "Ground", 0, 3000);
  p = addRectangularRoom(p, p.floors[0].id, "Office", 0, 0, 8000, 6000);
  p = addPlanLayer(p, p.floors[0].id, "Equipment", "electrical");
  p = addPlanLayer(p, p.floors[0].id, "Circuits and routes", "electrical");
  for (const [i, symbol] of p.symbolInstances.entries())
    p = savePlanEquipment(
      p,
      {
        floorId: p.floors[0].id,
        layerId: p.architecturalLayers[0].id,
        roomId: p.rooms[0].id,
        symbolInstanceId: symbol.id,
        name: symbol.name,
        position: { x: 500 + i * 1000, y: 500 },
        rotation: 0,
        symbolScale: 20,
      },
      50,
    );
  return saveDistributionBoard(p, {
    floorId: p.floors[0].id,
    name: "DB1",
    deviceId: "device-a",
  });
}

function circuitInput(p) {
  return {
    floorId: p.floors[0].id,
    layerId: p.architecturalLayers[1].id,
    name: "C1",
    boardId: p.distributionBoards[0].id,
    deviceIds: p.devices.filter((d) => d.id !== "device-a").map((d) => d.id),
    voltageV: 230,
    phases: 1,
    loads: [{ deviceId: "device-b", activePowerW: 125.5 }],
  };
}

function routeInput(p) {
  return {
    floorId: p.floors[0].id,
    layerId: p.architecturalLayers[1].id,
    name: "Cable route 1",
    kind: "cable",
    points: [
      { x: 0, y: 0 },
      { x: 3000, y: 4000 },
      { x: 6000, y: 4000 },
    ],
    ...(p.circuits[0] ? { circuitId: p.circuits[0].id } : {}),
  };
}

test("floor circuits preserve native wiring and distinguish partial from complete entered loads", () => {
  const p = fixture();
  const before = serializeProject(p);
  const a = savePlanCircuit(p, circuitInput(p));
  assert.equal(serializeProject(p), before);
  for (const key of [
    "wires",
    "wirePaths",
    "nets",
    "terminals",
    "pins",
    "symbolInstances",
  ])
    assert.deepEqual(a[key], p[key]);
  const [row] = circuitSchedule(a, a.floors[0].id);
  assert.equal(row.board, "DB1");
  assert.equal(row.deviceCount, 2);
  assert.equal(row.knownConnectedLoadW, 125.5);
  assert.equal(row.unknownLoadCount, 1);
  assert.equal(row.totalConnectedLoadW, null);
  const secondDevice = circuitInput(p).deviceIds.find(
    (id) => id !== "device-b",
  );
  const b = savePlanCircuit(
    a,
    {
      ...circuitInput(p),
      name: "Lighting",
      loads: [
        { deviceId: "device-b", activePowerW: 125.5 },
        { deviceId: secondDevice, activePowerW: 0 },
      ],
    },
    a.circuits[0].id,
  );
  assert.equal(b.circuits[0].id, a.circuits[0].id);
  assert.equal(
    circuitSchedule(b, b.floors[0].id)[0].totalConnectedLoadW,
    125.5,
  );
  assert.equal(circuitSchedule(b, b.floors[0].id)[0].unknownLoadCount, 0);
  assert.deepEqual(parseProject(serializeProject(b)).project, b);
  assert.equal(removePlanCircuit(b, b.circuits[0].id).circuits.length, 0);
});

test("circuit assignments reject duplicate members, loads, labels, invalid values and dangling references atomically", () => {
  const p = fixture();
  const input = circuitInput(p);
  const before = serializeProject(p);
  for (const change of [
    { boardId: "missing" },
    { floorId: "missing" },
    { layerId: "missing" },
    { deviceIds: ["missing"] },
    { deviceIds: ["device-a"] },
    { deviceIds: ["device-b", "device-b"] },
    { loads: [{ deviceId: "device-b", activePowerW: -1 }] },
    { loads: [{ deviceId: "device-b", activePowerW: NaN }] },
    { loads: [{ deviceId: "device-b", activePowerW: 1e13 }] },
    { loads: [{ deviceId: "device-a", activePowerW: 2 }] },
    { loads: [...input.loads, ...input.loads] },
    { voltageV: 0 },
    { phases: 2 },
  ])
    assert.throws(() => savePlanCircuit(p, { ...input, ...change }));
  assert.equal(serializeProject(p), before);
  const a = savePlanCircuit(p, input);
  assert.throws(
    () => savePlanCircuit(a, { ...input, name: "C2" }),
    /one floor circuit/,
  );
  assert.throws(
    () => savePlanCircuit(a, { ...input, deviceIds: [], loads: [] }),
    /labels must be unique/,
  );
  for (const key of ["floorId", "layerId"]) {
    const invalid = structuredClone(a);
    delete invalid.circuits[0][key];
    assert.throws(() => validateProject(invalid), /both a floor/);
  }
  const invalid = structuredClone(a);
  invalid.planEquipment = invalid.planEquipment.filter(
    (e) => e.symbolInstanceId !== "symbol-b",
  );
  assert.throws(() => validateProject(invalid), /placed on the same floor/);
});

test("boards and circuits enforce floor ownership and protected layer state", () => {
  const p = fixture();
  p.distributionBoards[0].roomId = p.rooms[0].id;
  const renamed = saveDistributionBoard(
    p,
    { floorId: p.floors[0].id, name: "Main board", deviceId: "device-a" },
    p.distributionBoards[0].id,
  );
  assert.equal(renamed.distributionBoards[0].name, "Main board");
  assert.equal(renamed.distributionBoards[0].roomId, p.rooms[0].id);
  const a = savePlanCircuit(p, circuitInput(p));
  for (const layer of p.architecturalLayers)
    for (const change of [{ visible: false }, { locked: true }]) {
      const protectedProject = setPlanLayer(a, layer.id, change);
      assert.throws(() =>
        savePlanCircuit(protectedProject, circuitInput(p), a.circuits[0].id),
      );
      assert.throws(() =>
        removePlanCircuit(protectedProject, a.circuits[0].id),
      );
      assert.equal(circuitSchedule(protectedProject, p.floors[0].id).length, 1);
    }
  const upper = addFloor(p, p.buildings[0].id, "Upper", 3000, 3000);
  assert.throws(() =>
    saveDistributionBoard(upper, {
      floorId: upper.floors[1].id,
      name: "Wrong floor",
      deviceId: "device-a",
    }),
  );
  assert.throws(
    () =>
      saveDistributionBoard(p, {
        floorId: p.floors[0].id,
        name: "Duplicate",
        deviceId: "device-a",
      }),
    /only one distribution board/,
  );
  const protectedProject = setPlanLayer(p, p.architecturalLayers[0].id, {
    locked: true,
  });
  assert.throws(() =>
    removeDistributionBoard(protectedProject, p.distributionBoards[0].id),
  );
  assert.throws(() =>
    saveDistributionBoard(
      protectedProject,
      {
        floorId: p.floors[0].id,
        name: "Changed",
        deviceId: "device-a",
      },
      p.distributionBoards[0].id,
    ),
  );
});

test("board, equipment and circuit deletions cannot orphan native assignments", () => {
  let p = fixture();
  p = savePlanCircuit(p, circuitInput(p));
  p = savePlanRoute(p, routeInput(p), 50);
  const before = serializeProject(p);
  assert.throws(() => removePlanCircuit(p, p.circuits[0].id), /circuit routes/);
  assert.throws(
    () => removeDistributionBoard(p, p.distributionBoards[0].id),
    /assignments/,
  );
  assert.throws(
    () => removePlanEquipment(p, p.planEquipment[0].id),
    /Floor board/,
  );
  assert.throws(
    () => removePlanEquipment(p, p.planEquipment[1].id),
    /Circuit devices/,
  );
  assert.equal(serializeProject(p), before);
  p = removePlanRoute(p, p.planRoutes[0].id);
  p = removePlanCircuit(p, p.circuits[0].id);
  p = savePlanZone(p, {
    floorId: p.floors[0].id,
    name: "Board zone",
    kind: "distribution",
    roomIds: [p.rooms[0].id],
    boardId: p.distributionBoards[0].id,
  });
  assert.throws(
    () => removeDistributionBoard(p, p.distributionBoards[0].id),
    /assignments/,
  );
});

test("route geometry snaps in native millimetres and measures diagonal horizontal lengths independently of drawing scale", () => {
  const p = fixture();
  const a = savePlanRoute(p, routeInput(p), 50);
  assert.equal(planRouteLengthM(a.planRoutes[0]), 8);
  const translated = {
    points: [...a.planRoutes[0].points]
      .reverse()
      .map((point) => ({ x: point.x - 500, y: point.y + 200 })),
  };
  assert.equal(planRouteLengthM(translated), 8);
  const b = savePlanRoute(
    a,
    {
      ...routeInput(p),
      kind: "conduit",
      points: [
        { x: -1006, y: -493 },
        { x: 2493, y: -493 },
      ],
    },
    50,
    a.planRoutes[0].id,
  );
  assert.deepEqual(b.planRoutes[0].points, [
    { x: -1000, y: -500 },
    { x: 2500, y: -500 },
  ]);
  assert.equal(planRouteLengthM(b.planRoutes[0]), 3.5);
  assert.equal(b.planRoutes[0].id, a.planRoutes[0].id);
  b.floors[0].drawingScale = 25;
  assert.equal(planRouteLengthM(b.planRoutes[0]), 3.5);
  assert.deepEqual(parseProject(serializeProject(b)).project, b);
  assert.equal(p.planRoutes.length, 0);
});

test("routes never create netlist connections and circuit schedules report actual associated horizontal geometry", () => {
  let p = fixture();
  p = savePlanCircuit(p, circuitInput(p));
  const a = savePlanRoute(p, routeInput(p), 50);
  const b = savePlanRoute(
    a,
    {
      ...routeInput(p),
      name: "Tray route",
      kind: "tray",
      points: [
        { x: 500, y: 500 },
        { x: 1500, y: 500 },
      ],
    },
    50,
  );
  assert.equal(circuitSchedule(b, b.floors[0].id)[0].planLengthM, 9);
  for (const key of ["wires", "wirePaths", "nets", "pins", "terminals"])
    assert.deepEqual(b[key], p[key]);
  const unassignedInput = { ...routeInput(p) };
  delete unassignedInput.circuitId;
  const c = savePlanRoute(b, unassignedInput, 50, b.planRoutes[0].id);
  assert.equal(circuitSchedule(c, c.floors[0].id)[0].planLengthM, 1);
  assert.equal(c.planRoutes[0].circuitId, undefined);
});

test("routes reject degenerate or unbounded geometry and incompatible layers or circuit floors", () => {
  let p = fixture();
  p = savePlanCircuit(p, circuitInput(p));
  const input = routeInput(p);
  const before = serializeProject(p);
  for (const points of [
    [],
    [{ x: 0, y: 0 }],
    [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ],
    [
      { x: 0, y: 0 },
      { x: 1000050, y: 0 },
    ],
    [
      { x: NaN, y: 0 },
      { x: 50, y: 50 },
    ],
    [
      { x: 0, y: 0 },
      { x: Infinity, y: 50 },
    ],
  ])
    assert.throws(() => savePlanRoute(p, { ...input, points }, 50));
  for (const grid of [0, -1, NaN, Infinity])
    assert.throws(() => savePlanRoute(p, input, grid));
  assert.throws(() => savePlanRoute(p, { ...input, circuitId: "missing" }, 50));
  const q = addPlanLayer(p, p.floors[0].id, "Walls", "architectural");
  assert.throws(() =>
    savePlanRoute(
      q,
      { ...input, layerId: q.architecturalLayers.at(-1).id },
      50,
    ),
  );
  let upper = addFloor(p, p.buildings[0].id, "Upper", 3000, 3000);
  upper = addPlanLayer(
    upper,
    upper.floors[1].id,
    "Upper electrical",
    "electrical",
  );
  assert.throws(
    () =>
      savePlanRoute(
        upper,
        {
          ...input,
          floorId: upper.floors[1].id,
          layerId: upper.architecturalLayers.at(-1).id,
        },
        50,
      ),
    /same floor/,
  );
  assert.equal(serializeProject(p), before);
});

test("route edits and deletion respect the original, destination and linked circuit layers", () => {
  let p = fixture();
  p = savePlanCircuit(p, circuitInput(p));
  p = savePlanRoute(
    p,
    { ...routeInput(p), layerId: p.architecturalLayers[0].id },
    50,
  );
  for (const layer of p.architecturalLayers)
    for (const change of [{ locked: true }, { visible: false }]) {
      const q = setPlanLayer(p, layer.id, change);
      assert.throws(() => removePlanRoute(q, p.planRoutes[0].id));
      assert.throws(() =>
        savePlanRoute(q, routeInput(p), 50, p.planRoutes[0].id),
      );
    }
  assert.equal(removePlanRoute(p, p.planRoutes[0].id).planRoutes.length, 0);
  assert.throws(() => removePlanRoute(p, "missing"));
  assert.throws(() => savePlanRoute(p, routeInput(p), 50, "missing"));
});

test("schema 15 migration preserves legacy circuits and equipment without inventing loads or routes", () => {
  const p = fixture();
  const legacy = structuredClone(p);
  legacy.schemaVersion = 15;
  delete legacy.planRoutes;
  delete legacy.distributionBoards[0].floorId;
  legacy.circuits.push({
    id: "legacy-circuit",
    name: "Legacy circuit",
    boardId: p.distributionBoards[0].id,
    deviceIds: ["device-b"],
    voltageV: 230,
    phases: 1,
  });
  const result = parseProject(JSON.stringify(legacy));
  assert.equal(result.migratedFrom, 15);
  assert.equal(result.project.schemaVersion, 16);
  assert.deepEqual(result.project.planRoutes, []);
  assert.deepEqual(result.project.circuits, legacy.circuits);
  assert.deepEqual(
    result.project.distributionBoards,
    legacy.distributionBoards,
  );
  assert.deepEqual(result.project.planEquipment, legacy.planEquipment);
  assert.equal(circuitSchedule(result.project, p.floors[0].id).length, 0);
});
