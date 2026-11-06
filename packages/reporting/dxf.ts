import type { Project } from "../electrical-model/project.ts";
import { transform, type Point } from "../engineering-core/geometry.ts";

/** Bounded native 2D DXF, in millimetres. Y is inverted into CAD's upward axis. */
export function schematicDxf(project: Project, pageId: string): string {
  const page = project.pages.find((item) => item.id === pageId);
  if (!page) throw new Error("Unknown drawing page");
  const output: string[] = [];
  const clean = (value: string) =>
    Array.from(value, (character) => {
      const code = character.codePointAt(0)!;
      return code < 32 || code === 127 ? " " : character;
    }).join("");
  const pair = (code: number, value: string | number) => {
    if (typeof value === "number" && !Number.isFinite(value))
      throw new Error("Nonfinite drawing coordinate");
    output.push(
      String(code),
      typeof value === "string"
        ? clean(value)
        : String(Number(value.toFixed(10))),
    );
  };
  const section = (name: string) => {
    pair(0, "SECTION");
    pair(2, name);
  };
  let handle = 256;
  const nextHandle = () => pair(5, (handle++).toString(16).toUpperCase());
  const layers = project.layers.filter(
    (layer) => layer.pageId === pageId && layer.visible,
  );
  const layerNames = new Map<string, string>();
  const usedNames = new Set<string>(["0"]);
  for (const layer of layers) {
    const base =
      clean(layer.name)
        .replace(/[<>/\\":;?*|=]/g, "_")
        .trim()
        .slice(0, 180) || "Layer";
    let name = base,
      suffix = 1;
    while (usedNames.has(name.toLowerCase())) name = `${base}_${suffix++}`;
    usedNames.add(name.toLowerCase());
    layerNames.set(layer.id, name);
  }
  const entity = (type: string, subclass: string, layer: string) => {
    pair(0, type);
    pair(5, (handle++).toString(16).toUpperCase());
    pair(100, "AcDbEntity");
    pair(8, layer);
    pair(100, subclass);
  };
  const point = (p: Point, code = 10) => {
    pair(code, p.x);
    pair(code + 10, -p.y);
    pair(code + 20, 0);
  };
  const line = (a: Point, b: Point, layer: string) => {
    entity("LINE", "AcDbLine", layer);
    point(a);
    point(b, 11);
  };
  const circle = (center: Point, radius: number, layer: string) => {
    entity("CIRCLE", "AcDbCircle", layer);
    point(center);
    pair(40, radius);
  };
  const text = (
    value: string,
    at: Point,
    layer: string,
    height = 3,
    rotation = 0,
    mirrored = false,
    centered = false,
  ) => {
    const lines = value.split(/\r?\n/).flatMap((part) => {
      const chars = Array.from(part);
      const chunks: string[] = [];
      for (let i = 0; i < chars.length; i += 240)
        chunks.push(chars.slice(i, i + 240).join(""));
      return chunks.length ? chunks : [""];
    });
    lines.forEach((value, index) => {
      const insertion = { x: at.x, y: at.y + index * height * 1.4 };
      entity("TEXT", "AcDbText", layer);
      point(insertion);
      pair(40, height);
      pair(1, value);
      pair(50, -rotation);
      pair(7, "STANDARD");
      pair(71, mirrored ? 2 : 0);
      pair(72, centered ? 1 : 0);
      if (centered) point(insertion, 11);
      pair(100, "AcDbText");
      pair(73, 0);
    });
  };
  section("HEADER");
  pair(9, "$ACADVER");
  pair(1, "AC1021");
  pair(9, "$INSUNITS");
  pair(70, 4);
  pair(9, "$MEASUREMENT");
  pair(70, 1);
  pair(9, "$LUNITS");
  pair(70, 2);
  pair(9, "$EXTMIN");
  pair(10, 0);
  pair(20, -page.heightMm);
  pair(30, 0);
  pair(9, "$EXTMAX");
  pair(10, page.widthMm);
  pair(20, 0);
  pair(30, 0);
  pair(0, "ENDSEC");
  section("TABLES");
  pair(0, "TABLE");
  pair(2, "LTYPE");
  nextHandle();
  pair(100, "AcDbSymbolTable");
  pair(70, 1);
  pair(0, "LTYPE");
  nextHandle();
  pair(100, "AcDbSymbolTableRecord");
  pair(100, "AcDbLinetypeTableRecord");
  pair(2, "CONTINUOUS");
  pair(70, 0);
  pair(3, "Solid line");
  pair(72, 65);
  pair(73, 0);
  pair(40, 0);
  pair(0, "ENDTAB");
  pair(0, "TABLE");
  pair(2, "LAYER");
  nextHandle();
  pair(100, "AcDbSymbolTable");
  pair(70, layerNames.size + 1);
  for (const name of ["0", ...layerNames.values()]) {
    pair(0, "LAYER");
    nextHandle();
    pair(100, "AcDbSymbolTableRecord");
    pair(100, "AcDbLayerTableRecord");
    pair(2, name);
    pair(70, 0);
    pair(62, 7);
    pair(6, "CONTINUOUS");
  }
  pair(0, "ENDTAB");
  pair(0, "TABLE");
  pair(2, "STYLE");
  nextHandle();
  pair(100, "AcDbSymbolTable");
  pair(70, 1);
  pair(0, "STYLE");
  nextHandle();
  pair(100, "AcDbSymbolTableRecord");
  pair(100, "AcDbTextStyleTableRecord");
  pair(2, "STANDARD");
  pair(70, 0);
  pair(40, 0);
  pair(41, 1);
  pair(50, 0);
  pair(71, 0);
  pair(42, 3);
  pair(3, "txt");
  pair(4, "");
  pair(0, "ENDTAB");
  pair(0, "ENDSEC");
  section("ENTITIES");
  pair(
    999,
    `AdigunEplanAI native drawing: ${project.name} / ${page.name}; millimetres; CAD Y = -native Y.`,
  );
  for (const [id, name] of layerNames) pair(999, `Native layer ${id}: ${name}`);
  for (const path of project.wirePaths) {
    const layer = layerNames.get(path.layerId);
    if (path.pageId !== pageId || !layer) continue;
    pair(999, `Native wire ${path.wireId}`);
    entity("LWPOLYLINE", "AcDbPolyline", layer);
    pair(90, path.points.length);
    pair(70, 0);
    for (const p of path.points) {
      pair(10, p.x);
      pair(20, -p.y);
    }
  }
  for (const symbol of project.symbolInstances) {
    const layer = layerNames.get(symbol.layerId);
    if (symbol.pageId !== pageId || !layer) continue;
    const definition = project.symbolDefinitions.find(
      (item) => item.id === symbol.definitionId,
    )!;
    const device = project.devices.find((item) => item.id === symbol.deviceId)!;
    pair(999, `Native device ${device.id}; symbol ${symbol.id}`);
    const tr = (p: Point) =>
      transform(p, symbol.position, symbol.rotation, symbol.mirrored);
    const segment = (x1: number, y1: number, x2: number, y2: number) =>
      line(tr({ x: x1, y: y1 }), tr({ x: x2, y: y2 }), layer);
    const rect = (x: number, y: number, w: number, h: number) => {
      segment(x, y, x + w, y);
      segment(x + w, y, x + w, y + h);
      segment(x + w, y + h, x, y + h);
      segment(x, y + h, x, y);
    };
    if (definition.artwork) {
      for (const shape of definition.artwork)
        if (shape.kind === "line") line(tr(shape.from), tr(shape.to), layer);
        else circle(tr(shape.center), shape.radiusMm, layer);
    } else {
      switch (definition.glyph) {
        case "terminal":
          rect(-2, -2, 4, 4);
          break;
        case "junction":
          circle(tr({ x: 0, y: 0 }), 1.2, layer);
          break;
        case "resistor":
          segment(-10, 0, -6, 0);
          segment(6, 0, 10, 0);
          rect(-6, -2.5, 12, 5);
          break;
        case "fuse":
          segment(-10, 0, 10, 0);
          rect(-6, -2.5, 12, 5);
          break;
        case "contact":
          segment(-10, 0, -5, 0);
          segment(5, 0, 10, 0);
          segment(-5, 0, 4, -4);
          break;
        case "coil":
          segment(-9, 0, -5, 0);
          segment(5, 0, 9, 0);
          rect(-5, -4, 10, 8);
          break;
        case "lamp":
          circle(tr({ x: 0, y: 0 }), 5, layer);
          segment(-3.5, -3.5, 3.5, 3.5);
          segment(-3.5, 3.5, 3.5, -3.5);
          segment(-6, 0, -5, 0);
          segment(5, 0, 6, 0);
          break;
        case "motor":
          circle(tr({ x: 0, y: 0 }), 8, layer);
          segment(-9, 0, -8, 0);
          segment(8, 0, 9, 0);
          text(
            "M",
            tr({ x: 0, y: 1.5 }),
            layer,
            5,
            symbol.rotation,
            symbol.mirrored,
            true,
          );
          break;
        case "ground":
          segment(0, -6, 0, 0);
          segment(-5, 0, 5, 0);
          segment(-3, 2, 3, 2);
          segment(-1, 4, 1, 4);
          break;
        default:
          rect(
            -definition.widthMm / 2,
            -definition.heightMm / 2,
            definition.widthMm,
            definition.heightMm,
          );
      }
    }
    text(
      device.reference,
      {
        x: symbol.position.x,
        y: symbol.position.y - definition.heightMm / 2 - 2,
      },
      layer,
      3,
      0,
      false,
      true,
    );
  }
  for (const note of project.annotations) {
    const layer = layerNames.get(note.layerId);
    if (note.pageId === pageId && layer) text(note.text, note.position, layer);
  }
  pair(0, "ENDSEC");
  pair(0, "EOF");
  return output.join("\r\n") + "\r\n";
}
