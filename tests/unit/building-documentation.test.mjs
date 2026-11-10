import { test } from "node:test";
import assert from "node:assert/strict";
import { nativeProject } from "../fixtures/native-project.mjs";
import {
  addBuilding,
  addFloor,
} from "../../packages/building-design/structure.ts";
import { addPlanLayer } from "../../packages/building-design/walls.ts";
import { createFloorDevice } from "../../packages/building-design/floor-devices.ts";
import {
  saveDistributionBoard,
  savePlanCircuit,
} from "../../packages/building-design/circuits.ts";
import {
  buildingDocumentation,
  buildingSingleLineSvg,
} from "../../packages/building-design/documentation.ts";
import { csvReport } from "../../packages/reporting/csv.ts";
import { connect } from "../../packages/schematic-editor/commands.ts";

function fixture() {
  let p = addBuilding(nativeProject(), "Workshop", "");
  p = addFloor(p, p.buildings[0].id, "Ground <office>", 0, 3000);
  p = addPlanLayer(p, p.floors[0].id, "Power", "electrical");
  for (const [kind, reference] of [
    ["distribution-board-l-n-pe", "DB1"],
    ["luminaire-l-n-pe", "EL1"],
  ]) {
    p = createFloorDevice(
      p,
      {
        kind,
        reference,
        description: reference,
        pageId: "page",
        floorId: p.floors[0].id,
        layerId: p.architecturalLayers[0].id,
        position: { x: 1000, y: 1000 },
        rotation: 0,
        symbolScale: 20,
      },
      0,
    );
  }
  p = saveDistributionBoard(p, {
    name: "Panel A",
    floorId: p.floors[0].id,
    deviceId: p.devices.at(-2).id,
  });
  p = savePlanCircuit(p, {
    name: 'C1 <script>alert("x")</script>',
    floorId: p.floors[0].id,
    layerId: p.architecturalLayers[0].id,
    boardId: p.distributionBoards[0].id,
    deviceIds: [p.devices.at(-1).id],
    voltageV: 230,
    phases: 1,
    loads: [],
  });
  return p;
}

test("building documentation preserves native assignments and distinguishes unknown loads from zero", () => {
  const p = fixture();
  const snapshot = JSON.stringify(p);
  const report = buildingDocumentation(p, p.floors[0].id);
  assert.equal(report.boards[0].reference, "DB1");
  assert.deepEqual(
    report.boards[0].circuits[0].devices.map((d) => d.reference),
    ["EL1"],
  );
  assert.equal(report.boards[0].circuits[0].totalConnectedLoadW, null);
  assert.equal(report.boards[0].circuits[0].unknownLoadCount, 1);
  assert.equal(report.earthing.length, 2);
  assert.ok(report.earthing.every((row) => row.wireIds.length === 0));
  assert.equal(JSON.stringify(p), snapshot);
  p.circuits[0].loads = [{ deviceId: p.devices.at(-1).id, activePowerW: 0 }];
  assert.equal(
    buildingDocumentation(p, p.floors[0].id).boards[0].circuits[0]
      .totalConnectedLoadW,
    0,
  );
  assert.throws(() => buildingDocumentation(p, "missing"), /Unknown/);
});

test("earthing report lists only actually drawn native wires and does not infer bonding", () => {
  const p = fixture();
  const pe = p.terminals.filter((terminal) => terminal.kind === "pe");
  const pins = pe.map((terminal) =>
    p.pins.find((pin) => pin.terminalId === terminal.id),
  );
  connect(p, pins[0].id, pins[1].id);
  const report = buildingDocumentation(p, p.floors[0].id);
  assert.equal(report.earthing.length, 2);
  assert.ok(report.earthing.every((row) => row.wireIds.length === 1));
  assert.equal(report.earthing[0].wireIds[0], report.earthing[1].wireIds[0]);
});

test("single-line export escapes hostile labels and CSV neutralizes spreadsheet formulas", () => {
  const p = fixture();
  const svg = buildingSingleLineSvg(p, p.floors[0].id, {
    title: "Assignments",
    note: "No inferred wiring",
    unknown: "Unknown",
  });
  assert.match(svg, /&lt;script&gt;/);
  assert.doesNotMatch(svg, /<script>/);
  assert.match(svg, /data-board-id=/);
  assert.match(svg, /No inferred wiring/);
  assert.match(svg.replace(/<[^>]*>/g, ""), /0 W \+ Unknown/);
  assert.equal(
    csvReport([["=1+1", "+SUM(A1)", "-cmd", "@SUM(A1)", 'x,"y"', null, -3]]),
    '\uFEFF"\'=1+1","\'+SUM(A1)","\'-cmd","\'@SUM(A1)","x,""y""","","-3"\r\n',
  );
});
