import { useState } from "react";
import { CustomSymbols } from "./CustomSymbols";
import { EngineeringSymbols } from "./EngineeringSymbols";
import {
  catalog,
  searchCatalog,
  assignCatalogPart,
  compatibleCatalogDevice,
  type CatalogPart,
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
  const [comparison, setComparison] = useState<string[]>([]);
  const compared = catalog.filter((part) => comparison.includes(part.id));
  const results = searchCatalog(query, category, manufacturer);
  const project = native.project;
  const devicesFor = (part: CatalogPart) =>
    project?.devices.filter((device) =>
      compatibleCatalogDevice(project, device.id, part),
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
              {t(value === "switching" ? "category-switching" : "connections")}
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
      <section aria-label={t("compareParts")}>
        <h3>{t("compareParts")}</h3>
        <p>{t("comparisonHint")}</p>
        {compared.length >= 2 && (
          <div style={{ maxWidth: "100%", overflowX: "auto" }}>
            <table>
              <caption>{t("compareParts")}</caption>
              <thead>
                <tr>
                  <th scope="col">{t("property")}</th>
                  {compared.map((part) => (
                    <th scope="col" key={part.id}>
                      {part.manufacturer} {part.partNumber}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ["nominalVoltage", "nominalVoltageV", "V"],
                    ["nominalCurrent", "nominalCurrentA", "A"],
                    ["ratedCrossSection", "ratedCrossSectionMm2", "mm²"],
                    ["connectionMethod", "connectionMethod", ""],
                    ["contactArrangement", "contactArrangement", ""],
                  ] as const
                ).map(([label, field, unit]) => (
                  <tr key={field}>
                    <th scope="row">{t(label)}</th>
                    {compared.map((part) => (
                      <td key={part.id}>
                        {part.ratings[field] === undefined
                          ? t("notDeclared")
                          : `${part.ratings[field]}${unit ? ` ${unit}` : ""}`}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th scope="row">{t("connections")}</th>
                  {compared.map((part) => (
                    <td key={part.id}>{part.mapping.connections}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">{t("reviewedOn")}</th>
                  {compared.map((part) => (
                    <td key={part.id}>{part.reviewedOn}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">{t("manufacturerSource")}</th>
                  {compared.map((part) => (
                    <td key={part.id}>
                      <a href={part.sourceUrl} target="_blank" rel="noreferrer">
                        {part.partNumber}
                      </a>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>
      {results.map((part) => (
        <article
          key={part.id}
          aria-label={`${part.manufacturer} ${part.partNumber}`}
        >
          <h3>
            {part.name} · {part.partNumber}
          </h3>
          <p>{part.manufacturer}</p>
          <label>
            <input
              type="checkbox"
              checked={comparison.includes(part.id)}
              disabled={comparison.length >= 4 && !comparison.includes(part.id)}
              onChange={(e) =>
                setComparison((current) =>
                  e.target.checked
                    ? [...current, part.id]
                    : current.filter((id) => id !== part.id),
                )
              }
            />
            {t("selectForComparison")}: {part.manufacturer} {part.partNumber}
          </label>
          <a href={part.sourceUrl} target="_blank" rel="noreferrer">
            {t("manufacturerSource")}
          </a>
          <p>
            {t("reviewedOn")}: {part.reviewedOn}
          </p>
          <dl>
            {part.ratings.contactArrangement !== undefined && (
              <>
                <dt>{t("contactArrangement")}</dt>
                <dd>{part.ratings.contactArrangement}</dd>
              </>
            )}
            <dt>{t("connectionMethod")}</dt>
            <dd>{part.ratings.connectionMethod ?? t("notDeclared")}</dd>
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
            <dd>
              {part.ratings.ratedCrossSectionMm2 === undefined
                ? t("notDeclared")
                : `${part.ratings.ratedCrossSectionMm2} mm²`}
            </dd>
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
                  {devicesFor(part).map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.reference}
                    </option>
                  ))}
                </select>
              </label>
              <button disabled={!devicesFor(part).length}>
                {t("assignPart")}
              </button>
            </form>
          )}
        </article>
      ))}
    </details>
  );
}
