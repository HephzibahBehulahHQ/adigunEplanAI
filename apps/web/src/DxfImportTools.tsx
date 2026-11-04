import { useEffect, useRef, useState } from "react";
import {
  importPlanGeometry,
  type PlanImport,
} from "../../../packages/building-design/plan-import.ts";
import type { NativeProjects } from "./useNativeProjects";
import type { MessageKey } from "../../../packages/localization";
export function DxfImportTools({
  native,
  floorId,
  t,
}: {
  native: NativeProjects;
  floorId: string;
  t: (key: MessageKey) => string;
}) {
  const [draft, setDraft] = useState<PlanImport | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [manual, setManual] = useState(false);
  const job = useRef<Worker | null>(null),
    timer = useRef<number | undefined>(undefined),
    request = useRef(0);
  const stop = () => {
    job.current?.terminate();
    job.current = null;
    window.clearTimeout(timer.current);
  };
  const reset = () => {
    request.current++;
    stop();
    setBusy(false);
    setDraft(null);
    setError("");
  };
  useEffect(
    () => () => {
      request.current++;
      job.current?.terminate();
      window.clearTimeout(timer.current);
    },
    [],
  );
  return (
    <details className="dxf-import">
      <summary>{t("importDxfPlan")}</summary>
      <p>{t("dxfPlanScope")}</p>
      <form
        aria-label={t("importDxfPlan")}
        onSubmit={async (e) => {
          e.preventDefault();
          reset();
          setBusy(true);
          const seq = request.current,
            d = new FormData(e.currentTarget),
            file = d.get("file");
          try {
            if (!(file instanceof File) || !file.size)
              throw new Error("Select a DXF file");
            if (file.size > 1024 * 1024) throw new Error("DXF exceeds 1 MiB");
            const text = await file.text();
            if (seq !== request.current) return;
            const worker = new Worker(
              new URL("./dxfImport.worker.ts", import.meta.url),
              { type: "module" },
            );
            job.current = worker;
            worker.onmessage = (
              event: MessageEvent<{ draft?: PlanImport; error?: string }>,
            ) => {
              if (seq !== request.current) return;
              stop();
              setBusy(false);
              if (event.data.draft) setDraft(event.data.draft);
              else setError(event.data.error ?? "Invalid DXF result");
            };
            worker.onerror = () => {
              if (seq !== request.current) return;
              stop();
              setBusy(false);
              setError(t("dxfWorkerFailed"));
            };
            timer.current = window.setTimeout(() => {
              if (seq !== request.current) return;
              stop();
              request.current++;
              setBusy(false);
              setError(t("dxfTimeout"));
            }, 10000);
            worker.postMessage({
              text,
              name: file.name,
              scale:
                d.get("manual") === "on" ? Number(d.get("scale")) : undefined,
            });
          } catch (err) {
            if (seq === request.current) {
              stop();
              setBusy(false);
              setError(err instanceof Error ? err.message : "Invalid DXF");
            }
          }
        }}
      >
        <label>
          {t("dxfFile")}
          <input
            name="file"
            type="file"
            accept=".dxf,application/dxf"
            required
            onChange={reset}
          />
        </label>
        <label>
          <input
            name="manual"
            type="checkbox"
            checked={manual}
            onChange={(e) => {
              reset();
              setManual(e.target.checked);
            }}
          />
          {t("dxfManualUnits")}
        </label>
        <label>
          {t("dxfUnitScale")}
          <input
            name="scale"
            type="number"
            min="0.000001"
            max="1000000"
            step="any"
            required
            defaultValue={1}
            disabled={!manual}
            onChange={reset}
          />
        </label>
        <button disabled={busy}>{t("previewDxf")}</button>
      </form>
      {busy && <p role="status">{t("dxfParsing")}</p>}
      {(busy || draft) && <button onClick={reset}>{t("cancelDxf")}</button>}
      {error && <p role="alert">{error}</p>}
      {draft && (
        <section aria-label={t("dxfImportReport")}>
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
            {t("applyDxfImport")}
          </button>
        </section>
      )}
    </details>
  );
}
