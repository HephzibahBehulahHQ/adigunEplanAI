import {
  parseRoomBoundary,
  addPolygonRoom,
  updateRoom,
} from "../../../packages/building-design/rooms.ts";
import {
  snap,
  type Point,
} from "../../../packages/engineering-core/geometry.ts";
import { useState } from "react";
import type { NativeProjects } from "./useNativeProjects";
import type { MessageKey } from "../../../packages/localization";
import {
  addBuilding,
  addFloor,
  addRectangularRoom,
  removeRoom,
} from "../../../packages/building-design/structure.ts";

export function BuildingEditor({
  native,
  t,
}: {
  native: NativeProjects;
  t: (key: MessageKey) => string;
}) {
  const [drawing, setDrawing] = useState<{
    floorId: string;
    name: string;
    grid: number;
    points: Point[];
    viewBox: string;
  } | null>(null);
  const [buildingId, setBuildingId] = useState("");
  const [floorId, setFloorId] = useState("");
  const p = native.project;
  if (!p) return null;
  const building =
    p.buildings.find((b) => b.id === buildingId) ?? p.buildings[0];
  const floors = p.floors.filter((f) => f.buildingId === building?.id);
  const floor = floors.find((f) => f.id === floorId) ?? floors[0];
  const rooms = p.rooms.filter((r) => r.floorId === floor?.id);
  const bounds = rooms.reduce(
    (bounds, room) =>
      room.boundary.reduce(
        (b, point) => ({
          minX: Math.min(b.minX, point.x),
          minY: Math.min(b.minY, point.y),
          maxX: Math.max(b.maxX, point.x),
          maxY: Math.max(b.maxY, point.y),
        }),
        bounds,
      ),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
  );
  const minX = rooms.length ? bounds.minX : 0;
  const minY = rooms.length ? bounds.minY : 0;
  const width = rooms.length ? bounds.maxX - minX : 10000;
  const height = rooms.length ? bounds.maxY - minY : 8000;
  const margin = Math.max(width, height, 1000) * 0.05;
  const activeDrawing = drawing?.floorId === floor?.id ? drawing : null;
  const planViewBox = `${minX - margin} ${minY - margin} ${Math.max(width, 1) + 2 * margin} ${Math.max(height, 1) + 2 * margin}`;
  return (
    <section
      className="building-editor"
      aria-label={t("buildingDesign")}
      onKeyDown={(e) => {
        if (e.key === "Escape") setDrawing(null);
      }}
    >
      <h2>{t("buildingDesign")}</h2>
      <p>{t("buildingStructureScope")}</p>
      <form
        aria-label={t("addBuilding")}
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          native.update((p) =>
            addBuilding(
              p,
              String(data.get("name")),
              String(data.get("address")),
            ),
          );
        }}
      >
        <label>
          {t("buildingName")}
          <input name="name" required maxLength={160} />
        </label>
        <label>
          {t("buildingAddress")}
          <input name="address" maxLength={500} />
        </label>
        <button>{t("addBuilding")}</button>
      </form>
      {building && (
        <>
          <label>
            {t("buildingName")}
            <select
              value={building.id}
              onChange={(e) => {
                setDrawing(null);
                setBuildingId(e.target.value);
                setFloorId("");
              }}
            >
              {p.buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <p>{building.address}</p>
          <form
            aria-label={t("addFloor")}
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              native.update((p) =>
                addFloor(
                  p,
                  building.id,
                  String(data.get("name")),
                  Number(data.get("elevation")),
                  Number(data.get("height")),
                ),
              );
            }}
          >
            <label>
              {t("floorName")}
              <input name="name" required maxLength={160} />
            </label>
            <label>
              {t("floorElevation")}
              <input
                name="elevation"
                type="number"
                step="any"
                defaultValue={0}
                required
              />
            </label>
            <label>
              {t("floorHeight")}
              <input
                name="height"
                type="number"
                step="any"
                min={1}
                defaultValue={3000}
                required
              />
            </label>
            <button>{t("addFloor")}</button>
          </form>
        </>
      )}
      {floor && (
        <>
          <label>
            {t("floorName")}
            <select
              value={floor.id}
              onChange={(e) => {
                setDrawing(null);
                setFloorId(e.target.value);
              }}
            >
              {floors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <p>
            {t("floorElevation")}: {floor.elevationMm} · {t("floorHeight")}:{" "}
            {floor.heightMm}
          </p>
          <form
            aria-label={t("addRoom")}
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              native.update((p) =>
                addRectangularRoom(
                  p,
                  floor.id,
                  String(data.get("name")),
                  Number(data.get("x")),
                  Number(data.get("y")),
                  Number(data.get("width")),
                  Number(data.get("depth")),
                ),
              );
            }}
          >
            <label>
              {t("roomName")}
              <input name="name" required maxLength={160} />
            </label>
            {(
              [
                ["roomX", "x", 0],
                ["roomY", "y", 0],
                ["roomWidth", "width", 4000],
                ["roomDepth", "depth", 3000],
              ] as const
            ).map(([label, name, value]) => (
              <label key={name}>
                {t(label)}
                <input
                  name={name}
                  type="number"
                  step="any"
                  min={name === "width" || name === "depth" ? 1 : -1000000}
                  max={1000000}
                  defaultValue={value}
                  required
                />
              </label>
            ))}
            <button>{t("addRoom")}</button>
          </form>
          <form
            aria-label={t("drawRoom")}
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              const grid = Number(data.get("grid"));
              if (Number.isFinite(grid) && grid >= 1 && grid <= 1000)
                setDrawing({
                  floorId: floor.id,
                  name: String(data.get("name")).trim(),
                  grid,
                  points: [],
                  viewBox: planViewBox,
                });
            }}
          >
            <label>
              {t("roomName")}
              <input
                name="name"
                required
                maxLength={160}
                disabled={!!activeDrawing}
              />
            </label>
            <label>
              {t("roomGrid")}
              <input
                name="grid"
                type="number"
                min={1}
                max={1000}
                defaultValue={100}
                required
                disabled={!!activeDrawing}
              />
            </label>
            <button disabled={!!activeDrawing}>{t("drawRoom")}</button>
          </form>
          {activeDrawing && (
            <div className="room-drawing-tools">
              <p role="status">
                {t("roomDrawingHelp")} · {activeDrawing.points.length}/256
              </p>
              <button
                disabled={!activeDrawing.points.length}
                onClick={() =>
                  setDrawing({
                    ...activeDrawing,
                    points: activeDrawing.points.slice(0, -1),
                  })
                }
              >
                {t("removeLastVertex")}
              </button>
              <button
                disabled={activeDrawing.points.length < 3}
                onClick={() => {
                  if (
                    native.update((p) =>
                      addPolygonRoom(
                        p,
                        activeDrawing.floorId,
                        activeDrawing.name,
                        activeDrawing.points,
                      ),
                    )
                  )
                    setDrawing(null);
                }}
              >
                {t("finishRoom")}
              </button>
              <button onClick={() => setDrawing(null)}>
                {t("cancelRoomDrawing")}
              </button>
            </div>
          )}
          <svg
            className="building-plan"
            role="img"
            aria-label={t("roomOutlines")}
            viewBox={activeDrawing?.viewBox ?? planViewBox}
            tabIndex={0}
            onPointerDown={(e) => {
              if (
                !activeDrawing ||
                e.button !== 0 ||
                activeDrawing.points.length >= 256
              )
                return;
              const matrix = e.currentTarget.getScreenCTM();
              if (!matrix) return;
              const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(
                matrix.inverse(),
              );
              const next = {
                x: snap(point.x, activeDrawing.grid),
                y: snap(point.y, activeDrawing.grid),
              };
              if (
                !Number.isFinite(next.x) ||
                !Number.isFinite(next.y) ||
                Math.abs(next.x) > 1000000 ||
                Math.abs(next.y) > 1000000
              )
                return;
              if (
                activeDrawing.points.some(
                  (p) => p.x === next.x && p.y === next.y,
                )
              )
                return;
              e.currentTarget.focus();
              setDrawing({
                ...activeDrawing,
                points: [...activeDrawing.points, next],
              });
            }}
          >
            <title>{floor.name}</title>
            {activeDrawing && (
              <>
                <defs>
                  <pattern
                    id="room-drawing-grid"
                    width={activeDrawing.grid}
                    height={activeDrawing.grid}
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d={`M ${activeDrawing.grid} 0 L 0 0 0 ${activeDrawing.grid}`}
                      fill="none"
                      stroke="currentColor"
                      strokeOpacity={0.15}
                      strokeWidth={1}
                      vectorEffect="non-scaling-stroke"
                    />
                  </pattern>
                </defs>
                <rect
                  x={activeDrawing.viewBox.split(" ")[0]}
                  y={activeDrawing.viewBox.split(" ")[1]}
                  width={activeDrawing.viewBox.split(" ")[2]}
                  height={activeDrawing.viewBox.split(" ")[3]}
                  fill="url(#room-drawing-grid)"
                />
                <polyline
                  data-room-draft
                  points={activeDrawing.points
                    .map((p) => `${p.x},${p.y}`)
                    .join(" ")}
                  fill="none"
                  stroke="var(--cyan)"
                  strokeWidth={3}
                  vectorEffect="non-scaling-stroke"
                />
                {activeDrawing.points.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={Math.max(activeDrawing.grid / 15, 5)}
                    fill="var(--cyan)"
                  />
                ))}
              </>
            )}
            {rooms.map((room) => (
              <g key={room.id} data-room-id={room.id}>
                <polygon
                  points={room.boundary.map((v) => `${v.x},${v.y}`).join(" ")}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={room.boundary[0].x + margin / 3}
                  y={room.boundary[0].y + margin}
                  fontSize={margin * 0.6}
                  fill="currentColor"
                >
                  {room.name}
                </text>
              </g>
            ))}
          </svg>
          <ul>
            {rooms.map((room) => (
              <li key={room.id}>
                <details>
                  <summary>{room.name}</summary>
                  <form
                    key={JSON.stringify(room)}
                    aria-label={`${t("editRoom")}: ${room.name}`}
                    onSubmit={(e) => {
                      e.preventDefault();
                      const data = new FormData(e.currentTarget);
                      native.update((p) =>
                        updateRoom(
                          p,
                          room.id,
                          String(data.get("name")),
                          parseRoomBoundary(String(data.get("boundary"))),
                        ),
                      );
                    }}
                  >
                    <label>
                      {t("roomName")}
                      <input
                        name="name"
                        defaultValue={room.name}
                        required
                        maxLength={160}
                      />
                    </label>
                    <label>
                      {t("roomVertices")}
                      <textarea
                        aria-label={t("roomVertices")}
                        name="boundary"
                        defaultValue={room.boundary
                          .map((p) => `${p.x},${p.y}`)
                          .join("\n")}
                        required
                        maxLength={16000}
                        rows={8}
                      />
                    </label>
                    <p>{t("roomVerticesHelp")}</p>
                    <button>{t("applyRoom")}</button>
                  </form>
                </details>
                <button
                  disabled={p.distributionBoards.some(
                    (b) => b.roomId === room.id,
                  )}
                  onClick={() => native.update((p) => removeRoom(p, room.id))}
                >
                  {t("removeRoom")}: {room.name}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
