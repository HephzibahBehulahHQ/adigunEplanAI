import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { engineeringSymbols } from "../../packages/component-library/symbols.ts";
import { primitives } from "../../packages/schematic-editor/commands.ts";
import { eplanDefinitions } from "../../scripts/export-eplan-symbols.mjs";

const context = vm.createContext({});
for (const file of ["eplan-symbols.js", "cad-engine.js"]) {
  vm.runInContext(fs.readFileSync(`apps/web/public/${file}`, "utf8"), context);
}
const engine = context.AdigunCADEngine;
const plain = (value) => JSON.parse(JSON.stringify(value));

test("all 83 original symbols retain artwork, dimensions and pin identities", () => {
  assert.equal(eplanDefinitions.length, 83);
  assert.equal(new Set(eplanDefinitions.map((s) => s.id)).size, 83);
  for (const original of engineeringSymbols) {
    const actual = engine.component(`eplan-${original.id}`);
    assert.deepEqual(plain(actual.symbol.artwork), original.artwork);
    assert.equal(actual.symbol.width, original.width);
    assert.equal(actual.symbol.height, original.height);
    assert.deepEqual(
      plain(
        actual.symbol.pins.map((p) => ({
          id: p.id,
          position: { x: p.x, y: p.y },
        })),
      ),
      original.pins.map((p) => ({ id: p.id, position: p.position })),
    );
    if (original.connectionClass === "mechanical")
      assert.equal(actual.symbol.pins.length, 0);
  }
  for (const [id, original] of Object.entries(primitives)) {
    const actual = engine.component(`eplan-${id}`);
    assert.equal(actual.symbol.width, original.w);
    assert.equal(actual.symbol.height, original.h);
    assert.deepEqual(
      plain(
        actual.symbol.pins.map((p) => ({
          id: p.id,
          position: { x: p.x, y: p.y },
        })),
      ),
      original.pins.map((p) => ({ id: p.id, position: p.position })),
    );
    assert.ok(actual.symbol.artwork.length);
  }
});

test("original symbols place, rotate, move and round-trip without invented manufacturer data", () => {
  const objects = eplanDefinitions.map((def, i) => {
    assert.ok(engine.catalog().some((item) => item.id === def.id));
    const instance = engine.createInstance(def.id, 20, 30, `U${i + 1}`);
    assert.equal(engine.validateInstance(instance).valid, true);
    engine.rotateInstance(instance, 90);
    engine.moveInstance(instance, 40, 50);
    engine.worldPins(instance).forEach((pin, j) => {
      const original = def.symbol.pins[j];
      assert.equal(pin.id, original.id);
      assert.ok(Math.abs(pin.x - (40 - original.y)) < 1e-8);
      assert.ok(Math.abs(pin.y - (50 + original.x)) < 1e-8);
    });
    assert.equal(engine.billOfMaterials([instance]).valid, false);
    assert.deepEqual(def.symbol.internalConnections, []);
    return instance;
  });
  const restored = engine.parseProject(
    engine.serializeProject({ sheets: [{ id: "sheet-1" }], objects }),
  );
  assert.equal(restored.valid, true, restored.errors.join(" "));
  assert.deepEqual(plain(restored.project.objects), plain(objects));
  assert.ok(
    engine.catalog().some((item) => !item.id.startsWith("eplan-")),
    "existing manufacturer library is preserved",
  );
});
