import { WallDetails } from "./WallDetails";
import {
  addPlanLayer,
  setPlanLayer,
  addWall,
  removeWall,
} from "../../../packages/building-design/walls.ts";
import type { NativeProjects } from "./useNativeProjects";
import type { MessageKey } from "../../../packages/localization";
export function WallTools({
  native,
  floorId,
  t,
}: {
  native: NativeProjects;
  floorId: string;
  t: (key: MessageKey) => string;
}) {
  const p = native.project;
  if (!p) return null;
  const layers = p.architecturalLayers.filter((l) => l.floorId === floorId);
  const editable = layers.filter(
    (l) => l.kind === "architectural" && l.visible && !l.locked,
  );
  return (
    <details className="wall-tools">
      <summary>{t("wallsAndLayers")}</summary>
      <form
        aria-label={t("addPlanLayer")}
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          native.update((p) =>
            addPlanLayer(
              p,
              floorId,
              String(data.get("name")),
              data.get("kind") === "electrical"
                ? "electrical"
                : "architectural",
            ),
          );
        }}
      >
        <label>
          {t("planLayerName")}
          <input name="name" required maxLength={160} />
        </label>
        <label>
          {t("planLayerKind")}
          <select name="kind">
            <option value="architectural">{t("architecturalLayer")}</option>
            <option value="electrical">{t("electricalLayer")}</option>
          </select>
        </label>
        <button>{t("addPlanLayer")}</button>
      </form>
      <ul>
        {layers.map((l) => (
          <li key={l.id}>
            {l.name} ·{" "}
            {t(
              l.kind === "architectural"
                ? "architecturalLayer"
                : "electricalLayer",
            )}
            <label>
              <input
                type="checkbox"
                checked={l.visible}
                onChange={(e) =>
                  native.update((p) =>
                    setPlanLayer(p, l.id, { visible: e.target.checked }),
                  )
                }
              />
              {t("planLayerVisible")}: {l.name}
            </label>
            <label>
              <input
                type="checkbox"
                checked={l.locked}
                onChange={(e) =>
                  native.update((p) =>
                    setPlanLayer(p, l.id, { locked: e.target.checked }),
                  )
                }
              />
              {t("planLayerLocked")}: {l.name}
            </label>
          </li>
        ))}
      </ul>
      <form
        aria-label={t("addWall")}
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          native.update((p) =>
            addWall(
              p,
              String(data.get("layer")),
              String(data.get("name")),
              { x: Number(data.get("x1")), y: Number(data.get("y1")) },
              { x: Number(data.get("x2")), y: Number(data.get("y2")) },
              Number(data.get("thickness")),
              Number(data.get("height")),
            ),
          );
        }}
      >
        <label>
          {t("wallName")}
          <input name="name" required maxLength={160} />
        </label>
        <label>
          {t("architecturalLayer")}
          <select name="layer" required>
            {editable.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        {(
          [
            ["wallStartX", "x1", 0],
            ["wallStartY", "y1", 0],
            ["wallEndX", "x2", 4000],
            ["wallEndY", "y2", 0],
            ["wallThickness", "thickness", 200],
            ["wallHeight", "height", 3000],
          ] as const
        ).map(([label, name, value]) => (
          <label key={name}>
            {t(label)}
            <input
              name={name}
              type="number"
              step="any"
              defaultValue={value}
              required
              min={name === "thickness" || name === "height" ? 1 : -1000000}
              max={
                name === "thickness"
                  ? 10000
                  : name === "height"
                    ? 100000
                    : 1000000
              }
            />
          </label>
        ))}
        <button disabled={!editable.length}>{t("addWall")}</button>
      </form>
      <ul>
        {p.walls
          .filter((w) => w.floorId === floorId)
          .map((w) => (
            <li key={w.id}>
              {w.name} · {w.thicknessMm} mm × {w.heightMm} mm{" "}
              <button
                disabled={
                  !editable.some((l) => l.id === w.layerId) ||
                  p.wallOpenings.some((o) => o.wallId === w.id)
                }
                onClick={() => native.update((p) => removeWall(p, w.id))}
              >
                {t("removeWall")}: {w.name}
              </button>
              <WallDetails
                wall={w}
                native={native}
                disabled={!editable.some((l) => l.id === w.layerId)}
                t={t}
              />
            </li>
          ))}
      </ul>
    </details>
  );
}
