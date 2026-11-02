import { useState } from "react";
import { SymbolArtwork } from "./SymbolArtwork";
import {
  engineeringSymbols,
  installSymbol,
  searchSymbols,
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
  const matches = searchSymbols(query, category, (key) => t(key as MessageKey));
  return (
    <>
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
            {t(symbol.id as MessageKey)} ·{" "}
            {"connectionClass" in symbol &&
            symbol.connectionClass === "mechanical"
              ? t("mechanicalSymbol")
              : `${symbol.pins.length} ${t("electricalPins")}`}
            <svg
              data-library-preview={symbol.id}
              role="img"
              aria-label={t(symbol.id as MessageKey)}
              viewBox={`${-symbol.width / 2 - 30} ${-symbol.height / 2 - 16} ${symbol.width + 60} ${symbol.height + 32}`}
              width="220"
              style={{ display: "block", maxWidth: "100%", height: "auto" }}
            >
              <title>{t(symbol.id as MessageKey)}</title>
              <g stroke="currentColor" fill="none" strokeWidth={0.5}>
                <SymbolArtwork artwork={symbol.artwork} />
              </g>
              {symbol.pins.map((pin) => (
                <g key={pin.id}>
                  <circle
                    cx={pin.position.x}
                    cy={pin.position.y}
                    r={0.8}
                    fill="currentColor"
                  />
                  <text
                    x={
                      pin.position.x +
                      (pin.position.x < 0 ? -2 : pin.position.x > 0 ? 2 : 0)
                    }
                    y={
                      pin.position.y +
                      (pin.position.x === 0 ? (pin.position.y < 0 ? -3 : 5) : 1)
                    }
                    textAnchor={
                      pin.position.x < 0
                        ? "end"
                        : pin.position.x > 0
                          ? "start"
                          : "middle"
                    }
                    fontSize={3}
                    fill="currentColor"
                  >
                    {pin.id}
                  </text>
                </g>
              ))}
            </svg>
            <button
              disabled={!native.project}
              onClick={() => native.update((p) => installSymbol(p, symbol.id))}
            >
              {t("addSymbol")}: {t(symbol.id as MessageKey)}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
