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
import {
  catalogPreferencesKey,
  emptyCatalogPreferences,
  parseCatalogPreferences,
  toggleCatalogFavorite,
  recordRecentCatalogPart,
  type CatalogPreferences,
} from "../../../packages/component-library/preferences.ts";

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
  const [minimumVoltage, setMinimumVoltage] = useState("");
  const [minimumCurrent, setMinimumCurrent] = useState("");
  const [view, setView] = useState("all");
  const [preferences, setPreferences] = useState(() => {
    try {
      return {
        value: parseCatalogPreferences(
          localStorage.getItem(catalogPreferencesKey),
        ),
        corrupt: false,
        writeFailed: false,
      };
    } catch {
      return {
        value: emptyCatalogPreferences(),
        corrupt: true,
        writeFailed: false,
      };
    }
  });
  function savePreferences(value: CatalogPreferences) {
    try {
      localStorage.setItem(catalogPreferencesKey, JSON.stringify(value));
      setPreferences({ value, corrupt: false, writeFailed: false });
    } catch {
      setPreferences({ value, corrupt: false, writeFailed: true });
    }
  }
  const [comparison, setComparison] = useState<string[]>([]);
  const compared = catalog.filter((part) => comparison.includes(part.id));
  const results = searchCatalog(query, category, manufacturer, {
    minimumVoltageV: minimumVoltage === "" ? undefined : Number(minimumVoltage),
    minimumCurrentA: minimumCurrent === "" ? undefined : Number(minimumCurrent),
  }).filter((part) =>
    view === "favorites"
      ? preferences.value.favoriteIds.includes(part.id)
      : view === "recent"
        ? preferences.value.recentIds.includes(part.id)
        : true,
  );
  if (view === "recent")
    results.sort(
      (a, b) =>
        preferences.value.recentIds.indexOf(a.id) -
        preferences.value.recentIds.indexOf(b.id),
    );
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
      <fieldset>
        <legend>{t("propertyFilters")}</legend>
        <p>{t("propertyFiltersHint")}</p>
        <label>
          {t("minimumVoltage")}
          <input
            type="number"
            min="0"
            step="any"
            value={minimumVoltage}
            onChange={(e) => setMinimumVoltage(e.target.value)}
          />
        </label>
        <label>
          {t("minimumCurrent")}
          <input
            type="number"
            min="0"
            step="any"
            value={minimumCurrent}
            onChange={(e) => setMinimumCurrent(e.target.value)}
          />
        </label>
      </fieldset>
      <label>
        {t("catalogView")}
        <select
          aria-label={t("catalogView")}
          value={view}
          onChange={(e) => setView(e.target.value)}
        >
          <option value="all">{t("all")}</option>
          <option value="favorites">{t("catalogFavorites")}</option>
          <option value="recent">{t("catalogRecent")}</option>
        </select>
      </label>
      {preferences.corrupt && (
        <div role="alert">
          <p>{t("catalogPreferencesCorrupt")}</p>
          <button onClick={() => savePreferences(emptyCatalogPreferences())}>
            {t("resetCatalogPreferences")}
          </button>
        </div>
      )}
      {preferences.writeFailed && (
        <p role="alert">{t("catalogPreferencesUnsaved")}</p>
      )}
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
              checked={preferences.value.favoriteIds.includes(part.id)}
              disabled={preferences.corrupt}
              onChange={() =>
                savePreferences(
                  toggleCatalogFavorite(preferences.value, part.id),
                )
              }
            />
            {t("catalogFavorite")}: {part.manufacturer} {part.partNumber}
          </label>
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
                const assigned = native.update((p) =>
                  assignCatalogPart(p, id, part.id),
                );
                if (assigned && !preferences.corrupt)
                  savePreferences(
                    recordRecentCatalogPart(preferences.value, part.id),
                  );
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
