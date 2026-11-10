import { test } from "node:test";
import { analyze } from "../../packages/connectivity-engine/analyze.ts";
import {
  engineeringSymbols,
  installSymbol,
  searchSymbols,
} from "../../packages/component-library/symbols.ts";
import {
  createCustomSymbol,
  updateCustomSymbol,
} from "../../packages/component-library/custom-symbols.ts";
import assert from "node:assert/strict";
import {
  parseProject,
  serializeProject,
} from "../../packages/electrical-model/project.ts";
import {
  catalog,
  searchCatalog,
  assignCatalogPart,
} from "../../packages/component-library/catalog.ts";
import { nativeProject } from "../fixtures/native-project.mjs";
import {
  place,
  connect,
  setWireRoute,
} from "../../packages/schematic-editor/commands.ts";

test("every engineering symbol installs and places its declared electrical nodes", () => {
  for (const symbol of engineeringSymbols) {
    const p = installSymbol(nativeProject(), symbol.id);
    const count = p.symbolDefinitions.length;
    assert.equal(installSymbol(p, symbol.id).symbolDefinitions.length, count);
    const id = place(
      p,
      "page",
      "layer",
      "custom",
      { x: 200, y: 150 },
      5,
      `library-${symbol.id}`,
    );
    const pins = p.pins.filter((pin) => pin.symbolInstanceId === id);
    assert.equal(pins.length, symbol.pins.length, symbol.name);
    for (const pin of pins)
      assert.equal(
        p.terminals.find((t) => t.id === pin.terminalId).kind,
        symbol.pins.find((p) => p.id === pin.definitionPinId).kind,
      );
    assert.equal(
      new Set(pins.map((pin) => pin.terminalId)).size,
      new Set(
        symbol.pins.map((pin) =>
          pin.terminalGroup ? `group:${pin.terminalGroup}` : `pin:${pin.id}`,
        ),
      ).size,
    );
    assert.deepEqual(parseProject(serializeProject(p)).project.wires, p.wires);
  }
  assert.equal(searchSymbols("transformer", "power").length, 1);
  assert.equal(searchSymbols("transformer", "motors").length, 0);
  assert.equal(searchSymbols("breaker", "protection")[0].pins.length, 2);
  assert.equal(searchSymbols("sensor", "automation")[0].pins.length, 3);
  assert.equal(searchSymbols("drive", "industrial")[0].pins.length, 7);
  assert.equal(searchSymbols("relay", "switching")[0].pins.length, 5);
  assert.equal(searchSymbols("rectifier", "power")[0].pins.length, 4);
  assert.equal(searchSymbols("pushbutton", "switching")[0].pins.length, 2);
  assert.equal(searchSymbols("roller", "switching")[0].pins.length, 2);
  assert.equal(searchSymbols("selector", "switching")[0].pins.length, 3);
  assert.equal(
    new Set(
      searchSymbols("two-pole pass-through", "connections")[0].pins.map(
        (pin) => pin.terminalGroup,
      ),
    ).size,
    2,
  );
  assert.equal(
    new Set(
      searchSymbols("L/N/PE pass-through", "connections")[0].pins.map(
        (pin) => pin.terminalGroup,
      ),
    ).size,
    3,
  );
  assert.equal(searchSymbols("stepper", "motors")[0].pins.length, 4);
  assert.equal(
    searchSymbols("servo", "motors")[0].pins.filter(
      (pin) => pin.kind === "signal",
    ).length,
    2,
  );
  assert.equal(
    searchSymbols("residual", "protection")[0].pins.filter(
      (pin) => pin.kind === "neutral",
    ).length,
    2,
  );
  assert.equal(searchSymbols("overload", "protection")[0].pins.length, 8);
  assert.equal(searchSymbols("AC/DC supply", "power")[0].pins.length, 5);
  assert.equal(searchSymbols("DC/DC converter", "power")[0].pins.length, 4);
  assert.equal(searchSymbols("DC/AC inverter", "power")[0].pins.length, 5);
  assert.equal(searchSymbols("UPS interface", "power")[0].pins.length, 7);
  assert.equal(
    searchSymbols("temperature sensing", "instrumentation")[0].pins.length,
    2,
  );
  assert.equal(
    searchSymbols("pressure transducer", "instrumentation")[0].pins.length,
    3,
  );
  assert.equal(
    searchSymbols("flow transducer", "instrumentation")[0].pins.length,
    3,
  );
  assert.equal(
    searchSymbols("energy meter", "instrumentation")[0].pins.length,
    6,
  );
  assert.equal(
    searchSymbols("emergency luminaire", "building")[0].pins.length,
    5,
  );
  assert.equal(searchSymbols("detector", "building")[0].pins.length, 5);
  const board = searchSymbols("distribution board", "building")[0];
  assert.equal(board.pins.length, 12);
  assert.equal(
    new Set(
      board.pins
        .filter((pin) => pin.terminalGroup)
        .map((pin) => pin.terminalGroup),
    ).size,
    2,
  );
  assert.equal(searchSymbols("contactor", "switching")[0].pins.length, 8);
  assert.equal(
    searchSymbols("isolator", "power")[0].pins.filter(
      (pin) => pin.terminalGroup === "PE",
    ).length,
    2,
  );
  for (const query of [
    "digital input",
    "digital output",
    "analog input",
    "analog output",
  ]) {
    const symbol = searchSymbols(query, "automation")[0];
    assert.equal(symbol.pins.length, 6);
    assert.equal(symbol.pins.filter((pin) => pin.kind === "signal").length, 4);
    assert.equal(symbol.pins.filter((pin) => pin.kind === "control").length, 2);
  }
  assert.deepEqual(
    searchSymbols("luminaire", "building")[0].pins.map((pin) => pin.kind),
    ["power", "neutral", "pe"],
  );
  assert.equal(
    searchSymbols("generator", "power")[0].pins.filter(
      (pin) => pin.kind === "neutral" || pin.kind === "pe",
    ).length,
    2,
  );
});

test("busbar taps share one physical terminal and group edits preserve that identity", () => {
  const p = installSymbol(nativeProject(), "busbar-four-taps");
  const id = place(
    p,
    "page",
    "layer",
    "custom",
    { x: 200, y: 150 },
    5,
    "library-busbar-four-taps",
  );
  const pins = p.pins.filter((pin) => pin.symbolInstanceId === id);
  assert.equal(new Set(pins.map((pin) => pin.terminalId)).size, 1);
  const net = analyze(p).nets.find((net) => net.pinIds.includes(pins[0].id));
  assert.equal(net.pinIds.length, 4);
  assert.equal(net.terminalIds.length, 1);
  const other = place(
    p,
    "page",
    "layer",
    "custom",
    { x: 300, y: 150 },
    5,
    "library-busbar-four-taps",
  );
  assert.notEqual(
    p.pins.find((pin) => pin.symbolInstanceId === other).terminalId,
    pins[0].terminalId,
  );
  const definition = p.symbolDefinitions.find(
    (d) => d.id === "library-busbar-four-taps",
  );
  const extended = updateCustomSymbol(p, {
    ...definition,
    pins: [
      ...definition.pins,
      {
        id: "tap5",
        position: { x: 0, y: 14 },
        kind: "power",
        terminalGroup: "bus",
      },
    ],
  });
  const added = extended.pins.find(
    (pin) => pin.symbolInstanceId === id && pin.definitionPinId === "tap5",
  );
  assert.equal(added.terminalId, pins[0].terminalId);
  assert.throws(
    () =>
      updateCustomSymbol(p, {
        ...definition,
        pins: definition.pins.map((pin) => ({
          ...pin,
          terminalGroup: "changed",
        })),
      }),
    /regroup/,
  );
  const invalid = structuredClone(p);
  invalid.terminals.push({
    ...invalid.terminals.find((t) => t.id === pins[0].terminalId),
    id: "split-terminal",
  });
  invalid.pins.find((pin) => pin.id === pins[0].id).terminalId =
    "split-terminal";
  assert.throws(() => serializeProject(invalid), /group mapping/);
  const old = nativeProject();
  old.schemaVersion = 5;
  assert.deepEqual(
    parseProject(JSON.stringify(old)).project.terminals,
    old.terminals,
  );
});

test("custom artwork is bounded native geometry and schema three migrates without changing identities", () => {
  const p = nativeProject();
  const definition = {
    id: "art",
    name: "Artwork",
    category: "custom",
    glyph: "box",
    widthMm: 20,
    heightMm: 20,
    pins: [{ id: "1", position: { x: -10, y: 0 } }],
    artwork: [
      { kind: "line", from: { x: -10, y: 0 }, to: { x: 10, y: 0 } },
      { kind: "circle", center: { x: 0, y: 0 }, radiusMm: 4 },
    ],
  };
  const next = createCustomSymbol(p, definition);
  assert.deepEqual(
    parseProject(serializeProject(next)).project.symbolDefinitions.at(-1)
      .artwork,
    definition.artwork,
  );
  assert.throws(
    () =>
      createCustomSymbol(p, {
        ...definition,
        artwork: [{ kind: "circle", center: { x: 9, y: 0 }, radiusMm: 4 }],
      }),
    /bounds/,
  );
  assert.throws(() =>
    createCustomSymbol(p, {
      ...definition,
      artwork: [{ kind: "script", text: "unsafe" }],
    }),
  );
  assert.throws(() =>
    createCustomSymbol(p, {
      ...definition,
      artwork: Array(257).fill(definition.artwork[0]),
    }),
  );
  p.schemaVersion = 3;
  const migrated = parseProject(JSON.stringify(p));
  assert.equal(migrated.migratedFrom, 3);
  assert.equal(migrated.project.schemaVersion, 18);
  assert.deepEqual(migrated.project.wires, p.wires);
});

test("declared pin kinds propagate on edits and schema four preserves prior terminal kinds", () => {
  const p = installSymbol(nativeProject(), "socket-l-n-pe");
  const id = place(
    p,
    "page",
    "layer",
    "custom",
    { x: 200, y: 150 },
    5,
    "library-socket-l-n-pe",
  );
  const definition = p.symbolDefinitions.find(
    (d) => d.id === "library-socket-l-n-pe",
  );
  const pin = p.pins.find(
    (pin) => pin.symbolInstanceId === id && pin.definitionPinId === "PE",
  );
  assert.equal(p.terminals.find((t) => t.id === pin.terminalId).kind, "pe");
  const edited = updateCustomSymbol(p, {
    ...definition,
    pins: definition.pins.map((pin) => ({
      ...pin,
      kind: pin.id === "L" ? "control" : pin.kind,
    })),
  });
  const l = edited.pins.find(
    (pin) => pin.symbolInstanceId === id && pin.definitionPinId === "L",
  );
  assert.equal(
    edited.terminals.find((t) => t.id === l.terminalId).kind,
    "control",
  );
  p.schemaVersion = 4;
  for (const d of p.symbolDefinitions)
    for (const pin of d.pins) delete pin.kind;
  assert.deepEqual(
    parseProject(JSON.stringify(p)).project.terminals,
    p.terminals,
  );
  assert.throws(() =>
    createCustomSymbol(nativeProject(), {
      ...definition,
      id: "invalid",
      pins: [{ id: "x", position: { x: 0, y: 0 }, kind: "invented" }],
    }),
  );
});

test("custom definition edits preserve wired identities and reject pin removal or protected rerouting", () => {
  const definition = {
    id: "custom",
    name: "Interface",
    category: "custom",
    glyph: "box",
    widthMm: 20,
    heightMm: 20,
    pins: [
      { id: "IN", position: { x: -10, y: 0 } },
      { id: "OUT", position: { x: 10, y: 0 } },
    ],
  };
  const p = createCustomSymbol(nativeProject(), definition);
  const a = place(
    p,
    "page",
    "layer",
    "custom",
    { x: 200, y: 150 },
    5,
    "custom",
  );
  const b = place(
    p,
    "page",
    "layer",
    "custom",
    { x: 300, y: 150 },
    5,
    "custom",
  );
  connect(
    p,
    p.pins.find(
      (pin) => pin.symbolInstanceId === a && pin.definitionPinId === "OUT",
    ).id,
    p.pins.find(
      (pin) => pin.symbolInstanceId === b && pin.definitionPinId === "IN",
    ).id,
  );
  const wires = structuredClone(p.wires);
  const edited = {
    ...definition,
    widthMm: 24,
    pins: definition.pins.map((pin) => ({
      ...pin,
      position: { x: pin.position.x * 1.2, y: 0 },
    })),
  };
  const next = updateCustomSymbol(p, edited);
  assert.deepEqual(next.wires, wires);
  assert.equal(next.wirePaths.at(-1).points[0].x, 212);
  assert.equal(p.wirePaths.at(-1).points[0].x, 210);
  assert.throws(
    () =>
      updateCustomSymbol(p, {
        ...definition,
        pins: definition.pins.slice(0, 1),
      }),
    /pin identities/,
  );
  const manual = setWireRoute(p, p.wires.at(-1).id, p.wirePaths.at(-1).points);
  assert.throws(() => updateCustomSymbol(manual, edited), /Manual/);
  const extended = updateCustomSymbol(p, {
    ...definition,
    pins: [...definition.pins, { id: "AUX", position: { x: 0, y: 10 } }],
  });
  assert.equal(
    extended.pins.filter((pin) => [a, b].includes(pin.symbolInstanceId)).length,
    6,
  );
  p.layers.find((layer) => layer.id === "layer").locked = true;
  assert.throws(() => updateCustomSymbol(p, edited), /editable/);
});

test("custom definitions produce real independent terminals and reject invalid geometry", () => {
  const p = nativeProject();
  const definition = {
    id: "custom",
    name: "Interface",
    category: "custom",
    glyph: "box",
    widthMm: 20,
    heightMm: 20,
    pins: [
      { id: "IN", position: { x: -10, y: 0 } },
      { id: "OUT", position: { x: 10, y: 0 } },
    ],
  };
  const next = createCustomSymbol(p, definition);
  assert.equal(
    p.symbolDefinitions.some((d) => d.id === "custom"),
    false,
  );
  const id = place(
    next,
    "page",
    "layer",
    "custom",
    { x: 200, y: 150 },
    5,
    "custom",
  );
  const pins = next.pins.filter((pin) => pin.symbolInstanceId === id);
  assert.equal(pins.length, 2);
  assert.notEqual(pins[0].terminalId, pins[1].terminalId);
  assert.equal(
    next.symbolInstances.find((s) => s.id === id).definitionId,
    "custom",
  );
  assert.throws(
    () => createCustomSymbol(p, { ...definition, pins: [] }),
    /pin set/,
  );
  assert.throws(
    () =>
      createCustomSymbol(p, {
        ...definition,
        pins: [{ id: "A", position: { x: 11, y: 0 } }],
      }),
    /outside/,
  );
  assert.throws(
    () =>
      createCustomSymbol(p, {
        ...definition,
        pins: [definition.pins[0], { ...definition.pins[0], id: "B" }],
      }),
    /Overlapping/,
  );
});

test("catalog searches factual manufacturer records without fabricating matches", () => {
  assert.equal(searchCatalog("", "", "Phoenix Contact").length, 2);
  assert.equal(
    searchCatalog("2002-1201", "", "WAGO")[0].ratings.nominalVoltageV,
    undefined,
  );
  assert.equal(searchCatalog("phoenix 3004362").length, 1);
  assert.equal(searchCatalog("ＵＫ ５ Ｎ").length, 1);
  assert.equal(searchCatalog("", "protection").length, 0);
  assert.equal(searchCatalog("", "connections", "Unknown").length, 0);
  assert.equal(catalog[0].ratings.nominalCurrentA, 32);
  assert.match(catalog[0].sourceUrl, /^https:\/\/www\.phoenixcontact\.com\//);
});

test("every manufacturer record maps a native terminal without fabricating missing ratings", () => {
  for (const part of catalog) {
    const p = nativeProject();
    const id = place(
      p,
      "page",
      "layer",
      part.mapping.glyph,
      { x: 200, y: 150 },
      5,
    );
    const device = p.symbolInstances.find((s) => s.id === id).deviceId;
    const assigned = assignCatalogPart(p, device, part.id);
    const record = assigned.manufacturerParts.find(
      (item) =>
        item.id === assigned.devices.find((d) => d.id === device).partId,
    );
    assert.deepEqual(record.ratings, part.ratings);
    assert.equal(record.sourceUrl, part.sourceUrl);
    assert.deepEqual(assigned.wires, p.wires);
    assert.equal(
      assigned.terminals.find((t) => t.deviceId === device).capacity,
      part.mapping.glyph === "terminal" ? 2 : undefined,
    );
    assert.deepEqual(assigned.pins, p.pins);
  }
});
test("catalog assignment preserves topology and supplies only sourced terminal metadata", () => {
  const p = nativeProject();
  const id = place(p, "page", "layer", "terminal", { x: 200, y: 150 }, 5);
  const device = p.symbolInstances.find((item) => item.id === id).deviceId;
  const next = assignCatalogPart(p, device, "phoenix-3004362");
  assert.equal(p.devices.find((item) => item.id === device).partId, undefined);
  assert.deepEqual(next.wires, p.wires);
  assert.equal(
    next.terminals.find((item) => item.deviceId === device).capacity,
    2,
  );
  const part = next.manufacturerParts.find(
    (item) =>
      item.id === next.devices.find((item) => item.id === device).partId,
  );
  assert.equal(part.partNumber, "3004362");
  assert.equal(
    assignCatalogPart(next, device, "phoenix-3004362").manufacturerParts.length,
    next.manufacturerParts.length,
  );
  next.layers.find((item) => item.id === "layer").locked = true;
  assert.throws(
    () => assignCatalogPart(next, device, "phoenix-3004362"),
    /compatible/,
  );
  assert.throws(() => assignCatalogPart(p, device, "missing"), /Unknown/);
});

test("non-terminal part mapping rejects a different glyph even with the same terminal count", () => {
  const p = nativeProject();
  const id = place(p, "page", "layer", "resistor", { x: 200, y: 150 }, 5);
  const device = p.symbolInstances.find((s) => s.id === id).deviceId;
  const before = serializeProject(p);
  assert.throws(
    () => assignCatalogPart(p, device, "schneider-zbe101"),
    /compatible/,
  );
  assert.equal(serializeProject(p), before);
});

for (const [symbolId, kinds] of [
  ["rcbo-two-pole", ["power", "power", "neutral", "neutral"]],
  ["motor-protection-three-pole", Array(6).fill("power")],
  ["surge-protector-l-pe", ["power", "pe"]],
  [
    "protection-relay-trip",
    ["control", "control", "signal", "signal", "control", "control", "control"],
  ],
])
  test(`protection interface ${symbolId} does not infer internal shorts or ratings`, () => {
    const p = installSymbol(nativeProject(), symbolId);
    const instance = place(
      p,
      "page",
      "layer",
      "custom",
      { x: 100, y: 100 },
      5,
      `library-${symbolId}`,
    );
    const pins = p.pins.filter((pin) => pin.symbolInstanceId === instance);
    assert.deepEqual(
      pins.map((pin) => p.terminals.find((t) => t.id === pin.terminalId).kind),
      kinds,
    );
    const nets = analyze(p).nets;
    for (const pin of pins) {
      const net = nets.find((net) => net.pinIds.includes(pin.id));
      assert.equal(net.pinIds.length, 1);
      assert.equal(net.terminalIds.length, 1);
    }
    assert.equal(p.manufacturerParts.length, 0);
    for (const terminal of p.terminals)
      assert.equal(terminal.capacity, undefined);
    assert.deepEqual(
      analyze(parseProject(serializeProject(p)).project).nets,
      nets,
    );
  });
