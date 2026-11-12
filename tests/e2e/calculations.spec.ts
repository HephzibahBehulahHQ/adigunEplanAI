import { test, expect } from "@playwright/test";
import { openProjectPanel, openWorkbenchPanel } from "./workbench.ts";
import { reloadAndReopenProject } from "../fixtures/reopen-project";
import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { createProject } from "../../packages/electrical-model/project.ts";
import {
  calculate,
  calculationToRecord,
} from "../../packages/engineering-core/calculations.ts";
const dictionaries = Object.fromEntries(
  ["en", "de", "yo", "pcm"].map((language) => [
    language,
    JSON.parse(
      readFileSync(
        new URL(
          `../../packages/localization/${language}.json`,
          import.meta.url,
        ),
        "utf8",
      ),
    ) as Record<string, string>,
  ]),
);

test("calculation inputs, unit conversion, native replay and full report exports agree", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1365, height: 1000 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByLabel("Import project", { exact: true }).setInputFiles({
    name: "calculation-project.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(createProject("Calculation project"))),
  });
  await openWorkbenchPanel(page, "calculations");
  const tools = page.getByRole("region", {
    name: "Engineering calculations",
    exact: true,
  });
  await expect(tools).toBeVisible();
  const calculationBody = page.locator(
    '[data-panel="calculations"] > .panel-body',
  );
  const calculateButton = tools.getByRole("button", {
    name: "Calculate",
    exact: true,
  });
  const actionBounds = (await calculateButton.boundingBox())!;
  const dockBounds = (await calculationBody.boundingBox())!;
  expect(actionBounds.y + actionBounds.height).toBeLessThanOrEqual(
    dockBounds.y + dockBounds.height,
  );
  expect(
    await calculationBody.evaluate((body) => body.clientHeight),
  ).toBeGreaterThanOrEqual(120);
  expect(
    await calculationBody.evaluate((body) => getComputedStyle(body).overflowY),
  ).toBe("auto");
  expect(
    await page.evaluate(
      () =>
        document
          .querySelector('[data-panel="calculations"]')!
          .getBoundingClientRect().bottom <=
        document.querySelector(".status-bar")!.getBoundingClientRect().top + 1,
    ),
  ).toBe(true);
  await expect(
    tools.getByLabel("Calculation method", { exact: true }).locator("option"),
  ).toHaveCount(26);
  const shortcuts = tools.getByRole("group", {
    name: "Engineering calculations",
    exact: true,
  });
  const load = shortcuts.getByRole("button", {
    name: "Load",
    exact: true,
  });
  await load.click();
  await expect(load).toHaveAttribute("aria-pressed", "true");
  await expect(
    tools.getByLabel("Calculation method", { exact: true }),
  ).toHaveValue("apparent-load-current");
  await tools
    .getByLabel("Calculation method", { exact: true })
    .selectOption("ohms-law");
  await expect(load).toHaveAttribute("aria-pressed", "false");
  await tools.getByRole("button", { name: "Calculate", exact: true }).click();
  await expect(tools.getByRole("alert")).toContainText("Enter a value.");
  await tools.locator("#calculation-input-voltage").fill("12");
  await tools.locator("#calculation-input-resistance").fill("4");
  await tools
    .getByLabel("Voltage (line-to-line for 3φ) — Unit", { exact: true })
    .selectOption("mV");
  await expect(tools.locator("#calculation-input-voltage")).toHaveValue(
    "12000",
  );
  await tools.getByRole("button", { name: "Calculate", exact: true }).click();
  await expect(
    tools.locator(
      '.calculation-dock-summary [data-calculation-value="current"]',
    ),
  ).toHaveText("3");
  await expect(
    tools.locator(
      '.calculation-dock-summary [data-calculation-value="activePower"]',
    ),
  ).toHaveText("36");
  await tools
    .getByLabel("Calculation name", { exact: true })
    .fill("Reference resistor");
  await tools
    .getByRole("button", { name: "Save calculation", exact: true })
    .click();
  await expect(tools.locator('p[role="status"]')).toHaveText(
    "Calculation saved in the native project.",
  );
  const stored = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("adiguneplanai.projects.v1")!).projects[0]
        .calculations[0],
  );
  expect(stored.inputs.voltage).toBe(12000);
  expect(stored.units.voltage).toBe("mV");
  expect(stored.methodReference).toBe(
    "adiguneplanai:calculation:ohms-law:1.0.0",
  );
  await reloadAndReopenProject(page);
  await tools
    .getByRole("button", {
      name: "Open calculation: Reference resistor",
      exact: true,
    })
    .click();
  await expect(
    tools.locator(
      '.calculation-dock-summary [data-calculation-value="current"]',
    ),
  ).toHaveText("3");
  const jsonEvent = page.waitForEvent("download");
  await tools
    .getByRole("button", { name: "Download calculation JSON", exact: true })
    .click();
  const report = JSON.parse(
    await readFile((await (await jsonEvent).path())!, "utf8"),
  );
  expect(report.schema).toBe("adiguneplanai-calculation-report/1");
  expect(report.record).toEqual(stored);
  expect(
    report.result.values.find(
      (value: { key: string }) => value.key === "current",
    ).value,
  ).toBe(3);
  expect(report.result.warningKeys).toContain("calcWarningEstimate");
  expect(report.result.sources[0].url).toContain("fluke.com");
  const csvEvent = page.waitForEvent("download");
  await tools
    .getByRole("button", {
      name: "Download calculation report CSV",
      exact: true,
    })
    .click();
  const csv = await readFile((await (await csvEvent).path())!, "utf8");
  expect(csv).toContain('"Current","3","A"');
  expect(csv).toContain(
    '"Versioned method","adiguneplanai:calculation:ohms-law:1.0.0"',
  );
  expect(csv).toContain("not a verified engineering design");
  await tools.locator("#calculation-input-resistance").fill("6");
  await expect(tools.locator('[data-calculation-value="current"]')).toHaveCount(
    0,
  );
  await tools.getByRole("button", { name: "Calculate", exact: true }).click();
  await tools
    .getByRole("button", { name: "Update saved calculation", exact: true })
    .click();
  await expect(
    tools.locator(
      '.calculation-dock-summary [data-calculation-value="current"]',
    ),
  ).toHaveText("2");
  const count = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("adiguneplanai.projects.v1")!).projects[0]
        .calculations.length,
  );
  expect(count).toBe(1);
  await tools
    .getByRole("button", {
      name: "Delete calculation: Reference resistor",
      exact: true,
    })
    .click();
  await expect(
    tools.getByText("No calculations saved yet.", { exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("calculation panel rejects missing engineering evidence and unsupported record versions", async ({
  page,
}) => {
  const project = createProject("Audited calculations");
  const legacy = calculationToRecord(
    calculate(
      "ohms-law",
      { voltage: 12, resistance: 4 },
      { voltage: "V", resistance: "ohm" },
    ),
    "legacy-calculation",
    "Old method",
  );
  legacy.methodReference = "adiguneplanai:calculation:ohms-law:0.9.0";
  project.calculations.push(legacy);
  await page.goto("/");
  await page.getByLabel("Import project", { exact: true }).setInputFiles({
    name: "audit.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(project)),
  });
  await openWorkbenchPanel(page, "calculations");
  const tools = page.getByRole("region", {
    name: "Engineering calculations",
    exact: true,
  });
  await tools
    .getByRole("button", { name: "Open calculation: Old method", exact: true })
    .click();
  await expect(tools.getByRole("alert")).toContainText(
    "saved method version is unsupported",
  );
  await tools
    .getByLabel("Calculation method", { exact: true })
    .selectOption("earthing");
  await tools.locator("#calculation-input-soilResistivity").fill("100");
  await tools.locator("#calculation-input-length").fill("50");
  await tools.getByRole("button", { name: "Calculate", exact: true }).click();
  await expect(tools.getByRole("alert")).toContainText(
    "Add source and condition notes",
  );
  await tools
    .getByRole("textbox", { name: /Sources and operating conditions/ })
    .fill(
      "Synthetic educational site model, homogeneous soil, no field certification.",
    );
  await tools.getByRole("button", { name: "Calculate", exact: true }).click();
  await expect(
    tools.locator(
      '.calculation-dock-summary [data-calculation-value="earthResistance"]',
    ),
  ).toHaveText("4");
  await expect(
    tools.getByRole("region", { name: "Calculation results", exact: true }),
  ).toContainText("not a verified engineering design");
});

for (const language of ["en", "de", "yo", "pcm"] as const) {
  test(`calculation form and results remain usable at 390px in ${language}`, async ({
    page,
  }) => {
    const t = dictionaries[language];
    const project = createProject("Mobile calculations");
    const result = calculate(
      "ohms-law",
      { voltage: 12, resistance: 4 },
      { voltage: "V", resistance: "ohm" },
    );
    project.calculations.push(
      calculationToRecord(result, "mobile-calc", "Mobile reference"),
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(
      ({ language, project }) => {
        localStorage.setItem(
          "adiguneplanai.interface.v1",
          JSON.stringify({ language }),
        );
        localStorage.setItem(
          "adiguneplanai.projects.v1",
          JSON.stringify({
            version: 1,
            projects: [project],
            activeProjectId: project.id,
          }),
        );
      },
      { language, project },
    );
    await page.goto("/");
    await expect(page.locator(".empty-workspace")).toBeVisible();
    await openProjectPanel(page, t.navigatorTabProject);
    await page.getByTestId("project-picker").selectOption(project.id);
    await openWorkbenchPanel(page, "calculations", t.openCalculations);
    const tools = page.getByRole("region", {
      name: t.calcTools,
      exact: true,
    });
    await expect(
      tools.getByRole("combobox", {
        name: t.calcTool,
        exact: true,
      }),
    ).toBeVisible();
    await tools
      .getByRole("button", {
        name: `${t.calcOpen}: Mobile reference`,
        exact: true,
      })
      .click();
    await expect(
      tools.locator(
        '.calculation-dock-summary [data-calculation-value="current"]',
      ),
    ).toHaveText("3");
    await tools.scrollIntoViewIfNeeded();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await tools.evaluate((panel) =>
        Array.from(panel.querySelectorAll("input,select,textarea,button"))
          .filter((element) => !element.closest(".calculation-shortcuts"))
          .every((element) => {
            const rect = element.getBoundingClientRect();
            return (
              rect.width > 0 && rect.left >= 0 && rect.right <= innerWidth + 1
            );
          }),
      ),
    ).toBe(true);
    const shortcuts = tools.locator(".calculation-shortcuts");
    const lastShortcut = shortcuts.getByRole("button").last();
    await lastShortcut.focus();
    await expect(lastShortcut).toBeFocused();
    await expect(lastShortcut).toBeInViewport();
  });
}
