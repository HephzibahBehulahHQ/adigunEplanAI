import { useEffect, useRef, useState } from "react";
import {
  createComponentRevision,
  compatibleCustomComponent,
  assignCustomComponent,
  exportCustomComponent,
  importCustomComponent,
  maxComponentBytes,
  type CustomComponentInput,
} from "../../../packages/component-library/custom-components.ts";
import type { NativeProjects } from "./useNativeProjects";
import type { MessageKey } from "../../../packages/localization";

export function CustomComponents({
  native,
  t,
}: {
  native: NativeProjects;
  t: (key: MessageKey) => string;
}) {
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState<MessageKey | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const current = useRef(native);
  useEffect(() => {
    current.current = native;
  }, [native]);
  const project = native.project;
  if (!project) return null;
  const parts = project.manufacturerParts.filter((part) => part.custom);
  const ratingLabels: Record<string, [MessageKey, string]> = {
    nominalVoltageV: ["nominalVoltage", "V"],
    nominalCurrentA: ["nominalCurrent", "A"],
    ratedCrossSectionMm2: ["ratedCrossSection", "mm²"],
  };
  const part = parts.find((item) => item.id === selected);
  const fields = [
    ["name", "componentName", part?.name, true],
    ["manufacturer", "manufacturer", part?.manufacturer, true],
    ["partNumber", "partNumber", part?.partNumber, true],
    ["category", "category", part?.custom?.category, true],
    [
      "sourceRevision",
      "componentSourceRevision",
      part?.custom?.sourceRevision,
      false,
    ],
  ] as const;
  return (
    <details className="custom-components">
      <summary>{t("customComponents")}</summary>
      <p>{t("customComponentScope")}</p>
      <label>
        {t("componentRevisionEditor")}
        <select
          aria-label={t("componentRevisionEditor")}
          value={part?.id ?? ""}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">{t("create")}</option>
          {parts.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · v{item.custom!.revision}
            </option>
          ))}
        </select>
      </label>
      <form
        key={part?.id ?? "new"}
        aria-label={t("customComponents")}
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const value = (key: string) => String(data.get(key) ?? "").trim();
          const ratings = { ...part?.ratings };
          for (const [key] of [
            ["nominalVoltageV"],
            ["nominalCurrentA"],
            ["ratedCrossSectionMm2"],
          ]) {
            if (value(key)) ratings[key] = Number(value(key));
            else delete ratings[key];
          }
          const dimensions = ["width", "height", "depth"].map(value);
          let createdId = "";
          const ok = native.update((p) => {
            if (dimensions.some(Boolean) && !dimensions.every(Boolean))
              throw new Error("All dimensions must be declared together");
            const input: CustomComponentInput = {
              name: value("name"),
              manufacturer: value("manufacturer"),
              partNumber: value("partNumber"),
              ...(value("sourceUrl") ? { sourceUrl: value("sourceUrl") } : {}),
              ratings,
              symbolDefinitionId: value("symbol"),
              details: {
                category: value("category"),
                description: value("description"),
                licensing: value(
                  "licensing",
                ) as CustomComponentInput["details"]["licensing"],
                ...(value("sourceRevision")
                  ? { sourceRevision: value("sourceRevision") }
                  : {}),
                ...(value("mounting") ? { mounting: value("mounting") } : {}),
                ...(value("terminalInformation")
                  ? { terminalInformation: value("terminalInformation") }
                  : {}),
                ...(dimensions.every(Boolean)
                  ? {
                      dimensionsMm: {
                        width: Number(dimensions[0]),
                        height: Number(dimensions[1]),
                        depth: Number(dimensions[2]),
                      },
                    }
                  : {}),
              },
            };
            const next = createComponentRevision(p, input, part?.id);
            createdId = next.manufacturerParts.at(-1)!.id;
            return next;
          });
          setMessage(ok ? "componentSaved" : "componentError");
          if (ok) setSelected(createdId);
        }}
      >
        {fields.map(([name, label, initial, required]) => (
          <label key={name}>
            {t(label)}
            <input
              name={name}
              required={required}
              maxLength={160}
              defaultValue={initial ?? ""}
            />
          </label>
        ))}
        <label>
          {t("componentDescription")}
          <textarea
            name="description"
            required
            maxLength={2000}
            defaultValue={part?.custom?.description ?? ""}
          />
        </label>
        <label>
          {t("componentSymbol")}
          <select
            name="symbol"
            aria-label={t("componentSymbol")}
            required
            defaultValue={part?.custom?.symbolDefinition.id ?? ""}
          >
            <option value="" disabled>
              —
            </option>
            {project.symbolDefinitions
              .filter(
                (d) => d.pins.length || d.connectionClass === "mechanical",
              )
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          {t("componentSourceUrl")}
          <input
            name="sourceUrl"
            type="url"
            maxLength={2048}
            defaultValue={part?.sourceUrl ?? ""}
          />
        </label>
        <label>
          {t("componentLicensing")}
          <select
            name="licensing"
            aria-label={t("componentLicensing")}
            defaultValue={part?.custom?.licensing ?? "unknown"}
          >
            <option value="unknown">{t("notDeclared")}</option>
            <option value="user-owned">{t("componentUserOwned")}</option>
            <option value="authorized">{t("componentAuthorized")}</option>
          </select>
        </label>
        {(
          [
            ["nominalVoltageV", "componentVoltage"],
            ["nominalCurrentA", "componentCurrent"],
            ["ratedCrossSectionMm2", "componentSection"],
          ] as const
        ).map(([key, label]) => (
          <label key={key}>
            {t(label)}
            <input
              type="number"
              name={key}
              min={key === "ratedCrossSectionMm2" ? "0.000001" : "0"}
              step="any"
              defaultValue={part?.ratings[key] ?? ""}
            />
          </label>
        ))}
        <fieldset>
          <legend>{t("componentDimensions")}</legend>
          {(["width", "height", "depth"] as const).map((key) => (
            <label key={key}>
              {t(
                ("component" +
                  key[0].toUpperCase() +
                  key.slice(1)) as MessageKey,
              )}
              <input
                name={key}
                type="number"
                min="0.001"
                max="100000"
                step="any"
                defaultValue={part?.custom?.dimensionsMm?.[key] ?? ""}
              />
            </label>
          ))}
        </fieldset>
        <label>
          {t("componentMounting")}
          <textarea
            name="mounting"
            maxLength={2000}
            defaultValue={part?.custom?.mounting ?? ""}
          />
        </label>
        <label>
          {t("componentTerminals")}
          <textarea
            name="terminalInformation"
            maxLength={2000}
            defaultValue={part?.custom?.terminalInformation ?? ""}
          />
        </label>
        <button>
          {t(part ? "createComponentRevision" : "createComponent")}
        </button>
      </form>
      {message && <p role="status">{t(message)}</p>}
      <button onClick={() => file.current?.click()}>
        {t("importComponent")}
      </button>
      <input
        hidden
        ref={file}
        type="file"
        accept=".json,.adcomponent"
        aria-label={t("importComponent")}
        onChange={async (e) => {
          const input = e.currentTarget;
          const selectedFile = input.files?.[0];
          input.value = "";
          if (!selectedFile) return;
          const projectId = project.id;
          try {
            if (selectedFile.size > maxComponentBytes)
              throw new Error("Component too large");
            const text = await selectedFile.text();
            const latest = current.current;
            if (latest.project?.id !== projectId)
              throw new Error("Project changed during import");
            const ok = latest.update((p) => importCustomComponent(p, text));
            setMessage(ok ? "componentImported" : "componentError");
          } catch {
            setMessage("componentError");
          }
        }}
      />
      {parts.map((record) => (
        <article
          key={record.id}
          aria-label={`${record.name} v${record.custom!.revision}`}
        >
          <h4>
            {record.name} · v{record.custom!.revision}
          </h4>
          <p>{t("componentUnverified")}</p>
          <p>
            {record.manufacturer} · {record.partNumber}
          </p>
          <p>{record.custom!.description}</p>
          <p>
            {t("componentLicensing")}:{" "}
            {t(
              record.custom!.licensing === "user-owned"
                ? "componentUserOwned"
                : record.custom!.licensing === "authorized"
                  ? "componentAuthorized"
                  : "notDeclared",
            )}
          </p>
          <p>
            {t("componentDimensions")}:{" "}
            {record.custom!.dimensionsMm
              ? `${record.custom!.dimensionsMm.width} × ${record.custom!.dimensionsMm.height} × ${record.custom!.dimensionsMm.depth} mm`
              : t("notDeclared")}
          </p>
          <p>
            {t("componentMounting")}:{" "}
            {record.custom!.mounting ?? t("notDeclared")}
          </p>
          <p>
            {t("componentTerminals")}:{" "}
            {record.custom!.terminalInformation ?? t("notDeclared")}
          </p>
          <dl>
            {Object.entries(record.ratings).map(([key, value]) => (
              <div key={key}>
                <dt>{ratingLabels[key] ? t(ratingLabels[key][0]) : key}</dt>
                <dd>
                  {value}
                  {ratingLabels[key] ? ` ${ratingLabels[key][1]}` : ""}
                </dd>
              </div>
            ))}
          </dl>
          {record.sourceUrl && (
            <a href={record.sourceUrl} target="_blank" rel="noreferrer">
              {t("source")}
            </a>
          )}
          <button
            onClick={() => {
              try {
                const url = URL.createObjectURL(
                  new Blob([exportCustomComponent(project, record.id)], {
                    type: "application/json",
                  }),
                );
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = `${record.partNumber.replace(/[^A-Za-z0-9_-]/g, "_")}-v${record.custom!.revision}.adcomponent.json`;
                anchor.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              } catch {
                setMessage("componentError");
              }
            }}
          >
            {t("exportComponent")}: {record.name} v{record.custom!.revision}
          </button>
          <form
            aria-label={`${t("assignPart")}: ${record.name} v${record.custom!.revision}`}
            onSubmit={(e) => {
              e.preventDefault();
              const deviceId = String(
                new FormData(e.currentTarget).get("device"),
              );
              setMessage(
                native.update((p) =>
                  assignCustomComponent(p, deviceId, record.id),
                )
                  ? "componentAssigned"
                  : "componentError",
              );
            }}
          >
            <label>
              {t("compatibleDevice")}
              <select
                name="device"
                required
                aria-label={t("compatibleDevice")}
                defaultValue=""
              >
                <option value="" disabled>
                  —
                </option>
                {project.devices
                  .filter((d) =>
                    compatibleCustomComponent(project, d.id, record.id),
                  )
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.reference}
                    </option>
                  ))}
              </select>
            </label>
            <button
              disabled={
                !project.devices.some((d) =>
                  compatibleCustomComponent(project, d.id, record.id),
                )
              }
            >
              {t("assignPart")}
            </button>
          </form>
        </article>
      ))}
    </details>
  );
}
