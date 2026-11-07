import { test } from "node:test";
import assert from "node:assert/strict";
import { annotationLayout } from "../../packages/reporting/annotation-layout.ts";
import { schematicSvg } from "../../packages/reporting/drawings.ts";
import { nativeProject } from "../fixtures/native-project.mjs";

test("native annotation wrapping retains explicit lines, spaces and combining Unicode without changing project text", () => {
  const text =
    "Yorùbá: ṣa\u0301yẹ̀wò  ìsopọ̀ & <wires>\nSecond paragraph\n\n" +
    "LongWord".repeat(30);
  const layout = annotationLayout(text, 20, 30, 210, 297);
  assert.ok(layout.lines.length > 4);
  assert.equal(layout.lines.join(""), text.replaceAll("\n", ""));
  assert.ok(layout.lines.every((line) => !/^\p{M}/u.test(line)));
  assert.equal(layout.overflow, false);
  const p = nativeProject();
  p.annotations.push({
    id: "note",
    name: "Multiline",
    pageId: "page",
    layerId: "layer",
    position: { x: 20, y: 30 },
    text,
  });
  const before = JSON.stringify(p);
  const svg = schematicSvg(p, "page");
  assert.ok(svg.includes('<tspan x="20" dy="0">'));
  assert.ok(svg.includes("&amp; &lt;wires&gt;"));
  assert.equal(JSON.stringify(p), before);
});

test("out-of-sheet annotation overflow is explicit and full text remains available", () => {
  const text = "Line 1\nLine 2\nLine 3";
  assert.equal(annotationLayout(text, 10, 270, 420, 297).overflow, true);
  const p = nativeProject();
  p.annotations.push({
    id: "overflow",
    name: "Note",
    pageId: "page",
    layerId: "layer",
    position: { x: 10, y: 270 },
    text,
  });
  const svg = schematicSvg(p, "page");
  assert.ok(svg.includes('data-overflow="true"'));
  assert.ok(svg.includes("Line 3</tspan>"));
  assert.throws(() => annotationLayout(text, 0, 0, NaN, 297), /Invalid/);
});
