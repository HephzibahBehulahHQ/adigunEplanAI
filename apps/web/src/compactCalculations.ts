import {
  calculate,
  CalculationError,
  calculatorById,
  calculatorRegistry,
  type CalculationResult,
} from "../../../packages/engineering-core/calculations";
import {
  convert,
  type Unit,
} from "../../../packages/engineering-core/quantities";
import messages from "../../../packages/localization/en.json";
import { downloadFile } from "./download";

const message = (key: string) =>
  (messages as Record<string, string>)[key] ?? key;

function field(label: string, input: HTMLElement) {
  const row = document.createElement("label");
  row.className = "property-row";
  const caption = document.createElement("span");
  caption.textContent = label;
  row.append(caption, input);
  return row;
}

function addText(parent: HTMLElement, tag: string, text: string) {
  const element = document.createElement(tag);
  element.textContent = text;
  parent.append(element);
  return element;
}

function renderResult(host: HTMLElement, result: CalculationResult) {
  host.replaceChildren();
  addText(
    host,
    "strong",
    message(
      result.classification === "estimate"
        ? "calcEstimate"
        : "calcLimitedCheck",
    ),
  );
  for (const value of result.values) {
    addText(
      host,
      "p",
      `${message(value.labelKey)}: ${Number(value.value.toPrecision(10))} ${value.unit === "1" ? "" : value.unit}`.trim(),
    );
  }
  for (const check of result.checks) {
    addText(
      host,
      "p",
      `${message(check.labelKey)}: ${message(check.passed ? "calcCheckMet" : "calcCheckNotMet")}`,
    );
  }
  const details = document.createElement("details");
  addText(details, "summary", message("calcMethodAndAssumptions"));
  addText(details, "p", result.methodReference);
  addText(details, "p", result.formula);
  const assumptions = document.createElement("ul");
  for (const key of [...result.assumptionKeys, ...result.warningKeys]) {
    addText(assumptions, "li", message(key));
  }
  details.append(assumptions);
  for (const source of result.sources) {
    const link = document.createElement("a");
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = source.title;
    addText(details, "p", "").append(link);
  }
  host.append(details);
  const download = addText(host, "button", message("calcExportJson"));
  download.setAttribute("type", "button");
  download.className = "command-item";
  download.addEventListener("click", () =>
    downloadFile(
      `${result.calculatorId}.json`,
      JSON.stringify(result, null, 2),
      "application/json",
    ),
  );
}

export function mountCompactCalculations(host: HTMLElement) {
  const method = document.createElement("select");
  for (const calculator of calculatorRegistry) {
    method.add(new Option(message(calculator.titleKey), calculator.id));
  }
  const form = document.createElement("form");
  const fields = document.createElement("div");
  const evidence = document.createElement("textarea");
  evidence.rows = 3;
  const evidenceRow = field(message("calcEvidence"), evidence);
  const run = document.createElement("button");
  run.type = "submit";
  run.className = "command-item";
  run.textContent = message("calcRun");
  const result = document.createElement("section");
  result.setAttribute("aria-label", message("calcResults"));
  result.setAttribute("aria-live", "polite");
  form.append(fields, evidenceRow, run);
  host.replaceChildren(field(message("calcTool"), method), form, result);

  function populate() {
    const calculator = calculatorById(method.value);
    fields.replaceChildren();
    result.replaceChildren();
    evidence.value = "";
    evidence.required = Boolean(calculator.evidenceRequired);
    evidence.minLength = calculator.evidenceRequired ? 8 : 0;
    for (const input of calculator.inputs) {
      const label = message(input.labelKey);
      const value = input.choices
        ? document.createElement("select")
        : document.createElement("input");
      value.name = input.key;
      value.required = true;
      if (value instanceof HTMLSelectElement) {
        value.add(new Option(message("calcChoose"), ""));
        for (const choice of input.choices ?? []) {
          value.add(new Option(message(choice.labelKey), String(choice.value)));
        }
      } else {
        value.type = "number";
        value.step = "any";
      }
      fields.append(field(label, value));
      const unit = document.createElement("select");
      unit.name = `${input.key}-unit`;
      for (const option of input.units) unit.add(new Option(option, option));
      let previousUnit = input.units[0];
      unit.addEventListener("change", () => {
        if (
          value instanceof HTMLInputElement &&
          Number.isFinite(value.valueAsNumber)
        ) {
          try {
            value.value = String(
              convert(value.valueAsNumber, previousUnit, unit.value as Unit),
            );
          } catch {
            value.value = "";
          }
        }
        previousUnit = unit.value as Unit;
      });
      if (input.units.length > 1)
        fields.append(field(`${label} · ${message("calcUnit")}`, unit));
    }
  }
  method.addEventListener("change", populate);
  form.addEventListener("input", () => result.replaceChildren());
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const calculator = calculatorById(method.value);
    const values = new FormData(form);
    const inputs = Object.fromEntries(
      calculator.inputs.map((input) => [
        input.key,
        Number(values.get(input.key)),
      ]),
    );
    const units = Object.fromEntries(
      calculator.inputs.map((input) => [
        input.key,
        String(values.get(`${input.key}-unit`) ?? input.units[0]),
      ]),
    );
    try {
      renderResult(
        result,
        calculate(
          calculator.id,
          inputs,
          units,
          evidence.value
            .split(/\r?\n/)
            .map((note) => note.trim())
            .filter(Boolean),
        ),
      );
    } catch (error) {
      result.replaceChildren();
      const issues =
        error instanceof CalculationError
          ? error.issues
          : [{ code: "calcErrorNumeric" }];
      for (const issue of issues) {
        const input = calculator.inputs.find(
          (field) => "field" in issue && field.key === issue.field,
        );
        addText(
          result,
          "p",
          (input ? message(input.labelKey) + ": " : "") + message(issue.code),
        );
      }
    }
  });
  populate();
}
