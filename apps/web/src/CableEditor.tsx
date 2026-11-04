import { useState } from "react";
import { saveCable } from "../../../packages/connectivity-engine/wire-properties.ts";
import type { NativeProjects } from "./useNativeProjects";
import type { MessageKey } from "../../../packages/localization";

export function CableEditor({
  native,
  t,
}: {
  native: NativeProjects;
  t: (key: MessageKey) => string;
}) {
  const [selected, setSelected] = useState("");
  const project = native.project;
  if (!project) return null;
  const cable = project.cables.find((item) => item.id === selected);
  return (
    <details>
      <summary>{t("cable")}</summary>
      <select
        aria-label={t("chooseCable")}
        value={cable?.id ?? ""}
        onChange={(e) => setSelected(e.target.value)}
      >
        <option value="">{t("newCable")}</option>
        {project.cables.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      <form
        key={JSON.stringify(cable) ?? "new"}
        aria-label={t("cable")}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const id = cable?.id ?? crypto.randomUUID();
          native.update((p) =>
            saveCable(p, {
              id,
              name: String(data.get("name")),
              conductorIds: data.getAll("cores").map(String),
              shielded: data.has("shielded"),
              shieldBondTerminalIds: data.getAll("bonds").map(String),
              ...(data.get("length")
                ? { lengthM: Number(data.get("length")) }
                : {}),
            }),
          );
          setSelected(id);
        }}
      >
        <label>
          {t("cableName")}
          <input
            name="name"
            required
            maxLength={160}
            defaultValue={cable?.name ?? ""}
          />
        </label>
        <label>
          {t("physicalLength")} (m)
          <input
            name="length"
            type="number"
            min="0.000001"
            step="any"
            defaultValue={cable?.lengthM ?? ""}
          />
        </label>
        <label>
          {t("cableCore")}
          <select
            multiple
            name="cores"
            required
            aria-label={t("cableCore")}
            defaultValue={cable?.conductorIds ?? []}
          >
            {project.conductors.map((core) => (
              <option key={core.id} value={core.id}>
                {core.name} · {core.crossSectionMm2} mm² · {core.color}
              </option>
            ))}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            name="shielded"
            defaultChecked={cable?.shielded ?? false}
          />
          {t("shielded")}
        </label>
        <label>
          {t("shieldBonds")}
          <select
            multiple
            name="bonds"
            aria-label={t("shieldBonds")}
            defaultValue={cable?.shieldBondTerminalIds ?? []}
          >
            {project.terminals.map((terminal) => (
              <option key={terminal.id} value={terminal.id}>
                {
                  project.devices.find(
                    (device) => device.id === terminal.deviceId,
                  )?.reference
                }
                :{terminal.designation}
              </option>
            ))}
          </select>
        </label>
        <button>{t("apply")}</button>
      </form>
    </details>
  );
}
