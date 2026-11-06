import { useState } from "react";
import {
  circuitSchedule,
  removeDistributionBoard,
  removePlanCircuit,
  saveDistributionBoard,
  savePlanCircuit,
} from "../../../packages/building-design/circuits.ts";
import {
  planRouteLengthM,
  removePlanRoute,
  savePlanRoute,
} from "../../../packages/building-design/routes.ts";
import type { Project } from "../../../packages/electrical-model/project.ts";
import type { MessageKey } from "../../../packages/localization";
import type { NativeProjects } from "./useNativeProjects";

type Props = {
  native: NativeProjects;
  floorId: string;
  selectedRouteId: string;
  selectRoute: (id: string) => void;
  t: (key: MessageKey) => string;
};
type FormProps = Omit<Props, "selectedRouteId" | "selectRoute"> & {
  selectedId: string;
  select: (id: string) => void;
};

function editableLayer(project: Project, id?: string) {
  return project.architecturalLayers.some(
    (layer) =>
      layer.id === id &&
      layer.kind === "electrical" &&
      layer.visible &&
      !layer.locked,
  );
}
function floorDevices(project: Project, floorId: string) {
  return project.planEquipment
    .filter((equipment) => equipment.floorId === floorId)
    .map((equipment) => {
      const symbol = project.symbolInstances.find(
        (item) => item.id === equipment.symbolInstanceId,
      )!;
      return {
        device: project.devices.find((item) => item.id === symbol.deviceId)!,
        editable: editableLayer(project, equipment.layerId),
      };
    });
}
function editableCircuit(
  project: Project,
  circuit: Project["circuits"][number],
) {
  const devices = floorDevices(project, circuit.floorId ?? "");
  const board = project.distributionBoards.find(
    (item) => item.id === circuit.boardId,
  );
  return (
    editableLayer(project, circuit.layerId) &&
    [board?.deviceId, ...circuit.deviceIds].every((id) =>
      devices.some((item) => item.device.id === id && item.editable),
    )
  );
}
function editableRoute(project: Project, route: Project["planRoutes"][number]) {
  return (
    editableLayer(project, route.layerId) &&
    (!route.circuitId ||
      editableLayer(
        project,
        project.circuits.find((item) => item.id === route.circuitId)?.layerId,
      ))
  );
}
const routeLabels = {
  cable: "cablePlanRoute",
  conduit: "conduitPlanRoute",
  tray: "trayPlanRoute",
} as const;
const displayNumber = (value: number) => Number(value.toPrecision(6));

export function CircuitRouteTools(props: Props) {
  const { native, floorId, selectedRouteId, selectRoute, t } = props;
  const project = native.project!;
  const [boardId, setBoardId] = useState("");
  const [circuitId, setCircuitId] = useState("");
  const devices = floorDevices(project, floorId);
  const boards = project.distributionBoards.filter(
    (b) => b.floorId === floorId,
  );
  const board = boards.find((b) => b.id === boardId);
  const circuits = project.circuits.filter((c) => c.floorId === floorId);
  const circuit = circuits.find((c) => c.id === circuitId);
  const routes = project.planRoutes.filter((r) => r.floorId === floorId);
  const route = routes.find((r) => r.id === selectedRouteId);
  const boardReferenced =
    !!board &&
    (project.circuits.some((c) => c.boardId === board.id) ||
      project.planZones.some((zone) => zone.boardId === board.id));
  const circuitReferenced =
    !!circuit && routes.some((r) => r.circuitId === circuit.id);
  return (
    <details className="circuit-route-tools">
      <summary>{t("floorCircuitsAndRoutes")}</summary>
      <p>{t("floorCircuitScope")}</p>
      <h3>{t("floorDistributionBoards")}</h3>
      <label>
        {t("selectedDistributionBoard")}
        <select
          aria-label={t("selectedDistributionBoard")}
          value={board?.id ?? ""}
          onChange={(event) => setBoardId(event.target.value)}
        >
          <option value="">{t("newDistributionBoard")}</option>
          {boards.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <BoardForm
        key={`board:${JSON.stringify(board ?? { floorId })}`}
        {...props}
        selectedId={board?.id ?? ""}
        select={setBoardId}
      />
      {board && (
        <>
          <button
            disabled={
              boardReferenced ||
              !devices.some(
                (item) => item.device.id === board.deviceId && item.editable,
              )
            }
            onClick={() => {
              if (native.update((p) => removeDistributionBoard(p, board.id)))
                setBoardId("");
            }}
          >
            {t("removeDistributionBoard")}
          </button>
          {boardReferenced && <p>{t("boardAssignmentProtection")}</p>}
        </>
      )}
      <h3>{t("floorCircuits")}</h3>
      <label>
        {t("selectedFloorCircuit")}
        <select
          aria-label={t("selectedFloorCircuit")}
          value={circuit?.id ?? ""}
          onChange={(event) => setCircuitId(event.target.value)}
        >
          <option value="">{t("newFloorCircuit")}</option>
          {circuits.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <CircuitForm
        key={`circuit:${JSON.stringify(circuit ?? { floorId })}`}
        {...props}
        selectedId={circuit?.id ?? ""}
        select={setCircuitId}
      />
      {circuit && (
        <>
          <button
            disabled={circuitReferenced || !editableCircuit(project, circuit)}
            onClick={() => {
              if (native.update((p) => removePlanCircuit(p, circuit.id)))
                setCircuitId("");
            }}
          >
            {t("removeFloorCircuit")}
          </button>
          {circuitReferenced && <p>{t("circuitRouteProtection")}</p>}
        </>
      )}
      <div style={{ overflowX: "auto" }}>
        <table className="native-bom" aria-label={t("floorCircuitSchedule")}>
          <caption>{t("floorCircuitSchedule")}</caption>
          <thead>
            <tr>
              {[
                "floorCircuitName",
                "zoneBoard",
                "circuitDeviceCount",
                "circuitVoltage",
                "circuitPhases",
                "circuitKnownLoad",
                "circuitUnknownLoads",
                "circuitTotalLoad",
                "routePlanLength",
              ].map((key) => (
                <th key={key} scope="col">
                  {t(key as MessageKey)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {circuitSchedule(project, floorId).map((row) => (
              <tr key={row.id} data-circuit-schedule-id={row.id}>
                <th scope="row">{row.name}</th>
                <td>{row.board}</td>
                <td>{row.deviceCount}</td>
                <td>{row.voltageV}</td>
                <td>{row.phases}</td>
                <td>{displayNumber(row.knownConnectedLoadW)}</td>
                <td>{row.unknownLoadCount}</td>
                <td>
                  {row.totalConnectedLoadW === null
                    ? t("incompleteCircuitLoad")
                    : displayNumber(row.totalConnectedLoadW)}
                </td>
                <td>{displayNumber(row.planLengthM)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3>{t("floorPlanRoutes")}</h3>
      <p>{t("floorRouteScope")}</p>
      <label>
        {t("selectedPlanRoute")}
        <select
          aria-label={t("selectedPlanRoute")}
          value={route?.id ?? ""}
          onChange={(event) => selectRoute(event.target.value)}
        >
          <option value="">{t("newPlanRoute")}</option>
          {routes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <RouteForm
        key={`route:${JSON.stringify(route ?? { floorId })}`}
        {...props}
        selectedId={route?.id ?? ""}
        select={selectRoute}
      />
      {route && (
        <button
          disabled={!editableRoute(project, route)}
          onClick={() => {
            if (native.update((p) => removePlanRoute(p, route.id)))
              selectRoute("");
          }}
        >
          {t("removePlanRoute")}
        </button>
      )}
      <div style={{ overflowX: "auto" }}>
        <table className="native-bom" aria-label={t("planRouteSchedule")}>
          <caption>{t("planRouteSchedule")}</caption>
          <thead>
            <tr>
              {[
                "planRouteName",
                "planRouteKind",
                "routeAssignedCircuit",
                "routePlanLength",
              ].map((key) => (
                <th key={key} scope="col">
                  {t(key as MessageKey)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {routes.map((item) => (
              <tr key={item.id} data-route-schedule-id={item.id}>
                <th scope="row">{item.name}</th>
                <td>{t(routeLabels[item.kind])}</td>
                <td>
                  {circuits.find((c) => c.id === item.circuitId)?.name ??
                    t("routeUnassignedCircuit")}
                </td>
                <td>{displayNumber(planRouteLengthM(item))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function BoardForm({ native, floorId, selectedId, select, t }: FormProps) {
  const project = native.project!;
  const old = project.distributionBoards.find((b) => b.id === selectedId);
  const [deviceId, setDeviceId] = useState(old?.deviceId ?? "");
  const devices = floorDevices(project, floorId).filter(
    (item) =>
      item.device.id === old?.deviceId ||
      !project.distributionBoards.some((b) => b.deviceId === item.device.id),
  );
  const blocked =
    !!old &&
    !devices.some((item) => item.device.id === old.deviceId && item.editable);
  return (
    <form
      aria-label={t("saveDistributionBoard")}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        let saved = "";
        if (
          native.update((p) => {
            const next = saveDistributionBoard(
              p,
              {
                floorId,
                name: String(data.get("name")),
                deviceId: old?.deviceId ?? String(data.get("device")),
              },
              old?.id,
            );
            saved = old?.id ?? next.distributionBoards.at(-1)!.id;
            return next;
          })
        )
          select(saved);
      }}
    >
      <label>
        {t("distributionBoardName")}
        <input
          name="name"
          defaultValue={old?.name ?? ""}
          maxLength={160}
          required
          disabled={blocked}
        />
      </label>
      <label>
        {t("distributionBoardDevice")}
        <select
          aria-label={t("distributionBoardDevice")}
          name="device"
          value={
            old?.deviceId ??
            (deviceId || devices.find((item) => item.editable)?.device.id || "")
          }
          onChange={(event) => setDeviceId(event.target.value)}
          disabled={!!old}
          required
        >
          <option value="" disabled>
            {t("selectFloorDevice")}
          </option>
          {devices.map(({ device, editable }) => (
            <option key={device.id} value={device.id} disabled={!editable}>
              {device.reference} · {device.name}
            </option>
          ))}
        </select>
      </label>
      <button disabled={blocked || !devices.some((item) => item.editable)}>
        {t("saveDistributionBoard")}
      </button>
    </form>
  );
}

function ElectricalLayer({
  project,
  floorId,
  value,
  t,
}: {
  project: Project;
  floorId: string;
  value?: string;
  t: Props["t"];
}) {
  const [selectedLayerId, setSelectedLayerId] = useState(value ?? "");
  const layers = project.architecturalLayers.filter(
    (layer) => layer.floorId === floorId && layer.kind === "electrical",
  );
  return (
    <label>
      {t("equipmentLayer")}
      <select
        name="layer"
        aria-label={t("equipmentLayer")}
        value={
          selectedLayerId ||
          layers.find((layer) => layer.visible && !layer.locked)?.id ||
          ""
        }
        onChange={(event) => setSelectedLayerId(event.target.value)}
        required
      >
        <option value="" disabled>
          {t("selectElectricalPlanLayer")}
        </option>
        {layers.map((layer) => (
          <option
            key={layer.id}
            value={layer.id}
            disabled={!layer.visible || layer.locked}
          >
            {layer.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function CircuitForm({ native, floorId, selectedId, select, t }: FormProps) {
  const project = native.project!;
  const old = project.circuits.find((c) => c.id === selectedId);
  const boards = project.distributionBoards.filter(
    (b) => b.floorId === floorId,
  );
  const [boardId, setBoardId] = useState(old?.boardId ?? "");
  const [members, setMembers] = useState(old?.deviceIds ?? []);
  const board = boards.find((b) => b.id === boardId);
  const devices = floorDevices(project, floorId);
  const blocked = !!old && !editableCircuit(project, old);
  const availableLayer = project.architecturalLayers.some(
    (layer) => layer.floorId === floorId && editableLayer(project, layer.id),
  );
  return (
    <form
      aria-label={t("saveFloorCircuit")}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        let saved = "";
        if (
          native.update((p) => {
            const next = savePlanCircuit(
              p,
              {
                floorId,
                layerId: String(data.get("layer")),
                name: String(data.get("name")),
                boardId,
                deviceIds: members,
                voltageV: Number(data.get("voltage")),
                phases: Number(data.get("phases")) as 1 | 3,
                loads: members.flatMap((deviceId) => {
                  const text = String(
                    data.get(`load-${deviceId}`) ?? "",
                  ).trim();
                  return text === ""
                    ? []
                    : [{ deviceId, activePowerW: Number(text) }];
                }),
              },
              old?.id,
            );
            saved = old?.id ?? next.circuits.at(-1)!.id;
            return next;
          })
        )
          select(saved);
      }}
    >
      <fieldset disabled={blocked}>
        <legend>{t("floorCircuitDetails")}</legend>
        <label>
          {t("floorCircuitName")}
          <input
            name="name"
            defaultValue={old?.name ?? ""}
            maxLength={160}
            required
          />
        </label>
        <label>
          {t("zoneBoard")}
          <select
            aria-label={t("zoneBoard")}
            name="board"
            value={boardId}
            required
            onChange={(event) => {
              const id = event.target.value;
              setBoardId(id);
              const deviceId = boards.find((b) => b.id === id)?.deviceId;
              setMembers((previous) =>
                previous.filter((item) => item !== deviceId),
              );
            }}
          >
            <option value="" disabled>
              {t("selectDistributionBoard")}
            </option>
            {boards.map((b) => (
              <option
                key={b.id}
                value={b.id}
                disabled={
                  !devices.some(
                    (item) => item.device.id === b.deviceId && item.editable,
                  )
                }
              >
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <ElectricalLayer
          project={project}
          floorId={floorId}
          value={old?.layerId}
          t={t}
        />
        <label>
          {t("circuitVoltage")}
          <input
            name="voltage"
            type="number"
            min="0.001"
            step="any"
            defaultValue={old?.voltageV ?? ""}
            required
          />
        </label>
        <label>
          {t("circuitPhases")}
          <select
            name="phases"
            aria-label={t("circuitPhases")}
            defaultValue={old?.phases ?? ""}
            required
          >
            <option value="" disabled>
              {t("selectCircuitPhases")}
            </option>
            <option value="1">1</option>
            <option value="3">3</option>
          </select>
        </label>
        <fieldset>
          <legend>{t("circuitMemberDevices")}</legend>
          <p>{t("circuitLoadEntryScope")}</p>
          {devices
            .filter((item) => item.device.id !== board?.deviceId)
            .map(({ device, editable }) => {
              const assignedElsewhere = project.circuits.some(
                (c) =>
                  c.id !== old?.id &&
                  c.floorId &&
                  c.deviceIds.includes(device.id),
              );
              return (
                <div key={device.id}>
                  <label>
                    <input
                      type="checkbox"
                      name="device"
                      value={device.id}
                      checked={members.includes(device.id)}
                      disabled={!editable || assignedElsewhere}
                      onChange={(event) =>
                        setMembers((previous) =>
                          event.target.checked
                            ? [...previous, device.id]
                            : previous.filter((id) => id !== device.id),
                        )
                      }
                    />
                    {device.reference} · {device.name}
                  </label>
                  <label>
                    {t("circuitActiveLoad")}: {device.reference}
                    <input
                      name={`load-${device.id}`}
                      type="number"
                      min="0"
                      max="1000000000"
                      step="any"
                      defaultValue={
                        old?.loads?.find((load) => load.deviceId === device.id)
                          ?.activePowerW ?? ""
                      }
                      disabled={
                        !members.includes(device.id) ||
                        !editable ||
                        assignedElsewhere
                      }
                    />
                  </label>
                  {assignedElsewhere && (
                    <small>{t("deviceAssignedOtherCircuit")}</small>
                  )}
                </div>
              );
            })}
        </fieldset>
        <button
          disabled={
            !availableLayer ||
            !board ||
            !devices.some(
              (item) => item.device.id === board.deviceId && item.editable,
            ) ||
            !members.length
          }
        >
          {t("saveFloorCircuit")}
        </button>
      </fieldset>
      {blocked && <p>{t("protectedCircuitLayers")}</p>}
    </form>
  );
}

function parseRoutePoints(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2 || lines.length > 10000)
    throw new Error("Invalid route point count");
  return lines.map((line) => {
    const values = line.includes(",") ? line.split(",") : line.split(/\s+/);
    if (
      values.length !== 2 ||
      values.some(
        (value) =>
          !value.trim() ||
          !Number.isFinite(Number(value)) ||
          Math.abs(Number(value)) > 1000000,
      )
    )
      throw new Error("Invalid route coordinate");
    return { x: Number(values[0]), y: Number(values[1]) };
  });
}

function RouteForm({ native, floorId, selectedId, select, t }: FormProps) {
  const project = native.project!;
  const old = project.planRoutes.find((r) => r.id === selectedId);
  const [invalidPoints, setInvalidPoints] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(!old);
  const blocked = !!old && !editableRoute(project, old);
  const availableLayer = project.architecturalLayers.some(
    (layer) => layer.floorId === floorId && editableLayer(project, layer.id),
  );
  return (
    <form
      aria-label={t("savePlanRoute")}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        let points;
        try {
          points = parseRoutePoints(String(data.get("points")));
        } catch {
          setInvalidPoints(true);
          return;
        }
        setInvalidPoints(false);
        let saved = "";
        if (
          native.update((p) => {
            const next = savePlanRoute(
              p,
              {
                floorId,
                layerId: String(data.get("layer")),
                name: String(data.get("name")),
                kind: String(data.get("kind")) as "cable" | "conduit" | "tray",
                points,
                ...(data.get("circuit")
                  ? { circuitId: String(data.get("circuit")) }
                  : {}),
              },
              snapToGrid ? Number(data.get("grid")) : 0,
              old?.id,
            );
            saved = old?.id ?? next.planRoutes.at(-1)!.id;
            return next;
          })
        )
          select(saved);
      }}
    >
      <fieldset disabled={blocked}>
        <legend>{t("planRouteDetails")}</legend>
        <label>
          {t("planRouteName")}
          <input
            name="name"
            defaultValue={old?.name ?? ""}
            required
            maxLength={160}
          />
        </label>
        <label>
          {t("planRouteKind")}
          <select
            name="kind"
            aria-label={t("planRouteKind")}
            defaultValue={old?.kind ?? "cable"}
          >
            {(Object.keys(routeLabels) as (keyof typeof routeLabels)[]).map(
              (kind) => (
                <option key={kind} value={kind}>
                  {t(routeLabels[kind])}
                </option>
              ),
            )}
          </select>
        </label>
        <ElectricalLayer
          project={project}
          floorId={floorId}
          value={old?.layerId}
          t={t}
        />
        <label>
          {t("routeAssignedCircuit")}
          <select
            name="circuit"
            aria-label={t("routeAssignedCircuit")}
            defaultValue={old?.circuitId ?? ""}
          >
            <option value="">{t("routeUnassignedCircuit")}</option>
            {project.circuits
              .filter((c) => c.floorId === floorId)
              .map((c) => (
                <option
                  key={c.id}
                  value={c.id}
                  disabled={!editableLayer(project, c.layerId)}
                >
                  {c.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          {t("planRoutePoints")}
          <textarea
            name="points"
            required
            rows={5}
            maxLength={400000}
            defaultValue={
              old?.points.map((point) => `${point.x}, ${point.y}`).join("\n") ??
              ""
            }
            aria-invalid={invalidPoints || undefined}
            onChange={() => setInvalidPoints(false)}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={snapToGrid}
            onChange={(event) => setSnapToGrid(event.target.checked)}
          />
          {t("snapRouteToGrid")}
        </label>
        <label>
          {t("routeGrid")}
          <input
            name="grid"
            type="number"
            min="1"
            max="1000"
            step="any"
            defaultValue={50}
            disabled={!snapToGrid}
            required
          />
        </label>
        <button disabled={!availableLayer}>{t("savePlanRoute")}</button>
      </fieldset>
      {invalidPoints && <p role="alert">{t("routePointsInvalid")}</p>}
      {blocked && <p>{t("protectedRouteLayers")}</p>}
    </form>
  );
}
