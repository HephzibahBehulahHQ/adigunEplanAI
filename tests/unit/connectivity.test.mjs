import { test } from "node:test";
import assert from "node:assert/strict";
import { electricalTransaction } from "../../packages/connectivity-engine/transaction.ts";
import {
  updateCore,
  updateTerminal,
  saveTerminalStrip,
} from "../../packages/connectivity-engine/metadata.ts";
import {
  setWireProperties,
  addCableCore,
  saveCable,
} from "../../packages/connectivity-engine/wire-properties.ts";
import {
  previewNumbering,
  applyNumbering,
} from "../../packages/connectivity-engine/numbering.ts";
import { ProjectHistory } from "../../packages/electrical-model/history.ts";
import { nativeProject } from "../fixtures/native-project.mjs";
import {
  analyze,
  synchronizeConnectivity,
} from "../../packages/connectivity-engine/analyze.ts";
import {
  validateProject,
  parseProject,
} from "../../packages/electrical-model/project.ts";
import {
  place,
  connect,
  insertJunction,
  remove,
  removeWire,
} from "../../packages/schematic-editor/commands.ts";
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
function pair() {
  const p = blank();
  const a = place(p, "page", "layer", "resistor", { x: 50, y: 50 }, 5),
    b = place(p, "page", "layer", "lamp", { x: 150, y: 50 }, 5);
  connect(
    p,
    p.pins.find(
      (pin) => pin.symbolInstanceId === a && pin.definitionPinId === "2",
    ).id,
    p.pins.find(
      (pin) => pin.symbolInstanceId === b && pin.definitionPinId === "1",
    ).id,
  );
  return p;
}

test("electrical transactions rebuild persisted nets through deletion and undo without stale references", () => {
  const initial = synchronizeConnectivity(pair());
  const original = structuredClone(initial);
  const history = new ProjectHistory(initial);
  const next = history.execute((p) =>
    electricalTransaction(p, (draft) =>
      remove(draft, [draft.symbolInstances[0].id]),
    ),
  );
  validateProject(next);
  assert.equal(next.wires.length, 0);
  assert.ok(
    next.nets.every((net) =>
      net.pinIds.every((id) => next.pins.some((pin) => pin.id === id)),
    ),
  );
  assert.ok(
    next.nets.every((net) =>
      net.terminalIds.every((id) => next.terminals.some((t) => t.id === id)),
    ),
  );
  assert.deepEqual(next.nets, analyze(next).nets);
  assert.deepEqual(history.undo(), original);
  assert.deepEqual(history.redo(), next);
  const split = electricalTransaction(initial, (draft) =>
    removeWire(draft, draft.wires[0].id),
  );
  assert.equal(split.nets.length, 4);
  assert.ok(split.nets.every((net) => net.wireIds.length === 0));
  assert.deepEqual(initial, original);
  assert.throws(() =>
    history.execute((p) =>
      electricalTransaction(p, (draft) => {
        draft.pins[0].terminalId = "missing";
        return draft;
      }),
    ),
  );
  assert.deepEqual(history.current, next);
});

test("removing a shield bond symbol preserves declared physical terminal identity", () => {
  const p = pair();
  p.conductors.push({
    id: "core",
    name: "1",
    color: "BU",
    crossSectionMm2: 1,
    material: "copper",
  });
  p.cables.push({
    id: "cable",
    name: "W-C1",
    conductorIds: ["core"],
    shielded: true,
    shieldBondTerminalIds: [p.terminals[0].id],
  });
  const result = electricalTransaction(p, (draft) =>
    remove(draft, [draft.symbolInstances[0].id]),
  );
  validateProject(result);
  assert.ok(result.terminals.some((t) => t.id === p.terminals[0].id));
  assert.equal(result.cables[0].shieldBondTerminalIds[0], p.terminals[0].id);
});

test("terminal declarations and core edits preserve topology and reject protected edits", () => {
  const p = pair();
  const open = p.terminals[0].id;
  const rated = updateTerminal(p, open, {
    designation: "A1",
    capacity: 1,
    required: true,
  });
  assert.equal(
    analyze(rated).findings.find(
      (f) => f.code === "OPEN_TERMINAL" && f.entityIds.includes(open),
    ).severity,
    "error",
  );
  assert.equal(p.terminals[0].required, undefined);
  const strip = saveTerminalStrip(rated, {
    id: "strip",
    name: "X1",
    terminalIds: [open, rated.terminals[3].id],
  });
  assert.equal(analyze(strip).nets.length, analyze(rated).nets.length);
  assert.throws(
    () =>
      saveTerminalStrip(strip, {
        id: "other",
        name: "X2",
        terminalIds: [open],
      }),
    /another strip/,
  );
  assert.throws(
    () =>
      saveTerminalStrip(strip, {
        id: "strip",
        name: "X1",
        terminalIds: [open, open],
      }),
    /Duplicate/,
  );
  assert.throws(() =>
    updateTerminal(p, open, { designation: "1", capacity: 0, required: false }),
  );
  assert.equal(
    updateTerminal(rated, open, { designation: "1", required: false })
      .terminals[0].capacity,
    undefined,
  );
  const core = {
    id: "core",
    name: "1",
    color: "BU",
    crossSectionMm2: 1,
    material: "copper",
  };
  const wired = addCableCore(p, p.wires[0].id, core);
  const edited = updateCore(wired, { ...core, crossSectionMm2: 4 });
  assert.equal(analyze(edited).connections[0].crossSectionMm2, 4);
  assert.equal(wired.conductors[0].crossSectionMm2, 1);
  wired.layers[0].locked = true;
  assert.throws(() => updateCore(wired, core), /Protected/);
  assert.throws(
    () => updateTerminal(wired, open, { designation: "1", required: false }),
    /Protected/,
  );
});

test("cable editing validates core ownership and explicit shielding without shorting signal cores", () => {
  const source = pair();
  const p = addCableCore(source, source.wires[0].id, {
    id: "core",
    name: "1",
    color: "BU",
    crossSectionMm2: 1,
    material: "copper",
  });
  const cable = {
    id: "cable",
    name: "W-C1",
    conductorIds: ["core"],
    shielded: true,
    shieldBondTerminalIds: [p.terminals[0].id],
    lengthM: 10,
  };
  const configured = saveCable(p, cable);
  assert.equal(p.cables.length, 0);
  assert.deepEqual(analyze(configured).connections[0].cableIds, ["cable"]);
  assert.equal(
    analyze(configured).findings.some((f) => f.code === "SHIELD_NOT_BONDED"),
    false,
  );
  assert.throws(
    () => saveCable(configured, { ...cable, id: "other" }),
    /another cable/,
  );
  assert.throws(
    () => saveCable(configured, { ...cable, shielded: false }),
    /shielded cable/,
  );
  assert.throws(() =>
    saveCable(configured, { ...cable, conductorIds: ["missing"] }),
  );
  assert.throws(
    () => saveCable(configured, { ...cable, conductorIds: ["core", "core"] }),
    /Duplicate/,
  );
  assert.equal(
    saveCable(configured, { ...cable, name: "W-C2" }).cables.length,
    1,
  );
});

test("wire metadata and core assignments are explicit, validated and isolated", () => {
  const p = pair(),
    id = p.wires[0].id;
  const configured = setWireProperties(p, id, {
    name: "W12",
    color: "#123abc",
    physicalLengthM: 12.5,
  });
  assert.equal(p.wires[0].name, "W1");
  assert.equal(analyze(configured).connections[0].physicalLengthM, 12.5);
  const core = {
    id: "core",
    name: "1",
    color: "BU",
    crossSectionMm2: 2.5,
    material: "copper",
  };
  const assigned = addCableCore(configured, id, core);
  assert.equal(analyze(assigned).connections[0].crossSectionMm2, 2.5);
  assert.equal(assigned.wires[0].conductorId, "core");
  assert.equal(assigned.wires[0].color, "#123abc");
  const cleared = setWireProperties(assigned, id, { name: "W12" });
  assert.equal(cleared.wires[0].conductorId, undefined);
  assert.equal(cleared.wires[0].physicalLengthM, undefined);
  assert.equal(cleared.conductors.length, 1);
  assert.throws(() =>
    setWireProperties(p, id, { name: "W1", physicalLengthM: -1 }),
  );
  assert.throws(() => setWireProperties(p, id, { name: "W1", color: "red" }));
  assert.throws(() =>
    setWireProperties(p, id, { name: "W1", conductorId: "missing" }),
  );
  assert.throws(() => addCableCore(p, id, core, "missing"), /Unknown cable/);
  p.layers[0].locked = true;
  assert.throws(() => addCableCore(p, id, core), /editable/);
  assert.equal(p.conductors.length, 0);
});

test("renumbering previews are inert, undoable and reject stale targets atomically", () => {
  const p = pair();
  p.wires[0].name = "W9";
  const preview = previewNumbering(p, "wires");
  assert.equal(p.wires[0].name, "W9");
  assert.equal(preview[0].after, "W1");
  const history = new ProjectHistory(p);
  assert.equal(
    history.execute((draft) => applyNumbering(draft, preview)).wires[0].name,
    "W1",
  );
  assert.equal(history.undo().wires[0].name, "W9");
  assert.equal(history.redo().wires[0].name, "W1");
  assert.throws(
    () => history.execute((draft) => applyNumbering(draft, preview)),
    /stale/,
  );
  assert.equal(history.current.wires[0].name, "W1");
});

test("terminal numbering preserves semantic PE and coil designations", () => {
  const p = pair();
  p.terminals[0].designation = "PE";
  p.terminals[1].designation = "A1";
  p.terminals[2].designation = "9";
  p.terminalStrips.push({
    id: "strip",
    name: "X1",
    terminalIds: p.terminals.map((t) => t.id),
  });
  const preview = previewNumbering(p, "terminalStrip", "strip");
  assert.ok(preview.every((change) => !["PE", "A1"].includes(change.before)));
  const result = applyNumbering(p, preview);
  assert.equal(result.terminals[0].designation, "PE");
  assert.equal(result.terminals[1].designation, "A1");
  assert.equal(result.terminals[2].designation, "3");
});

test("new wire numbers avoid collisions after removal", () => {
  const p = pair();
  p.wires[0].name = "W2";
  connect(p, p.pins[0].id, p.pins[3].id);
  assert.equal(p.wires[1].name, "W1");
});
test("netlists come from native terminal identities and retain source/destination units", () => {
  const p = pair();
  const result = analyze(p);
  assert.equal(result.connections.length, 1);
  assert.equal(result.connections[0].from.reference, "R1");
  assert.equal(result.connections[0].to.reference, "H1");
  assert.equal(result.connections[0].drawingLengthMm, 84);
  assert.equal(result.connections[0].physicalLengthM, null);
  assert.equal(
    result.findings.filter((f) => f.code === "OPEN_TERMINAL").length,
    2,
  );
});
test("visual wire crossings do not join separate circuits", () => {
  const p = blank();
  for (const [x, y] of [
    [50, 100],
    [200, 100],
    [120, 50],
    [120, 160],
  ])
    place(p, "page", "layer", "terminal", { x, y }, 5);
  connect(p, p.pins[0].id, p.pins[1].id);
  connect(p, p.pins[2].id, p.pins[3].id);
  const result = analyze(p);
  assert.equal(result.nets.filter((net) => net.wireIds.length).length, 2);
  assert.notEqual(result.connections[0].netId, result.connections[1].netId);
});
test("explicit junction splitting creates one physical net", () => {
  const p = pair();
  const id = insertJunction(p, p.wires[0].id, { x: 100, y: 50 }, 5);
  const result = analyze(p);
  assert.equal(result.nets.filter((net) => net.wireIds.length).length, 1);
  assert.ok(
    result.nets.some(
      (net) =>
        net.pinIds.includes(
          p.pins.find((pin) => pin.symbolInstanceId === id).id,
        ) && net.wireIds.length === 2,
    ),
  );
});
test("explicit labels join cross-page terminals; ordinary text does not", () => {
  const p = pair();
  p.pages.push({ ...p.pages[0], id: "page2", order: 1 });
  p.layers.push({
    id: "layer2",
    name: "Other",
    pageId: "page2",
    visible: true,
    locked: false,
  });
  const id = place(p, "page2", "layer2", "terminal", { x: 70, y: 70 }, 5);
  const other = p.pins.find((pin) => pin.symbolInstanceId === id).id;
  for (const [index, pinId] of [p.pins[1].id, other].entries())
    p.annotations.push({
      id: `alias-${index}`,
      name: "SIGNAL",
      text: "SIGNAL",
      pageId: index ? "page2" : "page",
      layerId: index ? "layer2" : "layer",
      pinId,
      position: { x: 30, y: 30 },
    });
  const result = analyze(p);
  assert.ok(
    result.nets.some(
      (net) => net.pinIds.includes(other) && net.wireIds.length === 1,
    ),
  );
  delete p.annotations[1].pinId;
  assert.equal(
    analyze(p).nets.find((net) => net.pinIds.includes(other)).wireIds.length,
    0,
  );
});
test("terminal wire capacity is checked only against provided ratings", () => {
  const p = pair();
  const endpoint = p.pins.find((pin) => pin.id === p.wires[0].fromPinId);
  const extra = place(p, "page", "layer", "terminal", { x: 100, y: 100 }, 5);
  connect(
    p,
    endpoint.id,
    p.pins.find((pin) => pin.symbolInstanceId === extra).id,
  );
  assert.ok(!analyze(p).findings.some((f) => f.code === "TERMINAL_CAPACITY"));
  p.terminals.find((t) => t.id === endpoint.terminalId).capacity = 1;
  assert.ok(analyze(p).findings.some((f) => f.code === "TERMINAL_CAPACITY"));
});
test("required open terminals are errors and duplicate wire numbers are detected", () => {
  const p = pair();
  p.terminals[0].required = true;
  p.wires.push({ ...p.wires[0], id: "parallel" });
  const result = analyze(p);
  assert.ok(
    result.findings.some(
      (f) => f.code === "OPEN_TERMINAL" && f.severity === "error",
    ),
  );
  assert.ok(result.findings.some((f) => f.code === "DUPLICATE_WIRE_NUMBER"));
  assert.ok(result.findings.some((f) => f.code === "DUPLICATE_CONNECTION"));
});
test("shield bonds are explicit and do not short cable cores", () => {
  const p = pair();
  p.conductors.push({
    id: "core",
    name: "Core 1",
    crossSectionMm2: 1.5,
    material: "copper",
    color: "BK",
  });
  p.wires[0].conductorId = "core";
  p.cables.push({
    id: "cable",
    name: "C1",
    conductorIds: ["core"],
    shielded: true,
  });
  assert.ok(analyze(p).findings.some((f) => f.code === "SHIELD_NOT_BONDED"));
  p.cables[0].shieldBondTerminalIds = [p.terminals[0].id, p.terminals[3].id];
  const result = analyze(p);
  assert.ok(!result.findings.some((f) => f.code === "SHIELD_NOT_BONDED"));
  const signal = result.nets.find((net) => net.wireIds.length);
  assert.equal(signal.terminalIds.length, 2);
  assert.notEqual(
    result.nets.find((net) => net.terminalIds.includes(p.terminals[0].id)).id,
    signal.id,
  );
});
test("one physical core cannot silently bind unrelated nets", () => {
  const p = pair();
  const a = place(p, "page", "layer", "terminal", { x: 50, y: 150 }, 5),
    b = place(p, "page", "layer", "terminal", { x: 150, y: 150 }, 5);
  connect(
    p,
    p.pins.find((pin) => pin.symbolInstanceId === a).id,
    p.pins.find((pin) => pin.symbolInstanceId === b).id,
  );
  p.conductors.push({
    id: "core",
    name: "Core",
    crossSectionMm2: 1,
    material: "copper",
    color: "BU",
  });
  for (const wire of p.wires) wire.conductorId = "core";
  assert.ok(
    analyze(p).findings.some((f) => f.code === "CORE_ON_MULTIPLE_NETS"),
  );
});
test("net identities and names survive reordering and unrelated additions", () => {
  const p = synchronizeConnectivity(pair());
  const before = analyze(p).nets.map((net) => ({
    id: net.id,
    name: net.name,
    terminals: net.terminalIds,
  }));
  p.terminals.reverse();
  p.pins.reverse();
  assert.deepEqual(
    analyze(p).nets.map((net) => ({
      id: net.id,
      name: net.name,
      terminals: net.terminalIds,
    })),
    before,
  );
  place(p, "page", "layer", "terminal", { x: 200, y: 180 }, 5);
  const after = analyze(p).nets;
  for (const net of before) {
    const found = after.find((candidate) => candidate.id === net.id);
    assert.equal(found.name, net.name);
  }
  validateProject(synchronizeConnectivity(p));
});
test("schema two documents migrate without changing their native electrical identities", () => {
  const p = pair();
  p.schemaVersion = 2;
  const result = parseProject(JSON.stringify(p));
  assert.equal(result.project.schemaVersion, 16);
  assert.deepEqual(result.project.wires, p.wires);
});

test("normalization is idempotent and electrical transactions retain new external findings", () => {
  const p = synchronizeConnectivity(pair());
  assert.deepEqual(synchronizeConnectivity(structuredClone(p)), p);
  const next = electricalTransaction(p, (draft) => {
    draft.findings.push({
      id: "external",
      name: "Review",
      code: "REVIEW",
      severity: "info",
      entityIds: [draft.devices[0].id],
      message: "Review required",
    });
    return draft;
  });
  assert.ok(next.findings.some((f) => f.id === "external"));
  assert.deepEqual(next.nets, p.nets);
});
