import { test } from "node:test";
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
    assert.equal(
      new Set(pins.map((pin) => pin.terminalId)).size,
      symbol.pins.length,
    );
    assert.deepEqual(parseProject(serializeProject(p)).project.wires, p.wires);
  }
  assert.equal(searchSymbols("transformer", "power").length, 1);
  assert.equal(searchSymbols("transformer", "motors").length, 0);
  assert.equal(searchSymbols("breaker", "protection")[0].pins.length, 2);
  assert.equal(searchSymbols("sensor", "automation")[0].pins.length, 3);
  assert.equal(searchSymbols("drive", "industrial")[0].pins.length, 7);
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
  assert.equal(migrated.project.schemaVersion, 4);
  assert.deepEqual(migrated.project.wires, p.wires);
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
  assert.equal(searchCatalog("phoenix 3004362").length, 1);
  assert.equal(searchCatalog("ＵＫ ５ Ｎ").length, 1);
  assert.equal(searchCatalog("", "protection").length, 0);
  assert.equal(searchCatalog("", "connections", "Unknown").length, 0);
  assert.equal(catalog[0].ratings.nominalCurrentA, 32);
  assert.match(catalog[0].sourceUrl, /^https:\/\/www\.phoenixcontact\.com\//);
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
