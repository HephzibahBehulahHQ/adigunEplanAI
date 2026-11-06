import type { Project } from "../electrical-model/project.ts";
import { xmlText } from "../building-design/documentation.ts";

function glyph(kind: string, width: number, height: number) {
  const path = (d: string) => `<path d="${d}"/>`;
  const rect = (x: number, y: number, w: number, h: number) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`;
  switch (kind) {
    case "terminal":
      return rect(-2, -2, 4, 4);
    case "junction":
      return '<circle r="1.2" fill="#102035"/>';
    case "resistor":
      return path("M-10 0H-6 M6 0H10") + rect(-6, -2.5, 12, 5);
    case "fuse":
      return path("M-10 0H10") + rect(-6, -2.5, 12, 5);
    case "contact":
      return path("M-10 0H-5 M5 0H10 M-5 0L4 -4");
    case "coil":
      return path("M-9 0H-5 M5 0H9") + rect(-5, -4, 10, 8);
    case "lamp":
      return (
        '<circle r="5"/>' +
        path("M-3.5 -3.5L3.5 3.5 M-3.5 3.5L3.5 -3.5 M-6 0H-5 M5 0H6")
      );
    case "motor":
      return (
        '<circle r="8"/>' +
        path("M-9 0H-8 M8 0H9") +
        '<text y="1.5" text-anchor="middle" font-size="5" stroke="none" fill="#102035">M</text>'
      );
    case "ground":
      return path("M0 -6V0 M-5 0H5 M-3 2H3 M-1 4H1");
    default:
      return rect(-width / 2, -height / 2, width, height);
  }
}

/** Physical millimetre export of the persisted visible layers, without editor UI. */
export function schematicSvg(project: Project, pageId: string) {
  const page = project.pages.find((item) => item.id === pageId);
  if (!page) throw new Error("Unknown drawing page");
  const visible = new Set(
    project.layers
      .filter((layer) => layer.pageId === pageId && layer.visible)
      .map((layer) => layer.id),
  );
  const wires = project.wirePaths
    .filter((wire) => wire.pageId === pageId && visible.has(wire.layerId))
    .map(
      (wire) =>
        `<polyline data-wire-id="${xmlText(wire.wireId)}" points="${wire.points.map((point) => `${point.x},${point.y}`).join(" ")}" fill="none" stroke="${project.wires.find((item) => item.id === wire.wireId)?.color ?? "#102035"}" stroke-width="0.35"/>`,
    )
    .join("");
  const symbols = project.symbolInstances
    .filter((symbol) => symbol.pageId === pageId && visible.has(symbol.layerId))
    .map((symbol) => {
      const definition = project.symbolDefinitions.find(
        (item) => item.id === symbol.definitionId,
      )!;
      const device = project.devices.find(
        (item) => item.id === symbol.deviceId,
      )!;
      const art =
        definition.artwork
          ?.map((shape) =>
            shape.kind === "line"
              ? `<line x1="${shape.from.x}" y1="${shape.from.y}" x2="${shape.to.x}" y2="${shape.to.y}"/>`
              : `<circle cx="${shape.center.x}" cy="${shape.center.y}" r="${shape.radiusMm}"/>`,
          )
          .join("") ??
        glyph(definition.glyph, definition.widthMm, definition.heightMm);
      return `<g data-device-id="${xmlText(device.id)}" transform="translate(${symbol.position.x} ${symbol.position.y})"><g transform="rotate(${symbol.rotation}) scale(${symbol.mirrored ? -1 : 1} 1)" fill="none" stroke="#102035" stroke-width="0.35">${art}</g><text y="${-definition.heightMm / 2 - 2}" font-size="3" fill="#102035" text-anchor="middle">${xmlText(device.reference)}</text></g>`;
    })
    .join("");
  const notes = project.annotations
    .filter((note) => note.pageId === pageId && visible.has(note.layerId))
    .map(
      (note) =>
        `<text x="${note.position.x}" y="${note.position.y}" font-size="3" fill="#102035">${xmlText(note.text)}</text>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${page.widthMm}mm" height="${page.heightMm}mm" viewBox="0 0 ${page.widthMm} ${page.heightMm}"><title>${xmlText(project.name + " · " + page.name)}</title><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif">${wires}${symbols}${notes}</g></svg>`;
}

export function printDocument(
  title: string,
  content: string,
  paper?: { widthMm: number; heightMm: number },
) {
  // content is generated only by the escaped native SVG/table report builders.
  const size = paper
    ? `${paper.widthMm}mm ${paper.heightMm}mm`
    : "A4 landscape";
  return `<!doctype html><html><head><meta charset="utf-8"><title>${xmlText(title)}</title><style>@page{size:${size};margin:${paper ? 0 : "12mm"}}*{box-sizing:border-box}body{margin:0;color:#102035;background:#fff;font:11pt system-ui,sans-serif}h1{font-size:18pt}table{border-collapse:collapse;width:100%;font-size:9pt}th,td{border:1px solid #9aa8b8;padding:5px;text-align:left;overflow-wrap:anywhere}thead{display:table-header-group}tr{break-inside:avoid}svg{display:block;max-width:100%;height:auto}p{overflow-wrap:anywhere}</style></head><body>${content}</body></html>`;
}
