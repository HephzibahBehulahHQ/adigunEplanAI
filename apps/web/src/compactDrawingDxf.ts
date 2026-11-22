type Point = { x: number; y: number };
type Source = { element: SVGElement; points?: Point[] };

const ns = "http://www.w3.org/2000/svg";
const number = "[-+]?(?:\\d*\\.\\d+|\\d+\\.?)(?:[eE][-+]?\\d+)?";
const straightPath = new RegExp(
  `^M\\s*(${number})[ ,]+(${number})\\s*L\\s*(${number})[ ,]+(${number})$`,
  "i",
);

function pathOutlines(path: SVGPathElement): Point[][] {
  const data = path.getAttribute("d") ?? "";
  const straight = data.trim().match(straightPath);
  if (straight && data.includes("M") && data.includes("L")) {
    const [, x1, y1, x2, y2] = straight.map(Number);
    return [
      [
        { x: x1, y: y1 },
        { x: x2, y: y2 },
      ],
    ];
  }
  const sample = document.createElementNS(ns, "path");
  let previous: Point = { x: 0, y: 0 };
  return (data.match(/[Mm][^Mm]*/g) ?? []).map((part) => {
    sample.setAttribute(
      "d",
      part.startsWith("m") ? `M${previous.x} ${previous.y}${part}` : part,
    );
    const length = sample.getTotalLength();
    const count = Math.min(512, Math.max(1, Math.ceil(length / 2)));
    previous = sample.getPointAtLength(length);
    return Array.from({ length: count + 1 }, (_, index) =>
      sample.getPointAtLength((index * length) / count),
    );
  });
}

export function compactDrawingDxf(
  drawing: SVGSVGElement,
  sources: Source[],
  millimetres: boolean,
): string {
  const records: string[] = [];
  const pair = (code: number, value: string | number) => {
    if (typeof value === "number" && !Number.isFinite(value))
      throw new Error("Nonfinite DXF geometry");
    const text =
      typeof value === "string"
        ? Array.from(value, (character) =>
            character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127
              ? " "
              : character,
          ).join("")
        : String(Number(value.toFixed(9)));
    records.push(String(code), text);
  };
  const section = (name: string) => {
    pair(0, "SECTION");
    pair(2, name);
  };
  const layer = (element: SVGElement) =>
    (element.dataset.layer ?? "0").replace(/[^A-Za-z0-9_-]/g, "_");
  let nextHandle = 256;
  const handle = () => pair(5, (nextHandle++).toString(16).toUpperCase());
  const entity = (kind: string, type: string, name: string) => {
    pair(0, kind);
    handle();
    pair(100, "AcDbEntity");
    pair(8, name);
    pair(100, type);
  };
  const point = ({ x, y }: Point, code = 10) => {
    pair(code, x);
    pair(code + 10, -y);
  };
  const outline = (points: Point[], name: string, closed = false) => {
    const distinct = points.filter(
      (p, index) =>
        !index || p.x !== points[index - 1].x || p.y !== points[index - 1].y,
    );
    if (distinct.length < 2) return;
    if (distinct.length === 2 && !closed) {
      entity("LINE", "AcDbLine", name);
      point(distinct[0]);
      point(distinct[1], 11);
    } else {
      entity("LWPOLYLINE", "AcDbPolyline", name);
      pair(90, distinct.length);
      pair(70, Number(closed));
      distinct.forEach((p) => point(p));
    }
  };
  section("HEADER");
  pair(9, "$ACADVER");
  pair(1, "AC1021");
  pair(9, "$INSUNITS");
  pair(70, millimetres ? 4 : 0);
  pair(0, "ENDSEC");
  section("TABLES");
  pair(0, "TABLE");
  pair(2, "LAYER");
  handle();
  pair(100, "AcDbSymbolTable");
  const layers = new Set([
    "0",
    ...sources.map(({ element }) => layer(element)),
  ]);
  pair(70, layers.size);
  for (const name of layers) {
    pair(0, "LAYER");
    handle();
    pair(100, "AcDbSymbolTableRecord");
    pair(100, "AcDbLayerTableRecord");
    pair(2, name);
    pair(70, 0);
    pair(62, 7);
    pair(6, "CONTINUOUS");
  }
  pair(0, "ENDTAB");
  pair(0, "ENDSEC");
  section("ENTITIES");
  const rootMatrix = drawing.getScreenCTM()?.inverse();
  if (!rootMatrix) throw new Error("Drawing transform unavailable");
  for (const { element, points } of sources) {
    const name = layer(element);
    if (element.dataset.object)
      pair(999, `Drawing object ${element.dataset.object}`);
    if (points) {
      outline(points, name);
      continue;
    }
    const selector = "path,line,rect,circle,ellipse,polyline,polygon,text";
    const primitives = element.matches(selector)
      ? [element]
      : [...element.querySelectorAll<SVGElement>(selector)];
    for (const primitive of primitives) {
      const node = primitive as SVGGraphicsElement;
      const style = getComputedStyle(node);
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.opacity === "0" ||
        node.classList.contains("component-hit-target") ||
        (style.fill === "none" &&
          (style.stroke === "none" || style.stroke === "rgba(0, 0, 0, 0)"))
      )
        continue;
      const screen = node.getScreenCTM();
      if (!screen) continue;
      const matrix = rootMatrix.multiply(screen);
      const world = ({ x, y }: Point) =>
        new DOMPoint(x, y).matrixTransform(matrix);
      const send = (points: Point[], closed = false) =>
        outline(points.map(world), name, closed);
      const attr = (key: string) => Number(node.getAttribute(key));
      switch (node.localName) {
        case "path":
          pathOutlines(node as SVGPathElement).forEach((path) => send(path));
          break;
        case "line":
          send([
            { x: attr("x1"), y: attr("y1") },
            { x: attr("x2"), y: attr("y2") },
          ]);
          break;
        case "polyline":
        case "polygon":
          send(
            Array.from((node as SVGPolylineElement).points),
            node.localName === "polygon",
          );
          break;
        case "rect": {
          const x = attr("x"),
            y = attr("y"),
            w = attr("width"),
            h = attr("height");
          send(
            [
              { x, y },
              { x: x + w, y },
              { x: x + w, y: y + h },
              { x, y: y + h },
            ],
            true,
          );
          break;
        }
        case "circle":
        case "ellipse": {
          const x = attr("cx"),
            y = attr("cy"),
            rx = attr("r") || attr("rx"),
            ry = attr("r") || attr("ry");
          const sx = Math.hypot(matrix.a, matrix.b),
            sy = Math.hypot(matrix.c, matrix.d);
          if (
            rx > 0 &&
            rx === ry &&
            Math.abs(sx - sy) < 1e-9 &&
            Math.abs(matrix.a * matrix.c + matrix.b * matrix.d) < 1e-9
          ) {
            entity("CIRCLE", "AcDbCircle", name);
            point(world({ x, y }));
            pair(40, rx * sx);
          } else
            send(
              Array.from({ length: 96 }, (_, index) => {
                const angle = (index * Math.PI) / 48;
                return {
                  x: x + rx * Math.cos(angle),
                  y: y + ry * Math.sin(angle),
                };
              }),
              true,
            );
          break;
        }
        case "text": {
          const lines = node.children.length ? [...node.children] : [node];
          for (const line of lines) {
            const text = line as SVGTextContentElement,
              value = text.textContent?.trim();
            if (!value || !text.getNumberOfChars()) continue;
            const p = world(text.getStartPositionOfChar(0));
            entity("TEXT", "AcDbText", name);
            point(p);
            pair(
              40,
              (parseFloat(style.fontSize) || 12) *
                Math.hypot(matrix.c, matrix.d),
            );
            pair(1, value.slice(0, 240));
            pair(50, (-Math.atan2(matrix.b, matrix.a) * 180) / Math.PI);
            pair(100, "AcDbText");
            pair(73, 0);
          }
        }
      }
    }
  }
  pair(0, "ENDSEC");
  pair(0, "EOF");
  return records.join("\r\n") + "\r\n";
}
