/** Millimetres; X right, Y down, Z from the cabinet back towards its front. */
export type Vector3 = { x: number; y: number; z: number };
export type QuarterTurn = 0 | 90 | 180 | 270;
export type PanelVolume = {
  id: string;
  name: string;
  positionMm: Vector3;
  sizeMm: Vector3;
  rotationDeg?: QuarterTurn;
  clearanceMm?: number;
  mountingStructureId?: string;
  requiredMountingProfile?: string;
  accessDirection?: "front" | "back" | "left" | "right" | "top" | "bottom";
  accessClearanceMm?: number;
};
export type PanelEnvelope = {
  widthMm: number;
  heightMm: number;
  depthMm: number;
};
export type PanelStructure = PanelVolume & {
  kind: "plate" | "din-rail" | "duct" | "door" | "compartment";
  mountingProfile?: string;
};
export type Bounds3 = { min: Vector3; max: Vector3 };
export type PanelDiagnostic = {
  code:
    | "out-of-bounds"
    | "collision"
    | "clearance"
    | "mounting-support"
    | "mounting-position"
    | "mounting-profile"
    | "access-obstructed";
  severity: "error" | "warning";
  objectIds: string[];
  actualMm?: number;
  requiredMm?: number;
  actualProfile?: string;
  requiredProfile?: string;
};

const axes = ["x", "y", "z"] as const;
// Floating arithmetic must not turn exact decimal contact into penetration.
// Tolerance scales with the coordinates, rather than hiding a fixed physical gap.
const tolerance = (...values: number[]) =>
  16 * Number.EPSILON * Math.max(...values.map(Math.abs));

function validVector(value: Vector3, positive: boolean) {
  return axes.every(
    (axis) => Number.isFinite(value[axis]) && (!positive || value[axis] > 0),
  );
}

export function volumeBounds(volume: PanelVolume): Bounds3 {
  if (
    !validVector(volume.positionMm, false) ||
    !validVector(volume.sizeMm, true) ||
    ![0, 90, 180, 270].includes(volume.rotationDeg ?? 0) ||
    (volume.clearanceMm !== undefined &&
      (!Number.isFinite(volume.clearanceMm) || volume.clearanceMm < 0)) ||
    (volume.accessClearanceMm !== undefined &&
      (!Number.isFinite(volume.accessClearanceMm) ||
        volume.accessClearanceMm <= 0 ||
        volume.accessClearanceMm > 1e6)) ||
    Boolean(volume.accessDirection) !== Boolean(volume.accessClearanceMm)
  )
    throw new Error("Invalid panel volume geometry");
  const rotated = volume.rotationDeg === 90 || volume.rotationDeg === 270;
  const size = rotated
    ? { x: volume.sizeMm.y, y: volume.sizeMm.x, z: volume.sizeMm.z }
    : volume.sizeMm;
  const result = {
    min: { ...volume.positionMm },
    max: {
      x: volume.positionMm.x + size.x,
      y: volume.positionMm.y + size.y,
      z: volume.positionMm.z + size.z,
    },
  };
  if (
    !validVector(result.max, false) ||
    axes.some(
      (axis) =>
        Math.abs(volume.positionMm[axis]) > 1e6 || volume.sizeMm[axis] > 1e6,
    )
  )
    throw new Error("Panel geometry exceeds supported coordinate range");
  return result;
}

/** Touching faces, edges and corners are contact, not intersecting volumes. */
export function volumesIntersect(a: Bounds3, b: Bounds3): boolean {
  return axes.every(
    (axis) =>
      Math.min(a.max[axis], b.max[axis]) - Math.max(a.min[axis], b.min[axis]) >
      tolerance(a.min[axis], a.max[axis], b.min[axis], b.max[axis]),
  );
}

/** Shortest Euclidean distance between two closed axis-aligned boxes. */
export function volumeGapMm(a: Bounds3, b: Bounds3): number {
  return Math.hypot(
    ...axes.map((axis) => {
      const distance = Math.max(
        0,
        a.min[axis] - b.max[axis],
        b.min[axis] - a.max[axis],
      );
      return distance <=
        tolerance(a.min[axis], a.max[axis], b.min[axis], b.max[axis])
        ? 0
        : distance;
    }),
  );
}

export function outsideEnvelope(box: Bounds3, enclosure: PanelEnvelope) {
  if (
    !validVector(
      {
        x: enclosure.widthMm,
        y: enclosure.heightMm,
        z: enclosure.depthMm,
      },
      true,
    )
  )
    throw new Error("Invalid panel enclosure dimensions");
  if (Math.max(enclosure.widthMm, enclosure.heightMm, enclosure.depthMm) > 1e6)
    throw new Error("Panel enclosure exceeds supported dimension range");
  const limit = {
    x: enclosure.widthMm,
    y: enclosure.heightMm,
    z: enclosure.depthMm,
  };
  return axes.some((axis) => {
    const epsilon = tolerance(box.min[axis], box.max[axis], limit[axis]);
    return box.min[axis] < -epsilon || box.max[axis] > limit[axis] + epsilon;
  });
}

/** User-defined service approach prism. Enclosure openings/door motion are not inferred. */
export function accessBounds(volume: PanelVolume): Bounds3 | null {
  const box = volumeBounds(volume);
  if (!volume.accessDirection || volume.accessClearanceMm === undefined)
    return null;
  const result = structuredClone(box);
  const axis = (
    {
      front: "z",
      back: "z",
      left: "x",
      right: "x",
      top: "y",
      bottom: "y",
    } as const
  )[volume.accessDirection];
  if (["front", "right", "bottom"].includes(volume.accessDirection)) {
    result.min[axis] = box.max[axis];
    result.max[axis] += volume.accessClearanceMm;
  } else {
    result.max[axis] = box.min[axis];
    result.min[axis] -= volume.accessClearanceMm;
  }
  return result;
}

export function panelDiagnostics(
  enclosure: PanelEnvelope,
  equipment: PanelVolume[],
  structures: PanelStructure[] = [],
): PanelDiagnostic[] {
  const all = [...structures, ...equipment];
  const bounds = all.map(volumeBounds);
  const diagnostics: PanelDiagnostic[] = [];
  all.forEach((volume, index) => {
    if (outsideEnvelope(bounds[index], enclosure))
      diagnostics.push({
        code: "out-of-bounds",
        severity: "error",
        objectIds: [volume.id],
      });
    for (let other = 0; other < index; other++) {
      if (
        ("kind" in volume && volume.kind === "compartment") ||
        ("kind" in all[other] &&
          (all[other] as PanelStructure).kind === "compartment")
      )
        continue;
      const objectIds = [all[other].id, volume.id];
      if (volumesIntersect(bounds[index], bounds[other]))
        diagnostics.push({ code: "collision", severity: "error", objectIds });
      else {
        const requiredMm = Math.max(
          volume.clearanceMm ?? 0,
          all[other].clearanceMm ?? 0,
        );
        const actualMm = volumeGapMm(bounds[index], bounds[other]);
        const supportContact =
          volume.mountingStructureId === all[other].id ||
          all[other].mountingStructureId === volume.id;
        if (
          !supportContact &&
          actualMm + tolerance(actualMm, requiredMm) < requiredMm
        )
          diagnostics.push({
            code: "clearance",
            severity: "warning",
            objectIds,
            actualMm,
            requiredMm,
          });
      }
    }
  });
  for (const item of equipment) {
    const access = accessBounds(item);
    if (access)
      all.forEach((other, index) => {
        if (
          other.id !== item.id &&
          !("kind" in other && other.kind === "compartment") &&
          volumesIntersect(access, bounds[index])
        )
          diagnostics.push({
            code: "access-obstructed",
            severity: "warning",
            objectIds: [item.id, other.id],
            requiredMm: item.accessClearanceMm,
          });
      });
    if (item.requiredMountingProfile) {
      const support = structures.find((s) => s.id === item.mountingStructureId);
      if (
        support?.mountingProfile?.trim().toUpperCase() !==
        item.requiredMountingProfile.trim().toUpperCase()
      )
        diagnostics.push({
          code: "mounting-profile",
          severity: "warning",
          objectIds: [item.id, ...(support ? [support.id] : [])],
          requiredProfile: item.requiredMountingProfile,
          actualProfile: support?.mountingProfile,
        });
    }
    if (!item.mountingStructureId) continue;
    const support = structures.find((s) => s.id === item.mountingStructureId);
    if (!support || !["plate", "din-rail", "door"].includes(support.kind)) {
      diagnostics.push({
        code: "mounting-support",
        severity: "error",
        objectIds: [item.id],
      });
      continue;
    }
    const box = volumeBounds(item);
    const mount = volumeBounds(support);
    const contact =
      support.kind === "door"
        ? Math.abs(box.max.z - mount.min.z) <= tolerance(box.max.z, mount.min.z)
        : Math.abs(box.min.z - mount.max.z) <=
          tolerance(box.min.z, mount.max.z);
    const xyOverlap =
      box.min.x < mount.max.x &&
      box.max.x > mount.min.x &&
      box.min.y < mount.max.y &&
      box.max.y > mount.min.y;
    const longAxis =
      mount.max.x - mount.min.x >= mount.max.y - mount.min.y ? "x" : "y";
    const within = (axis: "x" | "y") => {
      const epsilon = tolerance(
        box.min[axis],
        box.max[axis],
        mount.min[axis],
        mount.max[axis],
      );
      return (
        box.min[axis] >= mount.min[axis] - epsilon &&
        box.max[axis] <= mount.max[axis] + epsilon
      );
    };
    const supported =
      support.kind === "plate" || support.kind === "door"
        ? within("x") && within("y")
        : within(longAxis) && xyOverlap;
    if (!contact || !supported)
      diagnostics.push({
        code: "mounting-position",
        severity: "warning",
        objectIds: [item.id, support.id],
      });
  }
  return diagnostics;
}

/** Union of clipped front footprints; overlaps are counted once. */
export function projectedUtilization(
  enclosure: PanelEnvelope,
  equipment: PanelVolume[],
): { occupiedMm2: number; availableMm2: number; ratio: number } {
  outsideEnvelope(
    { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
    enclosure,
  );
  const rects = equipment.map(volumeBounds).map((box) => ({
    left: Math.max(0, box.min.x),
    right: Math.min(enclosure.widthMm, box.max.x),
    top: Math.max(0, box.min.y),
    bottom: Math.min(enclosure.heightMm, box.max.y),
  }));
  const edges = [...new Set(rects.flatMap((r) => [r.left, r.right]))].sort(
    (a, b) => a - b,
  );
  let occupiedMm2 = 0;
  for (let index = 1; index < edges.length; index++) {
    const left = edges[index - 1];
    const right = edges[index];
    const intervals = rects
      .filter(
        (r) =>
          r.left < right &&
          r.right > left &&
          r.right > r.left &&
          r.bottom > r.top,
      )
      .map((r) => [r.top, r.bottom])
      .sort((a, b) => a[0] - b[0]);
    let end = -Infinity;
    let occupiedHeight = 0;
    for (const [top, bottom] of intervals) {
      occupiedHeight += Math.max(0, bottom - Math.max(end, top));
      end = Math.max(end, bottom);
    }
    occupiedMm2 += (right - left) * occupiedHeight;
  }
  const availableMm2 = enclosure.widthMm * enclosure.heightMm;
  return { occupiedMm2, availableMm2, ratio: occupiedMm2 / availableMm2 };
}

export function boxVertices(box: Bounds3): Vector3[] {
  const { min, max } = box;
  return [
    { x: min.x, y: min.y, z: min.z },
    { x: max.x, y: min.y, z: min.z },
    { x: max.x, y: max.y, z: min.z },
    { x: min.x, y: max.y, z: min.z },
    { x: min.x, y: min.y, z: max.z },
    { x: max.x, y: min.y, z: max.z },
    { x: max.x, y: max.y, z: max.z },
    { x: min.x, y: max.y, z: max.z },
  ];
}

export const boxEdges = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
] as const;

export const boxFaces = [
  { indices: [0, 3, 7, 4], normal: { x: -1, y: 0, z: 0 } },
  { indices: [1, 5, 6, 2], normal: { x: 1, y: 0, z: 0 } },
  { indices: [0, 4, 5, 1], normal: { x: 0, y: -1, z: 0 } },
  { indices: [3, 2, 6, 7], normal: { x: 0, y: 1, z: 0 } },
  { indices: [0, 1, 2, 3], normal: { x: 0, y: 0, z: -1 } },
  { indices: [4, 7, 6, 5], normal: { x: 0, y: 0, z: 1 } },
];

export function projectPoint3d(
  point: Vector3,
  yawDeg: number,
  pitchDeg: number,
): Vector3 {
  if (
    !Number.isFinite(yawDeg) ||
    !Number.isFinite(pitchDeg) ||
    !validVector(point, false)
  )
    throw new Error("Invalid view rotation");
  const yaw = (yawDeg * Math.PI) / 180;
  const pitch = (pitchDeg * Math.PI) / 180;
  const result = {
    x: Math.cos(yaw) * point.x - Math.sin(yaw) * point.z,
    y:
      Math.sin(pitch) * Math.sin(yaw) * point.x +
      Math.cos(pitch) * point.y +
      Math.sin(pitch) * Math.cos(yaw) * point.z,
    z:
      Math.cos(pitch) * Math.sin(yaw) * point.x -
      Math.sin(pitch) * point.y +
      Math.cos(pitch) * Math.cos(yaw) * point.z,
  };
  if (!validVector(result, false))
    throw new Error("Projection exceeds finite coordinate range");
  return result;
}

export type ProjectedFace = {
  objectId: string;
  side: number;
  points: Vector3[];
  depth: number;
};

export function projectedFaces(
  volume: PanelVolume,
  yawDeg: number,
  pitchDeg: number,
): ProjectedFace[] {
  const vertices = boxVertices(volumeBounds(volume)).map((point) =>
    projectPoint3d(point, yawDeg, pitchDeg),
  );
  return boxFaces.flatMap((face, side) => {
    if (projectPoint3d(face.normal, yawDeg, pitchDeg).z <= 1e-10) return [];
    const points = face.indices.map((index) => vertices[index]);
    return [
      {
        objectId: volume.id,
        side,
        points,
        depth: points.reduce((sum, point) => sum + point.z, 0) / 4,
      },
    ];
  });
}
