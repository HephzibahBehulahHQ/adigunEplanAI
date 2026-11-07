import { useState } from "react";
import type { Project } from "../../../packages/electrical-model/project.ts";
import type { MessageKey } from "../../../packages/localization";

type Vector = { x: number; y: number; z: number };
type Props = { project: Project; t: (key: MessageKey) => string };
const edges = [
  [0, 1],
  [0, 2],
  [0, 4],
  [1, 3],
  [1, 5],
  [2, 3],
  [2, 6],
  [3, 7],
  [4, 5],
  [4, 6],
  [5, 7],
  [6, 7],
] as const;
const faces = [
  { indices: [0, 4, 6, 2], normal: { x: -1, y: 0, z: 0 }, tone: "side" },
  { indices: [1, 3, 7, 5], normal: { x: 1, y: 0, z: 0 }, tone: "side" },
  { indices: [0, 1, 5, 4], normal: { x: 0, y: -1, z: 0 }, tone: "top" },
  { indices: [2, 6, 7, 3], normal: { x: 0, y: 1, z: 0 }, tone: "top" },
  { indices: [0, 2, 3, 1], normal: { x: 0, y: 0, z: -1 }, tone: "front" },
  { indices: [4, 5, 7, 6], normal: { x: 0, y: 0, z: 1 }, tone: "front" },
] as const;

export function EnclosureView({ project, t }: Props) {
  const [id, setId] = useState("");
  const [angle, setAngle] = useState(35);
  const enclosure =
    project.enclosures.find((item) => item.id === id) ?? project.enclosures[0];
  if (!enclosure) return <p className="empty-hint">{t("noRecords")}</p>;

  const radians = (angle * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const cameraDepth = ({ x, y, z }: Vector) => sine * x + cosine * z + 0.45 * y;
  function projectPoint({ x, y, z }: Vector) {
    return {
      x: cosine * x - sine * z,
      y: (sine * x + cosine * z) * 0.45 - y,
      depth: cameraDepth({ x, y, z }),
    };
  }
  function corners(position: Vector, size: Vector) {
    return Array.from({ length: 8 }, (_, i) =>
      projectPoint({
        x: position.x + (i & 1 ? size.x : 0),
        y: position.y + (i & 2 ? size.y : 0),
        z: position.z + (i & 4 ? size.z : 0),
      }),
    );
  }
  const boxes = [
    {
      key: enclosure.id,
      label: enclosure.name,
      points: corners(
        { x: 0, y: 0, z: 0 },
        { x: enclosure.widthMm, y: enclosure.heightMm, z: enclosure.depthMm },
      ),
    },
    ...project.equipment3d
      .filter((item) => item.enclosureId === enclosure.id)
      .map((item) => ({
        key: item.id,
        label:
          project.devices.find((device) => device.id === item.deviceId)
            ?.reference ?? item.name,
        points: corners(item.positionMm, item.sizeMm),
      })),
  ];
  let left = Infinity,
    right = -Infinity,
    top = Infinity,
    bottom = -Infinity;
  for (const { points } of boxes) {
    for (const point of points) {
      left = Math.min(left, point.x);
      right = Math.max(right, point.x);
      top = Math.min(top, point.y);
      bottom = Math.max(bottom, point.y);
    }
  }
  const margin = Math.max(right - left, bottom - top) * 0.07;
  const [frame, ...equipment] = boxes;
  const visibleFaces = equipment
    .flatMap(({ key, label, points }) =>
      faces
        .filter(({ normal }) => cameraDepth(normal) > 1e-10)
        .map(({ indices, tone }) => {
          const vertices = indices.map((index) => points[index]);
          return {
            key: `${key}:${tone}`,
            label,
            tone,
            depth:
              vertices.reduce((sum, point) => sum + point.depth, 0) /
              vertices.length,
            coordinates: vertices.map(({ x, y }) => `${x},${y}`).join(" "),
          };
        }),
    )
    .sort((a, b) => a.depth - b.depth);
  return (
    <div className="enclosure-view">
      <select
        aria-label={t("panel3d")}
        value={enclosure.id}
        onChange={(event) => setId(event.target.value)}
      >
        {project.enclosures.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      <svg
        role="img"
        aria-label={enclosure.name}
        viewBox={`${left - margin} ${top - margin} ${right - left + 2 * margin} ${bottom - top + 2 * margin}`}
      >
        <g className="enclosure-frame">
          <title>{frame.label}</title>
          {edges.map(([a, b]) => (
            <line
              key={`${a}-${b}`}
              x1={frame.points[a].x}
              y1={frame.points[a].y}
              x2={frame.points[b].x}
              y2={frame.points[b].y}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
        {visibleFaces.map(({ key, label, tone, coordinates }) => (
          <polygon
            key={key}
            className={`enclosure-face enclosure-face-${tone}`}
            points={coordinates}
            vectorEffect="non-scaling-stroke"
          >
            <title>{label}</title>
          </polygon>
        ))}
      </svg>
      <label>
        {t("rotate")}{" "}
        <input
          type="range"
          min="0"
          max="359"
          value={angle}
          onChange={(event) => setAngle(event.target.valueAsNumber)}
        />
      </label>
      <small>
        {enclosure.widthMm} × {enclosure.heightMm} × {enclosure.depthMm} mm
      </small>
    </div>
  );
}
