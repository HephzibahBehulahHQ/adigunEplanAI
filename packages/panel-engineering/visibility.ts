import type { ProjectedFace, Vector3 } from "./geometry.ts";

type Plane = { normal: Vector3; offset: number };
type Polygon = { face: ProjectedFace; plane: Plane; boundary: Vector3[] };
type Node = { plane: Plane; polygons: Polygon[]; front: number; back: number };
export type PaintedFace = ProjectedFace & {
  /** Only original cuboid edges, clipped to this fragment; no artificial split edges. */
  edges: [Vector3, Vector3][];
};

const dot = (a: Vector3, b: Vector3) => a.x * b.x + a.y * b.y + a.z * b.z;
const difference = (a: Vector3, b: Vector3): Vector3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
});
const cross = (a: Vector3, b: Vector3): Vector3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});

function facePlane(points: Vector3[]): Plane | null {
  const start = points[0];
  for (let index = 2; index < points.length; index++) {
    const normal = cross(
      difference(points[index - 1], start),
      difference(points[index], start),
    );
    const length = Math.hypot(normal.x, normal.y, normal.z);
    if (length === 0) continue;
    normal.x /= length;
    normal.y /= length;
    normal.z /= length;
    // An exactly edge-on polygon has no painted area in this orthographic view.
    if (normal.z === 0) return null;
    return { normal, offset: dot(normal, start) };
  }
  return null;
}

const signedDistance = (point: Vector3, plane: Plane) =>
  dot(point, plane.normal) - plane.offset;
const side = (distance: number, epsilon: number) =>
  distance > epsilon ? 1 : distance < -epsilon ? -1 : 0;

function classify(polygon: Polygon, plane: Plane, epsilon: number) {
  // Consume the splitter and its fragments even when transformed vertices have
  // tolerated roundoff. Every partition must remove at least one polygon.
  if (polygon.plane === plane) return "coplanar";
  let front = false;
  let back = false;
  for (const point of polygon.face.points) {
    const location = side(signedDistance(point, plane), epsilon);
    front ||= location === 1;
    back ||= location === -1;
  }
  return front && back ? "split" : front ? "front" : back ? "back" : "coplanar";
}

function projectedArea(points: Vector3[]) {
  const origin = points[0];
  let twiceArea = 0;
  for (let index = 1; index + 1 < points.length; index++) {
    const a = difference(points[index], origin);
    const b = difference(points[index + 1], origin);
    twiceArea += a.x * b.y - a.y * b.x;
  }
  return Math.abs(twiceArea) / 2;
}

function piece(
  polygon: Polygon,
  points: Vector3[],
  epsilon: number,
): Polygon | null {
  const clean = points.filter((point, index) => {
    const previous = points[(index + points.length - 1) % points.length];
    return (
      Math.hypot(
        point.x - previous.x,
        point.y - previous.y,
        point.z - previous.z,
      ) > epsilon
    );
  });
  if (clean.length < 3 || projectedArea(clean) <= epsilon * epsilon)
    return null;
  return {
    ...polygon,
    face: {
      ...polygon.face,
      points: clean,
      depth: clean.reduce((sum, point) => sum + point.z / clean.length, 0),
    },
  };
}

function split(polygon: Polygon, plane: Plane, epsilon: number) {
  const front: Vector3[] = [];
  const back: Vector3[] = [];
  const points = polygon.face.points;
  for (let index = 0; index < points.length; index++) {
    const a = points[index];
    const b = points[(index + 1) % points.length];
    const da = signedDistance(a, plane);
    const db = signedDistance(b, plane);
    const sa = side(da, epsilon);
    const sb = side(db, epsilon);
    if (sa >= 0) front.push(a);
    if (sa <= 0) back.push(a);
    if (sa * sb !== -1) continue;
    const fraction = da / (da - db);
    const intersection = {
      x: a.x + fraction * (b.x - a.x),
      y: a.y + fraction * (b.y - a.y),
      z: a.z + fraction * (b.z - a.z),
    };
    front.push(intersection);
    back.push(intersection);
  }
  return {
    front: piece(polygon, front, epsilon),
    back: piece(polygon, back, epsilon),
  };
}

function partitionPlane(polygons: Polygon[], epsilon: number) {
  let selected = polygons[0].plane;
  let best = Infinity;
  const candidates = Math.min(12, polygons.length);
  for (let index = 0; index < candidates; index++) {
    const plane =
      polygons[
        Math.floor(
          (index * (polygons.length - 1)) / Math.max(1, candidates - 1),
        )
      ].plane;
    let front = 0,
      back = 0,
      splits = 0;
    for (const polygon of polygons) {
      const location = classify(polygon, plane, epsilon);
      if (location === "split") splits++;
      else if (location === "front") front++;
      else if (location === "back") back++;
    }
    // This chooses a tree partition only; it never decides a face's visibility order.
    const cost = splits * 8 + Math.abs(front - back);
    if (cost < best) {
      best = cost;
      selected = plane;
    }
    if (cost === 0) break;
  }
  return selected;
}

function originalEdges(
  polygon: Polygon,
  epsilon: number,
): [Vector3, Vector3][] {
  const onSegment = (point: Vector3, a: Vector3, b: Vector3) => {
    const direction = difference(b, a);
    const lengthSquared = dot(direction, direction);
    if (lengthSquared === 0) return false;
    const parameter = Math.max(
      0,
      Math.min(1, dot(difference(point, a), direction) / lengthSquared),
    );
    return (
      Math.hypot(
        point.x - a.x - parameter * direction.x,
        point.y - a.y - parameter * direction.y,
        point.z - a.z - parameter * direction.z,
      ) <=
      epsilon * 4
    );
  };
  return polygon.face.points.flatMap((a, index) => {
    const b = polygon.face.points[(index + 1) % polygon.face.points.length];
    const original = polygon.boundary.some((start, edge) => {
      const end = polygon.boundary[(edge + 1) % polygon.boundary.length];
      return onSegment(a, start, end) && onSegment(b, start, end);
    });
    return original ? [[a, b] as [Vector3, Vector3]] : [];
  });
}

/**
 * Exact painter ordering for convex projected faces, viewed from positive Z.
 * A BSP splits polygons at depth planes before traversing far to near. Large
 * plates therefore cannot hide foreground equipment because of their centroid.
 * Coordinates and native object/side identities survive every split unchanged.
 */
export function orderProjectedFaces(
  faces: readonly ProjectedFace[],
): PaintedFace[] {
  let scale = 1;
  for (const face of faces) {
    if (face.points.length < 3)
      throw new Error("A projected face needs at least three vertices");
    for (const point of face.points)
      for (const coordinate of [point.x, point.y, point.z]) {
        // Native bounded positions/envelopes project to less than 4e6 mm per axis.
        if (!Number.isFinite(coordinate) || Math.abs(coordinate) > 1e7)
          throw new Error(
            "Projected face exceeds supported finite coordinates",
          );
        scale = Math.max(scale, Math.abs(coordinate));
      }
  }
  const epsilon = scale * Number.EPSILON * 64;
  const polygons = faces.flatMap((face): Polygon[] => {
    const plane = facePlane(face.points);
    if (
      plane &&
      face.points.some(
        (point) => Math.abs(signedDistance(point, plane)) > epsilon * 4,
      )
    )
      throw new Error("Projected face must be planar");
    return plane && projectedArea(face.points) > epsilon * epsilon
      ? [{ face, plane, boundary: face.points }]
      : [];
  });
  if (!polygons.length) return [];
  const nodes: Node[] = [];
  const work: {
    polygons: Polygon[];
    parent: number;
    branch: "front" | "back";
  }[] = [{ polygons, parent: -1, branch: "front" }];
  while (work.length) {
    const job = work.pop()!;
    const plane = partitionPlane(job.polygons, epsilon);
    const node: Node = { plane, polygons: [], front: -1, back: -1 };
    const index = nodes.push(node) - 1;
    if (job.parent !== -1) nodes[job.parent][job.branch] = index;
    const front: Polygon[] = [],
      back: Polygon[] = [];
    for (const polygon of job.polygons) {
      const location = classify(polygon, plane, epsilon);
      if (location === "coplanar") node.polygons.push(polygon);
      else if (location === "front") front.push(polygon);
      else if (location === "back") back.push(polygon);
      else {
        const fragments = split(polygon, plane, epsilon);
        if (fragments.front) front.push(fragments.front);
        if (fragments.back) back.push(fragments.back);
      }
    }
    if (front.length)
      work.push({ polygons: front, parent: index, branch: "front" });
    if (back.length)
      work.push({ polygons: back, parent: index, branch: "back" });
  }
  const painted: PaintedFace[] = [];
  const traverse = [{ index: 0, emit: false }];
  while (traverse.length) {
    const visit = traverse.pop()!;
    const node = nodes[visit.index];
    if (visit.emit) {
      for (const polygon of node.polygons)
        painted.push({
          ...polygon.face,
          edges: originalEdges(polygon, epsilon),
        });
      continue;
    }
    const frontNear = node.plane.normal.z > 0;
    const far = frontNear ? node.back : node.front;
    const near = frontNear ? node.front : node.back;
    if (near !== -1) traverse.push({ index: near, emit: false });
    traverse.push({ index: visit.index, emit: true });
    if (far !== -1) traverse.push({ index: far, emit: false });
  }
  return painted;
}
