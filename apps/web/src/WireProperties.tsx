import {
  addCableCore,
  setWireProperties,
} from "../../../packages/connectivity-engine/wire-properties.ts";
import type { Project } from "../../../packages/electrical-model/project.ts";
import type { MessageKey } from "../../../packages/localization";

export function WireProperties({
  project,
  wire,
  edit,
  t,
}: {
  project: Project;
  wire: Project["wires"][number];
  edit: (change: (project: Project) => Project) => void;
  t: (key: MessageKey) => string;
}) {
  return (
    <details className="wire-properties">
      <summary>{t("wireProperties")}</summary>
      <form
        className="editor-toolbar"
        key={JSON.stringify(wire)}
        aria-label={t("wireProperties")}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          edit((p) =>
            setWireProperties(p, wire.id, {
              name: String(data.get("name")),
              color: String(data.get("color")).trim() || undefined,
              physicalLengthM: data.get("length")
                ? Number(data.get("length"))
                : undefined,
              conductorId: String(data.get("core")) || undefined,
            }),
          );
        }}
      >
        <label>
          {t("wireTool")}
          <input
            name="name"
            required
            maxLength={160}
            defaultValue={wire.name}
          />
        </label>
        <label>
          {t("drawingColor")}
          <input
            name="color"
            pattern="#[0-9a-fA-F]{6}"
            maxLength={7}
            defaultValue={wire.color ?? ""}
          />
        </label>
        <label>
          {t("physicalLength")} (m)
          <input
            name="length"
            type="number"
            min="0.000001"
            step="any"
            defaultValue={wire.physicalLengthM ?? ""}
          />
        </label>
        <label>
          {t("cableCore")}
          <select
            name="core"
            aria-label={t("cableCore")}
            defaultValue={wire.conductorId ?? ""}
          >
            <option value="">—</option>
            {project.conductors.map((core) => (
              <option key={core.id} value={core.id}>
                {core.name} · {core.crossSectionMm2} mm² · {core.color}
              </option>
            ))}
          </select>
        </label>
        <button>{t("apply")}</button>
      </form>
      <form
        className="editor-toolbar"
        aria-label={t("newCore")}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          edit((p) =>
            addCableCore(
              p,
              wire.id,
              {
                id: crypto.randomUUID(),
                name: String(data.get("name")),
                color: String(data.get("color")),
                crossSectionMm2: Number(data.get("area")),
                material: data.get("material") as "copper" | "aluminium",
              },
              String(data.get("cable")) || undefined,
            ),
          );
        }}
      >
        <label>
          {t("cableCore")}
          <input name="name" required maxLength={160} />
        </label>
        <label>
          {t("coreColor")}
          <input name="color" required maxLength={160} />
        </label>
        <label>
          {t("crossSection")} (mm²)
          <input name="area" type="number" min="0.000001" step="any" required />
        </label>
        <label>
          {t("material")}
          <select name="material" aria-label={t("material")}>
            <option value="copper">{t("copper")}</option>
            <option value="aluminium">{t("aluminium")}</option>
          </select>
        </label>
        <label>
          {t("cable")}
          <select name="cable" aria-label={t("cable")}>
            <option value="">—</option>
            {project.cables.map((cable) => (
              <option key={cable.id} value={cable.id}>
                {cable.name}
              </option>
            ))}
          </select>
        </label>
        <button>{t("newCore")}</button>
      </form>
    </details>
  );
}
