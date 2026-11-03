import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseSvgTransform as parse,
  transformPoint as apply,
  multiplyAffine as multiply,
} from "../../packages/building-design/svg-transform.ts";
const near = (a, b) => {
  assert.ok(Math.abs(a.x - b.x) < 1e-9, `${a.x} != ${b.x}`);
  assert.ok(Math.abs(a.y - b.y) < 1e-9, `${a.y} != ${b.y}`);
};
test("SVG transform lists and nested groups preserve noncommutative order", () => {
  near(apply(parse("translate(10,20) scale(2,3)"), { x: 4, y: 5 }), {
    x: 18,
    y: 35,
  });
  near(apply(parse("scale(2,3) translate(10 20)"), { x: 4, y: 5 }), {
    x: 28,
    y: 75,
  });
  near(
    apply(multiply(parse("translate(100 50)"), parse("rotate(90)")), {
      x: 10,
      y: 0,
    }),
    { x: 100, y: 60 },
  );
  near(apply(parse("matrix(2 0 0 -3 10 20)"), { x: 4, y: 5 }), { x: 18, y: 5 });
});
test("SVG rotations around a center, skews, reflections and exponent parameters retain geometry", () => {
  near(apply(parse("rotate(90 10 20)"), { x: 11, y: 20 }), { x: 10, y: 21 });
  near(apply(parse("skewX(45)"), { x: 2, y: 3 }), { x: 5, y: 3 });
  near(apply(parse("skewY(-45)"), { x: 2, y: 3 }), { x: 2, y: 1 });
  near(apply(parse("translate(1e2 -2e1), scale(-2)"), { x: 4, y: 5 }), {
    x: 92,
    y: -30,
  });
  near(apply(parse(null), { x: 1, y: 2 }), { x: 1, y: 2 });
});
test("malformed, unsupported, unbounded and singular transforms fail explicitly", () => {
  for (const value of [
    "translate()",
    "translate(1,,2)",
    "translate(,1)",
    "translate(1,)",
    "translate(1),",
    "translate(1) junk",
    "translate(1px)",
    "rotate(1 2)",
    "scale(0)",
    "matrix(1 2 2 4 0 0)",
    "matrix(1 2)",
    "skewX(90)",
    "skewY(-270)",
    "skewX(1 2)",
    "translate(1e309)",
    "scale(1e308) scale(1e308)",
    "rotateX(10)",
    "translate(1)".repeat(257),
    " ".repeat(16384) + "scale(1)",
    " ".repeat(16385),
  ]) {
    assert.throws(() => parse(value), undefined, value);
  }
});
