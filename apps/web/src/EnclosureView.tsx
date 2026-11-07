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

export function EnclosureView({ project, t }: Props) {
  const [id, setId] = useState("");
  const [angle, setAngle] = useState(35);
  const enclosure =
    project.enclosures.find((item) => item.id === id) ?? project.enclosures[0];
  if (!enclosure) return <p className="empty-hint">{t("noRecords")}</p>;

  const radians = (angle * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  function projectPoint({ x, y, z }: Vector) {
    return { x: cosine * x - sine * z, y: (sine * x + cosine * z) * 0.45 - y };
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
      frame: true,
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
        frame: false,
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
        {boxes.map(({ key, label, frame, points }) => (
          <g
            key={key}
            className={frame ? "enclosure-frame" : "enclosure-equipment"}
          >
            <title>{label}</title>
            {edges.map(([a, b]) => (
              <line
                key={`${a}-${b}`}
                x1={points[a].x}
                y1={points[a].y}
                x2={points[b].x}
                y2={points[b].y}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>
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
