import { useRef, useState } from "react";
import {
  importPlanGeometry,
  removePlanGeometry,
  type PlanImport,
} from "../../../packages/building-design/plan-import.ts";
import { parseSvgPlan } from "./svgPlanImport";
import type { NativeProjects } from "./useNativeProjects";
import type { MessageKey } from "../../../packages/localization";
export function PlanImportTools({
  native,
  floorId,
  t,
}: {
  native: NativeProjects;
  floorId: string;
  t: (key: MessageKey) => string;
}) {
  const [draft, setDraft] = useState<PlanImport | null>(null),
    [error, setError] = useState("");
  const [automatic, setAutomatic] = useState(false);
  const request = useRef(0);
  const p = native.project;
  if (!p) return null;
  return (
    <>
      <details className="plan-import">
        <summary>{t("importSvgPlan")}</summary>
        <p>{t("svgPlanScope")}</p>
        <form
          aria-label={t("importSvgPlan")}
          onSubmit={async (e) => {
            e.preventDefault();
            const seq = ++request.current;
            setDraft(null);
            setError("");
            const d = new FormData(e.currentTarget),
              file = d.get("file");
            try {
              if (!(file instanceof File) || !file.size)
                throw new Error("Select an SVG file");
              if (file.size > 1024 * 1024) throw new Error("SVG exceeds 1 MiB");
              const parsed = parseSvgPlan(
                await file.text(),
                file.name,
                d.get("automatic") === "on"
                  ? "viewport"
                  : Number(d.get("scale")),
              );
              if (seq === request.current) setDraft(parsed);
            } catch (err) {
              if (seq === request.current)
                setError(err instanceof Error ? err.message : "Invalid SVG");
            }
          }}
        >
          <label>
            {t("svgFile")}
            <input
              type="file"
              name="file"
              accept=".svg,image/svg+xml"
              required
              onChange={() => {
                request.current++;
                setDraft(null);
                setError("");
              }}
            />
          </label>
          <label>
            <input
              type="checkbox"
              name="automatic"
              checked={automatic}
              onChange={(e) => {
                setAutomatic(e.target.checked);
                request.current++;
                setDraft(null);
                setError("");
              }}
            />
            {t("svgAutomaticUnits")}
          </label>
          <label>
            {t("svgUnitScale")}
            <input
              disabled={automatic}
              name="scale"
              type="number"
              min="0.000001"
              max="1000000"
              step="any"
              defaultValue={1}
              required
              onChange={() => {
                request.current++;
                setDraft(null);
              }}
            />
          </label>
          <button>{t("previewSvg")}</button>
        </form>
        {error && <p role="alert">{error}</p>}
        {draft && (
          <section aria-label={t("svgImportReport")}>
            <p>
              {draft.sourceFile} · {draft.shapes.length} · {draft.mmPerUnit}{" "}
              mm/unit
            </p>
            <ul>
              {draft.issues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
            <button
              disabled={!draft.shapes.length}
              onClick={() => {
                if (native.update((p) => importPlanGeometry(p, floorId, draft)))
                  setDraft(null);
              }}
            >
              {t("applySvgImport")}
            </button>
          </section>
        )}
      </details>
      <h3>{t("importedPlanGeometry")}</h3>
      <ul>
        {p.planGeometry
          .filter((s) => s.floorId === floorId)
          .map((s) => (
            <li key={s.id}>
              {s.name} · {s.sourceFile}
              <button
                disabled={
                  !p.architecturalLayers.some(
                    (l) => l.id === s.layerId && l.visible && !l.locked,
                  )
                }
                onClick={() =>
                  native.update((p) => removePlanGeometry(p, s.id))
                }
              >
                {t("removePlanGeometry")}: {s.name}
              </button>
            </li>
          ))}
      </ul>
    </>
  );
}
