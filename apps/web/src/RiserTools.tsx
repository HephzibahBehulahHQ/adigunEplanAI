import { useState } from "react";
import {
  removePlanRiser,
  riserSchedule,
  savePlanRiser,
} from "../../../packages/building-design/risers.ts";
import type { Project } from "../../../packages/electrical-model/project.ts";
import type { MessageKey } from "../../../packages/localization";
import type { NativeProjects } from "./useNativeProjects";

type Props = {
  native: NativeProjects;
  floorId: string;
  t: (key: MessageKey) => string;
};
type Riser = Project["planRisers"][number];
const kinds = {
  cable: "cablePlanRoute",
  conduit: "conduitPlanRoute",
  tray: "trayPlanRoute",
} as const;
const editable = (project: Project, riser: Riser) =>
  [riser.start, riser.end].every((endpoint) =>
    project.architecturalLayers.some(
      (l) => l.id === endpoint.layerId && l.visible && !l.locked,
    ),
  );

export function RiserTools(props: Props) {
  const { native, floorId, t } = props;
  const project = native.project!;
  const [selectedId, select] = useState("");
  const risers = project.planRisers.filter(
    (r) => r.start.floorId === floorId || r.end.floorId === floorId,
  );
  const selected = risers.find((r) => r.id === selectedId);
  return (
    <details className="riser-tools engineering-tools">
      <summary>{t("planRisers")}</summary>
      <p>{t("planRiserScope")}</p>
      <label>
        {t("selectedRiser")}
        <select
          aria-label={t("selectedRiser")}
          value={selected?.id ?? ""}
          onChange={(e) => select(e.target.value)}
        >
          <option value="">{t("newRiser")}</option>
          {risers.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </label>
      <RiserForm
        key={JSON.stringify(selected ?? { floorId })}
        {...props}
        selected={selected}
        select={select}
      />
      {selected && (
        <button
          disabled={!editable(project, selected)}
          onClick={() => {
            if (native.update((p) => removePlanRiser(p, selected.id)))
              select("");
          }}
        >
          {t("removeRiser")}
        </button>
      )}
      <div className="native-table-scroll">
        <table className="native-bom" aria-label={t("riserSchedule")}>
          <caption>{t("riserSchedule")}</caption>
          <thead>
            <tr>
              {[
                "riserName",
                "riserKind",
                "riserStartFloor",
                "riserEndFloor",
                "riserStartElevation",
                "riserEndElevation",
                "riserVerticalLength",
              ].map((key) => (
                <th key={key}>{t(key as MessageKey)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {riserSchedule(project)
              .filter((row) => risers.some((r) => r.id === row.id))
              .map((row) => (
                <tr key={row.id} data-riser-schedule-id={row.id}>
                  <td>{row.name}</td>
                  <td>{t(kinds[row.kind])}</td>
                  <td>{row.startFloor}</td>
                  <td>{row.endFloor}</td>
                  <td>{Number(row.startElevationMm.toPrecision(8))}</td>
                  <td>{Number(row.endElevationMm.toPrecision(8))}</td>
                  <td>{Number(row.verticalLengthM.toPrecision(8))}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function RiserForm({
  native,
  floorId,
  t,
  selected,
  select,
}: Props & { selected?: Riser; select: (id: string) => void }) {
  const project = native.project!;
  const buildingId = project.floors.find((f) => f.id === floorId)?.buildingId;
  const floors = project.floors.filter((f) => f.buildingId === buildingId);
  const [startFloorId, setStartFloor] = useState(
    selected?.start.floorId ?? floorId,
  );
  const [endFloorId, setEndFloor] = useState(
    selected?.end.floorId ?? floors.find((f) => f.id !== floorId)?.id ?? "",
  );
  const floorLayers = (id: string) =>
    project.architecturalLayers.filter(
      (l) => l.floorId === id && l.kind === "electrical",
    );
  const protectedRiser = Boolean(selected && !editable(project, selected));
  const canSave =
    floors.length > 1 &&
    [startFloorId, endFloorId].every((id) =>
      floorLayers(id).some((l) => l.visible && !l.locked),
    );
  return (
    <form
      aria-label={t("saveRiser")}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        let savedId = "";
        if (
          native.update((p) => {
            const next = savePlanRiser(
              p,
              {
                name: String(data.get("name")),
                kind: String(data.get("kind")) as Riser["kind"],
                position: {
                  x: Number(data.get("x")),
                  y: Number(data.get("y")),
                },
                start: {
                  floorId: startFloorId,
                  layerId: String(data.get("startLayer")),
                  heightMm: Number(data.get("startHeight")),
                },
                end: {
                  floorId: endFloorId,
                  layerId: String(data.get("endLayer")),
                  heightMm: Number(data.get("endHeight")),
                },
              },
              data.has("snap") ? Number(data.get("grid")) : 0,
              selected?.id,
            );
            savedId = selected?.id ?? next.planRisers.at(-1)!.id;
            return next;
          })
        )
          select(savedId);
      }}
    >
      {floors.length < 2 && <p>{t("riserNeedsFloors")}</p>}
      <fieldset disabled={protectedRiser || floors.length < 2}>
        <legend>{t("saveRiser")}</legend>
        <label>
          {t("riserName")}
          <input
            name="name"
            required
            maxLength={160}
            defaultValue={selected?.name ?? ""}
          />
        </label>
        <label>
          {t("riserKind")}
          <select name="kind" defaultValue={selected?.kind ?? "cable"}>
            {Object.entries(kinds).map(([kind, label]) => (
              <option key={kind} value={kind}>
                {t(label)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("riserX")}
          <input
            name="x"
            type="number"
            required
            min={-1000000}
            max={1000000}
            step="any"
            defaultValue={selected?.position.x ?? 0}
          />
        </label>
        <label>
          {t("riserY")}
          <input
            name="y"
            type="number"
            required
            min={-1000000}
            max={1000000}
            step="any"
            defaultValue={selected?.position.y ?? 0}
          />
        </label>
        {(["start", "end"] as const).map((side) => {
          const currentFloorId = side === "start" ? startFloorId : endFloorId;
          const otherFloorId = side === "start" ? endFloorId : startFloorId;
          const currentFloor = floors.find((f) => f.id === currentFloorId);
          const layers = floorLayers(currentFloorId);
          return (
            <fieldset key={side}>
              <legend>
                {t(side === "start" ? "riserStartFloor" : "riserEndFloor")}
              </legend>
              <label>
                {t(side === "start" ? "riserStartFloor" : "riserEndFloor")}
                <select
                  required
                  value={currentFloorId}
                  onChange={(e) =>
                    (side === "start" ? setStartFloor : setEndFloor)(
                      e.target.value,
                    )
                  }
                >
                  {floors.map((f) => (
                    <option
                      key={f.id}
                      value={f.id}
                      disabled={f.id === otherFloorId}
                    >
                      {f.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t(side === "start" ? "riserStartLayer" : "riserEndLayer")}
                <select
                  key={currentFloorId}
                  name={`${side}Layer`}
                  required
                  defaultValue={
                    selected?.[side].floorId === currentFloorId
                      ? selected[side].layerId
                      : (layers.find((l) => l.visible && !l.locked)?.id ?? "")
                  }
                >
                  <option value="" disabled>
                    {t("equipmentLayer")}
                  </option>
                  {layers.map((l) => (
                    <option
                      key={l.id}
                      value={l.id}
                      disabled={!l.visible || l.locked}
                    >
                      {l.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t(side === "start" ? "riserStartHeight" : "riserEndHeight")}
                <input
                  name={`${side}Height`}
                  type="number"
                  required
                  min={0}
                  max={currentFloor?.heightMm ?? 1000000}
                  step="any"
                  defaultValue={selected?.[side].heightMm ?? 0}
                />
              </label>
            </fieldset>
          );
        })}
        <label>
          <input name="snap" type="checkbox" defaultChecked={!selected} />
          {t("riserSnap")}
        </label>
        <label>
          {t("riserGrid")}
          <input
            name="grid"
            type="number"
            required
            min={0.001}
            max={1000000}
            step="any"
            defaultValue={50}
          />
        </label>
        <button disabled={!canSave}>{t("saveRiser")}</button>
      </fieldset>
    </form>
  );
}
