import type { Project } from "../../../packages/electrical-model/project.ts";
import { updateWall } from "../../../packages/building-design/walls.ts";
import {
  addWallOpening,
  removeWallOpening,
} from "../../../packages/building-design/openings.ts";
import type { NativeProjects } from "./useNativeProjects";
import type { MessageKey } from "../../../packages/localization";
export function WallDetails({
  wall,
  native,
  disabled,
  t,
}: {
  wall: Project["walls"][number];
  native: NativeProjects;
  disabled: boolean;
  t: (key: MessageKey) => string;
}) {
  return (
    <details>
      <summary>
        {t("editWall")}: {wall.name}
      </summary>
      <form
        key={JSON.stringify(wall)}
        aria-label={`${t("editWall")}: ${wall.name}`}
        onSubmit={(e) => {
          e.preventDefault();
          const d = new FormData(e.currentTarget);
          native.update((p) =>
            updateWall(p, wall.id, {
              name: String(d.get("name")),
              start: { x: Number(d.get("x1")), y: Number(d.get("y1")) },
              end: { x: Number(d.get("x2")), y: Number(d.get("y2")) },
              thicknessMm: Number(d.get("thickness")),
              heightMm: Number(d.get("height")),
            }),
          );
        }}
      >
        <fieldset disabled={disabled}>
          <label>
            {t("wallName")}
            <input
              name="name"
              defaultValue={wall.name}
              required
              maxLength={160}
            />
          </label>
          {(
            [
              ["wallStartX", "x1", wall.start.x],
              ["wallStartY", "y1", wall.start.y],
              ["wallEndX", "x2", wall.end.x],
              ["wallEndY", "y2", wall.end.y],
              ["wallThickness", "thickness", wall.thicknessMm],
              ["wallHeight", "height", wall.heightMm],
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
              />
            </label>
          ))}
          <button>{t("editWall")}</button>
        </fieldset>
      </form>
      <form
        aria-label={`${t("addOpening")}: ${wall.name}`}
        onSubmit={(e) => {
          e.preventDefault();
          const d = new FormData(e.currentTarget);
          native.update((p) =>
            addWallOpening(p, wall.id, {
              name: String(d.get("name")),
              kind: d.get("kind") === "window" ? "window" : "door",
              offsetMm: Number(d.get("offset")),
              widthMm: Number(d.get("width")),
              heightMm: Number(d.get("height")),
              sillMm: Number(d.get("sill")),
              hinge: d.get("hinge") === "end" ? "end" : "start",
              swing: d.get("swing") === "right" ? "right" : "left",
            }),
          );
        }}
      >
        <fieldset disabled={disabled}>
          <label>
            {t("openingName")}
            <input name="name" required maxLength={160} />
          </label>
          <label>
            {t("openingKind")}
            <select name="kind" aria-label={t("openingKind")}>
              <option value="door">{t("doorOpening")}</option>
              <option value="window">{t("windowOpening")}</option>
            </select>
          </label>
          {(
            [
              ["openingOffset", "offset", 500],
              ["openingWidth", "width", 900],
              ["openingHeight", "height", 2100],
              ["openingSill", "sill", 0],
            ] as const
          ).map(([label, name, value]) => (
            <label key={name}>
              {t(label)}
              <input
                name={name}
                type="number"
                step="any"
                min={name === "width" || name === "height" ? 1 : 0}
                defaultValue={value}
                required
              />
            </label>
          ))}
          <label>
            {t("openingHinge")}
            <select name="hinge" aria-label={t("openingHinge")}>
              <option value="start">{t("hingeStart")}</option>
              <option value="end">{t("hingeEnd")}</option>
            </select>
          </label>
          <label>
            {t("openingSwing")}
            <select name="swing" aria-label={t("openingSwing")}>
              <option value="left">{t("swingLeft")}</option>
              <option value="right">{t("swingRight")}</option>
            </select>
          </label>
          <button>{t("addOpening")}</button>
        </fieldset>
      </form>
      <ul>
        {native.project?.wallOpenings
          .filter((o) => o.wallId === wall.id)
          .map((o) => (
            <li key={o.id}>
              {o.name} ·{" "}
              {t(o.kind === "door" ? "doorOpening" : "windowOpening")} ·{" "}
              {o.widthMm} × {o.heightMm} mm
              <button
                disabled={disabled}
                onClick={() => native.update((p) => removeWallOpening(p, o.id))}
              >
                {t("removeOpening")}: {o.name}
              </button>
            </li>
          ))}
      </ul>
    </details>
  );
}
