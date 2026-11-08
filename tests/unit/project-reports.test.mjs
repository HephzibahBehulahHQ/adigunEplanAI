import test from "node:test";
import assert from "node:assert/strict";
import {
  drawingIndex,
  projectBom,
  reportCsv,
} from "../../packages/electrical-model/project-reports.ts";
import { nativeProject } from "../fixtures/native-project.mjs";

test("report rows reflect the native devices and drawing dimensions", () => {
  const project = nativeProject();
  assert.deepEqual(
    projectBom(project).map(({ reference, quantity }) => [reference, quantity]),
    project.devices.map(({ reference }) => [reference, 1]),
  );
  const page = project.pages[0];
  assert.deepEqual(drawingIndex(project), [
    [project.documents[0].name, page.name, page.widthMm, page.heightMm],
  ]);
});

test("CSV quotes embedded separators and neutralizes spreadsheet formula cells", () => {
  assert.equal(
    reportCsv([["Ω", 'a,"b"', "=1+1", "  @SUM(A1)", "\ttext", 1]]),
    '\uFEFF"Ω","a,""b""","\'=1+1","\'  @SUM(A1)","\'\ttext",1\r\n',
  );
});
