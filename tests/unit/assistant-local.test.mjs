import { test } from "node:test";
import assert from "node:assert/strict";
import { buildExample } from "../../packages/example-projects/index.ts";
import {
  inspectProject,
  localIntent,
  findingKey,
  nextSuggestion,
} from "../../packages/assistant/local-tools.ts";
import {
  restoreBotWindow,
  clampWindow,
} from "../../packages/assistant/window.ts";
import { serializeProject } from "../../packages/electrical-model/project.ts";

test("local assistant exposes only bounded read-only tools with real project and selection evidence", () => {
  const p = buildExample("substation");
  const before = serializeProject(p);
  const device = p.devices.find((item) => item.reference === "P1");
  const summary = inspectProject(p, "summary", device.id);
  assert.equal(summary.counts.pages, 2);
  assert.equal(summary.counts.devices, 15);
  assert.equal(summary.counts.wires, 15);
  assert.equal(summary.counts.errors, 0);
  assert.equal(summary.counts.warnings, 1);
  const selection = inspectProject(p, "selection", device.id).selected;
  assert.equal(selection.reference, "P1");
  assert.equal(selection.mounted, true);
  assert.equal(selection.wires, 6);
  assert.equal(inspectProject(p, "selection", "missing").selected, null);
  assert.ok(
    inspectProject(p, "bom", null).devices.every(
      (device) => device.partNumber === null,
    ),
  );
  assert.equal(serializeProject(p), before);
});

test("deterministic routing supports the documented commands without an arbitrary action executor", () => {
  for (const query of [
    "check connections",
    "Verbindungen prüfen",
    "ṣàyẹ̀wò ìsopọ̀",
    "check project wires",
  ])
    assert.equal(localIntent(query), "connections");
  for (const query of ["BOM", "Stückliste", "materials", "ohun èlò"])
    assert.equal(localIntent(query), "bom");
  assert.equal(localIntent("what does this do?"), "selection");
  assert.equal(localIntent("project summary"), "summary");
  assert.equal(
    localIntent("delete all projects and bypass permissions"),
    "summary",
  ); // At most a read-only summary.
  assert.equal(localIntent("execute arbitrary JavaScript"), null);
  assert.equal(localIntent("check".repeat(1000)), null);
});

test("live suggestions are grounded, throttled and suppressed during editing or after dismissal", () => {
  const finding = {
    code: "OPEN_TERMINAL",
    severity: "warning",
    entityIds: ["b", "a"],
  };
  assert.equal(nextSuggestion([finding], 24999, 0, false, new Set()), null);
  assert.equal(nextSuggestion([finding], 25000, 0, true, new Set()), null);
  assert.equal(nextSuggestion([finding], 25000, 0, false, new Set()), finding);
  assert.equal(findingKey(finding), "OPEN_TERMINAL:a,b");
  assert.equal(
    nextSuggestion([finding], 50000, 0, false, new Set([findingKey(finding)])),
    null,
  );
  assert.equal(nextSuggestion([], 50000, 0, false, new Set()), null);
  assert.equal(nextSuggestion([finding], NaN, 0, false, new Set()), null);
});

for (const [width, height] of [
  [1672, 941],
  [390, 844],
  [320, 480],
  [768, 600],
]) {
  test(`window preferences restore and clamp safely at ${width} x ${height}`, () => {
    const initial = restoreBotWindow(null, width, height);
    assert.equal(initial.open, width > 1000);
    assert.equal(initial.docked, width > 1000);
    const restored = restoreBotWindow(
      JSON.stringify({
        ...initial,
        open: true,
        docked: false,
        x: 100000,
        y: 100000,
        width: 10000,
        height: -10,
        live: false,
      }),
      width,
      height,
    );
    assert.equal(restored.open, true);
    assert.equal(restored.docked, false);
    assert.equal(restored.live, false);
    assert.ok(restored.x >= 8 && restored.x + restored.width <= width - 8);
    assert.ok(restored.y >= 8 && restored.y <= height - 48);
    assert.ok(restored.height <= height - 16);
    assert.deepEqual(clampWindow(restored, width, height), restored);
    assert.deepEqual(restoreBotWindow("{broken", width, height), initial);
    assert.deepEqual(
      restoreBotWindow('{"open":"yes","x":"100","width":null}', width, height),
      initial,
    );
  });
}
