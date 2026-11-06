import type { Project } from "../electrical-model/project.ts";
import { circuitSchedule } from "./circuits.ts";

/** Derived assignment documentation. Branches never imply conductor connectivity. */
export function buildingDocumentation(project: Project, floorId: string) {
  const floor = project.floors.find((item) => item.id === floorId);
  if (!floor) throw new Error("Unknown documentation floor");
  const schedule = circuitSchedule(project, floorId);
  const boards = project.distributionBoards
    .filter((board) => board.floorId === floorId)
    .map((board) => ({
      ...board,
      reference: project.devices.find((d) => d.id === board.deviceId)!
        .reference,
      circuits: project.circuits
        .filter(
          (circuit) =>
            circuit.boardId === board.id && circuit.floorId === floorId,
        )
        .map((circuit) => ({
          ...schedule.find((row) => row.id === circuit.id)!,
          devices: circuit.deviceIds.map((id) => {
            const device = project.devices.find((item) => item.id === id)!;
            return { id, reference: device.reference, name: device.name };
          }),
        })),
    }));
  const placedDevices = new Set(
    project.planEquipment
      .filter((item) => item.floorId === floorId)
      .map(
        (item) =>
          project.symbolInstances.find(
            (symbol) => symbol.id === item.symbolInstanceId,
          )!.deviceId,
      ),
  );
  const earthing = project.terminals
    .filter(
      (terminal) =>
        terminal.kind === "pe" && placedDevices.has(terminal.deviceId),
    )
    .map((terminal) => {
      const pinIds = new Set(
        project.pins
          .filter((pin) => pin.terminalId === terminal.id)
          .map((pin) => pin.id),
      );
      const wires = project.wires.filter(
        (wire) => pinIds.has(wire.fromPinId) || pinIds.has(wire.toPinId),
      );
      return {
        terminalId: terminal.id,
        device: project.devices.find((d) => d.id === terminal.deviceId)!
          .reference,
        terminal: terminal.designation,
        wireIds: wires.map((wire) => wire.id),
        wireNames: wires.map((wire) => wire.name),
      };
    });
  return { floor, boards, earthing };
}

export const xmlText = (value: string) =>
  Array.from(value, (character) => {
    const code = character.codePointAt(0)!;
    return code === 9 ||
      code === 10 ||
      code === 13 ||
      (code >= 32 && code <= 0xd7ff) ||
      (code >= 0xe000 && code <= 0xfffd) ||
      (code >= 0x10000 && code <= 0x10ffff)
      ? character
      : "\ufffd";
  })
    .join("")
    .replace(
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

export function buildingSingleLineSvg(
  project: Project,
  floorId: string,
  labels: { title: string; note: string; unknown: string },
) {
  const { floor, boards } = buildingDocumentation(project, floorId);
  const wrap = (value: string, width: number) => {
    const chars = Array.from(value);
    return Array.from(
      { length: Math.max(1, Math.ceil(chars.length / width)) },
      (_, i) => chars.slice(i * width, (i + 1) * width).join(""),
    );
  };
  const titleLines = wrap(labels.title + " · " + floor.name, 68);
  const noteLines = wrap(labels.note, 110);
  let y = 25 + titleLines.length * 22 + noteLines.length * 16 + 32;
  const elements: string[] = [];
  const text = (x: number, at: number, value: string, size = 13) =>
    `<text x="${x}" y="${at}" font-size="${size}" fill="#102035">${xmlText(value)}</text>`;
  for (const board of boards) {
    const boardLines = wrap(board.reference + " · " + board.name, 90);
    const boardHeight = 22 + boardLines.length * 18;
    const boardY = y + boardHeight - 21;
    elements.push(
      `<g data-board-id="${xmlText(board.id)}"><rect x="24" y="${y - 21}" width="700" height="${boardHeight}" fill="#eef3ff" stroke="#102035"/>${boardLines.map((line, i) => text(32, y + i * 18, line)).join("")}</g>`,
    );
    y += boardHeight + 28;
    for (const circuit of board.circuits) {
      const load =
        circuit.totalConnectedLoadW === null
          ? `${circuit.knownConnectedLoadW} W + ${labels.unknown}`
          : `${circuit.totalConnectedLoadW} W`;
      const detailLines = wrap(
        `${circuit.name} · ${circuit.voltageV} V · ${circuit.phases}~ · ${load}`,
        58,
      );
      const deviceLines = wrap(
        circuit.devices.map((device) => device.reference).join(", "),
        68,
      );
      const circuitHeight = (detailLines.length + deviceLines.length) * 18 + 12;
      elements.push(
        `<g data-circuit-id="${xmlText(circuit.id)}"><path d="M 44 ${boardY} V ${y} H 244" fill="none" stroke="#2563eb"/><rect x="244" y="${y - 19}" width="480" height="${circuitHeight}" fill="white" stroke="#102035"/>${detailLines.map((line, i) => text(252, y - 2 + i * 18, line)).join("")}${deviceLines.map((line, i) => text(252, y - 2 + (i + detailLines.length) * 18, line, 11)).join("")}</g>`,
      );
      y += circuitHeight + 18;
    }
    y += 24;
  }
  const height = Math.max(150, y + 20);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="297mm" height="${((height * 297) / 780).toFixed(3)}mm" viewBox="0 0 780 ${height}" role="img"><title>${xmlText(labels.title + " · " + floor.name)}</title><rect width="780" height="${height}" fill="white"/><g font-family="sans-serif">${titleLines.map((line, i) => text(24, 25 + i * 22, line, 17)).join("")}${noteLines.map((line, i) => text(24, 25 + titleLines.length * 22 + i * 16, line, 11)).join("")}${elements.join("")}</g></svg>`;
}
