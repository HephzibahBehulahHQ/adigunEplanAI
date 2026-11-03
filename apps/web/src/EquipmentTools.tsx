import {
  savePlanEquipment,
  removePlanEquipment,
  roomEquipmentSchedule,
} from "../../../packages/building-design/equipment.ts";
import type { NativeProjects } from "./useNativeProjects";
import type { MessageKey } from "../../../packages/localization";
type Props = {
  native: NativeProjects;
  floorId: string;
  selectedId: string;
  select: (id: string) => void;
  t: (key: MessageKey) => string;
};
export function EquipmentTools(props: Props) {
  const { native, floorId, selectedId, select, t } = props;
  const p = native.project!;
  const placements = p.planEquipment.filter((e) => e.floorId === floorId);
  const selected = placements.find((e) => e.id === selectedId);
  const layer = p.architecturalLayers.find((l) => l.id === selected?.layerId);
  return (
    <details className="equipment-tools">
      <summary>{t("planEquipment")}</summary>
      <p>{t("planEquipmentScope")}</p>
      <label>
        {t("selectedEquipment")}
        <select
          aria-label={t("selectedEquipment")}
          value={selected?.id ?? ""}
          onChange={(e) => select(e.target.value)}
        >
          <option value="">{t("newEquipmentPlacement")}</option>
          {placements.map((e) => {
            const s = p.symbolInstances.find(
              (s) => s.id === e.symbolInstanceId,
            )!;
            const d = p.devices.find((d) => d.id === s.deviceId)!;
            return (
              <option key={e.id} value={e.id}>
                {d.reference}
              </option>
            );
          })}
        </select>
      </label>
      <EquipmentForm
        key={JSON.stringify(selected ?? { floorId })}
        {...props}
        selectedId={selected?.id ?? ""}
      />
      {selected && (
        <button
          disabled={!layer?.visible || layer.locked}
          onClick={() => {
            if (native.update((p) => removePlanEquipment(p, selected.id)))
              select("");
          }}
        >
          {t("removeEquipmentPlacement")}
        </button>
      )}
      <table aria-label={t("roomEquipmentSchedule")}>
        <caption>{t("roomEquipmentSchedule")}</caption>
        <thead>
          <tr>
            {(
              [
                "equipmentReference",
                "equipmentDescription",
                "equipmentRoom",
                "equipmentMountingHeight",
                "equipmentPartNumber",
              ] as const
            ).map((k) => (
              <th key={k}>{t(k)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {roomEquipmentSchedule(p, floorId).map((row) => (
            <tr key={row.id} data-equipment-schedule-id={row.id}>
              <td>{row.reference}</td>
              <td>{row.name}</td>
              <td>{row.room ?? t("unassignedEquipmentRoom")}</td>
              <td>{row.mountingHeightMm ?? t("unknownEquipmentValue")}</td>
              <td>{row.partNumber ?? t("unknownEquipmentValue")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
function EquipmentForm({ native, floorId, selectedId, select, t }: Props) {
  const p = native.project!;
  const old = p.planEquipment.find((e) => e.id === selectedId);
  const layers = p.architecturalLayers.filter(
    (l) => l.floorId === floorId && l.kind === "electrical",
  );
  const oldLayer = layers.find((l) => l.id === old?.layerId);
  const available = p.symbolInstances.filter(
    (s) =>
      s.id === old?.symbolInstanceId ||
      !p.planEquipment.some(
        (e) =>
          p.symbolInstances.find((i) => i.id === e.symbolInstanceId)
            ?.deviceId === s.deviceId,
      ),
  );
  const blocked = !!old && (!oldLayer?.visible || oldLayer.locked);
  return (
    <form
      aria-label={t("saveEquipmentPlacement")}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const symbolInstanceId =
          old?.symbolInstanceId ?? String(data.get("symbol"));
        const symbol = p.symbolInstances.find((s) => s.id === symbolInstanceId);
        if (!symbol) return;
        const device = p.devices.find((d) => d.id === symbol.deviceId)!;
        let saved = "";
        if (
          native.update((project) => {
            const next = savePlanEquipment(
              project,
              {
                floorId,
                layerId: String(data.get("layer")),
                symbolInstanceId,
                name: device.reference,
                position: {
                  x: Number(data.get("x")),
                  y: Number(data.get("y")),
                },
                rotation: Number(data.get("rotation")) as 0 | 90 | 180 | 270,
                symbolScale: Number(data.get("size")),
                ...(data.get("room")
                  ? { roomId: String(data.get("room")) }
                  : {}),
                ...(String(data.get("height")).trim()
                  ? { mountingHeightMm: Number(data.get("height")) }
                  : {}),
              },
              Number(data.get("grid")),
              old?.id,
            );
            saved = old?.id ?? next.planEquipment.at(-1)!.id;
            return next;
          })
        )
          select(saved);
      }}
    >
      <label>
        {t("equipmentDevice")}
        <select
          aria-label={t("equipmentDevice")}
          name="symbol"
          defaultValue={old?.symbolInstanceId}
          disabled={!!old}
          required
        >
          {available.map((s) => {
            const d = p.devices.find((d) => d.id === s.deviceId)!;
            return (
              <option key={s.id} value={s.id}>
                {d.reference} · {d.name}
              </option>
            );
          })}
        </select>
      </label>
      <label>
        {t("equipmentLayer")}
        <select
          aria-label={t("equipmentLayer")}
          name="layer"
          defaultValue={old?.layerId}
          required
        >
          {layers.map((l) => (
            <option key={l.id} value={l.id} disabled={!l.visible || l.locked}>
              {l.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("equipmentRoom")}
        <select
          aria-label={t("equipmentRoom")}
          name="room"
          defaultValue={old?.roomId ?? ""}
        >
          <option value="">{t("unassignedEquipmentRoom")}</option>
          {p.rooms
            .filter((r) => r.floorId === floorId)
            .map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
        </select>
      </label>
      {(
        [
          ["x", "equipmentX", old?.position.x ?? 0, -1000000, 1000000],
          ["y", "equipmentY", old?.position.y ?? 0, -1000000, 1000000],
          ["size", "equipmentSymbolScale", old?.symbolScale ?? 20, 0.1, 1000],
          ["grid", "equipmentGrid", 50, 1, 1000],
        ] as const
      ).map(([name, label, value, min, max]) => (
        <label key={name}>
          {t(label)}
          <input
            name={name}
            type="number"
            defaultValue={value}
            min={min}
            max={max}
            step="any"
            required
          />
        </label>
      ))}
      <label>
        {t("equipmentRotation")}
        <select
          aria-label={t("equipmentRotation")}
          name="rotation"
          defaultValue={old?.rotation ?? 0}
        >
          {[0, 90, 180, 270].map((r) => (
            <option key={r} value={r}>
              {r}°
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("equipmentMountingHeight")}
        <input
          name="height"
          type="number"
          min="0"
          max="1000000"
          step="any"
          defaultValue={old?.mountingHeightMm ?? ""}
        />
      </label>
      <button
        disabled={
          blocked ||
          !available.length ||
          !layers.some((l) => l.visible && !l.locked)
        }
      >
        {t("saveEquipmentPlacement")}
      </button>
    </form>
  );
}
