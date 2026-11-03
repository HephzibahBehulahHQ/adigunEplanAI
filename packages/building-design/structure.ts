import { validateProject, type Project } from "../electrical-model/project.ts";

import { validateRoomBoundary } from "./rooms.ts";

export function addBuilding(
  project: Project,
  name: string,
  address: string,
): Project {
  const next = structuredClone(project);
  next.buildings.push({ id: crypto.randomUUID(), name, address });
  return validateProject(next);
}
export function addFloor(
  project: Project,
  buildingId: string,
  name: string,
  elevationMm: number,
  heightMm: number,
): Project {
  const next = structuredClone(project);
  next.floors.push({
    id: crypto.randomUUID(),
    buildingId,
    name,
    elevationMm,
    heightMm,
  });
  return validateProject(next);
}
export function addRectangularRoom(
  project: Project,
  floorId: string,
  name: string,
  xMm: number,
  yMm: number,
  widthMm: number,
  depthMm: number,
): Project {
  if (
    ![xMm, yMm, widthMm, depthMm].every(Number.isFinite) ||
    widthMm <= 0 ||
    depthMm <= 0 ||
    Math.max(Math.abs(xMm), Math.abs(yMm), widthMm, depthMm) > 1000000
  )
    throw new Error("Invalid room dimensions");
  const next = structuredClone(project);
  next.rooms.push({
    id: crypto.randomUUID(),
    floorId,
    name,
    boundary: validateRoomBoundary([
      { x: xMm, y: yMm },
      { x: xMm + widthMm, y: yMm },
      { x: xMm + widthMm, y: yMm + depthMm },
      { x: xMm, y: yMm + depthMm },
    ]),
  });
  return validateProject(next);
}
export function removeRoom(project: Project, roomId: string): Project {
  if (!project.rooms.some((r) => r.id === roomId))
    throw new Error("Unknown room");
  if (project.distributionBoards.some((b) => b.roomId === roomId))
    throw new Error("Room has an assigned board");
  if (project.planZones.some((z) => z.roomIds.includes(roomId)))
    throw new Error(
      "Room belongs to a plan zone; update or remove the zone first",
    );
  const next = structuredClone(project);
  next.rooms = next.rooms.filter((r) => r.id !== roomId);
  return validateProject(next);
}
