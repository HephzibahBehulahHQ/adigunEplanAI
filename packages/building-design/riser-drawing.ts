import type { Project } from "../electrical-model/project.ts";
import { riserSchedule } from "./risers.ts";
import { xmlText } from "./documentation.ts";

/** A dimensioned elevation of one documented route, never an inferred conductor. */
export function riserElevationSvg(
  project: Project,
  riserId: string,
  labels: {
    title: string;
    note: string;
    start: string;
    end: string;
    length: string;
  },
) {
  const riser = project.planRisers.find((item) => item.id === riserId);
  const row = riserSchedule(project).find((item) => item.id === riserId);
  if (!riser || !row) throw new Error("Unknown riser");
  const start = project.floors.find((item) => item.id === riser.start.floorId)!;
  const end = project.floors.find((item) => item.id === riser.end.floorId)!;
  const elevations = [
    start.elevationMm,
    end.elevationMm,
    row.startElevationMm,
    row.endElevationMm,
  ];
  const low = Math.min(...elevations),
    high = Math.max(...elevations);
  const y = (elevation: number) =>
    460 - ((elevation - low) / (high - low)) * 250;
  const value = (mm: number) => `${Number((mm / 1000).toPrecision(9))} m`;
  const wrap = (text: string, length: number) => {
    const chars = Array.from(text);
    return Array.from(
      { length: Math.max(1, Math.ceil(chars.length / length)) },
      (_, i) => chars.slice(i * length, (i + 1) * length).join(""),
    );
  };
  const text = (x: number, at: number, value: string, size = 13) =>
    `<text x="${x}" y="${at}" font-size="${size}" fill="#102035">${xmlText(value)}</text>`;
  const title = wrap(`${labels.title} · ${riser.name}`, 72)
    .map((line, i) => text(24, 28 + i * 20, line, 17))
    .join("");
  const names = [
    `${labels.start}: ${start.name} · ${value(start.elevationMm)}`,
    `${labels.end}: ${end.name} · ${value(end.elevationMm)}`,
  ];
  const legend = names
    .map((name, index) =>
      wrap(name, 47)
        .map((line, i) => text(24 + index * 400, 100 + i * 16, line))
        .join(""),
    )
    .join("");
  const floorLines = [start, end]
    .map(
      (floor, index) =>
        `<g data-floor-id="${xmlText(floor.id)}"><path d="M 70 ${y(floor.elevationMm)} H 730" stroke="#64748b" stroke-dasharray="6 4"/><circle cx="${90 + index * 25}" cy="${y(floor.elevationMm)}" r="10" fill="white" stroke="#64748b"/>${text(86 + index * 25, y(floor.elevationMm) + 4, String(index + 1), 11)}</g>`,
    )
    .join("");
  const startY = y(row.startElevationMm),
    endY = y(row.endElevationMm);
  const endpoints = [
    { name: labels.start, elevation: row.startElevationMm, at: startY, x: 420 },
    { name: labels.end, elevation: row.endElevationMm, at: endY, x: 160 },
  ]
    .map(
      (point) =>
        `<circle cx="400" cy="${point.at}" r="5" fill="white" stroke="#2563eb"/>${text(point.x, point.at - 8, `${point.name}: ${value(point.elevation)}`)}`,
    )
    .join("");
  const footer = wrap(labels.note, 105)
    .map((line, i) => text(24, 520 + i * 15, line, 11))
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="297mm" height="210mm" viewBox="0 0 840 594" role="img"><title>${xmlText(labels.title + " · " + riser.name)}</title><rect width="840" height="594" fill="white"/><g font-family="sans-serif">${title}${legend}${floorLines}<g data-riser-id="${xmlText(riser.id)}" data-start-elevation-mm="${row.startElevationMm}" data-end-elevation-mm="${row.endElevationMm}" data-vertical-length-m="${row.verticalLengthM}"><path d="M 400 ${startY} V ${endY}" fill="none" stroke="#2563eb" stroke-width="4"/>${endpoints}</g>${text(24, 490, `${labels.length}: ${value(Math.abs(row.endElevationMm - row.startElevationMm))} · X ${riser.position.x} mm · Y ${riser.position.y} mm`)}${footer}</g></svg>`;
}
