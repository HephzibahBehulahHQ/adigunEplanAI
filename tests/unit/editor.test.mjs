import { test } from "node:test";
import assert from "node:assert/strict";
import { nativeProject } from "../fixtures/native-project.mjs";
import {
  validateProject,
  serializeProject,
  parseProject,
} from "../../packages/electrical-model/project.ts";
import { ProjectHistory } from "../../packages/electrical-model/history.ts";
import {
  place,
  move,
  align,
  rotate,
  mirror,
  connect,
  remove,
  removeWire,
  setWireRoute,
  paste,
  ensureLayer,
  insertJunction,
  primitives,
} from "../../packages/schematic-editor/commands.ts";
import {
  pinPosition,
  transform,
  snap,
  routeWire,
  bounds,
} from "../../packages/schematic-editor/geometry.ts";
function blank() {
  const p = nativeProject();
  p.symbolInstances = [];
  p.symbolDefinitions = [];
  p.devices = [];
  p.terminals = [];
  p.pins = [];
  p.wires = [];
  p.wirePaths = [];
  p.nets = [];
  return p;
}

test("manual routes preserve electrical identities, reject invalid paths and undo atomically", () => {
  const p = blank();
  place(p, "page", "layer", "resistor", { x: 50, y: 50 }, 5);
  place(p, "page", "layer", "lamp", { x: 150, y: 50 }, 5);
  connect(p, p.pins[1].id, p.pins[2].id);
  const id = p.wires[0].id;
  const points = [
    { x: 60, y: 50 },
    { x: 70, y: 50 },
    { x: 70, y: 80 },
    { x: 130, y: 80 },
    { x: 130, y: 50 },
    { x: 144, y: 50 },
  ];
  const history = new ProjectHistory(p);
  const manual = history.execute((draft) => setWireRoute(draft, id, points));
  assert.equal(manual.wirePaths[0].routingMode, "manual");
  assert.deepEqual(manual.wires, p.wires);
  assert.deepEqual(manual.wirePaths[0].points, points);
  assert.throws(
    () =>
      history.execute((draft) =>
        move(draft, [draft.symbolInstances[0].id], { x: 5, y: 0 }, 5),
      ),
    /Manual/,
  );
  assert.deepEqual(history.current.wirePaths[0].points, points);
  assert.throws(
    () =>
      setWireRoute(manual, id, [
        { x: 60, y: 50 },
        { x: 144, y: 60 },
      ]),
    /orthogonal/,
  );
  assert.throws(
    () =>
      setWireRoute(manual, id, [
        { x: 61, y: 50 },
        { x: 144, y: 50 },
      ]),
    /detached/,
  );
  assert.throws(
    () =>
      setWireRoute(manual, id, [
        { x: 60, y: 50 },
        { x: 60, y: -1 },
        { x: 144, y: -1 },
        { x: 144, y: 50 },
      ]),
    /sheet/,
  );
  assert.equal(
    history.execute((draft) => setWireRoute(draft, id, null)).wirePaths[0]
      .routingMode,
    "auto",
  );
  assert.deepEqual(history.undo().wirePaths[0].points, points);
  assert.deepEqual(history.undo().wirePaths, p.wirePaths);
  manual.layers[0].locked = true;
  assert.throws(() => setWireRoute(manual, id, points), /editable/);
});
test("all native glyphs create real devices, terminals and valid pin mappings", () => {
  for (const kind of Object.keys(primitives)) {
    const p = blank();
    place(p, "page", "layer", kind, { x: 53, y: 48 }, 5);
    validateProject(p);
    assert.equal(p.devices.length, 1);
    assert.equal(p.pins.length, primitives[kind].pins.length);
    assert.deepEqual(p.symbolInstances[0].position, { x: 55, y: 50 });
  }
});
test("placement avoids overlapping symbols and rejects out-of-page placement", () => {
  const p = blank();
  const a = place(p, "page", "layer", "resistor", { x: 100, y: 100 }, 5);
  const b = place(p, "page", "layer", "resistor", { x: 100, y: 100 }, 5);
  assert.notDeepEqual(
    p.symbolInstances.find((s) => s.id === a).position,
    p.symbolInstances.find((s) => s.id === b).position,
  );
  assert.throws(
    () =>
      place(blank(), "page", "layer", "resistor", { x: -1000, y: -1000 }, 5),
    /free placement/,
  );
});
test("orthogonal transformations preserve exact millimetre coordinates", () => {
  assert.deepEqual(transform({ x: 10, y: 0 }, { x: 50, y: 50 }, 90), {
    x: 50,
    y: 60,
  });
  assert.deepEqual(transform({ x: 10, y: 0 }, { x: 50, y: 50 }, 90, true), {
    x: 50,
    y: 40,
  });
  assert.equal(snap(12.7, 5), 15);
  assert.throws(() => snap(4, 0));
});
test("moving/rotating/mirroring connected symbols reroutes their real pin endpoints", () => {
  const p = blank();
  const a = place(p, "page", "layer", "resistor", { x: 50, y: 50 }, 5);
  const b = place(p, "page", "layer", "lamp", { x: 120, y: 80 }, 5);
  const from = p.pins.find(
    (pin) => pin.symbolInstanceId === a && pin.definitionPinId === "2",
  ).id;
  const to = p.pins.find((pin) => pin.symbolInstanceId === b).id;
  connect(p, from, to);
  for (const action of [
    () => move(p, [a], { x: 10, y: 5 }, 5),
    () => rotate(p, [a]),
    () => mirror(p, [a]),
  ]) {
    action();
    validateProject(p);
    assert.deepEqual(p.wirePaths[0].points[0], pinPosition(p, from));
    assert.deepEqual(p.wirePaths[0].points.at(-1), pinPosition(p, to));
    assert.equal(p.wires[0].fromPinId, from);
  }
});
test("locked or hidden layers block mutations and duplicate wires are rejected", () => {
  const p = blank();
  const a = place(p, "page", "layer", "resistor", { x: 50, y: 50 }, 5);
  const b = place(p, "page", "layer", "lamp", { x: 120, y: 80 }, 5);
  connect(p, p.pins[0].id, p.pins[2].id);
  assert.throws(() => connect(p, p.pins[2].id, p.pins[0].id), /already/);
  p.layers[0].locked = true;
  assert.throws(() => move(p, [a], { x: 5, y: 0 }, 5), /editable/);
  assert.throws(
    () => place(p, "page", "layer", "fuse", { x: 100, y: 150 }, 5),
    /layer/,
  );
  p.layers[0].locked = false;
  p.layers[0].visible = false;
  assert.throws(() => remove(p, [b]), /editable/);
});
test("deletion cleans connected wires and undo restores the native graph", () => {
  const p = blank();
  const a = place(p, "page", "layer", "resistor", { x: 50, y: 50 }, 5);
  place(p, "page", "layer", "lamp", { x: 120, y: 80 }, 5);
  connect(p, p.pins[0].id, p.pins[2].id);
  const h = new ProjectHistory(p);
  h.execute((d) => remove(d, [a]));
  assert.equal(h.current.wires.length, 0);
  assert.equal(h.current.pins.length, 2);
  assert.deepEqual(h.undo(), p);
});
test("clipboard snapshot survives source deletion and preserves internal wiring", () => {
  const p = blank();
  const a = place(p, "page", "layer", "resistor", { x: 50, y: 50 }, 5);
  const b = place(p, "page", "layer", "lamp", { x: 120, y: 80 }, 5);
  connect(p, p.pins[0].id, p.pins[2].id);
  const snapshot = structuredClone(p);
  remove(p, [a, b]);
  const copies = paste(p, snapshot, [a, b], "page", "layer", 5);
  validateProject(p);
  assert.equal(copies.length, 2);
  assert.equal(p.wires.length, 1);
  assert.equal(p.symbolDefinitions.length, 2);
  assert.equal(new Set(p.devices.map((d) => d.reference)).size, 2);
});
test("wire removal preserves devices and cleans native routes", () => {
  const p = nativeProject();
  removeWire(p, "wire");
  validateProject(p);
  assert.equal(p.wires.length, 0);
  assert.equal(p.wirePaths.length, 0);
  assert.equal(p.devices.length, 2);
});
test("schema one migration preserves entities and adds independent graphical layers", () => {
  const legacy = nativeProject();
  legacy.schemaVersion = 1;
  delete legacy.layers;
  delete legacy.groups;
  delete legacy.annotations;
  for (const d of legacy.symbolDefinitions) {
    delete d.glyph;
    delete d.widthMm;
    delete d.heightMm;
  }
  for (const s of legacy.symbolInstances) {
    delete s.layerId;
    delete s.mirrored;
  }
  for (const path of legacy.wirePaths) delete path.layerId;
  const migrated = parseProject(JSON.stringify(legacy));
  assert.equal(migrated.migratedFrom, 1);
  assert.equal(migrated.project.schemaVersion, 5);
  assert.deepEqual(migrated.project.wires, legacy.wires);
  assert.equal(migrated.project.layers.length, 1);
  assert.deepEqual(
    parseProject(serializeProject(migrated.project)).project,
    migrated.project,
  );
});
test("creating a layer uses a real page and independent identity", () => {
  const p = blank();
  p.layers = [];
  const id = ensureLayer(p, "page");
  assert.equal(p.layers[0].id, id);
  validateProject(p);
});

test("inserting a junction splits the real wire into a shared terminal topology", () => {
  const p = blank();
  place(p, "page", "layer", "resistor", { x: 50, y: 50 }, 5);
  place(p, "page", "layer", "lamp", { x: 150, y: 50 }, 5);
  const from = p.pins[1].id,
    to = p.pins[2].id;
  connect(p, from, to);
  const junction = insertJunction(p, p.wires[0].id, { x: 100, y: 50 }, 5);
  const pin = p.pins.find((pin) => pin.symbolInstanceId === junction).id;
  validateProject(p);
  assert.equal(p.wires.length, 2);
  assert.equal(p.wires[0].toPinId, pin);
  assert.equal(p.wires[1].fromPinId, pin);
  assert.equal(p.wires[1].toPinId, to);
  assert.equal(p.wirePaths.length, 2);
});

test("alignment cannot collapse separate symbols onto each other", () => {
  const p = blank();
  const a = place(p, "page", "layer", "resistor", { x: 60, y: 60 }, 5);
  const b = place(p, "page", "layer", "resistor", { x: 120, y: 60 }, 5);
  const h = new ProjectHistory(p);
  assert.throws(() => h.execute((d) => align(d, [a, b], "x")), /overlap/);
  assert.deepEqual(h.current, p);
});

test("orthogonal routing leaves outward-facing terminals without crossing their device bodies", () => {
  const p = blank();
  const a = place(p, "page", "layer", "coil", { x: 220, y: 80 }, 5);
  const b = place(p, "page", "layer", "lamp", { x: 220, y: 150 }, 5);
  const from = p.pins.find(
    (pin) => pin.symbolInstanceId === a && pin.definitionPinId === "A2",
  ).id;
  const to = p.pins.find(
    (pin) => pin.symbolInstanceId === b && pin.definitionPinId === "1",
  ).id;
  const points = routeWire(p, from, to);
  assert.deepEqual(points[0], pinPosition(p, from));
  assert.deepEqual(points.at(-1), pinPosition(p, to));
  for (let i = 1; i < points.length; i++) {
    assert.ok(
      points[i].x === points[i - 1].x || points[i].y === points[i - 1].y,
    );
  }
  assert.ok(points[1].x >= 229);
});

test("routing detours around intervening symbol bodies and preserves orthogonal endpoints", () => {
  const p = blank();
  const a = place(p, "page", "layer", "coil", { x: 60, y: 100 }, 5);
  const b = place(p, "page", "layer", "lamp", { x: 250, y: 100 }, 5);
  for (const [x, y] of [
    [110, 100],
    [150, 90],
    [150, 120],
    [200, 100],
  ])
    place(p, "page", "layer", "motor", { x, y }, 5);
  const from = p.pins.find(
      (pin) => pin.symbolInstanceId === a && pin.definitionPinId === "A2",
    ).id,
    to = p.pins.find(
      (pin) => pin.symbolInstanceId === b && pin.definitionPinId === "1",
    ).id;
  const points = routeWire(p, from, to);
  for (let i = 1; i < points.length; i++)
    for (const instance of p.symbolInstances) {
      const box = bounds(p, instance),
        start = points[i - 1],
        end = points[i];
      const crosses =
        start.x === end.x
          ? start.x > box.left &&
            start.x < box.right &&
            Math.max(start.y, end.y) > box.top &&
            Math.min(start.y, end.y) < box.bottom
          : start.y > box.top &&
            start.y < box.bottom &&
            Math.max(start.x, end.x) > box.left &&
            Math.min(start.x, end.x) < box.right;
      assert.equal(crosses, false);
    }
  assert.deepEqual(points[0], pinPosition(p, from));
  assert.deepEqual(points.at(-1), pinPosition(p, to));
});
test("native paper dimensions reject unusable or unbounded rendering sizes", () => {
  const p = nativeProject();
  p.pages[0].widthMm = 2;
  assert.throws(() => validateProject(p));
  p.pages[0].widthMm = 1e100;
  assert.throws(() => validateProject(p));
});

test("bounded grid fallback routes a multi-turn maze with no single clear corridor", () => {
  const p = blank();
  const source = place(p, "page", "layer", "resistor", { x: 40, y: 150 }, 5),
    target = place(p, "page", "layer", "lamp", { x: 380, y: 150 }, 5);
  for (const [index, x, y, height] of [
    [1, 120, 100, 200],
    [2, 220, 198.5, 197],
    [3, 320, 100, 200],
  ]) {
    const def = `bar-def-${index}`,
      device = `bar-device-${index}`;
    p.symbolDefinitions.push({
      id: def,
      name: "Routing obstacle",
      category: "geometry",
      glyph: "box",
      widthMm: 12,
      heightMm: height,
      pins: [],
    });
    p.devices.push({ id: device, name: "Obstacle", reference: `B${index}` });
    p.symbolInstances.push({
      id: `bar-${index}`,
      name: `B${index}`,
      definitionId: def,
      deviceId: device,
      pageId: "page",
      layerId: "layer",
      mirrored: false,
      rotation: 0,
      position: { x, y },
    });
  }
  validateProject(p);
  const from = p.pins.find(
      (pin) => pin.symbolInstanceId === source && pin.definitionPinId === "2",
    ).id,
    to = p.pins.find(
      (pin) => pin.symbolInstanceId === target && pin.definitionPinId === "1",
    ).id;
  const points = routeWire(p, from, to);
  assert.ok(points.some((point) => point.y > 200));
  assert.ok(points.some((point) => point.y < 100));
  for (let i = 1; i < points.length; i++)
    for (const instance of p.symbolInstances) {
      const box = bounds(p, instance),
        a = points[i - 1],
        b = points[i];
      assert.ok(a.x === b.x || a.y === b.y);
      const hit =
        a.x === b.x
          ? a.x > box.left &&
            a.x < box.right &&
            Math.max(a.y, b.y) > box.top &&
            Math.min(a.y, b.y) < box.bottom
          : a.y > box.top &&
            a.y < box.bottom &&
            Math.max(a.x, b.x) > box.left &&
            Math.min(a.x, b.x) < box.right;
      assert.equal(hit, false);
    }
});

test("disabled snapping preserves free coordinates and native routes cannot detach from pins", () => {
  const p = blank();
  const id = place(p, "page", "layer", "resistor", { x: 53.234, y: 48.987 }, 0);
  assert.equal(p.symbolInstances[0].position.x, 53.234);
  move(p, [id], { x: 0.123, y: 0.012 }, 0);
  assert.ok(Math.abs(p.symbolInstances[0].position.x - 53.357) < 1e-9);
  const q = nativeProject();
  q.wirePaths[0].points[0].x += 1;
  assert.throws(() => validateProject(q), /endpoint/);
});
test("placing an unrelated component on a wire reroutes geometry without fabricating a connection", () => {
  const p = blank();
  place(p, "page", "layer", "resistor", { x: 50, y: 50 }, 5);
  place(p, "page", "layer", "lamp", { x: 150, y: 50 }, 5);
  connect(p, p.pins[1].id, p.pins[2].id);
  const wire = structuredClone(p.wires[0]);
  const id = place(p, "page", "layer", "coil", { x: 100, y: 50 }, 5);
  validateProject(p);
  assert.deepEqual(p.wires[0], wire);
  assert.equal(p.wires.length, 1);
  const ownPins = p.pins
    .filter((pin) => pin.symbolInstanceId === id)
    .map((pin) => pin.id);
  assert.ok(
    !ownPins.includes(wire.fromPinId) && !ownPins.includes(wire.toPinId),
  );
  assert.ok(p.wirePaths[0].points.some((point) => point.y !== 50));
});
