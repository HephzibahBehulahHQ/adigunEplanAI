import { useState } from "react";
import {
  savePlanZone,
  removePlanZone,
} from "../../../packages/building-design/zones.ts";
import type { MessageKey } from "../../../packages/localization";
import type { NativeProjects } from "./useNativeProjects";

type Props = {
  native: NativeProjects;
  floorId: string;
  selectedId: string;
  select: (id: string) => void;
  t: (key: MessageKey) => string;
};

export function ZoneTools(props: Props) {
  const { native, floorId, selectedId, select, t } = props;
  const zones = native.project!.planZones.filter((z) => z.floorId === floorId);
  const selected = zones.find((z) => z.id === selectedId);
  return (
    <details className="zone-tools">
      <summary>{t("planZones")}</summary>
      <p>{t("planZoneScope")}</p>
      <label>
        {t("selectedZone")}
        <select
          aria-label={t("selectedZone")}
          value={selected?.id ?? ""}
          onChange={(e) => select(e.target.value)}
        >
          <option value="">{t("newZone")}</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
        </select>
      </label>
      <ZoneForm
        key={JSON.stringify(selected ?? { floorId })}
        {...props}
        selectedId={selected?.id ?? ""}
      />
      {selected && (
        <button
          onClick={() => {
            if (native.update((p) => removePlanZone(p, selected.id)))
              select("");
          }}
        >
          {t("removeZone")}
        </button>
      )}
    </details>
  );
}

function ZoneForm({ native, floorId, selectedId, select, t }: Props) {
  const project = native.project!;
  const selected = project.planZones.find((z) => z.id === selectedId);
  const [kind, setKind] = useState<"electrical" | "distribution">(
    selected?.kind ?? "electrical",
  );
  const rooms = project.rooms.filter((r) => r.floorId === floorId);
  const boards = project.distributionBoards.filter(
    (b) => !b.roomId || rooms.some((r) => r.id === b.roomId),
  );
  return (
    <form
      aria-label={t("saveZone")}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        let savedId = "";
        if (
          native.update((p) => {
            const next = savePlanZone(
              p,
              {
                floorId,
                name: String(data.get("name")),
                kind,
                roomIds: data.getAll("room").map(String),
                ...(kind === "distribution" && data.get("board")
                  ? { boardId: String(data.get("board")) }
                  : {}),
              },
              selectedId || undefined,
            );
            savedId = selectedId || next.planZones.at(-1)!.id;
            return next;
          })
        )
          select(savedId);
      }}
    >
      <label>
        {t("zoneName")}
        <input
          name="name"
          defaultValue={selected?.name ?? ""}
          required
          maxLength={160}
        />
      </label>
      <label>
        {t("zoneKind")}
        <select
          aria-label={t("zoneKind")}
          value={kind}
          onChange={(e) => setKind(e.target.value as typeof kind)}
        >
          <option value="electrical">{t("electricalZone")}</option>
          <option value="distribution">{t("distributionZone")}</option>
        </select>
      </label>
      <fieldset>
        <legend>{t("zoneRooms")}</legend>
        {rooms.map((r) => (
          <label key={r.id}>
            <input
              type="checkbox"
              name="room"
              value={r.id}
              defaultChecked={selected?.roomIds.includes(r.id)}
            />
            {r.name}
          </label>
        ))}
      </fieldset>
      <label>
        {t("zoneBoard")}
        <select
          aria-label={t("zoneBoard")}
          name="board"
          defaultValue={selected?.boardId ?? ""}
          disabled={kind !== "distribution"}
        >
          <option value="">{t("noZoneBoard")}</option>
          {boards.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>
      <button disabled={!rooms.length}>{t("saveZone")}</button>
    </form>
  );
}
