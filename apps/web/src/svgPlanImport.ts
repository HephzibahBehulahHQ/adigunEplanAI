import type { PlanImport } from "../../../packages/building-design/plan-import.ts";
const numberPattern = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
function numbers(value: string): number[] {
  const parts = value.trim().split(/[\s,]+/);
  if (parts.some((p) => !numberPattern.test(p)))
    throw new Error("Invalid numeric geometry");
  return parts.map(Number);
}
// Source XML is inspected as inert data; it is never inserted into the live DOM.
export function parseSvgPlan(
  text: string,
  sourceFile: string,
  mmPerUnit: number,
): PlanImport {
  if (new TextEncoder().encode(text).length > 1024 * 1024)
    throw new Error("SVG exceeds 1 MiB");
  if (!Number.isFinite(mmPerUnit) || mmPerUnit <= 0 || mmPerUnit > 1000000)
    throw new Error("Invalid millimetres per SVG user unit");
  if (/<!DOCTYPE|<!ENTITY/i.test(text))
    throw new Error("XML declarations/entities are not supported");
  const doc = new DOMParser().parseFromString(text, "image/svg+xml"),
    root = doc.documentElement;
  if (
    doc.querySelector("parsererror") ||
    root.localName !== "svg" ||
    root.namespaceURI !== "http://www.w3.org/2000/svg"
  )
    throw new Error("Invalid SVG document");
  const all = [root, ...root.querySelectorAll("*")];
  if (all.length > 10000) throw new Error("SVG exceeds 10000 elements");
  if (
    all.some(
      (e) =>
        [
          "style",
          "script",
          "foreignObject",
          "image",
          "use",
          "animate",
          "set",
          "animateTransform",
          "animateMotion",
        ].includes(e.localName) ||
        Array.from(e.attributes).some(
          (a) => /^on/i.test(a.name) || a.localName === "href",
        ),
    )
  )
    throw new Error("Active, linked or embedded SVG content is not supported");
  const result: PlanImport = { sourceFile, mmPerUnit, shapes: [], issues: [] };
  function visit(e: Element, layer: string, depth: number) {
    if (depth > 64) throw new Error("SVG nesting exceeds 64 levels");
    const label = (e.getAttribute("id") || e.localName).slice(0, 160);
    if (["title", "desc", "metadata"].includes(e.localName)) return;
    // Unsupported styling/transforms affect descendants, so skip the whole subtree.
    if (
      [
        "transform",
        "style",
        "class",
        "clip-path",
        "mask",
        "display",
        "visibility",
      ].some((a) => e.hasAttribute(a))
    ) {
      result.issues.push(
        `${label}: styling/transform/visibility subtree skipped`,
      );
      return;
    }
    if (e === root || e.localName === "g") {
      const nextLayer =
        e === root
          ? layer
          : (
              e.getAttribute("label") ||
              e.getAttribute("inkscape:label") ||
              e.getAttribute("id") ||
              layer
            ).slice(0, 160);
      for (const child of e.children) visit(child, nextLayer, depth + 1);
      return;
    }
    try {
      if (e.namespaceURI !== root.namespaceURI)
        throw new Error("foreign namespace");
      const value = (name: string, defaultValue?: number) => {
        const raw = e.getAttribute(name);
        if (raw === null && defaultValue !== undefined) return defaultValue;
        if (raw === null || !numberPattern.test(raw.trim()))
          throw new Error(`unsupported ${name} value/unit`);
        return Number(raw);
      };
      let points: { x: number; y: number }[] = [],
        closed = false;
      if (e.localName === "line")
        points = [
          { x: value("x1", 0), y: value("y1", 0) },
          { x: value("x2", 0), y: value("y2", 0) },
        ];
      else if (e.localName === "polyline" || e.localName === "polygon") {
        const list = numbers(e.getAttribute("points") || "");
        if (list.length % 2) throw new Error("odd coordinate count");
        points = Array.from({ length: list.length / 2 }, (_, i) => ({
          x: list[2 * i],
          y: list[2 * i + 1],
        }));
        closed = e.localName === "polygon";
      } else if (e.localName === "rect") {
        if (value("rx", 0) !== 0 || value("ry", 0) !== 0)
          throw new Error("rounded rectangle");
        const x = value("x", 0),
          y = value("y", 0),
          w = value("width"),
          h = value("height");
        if (w <= 0 || h <= 0) throw new Error("nonpositive rectangle");
        points = [
          { x, y },
          { x: x + w, y },
          { x: x + w, y: y + h },
          { x, y: y + h },
        ];
        closed = true;
      } else throw new Error(`unsupported ${e.localName}`);
      points = points.map((p) => ({ x: p.x * mmPerUnit, y: p.y * mmPerUnit }));
      if (
        points.length < (closed ? 3 : 2) ||
        points.length > 10000 ||
        points.some(
          (p) =>
            !Number.isFinite(p.x) ||
            !Number.isFinite(p.y) ||
            Math.abs(p.x) > 1000000 ||
            Math.abs(p.y) > 1000000,
        )
      )
        throw new Error("geometry exceeds native limits");
      if (points.every((p) => p.x === points[0].x && p.y === points[0].y))
        throw new Error("zero-length geometry");
      result.shapes.push({ name: label, layer, points, closed });
    } catch (error) {
      result.issues.push(
        `${label}: ${error instanceof Error ? error.message : "unsupported geometry"}`,
      );
    }
  }
  visit(root, "SVG", 0);
  if (result.shapes.length > 2000)
    throw new Error("SVG exceeds 2000 supported shapes");
  return result;
}
