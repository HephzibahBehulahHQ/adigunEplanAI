import { useState } from "react";
import type { MessageKey } from "../../../packages/localization";
import type { NativeProjects } from "./useNativeProjects";
import {
  calculatorRegistry,
  calculatorById,
  calculate,
  calculateRecord,
  calculationToRecord,
  calculationReport,
  CalculationError,
  type CalculationResult,
  type CalculationRecord,
  type CalculationIssue,
} from "../../../packages/engineering-core/calculations.ts";
import {
  convert,
  type Unit,
} from "../../../packages/engineering-core/quantities.ts";
import { csvReport } from "../../../packages/reporting/csv.ts";
import { downloadFile } from "./download";
import "./calculations.css";

type Props = { native: NativeProjects; t: (key: MessageKey) => string };
const quickCalculations = [
  ["load-current", "calcToolLoadCurrent"],
  ["voltage-drop", "calcValueVoltageDrop"],
  ["short-circuit", "calcToolShortCircuit"],
  ["cable-sizing", "calcToolCableSizing"],
  ["transformer-sizing", "calcToolTransformerSizing"],
] as const satisfies ReadonlyArray<readonly [string, MessageKey]>;
const unitsFor = (id: string) =>
  Object.fromEntries(
    calculatorById(id).inputs.map((field) => [field.key, field.units[0]]),
  );
const readableUnit = (unit: string) =>
  ({
    "1": "—",
    ohm: "Ω",
    mohm: "mΩ",
    m2: "m²",
    mm2: "mm²",
    "ohm*m": "Ω·m",
    "ohm*mm2/m": "Ω·mm²/m",
    "ohm/m": "Ω/m",
    "ohm/km": "Ω/km",
    "W/m2": "W/m²",
  })[unit] ?? unit;
const errorIssues = (error: unknown): CalculationIssue[] =>
  error instanceof CalculationError
    ? error.issues
    : [{ code: "calcErrorNumeric" }];

export function CalculationsPanel({ native, t }: Props) {
  if (!native.project) return <p>{t("noProject")}</p>;
  return <CalculationForm key={native.project.id} native={native} t={t} />;
}
function CalculationForm({ native, t }: Props) {
  const [toolId, setToolId] = useState("ohms-law");
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [units, setUnits] = useState<Record<string, Unit>>(
    unitsFor("ohms-law"),
  );
  const [evidence, setEvidence] = useState("");
  const [name, setName] = useState("");
  const [recordId, setRecordId] = useState("");
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [issues, setIssues] = useState<CalculationIssue[]>([]);
  const [saved, setSaved] = useState(false);
  const project = native.project!;
  const calculator = calculatorById(toolId);
  const tr = (key: string) => t(key as MessageKey);
  const title = name.trim() || tr(calculator.titleKey);
  const invalidate = () => {
    setResult(null);
    setIssues([]);
    setSaved(false);
  };
  const choose = (id: string) => {
    setToolId(id);
    setInputs({});
    setUnits(unitsFor(id));
    setEvidence("");
    setName("");
    setRecordId("");
    invalidate();
  };
  const record = () => {
    if (!result) throw new Error("No calculation result");
    return calculationToRecord(result, recordId || crypto.randomUUID(), title);
  };
  const run = () => {
    setSaved(false);
    const missing = calculator.inputs
      .filter((field) => !inputs[field.key]?.trim())
      .map((field) => ({ code: "calcErrorMissingInput", field: field.key }));
    if (missing.length) {
      setResult(null);
      setIssues(missing);
      return;
    }
    try {
      const values = Object.fromEntries(
        calculator.inputs.map((field) => [
          field.key,
          Number(inputs[field.key]),
        ]),
      );
      setResult(
        calculate(
          toolId,
          values,
          units,
          evidence
            .split("\n")
            .map((note) => note.trim())
            .filter(Boolean),
        ),
      );
      setIssues([]);
    } catch (error) {
      setResult(null);
      setIssues(errorIssues(error));
    }
  };
  const load = (item: CalculationRecord) => {
    try {
      const computed = calculateRecord(item);
      setToolId(item.kind);
      setInputs(
        Object.fromEntries(
          Object.entries(item.inputs).map(([key, value]) => [
            key,
            String(value),
          ]),
        ),
      );
      setUnits(item.units as Record<string, Unit>);
      setEvidence(computed.evidence.join("\n"));
      setName(item.name);
      setRecordId(item.id);
      setResult(computed);
      setIssues([]);
      setSaved(false);
    } catch (error) {
      setResult(null);
      setIssues(errorIssues(error));
      setSaved(false);
    }
  };
  const csv = () => {
    if (!result) return;
    const rows: (string | number | null)[][] = [
      [tr("calcReport"), title],
      [tr("calcMethod"), result.methodReference],
      [tr("calcFormula"), result.formula],
      [tr("calcInput"), tr("calcValue"), tr("calcUnit")],
      ...calculator.inputs.map((field) => [
        tr(field.labelKey),
        result.inputs[field.key],
        result.units[field.key],
      ]),
      [tr("calcResults"), tr("calcValue"), tr("calcUnit")],
      ...result.values.map((item) => [
        tr(item.labelKey),
        item.value,
        item.unit,
      ]),
      ...result.checks.map((item) => [
        tr(item.labelKey),
        tr(item.passed ? "calcCheckMet" : "calcCheckNotMet"),
      ]),
      ...result.assumptionKeys.map((key) => [tr("calcAssumptions"), tr(key)]),
      ...result.warningKeys.map((key) => [tr("calcWarnings"), tr(key)]),
      ...result.evidence.map((note) => [tr("calcEvidence"), note]),
      ...result.sources.map((source) => [
        tr("calcReferences"),
        source.title,
        source.url,
        source.accessed,
      ]),
    ];
    downloadFile(`${title}.csv`, csvReport(rows), "text/csv;charset=utf-8");
  };
  return (
    <section
      className="engineering-tools calculations-panel"
      aria-label={tr("calcTools")}
    >
      <div
        className="calculation-shortcuts"
        role="group"
        aria-label={tr("calcTools")}
      >
        {quickCalculations.map(([id, key]) => (
          <button
            key={id}
            type="button"
            aria-pressed={toolId === id}
            onClick={() => {
              if (toolId !== id) choose(id);
            }}
          >
            {t(key)}
          </button>
        ))}
      </div>
      <div className="calculation-command-row">
        <select
          aria-label={tr("calcTool")}
          value={toolId}
          onChange={(event) => choose(event.target.value)}
        >
          {calculatorRegistry.map((tool) => (
            <option key={tool.id} value={tool.id}>
              {tr(tool.titleKey)}
            </option>
          ))}
        </select>
        <button type="submit" form="native-calculation-form">
          {tr("calcRun")}
        </button>
      </div>
      <form
        id="native-calculation-form"
        onSubmit={(event) => {
          event.preventDefault();
          run();
        }}
        noValidate
      >
        <div className="calculation-inputs">
          {calculator.inputs.map((field) => (
            <div className="calculation-input" key={field.key}>
              <label htmlFor={`calculation-input-${field.key}`}>
                {tr(field.labelKey)}
              </label>
              <div className="calculation-quantity">
                {field.choices ? (
                  <select
                    id={`calculation-input-${field.key}`}
                    value={inputs[field.key] ?? ""}
                    onChange={(event) => {
                      setInputs({ ...inputs, [field.key]: event.target.value });
                      invalidate();
                    }}
                    required
                  >
                    <option value="">{tr("calcChoose")}</option>
                    {field.choices.map((choice) => (
                      <option key={choice.value} value={choice.value}>
                        {tr(choice.labelKey)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`calculation-input-${field.key}`}
                    type="number"
                    step="any"
                    inputMode="decimal"
                    value={inputs[field.key] ?? ""}
                    onChange={(event) => {
                      setInputs({ ...inputs, [field.key]: event.target.value });
                      invalidate();
                    }}
                    required
                    aria-invalid={issues.some(
                      (issue) => issue.field === field.key,
                    )}
                    aria-describedby={
                      issues.some((issue) => issue.field === field.key)
                        ? "calculation-errors"
                        : undefined
                    }
                  />
                )}
                {field.units.length > 1 ? (
                  <select
                    aria-label={`${tr(field.labelKey)} — ${tr("calcUnit")}`}
                    value={units[field.key]}
                    onChange={(event) => {
                      const next = event.target.value as Unit;
                      try {
                        if (inputs[field.key]?.trim())
                          setInputs({
                            ...inputs,
                            [field.key]: String(
                              convert(
                                Number(inputs[field.key]),
                                units[field.key],
                                next,
                              ),
                            ),
                          });
                        setUnits({ ...units, [field.key]: next });
                        invalidate();
                      } catch {
                        setIssues([
                          { code: "calcErrorNumeric", field: field.key },
                        ]);
                        setResult(null);
                      }
                    }}
                  >
                    {field.units.map((unit) => (
                      <option value={unit} key={unit}>
                        {readableUnit(unit)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span
                    className="calculation-unit"
                    aria-label={tr("calcUnit")}
                  >
                    {readableUnit(field.units[0])}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="calculation-hint">{tr("calcUnitConversionHint")}</p>
        <label>
          {tr("calcEvidence")}
          {calculator.evidenceRequired ? ` (${tr("calcRequired")})` : ""}
          <textarea
            value={evidence}
            rows={3}
            maxLength={12000}
            onChange={(event) => {
              setEvidence(event.target.value);
              invalidate();
            }}
            placeholder={tr("calcEvidenceHint")}
          />
        </label>
        <details className="calculation-method" open>
          <summary>{tr("calcMethodAndAssumptions")}</summary>
          <p>{tr("calcScope")}</p>
          <p>
            <code>{calculator.formula}</code>
          </p>
          <ul>
            {calculator.assumptionKeys.map((key) => (
              <li key={key}>{tr(key)}</li>
            ))}
          </ul>
        </details>
      </form>
      {issues.length > 0 && (
        <div role="alert" id="calculation-errors">
          <ul>
            {issues.map((issue, index) => (
              <li key={`${issue.code}-${index}`}>
                {issue.field
                  ? `${tr(calculator.inputs.find((field) => field.key === issue.field)?.labelKey ?? issue.field)}: `
                  : ""}
                {tr(issue.code)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {result && (
        <section
          className="calculation-result"
          aria-label={tr("calcResults")}
          aria-live="polite"
        >
          <h3>{tr("calcResults")}</h3>
          <p>
            {tr(
              result.classification === "estimate"
                ? "calcEstimate"
                : "calcLimitedCheck",
            )}
          </p>
          <dl className="calculation-values">
            {result.values.map((item) => (
              <div key={item.key}>
                <dt>{tr(item.labelKey)}</dt>
                <dd>
                  <output data-calculation-value={item.key}>
                    {Number(item.value.toPrecision(10))}
                  </output>{" "}
                  {readableUnit(item.unit)}
                </dd>
              </div>
            ))}
          </dl>
          {result.checks.length > 0 && (
            <ul>
              {result.checks.map((item) => (
                <li
                  key={item.key}
                  className={
                    item.passed
                      ? "calculation-check-met"
                      : "calculation-check-failed"
                  }
                >
                  {tr(item.labelKey)}:{" "}
                  {tr(item.passed ? "calcCheckMet" : "calcCheckNotMet")}
                </li>
              ))}
            </ul>
          )}
          <h4>{tr("calcWarnings")}</h4>
          <ul>
            {result.warningKeys.map((key) => (
              <li key={key}>{tr(key)}</li>
            ))}
          </ul>
          <p>
            <strong>{tr("calcMethod")}:</strong>{" "}
            <code>{result.methodReference}</code>
          </p>
          <h4>{tr("calcReferences")}</h4>
          <ul>
            {result.sources.map((source) => (
              <li key={source.id}>
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.title}
                </a>{" "}
                · {source.accessed}
              </li>
            ))}
          </ul>
          <label>
            {tr("calcName")}
            <input
              value={name}
              placeholder={tr(calculator.titleKey)}
              maxLength={160}
              onChange={(event) => {
                setName(event.target.value);
                setSaved(false);
              }}
            />
          </label>
          <div className="calculation-actions">
            <button
              onClick={() => {
                try {
                  const savedRecord = record();
                  const ok = native.update((draft) => {
                    const found = draft.calculations.findIndex(
                      (item) => item.id === savedRecord.id,
                    );
                    if (found >= 0) draft.calculations[found] = savedRecord;
                    else draft.calculations.push(savedRecord);
                    return draft;
                  });
                  if (ok) {
                    setRecordId(savedRecord.id);
                    setSaved(true);
                    setIssues([]);
                  } else setIssues([{ code: "calcErrorSave" }]);
                } catch (error) {
                  setIssues(errorIssues(error));
                }
              }}
            >
              {tr(recordId ? "calcUpdate" : "calcSave")}
            </button>
            <button
              onClick={() => {
                try {
                  downloadFile(
                    `${title}.calculation.json`,
                    JSON.stringify(calculationReport(record()), null, 2),
                    "application/json",
                  );
                } catch (error) {
                  setIssues(errorIssues(error));
                }
              }}
            >
              {tr("calcExportJson")}
            </button>
            <button onClick={csv}>{tr("calcExportCsv")}</button>
          </div>
          {saved && native.saved && <p role="status">{tr("calcSaved")}</p>}
        </section>
      )}
      <section aria-label={tr("calcSavedRecords")}>
        <h3>
          {tr("calcSavedRecords")} ({project.calculations.length})
        </h3>
        {project.calculations.length === 0 ? (
          <p>{tr("calcNoneSaved")}</p>
        ) : (
          <ul className="calculation-saved">
            {project.calculations.map((item) => (
              <li key={item.id}>
                <span>{item.name}</span>
                <button
                  onClick={() => load(item)}
                  aria-label={`${tr("calcOpen")}: ${item.name}`}
                >
                  {tr("calcOpen")}
                </button>
                <button
                  onClick={() => {
                    if (
                      native.update((draft) => {
                        draft.calculations = draft.calculations.filter(
                          (record) => record.id !== item.id,
                        );
                        return draft;
                      })
                    ) {
                      if (recordId === item.id) {
                        setRecordId("");
                        setSaved(false);
                      }
                    } else setIssues([{ code: "calcErrorSave" }]);
                  }}
                  aria-label={`${tr("calcDelete")}: ${item.name}`}
                >
                  {tr("calcDelete")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
