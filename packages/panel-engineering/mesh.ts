import { projectPoint3d, type Vector3, type PanelVolume } from "./geometry.ts";

export type MeshGeometry = {
  vertices: [number, number, number][];
  triangles: [number, number, number][];
};
export const meshLimits = {
  bytes: 8 * 1024 * 1024,
  triangles: 20000,
  vertices: 60000,
};
export type MeshUnits = "mm" | "cm" | "m" | "in";
export type MeshAxes = "panel" | "z-up";
const scales = { mm: 1, cm: 10, m: 1000, in: 25.4 };

/** STL has no units. Conversion and coordinate basis must be chosen explicitly. */
export function parseStl(bytes: Uint8Array, units: MeshUnits, axes: MeshAxes) {
  if (!Object.hasOwn(scales, units) || !["panel", "z-up"].includes(axes))
    throw new Error("Choose model units and axes");
  if (bytes.byteLength > meshLimits.bytes || !bytes.byteLength)
    throw new Error("STL exceeds the import size limit");
  const vertices: MeshGeometry["vertices"] = [];
  const triangles: MeshGeometry["triangles"] = [];
  const indices = new Map<string, number>();
  let attributesIgnored = false;
  const vertex = (point: number[]) => {
    const [x, y, z] = point.map((value) => value * scales[units]);
    const converted: [number, number, number] =
      axes === "z-up" ? [x, -z, y] : [x, y, z];
    if (
      converted.some(
        (value) => !Number.isFinite(value) || Math.abs(value) > 1e6,
      )
    )
      throw new Error("Invalid STL coordinate");
    const key = converted.join(",");
    let index = indices.get(key);
    if (index === undefined) {
      index = vertices.length;
      indices.set(key, index);
      vertices.push(converted);
    }
    return index;
  };
  const triangle = (points: number[][]) => {
    if (triangles.length >= meshLimits.triangles)
      throw new Error("STL exceeds the triangle limit");
    triangles.push(points.map(vertex) as [number, number, number]);
  };
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = bytes.byteLength >= 84 ? view.getUint32(80, true) : 0;
  const binary = count > 0 && 84 + count * 50 === bytes.byteLength;
  if (binary) {
    if (count > meshLimits.triangles)
      throw new Error("STL exceeds the triangle limit");
    for (let i = 0; i < count; i++) {
      const start = 84 + i * 50;
      triangle(
        [0, 1, 2].map((p) =>
          [0, 1, 2].map((axis) =>
            view.getFloat32(start + 12 + p * 12 + axis * 4, true),
          ),
        ),
      );
      attributesIgnored ||= view.getUint16(start + 48, true) !== 0;
    }
  } else {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (
      !/^solid(?:\s|$)/.test(lines[0] ?? "") ||
      !/^endsolid(?:\s|$)/.test(lines.at(-1) ?? "")
    )
      throw new Error("Invalid ASCII STL envelope or truncated binary STL");
    const number = "[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?";
    const normal = new RegExp(
      `^facet\\s+normal\\s+(${number})\\s+(${number})\\s+(${number})$`,
    );
    const point = new RegExp(
      `^vertex\\s+(${number})\\s+(${number})\\s+(${number})$`,
    );
    let cursor = 1;
    while (cursor < lines.length - 1) {
      const n = normal.exec(lines[cursor++]);
      if (
        !n ||
        n.slice(1).some((value) => !Number.isFinite(Number(value))) ||
        lines[cursor++] !== "outer loop"
      )
        throw new Error("Invalid STL facet");
      const points = [0, 1, 2].map(() => {
        const match = point.exec(lines[cursor++]);
        if (!match) throw new Error("STL facets must have three vertices");
        return match.slice(1).map(Number);
      });
      if (lines[cursor++] !== "endloop" || lines[cursor++] !== "endfacet")
        throw new Error("Invalid STL facet terminator");
      triangle(points);
    }
    if (cursor !== lines.length - 1) throw new Error("Unexpected STL data");
  }
  const minima = [0, 1, 2].map((axis) =>
    vertices.reduce((n, p) => Math.min(n, p[axis]), Infinity),
  );
  for (const p of vertices)
    for (const axis of [0, 1, 2]) p[axis] -= minima[axis];
  const geometry = { vertices, triangles };
  const sizeMm = validateMeshGeometry(geometry);
  const topology = meshTopology(geometry);
  return {
    ...geometry,
    sizeMm,
    encoding: binary ? ("binary-stl" as const) : ("ascii-stl" as const),
    attributesIgnored,
    ...topology,
  };
}

export function validateMeshGeometry(mesh: MeshGeometry): Vector3 {
  if (
    mesh.vertices.length < 4 ||
    mesh.vertices.length > meshLimits.vertices ||
    !mesh.triangles.length ||
    mesh.triangles.length > meshLimits.triangles
  )
    throw new Error("Invalid mesh size");
  const minimum = [Infinity, Infinity, Infinity],
    maximum = [-Infinity, -Infinity, -Infinity];
  for (const p of mesh.vertices) {
    if (
      p.length !== 3 ||
      p.some((value) => !Number.isFinite(value) || value < 0 || value > 1e6)
    )
      throw new Error("Mesh vertices must be normalized millimetres");
    for (const axis of [0, 1, 2]) {
      minimum[axis] = Math.min(minimum[axis], p[axis]);
      maximum[axis] = Math.max(maximum[axis], p[axis]);
    }
  }
  if (
    minimum.some((value) => value !== 0) ||
    maximum.some((value) => value <= 0)
  )
    throw new Error("Mesh requires a nonzero extent in all three axes");
  for (const face of mesh.triangles) {
    if (
      face.length !== 3 ||
      face.some(
        (i) => !Number.isSafeInteger(i) || i < 0 || i >= mesh.vertices.length,
      )
    )
      throw new Error("Mesh triangle index is out of range");
    const [a, b, c] = face.map((i) => mesh.vertices[i]);
    const u = b.map((v, i) => v - a[i]),
      v = c.map((v, i) => v - a[i]);
    const area2 = Math.hypot(
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    );
    if (area2 <= Number.EPSILON * Math.hypot(...u) * Math.hypot(...v) * 16)
      throw new Error("Mesh contains a degenerate triangle");
  }
  return { x: maximum[0], y: maximum[1], z: maximum[2] };
}

/** Open/non-manifold surfaces are reported, never called watertight solids. */
export function meshTopology(mesh: MeshGeometry) {
  const edges = new Map<string, { count: number; direction: number }>();
  for (const face of mesh.triangles)
    for (let i = 0; i < 3; i++) {
      const a = face[i],
        b = face[(i + 1) % 3],
        key = a < b ? `${a}:${b}` : `${b}:${a}`;
      const edge = edges.get(key) ?? { count: 0, direction: 0 };
      edge.count++;
      edge.direction += a < b ? 1 : -1;
      edges.set(key, edge);
    }
  return {
    boundaryEdges: [...edges.values()].filter((edge) => edge.count === 1)
      .length,
    nonManifoldEdges: [...edges.values()].filter((edge) => edge.count > 2)
      .length,
    inconsistentEdges: [...edges.values()].filter(
      (edge) => edge.count === 2 && edge.direction !== 0,
    ).length,
  };
}

export function meshWorldVertices(
  mesh: MeshGeometry,
  item: PanelVolume,
): Vector3[] {
  return mesh.vertices.map(([x, y, z]) => {
    const [rx, ry] =
      item.rotationDeg === 90
        ? [item.sizeMm.y - y, x]
        : item.rotationDeg === 180
          ? [item.sizeMm.x - x, item.sizeMm.y - y]
          : item.rotationDeg === 270
            ? [y, item.sizeMm.x - x]
            : [x, y];
    return {
      x: rx + item.positionMm.x,
      y: ry + item.positionMm.y,
      z: z + item.positionMm.z,
    };
  });
}

/** Frontmost triangle at a projected world point, used for mesh selection. */
export function meshHit(
  mesh: MeshGeometry,
  item: PanelVolume,
  yaw: number,
  pitch: number,
  point: { x: number; y: number },
): number | null {
  const vertices = meshWorldVertices(mesh, item).map((p) =>
    projectPoint3d(p, yaw, pitch),
  );
  let front = -Infinity;
  for (const face of mesh.triangles) {
    const [a, b, c] = face.map((i) => vertices[i]);
    const det = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
    if (Math.abs(det) < 1e-10) continue;
    const u =
      ((b.y - c.y) * (point.x - c.x) + (c.x - b.x) * (point.y - c.y)) / det;
    const v =
      ((c.y - a.y) * (point.x - c.x) + (a.x - c.x) * (point.y - c.y)) / det;
    if (u >= -1e-9 && v >= -1e-9 && u + v <= 1 + 1e-9)
      front = Math.max(front, u * a.z + v * b.z + (1 - u - v) * c.z);
  }
  return front === -Infinity ? null : front;
}
