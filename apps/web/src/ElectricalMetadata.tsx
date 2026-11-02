import { useState } from "react";
import {
  updateCore,
  updateTerminal,
  saveTerminalStrip,
} from "../../../packages/connectivity-engine/metadata.ts";
import type { NativeProjects } from "./useNativeProjects";
import type { MessageKey } from "../../../packages/localization";

export function ElectricalMetadata({
  native,
  t,
}: {
  native: NativeProjects;
  t: (key: MessageKey) => string;
}) {
  const [coreId, setCore] = useState("");
  const [terminalId, setTerminal] = useState("");
  const [stripId, setStrip] = useState("");
  const p = native.project;
  if (!p) return null;
  const core = p.conductors.find((c) => c.id === coreId) ?? p.conductors[0];
  const terminal =
    p.terminals.find((item) => item.id === terminalId) ?? p.terminals[0];
  const strip = p.terminalStrips.find((item) => item.id === stripId);
  const terminalName = (id: string) => {
    const item = p.terminals.find((t) => t.id === id)!;
    return `${p.devices.find((d) => d.id === item.deviceId)?.reference}:${item.designation}`;
  };
  return (
    <>
      <details>
        <summary>{t("editCore")}</summary>
        <select
          aria-label={t("editCore")}
          value={core?.id ?? ""}
          onChange={(e) => setCore(e.target.value)}
        >
          {p.conductors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {core && (
          <form
            key={JSON.stringify(core)}
            aria-label={t("editCore")}
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              native.update((p) =>
                updateCore(p, {
                  ...core,
                  name: String(data.get("name")),
                  color: String(data.get("color")),
                  crossSectionMm2: Number(data.get("area")),
                  material: data.get("material") as "copper" | "aluminium",
                }),
              );
            }}
          >
            <label>
              {t("cableCore")}
              <input
                name="name"
                required
                maxLength={160}
                defaultValue={core.name}
              />
            </label>
            <label>
              {t("coreColor")}
              <input
                name="color"
                required
                maxLength={160}
                defaultValue={core.color}
              />
            </label>
            <label>
              {t("crossSection")} (mm²)
              <input
                name="area"
                type="number"
                min="0.000001"
                step="any"
                required
                defaultValue={core.crossSectionMm2}
              />
            </label>
            <select
              name="material"
              aria-label={t("material")}
              defaultValue={core.material}
            >
              <option value="copper">{t("copper")}</option>
              <option value="aluminium">{t("aluminium")}</option>
            </select>
            <button>{t("apply")}</button>
          </form>
        )}
      </details>
      <details>
        <summary>{t("terminalProperties")}</summary>
        <select
          aria-label={t("terminalProperties")}
          value={terminal?.id ?? ""}
          onChange={(e) => setTerminal(e.target.value)}
        >
          {p.terminals.map((item) => (
            <option key={item.id} value={item.id}>
              {terminalName(item.id)}
            </option>
          ))}
        </select>
        {terminal && (
          <form
            key={JSON.stringify(terminal)}
            aria-label={t("terminalProperties")}
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              native.update((p) =>
                updateTerminal(p, terminal.id, {
                  designation: String(data.get("designation")),
                  capacity: data.get("capacity")
                    ? Number(data.get("capacity"))
                    : undefined,
                  required: data.has("required"),
                }),
              );
            }}
          >
            <label>
              {t("designation")}
              <input
                name="designation"
                required
                maxLength={160}
                defaultValue={terminal.designation}
              />
            </label>
            <label>
              {t("terminalCapacity")}
              <input
                name="capacity"
                type="number"
                min="1"
                max="1000"
                step="1"
                defaultValue={terminal.capacity ?? ""}
              />
            </label>
            <label>
              <input
                name="required"
                type="checkbox"
                defaultChecked={terminal.required ?? false}
              />
              {t("requiredConnection")}
            </label>
            <button>{t("apply")}</button>
          </form>
        )}
      </details>
      <details>
        <summary>{t("terminalStrip")}</summary>
        <select
          aria-label={t("terminalStrip")}
          value={strip?.id ?? ""}
          onChange={(e) => setStrip(e.target.value)}
        >
          <option value="">{t("newStrip")}</option>
          {p.terminalStrips.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <form
          key={JSON.stringify(strip) ?? "new"}
          aria-label={t("terminalStrip")}
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const id = strip?.id ?? crypto.randomUUID();
            native.update((p) =>
              saveTerminalStrip(p, {
                id,
                name: String(data.get("name")),
                terminalIds: data.getAll("terminals").map(String),
              }),
            );
            setStrip(id);
          }}
        >
          <label>
            {t("stripName")}
            <input
              name="name"
              required
              maxLength={160}
              defaultValue={strip?.name ?? ""}
            />
          </label>
          <select
            name="terminals"
            multiple
            required
            aria-label={t("stripMembers")}
            defaultValue={strip?.terminalIds ?? []}
          >
            {p.terminals.map((item) => (
              <option key={item.id} value={item.id}>
                {terminalName(item.id)}
              </option>
            ))}
          </select>
          <button>{t("apply")}</button>
        </form>
      </details>
    </>
  );
}
