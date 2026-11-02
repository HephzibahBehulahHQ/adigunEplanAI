import { useState } from "react";
import {
  engineeringSymbols,
  installSymbol,
} from "../../../packages/component-library/symbols.ts";
import type { NativeProjects } from "./useNativeProjects";
import type { MessageKey } from "../../../packages/localization";

export function EngineeringSymbols({
  native,
  t,
}: {
  native: NativeProjects;
  t: (key: MessageKey) => string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const words = query
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const matches = engineeringSymbols.filter(
    (symbol) =>
      (!category || symbol.category === category) &&
      words.every((word) =>
        `${symbol.name} ${t(symbol.id as MessageKey)} ${symbol.category}`
          .normalize("NFKC")
          .toLowerCase()
          .includes(word),
      ),
  );
  return (
    <details>
      <summary>{t("engineeringSymbols")}</summary>
      <p>{t("originalSymbolsScope")}</p>
      <label>
        {t("searchSymbols")}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          maxLength={160}
        />
      </label>
      <select
        aria-label={t("symbolCategory")}
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="">{t("all")}</option>
        {[...new Set(engineeringSymbols.map((s) => s.category))].map(
          (value) => (
            <option key={value} value={value}>
              {t(("category-" + value) as MessageKey)}
            </option>
          ),
        )}
      </select>
      <ul>
        {matches.map((symbol) => (
          <li key={symbol.id}>
            {t(symbol.id as MessageKey)} · {symbol.pins.length}{" "}
            {t("electricalPins")}
            <button
              disabled={!native.project}
              onClick={() => native.update((p) => installSymbol(p, symbol.id))}
            >
              {t("addSymbol")}: {t(symbol.id as MessageKey)}
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
