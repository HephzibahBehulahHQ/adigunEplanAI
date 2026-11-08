import { useRef, useState } from "react";
import type { Project } from "../../../packages/electrical-model/project.ts";
import type { MessageKey } from "../../../packages/localization";
import { CabinetMount } from "./CabinetMount";

type Vector = { x: number; y: number; z: number };
type Props = {
  project: Project;
  t: (key: MessageKey) => string;
  addEnclosure: (enclosure: Project["enclosures"][number]) => boolean;
  mount: (placement: Project["equipment3d"][number]) => boolean;
  unmount: (id: string) => boolean;
};
const dimensionFields = [
  ["widthMm", "cabinetWidth"],
  ["heightMm", "cabinetHeight"],
  ["depthMm", "cabinetDepth"],
] as const;
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

const views = {
  cabinetOblique: { azimuth: 35, elevation: 25 },
  cabinetFront: { azimuth: 0, elevation: 0 },
  cabinetSide: { azimuth: 90, elevation: 0 },
  cabinetTop: { azimuth: 0, elevation: 90 },
} as const;

export function EnclosureView({
  project,
  t,
  addEnclosure,
  mount,
  unmount,
}: Props) {
  const [id, setId] = useState("");
  const createDialog = useRef<HTMLDialogElement>(null);
  const [magnification, setMagnification] = useState(1);
  const drag = useRef<{
    pointer: number;
    x: number;
    y: number;
    azimuth: number;
    elevation: number;
  } | null>(null);
  const [camera, setCamera] = useState<{ azimuth: number; elevation: number }>(
    views.cabinetOblique,
  );
  const enclosure =
    project.enclosures.find((item) => item.id === id) ?? project.enclosures[0];
  const createControl = (
    <>
      <button type="button" onClick={() => createDialog.current?.showModal()}>
        {t("cabinetCreate")}
      </button>
      <dialog ref={createDialog} aria-label={t("cabinetCreate")}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const fields = new FormData(form);
            const name = String(fields.get("name") ?? "").trim();
            const widthMm = Number(fields.get("widthMm"));
            const heightMm = Number(fields.get("heightMm"));
            const depthMm = Number(fields.get("depthMm"));
            const id = crypto.randomUUID();
            if (addEnclosure({ id, name, widthMm, heightMm, depthMm })) {
              setId(id);
              setMagnification(1);
              form.reset();
              createDialog.current?.close();
            }
          }}
        >
          <label>
            {t("cabinetName")} <input name="name" required maxLength={160} />
          </label>
          {dimensionFields.map(([name, label]) => (
            <label key={name}>
              {t(label)}{" "}
              <input
                name={name}
                type="number"
                required
                min="0.01"
                max="1000000"
                step="any"
              />
            </label>
          ))}
          <div className="dialog-actions">
            <button type="button" onClick={() => createDialog.current?.close()}>
              {t("cancel")}
            </button>
            <button type="submit">{t("create")}</button>
          </div>
        </form>
      </dialog>
    </>
  );
  if (!enclosure) return <div className="enclosure-view">{createControl}</div>;

  const radians = (camera.azimuth * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const pitch = (camera.elevation * Math.PI) / 180;
  const up = Math.cos(pitch);
  const tilt = Math.sin(pitch);
  const cameraDepth = ({ x, y, z }: Vector) =>
    (sine * x + cosine * z) * up + tilt * y;
  function projectPoint({ x, y, z }: Vector) {
    return {
      x: cosine * x - sine * z,
      y: (sine * x + cosine * z) * tilt - up * y,
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
  const width = (right - left + 2 * margin) / magnification;
  const height = (bottom - top + 2 * margin) / magnification;
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
      {createControl}
      <CabinetMount
        key={enclosure.id}
        project={project}
        enclosure={enclosure}
        mount={mount}
        unmount={unmount}
        t={t}
      />
      <select
        aria-label={t("panel3d")}
        value={enclosure.id}
        onChange={(event) => {
          setId(event.target.value);
          setMagnification(1);
        }}
      >
        {project.enclosures.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      <div className="cabinet-viewport">
        <svg
          role="img"
          aria-label={enclosure.name}
          viewBox={`${(left + right - width) / 2} ${(top + bottom - height) / 2} ${width} ${height}`}
          onPointerDown={(event) => {
            if (!event.isPrimary || event.button !== 0) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = {
              pointer: event.pointerId,
              x: event.clientX,
              y: event.clientY,
              ...camera,
            };
          }}
          onPointerMove={(event) => {
            const start = drag.current;
            if (start?.pointer !== event.pointerId) return;
            const azimuth = start.azimuth + (event.clientX - start.x) / 2;
            setCamera({
              azimuth: ((azimuth % 360) + 360) % 360,
              elevation: Math.max(
                -90,
                Math.min(90, start.elevation - (event.clientY - start.y) / 2),
              ),
            });
          }}
          onLostPointerCapture={() => {
            drag.current = null;
          }}
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
        <div
          className="cabinet-views"
          role="group"
          aria-label={t("workspaceView")}
        >
          {(Object.keys(views) as (keyof typeof views)[]).map((key) => (
            <button
              type="button"
              key={key}
              aria-pressed={
                camera.azimuth === views[key].azimuth &&
                camera.elevation === views[key].elevation
              }
              onClick={() => setCamera(views[key])}
            >
              {t(key)}
            </button>
          ))}
        </div>
      </div>
      <div className="cabinet-zoom" role="group" aria-label={t("zoom")}>
        <button
          type="button"
          aria-label={`${t("zoom")} −`}
          disabled={magnification <= 0.5}
          onClick={() =>
            setMagnification((value) => Math.max(0.5, value / 1.25))
          }
        >
          −
        </button>
        <output>{Math.round(magnification * 100)}%</output>
        <button
          type="button"
          aria-label={`${t("zoom")} +`}
          disabled={magnification >= 4}
          onClick={() => setMagnification((value) => Math.min(4, value * 1.25))}
        >
          +
        </button>
        <button
          type="button"
          disabled={magnification === 1}
          onClick={() => setMagnification(1)}
        >
          {t("fitPage")}
        </button>
      </div>
      <label>
        {t("rotate")}{" "}
        <input
          type="range"
          min="0"
          max="360"
          step="any"
          value={camera.azimuth}
          onChange={(event) =>
            setCamera({
              azimuth: event.target.valueAsNumber,
              elevation: views.cabinetOblique.elevation,
            })
          }
        />
      </label>
      <small>
        {enclosure.widthMm} × {enclosure.heightMm} × {enclosure.depthMm} mm
      </small>
    </div>
  );
}
