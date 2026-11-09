import { useState } from "react";
import {
  savePlanEquipment,
  removePlanEquipment,
  roomEquipmentSchedule,
} from "../../../packages/building-design/equipment.ts";
import {
  ensureLayer,
  place,
  primitives,
  type Primitive,
} from "../../../packages/schematic-editor/commands.ts";
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
  const [createOpen, setCreateOpen] = useState(false);
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
      <details
        className="floor-device-creation"
        open={createOpen}
        onToggle={(event) =>
          setCreateOpen((event.currentTarget as HTMLDetailsElement).open)
        }
      >
        <summary>{t("createFloorDevice")}</summary>
        <CreateFloorDeviceForm {...props} />
      </details>
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

function CreateFloorDeviceForm({ native, floorId, select, t }: Props) {
  const project = native.project!;
  const layers = project.architecturalLayers.filter(
    (layer) =>
      layer.floorId === floorId &&
      layer.kind === "electrical" &&
      layer.visible &&
      !layer.locked,
  );
  const builtInSymbols = Object.keys(primitives) as Primitive[];
  const customSymbols = project.symbolDefinitions.filter(
    (definition) =>
      definition.category === "custom" &&
      definition.pins.length > 0 &&
      definition.connectionClass !== "mechanical",
  );
  return (
    <form
      aria-label={t("createFloorDevice")}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const selection = String(data.get("symbol"));
        const definitionId = selection.startsWith("library:")
          ? selection.slice("library:".length)
          : "";
        const primitive = selection.startsWith("primitive:")
          ? (selection.slice("primitive:".length) as Primitive)
          : undefined;
        if (
          (!primitive || !Object.hasOwn(primitives, primitive)) &&
          !definitionId
        )
          return;
        const pageId = String(data.get("page"));
        const placementLayerId = String(data.get("layer"));
        const deviceReference = String(data.get("reference")).trim();
        const deviceName = String(data.get("name")).trim();
        if (!pageId || !placementLayerId || !deviceReference || !deviceName)
          return;
        let placementId = "";
        if (
          native.update((source) => {
            const next = structuredClone(source);
            const page = next.pages.find((item) => item.id === pageId);
            if (!page) throw new Error("Unknown schematic page");
            if (
              definitionId &&
              !next.symbolDefinitions.some(
                (definition) =>
                  definition.id === definitionId &&
                  definition.category === "custom" &&
                  definition.pins.length > 0 &&
                  definition.connectionClass !== "mechanical",
              )
            )
              throw new Error("Unknown electrical symbol definition");
            const schematicLayerId = ensureLayer(next, page.id, t("layers"));
            const symbolInstanceId = place(
              next,
              page.id,
              schematicLayerId,
              primitive ?? "custom",
              { x: page.widthMm / 2, y: page.heightMm / 2 },
              page.gridMm,
              definitionId || undefined,
            );
            const symbol = next.symbolInstances.find(
              (item) => item.id === symbolInstanceId,
            )!;
            const device = next.devices.find(
              (item) => item.id === symbol.deviceId,
            )!;
            if (
              next.devices.some(
                (item) =>
                  item.id !== device.id &&
                  item.reference.toLowerCase() ===
                    deviceReference.toLowerCase(),
              )
            )
              throw new Error("Device reference already exists");
            device.reference = deviceReference;
            device.name = deviceName;
            symbol.name = deviceReference;
            const created = savePlanEquipment(
              next,
              {
                floorId,
                layerId: placementLayerId,
                symbolInstanceId,
                name: deviceReference,
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
            );
            placementId = created.planEquipment.at(-1)!.id;
            return created;
          })
        )
          select(placementId);
      }}
    >
      <label>
        {t("equipmentDevice")}
        <select aria-label={t("equipmentDevice")} name="symbol" required>
          {builtInSymbols.map((symbol) => (
            <option key={symbol} value={`primitive:${symbol}`}>
              {symbol}
            </option>
          ))}
          {customSymbols.map((symbol) => (
            <option key={symbol.id} value={`library:${symbol.id}`}>
              {symbol.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("schematicPage")}
        <select aria-label={t("schematicPage")} name="page" required>
          {project.pages.map((page) => (
            <option key={page.id} value={page.id}>
              {page.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("equipmentReference")}
        <input
          aria-label={t("equipmentReference")}
          name="reference"
          maxLength={160}
          required
        />
      </label>
      <label>
        {t("equipmentDescription")}
        <input
          aria-label={t("equipmentDescription")}
          name="name"
          maxLength={160}
          required
        />
      </label>
      <label>
        {t("equipmentLayer")}
        <select aria-label={t("equipmentLayer")} name="layer" required>
          {layers.map((layer) => (
            <option key={layer.id} value={layer.id}>
              {layer.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("equipmentRoom")}
        <select aria-label={t("equipmentRoom")} name="room" defaultValue="">
          <option value="">{t("unassignedEquipmentRoom")}</option>
          {project.rooms
            .filter((room) => room.floorId === floorId)
            .map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
        </select>
      </label>
      {(
        [
          ["x", "equipmentX", 0, -1000000, 1000000],
          ["y", "equipmentY", 0, -1000000, 1000000],
          ["size", "equipmentSymbolScale", 20, 0.1, 1000],
          ["grid", "equipmentGrid", 50, 1, 1000],
        ] as const
      ).map(([name, label, value, min, max]) => (
        <label key={name}>
          {t(label)}
          <input
            aria-label={t(label)}
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
        <select aria-label={t("equipmentRotation")} name="rotation">
          {[0, 90, 180, 270].map((rotation) => (
            <option key={rotation} value={rotation}>
              {rotation}°
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("equipmentMountingHeight")}
        <input name="height" type="number" min="0" max="1000000" step="any" />
      </label>
      <button disabled={!layers.length || !project.pages.length}>
        {t("createFloorDevice")}
      </button>
    </form>
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
