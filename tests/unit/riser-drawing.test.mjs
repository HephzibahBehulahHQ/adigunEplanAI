import { test } from "node:test";
import assert from "node:assert/strict";
import { nativeProject } from "../fixtures/native-project.mjs";
import { riserElevationSvg } from "../../packages/building-design/riser-drawing.ts";
const labels = {
  title: "Elevation",
  note: "Documented vertical geometry only",
  start: "Start",
  end: "End",
  length: "Vertical length",
};
function fixture() {
  const p = nativeProject();
  p.buildings.push({ id: "b", name: "Building", address: "" });
  p.floors.push(
    {
      id: "f0",
      name: "Ground",
      buildingId: "b",
      elevationMm: 0,
      heightMm: 3000,
    },
    {
      id: "f1",
      name: "Upper",
      buildingId: "b",
      elevationMm: 3000,
      heightMm: 3000,
    },
  );
  p.architecturalLayers.push(
    ...["f0", "f1"].map((floorId) => ({
      id: `l-${floorId}`,
      name: "Electrical",
      floorId,
      kind: "electrical",
      visible: true,
      locked: false,
    })),
  );
  p.planRisers.push({
    id: "r",
    name: "R1",
    kind: "cable",
    position: { x: 1012.5, y: -986.25 },
    start: { floorId: "f0", layerId: "l-f0", heightMm: 100 },
    end: { floorId: "f1", layerId: "l-f1", heightMm: 200 },
  });
  return p;
}
test("riser elevation exports exact native heights and a proportional vertical route", () => {
  const p = fixture(),
    before = JSON.stringify(p),
    svg = riserElevationSvg(p, "r", labels);
  assert.match(svg, /width="297mm" height="210mm"/);
  assert.match(
    svg,
    /data-start-elevation-mm="100" data-end-elevation-mm="3200" data-vertical-length-m="3.1"/,
  );
  assert.match(svg, /M 400 452.1875 V 210/);
  assert.match(svg, /X 1012.5 mm · Y -986.25 mm/);
  assert.equal(JSON.stringify(p), before);
  assert.throws(() => riserElevationSvg(p, "missing", labels), /Unknown/);
});
test("riser elevations support reversed and below-ground routes with escaped labels", () => {
  const p = fixture();
  p.floors[0].elevationMm = -3000;
  [p.planRisers[0].start, p.planRisers[0].end] = [
    p.planRisers[0].end,
    p.planRisers[0].start,
  ];
  p.planRisers[0].name = '<script> & "route"';
  const svg = riserElevationSvg(p, "r", {
    ...labels,
    note: '<image href="external"/>',
  });
  assert.match(
    svg,
    /data-start-elevation-mm="3200" data-end-elevation-mm="-2900" data-vertical-length-m="6.1"/,
  );
  assert.doesNotMatch(svg, /<script>|<image|NaN|Infinity/);
  assert.match(svg, /&lt;script&gt;/);
});
