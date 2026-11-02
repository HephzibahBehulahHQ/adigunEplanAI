import type { Project } from "../electrical-model/project.ts";
import { transform, type Point } from "../engineering-core/geometry.ts";
export { transform, snap, type Point } from "../engineering-core/geometry.ts";
export function pinPosition(project: Project, pinId: string): Point {
  const pin = project.pins.find((p) => p.id === pinId);
  const instance = project.symbolInstances.find(
    (s) => s.id === pin?.symbolInstanceId,
  );
  const definition = project.symbolDefinitions.find(
    (d) => d.id === instance?.definitionId,
  );
  const local = definition?.pins.find((p) => p.id === pin?.definitionPinId);
  if (!instance || !local) throw new Error("Unknown pin");
  return transform(
    local.position,
    instance.position,
    instance.rotation,
    instance.mirrored,
  );
}
export function bounds(
  project: Project,
  instance: Project["symbolInstances"][number],
) {
  const def = project.symbolDefinitions.find(
    (d) => d.id === instance.definitionId,
  )!;
  const swapped = instance.rotation === 90 || instance.rotation === 270;
  const w = swapped ? def.heightMm : def.widthMm;
  const h = swapped ? def.widthMm : def.heightMm;
  return {
    left: instance.position.x - w / 2,
    right: instance.position.x + w / 2,
    top: instance.position.y - h / 2,
    bottom: instance.position.y + h / 2,
  };
}
export function route(a: Point, b: Point): Point[] {
  if (a.x === b.x || a.y === b.y) return [a, b];
  const x = (a.x + b.x) / 2;
  return [a, { x, y: a.y }, { x, y: b.y }, b];
}

type Obstacle = {
  id: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
};
function crosses(a: Point, b: Point, box: Obstacle): boolean {
  if (a.x === b.x)
    return (
      a.x > box.left &&
      a.x < box.right &&
      Math.max(a.y, b.y) > box.top &&
      Math.min(a.y, b.y) < box.bottom
    );
  if (a.y === b.y)
    return (
      a.y > box.top &&
      a.y < box.bottom &&
      Math.max(a.x, b.x) > box.left &&
      Math.min(a.x, b.x) < box.right
    );
  return true;
}
function compact(points: Point[]): Point[] {
  const result: Point[] = [];
  for (const point of points) {
    if (
      result.length &&
      result[result.length - 1].x === point.x &&
      result[result.length - 1].y === point.y
    )
      continue;
    while (result.length >= 2) {
      const a = result[result.length - 2],
        b = result[result.length - 1];
      if (
        ((a.x === b.x && b.x === point.x) ||
          (a.y === b.y && b.y === point.y)) &&
        (b.x - a.x) * (point.x - b.x) + (b.y - a.y) * (point.y - b.y) >= 0
      )
        result.pop();
      else break;
    }
    result.push(point);
  }
  return result;
}
export function routeWire(
  project: Project,
  fromId: string,
  toId: string,
): Point[] {
  const from = project.pins.find((p) => p.id === fromId)!,
    to = project.pins.find((p) => p.id === toId)!;
  const source = project.symbolInstances.find(
      (s) => s.id === from.symbolInstanceId,
    )!,
    target = project.symbolInstances.find((s) => s.id === to.symbolInstanceId)!;
  const page = project.pages.find((p) => p.id === source.pageId)!;
  const start = pinPosition(project, fromId),
    end = pinPosition(project, toId);
  const obstacles: Obstacle[] = project.symbolInstances
    .filter(
      (s) =>
        s.pageId === page.id &&
        !["terminal", "junction"].includes(
          project.symbolDefinitions.find((d) => d.id === s.definitionId)!.glyph,
        ),
    )
    .map((s) => ({ id: s.id, ...bounds(project, s) }));
  const clear = (points: Point[], ignore?: string) =>
    points
      .slice(1)
      .every(
        (point, i) =>
          !obstacles.some(
            (box) => box.id !== ignore && crosses(points[i], point, box),
          ),
      );
  const direct = route(start, end);
  if (clear(direct)) return compact(direct);
  function lead(
    instance: Project["symbolInstances"][number],
    anchor: Point,
    other: Point,
  ): Point {
    const body = bounds(project, instance);
    const dx = anchor.x - instance.position.x,
      dy = anchor.y - instance.position.y;
    if (Math.abs(dx) > Math.abs(dy))
      return { x: dx >= 0 ? body.right + 3 : body.left - 3, y: anchor.y };
    if (dy !== 0)
      return { x: anchor.x, y: dy > 0 ? body.bottom + 3 : body.top - 3 };
    return Math.abs(other.x - anchor.x) >= Math.abs(other.y - anchor.y)
      ? { x: other.x >= anchor.x ? body.right + 3 : body.left - 3, y: anchor.y }
      : {
          x: anchor.x,
          y: other.y >= anchor.y ? body.bottom + 3 : body.top - 3,
        };
  }
  const a = lead(source, start, end),
    b = lead(target, end, start);
  if (!clear([start, a], source.id) || !clear([b, end], target.id))
    throw new Error("No clear terminal escape route");
  const candidates: Point[][] = [];
  for (const y of [
    a.y,
    b.y,
    (a.y + b.y) / 2,
    ...obstacles.flatMap((o) => [o.top - 3, o.bottom + 3]),
  ])
    candidates.push([a, { x: a.x, y }, { x: b.x, y }, b]);
  for (const x of [
    a.x,
    b.x,
    (a.x + b.x) / 2,
    ...obstacles.flatMap((o) => [o.left - 3, o.right + 3]),
  ])
    candidates.push([a, { x, y: a.y }, { x, y: b.y }, b]);
  const valid = candidates
    .filter(
      (points) =>
        points.every(
          (p) =>
            p.x >= 0 && p.y >= 0 && p.x <= page.widthMm && p.y <= page.heightMm,
        ) && clear(points),
    )
    .sort((p, q) => length(p) - length(q));
  if (valid.length) return compact([start, ...valid[0], end]);
  // Bounded four-neighbour grid search is the fallback for multiple obstructing devices.
  const step = 2.5,
    columns = Math.floor(page.widthMm / step) + 1,
    rows = Math.floor(page.heightMm / step) + 1,
    count = columns * rows;
  if (count > 250000) throw new Error("Routing area exceeds the bounded grid");
  const blocked = new Uint8Array(count);
  for (const box of obstacles) {
    for (
      let y = Math.max(0, Math.ceil(box.top / step));
      y <= Math.min(rows - 1, Math.floor(box.bottom / step));
      y++
    )
      for (
        let x = Math.max(0, Math.ceil(box.left / step));
        x <= Math.min(columns - 1, Math.floor(box.right / step));
        x++
      )
        blocked[y * columns + x] = 1;
  }
  const node = (point: Point) =>
    Math.round(point.y / step) * columns + Math.round(point.x / step);
  const startNode = node(a),
    endNode = node(b);
  if (
    startNode < 0 ||
    endNode < 0 ||
    startNode >= count ||
    endNode >= count ||
    blocked[startNode] ||
    blocked[endNode]
  )
    throw new Error("No routing grid access");
  const previous = new Int32Array(count);
  previous.fill(-1);
  const queue = new Int32Array(count);
  let head = 0,
    tail = 0;
  queue[tail++] = startNode;
  previous[startNode] = startNode;
  while (head < tail && previous[endNode] === -1) {
    const current = queue[head++],
      x = current % columns,
      y = Math.floor(current / columns);
    for (const next of [
      x > 0 ? current - 1 : -1,
      x < columns - 1 ? current + 1 : -1,
      y > 0 ? current - columns : -1,
      y < rows - 1 ? current + columns : -1,
    ])
      if (next >= 0 && !blocked[next] && previous[next] === -1) {
        previous[next] = current;
        queue[tail++] = next;
      }
  }
  if (previous[endNode] === -1)
    throw new Error("No collision-free orthogonal route");
  const path: Point[] = [];
  for (let current = endNode; ; current = previous[current]) {
    path.push({
      x: (current % columns) * step,
      y: Math.floor(current / columns) * step,
    });
    if (current === startNode) break;
  }
  path.reverse();
  const connector = (x: Point, y: Point) => {
    for (const option of [
      [x, { x: y.x, y: x.y }, y],
      [x, { x: x.x, y: y.y }, y],
    ])
      if (clear(option)) return option;
    throw new Error("No clear routing grid connector");
  };
  const result = compact([
    start,
    ...connector(a, path[0]),
    ...path,
    ...connector(path[path.length - 1], b),
    end,
  ]);
  if (!clear(result.slice(1, -1))) throw new Error("Routing validation failed");
  return result;
}
function length(points: Point[]): number {
  return points
    .slice(1)
    .reduce(
      (sum, p, i) =>
        sum + Math.abs(p.x - points[i].x) + Math.abs(p.y - points[i].y),
      0,
    );
}

export function pathNeedsReroute(
  project: Project,
  path: Project["wirePaths"][number],
): boolean {
  const wire = project.wires.find((w) => w.id === path.wireId)!;
  const source = project.pins.find(
      (p) => p.id === wire.fromPinId,
    )!.symbolInstanceId,
    target = project.pins.find((p) => p.id === wire.toPinId)!.symbolInstanceId;
  const start = pinPosition(project, wire.fromPinId),
    end = pinPosition(project, wire.toPinId);
  if (
    path.points[0].x !== start.x ||
    path.points[0].y !== start.y ||
    path.points.at(-1)!.x !== end.x ||
    path.points.at(-1)!.y !== end.y
  )
    return true;
  for (const instance of project.symbolInstances.filter(
    (s) => s.pageId === path.pageId,
  )) {
    const definition = project.symbolDefinitions.find(
      (d) => d.id === instance.definitionId,
    )!;
    if (definition.glyph === "terminal" || definition.glyph === "junction")
      continue;
    const box = { id: instance.id, ...bounds(project, instance) };
    for (let i = 1; i < path.points.length; i++) {
      const a = path.points[i - 1],
        b = path.points[i];
      const inside = (p: Point) =>
        p.x > box.left && p.x < box.right && p.y > box.top && p.y < box.bottom;
      if (
        (i === 1 && instance.id === source && inside(start)) ||
        (i === path.points.length - 1 && instance.id === target && inside(end))
      )
        continue;
      if (crosses(a, b, box)) return true;
    }
  }
  return false;
}
