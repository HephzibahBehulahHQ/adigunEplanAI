import { useState } from "react";
import { CustomSymbols } from "./CustomSymbols";
import { EngineeringSymbols } from "./EngineeringSymbols";
import {
  catalog,
  searchCatalog,
  assignCatalogPart,
} from "../../../packages/component-library/catalog.ts";
import type { NativeProjects } from "./useNativeProjects";
import type { MessageKey } from "../../../packages/localization";

export function ComponentLibrary({
  native,
  t,
}: {
  native: NativeProjects;
  t: (key: MessageKey) => string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const results = searchCatalog(query, category, manufacturer);
  const project = native.project;
  const devices =
    project?.devices.filter((device) =>
      project.symbolInstances.some(
        (instance) =>
          instance.deviceId === device.id &&
          project.symbolDefinitions.find(
            (def) => def.id === instance.definitionId,
          )?.glyph === "terminal",
      ),
    ) ?? [];
  return (
    <details className="component-library">
      <summary>{t("componentLibrary")}</summary>
      <p>{t("catalogScope")}</p>
      <CustomSymbols native={native} t={t} />
      <EngineeringSymbols native={native} t={t} />
      <label>
        {t("searchParts")}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          maxLength={160}
        />
      </label>
      <label>
        {t("category")}
        <select
          aria-label={t("category")}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">{t("all")}</option>
          {[...new Set(catalog.map((p) => p.category))].map((value) => (
            <option key={value} value={value}>
              {t("connections")}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("manufacturer")}
        <select
          aria-label={t("manufacturer")}
          value={manufacturer}
          onChange={(e) => setManufacturer(e.target.value)}
        >
          <option value="">{t("all")}</option>
          {[...new Set(catalog.map((p) => p.manufacturer))].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <p role="status">
        {t("results")}: {results.length}
      </p>
      {results.map((part) => (
        <article
          key={part.id}
          aria-label={`${part.manufacturer} ${part.partNumber}`}
        >
          <h3>
            {part.name} · {part.partNumber}
          </h3>
          <p>{part.manufacturer}</p>
          <a href={part.sourceUrl} target="_blank" rel="noreferrer">
            {t("manufacturerSource")}
          </a>
          <p>
            {t("reviewedOn")}: {part.reviewedOn}
          </p>
          <dl>
            <dt>{t("nominalVoltage")}</dt>
            <dd>
              {part.ratings.nominalVoltageV === undefined
                ? t("notDeclared")
                : `${part.ratings.nominalVoltageV} V`}
            </dd>
            <dt>{t("nominalCurrent")}</dt>
            <dd>
              {part.ratings.nominalCurrentA === undefined
                ? t("notDeclared")
                : `${part.ratings.nominalCurrentA} A`}
            </dd>
            <dt>{t("ratedCrossSection")}</dt>
            <dd>{part.ratings.ratedCrossSectionMm2} mm²</dd>
            <dt>{t("conductorRange")}</dt>
            <dd>
              {part.ratings.minimumCrossSectionMm2 === undefined ||
              part.ratings.maximumCrossSectionMm2 === undefined
                ? t("notDeclared")
                : `${part.ratings.minimumCrossSectionMm2}–${part.ratings.maximumCrossSectionMm2} mm²`}
            </dd>
            <dt>{t("connections")}</dt>
            <dd>{part.mapping.connections}</dd>
          </dl>
          {project && (
            <form
              aria-label={t("assignPart")}
              onSubmit={(e) => {
                e.preventDefault();
                const id = String(new FormData(e.currentTarget).get("device"));
                native.update((p) => assignCatalogPart(p, id, part.id));
              }}
            >
              <label>
                {t("compatibleDevice")}
                <select
                  aria-label={t("compatibleDevice")}
                  name="device"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    —
                  </option>
                  {devices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.reference}
                    </option>
                  ))}
                </select>
              </label>
              <button disabled={!devices.length}>{t("assignPart")}</button>
            </form>
          )}
        </article>
      ))}
    </details>
  );
}
