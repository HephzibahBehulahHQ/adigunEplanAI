import { useRef, useState, type FormEvent, type PointerEvent } from "react";
import type { NativeProjects } from "./useNativeProjects";
import type { MessageKey } from "../../../packages/localization";
import type { Project } from "../../../packages/electrical-model/project.ts";
import {
  createPanelDevice,
  saveEnclosure,
  removeEnclosure,
  savePanelStructure,
  removePanelStructure,
  savePanelPlacement,
  removePanelPlacement,
  sourceDimensions,
  type Enclosure,
  type Structure,
  type Placement,
} from "../../../packages/panel-engineering/commands.ts";
import {
  boxEdges,
  boxVertices,
  projectedFaces,
  projectPoint3d,
  volumeBounds,
  accessBounds,
  type PanelVolume,
  type QuarterTurn,
  type Vector3,
  type PanelDiagnostic,
} from "../../../packages/panel-engineering/geometry.ts";
import { orderProjectedFaces } from "../../../packages/panel-engineering/visibility.ts";
import {
  panelReport,
  panelLayoutSvg,
  panelGeometryObj,
} from "../../../packages/panel-engineering/report.ts";
import {
  heatBalance,
  ductOccupancy,
} from "../../../packages/panel-engineering/estimates.ts";
import { downloadFile } from "./download";
import { PanelFeatureTools } from "./PanelFeatureTools";
import {
  featureOutline,
  featureVertices,
} from "../../../packages/panel-engineering/features.ts";
import "./panel-editor.css";

type Translate = (key: MessageKey) => string;
type Change = (change: (project: Project) => Project) => boolean;
const coordinateKeys: Record<keyof Vector3, MessageKey> = {
  x: "panelPositionX",
  y: "panelPositionY",
  z: "panelPositionZ",
};
const sizeKeys: Record<keyof Vector3, MessageKey> = {
  x: "componentWidth",
  y: "componentHeight",
  z: "componentDepth",
};
const structureKeys: Record<Structure["kind"], MessageKey> = {
  plate: "panelPlate",
  "din-rail": "panelDinRail",
  duct: "panelDuct",
  door: "panelDoor",
  compartment: "panelCompartment",
};
const sourceKeys: Record<
  NonNullable<Placement["dimensionSource"]>,
  MessageKey
> = {
  manual: "panelManualSource",
  catalog: "panelCatalogSource",
  custom: "panelCustomSource",
};
const diagnosticKeys: Record<PanelDiagnostic["code"], MessageKey> = {
  "out-of-bounds": "panelOutOfBounds",
  collision: "panelCollision",
  clearance: "panelClearanceWarning",
  "mounting-support": "panelMountingSupport",
  "mounting-position": "panelMountingPosition",
  "mounting-profile": "panelProfileMismatch",
  "access-obstructed": "panelAccessObstructed",
};
const number = (data: FormData, name: string) => Number(data.get(name));
const optionalNumber = (data: FormData, name: string) =>
  String(data.get(name) ?? "").trim() === "" ? undefined : number(data, name);
const vector = (data: FormData, prefix: string): Vector3 => ({
  x: number(data, `${prefix}x`),
  y: number(data, `${prefix}y`),
  z: number(data, `${prefix}z`),
});
const round = (value: number) => Number(value.toFixed(3));

function GeometryFields({
  item,
  t,
  readOnlySize = false,
}: {
  item: Pick<PanelVolume, "positionMm" | "sizeMm" | "rotationDeg">;
  t: Translate;
  readOnlySize?: boolean;
}) {
  return (
    <div className="panel-fields">
      {(["x", "y", "z"] as const).map((axis) => (
        <label key={`position-${axis}`}>
          {t(coordinateKeys[axis])}
          <input
            name={`position${axis}`}
            type="number"
            step="any"
            min={-1e6}
            max={1e6}
            defaultValue={item.positionMm[axis]}
            required
          />
        </label>
      ))}
      {(["x", "y", "z"] as const).map((axis) => (
        <label key={`size-${axis}`}>
          {t(sizeKeys[axis])}
          <input
            name={`size${axis}`}
            type="number"
            step="any"
            min="0.001"
            max={1e6}
            defaultValue={item.sizeMm[axis]}
            readOnly={readOnlySize}
            required
          />
        </label>
      ))}
      <label>
        {t("panelRotation")}
        <select
          name="rotation"
          aria-label={t("panelRotation")}
          defaultValue={item.rotationDeg ?? 0}
        >
          {[0, 90, 180, 270].map((value) => (
            <option value={value} key={value}>
              {value}°
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function EnclosureForm({
  enclosure,
  run,
  selected,
  t,
}: {
  enclosure?: Enclosure;
  run: Change;
  selected: (id: string) => void;
  t: Translate;
}) {
  const [thermal, setThermal] = useState(!!enclosure?.thermal);
  return (
    <form
      aria-label={t("panelSaveEnclosure")}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        let id = enclosure?.id ?? "";
        if (
          run((project) => {
            const next = saveEnclosure(
              project,
              {
                name: String(data.get("name")),
                widthMm: number(data, "width"),
                heightMm: number(data, "height"),
                depthMm: number(data, "depth"),
                features: enclosure?.features,
                ...(thermal
                  ? {
                      thermal: {
                        ambientC: number(data, "ambient"),
                        heatTransferCoefficientWm2K: number(
                          data,
                          "heatTransfer",
                        ),
                        exposedAreaM2: number(data, "area"),
                        additionalLossW: number(data, "otherLoss"),
                        coolingW: number(data, "cooling"),
                      },
                    }
                  : {}),
              },
              enclosure?.id,
            );
            id = enclosure?.id ?? next.enclosures.at(-1)!.id;
            return next;
          })
        )
          selected(id);
      }}
    >
      <div className="panel-fields">
        <label>
          {t("panelEnclosureName")}
          <input
            name="name"
            maxLength={160}
            defaultValue={enclosure?.name ?? t("panelNewEnclosure")}
            required
          />
        </label>
        <label>
          {t("componentWidth")}
          <input
            name="width"
            type="number"
            step="any"
            min="0.001"
            max={1e6}
            defaultValue={enclosure?.widthMm ?? 600}
            required
          />
        </label>
        <label>
          {t("componentHeight")}
          <input
            name="height"
            type="number"
            step="any"
            min="0.001"
            max={1e6}
            defaultValue={enclosure?.heightMm ?? 800}
            required
          />
        </label>
        <label>
          {t("componentDepth")}
          <input
            name="depth"
            type="number"
            step="any"
            min="0.001"
            max={1e6}
            defaultValue={enclosure?.depthMm ?? 200}
            required
          />
        </label>
      </div>
      <label className="panel-checkbox">
        <input
          type="checkbox"
          checked={thermal}
          onChange={(event) => setThermal(event.target.checked)}
        />
        {t("panelThermalEnable")}
      </label>
      {thermal && (
        <fieldset>
          <legend>{t("panelThermal")}</legend>
          <p>{t("panelThermalScope")}</p>
          <div className="panel-fields">
            <label>
              {t("panelAmbient")}
              <input
                name="ambient"
                type="number"
                step="any"
                defaultValue={enclosure?.thermal?.ambientC ?? ""}
                required
              />
            </label>
            <label>
              {t("panelHeatTransfer")}
              <input
                name="heatTransfer"
                type="number"
                step="any"
                min="0.001"
                defaultValue={
                  enclosure?.thermal?.heatTransferCoefficientWm2K ?? ""
                }
                required
              />
            </label>
            <label>
              {t("panelExposedArea")}
              <input
                name="area"
                type="number"
                step="any"
                min="0.001"
                defaultValue={enclosure?.thermal?.exposedAreaM2 ?? ""}
                required
              />
            </label>
            <label>
              {t("panelAdditionalLoss")}
              <input
                name="otherLoss"
                type="number"
                step="any"
                min="0"
                defaultValue={enclosure?.thermal?.additionalLossW ?? 0}
                required
              />
            </label>
            <label>
              {t("panelCooling")}
              <input
                name="cooling"
                type="number"
                step="any"
                min="0"
                defaultValue={enclosure?.thermal?.coolingW ?? 0}
                required
              />
            </label>
          </div>
        </fieldset>
      )}
      <button type="submit">{t("panelSaveEnclosure")}</button>
      {enclosure && (
        <button
          type="button"
          onClick={() => {
            if (run((project) => removeEnclosure(project, enclosure.id)))
              selected("");
          }}
        >
          {t("panelRemoveEnclosure")}
        </button>
      )}
    </form>
  );
}

function StructureForm({
  project,
  enclosure,
  item,
  run,
  selected,
  t,
}: {
  project: Project;
  enclosure: Enclosure;
  item?: Structure;
  run: Change;
  selected: (id: string) => void;
  t: Translate;
}) {
  const [kind, setKind] = useState<Structure["kind"]>(item?.kind ?? "plate");
  const defaults = {
    positionMm:
      kind === "door"
        ? { x: 0, y: 0, z: Math.max(0, enclosure.depthMm - 2) }
        : { x: 20, y: 20, z: 0 },
    sizeMm:
      kind === "plate"
        ? {
            x: Math.max(1, enclosure.widthMm - 40),
            y: Math.max(1, enclosure.heightMm - 40),
            z: 2,
          }
        : kind === "din-rail"
          ? { x: Math.max(1, enclosure.widthMm - 40), y: 35, z: 7.5 }
          : kind === "door"
            ? {
                x: enclosure.widthMm,
                y: enclosure.heightMm,
                z: Math.min(2, enclosure.depthMm),
              }
            : kind === "compartment"
              ? {
                  x: Math.max(1, enclosure.widthMm - 40),
                  y: Math.max(1, enclosure.heightMm / 2 - 20),
                  z: enclosure.depthMm,
                }
              : { x: 40, y: Math.max(1, enclosure.heightMm - 40), z: 40 },
  };
  return (
    <form
      aria-label={t("panelSaveStructure")}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        let id = item?.id ?? "";
        if (
          run((draft) => {
            const next = savePanelStructure(
              draft,
              {
                name: String(data.get("name")),
                enclosureId: enclosure.id,
                kind,
                mountingProfile: ["plate", "din-rail"].includes(kind)
                  ? String(data.get("profile") ?? "").trim() || undefined
                  : undefined,
                positionMm: vector(data, "position"),
                sizeMm: vector(data, "size"),
                rotationDeg: number(data, "rotation") as QuarterTurn,
                ...(kind === "duct"
                  ? {
                      cableDiametersMm: String(
                        data.get("diameters") ?? "",
                      ).trim()
                        ? String(data.get("diameters"))
                            .split(/[\s,;]+/)
                            .filter(Boolean)
                            .map(Number)
                        : [],
                      usableCrossSectionMm2: optionalNumber(data, "ductArea"),
                      maximumFillPercent: optionalNumber(data, "fillLimit"),
                    }
                  : {}),
              },
              item?.id,
            );
            id = item?.id ?? next.panelStructures.at(-1)!.id;
            return next;
          })
        )
          selected(id);
      }}
    >
      <label>
        {t("panelStructureName")}
        <input
          name="name"
          maxLength={160}
          defaultValue={item?.name ?? t("panelNewStructure")}
          required
        />
      </label>
      <label>
        {t("panelStructureKind")}
        <select
          aria-label={t("panelStructureKind")}
          value={kind}
          onChange={(event) => setKind(event.target.value as Structure["kind"])}
        >
          {(["plate", "din-rail", "duct", "door", "compartment"] as const).map(
            (value) => (
              <option value={value} key={value}>
                {t(structureKeys[value])}
              </option>
            ),
          )}
        </select>
      </label>
      <GeometryFields key={kind} item={item ?? defaults} t={t} />
      {["plate", "din-rail"].includes(kind) && (
        <label>
          {t("panelSupportProfile")}
          <input
            name="profile"
            maxLength={160}
            defaultValue={item?.mountingProfile ?? ""}
          />
        </label>
      )}
      {kind === "duct" && (
        <fieldset>
          <legend>{t("panelDuctEstimate")}</legend>
          <p>{t("panelDuctScope")}</p>
          <label>
            {t("panelCableDiameters")}
            <input
              name="diameters"
              maxLength={100000}
              defaultValue={item?.cableDiametersMm?.join(", ") ?? ""}
            />
          </label>
          <div className="panel-fields">
            <label>
              {t("panelDuctArea")}
              <input
                name="ductArea"
                type="number"
                step="any"
                min="0.001"
                defaultValue={item?.usableCrossSectionMm2 ?? ""}
              />
            </label>
            <label>
              {t("panelFillLimit")}
              <input
                name="fillLimit"
                type="number"
                step="any"
                min="0.001"
                max="100"
                defaultValue={item?.maximumFillPercent ?? ""}
              />
            </label>
          </div>
        </fieldset>
      )}
      <button type="submit">{t("panelSaveStructure")}</button>
      {item && (
        <button
          type="button"
          disabled={project.equipment3d.some(
            (p) => p.mountingStructureId === item.id,
          )}
          onClick={() => {
            if (run((draft) => removePanelStructure(draft, item.id)))
              selected("");
          }}
        >
          {t("panelRemoveStructure")}
        </button>
      )}
    </form>
  );
}

function EquipmentForm({
  project,
  enclosure,
  item,
  run,
  selected,
  t,
}: {
  project: Project;
  enclosure: Enclosure;
  item?: Placement;
  run: Change;
  selected: (id: string) => void;
  t: Translate;
}) {
  const [deviceId, setDeviceId] = useState(item?.deviceId ?? "__new__");
  const source = sourceDimensions(project, deviceId);
  const [dimensionChoice, setDimensionChoice] = useState<
    NonNullable<Placement["dimensionSource"]>
  >(item?.dimensionSource ?? "manual");
  const dimensionSource =
    source && source.source === dimensionChoice ? dimensionChoice : "manual";
  const isNew = deviceId === "__new__";
  const available = project.devices.filter(
    (device) =>
      device.id === item?.deviceId ||
      !project.equipment3d.some((p) => p.deviceId === device.id),
  );
  const defaults = {
    positionMm: { x: 50, y: 50, z: 10 },
    sizeMm: { x: 60, y: 80, z: 50 },
  };
  return (
    <form
      aria-label={t("panelSavePlacement")}
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        let id = item?.id ?? "";
        if (
          run((draft) => {
            const input = {
              name: String(data.get("name")),
              enclosureId: enclosure.id,
              positionMm: vector(data, "position"),
              sizeMm: vector(data, "size"),
              rotationDeg: number(data, "rotation") as QuarterTurn,
              clearanceMm: number(data, "clearance"),
              lossPowerW: optionalNumber(data, "loss"),
              mountingStructureId:
                String(data.get("support") ?? "") || undefined,
              requiredMountingProfile:
                String(data.get("profile") ?? "").trim() || undefined,
              accessClearanceMm: optionalNumber(data, "access"),
              accessDirection:
                optionalNumber(data, "access") === undefined
                  ? undefined
                  : (String(
                      data.get("accessDirection"),
                    ) as Placement["accessDirection"]),
            };
            const next = isNew
              ? createPanelDevice(draft, {
                  ...input,
                  reference: String(data.get("reference")),
                })
              : savePanelPlacement(
                  draft,
                  { ...input, deviceId, dimensionSource },
                  item?.id,
                );
            id = item?.id ?? next.equipment3d.at(-1)!.id;
            return next;
          })
        )
          selected(id);
      }}
    >
      <label>
        {t("device")}
        <select
          aria-label={t("device")}
          value={deviceId}
          disabled={!!item}
          onChange={(event) => {
            setDeviceId(event.target.value);
            setDimensionChoice("manual");
          }}
        >
          <option value="__new__">{t("panelCreateDevice")}</option>
          {available.map((device) => (
            <option value={device.id} key={device.id}>
              {device.reference} — {device.name}
            </option>
          ))}
        </select>
      </label>
      {isNew && (
        <label>
          {t("panelNewReference")}
          <input name="reference" maxLength={160} required />
        </label>
      )}
      <label>
        {t("equipmentDescription")}
        <input
          name="name"
          maxLength={160}
          defaultValue={item?.name ?? ""}
          required
        />
      </label>
      <label>
        {t("panelGeometrySource")}
        <select
          aria-label={t("panelGeometrySource")}
          value={dimensionSource}
          onChange={(event) =>
            setDimensionChoice(event.target.value as typeof dimensionSource)
          }
        >
          <option value="manual">{t("panelManualSource")}</option>
          {source && (
            <option value={source.source}>
              {t(sourceKeys[source.source])}
            </option>
          )}
        </select>
      </label>
      <GeometryFields
        key={`${deviceId}:${dimensionSource}`}
        item={{
          ...(item ?? defaults),
          sizeMm:
            dimensionSource !== "manual" && source
              ? source.sizeMm
              : (item?.sizeMm ?? defaults.sizeMm),
        }}
        readOnlySize={dimensionSource !== "manual"}
        t={t}
      />
      <div className="panel-fields">
        <label>
          {t("panelSupport")}
          <select
            name="support"
            aria-label={t("panelSupport")}
            defaultValue={item?.mountingStructureId ?? ""}
          >
            <option value="">{t("panelNoSupport")}</option>
            {project.panelStructures
              .filter(
                (structure) =>
                  structure.enclosureId === enclosure.id &&
                  ["plate", "din-rail"].includes(structure.kind),
              )
              .map((structure) => (
                <option value={structure.id} key={structure.id}>
                  {structure.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          {t("panelClearance")}
          <input
            name="clearance"
            type="number"
            step="any"
            min="0"
            max={1e6}
            defaultValue={item?.clearanceMm ?? 0}
            required
          />
        </label>
        <label>
          {t("panelLoss")}
          <input
            name="loss"
            type="number"
            step="any"
            min="0"
            defaultValue={item?.lossPowerW ?? ""}
          />
        </label>
      </div>
      <div className="panel-fields">
        <label>
          {t("panelRequiredProfile")}
          <input
            name="profile"
            maxLength={160}
            defaultValue={item?.requiredMountingProfile ?? ""}
          />
        </label>
        <label>
          {t("panelAccessDirection")}
          <select
            name="accessDirection"
            aria-label={t("panelAccessDirection")}
            defaultValue={item?.accessDirection ?? "front"}
          >
            {(["front", "back", "left", "right", "top", "bottom"] as const).map(
              (direction) => (
                <option key={direction} value={direction}>
                  {t(
                    (
                      {
                        front: "panelFaceFront",
                        back: "panelFaceBack",
                        left: "panelFaceLeft",
                        right: "panelFaceRight",
                        top: "panelFaceTop",
                        bottom: "panelFaceBottom",
                      } as const
                    )[direction],
                  )}
                </option>
              ),
            )}
          </select>
        </label>
        <label>
          {t("panelAccessClearance")}
          <input
            name="access"
            type="number"
            step="any"
            min="0.001"
            max={1e6}
            defaultValue={item?.accessClearanceMm ?? ""}
          />
        </label>
      </div>
      <button type="submit">{t("panelSavePlacement")}</button>
      {item && (
        <button
          type="button"
          onClick={() => {
            if (run((draft) => removePanelPlacement(draft, item.id)))
              selected("");
          }}
        >
          {t("panelRemovePlacement")}
        </button>
      )}
    </form>
  );
}

function PanelViews({
  project,
  enclosure,
  selectedId,
  select,
  move,
  t,
  preview = false,
}: {
  project: Project;
  enclosure: Enclosure;
  selectedId: string;
  select: (id: string) => void;
  move: (id: string, position: Vector3) => void;
  t: Translate;
  preview?: boolean;
}) {
  const frontRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<{
    id: string;
    origin: Vector3;
    start: { x: number; y: number };
    position: Vector3;
  } | null>(null);
  const [yaw, setYaw] = useState(-30);
  const [pitch, setPitch] = useState(20);
  const orbit = useRef<{
    x: number;
    y: number;
    yaw: number;
    pitch: number;
  } | null>(null);
  const structures = project.panelStructures.filter(
    (item) => item.enclosureId === enclosure.id,
  );
  const equipment = project.equipment3d.filter(
    (item) => item.enclosureId === enclosure.id,
  );
  const objects = [...structures, ...equipment].map((item) => {
    if (drag?.id === item.id) return { ...item, positionMm: drag.position };
    if (
      drag &&
      "mountingStructureId" in item &&
      item.mountingStructureId === drag.id
    )
      return {
        ...item,
        positionMm: {
          x: item.positionMm.x + drag.position.x - drag.origin.x,
          y: item.positionMm.y + drag.position.y - drag.origin.y,
          z: item.positionMm.z + drag.position.z - drag.origin.z,
        },
      };
    return item;
  });
  const bounds = [...structures, ...equipment].map(volumeBounds);
  const rawLeft = Math.min(0, ...bounds.map((box) => box.min.x));
  const rawTop = Math.min(0, ...bounds.map((box) => box.min.y));
  const rawWidth =
    Math.max(enclosure.widthMm, ...bounds.map((box) => box.max.x)) - rawLeft;
  const rawHeight =
    Math.max(enclosure.heightMm, ...bounds.map((box) => box.max.y)) - rawTop;
  const padding = Math.max(25, rawWidth * 0.05, rawHeight * 0.05);
  const left = rawLeft - padding;
  const top = rawTop - padding;
  const width = rawWidth + padding * 2;
  const height = rawHeight + padding * 2;
  const labelSize = Math.max(width / 300, height / 340) * 11;
  const enclosureCorners = boxVertices({
    min: { x: 0, y: 0, z: 0 },
    max: { x: enclosure.widthMm, y: enclosure.heightMm, z: enclosure.depthMm },
  }).map((point) => projectPoint3d(point, yaw, pitch));
  const faces = orderProjectedFaces(
    objects
      .filter((item) => !("kind" in item && item.kind === "compartment"))
      .flatMap((item) => projectedFaces(item, yaw, pitch)),
  );
  const access = equipment.find((item) => item.id === selectedId);
  const accessZone = access ? accessBounds(access) : null;
  const accessPoints = accessZone
    ? boxVertices(accessZone).map((point) => projectPoint3d(point, yaw, pitch))
    : [];
  const allPoints = [
    ...enclosureCorners,
    ...faces.flatMap((face) => face.points),
    ...accessPoints,
    ...objects
      .filter((item) => "kind" in item && item.kind === "compartment")
      .flatMap((item) =>
        boxVertices(volumeBounds(item)).map((point) =>
          projectPoint3d(point, yaw, pitch),
        ),
      ),
  ];
  const minX = Math.min(...allPoints.map((point) => point.x)) - 25;
  const minY = Math.min(...allPoints.map((point) => point.y)) - 25;
  const projectedWidth =
    Math.max(...allPoints.map((point) => point.x)) + 25 - minX;
  const projectedHeight =
    Math.max(...allPoints.map((point) => point.y)) + 25 - minY;
  const label = (item: Structure | Placement) =>
    "deviceId" in item
      ? (project.devices.find((d) => d.id === item.deviceId)?.reference ??
        item.name)
      : item.name;
  const color = (item: Structure | Placement) =>
    "kind" in item
      ? item.kind === "plate"
        ? "#cbd5e1"
        : item.kind === "duct"
          ? "#94a3b8"
          : "#d4af37"
      : "#2563eb";
  const location = (event: PointerEvent<SVGElement>) => {
    const matrix = frontRef.current?.getScreenCTM();
    if (!matrix) return { x: 0, y: 0 };
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
      matrix.inverse(),
    );
    return { x: point.x, y: point.y };
  };
  return (
    <div className={`panel-views${preview ? " panel-preview-views" : ""}`}>
      {!preview && (
        <figure>
          <figcaption>{t("panelFrontView")}</figcaption>
          <svg
            ref={frontRef}
            className="panel-front-view"
            role="group"
            aria-label={t("panelFrontView")}
            viewBox={`${left} ${top} ${width} ${height}`}
            onPointerMove={(event) => {
              if (!drag) return;
              const point = location(event);
              setDrag({
                ...drag,
                position: {
                  x: round(drag.origin.x + point.x - drag.start.x),
                  y: round(drag.origin.y + point.y - drag.start.y),
                  z: drag.origin.z,
                },
              });
            }}
            onPointerUp={() => {
              if (
                drag &&
                (drag.position.x !== drag.origin.x ||
                  drag.position.y !== drag.origin.y)
              )
                move(drag.id, drag.position);
              setDrag(null);
            }}
            onPointerCancel={() => setDrag(null)}
          >
            <rect
              x="0"
              y="0"
              width={enclosure.widthMm}
              height={enclosure.heightMm}
              className="panel-enclosure-outline"
            />
            {objects.map((item) => {
              const box = volumeBounds(item);
              return (
                <g
                  key={item.id}
                  data-panel-object={item.id}
                  className="panel-object"
                  role="button"
                  tabIndex={0}
                  aria-label={label(item)}
                  aria-pressed={selectedId === item.id}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      select(item.id);
                    }
                  }}
                  onPointerDown={(event) => {
                    if (event.button !== 0) return;
                    event.preventDefault();
                    select(item.id);
                    frontRef.current?.setPointerCapture(event.pointerId);
                    setDrag({
                      id: item.id,
                      origin: item.positionMm,
                      position: item.positionMm,
                      start: location(event),
                    });
                  }}
                >
                  <title>
                    {label(item)} — {item.sizeMm.x} × {item.sizeMm.y} ×{" "}
                    {item.sizeMm.z} mm
                  </title>
                  <rect
                    x={box.min.x}
                    y={box.min.y}
                    width={box.max.x - box.min.x}
                    height={box.max.y - box.min.y}
                    fill={
                      "kind" in item &&
                      ["door", "compartment"].includes(item.kind)
                        ? "none"
                        : color(item)
                    }
                    strokeDasharray={
                      "kind" in item && item.kind === "compartment"
                        ? "5 3"
                        : undefined
                    }
                    stroke={selectedId === item.id ? "#22d3ee" : "#0b1220"}
                    strokeWidth={selectedId === item.id ? 4 : 1}
                  />
                  <text
                    x={box.min.x + 3}
                    y={box.min.y + labelSize + 2}
                    fontSize={labelSize}
                    fill={
                      "deviceId" in item
                        ? "white"
                        : ["door", "compartment"].includes(item.kind)
                          ? "currentColor"
                          : "#0b1220"
                    }
                  >
                    {label(item)}
                  </text>
                </g>
              );
            })}
            {(enclosure.features ?? [])
              .filter((feature) => ["back", "front"].includes(feature.face))
              .map((feature) => (
                <polyline
                  key={feature.id}
                  data-panel-feature={feature.id}
                  points={featureOutline(feature)
                    .map((point) => `${point.x},${point.y}`)
                    .join(" ")}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1.5"
                  pointerEvents="none"
                >
                  <title>{feature.name}</title>
                </polyline>
              ))}
            <text x="0" y="-8" fontSize={labelSize} fill="currentColor">
              {enclosure.widthMm} × {enclosure.heightMm} × {enclosure.depthMm}{" "}
              mm
            </text>
          </svg>
        </figure>
      )}
      <figure>
        <figcaption>{t("panel3dView")}</figcaption>
        <svg
          className="panel-3d-view"
          role="img"
          aria-label={t("panel3dView")}
          viewBox={`${minX} ${minY} ${projectedWidth} ${projectedHeight}`}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            orbit.current = { x: event.clientX, y: event.clientY, yaw, pitch };
          }}
          onPointerMove={(event) => {
            if (!orbit.current) return;
            setYaw(
              Math.max(
                -180,
                Math.min(
                  180,
                  orbit.current.yaw + (event.clientX - orbit.current.x) * 0.5,
                ),
              ),
            );
            setPitch(
              Math.max(
                -80,
                Math.min(
                  80,
                  orbit.current.pitch + (event.clientY - orbit.current.y) * 0.5,
                ),
              ),
            );
          }}
          onPointerUp={() => {
            orbit.current = null;
          }}
          onPointerCancel={() => {
            orbit.current = null;
          }}
        >
          {faces.map((face, fragment) => {
            const item = objects.find((object) => object.id === face.objectId)!;
            return (
              <g
                key={`${item.id}:${face.side}:${fragment}`}
                data-panel-object={item.id}
                data-panel-side={face.side}
                onClick={() => select(item.id)}
              >
                <title>{label(item)}</title>
                <polygon
                  points={face.points
                    .map((point) => `${point.x},${point.y}`)
                    .join(" ")}
                  fill={color(item)}
                  fillOpacity={
                    "kind" in item && item.kind === "door"
                      ? 0.18
                      : [0.8, 0.9, 0.68, 0.75, 0.85, 1][face.side]
                  }
                />
                <path
                  d={face.edges
                    .map(([a, b]) => `M${a.x},${a.y}L${b.x},${b.y}`)
                    .join(" ")}
                  fill="none"
                  stroke={selectedId === item.id ? "#22d3ee" : "#0b1220"}
                  strokeWidth={selectedId === item.id ? 3 : 0.8}
                  pointerEvents="none"
                />
              </g>
            );
          })}
          {objects
            .filter((item) => "kind" in item && item.kind === "compartment")
            .map((item) => {
              const points = boxVertices(volumeBounds(item)).map((point) =>
                projectPoint3d(point, yaw, pitch),
              );
              return (
                <g
                  key={item.id}
                  data-panel-object={item.id}
                  onClick={() => select(item.id)}
                >
                  <title>{item.name}</title>
                  {boxEdges.map(([a, b]) => (
                    <line
                      key={`${a}:${b}`}
                      x1={points[a].x}
                      y1={points[a].y}
                      x2={points[b].x}
                      y2={points[b].y}
                      stroke={selectedId === item.id ? "#22d3ee" : "#d4af37"}
                      strokeWidth="1"
                      strokeDasharray="4 3"
                    />
                  ))}
                </g>
              );
            })}
          {(enclosure.features ?? []).map((feature) => (
            <polyline
              key={feature.id}
              data-panel-feature={feature.id}
              points={featureVertices(enclosure, feature)
                .map((point) => projectPoint3d(point, yaw, pitch))
                .map((point) => `${point.x},${point.y}`)
                .join(" ")}
              fill="none"
              stroke="#10b981"
              strokeWidth="1.5"
              pointerEvents="none"
            >
              <title>{feature.name}</title>
            </polyline>
          ))}
          {boxEdges.map(([a, b]) => (
            <line
              key={`${a}:${b}`}
              x1={enclosureCorners[a].x}
              y1={enclosureCorners[a].y}
              x2={enclosureCorners[b].x}
              y2={enclosureCorners[b].y}
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="5 3"
              pointerEvents="none"
            />
          ))}
          {accessZone &&
            boxEdges.map(([a, b]) => (
              <line
                key={`access:${a}:${b}`}
                x1={accessPoints[a].x}
                y1={accessPoints[a].y}
                x2={accessPoints[b].x}
                y2={accessPoints[b].y}
                stroke="#22d3ee"
                strokeWidth="1.5"
                strokeDasharray="2 3"
                pointerEvents="none"
              />
            ))}
        </svg>
        <div className="panel-fields">
          <label>
            {t("panelYaw")}
            <input
              type="range"
              min="-180"
              max="180"
              value={yaw}
              onChange={(event) => setYaw(Number(event.target.value))}
            />
          </label>
          <label>
            {t("panelPitch")}
            <input
              type="range"
              min="-80"
              max="80"
              value={pitch}
              onChange={(event) => setPitch(Number(event.target.value))}
            />
          </label>
        </div>
      </figure>
      <p className="panel-view-hint">{t("panelOrbit")}</p>
    </div>
  );
}

/** Presentation-only dock: view controls do not mutate native project geometry. */
export function PanelPreview({
  native,
  t,
}: {
  native: NativeProjects;
  t: Translate;
}) {
  const [selectedId, setSelectedId] = useState("");
  const project = native.project;
  const enclosure =
    project?.enclosures.find((item) => item.id === selectedId) ??
    project?.enclosures[0];
  if (!project || !enclosure) return <p>{t("noRecords")}</p>;
  return (
    <section className="panel-preview" aria-label={t("panel3d")}>
      <label>
        {t("panelEnclosure")}
        <select
          aria-label={t("panelEnclosure")}
          value={enclosure.id}
          onChange={(event) => setSelectedId(event.target.value)}
        >
          {project.enclosures.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <PanelViews
        project={project}
        enclosure={enclosure}
        selectedId=""
        select={() => {}}
        move={() => {}}
        t={t}
        preview
      />
      <p>{t("panelScope")}</p>
    </section>
  );
}

export default function PanelEditor({
  native,
  t,
}: {
  native: NativeProjects;
  t: Translate;
}) {
  const [enclosureChoice, setEnclosureChoice] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [editorOpen, setEditorOpen] = useState<
    "structure" | "equipment" | null
  >(null);
  const [moveStep, setMoveStep] = useState(5);
  const [error, setError] = useState(false);
  const project = native.project;
  if (!project) return null;
  const enclosure =
    enclosureChoice === "__new__"
      ? undefined
      : (project.enclosures.find((item) => item.id === enclosureChoice) ??
        project.enclosures[0]);
  const report = enclosure ? panelReport(project, enclosure.id) : undefined;
  const structure = report?.structures.find((item) => item.id === selectedId);
  const equipment = project.equipment3d.find(
    (item) => item.id === selectedId && item.enclosureId === enclosure?.id,
  );
  const selected = structure ?? equipment;
  const selectObject = (id: string, editor?: "structure" | "equipment") => {
    setSelectedId(id);
    setEditorOpen(
      editor ??
        (project.panelStructures.some((item) => item.id === id)
          ? "structure"
          : "equipment"),
    );
  };
  const run: Change = (change) => {
    const success = native.update(change);
    setError(!success);
    return success;
  };
  const move = (id: string, positionMm: Vector3) => {
    const object =
      project.panelStructures.find((item) => item.id === id) ??
      project.equipment3d.find((item) => item.id === id);
    if (!object) return;
    run((draft) =>
      "kind" in object
        ? savePanelStructure(draft, { ...object, positionMm }, id)
        : savePanelPlacement(draft, { ...object, positionMm }, id),
    );
  };
  const rotate = () => {
    if (!selected) return;
    const rotationDeg = (((selected.rotationDeg ?? 0) + 90) %
      360) as QuarterTurn;
    run((draft) =>
      "kind" in selected
        ? savePanelStructure(draft, { ...selected, rotationDeg }, selected.id)
        : savePanelPlacement(draft, { ...selected, rotationDeg }, selected.id),
    );
  };
  const thermal =
    enclosure?.thermal && report
      ? heatBalance(
          report.equipment.map((item) => item.lossPowerW),
          enclosure.thermal,
        )
      : undefined;
  const objectName = (id: string) =>
    report?.equipment.find((item) => item.id === id)?.reference ??
    report?.structures.find((item) => item.id === id)?.name ??
    id;
  return (
    <section className="panel-editor" aria-label={t("panelDesign")}>
      <h2>{t("panelDesign")}</h2>
      <p>{t("panelScope")}</p>
      <p>{t("panelCoordinates")}</p>
      {error && <p role="alert">{t("panelInvalid")}</p>}
      <label>
        {t("panelEnclosure")}
        <select
          aria-label={t("panelEnclosure")}
          value={enclosure?.id ?? "__new__"}
          onChange={(event) => {
            setEnclosureChoice(event.target.value);
            setSelectedId("");
            setEditorOpen(null);
          }}
        >
          <option value="__new__">{t("panelNewEnclosure")}</option>
          {project.enclosures.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <details open={!enclosure}>
        <summary>{t("panelSaveEnclosure")}</summary>
        <EnclosureForm
          key={`enclosure:${enclosure ? JSON.stringify(enclosure) : "new"}`}
          enclosure={enclosure}
          run={run}
          selected={setEnclosureChoice}
          t={t}
        />
      </details>
      {enclosure && report && (
        <>
          <PanelViews
            key={`view:${enclosure.id}`}
            project={project}
            enclosure={enclosure}
            selectedId={selectedId}
            select={selectObject}
            move={move}
            t={t}
          />
          <p>{t("panelDragHint")}</p>
          <div className="panel-move-controls">
            <label>
              {t("panelMoveStep")}
              <input
                type="number"
                step="any"
                min="0.001"
                max={1e6}
                value={moveStep}
                onChange={(event) => setMoveStep(Number(event.target.value))}
              />
            </label>
            {(
              [
                ["panelMoveLeft", "x", -1],
                ["panelMoveRight", "x", 1],
                ["panelMoveUp", "y", -1],
                ["panelMoveDown", "y", 1],
                ["panelMoveBack", "z", -1],
                ["panelMoveFront", "z", 1],
              ] as const
            ).map(([key, axis, direction]) => (
              <button
                key={key}
                disabled={
                  !selected || !Number.isFinite(moveStep) || moveStep <= 0
                }
                onClick={() => {
                  if (selected)
                    move(selected.id, {
                      ...selected.positionMm,
                      [axis]: round(
                        selected.positionMm[axis] + direction * moveStep,
                      ),
                    });
                }}
              >
                {t(key)}
              </button>
            ))}
            <button disabled={!selected} onClick={rotate}>
              {t("panelRotate")}
            </button>
          </div>
          <div className="panel-editors">
            <details open={editorOpen === "structure"}>
              <summary
                onClick={(event) => {
                  event.preventDefault();
                  setEditorOpen(
                    editorOpen === "structure" ? null : "structure",
                  );
                }}
              >
                {t("panelStructures")}
              </summary>
              <label>
                {t("panelStructures")}
                <select
                  aria-label={t("panelStructures")}
                  value={structure?.id ?? ""}
                  onChange={(event) =>
                    selectObject(event.target.value, "structure")
                  }
                >
                  <option value="">{t("panelNewStructure")}</option>
                  {report.structures.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <StructureForm
                key={`structure:${structure ? JSON.stringify(structure) : enclosure.id}`}
                project={project}
                enclosure={enclosure}
                item={structure}
                run={run}
                selected={(id) => selectObject(id, "structure")}
                t={t}
              />
            </details>
            <details open={editorOpen === "equipment"}>
              <summary
                onClick={(event) => {
                  event.preventDefault();
                  setEditorOpen(
                    editorOpen === "equipment" ? null : "equipment",
                  );
                }}
              >
                {t("panelEquipment")}
              </summary>
              <label>
                {t("panelEquipment")}
                <select
                  aria-label={t("panelEquipment")}
                  value={equipment?.id ?? ""}
                  onChange={(event) =>
                    selectObject(event.target.value, "equipment")
                  }
                >
                  <option value="">{t("panelNewPlacement")}</option>
                  {report.equipment.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.reference} — {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <EquipmentForm
                key={`equipment:${equipment ? JSON.stringify(equipment) : enclosure.id}`}
                project={project}
                enclosure={enclosure}
                item={equipment}
                run={run}
                selected={(id) => selectObject(id, "equipment")}
                t={t}
              />
            </details>
          </div>
          <p>{t("panelStructureScope")}</p>
          <p>{t("panelRuleScope")}</p>
          <PanelFeatureTools
            key={`features:${enclosure.id}`}
            project={project}
            enclosure={enclosure}
            run={run}
            t={t}
          />
          <section aria-label={t("panelDiagnostics")}>
            <h3>{t("panelDiagnostics")}</h3>
            <p>{t("panelCheckScope")}</p>
            <p>
              {t("panelUtilization")}: {round(report.utilization.ratio * 100)}%
            </p>
            {report.diagnostics.length ? (
              <ul className="panel-diagnostics">
                {report.diagnostics.map((diagnostic, index) => (
                  <li
                    key={`${diagnostic.code}:${diagnostic.objectIds.join(":")}:${index}`}
                    data-severity={diagnostic.severity}
                  >
                    {t(diagnosticKeys[diagnostic.code])}:{" "}
                    {diagnostic.objectIds.map(objectName).join(" / ")}
                    {diagnostic.actualMm !== undefined &&
                      ` (${round(diagnostic.actualMm)} / ${diagnostic.requiredMm} mm)`}
                    {diagnostic.requiredProfile &&
                      ` (${diagnostic.actualProfile ?? t("panelUnspecified")} / ${diagnostic.requiredProfile})`}
                  </li>
                ))}
              </ul>
            ) : (
              <p>{t("panelNoDiagnostics")}</p>
            )}
          </section>
          {report.structures.some((item) => item.kind === "duct") && (
            <section aria-label={t("panelDuctEstimate")}>
              <h3>{t("panelDuctEstimate")}</h3>
              <p>{t("panelDuctScope")}</p>
              <ul>
                {report.structures
                  .filter((item) => item.kind === "duct")
                  .map((item) => {
                    const estimate = ductOccupancy(
                      item.cableDiametersMm ?? [],
                      item.usableCrossSectionMm2,
                      item.maximumFillPercent,
                    );
                    return (
                      <li key={item.id}>
                        {item.name}: {t("panelFill")}{" "}
                        {estimate.fillPercent === null
                          ? t("panelUnspecified")
                          : `${round(estimate.fillPercent)}%`}
                        {estimate.exceedsLimit && ` — ${t("panelOverLimit")}`}
                      </li>
                    );
                  })}
              </ul>
            </section>
          )}
          {thermal && (
            <section aria-label={t("panelThermal")}>
              <h3>{t("panelThermal")}</h3>
              <p>{t("panelThermalScope")}</p>
              <dl>
                <dt>{t("panelKnownLoss")}</dt>
                <dd>{round(thermal.knownLossW)} W</dd>
                <dt>{t("panelUnknownLoss")}</dt>
                <dd>{thermal.unknownLossCount}</dd>
                <dt>{t("panelEstimatedTemp")}</dt>
                <dd>
                  {thermal.estimatedInternalC === null
                    ? t("panelUnspecified")
                    : `${round(thermal.estimatedInternalC)} °C`}
                </dd>
              </dl>
            </section>
          )}
          <div className="panel-downloads">
            <button
              onClick={() =>
                downloadFile(
                  "panel-layout.svg",
                  panelLayoutSvg(project, enclosure.id, t("panelExportNote")),
                  "image/svg+xml",
                )
              }
            >
              {t("panelDownloadSvg")}
            </button>
            <button
              onClick={() =>
                downloadFile(
                  "panel-geometry.obj",
                  panelGeometryObj(project, enclosure.id),
                  "text/plain;charset=utf-8",
                )
              }
            >
              {t("panelDownloadObj")}
            </button>
          </div>
          <div className="native-table-scroll">
            <table className="native-bom" aria-label={t("panelPlacementList")}>
              <thead>
                <tr>
                  <th>{t("reference")}</th>
                  <th>{t("equipmentDescription")}</th>
                  <th>X / Y / Z (mm)</th>
                  <th>
                    {t("componentWidth")} × {t("componentHeight")} ×{" "}
                    {t("componentDepth")}
                  </th>
                  <th>{t("panelRotation")}</th>
                  <th>{t("panelGeometrySource")}</th>
                </tr>
              </thead>
              <tbody>
                {report.equipment.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <button
                        onClick={() => selectObject(item.id, "equipment")}
                      >
                        {item.reference}
                      </button>
                    </td>
                    <td>{item.description}</td>
                    <td>
                      {item.positionMm.x} / {item.positionMm.y} /{" "}
                      {item.positionMm.z}
                    </td>
                    <td>
                      {item.sizeMm.x} × {item.sizeMm.y} × {item.sizeMm.z}
                    </td>
                    <td>{item.rotationDeg ?? 0}°</td>
                    <td>{t(sourceKeys[item.dimensionSource ?? "manual"])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
