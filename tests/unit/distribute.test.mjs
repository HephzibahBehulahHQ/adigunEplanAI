import { test } from "node:test";
import assert from "node:assert/strict";
import { nativeProject } from "../fixtures/native-project.mjs";
import { distribute, place } from "../../packages/schematic-editor/commands.ts";
import { ProjectHistory } from "../../packages/electrical-model/history.ts";
import {
  validateProject,
  pinAnchor,
} from "../../packages/electrical-model/project.ts";

test("distribution preserves endpoints, connectivity and undo/redo", () => {
  const p = nativeProject();
  p.symbolInstances[0].position = { x: 50, y: 60 };
  p.symbolInstances[1].position = { x: 100, y: 60 };
  const id = place(p, "page", "layer", "resistor", { x: 200, y: 60 }, 5);
  const ids = ["symbol-a", "symbol-b", id];
  const history = new ProjectHistory(p);
  const result = history.execute((draft) => distribute(draft, ids, "x"));
  assert.deepEqual(
    ids.map((id) => result.symbolInstances.find((s) => s.id === id).position.x),
    [50, 125, 200],
  );
  assert.deepEqual(result.wires, p.wires);
  assert.deepEqual(
    result.wirePaths[0].points.at(-1),
    pinAnchor(result, "pin-b"),
  );
  validateProject(result);
  assert.equal(history.undo().symbolInstances[1].position.x, 100);
  assert.equal(history.redo().symbolInstances[1].position.x, 125);
  assert.equal(p.symbolInstances[1].position.x, 100);
});

test("distribution rejects locked layers without changing the source", () => {
  const p = nativeProject();
  const id = place(p, "page", "layer", "resistor", { x: 200, y: 20 }, 5);
  p.layers[0].locked = true;
  const before = JSON.stringify(p);
  assert.throws(() => distribute(p, ["symbol-a", "symbol-b", id], "x"));
  assert.equal(JSON.stringify(p), before);
});

test("vertical distribution rejects collisions atomically", () => {
  const p = nativeProject();
  const id = place(p, "page", "layer", "resistor", { x: 100, y: 70 }, 5);
  p.symbolInstances[0].position = { x: 100, y: 60 };
  p.symbolInstances[1].position = { x: 100, y: 80 };
  // End span cannot accommodate all three component bodies.
  p.symbolInstances[1].position.y = 64;
  const before = JSON.stringify(p);
  assert.throws(() => distribute(p, ["symbol-a", "symbol-b", id], "y"));
  assert.equal(JSON.stringify(p), before);
});
