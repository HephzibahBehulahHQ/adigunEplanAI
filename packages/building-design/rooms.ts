import type { Point } from "../engineering-core/geometry.ts";
import { validateProject, type Project } from "../electrical-model/project.ts";
const cross = (a: Point, b: Point, c: Point) =>
  (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y;
const onSegment = (a: Point, b: Point, p: Point) =>
  Math.abs(cross(a, b, p)) <= 1e-8 &&
  p.x >= Math.min(a.x, b.x) &&
  p.x <= Math.max(a.x, b.x) &&
  p.y >= Math.min(a.y, b.y) &&
  p.y <= Math.max(a.y, b.y);
function intersects(a: Point, b: Point, c: Point, d: Point) {
  const abC = cross(a, b, c),
    abD = cross(a, b, d),
    cdA = cross(c, d, a),
    cdB = cross(c, d, b);
  return (
    (Math.sign(abC) * Math.sign(abD) < 0 &&
      Math.sign(cdA) * Math.sign(cdB) < 0) ||
    onSegment(a, b, c) ||
    onSegment(a, b, d) ||
    onSegment(c, d, a) ||
    onSegment(c, d, b)
  );
}
export function validateRoomBoundary(input: readonly Point[]): Point[] {
  if (input.length < 3 || input.length > 257)
    throw new Error("Room requires 3–256 vertices");
  const points = input.map((p) => ({ x: p.x, y: p.y }));
  if (same(points[0], points[points.length - 1])) points.pop();
  if (
    points.length < 3 ||
    points.length > 256 ||
    points.some(
      (p) =>
        !Number.isFinite(p.x) ||
        !Number.isFinite(p.y) ||
        Math.abs(p.x) > 1000000 ||
        Math.abs(p.y) > 1000000,
    )
  )
    throw new Error("Invalid room coordinates");
  if (new Set(points.map((p) => `${p.x},${p.y}`)).size !== points.length)
    throw new Error("Repeated room vertex");
  for (let i = 0; i < points.length; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length],
      c = points[(i + 2) % points.length];
    if (
      Math.abs(cross(a, b, c)) <= 1e-8 &&
      (a.x - b.x) * (c.x - b.x) + (a.y - b.y) * (c.y - b.y) > 0
    )
      throw new Error("Overlapping room edges");
    for (let j = i + 2; j < points.length; j++) {
      if (i === 0 && j === points.length - 1) continue;
      if (intersects(a, b, points[j], points[(j + 1) % points.length]))
        throw new Error("Room boundary intersects itself");
    }
  }
  const origin = points[0];
  const twiceArea = points.reduce(
    (sum, p, i) => sum + cross(origin, p, points[(i + 1) % points.length]),
    0,
  );
  if (Math.abs(twiceArea) <= 1e-8) throw new Error("Room has no area");
  return points;
}
export function parseRoomBoundary(text: string): Point[] {
  if (text.length > 16000) throw new Error("Room boundary text too large");
  const rows = text.trim().split(/\r?\n/);
  if (rows.length > 257) throw new Error("Too many room vertices");
  const decimal = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
  return validateRoomBoundary(
    rows.map((row) => {
      const values = row.split(",").map((v) => v.trim());
      if (values.length !== 2 || values.some((v) => !decimal.test(v)))
        throw new Error("Use one x,y pair per line");
      return { x: Number(values[0]), y: Number(values[1]) };
    }),
  );
}
export function updateRoom(
  project: Project,
  roomId: string,
  name: string,
  boundary: readonly Point[],
): Project {
  const points = validateRoomBoundary(boundary);
  const next = structuredClone(project);
  const room = next.rooms.find((r) => r.id === roomId);
  if (!room) throw new Error("Unknown room");
  room.name = name;
  room.boundary = points;
  return validateProject(next);
}

export function addPolygonRoom(
  project: Project,
  floorId: string,
  name: string,
  boundary: readonly Point[],
): Project {
  const points = validateRoomBoundary(boundary);
  const next = structuredClone(project);
  next.rooms.push({ id: crypto.randomUUID(), floorId, name, boundary: points });
  return validateProject(next);
}

export function measureRoom(boundary: readonly Point[]) {
  const points = validateRoomBoundary(boundary);
  const origin = points[0];
  const edges = points.map((from, i) => {
    const to = points[(i + 1) % points.length];
    return { from, to, lengthMm: Math.hypot(to.x - from.x, to.y - from.y) };
  });
  return {
    areaMm2:
      Math.abs(
        edges.reduce(
          (area, edge) => area + cross(origin, edge.from, edge.to),
          0,
        ),
      ) / 2,
    perimeterMm: edges.reduce((sum, edge) => sum + edge.lengthMm, 0),
    edges,
  };
}
