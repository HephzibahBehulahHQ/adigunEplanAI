import { test } from "node:test";
import assert from "node:assert/strict";
import { nativeProject } from "../fixtures/native-project.mjs";
import { analyze } from "../../packages/connectivity-engine/analyze.ts";
import {
  installSymbol,
  engineeringSymbols,
} from "../../packages/component-library/symbols.ts";
import { extendedSymbols } from "../../packages/component-library/extended-symbols.ts";
import { place, connect } from "../../packages/schematic-editor/commands.ts";
const install = (id) => installSymbol(nativeProject(), id);
const put = (p, id, x = 200) =>
  place(p, "page", "layer", "custom", { x, y: 150 }, 5, `library-${id}`);

test("extended device interfaces preserve independent ports without inferring component operation", () => {
  assert.equal(
    new Set(engineeringSymbols.map((s) => s.id)).size,
    engineeringSymbols.length,
  );
  for (const symbol of extendedSymbols.filter(
    (s) => s.pins.length && !s.pins.some((pin) => pin.terminalGroup),
  )) {
    const p = install(symbol.id);
    const id = put(p, symbol.id);
    const pins = p.pins.filter((pin) => pin.symbolInstanceId === id);
    for (const pin of pins) {
      const net = analyze(p).nets.find((net) => net.pinIds.includes(pin.id));
      assert.deepEqual(net.pinIds, [pin.id], symbol.name);
      assert.deepEqual(net.terminalIds, [pin.terminalId], symbol.name);
    }
    assert.equal(p.manufacturerParts.length, 0);
    assert.equal(p.calculations.length, 0);
    assert.equal(p.plcAddresses.length, 0);
  }
});

test("shielded cable keeps four cores and drain isolated until an explicit bond is wired", () => {
  const p = install("cable-four-core-shield");
  const id = put(p, "cable-four-core-shield");
  const pins = p.pins.filter((pin) => pin.symbolInstanceId === id);
  assert.equal(pins.length, 10);
  assert.equal(new Set(pins.map((pin) => pin.terminalId)).size, 5);
  for (let index = 1; index <= 4; index++) {
    const input = pins.find((pin) => pin.definitionPinId === `in${index}`);
    const output = pins.find((pin) => pin.definitionPinId === `out${index}`);
    assert.equal(input.terminalId, output.terminalId);
  }
  const drain = pins.find((pin) => pin.definitionPinId === "drain_in");
  assert.equal(
    p.terminals.find((t) => t.id === drain.terminalId).kind,
    "signal",
  );
  const earth = place(p, "page", "layer", "ground", { x: 310, y: 150 }, 5);
  const pe = p.pins.find((pin) => pin.symbolInstanceId === earth);
  assert.notEqual(
    analyze(p).nets.find((n) => n.pinIds.includes(drain.id)).id,
    analyze(p).nets.find((n) => n.pinIds.includes(pe.id)).id,
  );
  connect(p, drain.id, pe.id);
  const bonded = analyze(p).nets.find((n) => n.pinIds.includes(drain.id));
  assert.ok(bonded.pinIds.includes(pe.id));
  for (let index = 1; index <= 4; index++)
    assert.ok(
      !bonded.pinIds.includes(
        pins.find((pin) => pin.definitionPinId === `in${index}`).id,
      ),
    );
});

test("protective bonding clamp exposes three PE taps on one physical node without invented capacity", () => {
  const p = install("protective-bonding-clamp");
  const id = put(p, "protective-bonding-clamp");
  const pins = p.pins.filter((pin) => pin.symbolInstanceId === id);
  assert.equal(pins.length, 3);
  assert.equal(new Set(pins.map((pin) => pin.terminalId)).size, 1);
  const terminal = p.terminals.find((t) => t.id === pins[0].terminalId);
  assert.equal(terminal.kind, "pe");
  assert.equal(terminal.capacity, undefined);
  assert.equal(
    analyze(p).nets.find((n) => n.terminalIds.includes(terminal.id)).pinIds
      .length,
    3,
  );
});

test("plug and socket poles require an explicit mating connection and never short the other pole", () => {
  let p = install("plug-two-pole");
  p = installSymbol(p, "socket-two-pole");
  const plug = put(p, "plug-two-pole", 180),
    socket = put(p, "socket-two-pole", 270);
  const pin = (instance, name) =>
    p.pins.find(
      (pin) =>
        pin.symbolInstanceId === instance && pin.definitionPinId === name,
    );
  const a = pin(plug, "mate1"),
    b = pin(socket, "mate1");
  assert.notEqual(a.terminalId, b.terminalId);
  assert.equal(
    analyze(p).nets.filter(
      (n) => n.pinIds.includes(a.id) || n.pinIds.includes(b.id),
    ).length,
    2,
  );
  connect(p, a.id, b.id);
  const joined = analyze(p).nets.find((n) => n.pinIds.includes(a.id));
  assert.ok(joined.pinIds.includes(b.id));
  assert.equal(joined.pinIds.length, 4);
  assert.ok(!joined.pinIds.includes(pin(plug, "mate2").id));
  assert.ok(!joined.pinIds.includes(pin(socket, "mate2").id));
});
