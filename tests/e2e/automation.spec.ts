import { reloadAndReopenProject } from "../fixtures/reopen-project";
import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("PLC I/O documentation creates native interfaces and survives edits, undo and export/reload", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "New project", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "New project", exact: true });
  await dialog
    .getByLabel("Project name", { exact: true })
    .fill("PLC reference");
  await dialog.getByRole("button", { name: "Create", exact: true }).click();
  await page
    .getByRole("button", { name: "PLC and automation", exact: true })
    .click();
  const view = page.locator(".automation-editor");
  const create = view.getByRole("form", {
    name: "Create PLC module",
    exact: true,
  });
  await create
    .getByLabel("Module kind", { exact: true })
    .selectOption("digital-input");
  await create.getByLabel("Reference", { exact: true }).fill("PLC1");
  await create.getByLabel("Device", { exact: true }).fill("Four input module");
  await create
    .getByRole("button", { name: "Create PLC module", exact: true })
    .click();
  await expect(
    view.getByLabel("Selected PLC module", { exact: true }),
  ).toContainText("PLC1");
  const read = () =>
    page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("adiguneplanai.projects.v1")!)
          .projects[0],
    );
  const project = await read();
  expect(project.plcModules).toHaveLength(1);
  expect(project.wires).toHaveLength(0);
  const terminal = project.terminals.find(
    (item: { kind: string }) => item.kind === "signal",
  );
  const mapping = view.getByRole("form", {
    name: "PLC I/O mapping",
    exact: true,
  });
  await mapping
    .getByLabel("Description", { exact: true })
    .fill("Guard position input");
  await mapping.getByLabel("Address", { exact: true }).fill("%IX0.0");
  await mapping
    .getByLabel("Mapped module terminals", { exact: true })
    .selectOption(terminal.id);
  await mapping
    .getByRole("button", { name: "Save I/O address", exact: true })
    .click();
  await expect(
    view.getByRole("table", { name: "PLC I/O list", exact: true }),
  ).toContainText("%IX0.0");
  expect((await read()).plcAddresses[0].terminalIds).toEqual([terminal.id]);
  expect((await read()).wires).toHaveLength(0);
  await mapping.getByLabel("Data type", { exact: true }).selectOption("REAL");
  await mapping
    .getByRole("button", { name: "Save I/O address", exact: true })
    .click();
  await expect(page.locator(".storage-error")).toBeVisible();
  expect((await read()).plcAddresses[0].dataType).toBe("BOOL");
  await mapping.getByLabel("Data type", { exact: true }).selectOption("BOOL");
  await mapping.getByLabel("Address", { exact: true }).fill("%IX0.1");
  await mapping
    .getByRole("button", { name: "Save I/O address", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Undo · Header", exact: true })
    .click();
  await expect(
    view.getByRole("table", { name: "PLC I/O list", exact: true }),
  ).toContainText("%IX0.0");
  await page
    .getByRole("button", { name: "Redo · Header", exact: true })
    .click();
  const note = view.getByRole("form", {
    name: "Control and safety documentation",
    exact: true,
  });
  await note
    .getByLabel("Note name", { exact: true })
    .fill("Guard design intent");
  await note.getByLabel("Note type", { exact: true }).selectOption("safety");
  await note
    .getByLabel("Associated devices", { exact: true })
    .selectOption(project.plcModules[0].deviceId);
  await note
    .getByLabel("Description", { exact: true })
    .fill(
      "Monitoring only; the required safety function needs independent validation.",
    );
  await note
    .getByRole("button", { name: "Save control note", exact: true })
    .click();
  expect((await read()).automationNotes).toHaveLength(1);
  const downloadEvent = page.waitForEvent("download");
  await view
    .getByRole("button", { name: "Download PLC wiring CSV", exact: true })
    .click();
  const csv = await readFile((await (await downloadEvent).path())!, "utf8");
  expect(csv).toContain('"PLC1",0,"%IX0.1"'.replace(",0,", ',"0",'));
  const saved = await read();
  await reloadAndReopenProject(page);
  await page
    .getByRole("button", { name: "PLC and automation", exact: true })
    .click();
  expect((await read()).plcAddresses).toEqual(saved.plcAddresses);
  expect((await read()).automationNotes).toEqual(saved.automationNotes);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

// Retain coverage of the optional full contextual editor controls.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const key = "adiguneplanai.interface.v1";
    localStorage.setItem(
      key,
      JSON.stringify({
        ...JSON.parse(localStorage.getItem(key) || "{}"),
        compact: false,
      }),
    );
  });
});
