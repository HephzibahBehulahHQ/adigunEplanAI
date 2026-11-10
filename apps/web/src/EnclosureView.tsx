import { useRef, useState } from "react";
import type { Project } from "../../../packages/electrical-model/project.ts";
import type { MessageKey } from "../../../packages/localization";
import { CabinetMount } from "./CabinetMount";

type Vector = { x: number; y: number; z: number };
type Props = {
  project: Project;
  selectedDeviceId: string | null;
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
const axes = [
  { name: "X", direction: { x: 1, y: 0, z: 0 } },
  { name: "Y", direction: { x: 0, y: 1, z: 0 } },
  { name: "Z", direction: { x: 0, y: 0, z: 1 } },
] as const;

export function EnclosureView({
  project,
  selectedDeviceId,
  t,
  addEnclosure,
  mount,
  unmount,
}: Props) {
  const [id, setId] = useState("");
  const [previousDeviceId, setPreviousDeviceId] = useState<string | null>(null);
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
  if (selectedDeviceId !== previousDeviceId) {
    setPreviousDeviceId(selectedDeviceId);
    const mounts = project.equipment3d.filter(
      (item) => item.deviceId === selectedDeviceId,
    );
    if (
      mounts.length &&
      !mounts.some((item) => item.enclosureId === enclosure?.id)
    ) {
      setId(mounts[0].enclosureId);
      setMagnification(1);
    }
  }
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
      selected: false,
      kind: "frame" as const,
      points: corners(
        { x: 0, y: 0, z: 0 },
        { x: enclosure.widthMm, y: enclosure.heightMm, z: enclosure.depthMm },
      ),
    },
    ...project.panelStructures
      .filter((item) => item.enclosureId === enclosure.id)
      .map((item) => ({
        key: item.id,
        label: item.name,
        selected: false,
        kind: item.kind,
        points: corners(item.positionMm, item.sizeMm),
      })),
    ...project.equipment3d
      .filter((item) => item.enclosureId === enclosure.id)
      .map((item) => ({
        key: item.id,
        selected: item.deviceId === selectedDeviceId,
        kind: "equipment" as const,
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
  const [frame, ...components] = boxes;
  const cameraFacingFaces = faces.filter(
    ({ normal }) => cameraDepth(normal) > 1e-10,
  );
  const orientationCorners = corners(
    { x: -14, y: -14, z: -14 },
    { x: 28, y: 28, z: 28 },
  );
  const frameEdges = edges
    .map(([a, b]) => ({
      a,
      b,
      facing: cameraFacingFaces.some(
        ({ indices }) =>
          indices.some((i) => i === a) && indices.some((i) => i === b),
      ),
    }))
    .sort((a, b) => Number(a.facing) - Number(b.facing));
  const visibleFaces = components
    .flatMap(({ key, label, points, selected, kind }) =>
      cameraFacingFaces.map(({ indices, tone }) => {
        const vertices = indices.map((index) => points[index]);
        return {
          key: `${key}:${tone}`,
          label,
          selected,
          kind,
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
      <div className="enclosure-tools">
        {createControl}
        <CabinetMount
          key={enclosure.id}
          project={project}
          enclosure={enclosure}
          mount={mount}
          unmount={unmount}
          t={t}
        />
      </div>
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
          className="cabinet-model"
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
            {frameEdges.map(({ a, b, facing }) => (
              <line
                key={`${a}-${b}`}
                className={facing ? undefined : "enclosure-hidden-edge"}
                x1={frame.points[a].x}
                y1={frame.points[a].y}
                x2={frame.points[b].x}
                y2={frame.points[b].y}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>
          {visibleFaces.map(
            ({ key, label, tone, coordinates, selected, kind }) => (
              <polygon
                key={key}
                className={`enclosure-face enclosure-face-${tone} enclosure-object-${kind}`}
                data-highlighted={selected || undefined}
                points={coordinates}
                vectorEffect="non-scaling-stroke"
              >
                <title>{label}</title>
              </polygon>
            ),
          )}
        </svg>
        <svg
          className="cabinet-axes"
          viewBox="-38 -38 76 76"
          aria-hidden="true"
        >
          {axes.map(({ name, direction }) => {
            const { x, y } = projectPoint(direction);
            if (Math.hypot(x, y) < 0.08) return null;
            return (
              <g key={name} className={`cabinet-axis-${name.toLowerCase()}`}>
                <line x1="0" y1="0" x2={x * 23} y2={y * 23} />
                <text x={x * 30} y={y * 30}>
                  {name}
                </text>
              </g>
            );
          })}
          <circle r="2" />
        </svg>
        <svg
          className="cabinet-orientation"
          viewBox="-29 -29 58 58"
          aria-hidden="true"
        >
          {cameraFacingFaces.map(({ indices, normal, tone }) => {
            const axis = normal.x ? "X" : normal.y ? "Y" : "Z";
            const { x, y } = projectPoint({
              x: normal.x * 14,
              y: normal.y * 14,
              z: normal.z * 14,
            });
            return (
              <g key={tone}>
                <polygon
                  className={`enclosure-face enclosure-face-${tone}`}
                  points={indices
                    .map((index) => {
                      const point = orientationCorners[index];
                      return `${point.x},${point.y}`;
                    })
                    .join(" ")}
                />
                <text x={x} y={y}>
                  {normal.x + normal.y + normal.z > 0 ? "+" : "−"}
                  {axis}
                </text>
              </g>
            );
          })}
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

