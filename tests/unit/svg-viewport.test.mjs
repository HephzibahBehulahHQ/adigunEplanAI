import { test } from "node:test";
import assert from "node:assert/strict";
import {
  svgLengthPx,
  svgViewportMatrix as viewport,
  mmPerCssPixel as mm,
} from "../../packages/building-design/svg-viewport.ts";
import {
  transformPoint as apply,
  multiplyAffine,
  parseSvgTransform,
} from "../../packages/building-design/svg-transform.ts";
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
test("SVG absolute physical units convert through 96 CSS pixels per inch", () => {
  for (const unit of [
    "96px",
    "25.4mm",
    "2.54cm",
    "1in",
    "72pt",
    "6pc",
    "101.6Q",
    "96",
  ])
    near(svgLengthPx(unit) * mm, 25.4);
});
test("physical viewport mapping preserves viewBox origin and meet alignment", () => {
  const matrix = viewport("400mm", "300mm", "10 20 40 30", null);
  let p = apply(matrix, { x: 50, y: 50 });
  near(p.x * mm, 400);
  near(p.y * mm, 300);
  p = apply(matrix, { x: 10, y: 20 });
  near(p.x, 0);
  near(p.y, 0);
  const centered = viewport("200mm", "100mm", "0 0 100 100", null);
  p = apply(centered, { x: 0, y: 0 });
  near(p.x * mm, 50);
  near(p.y * mm, 0);
  const aligned = viewport("200mm", "100mm", "0 0 100 100", "xMaxYMin meet");
  p = apply(aligned, { x: 0, y: 0 });
  near(p.x * mm, 100);
  near(p.y * mm, 0);
});
test("none and slice map supported geometry without inventing clipping", () => {
  let p = apply(viewport("200mm", "100mm", "0 0 100 100", "none"), {
    x: 100,
    y: 100,
  });
  near(p.x * mm, 200);
  near(p.y * mm, 100);
  p = apply(viewport("200mm", "100mm", "0 0 100 100", "xMidYMid slice"), {
    x: 0,
    y: 0,
  });
  near(p.x * mm, 0);
  near(p.y * mm, -50);
  const matrix = multiplyAffine(
    parseSvgTransform("translate(96 0)"),
    viewport("1in", "1in", "0 0 10 10", null),
  );
  p = apply(matrix, { x: 10, y: 10 });
  near(p.x * mm, 50.8);
  near(p.y * mm, 25.4);
});
test("unresolved, malformed and nonpositive viewports are rejected", () => {
  for (const value of [null, "100%", "1em", "1m", "0mm", "-2px", "1e309px"])
    assert.throws(() => svgLengthPx(value));
  for (const box of ["0 0 0 2", "0 0 -1 2", "0 0 2", "0,,0 2 3", "0 0 1e309 2"])
    assert.throws(() => viewport("100mm", "100mm", box, null));
  assert.throws(() =>
    viewport("100mm", "100mm", "0 0 10 10", "defer xMidYMid meet"),
  );
});
