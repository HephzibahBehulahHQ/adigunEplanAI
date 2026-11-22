import {
  calculatorById,
  type CalculationResult,
} from "../../../packages/engineering-core/calculations";
import { csvReport } from "../../../packages/reporting/csv";

export function calculationCsv(
  result: CalculationResult,
  title: string,
  translate: (key: string) => string,
) {
  const calculator = calculatorById(result.calculatorId);
  return csvReport([
    [translate("calcReport"), title],
    [translate("calcMethod"), result.methodReference],
    [translate("calcFormula"), result.formula],
    [translate("calcInput"), translate("calcValue"), translate("calcUnit")],
    ...calculator.inputs.map((field) => [
      translate(field.labelKey),
      result.inputs[field.key],
      result.units[field.key],
    ]),
    [translate("calcResults"), translate("calcValue"), translate("calcUnit")],
    ...result.values.map((item) => [
      translate(item.labelKey),
      item.value,
      item.unit,
    ]),
    ...result.checks.map((item) => [
      translate(item.labelKey),
      translate(item.passed ? "calcCheckMet" : "calcCheckNotMet"),
    ]),
    ...result.assumptionKeys.map((key) => [
      translate("calcAssumptions"),
      translate(key),
    ]),
    ...result.warningKeys.map((key) => [
      translate("calcWarnings"),
      translate(key),
    ]),
    ...result.evidence.map((note) => [translate("calcEvidence"), note]),
    ...result.sources.map((source) => [
      translate("calcReferences"),
      source.title,
      source.url,
      source.accessed,
    ]),
  ]);
}
