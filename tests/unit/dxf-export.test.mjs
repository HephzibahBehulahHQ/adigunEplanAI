import { test } from "node:test";
import assert from "node:assert/strict";
import DxfParser from "dxf-parser";
import { nativeProject } from "../fixtures/native-project.mjs";
import { schematicDxf } from "../../packages/reporting/dxf.ts";

const parse = (project) =>
  new DxfParser().parseSync(schematicDxf(project, "page"));
test("native DXF independently parses in millimetres with exact wire geometry and layer names", () => {
  const p = nativeProject(),
    before = JSON.stringify(p);
  const dxf = parse(p);
  assert.equal(dxf.header.$INSUNITS, 4);
  assert.equal(dxf.header.$ACADVER, "AC1021");
  assert.deepEqual(dxf.header.$EXTMIN, { x: 0, y: -297, z: 0 });
  assert.deepEqual(dxf.header.$EXTMAX, { x: 420, y: 0, z: 0 });
  const wire = dxf.entities.find((item) => item.type === "LWPOLYLINE");
  assert.equal(wire.layer, "Electrical");
  assert.deepEqual(
    wire.vertices.map(({ x, y }) => [x, y]),
    [
      [10, -20],
      [50, -20],
    ],
  );
  assert.equal(dxf.entities.filter((item) => item.type === "LINE").length, 8);
  assert.deepEqual(
    dxf.entities
      .filter((item) => item.type === "TEXT")
      .map((item) => item.text),
    ["Xa", "Xb"],
  );
  assert.equal(JSON.stringify(p), before);
  p.layers[0].visible = false;
  assert.equal(parse(p).entities.length, 0);
  assert.throws(() => schematicDxf(p, "absent"), /Unknown/);
});

test("DXF preserves transformed custom lines and true circles instead of bounding boxes", () => {
  const p = nativeProject();
  p.symbolDefinitions[0].artwork = [
    { kind: "line", from: { x: 0, y: 0 }, to: { x: 3, y: 1 } },
    { kind: "circle", center: { x: 2, y: 1 }, radiusMm: 0.5 },
  ];
  p.symbolInstances[0].rotation = 90;
  p.symbolInstances[0].mirrored = true;
  const dxf = parse(p);
  const line = dxf.entities.find((e) => e.type === "LINE");
  assert.deepEqual(line.vertices, [
    { x: 10, y: -20, z: 0 },
    { x: 9, y: -17, z: 0 },
  ]);
  const circles = dxf.entities.filter((e) => e.type === "CIRCLE");
  assert.deepEqual(circles[0].center, { x: 9, y: -18, z: 0 });
  assert.equal(circles[0].radius, 0.5);
  assert.equal(circles.length, 2);
});

test("DXF bounds text records, preserves Unicode and prevents control-line injection", () => {
  const p = nativeProject();
  p.name = "Project\r\n0\r\nEOF";
  p.devices[0].reference = "Ọ̀pọ̀ · Ä";
  p.layers[0].name = "Bad/layer\n0";
  p.layers.push({ ...p.layers[0], id: "other", name: "bad_layer 0" });
  p.annotations.push({
    id: "note",
    name: "Note",
    pageId: "page",
    layerId: "layer",
    position: { x: 15, y: 60 },
    text: "First\n0\nEOF\n" + "é".repeat(500),
  });
  const raw = schematicDxf(p, "page"),
    dxf = parse(p);
  assert.equal(raw.split("\r\n0\r\nEOF\r\n").length, 2);
  const texts = dxf.entities
    .filter((e) => e.type === "TEXT")
    .map((e) => e.text);
  assert.equal(texts[0], "Ọ̀pọ̀ · Ä");
  assert.ok(texts.every((text) => Array.from(text).length <= 240));
  assert.deepEqual(texts.slice(2, 5), ["First", "0", "EOF"]);
  assert.equal(texts.slice(5).join(""), "é".repeat(500));
  assert.ok(Object.keys(dxf.tables.layer.layers).includes("Bad_layer 0"));
  assert.ok(Object.keys(dxf.tables.layer.layers).includes("bad_layer 0_1"));
});
