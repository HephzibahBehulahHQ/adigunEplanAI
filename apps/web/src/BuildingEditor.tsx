import { EquipmentTools } from "./EquipmentTools";
import { CircuitRouteTools } from "./CircuitRouteTools";
import { equipmentCorners } from "../../../packages/building-design/equipment.ts";
import { SymbolArtwork } from "./SymbolArtwork";
import { Glyph } from "./Glyph";
import { scaledPlanSvg } from "./scaledPlanSvg";
import {
  scaledPlanSize,
  setFloorDrawingScale,
} from "../../../packages/building-design/scale.ts";
import { ZoneTools } from "./ZoneTools";
import { DxfImportTools } from "./DxfImportTools";
import { PlanImportTools } from "./PlanImportTools";
import {
  openingGeometry,
  wallSegments,
} from "../../../packages/building-design/openings.ts";
import { WallTools } from "./WallTools";
import { wallFootprint } from "../../../packages/building-design/walls.ts";
import {
  parseRoomBoundary,
  measureRoom,
  addPolygonRoom,
  updateRoom,
} from "../../../packages/building-design/rooms.ts";
import {
  snap,
  type Point,
} from "../../../packages/engineering-core/geometry.ts";
import { useMemo, useRef, useState } from "react";
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
  const [selectedEquipmentId, setSelectedEquipmentId] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const planRef = useRef<SVGSVGElement>(null);
  const [drawing, setDrawing] = useState<{
    floorId: string;
    name: string;
    grid: number;
    points: Point[];
    viewBox: string;
  } | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [showDimensions, setShowDimensions] = useState(false);
  const [buildingId, setBuildingId] = useState("");
  const [floorId, setFloorId] = useState("");
  const p = native.project;
  const measurements = useMemo(
    () =>
      new Map(
        (p?.rooms ?? []).map((room) => {
          try {
            return [room.id, measureRoom(room.boundary)] as const;
          } catch {
            return [room.id, null] as const;
          }
        }),
      ),
    [p?.rooms],
  );
  if (!p) return null;
  const building =
    p.buildings.find((b) => b.id === buildingId) ?? p.buildings[0];
  const floors = p.floors.filter((f) => f.buildingId === building?.id);
  const floor = floors.find((f) => f.id === floorId) ?? floors[0];
  const selectedZone = p.planZones.find(
    (z) => z.id === selectedZoneId && z.floorId === floor?.id,
  );
  const rooms = p.rooms.filter((r) => r.floorId === floor?.id);
  const visibleWalls = p.walls.filter(
    (w) =>
      w.floorId === floor?.id &&
      p.architecturalLayers.some((l) => l.id === w.layerId && l.visible),
  );
  const visibleOpenings = p.wallOpenings.flatMap((o) => {
    const wall = visibleWalls.find((w) => w.id === o.wallId);
    return wall ? [{ opening: o, geometry: openingGeometry(wall, o) }] : [];
  });
  const importedShapes = p.planGeometry.filter(
    (s) =>
      s.floorId === floor?.id &&
      p.architecturalLayers.some((l) => l.id === s.layerId && l.visible),
  );
  const equipment = p.planEquipment.filter(
    (e) =>
      e.floorId === floor?.id &&
      p.architecturalLayers.some((l) => l.id === e.layerId && l.visible),
  );
  const visibleRoutes = p.planRoutes.filter(
    (route) =>
      route.floorId === floor?.id &&
      p.architecturalLayers.some(
        (layer) => layer.id === route.layerId && layer.visible,
      ),
  );
  const routeLabels = new Map(
    visibleRoutes.map((route) => {
      const circuit = p.circuits.find((item) => item.id === route.circuitId);
      const full = circuit ? `${route.name} · ${circuit.name}` : route.name;
      return [route.id, full.length > 34 ? full.slice(0, 32) + "…" : full];
    }),
  );
  const planShapes = [
    ...visibleRoutes.map((route) => [
      ...route.points,
      { x: route.points[0].x, y: route.points[0].y - 220 },
      {
        x: route.points[0].x + routeLabels.get(route.id)!.length * 70,
        y: route.points[0].y,
      },
    ]),
    ...equipment.map((e) => {
      const symbol = p.symbolInstances.find(
        (s) => s.id === e.symbolInstanceId,
      )!;
      const definition = p.symbolDefinitions.find(
        (d) => d.id === symbol.definitionId,
      )!;
      const reference = p.devices.find(
        (d) => d.id === symbol.deviceId,
      )!.reference;
      const halfLabel = Math.min(16, reference.length) * 50;
      const baseline =
        e.position.y +
        (Math.max(definition.widthMm, definition.heightMm) * e.symbolScale) /
          2 +
        80;
      return [
        ...equipmentCorners(p, e),
        { x: e.position.x - halfLabel, y: baseline - 100 },
        { x: e.position.x + halfLabel, y: baseline + 30 },
      ];
    }),
    ...importedShapes.map((s) => s.points),
    ...rooms.map((r) => r.boundary),
    ...visibleOpenings
      .filter(({ opening }) => opening.kind === "door")
      .map(({ opening, geometry }) => [
        {
          x: geometry.hinge.x - opening.widthMm,
          y: geometry.hinge.y - opening.widthMm,
        },
        {
          x: geometry.hinge.x + opening.widthMm,
          y: geometry.hinge.y + opening.widthMm,
        },
      ]),
    ...visibleWalls.map((w) => wallFootprint(w)),
  ];
  const bounds = planShapes.reduce(
    (bounds, boundary) =>
      boundary.reduce(
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
  const minX = planShapes.length ? bounds.minX : 0;
  const minY = planShapes.length ? bounds.minY : 0;
  const width = planShapes.length ? bounds.maxX - minX : 10000;
  const height = planShapes.length ? bounds.maxY - minY : 8000;
  const margin = Math.max(width, height, 1000) * 0.05;
  const activeDrawing = drawing?.floorId === floor?.id ? drawing : null;
  const planViewBox = `${minX - margin} ${minY - margin} ${Math.max(width, 1) + 2 * margin} ${Math.max(height, 1) + 2 * margin}`;
  const paperSize = floor
    ? scaledPlanSize(planViewBox, floor.drawingScale)
    : null;
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
          <EquipmentTools
            key={`equipment-${floor.id}`}
            native={native}
            floorId={floor.id}
            selectedId={selectedEquipmentId}
            select={setSelectedEquipmentId}
            t={t}
          />
          <CircuitRouteTools
            key={`circuits-${floor.id}`}
            native={native}
            floorId={floor.id}
            selectedRouteId={selectedRouteId}
            selectRoute={setSelectedRouteId}
            t={t}
          />
          <ZoneTools
            key={`zones-${floor.id}`}
            native={native}
            floorId={floor.id}
            selectedId={selectedZoneId}
            select={setSelectedZoneId}
            t={t}
          />
          <DxfImportTools
            key={`dxf-${floor.id}`}
            native={native}
            floorId={floor.id}
            t={t}
          />
          <PlanImportTools
            key={`import-${floor.id}`}
            native={native}
            floorId={floor.id}
            t={t}
          />
          <WallTools key={floor.id} native={native} floorId={floor.id} t={t} />
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
          <label>
            <input
              type="checkbox"
              checked={showDimensions}
              onChange={(e) => setShowDimensions(e.target.checked)}
            />
            {t("showRoomDimensions")}
          </label>
          <form
            key={`scale-${floor.id}-${floor.drawingScale}`}
            aria-label={t("planScale")}
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              native.update((p) =>
                setFloorDrawingScale(p, floor.id, Number(data.get("scale"))),
              );
            }}
          >
            <label>
              {t("scaleDenominator")}
              <input
                name="scale"
                type="number"
                min="1"
                max="10000"
                step="any"
                defaultValue={floor.drawingScale}
                required
              />
            </label>
            <button disabled={!!activeDrawing}>{t("applyPlanScale")}</button>
          </form>
          <p>{t("planScaleScope")}</p>
          <output aria-label={t("scaledPlanSize")}>
            1:{floor.drawingScale} · {paperSize!.widthMm.toFixed(2)} ×{" "}
            {paperSize!.heightMm.toFixed(2)} mm
          </output>
          <button
            disabled={!!activeDrawing}
            onClick={() => {
              if (!planRef.current) return;
              const url = URL.createObjectURL(
                new Blob([scaledPlanSvg(planRef.current, floor.drawingScale)], {
                  type: "image/svg+xml",
                }),
              );
              const anchor = document.createElement("a");
              anchor.href = url;
              anchor.download = `${floor.name.replace(/[^A-Za-z0-9_-]/g, "_")}-1-${floor.drawingScale}.svg`;
              anchor.click();
              window.setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
          >
            {t("exportScaledPlan")}
          </button>
          <svg
            ref={planRef}
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
            {importedShapes.map((s) => (
              <path
                key={s.id}
                data-plan-geometry-id={s.id}
                d={
                  s.points
                    .map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`)
                    .join(" ") + (s.closed ? " Z" : "")
                }
                fill="none"
                stroke="currentColor"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              >
                <title>{s.name}</title>
              </path>
            ))}
            {visibleWalls.flatMap((wall) =>
              wallSegments(wall, p.wallOpenings).map((w, index) => (
                <polygon
                  key={`${w.id}-${index}`}
                  data-wall-id={w.id}
                  points={wallFootprint(w)
                    .map((p) => `${p.x},${p.y}`)
                    .join(" ")}
                  fill="currentColor"
                  fillOpacity={0.2}
                  stroke="currentColor"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                >
                  <title>{w.name}</title>
                </polygon>
              )),
            )}
            {visibleOpenings.map(({ opening: o, geometry: g }) => (
              <g
                key={o.id}
                data-opening-id={o.id}
                fill="none"
                stroke="currentColor"
              >
                <title>{o.name}</title>
                {o.kind === "door" ? (
                  <>
                    <line
                      x1={g.hinge.x}
                      y1={g.hinge.y}
                      x2={g.leaf.x}
                      y2={g.leaf.y}
                      vectorEffect="non-scaling-stroke"
                    />
                    <path d={g.arc} vectorEffect="non-scaling-stroke" />
                  </>
                ) : (
                  <>
                    <polygon
                      points={g.frame.map((p) => `${p.x},${p.y}`).join(" ")}
                      vectorEffect="non-scaling-stroke"
                    />
                    <line
                      x1={g.start.x}
                      y1={g.start.y}
                      x2={g.end.x}
                      y2={g.end.y}
                      vectorEffect="non-scaling-stroke"
                    />
                  </>
                )}
              </g>
            ))}
            {rooms.map((room) => (
              <g key={room.id} data-room-id={room.id}>
                <polygon
                  points={room.boundary.map((v) => `${v.x},${v.y}`).join(" ")}
                  data-zone-id={
                    selectedZone?.roomIds.includes(room.id)
                      ? selectedZone.id
                      : undefined
                  }
                  fill={
                    selectedZone?.roomIds.includes(room.id)
                      ? "currentColor"
                      : "none"
                  }
                  fillOpacity={0.15}
                  stroke="currentColor"
                  strokeWidth={selectedZone?.roomIds.includes(room.id) ? 4 : 2}
                  vectorEffect="non-scaling-stroke"
                />
                {showDimensions &&
                  measurements.get(room.id)?.edges.map((edge, index) => {
                    const x = (edge.from.x + edge.to.x) / 2,
                      y = (edge.from.y + edge.to.y) / 2;
                    const rawAngle =
                      (Math.atan2(
                        edge.to.y - edge.from.y,
                        edge.to.x - edge.from.x,
                      ) *
                        180) /
                      Math.PI;
                    const angle =
                      rawAngle > 90
                        ? rawAngle - 180
                        : rawAngle < -90
                          ? rawAngle + 180
                          : rawAngle;
                    return (
                      <text
                        key={index}
                        data-room-dimension
                        x={x}
                        y={y}
                        dy={-margin * 0.15}
                        textAnchor="middle"
                        transform={`rotate(${angle} ${x} ${y})`}
                        fontSize={margin * 0.4}
                        fill="currentColor"
                      >
                        {Number(edge.lengthMm.toPrecision(6))} mm
                      </text>
                    );
                  })}
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
            {visibleRoutes.map((route) => (
              <g
                key={route.id}
                data-plan-route-id={route.id}
                role="button"
                tabIndex={activeDrawing ? -1 : 0}
                aria-label={`${t("planRouteName")}: ${route.name}`}
                aria-pressed={selectedRouteId === route.id}
                aria-disabled={!!activeDrawing}
                onClick={() => {
                  if (!activeDrawing) setSelectedRouteId(route.id);
                }}
                onKeyDown={(event) => {
                  if (
                    !activeDrawing &&
                    (event.key === "Enter" || event.key === " ")
                  ) {
                    event.preventDefault();
                    setSelectedRouteId(route.id);
                  }
                }}
              >
                <title>
                  {route.name}
                  {route.circuitId
                    ? ` · ${p.circuits.find((item) => item.id === route.circuitId)!.name}`
                    : ""}
                </title>
                <polyline
                  points={route.points
                    .map((point) => `${point.x},${point.y}`)
                    .join(" ")}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={selectedRouteId === route.id ? 4 : 2}
                  strokeDasharray={
                    route.kind === "tray"
                      ? "10 4 2 4"
                      : route.kind === "conduit"
                        ? "8 4"
                        : undefined
                  }
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  data-plan-route-label={route.id}
                  x={route.points[0].x}
                  y={route.points[0].y - 100}
                  fontSize={100}
                  fill="currentColor"
                >
                  {routeLabels.get(route.id)}
                </text>
              </g>
            ))}
            {equipment.map((e) => {
              const instance = p.symbolInstances.find(
                (s) => s.id === e.symbolInstanceId,
              )!;
              const definition = p.symbolDefinitions.find(
                (d) => d.id === instance.definitionId,
              )!;
              const device = p.devices.find((d) => d.id === instance.deviceId)!;
              return (
                <g
                  key={e.id}
                  data-plan-equipment-id={e.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${t("equipmentReference")}: ${device.reference}`}
                  onClick={() => setSelectedEquipmentId(e.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedEquipmentId(e.id);
                    }
                  }}
                >
                  <title>
                    {device.reference} · {device.name}
                  </title>
                  <g
                    transform={`translate(${e.position.x} ${e.position.y}) rotate(${e.rotation}) scale(${e.symbolScale})`}
                    stroke="currentColor"
                    strokeWidth={0.6}
                    fill="none"
                  >
                    {definition.artwork ? (
                      <SymbolArtwork artwork={definition.artwork} />
                    ) : (
                      <Glyph
                        kind={definition.glyph}
                        width={definition.widthMm}
                        height={definition.heightMm}
                      />
                    )}
                  </g>
                  <text
                    x={e.position.x}
                    y={
                      e.position.y +
                      (Math.max(definition.widthMm, definition.heightMm) *
                        e.symbolScale) /
                        2 +
                      80
                    }
                    textAnchor="middle"
                    fontSize={100}
                    fill="currentColor"
                  >
                    {device.reference.length > 16
                      ? device.reference.slice(0, 14) + "…"
                      : device.reference}
                  </text>
                </g>
              );
            })}
          </svg>
          <ul>
            {rooms.map((room) => (
              <li key={room.id}>
                <details>
                  <summary>{room.name}</summary>
                  {measurements.get(room.id) ? (
                    <dl>
                      <dt>{t("roomArea")}</dt>
                      <dd>
                        {Number(
                          (
                            measurements.get(room.id)!.areaMm2 / 1000000
                          ).toPrecision(6),
                        )}{" "}
                        m²
                      </dd>
                      <dt>{t("roomPerimeter")}</dt>
                      <dd>
                        {Number(
                          (
                            measurements.get(room.id)!.perimeterMm / 1000
                          ).toPrecision(6),
                        )}{" "}
                        m
                      </dd>
                    </dl>
                  ) : (
                    <p>{t("roomMeasurementUnavailable")}</p>
                  )}
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
