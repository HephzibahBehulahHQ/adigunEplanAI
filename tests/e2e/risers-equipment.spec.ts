import { reloadAndReopenProject } from "../fixtures/reopen-project";
import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { nativeProject } from "../fixtures/native-project.mjs";
import {
  addBuilding,
  addFloor,
} from "../../packages/building-design/structure.ts";
import { addPlanLayer } from "../../packages/building-design/walls.ts";
import type { Project } from "../../packages/electrical-model/project.ts";
import { openProjectPanel } from "./workbench.ts";

async function prepare(page: Page) {
  let project = addBuilding(nativeProject(), "Workshop", "");
  project = addFloor(project, project.buildings[0].id, "Ground", 0, 3000);
  project = addFloor(project, project.buildings[0].id, "Upper", 3000, 3000);
  for (const floor of project.floors)
    project = addPlanLayer(
      project,
      floor.id,
      `${floor.name} electrical`,
      "electrical",
    );
  await page.addInitScript((project) => {
    if (!localStorage.getItem("adiguneplanai.projects.v1"))
      localStorage.setItem(
        "adiguneplanai.projects.v1",
        JSON.stringify({
          version: 1,
          projects: [project],
          activeProjectId: project.id,
        }),
      );
  }, project);
  await page.goto("/");
  await expect(page.locator(".empty-workspace")).toBeVisible();
  await openProjectPanel(page);
  await page.getByTestId("project-picker").selectOption(project.id);
  await page
    .getByRole("button", { name: "Building design", exact: true })
    .click();
  return project;
}
const stored = (page: Page): Promise<Project> =>
  page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("adiguneplanai.projects.v1")!)
        .projects[0],
  );

test("emergency, fire, data and earthing equipment create native interfaces and survive reload", async ({
  page,
}) => {
  const initial = await prepare(page);
  await page.locator(".equipment-tools > summary").click();
  await page.locator(".equipment-tools details > summary").click();
  const form = page.getByRole("form", {
    name: "Create floor equipment",
    exact: true,
  });
  for (const [kind, reference] of [
    ["emergency-luminaire-battery", "EL1"],
    ["fire-alarm-loop-interface", "FA1"],
    ["data-outlet-8p8c-shielded", "DATA1"],
    ["earthing-bond-point", "PE1"],
  ]) {
    await form.getByLabel("Equipment type", { exact: true }).selectOption(kind);
    await form
      .getByLabel("New device reference", { exact: true })
      .fill(reference);
    await form
      .getByLabel("Equipment description", { exact: true })
      .fill(reference + " interface");
    await form
      .getByLabel("Equipment X (mm)", { exact: true })
      .fill(String(1000 * (1 + (await stored(page)).planEquipment.length)));
    await form
      .getByRole("button", { name: "Create floor equipment", exact: true })
      .click();
    await expect(
      page.getByRole("table", { name: "Room equipment schedule", exact: true }),
    ).toContainText(reference);
  }
  const saved = await stored(page);
  expect(saved.planEquipment).toHaveLength(4);
  expect(saved.wires).toEqual(initial.wires);
  expect(saved.nets.find((net) => net.id === "net")).toMatchObject(
    initial.nets[0],
  );
  for (const net of saved.nets.filter((net) => net.id !== "net")) {
    expect(net.wireIds).toHaveLength(0);
    expect(net.terminalIds).toHaveLength(1);
  }
  expect(saved.manufacturerParts).toEqual([]);
  const earth = saved.devices.find((d) => d.reference === "PE1")!;
  const terminals = saved.terminals.filter((t) => t.deviceId === earth.id);
  expect(terminals).toHaveLength(1);
  expect(terminals[0].kind).toBe("pe");
  expect(
    saved.pins.filter((pin) => pin.terminalId === terminals[0].id),
  ).toHaveLength(2);
  const data = saved.devices.find((d) => d.reference === "DATA1")!;
  expect(
    saved.terminals.filter(
      (t) => t.deviceId === data.id && t.kind === "signal",
    ),
  ).toHaveLength(9);
  await reloadAndReopenProject(page);
  expect(await stored(page)).toEqual(saved);
});

test("riser forms preserve exact coordinates, calculate only vertical geometry and protect both floors", async ({
  page,
}) => {
  const initial = await prepare(page);
  await page.locator(".riser-tools > summary").click();
  const form = page.getByRole("form", { name: "Save riser", exact: true });
  await form.getByLabel("Riser name", { exact: true }).fill("Shaft R1");
  await form.getByLabel("Riser X (mm)", { exact: true }).fill("1012.5");
  await form.getByLabel("Riser Y (mm)", { exact: true }).fill("986.25");
  await form
    .getByLabel("Start height above floor (mm)", { exact: true })
    .fill("100");
  await form
    .getByLabel("End height above floor (mm)", { exact: true })
    .fill("200");
  await form
    .getByLabel("Snap riser position to grid", { exact: true })
    .uncheck();
  await form.getByRole("button", { name: "Save riser", exact: true }).click();
  const row = page.locator("[data-riser-schedule-id]");
  await expect(row.locator("td").last()).toHaveText("3.1");
  await page.locator(".riser-elevation-preview > summary").click();
  const elevation = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download riser elevation SVG", exact: true })
    .click();
  const drawing = await readFile((await (await elevation).path())!, "utf8");
  expect(drawing).toContain(
    'data-start-elevation-mm="100" data-end-elevation-mm="3200" data-vertical-length-m="3.1"',
  );
  expect(drawing).toContain('width="297mm" height="210mm"');
  await expect(
    form.getByLabel("Snap riser position to grid", { exact: true }),
  ).not.toBeChecked();
  await form.getByLabel("Riser name", { exact: true }).fill("Shaft R1 renamed");
  await form.getByRole("button", { name: "Save riser", exact: true }).click();
  let project = await stored(page);
  expect(project.planRisers[0].position).toEqual({ x: 1012.5, y: 986.25 });
  expect(project.wires).toEqual(initial.wires);
  expect(project.cables).toEqual([]);
  await page
    .getByRole("button", { name: "Undo · Header", exact: true })
    .click();
  await expect(row.locator("td").first()).toHaveText("Shaft R1");
  await page
    .getByRole("button", { name: "Redo · Header", exact: true })
    .click();
  await expect(row.locator("td").first()).toHaveText("Shaft R1 renamed");
  await page
    .getByRole("combobox", { name: "Floor name", exact: true })
    .selectOption({ label: "Upper" });
  await expect(row.locator("td").last()).toHaveText("3.1");
  await page.getByText("Walls and plan layers", { exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Locked: Upper electrical", exact: true })
    .check();
  if ((await page.locator(".riser-tools").getAttribute("open")) === null)
    await page.locator(".riser-tools > summary").click();
  await page
    .getByLabel("Selected riser", { exact: true })
    .selectOption({ label: "Shaft R1 renamed" });
  await expect(
    form.getByRole("button", { name: "Save riser", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Remove riser", exact: true }),
  ).toBeDisabled();
  project = await stored(page);
  await reloadAndReopenProject(page);
  await page
    .getByRole("button", { name: "Building design", exact: true })
    .click();
  await page.locator(".riser-tools > summary").click();
  await page
    .getByLabel("Selected riser", { exact: true })
    .selectOption({ label: "Shaft R1 renamed" });
  await expect(
    form.getByRole("button", { name: "Save riser", exact: true }),
  ).toBeDisabled();
  expect(await stored(page)).toEqual(project);
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
