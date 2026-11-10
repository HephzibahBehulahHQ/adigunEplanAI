import { useEffect, useRef, useState } from "react";
import type { Project } from "../../../packages/electrical-model/project.ts";
import type { MessageKey } from "../../../packages/localization";
import {
  parseStl,
  meshLimits,
  meshTopology,
  validateMeshGeometry,
  type MeshAxes,
  type MeshUnits,
} from "../../../packages/panel-engineering/mesh.ts";
import {
  assignPanelMesh,
  detachPanelMesh,
} from "../../../packages/panel-engineering/mesh-commands.ts";

export function PanelMeshTools({
  project,
  placementId,
  run,
  t,
}: {
  project: Project;
  placementId: string;
  run: (change: (project: Project) => Project) => boolean;
  t: (key: MessageKey) => string;
}) {
  const [units, setUnits] = useState<MeshUnits | "">(""),
    [axes, setAxes] = useState<MeshAxes | "">("");
  const [pending, setPending] = useState<{
    geometry: ReturnType<typeof parseStl>;
    filename: string;
    hash: string;
  } | null>(null);
  const [busy, setBusy] = useState(false),
    [expanded, setExpanded] = useState(false),
    [error, setError] = useState(false),
    [existing, setExisting] = useState("");
  const sequence = useRef(0);
  useEffect(
    () => () => {
      sequence.current++;
    },
    [],
  );
  const placement = project.equipment3d.find((item) => item.id === placementId);
  const model = project.panelMeshes.find(
    (item) => item.id === placement?.meshId,
  );
  const geometry = pending?.geometry ?? model;
  const dimensions = geometry ? validateMeshGeometry(geometry) : null;
  const topology = geometry ? meshTopology(geometry) : null;
  return (
    <details
      className="panel-mesh-tools"
      open={expanded}
      onToggle={(event) => setExpanded(event.currentTarget.open)}
    >
      <summary>{t("meshModels")}</summary>
      <p>{t("meshScope")}</p>
      {model && (
        <p data-mesh-name={model.id}>
          {model.name} · {model.source.reference} · {model.source.license}
        </p>
      )}
      {!!project.panelMeshes.length && (
        <label>
          {t("meshExisting")}
          <select
            aria-label={t("meshExisting")}
            value={existing}
            onChange={(event) => setExisting(event.target.value)}
          >
            <option value="">—</option>
            {project.panelMeshes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {existing && (
        <button
          type="button"
          onClick={() => {
            const found = project.panelMeshes.find(
              (item) => item.id === existing,
            );
            if (found)
              setError(
                !run((draft) => assignPanelMesh(draft, placementId, found)),
              );
          }}
        >
          {t("meshUseExisting")}
        </button>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!pending || !units || !axes) return;
          const data = new FormData(event.currentTarget);
          const record: Project["panelMeshes"][number] = {
            id: crypto.randomUUID(),
            name: String(data.get("modelName")).trim(),
            vertices: pending.geometry.vertices,
            triangles: pending.geometry.triangles,
            source: {
              filename: pending.filename,
              reference: String(data.get("modelSource")).trim(),
              license: String(data.get("modelLicense")).trim(),
              sha256: pending.hash,
              encoding: pending.geometry.encoding,
              units,
              axes,
              attributesIgnored: pending.geometry.attributesIgnored,
            },
          };
          const applied = run((draft) =>
            assignPanelMesh(draft, placementId, record),
          );
          setError(!applied);
          if (applied) setPending(null);
        }}
      >
        <label>
          {t("meshUnits")}
          <select
            aria-label={t("meshUnits")}
            value={units}
            onChange={(event) => {
              sequence.current++;
              setBusy(false);
              setPending(null);
              setUnits(event.target.value as MeshUnits);
            }}
            required
          >
            <option value="" disabled>
              —
            </option>
            {["mm", "cm", "m", "in"].map((unit) => (
              <option key={unit}>{unit}</option>
            ))}
          </select>
        </label>
        <label>
          {t("meshAxes")}
          <select
            aria-label={t("meshAxes")}
            value={axes}
            onChange={(event) => {
              sequence.current++;
              setBusy(false);
              setPending(null);
              setAxes(event.target.value as MeshAxes);
            }}
            required
          >
            <option value="" disabled>
              —
            </option>
            <option value="panel">{t("meshPanelAxes")}</option>
            <option value="z-up">{t("meshZUpAxes")}</option>
          </select>
        </label>
        <label>
          {t("meshFile")}
          <input
            aria-label={t("meshFile")}
            type="file"
            accept=".stl"
            disabled={!units || !axes || busy}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file || !units || !axes) return;
              const request = ++sequence.current;
              setError(false);
              setPending(null);
              setBusy(true);
              try {
                if (file.size > meshLimits.bytes)
                  throw new Error("Model too large");
                const buffer = await file.arrayBuffer();
                const geometry = parseStl(new Uint8Array(buffer), units, axes);
                const hash = Array.from(
                  new Uint8Array(await crypto.subtle.digest("SHA-256", buffer)),
                  (b) => b.toString(16).padStart(2, "0"),
                ).join("");
                if (request === sequence.current)
                  setPending({ geometry, hash, filename: file.name });
              } catch {
                if (request === sequence.current) setError(true);
              } finally {
                if (request === sequence.current) setBusy(false);
              }
            }}
          />
        </label>
        {busy && <p role="status">{t("meshReading")}</p>}
        {dimensions && topology && (
          <div className="mesh-inspection" role="status">
            <p>
              {t("meshDimensions")}: {dimensions.x} × {dimensions.y} ×{" "}
              {dimensions.z} mm · {geometry!.triangles.length}{" "}
              {t("meshTriangles")}
            </p>
            <p>
              {t("meshTopology")}: {topology.boundaryEdges} /{" "}
              {topology.nonManifoldEdges} / {topology.inconsistentEdges}
            </p>
            {pending?.geometry.attributesIgnored && (
              <p>{t("meshAttributesIgnored")}</p>
            )}
          </div>
        )}
        {pending && (
          <>
            <label>
              {t("meshName")}
              <input
                name="modelName"
                required
                maxLength={200}
                defaultValue={pending.filename.replace(/\.stl$/i, "")}
              />
            </label>
            <label>
              {t("meshSource")}
              <input name="modelSource" required maxLength={2000} />
            </label>
            <label>
              {t("meshLicense")}
              <input name="modelLicense" required maxLength={1000} />
            </label>
            <p>{t("meshApplyScope")}</p>
            <button type="submit">{t("meshApply")}</button>
            <button type="button" onClick={() => setPending(null)}>
              {t("cancel")}
            </button>
          </>
        )}
      </form>
      {model && (
        <button
          type="button"
          onClick={() =>
            setError(!run((draft) => detachPanelMesh(draft, placementId)))
          }
        >
          {t("meshDetach")}
        </button>
      )}
      {error && <p role="alert">{t("meshImportError")}</p>}
    </details>
  );
}
