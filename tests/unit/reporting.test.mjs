import { test } from "node:test";
import assert from "node:assert/strict";
import { nativeProject } from "../fixtures/native-project.mjs";
import {
  projectReport,
  reportKinds,
  reportHtml,
} from "../../packages/reporting/reports.ts";
import {
  schematicSvg,
  printDocument,
} from "../../packages/reporting/drawings.ts";
import {
  calculate,
  calculationToRecord,
} from "../../packages/engineering-core/calculations.ts";

test("calculation reports replay the saved method and preserve unsupported versions", () => {
  const p = nativeProject();
  p.calculations.push(
    calculationToRecord(
      calculate(
        "ohms-law",
        { voltage: 12, resistance: 4 },
        { voltage: "V", resistance: "ohm" },
      ),
      "calc",
      "Bench supply",
    ),
  );
  const before = JSON.stringify(p);
  const row = projectReport(p, "calculations", (key) => `label:${key}`).rows[0];
  assert.match(row[4], /3 A/);
  assert.match(row[4], /36 W/);
  assert.match(row[6], /https:\/\//);
  assert.equal(JSON.stringify(p), before);
  p.calculations[0].methodReference += ":unknown-version";
  const unsupported = projectReport(p, "calculations", (key) => `label:${key}`)
    .rows[0];
  assert.equal(unsupported[4], "label:reportCalculationUnavailable");
  assert.equal(unsupported[1], p.calculations[0].methodReference);
});

test("BOM aggregates assigned native part identity and retains unspecified parts", () => {
  const p = nativeProject();
  p.manufacturerParts.push({
    id: "fixture-part",
    name: "Fixture terminal",
    manufacturer: "Test fixture",
    partNumber: "F-1",
    sourceUrl: "https://example.org/fixture",
    ratings: {},
  });
  p.devices.forEach((device) => {
    device.partId = "fixture-part";
  });
  assert.deepEqual(projectReport(p, "bom").rows, [
    ["Test fixture", "F-1", 2, "Xa; Xb"],
  ]);
  delete p.devices[1].partId;
  const rows = projectReport(p, "bom").rows;
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[1], [null, null, 1, "Xb"]);
});

test("reports preserve native endpoints, physical unknown lengths and source identities", () => {
  const p = nativeProject();
  const before = JSON.stringify(p);
  const rows = projectReport(p, "connections").rows;
  assert.equal(rows.length, 1);
  assert.equal(rows[0][1], "Xa:1");
  assert.equal(rows[0][2], "Xb:1");
  assert.equal(rows[0][3], null);
  assert.equal(projectReport(p, "terminals").rows.length, 2);
  assert.deepEqual(projectReport(p, "drawings").rows[0].slice(3), [420, 297]);
  for (const kind of reportKinds)
    assert.ok(Array.isArray(projectReport(p, kind).rows));
  assert.equal(JSON.stringify(p), before);
});

test("drawing export retains physical size, transforms and native paths while excluding hidden layers", () => {
  const p = nativeProject();
  p.devices[0].reference = '<script>alert("x")</script>';
  p.symbolInstances[0].rotation = 90;
  p.symbolInstances[0].mirrored = true;
  let svg = schematicSvg(p, "page");
  assert.match(svg, /width="420mm" height="297mm"/);
  assert.match(svg, /rotate\(90\) scale\(-1 1\)/);
  assert.match(svg, /data-wire-id="wire"/);
  assert.doesNotMatch(svg, /<script>/);
  assert.match(svg, /&lt;script&gt;/);
  p.layers[0].visible = false;
  svg = schematicSvg(p, "page");
  assert.doesNotMatch(svg, /data-wire-id|data-device-id/);
  assert.throws(() => schematicSvg(p, "absent"), /Unknown/);
});

test("print documents use true paper millimetres and escape report labels and cell content", () => {
  const html = reportHtml(
    "<img src=x>",
    { columns: ["label"], rows: [["<script>bad</script>", "A&B"]] },
    () => "<title>",
  );
  assert.doesNotMatch(html, /<script>|<img|<title>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /A&amp;B/);
  const printable = printDocument("<script>title</script>", html, {
    widthMm: 420,
    heightMm: 297,
  });
  assert.match(printable, /@page\{size:420mm 297mm;margin:0/);
  assert.match(printable, /<meta charset="utf-8">/);
  assert.doesNotMatch(printable, /<script>/);
});
