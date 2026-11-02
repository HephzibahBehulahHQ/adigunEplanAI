import {
  createCustomSymbol,
  updateCustomSymbol,
} from "../../../packages/component-library/custom-symbols.ts";
import { useState } from "react";
import type { Project } from "../../../packages/electrical-model/project.ts";
import type { NativeProjects } from "./useNativeProjects";
import type { MessageKey } from "../../../packages/localization";

export function CustomSymbols({
  native,
  t,
}: {
  native: NativeProjects;
  t: (key: MessageKey) => string;
}) {
  const [selected, setSelected] = useState("");
  if (!native.project) return null;
  const definition = native.project.symbolDefinitions.find(
    (d) => d.id === selected && d.category === "custom",
  );
  return (
    <details>
      <summary>{t("customSymbols")}</summary>
      <p>{t("customSymbolScope")}</p>
      <select
        aria-label={t("editCustomSymbol")}
        value={definition?.id ?? ""}
        onChange={(e) => setSelected(e.target.value)}
      >
        <option value="">{t("create")}</option>
        {native.project.symbolDefinitions
          .filter((d) => d.category === "custom")
          .map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
      </select>
      <form
        key={JSON.stringify(definition) ?? "new"}
        aria-label={t("customSymbols")}
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          native.update((p) => {
            const pins = String(data.get("pins"))
              .trim()
              .split(/\r?\n/)
              .map((line) => {
                const values = line.split(",").map((value) => value.trim());
                if (values.length !== 3 || values.some((value) => !value))
                  throw new Error("Invalid pin row");
                return {
                  id: values[0],
                  position: { x: Number(values[1]), y: Number(values[2]) },
                };
              });
            return (definition ? updateCustomSymbol : createCustomSymbol)(p, {
              id: definition?.id ?? crypto.randomUUID(),
              name: String(data.get("name")),
              category: "custom",
              glyph: "box",
              widthMm: Number(data.get("width")),
              heightMm: Number(data.get("height")),
              pins,
              ...(String(data.get("artwork")).trim()
                ? {
                    artwork: String(data.get("artwork"))
                      .trim()
                      .split(/\r?\n/)
                      .map((line) => {
                        const [kind, ...raw] = line
                          .split(",")
                          .map((value) => value.trim());
                        if (raw.some((value) => !value))
                          throw new Error("Invalid artwork row");
                        const n = raw.map(Number);
                        if (kind === "line" && n.length === 4)
                          return {
                            kind,
                            from: { x: n[0], y: n[1] },
                            to: { x: n[2], y: n[3] },
                          };
                        if (kind === "circle" && n.length === 3)
                          return {
                            kind,
                            center: { x: n[0], y: n[1] },
                            radiusMm: n[2],
                          };
                        throw new Error("Invalid artwork row");
                      }) as NonNullable<
                      Project["symbolDefinitions"][number]["artwork"]
                    >,
                  }
                : {}),
            });
          });
        }}
      >
        <label>
          {t("symbolName")}
          <input
            name="name"
            required
            maxLength={160}
            defaultValue={definition?.name ?? ""}
          />
        </label>
        <label>
          {t("symbolWidth")}
          <input
            name="width"
            required
            type="number"
            min="4"
            max="500"
            step="any"
            defaultValue={definition?.widthMm ?? ""}
          />
        </label>
        <label>
          {t("symbolHeight")}
          <input
            name="height"
            required
            type="number"
            min="4"
            max="500"
            step="any"
            defaultValue={definition?.heightMm ?? ""}
          />
        </label>
        <label>
          {t("symbolPins")}
          <textarea
            name="pins"
            required
            maxLength={20000}
            defaultValue={
              definition?.pins
                .map((pin) => `${pin.id}, ${pin.position.x}, ${pin.position.y}`)
                .join("\n") ?? ""
            }
          />
        </label>
        <label>
          {t("symbolArtwork")}
          <textarea
            name="artwork"
            maxLength={20000}
            defaultValue={
              definition?.artwork
                ?.map((shape) =>
                  shape.kind === "line"
                    ? `line, ${shape.from.x}, ${shape.from.y}, ${shape.to.x}, ${shape.to.y}`
                    : `circle, ${shape.center.x}, ${shape.center.y}, ${shape.radiusMm}`,
                )
                .join("\n") ?? ""
            }
          />
        </label>
        <button>{t(definition ? "apply" : "create")}</button>
      </form>
    </details>
  );
}
