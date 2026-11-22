import {
  calculate,
  calculateRecord,
  calculationToRecord,
  CalculationError,
  calculatorById,
  calculatorRegistry,
  type CalculationResult,
  type CalculationRecord,
} from "../../../packages/engineering-core/calculations";
import {
  convert,
  type Unit,
} from "../../../packages/engineering-core/quantities";
import messages from "../../../packages/localization/en.json";
import { downloadFile } from "./download";
import { calculationCsv } from "./calculationCsv";

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

function renderResult(
  host: HTMLElement,
  result: CalculationResult,
  title: () => string,
) {
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
  const csv = addText(host, "button", message("calcExportCsv"));
  csv.setAttribute("type", "button");
  csv.className = "command-item";
  csv.addEventListener("click", () => {
    const reportTitle = title();
    downloadFile(
      `${reportTitle}.csv`,
      calculationCsv(result, reportTitle, message),
      "text/csv;charset=utf-8",
    );
  });
}

type ProjectCalculations = {
  records: CalculationRecord[];
  save: (record: CalculationRecord) => boolean;
};

export function mountCompactCalculations(
  host: HTMLElement,
  project?: ProjectCalculations,
) {
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
  const savedRecords = document.createElement("select");
  const name = document.createElement("input");
  name.maxLength = 160;
  let savedId: string | undefined;
  const selectedUnits = new Map<string, Unit>();
  form.append(fields, evidenceRow, run);
  host.replaceChildren(field(message("calcTool"), method), form, result);
  if (project) host.prepend(field(message("calcSavedRecords"), savedRecords));

  function refreshRecords() {
    savedRecords.replaceChildren(new Option(message("calcChoose"), ""));
    for (const record of project?.records ?? [])
      savedRecords.add(new Option(record.name, record.id));
    savedRecords.value = savedId ?? "";
  }

  function showResult(calculation: CalculationResult) {
    renderResult(
      result,
      calculation,
      () => name.value.trim() || message(calculation.titleKey),
    );
    if (!project) return;
    result.append(field(message("calcName"), name));
    const save = addText(
      result,
      "button",
      message(savedId ? "calcUpdate" : "calcSave"),
    );
    save.className = "command-item";
    save.addEventListener("click", () => {
      const record = calculationToRecord(
        calculation,
        savedId ?? crypto.randomUUID(),
        name.value.trim() || message(calculation.titleKey),
      );
      if (!project.save(record)) return;
      savedId = record.id;
      name.value = record.name;
      refreshRecords();
      save.textContent = message("calcUpdate");
    });
  }

  function populate() {
    const calculator = calculatorById(method.value);
    fields.replaceChildren();
    selectedUnits.clear();
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
      selectedUnits.set(input.key, input.units[0]);
      unit.addEventListener("change", () => {
        if (
          value instanceof HTMLInputElement &&
          Number.isFinite(value.valueAsNumber)
        ) {
          try {
            value.value = String(
              convert(
                value.valueAsNumber,
                selectedUnits.get(input.key) ?? input.units[0],
                unit.value as Unit,
              ),
            );
          } catch {
            value.value = "";
          }
        }
        selectedUnits.set(input.key, unit.value as Unit);
      });
      if (input.units.length > 1)
        fields.append(field(`${label} · ${message("calcUnit")}`, unit));
    }
  }
  method.addEventListener("change", () => {
    savedId = undefined;
    name.value = "";
    refreshRecords();
    populate();
  });
  savedRecords.addEventListener("change", () => {
    const record = project?.records.find(
      (item) => item.id === savedRecords.value,
    );
    savedId = undefined;
    name.value = "";
    if (!record) {
      populate();
      return;
    }
    try {
      const calculation = calculateRecord(record);
      method.value = record.kind;
      populate();
      savedId = record.id;
      name.value = record.name;
      evidence.value = calculation.evidence.join("\n");
      for (const input of calculatorById(record.kind).inputs) {
        const value = form.elements.namedItem(input.key) as
          HTMLInputElement | HTMLSelectElement;
        value.value = String(calculation.inputs[input.key]);
        const unit = form.elements.namedItem(
          `${input.key}-unit`,
        ) as HTMLSelectElement | null;
        if (unit) {
          unit.value = calculation.units[input.key];
          selectedUnits.set(input.key, unit.value as Unit);
        }
      }
      showResult(calculation);
    } catch (error) {
      populate();
      addText(
        result,
        "p",
        message(
          error instanceof CalculationError
            ? (error.issues[0]?.code ?? "calcErrorRecord")
            : "calcErrorRecord",
        ),
      );
    }
  });
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
      showResult(
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
  refreshRecords();
}
