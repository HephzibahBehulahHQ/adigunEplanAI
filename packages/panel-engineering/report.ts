import type { Project } from "../electrical-model/project.ts";
import {
  panelDiagnostics,
  projectedUtilization,
  volumeBounds,
  boxVertices,
  boxEdges,
} from "./geometry.ts";
import { featureOutline } from "./features.ts";

export function panelReport(project: Project, enclosureId: string) {
  const enclosure = project.enclosures.find((item) => item.id === enclosureId);
  if (!enclosure) throw new Error("Unknown enclosure");
  const structures = project.panelStructures.filter(
    (item) => item.enclosureId === enclosureId,
  );
  const equipment = project.equipment3d
    .filter((item) => item.enclosureId === enclosureId)
    .map((item) => {
      const device = project.devices.find(
        (device) => device.id === item.deviceId,
      )!;
      const part = project.manufacturerParts.find(
        (part) => part.id === device.partId,
      );
      return {
        ...item,
        reference: device.reference,
        description: device.name,
        manufacturer: part?.manufacturer ?? "",
        partNumber: part?.partNumber ?? "",
        bounds: volumeBounds(item),
      };
    });
  return {
    enclosure,
    structures,
    equipment,
    diagnostics: panelDiagnostics(enclosure, equipment, structures),
    utilization: projectedUtilization(enclosure, equipment),
  };
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

export function panelLayoutSvg(
  project: Project,
  enclosureId: string,
  note: string,
): string {
  const { enclosure, structures, equipment } = panelReport(
    project,
    enclosureId,
  );
  const padding = 50;
  const shapes = [...structures, ...equipment]
    .map((item) => {
      const bounds = volumeBounds(item);
      const reference = "reference" in item ? item.reference : item.name;
      const outlined =
        "kind" in item && ["door", "compartment"].includes(item.kind);
      return `<g data-panel-object="${xml(item.id)}"><rect x="${bounds.min.x}" y="${bounds.min.y}" width="${bounds.max.x - bounds.min.x}" height="${bounds.max.y - bounds.min.y}" fill="${outlined ? "none" : "kind" in item ? "#d9e2ec" : "#dbeafe"}" stroke="#0b1220" stroke-width="1" ${outlined ? 'stroke-dasharray="4 2"' : ""}/><text x="${bounds.min.x + 2}" y="${bounds.min.y + 12}" font-size="10">${xml(reference)}</text></g>`;
    })
    .join("");
  const features = (enclosure.features ?? [])
    .filter((feature) => feature.face === "back" || feature.face === "front")
    .map(
      (feature) =>
        `<polyline data-panel-feature="${xml(feature.id)}" points="${featureOutline(
          feature,
        )
          .map((point) => `${point.x},${point.y}`)
          .join(" ")}" fill="none" stroke="#047857" stroke-width="1"/>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${enclosure.widthMm + padding * 2}mm" height="${enclosure.heightMm + padding * 2}mm" viewBox="${-padding} ${-padding} ${enclosure.widthMm + padding * 2} ${enclosure.heightMm + padding * 2}"><title>${xml(enclosure.name)}</title><desc>${xml(note)}</desc><rect x="0" y="0" width="${enclosure.widthMm}" height="${enclosure.heightMm}" fill="white" stroke="#0b1220" stroke-width="2"/>${shapes}${features}<text x="0" y="-20" font-size="14">${xml(enclosure.name)} — ${enclosure.widthMm} × ${enclosure.heightMm} × ${enclosure.depthMm} mm</text><text x="0" y="${enclosure.heightMm + 25}" font-size="10">${xml(note)}</text></svg>`;
}

/** Generic cuboids in millimetres, no enclosure shell or manufacturer B-rep. */
export function panelGeometryObj(
  project: Project,
  enclosureId: string,
): string {
  const { structures, equipment } = panelReport(project, enclosureId);
  const lines = [
    "# AdigunEplanAI generic cuboids; millimetres; X right, Y down, Z back to front",
    "# No manufacturer CAD, mounting details or enclosure shell are implied",
  ];
  let offset = 0;
  for (const item of [...structures, ...equipment]) {
    lines.push(`o ${item.id.replace(/[^A-Za-z0-9_-]/g, "_")}`);
    for (const vertex of boxVertices(volumeBounds(item)))
      lines.push(`v ${vertex.x} ${vertex.y} ${vertex.z}`);
    if ("kind" in item && item.kind === "compartment") {
      lines.push(
        "# Named compartment region only; no solid partitions implied",
      );
      for (const edge of boxEdges)
        lines.push(`l ${edge.map((index) => index + offset + 1).join(" ")}`);
      offset += 8;
      continue;
    }
    for (const face of [
      [1, 4, 3, 2],
      [5, 6, 7, 8],
      [1, 5, 8, 4],
      [2, 3, 7, 6],
      [1, 2, 6, 5],
      [4, 8, 7, 3],
    ])
      lines.push(`f ${face.map((index) => index + offset).join(" ")}`);
    offset += 8;
  }
  return `${lines.join("\n")}\n`;
}
