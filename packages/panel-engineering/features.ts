import { validateProject, type Project } from "../electrical-model/project.ts";
import type { PanelEnvelope, Vector3 } from "./geometry.ts";

export type PanelFeature = NonNullable<
  Project["enclosures"][number]["features"]
>[number];
export type PanelFace = PanelFeature["face"];
export const panelFaces: PanelFace[] = [
  "back",
  "front",
  "left",
  "right",
  "top",
  "bottom",
];

/** Face U/V axes: back/front X/Y, left/right Z/Y, top/bottom X/Z. */
export function panelFaceSize(enclosure: PanelEnvelope, face: PanelFace) {
  return {
    widthMm:
      face === "left" || face === "right"
        ? enclosure.depthMm
        : enclosure.widthMm,
    heightMm:
      face === "top" || face === "bottom"
        ? enclosure.depthMm
        : enclosure.heightMm,
  };
}

export function facePoint3d(
  enclosure: PanelEnvelope,
  face: PanelFace,
  u: number,
  v: number,
): Vector3 {
  switch (face) {
    case "back":
      return { x: u, y: v, z: 0 };
    case "front":
      return { x: u, y: v, z: enclosure.depthMm };
    case "left":
      return { x: 0, y: v, z: u };
    case "right":
      return { x: enclosure.widthMm, y: v, z: u };
    case "top":
      return { x: u, y: 0, z: v };
    case "bottom":
      return { x: u, y: enclosure.heightMm, z: v };
  }
}

/** Positions are face centres. Outlines annotate machining intent; no shell is cut. */
export function featureOutline(
  feature: PanelFeature,
): { x: number; y: number }[] {
  const { x, y } = feature.positionMm;
  if (feature.shape === "circle")
    return Array.from({ length: 49 }, (_, index) => {
      const angle = (index * 2 * Math.PI) / 48;
      return {
        x: x + (feature.widthMm / 2) * Math.cos(angle),
        y: y + (feature.heightMm / 2) * Math.sin(angle),
      };
    });
  const left = x - feature.widthMm / 2;
  const right = x + feature.widthMm / 2;
  const top = y - feature.heightMm / 2;
  const bottom = y + feature.heightMm / 2;
  return [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
    { x: left, y: top },
  ];
}

export function featureVertices(
  enclosure: PanelEnvelope,
  feature: PanelFeature,
): Vector3[] {
  return featureOutline(feature).map((point) =>
    facePoint3d(enclosure, feature.face, point.x, point.y),
  );
}

export function savePanelFeature(
  project: Project,
  enclosureId: string,
  input: Omit<PanelFeature, "id">,
  id?: string,
): Project {
  const next = structuredClone(project);
  const enclosure = next.enclosures.find((item) => item.id === enclosureId);
  if (!enclosure) throw new Error("Unknown enclosure");
  const features = enclosure.features ?? [];
  if (id && !features.some((feature) => feature.id === id))
    throw new Error("Unknown enclosure feature");
  const record = { ...structuredClone(input), id: id ?? crypto.randomUUID() };
  enclosure.features = id
    ? features.map((feature) => (feature.id === id ? record : feature))
    : [...features, record];
  return validateProject(next);
}

export function removePanelFeature(
  project: Project,
  enclosureId: string,
  id: string,
): Project {
  const next = structuredClone(project);
  const enclosure = next.enclosures.find((item) => item.id === enclosureId);
  if (!enclosure?.features?.some((feature) => feature.id === id))
    throw new Error("Unknown enclosure feature");
  enclosure.features = enclosure.features.filter(
    (feature) => feature.id !== id,
  );
  return validateProject(next);
}

const xml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[character]!,
  );

function wrapWords(value: string, columns: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of value.split(/\s+/)) {
    if (line && line.length + word.length + 1 > columns) {
      lines.push(line);
      line = "";
    }
    let rest = word;
    while (rest.length > columns) {
      if (line) {
        lines.push(line);
        line = "";
      }
      lines.push(rest.slice(0, columns));
      rest = rest.slice(columns);
    }
    line += `${line ? " " : ""}${rest}`;
  }
  if (line) lines.push(line);
  return lines;
}

export function panelFaceSvg(
  project: Project,
  enclosureId: string,
  face: PanelFace,
  note: string,
): string {
  const enclosure = project.enclosures.find((item) => item.id === enclosureId);
  if (!enclosure) throw new Error("Unknown enclosure");
  const size = panelFaceSize(enclosure, face);
  const features = (enclosure.features ?? []).filter(
    (feature) => feature.face === face,
  );
  const drawingWidth = Math.max(250, size.widthMm);
  const columns = Math.max(20, Math.floor(drawingWidth / 5));
  const title = `${enclosure.name} — ${face}: ${size.widthMm} × ${size.heightMm} mm`;
  const titleLines = wrapWords(title, Math.floor(drawingWidth / 6));
  const notes = [
    ...features.flatMap((feature, index) =>
      wrapWords(
        `${index + 1}. ${feature.name}: U=${feature.positionMm.x}, V=${feature.positionMm.y}; ${feature.widthMm} × ${feature.heightMm} mm`,
        columns,
      ),
    ),
    ...wrapWords(note, columns),
  ];
  const topMargin = titleLines.length * 14 + 15;
  const height = topMargin + size.heightMm + 45 + notes.length * 11;
  const drawings = features
    .map((feature, index) => {
      const { x, y } = feature.positionMm;
      const shape =
        feature.shape === "circle"
          ? `<circle cx="${x}" cy="${y}" r="${feature.widthMm / 2}"/>`
          : `<rect x="${x - feature.widthMm / 2}" y="${y - feature.heightMm / 2}" width="${feature.widthMm}" height="${feature.heightMm}"/>`;
      return `<g data-panel-feature="${xml(feature.id)}" fill="none" stroke="#0b1220" stroke-width="0.5">${shape}<path d="M${x - 3},${y}h6 M${x},${y - 3}v6"/></g><text x="${x + feature.widthMm / 2 + 2}" y="${y}" font-size="8">${index + 1}</text>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${drawingWidth + 100}mm" height="${height}mm" viewBox="-50 ${-topMargin} ${drawingWidth + 100} ${height}"><title>${xml(title)}</title><desc>${xml(note)}</desc><rect x="0" y="0" width="${size.widthMm}" height="${size.heightMm}" fill="white" stroke="#0b1220"/>${drawings}${titleLines.map((line, index) => `<text x="0" y="${-topMargin + 15 + index * 14}" font-size="10">${xml(line)}</text>`).join("")}${notes.map((line, index) => `<text x="0" y="${size.heightMm + 25 + index * 11}" font-size="8">${xml(line)}</text>`).join("")}</svg>`;
}
