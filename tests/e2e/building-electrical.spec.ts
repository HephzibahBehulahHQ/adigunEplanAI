import { reloadAndReopenProject } from "../fixtures/reopen-project";
import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const readProject = (page: Page) =>
  page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("adiguneplanai.projects.v1")!)
        .projects[0],
  );
async function prepareFloor(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "New project", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "New project", exact: true });
  await dialog
    .getByLabel("Project name", { exact: true })
    .fill("Floor electrical reference");
  await dialog.getByRole("button", { name: "Create", exact: true }).click();
  await page
    .getByRole("button", { name: "Building design", exact: true })
    .click();
  const building = page.getByRole("form", {
    name: "Add building",
    exact: true,
  });
  await building.getByLabel("Building name", { exact: true }).fill("Workshop");
  await building
    .getByRole("button", { name: "Add building", exact: true })
    .click();
  const floor = page.getByRole("form", { name: "Add floor", exact: true });
  await floor.getByLabel("Floor name", { exact: true }).fill("Ground");
  await floor.getByRole("button", { name: "Add floor", exact: true }).click();
  const room = page.getByRole("form", { name: "Add room", exact: true });
  await room.getByLabel("Room name", { exact: true }).fill("Office");
  await room.getByRole("button", { name: "Add room", exact: true }).click();
  await page.locator(".wall-tools > summary").click();
  const layer = page.getByRole("form", { name: "Add plan layer", exact: true });
  await layer.getByLabel("Plan layer name", { exact: true }).fill("Power");
  await layer.locator("select[name=kind]").selectOption("electrical");
  await layer
    .getByRole("button", { name: "Add plan layer", exact: true })
    .click();
  await page.locator(".equipment-tools > summary").click();
  await page.locator(".equipment-tools details > summary").click();
}
async function createDevice(
  page: Page,
  kind: string,
  reference: string,
  x: number,
) {
  const form = page.getByRole("form", {
    name: "Create floor equipment",
    exact: true,
  });
  await form.getByLabel("Equipment type", { exact: true }).selectOption(kind);
  await form
    .getByLabel("New device reference", { exact: true })
    .fill(reference);
  await form
    .getByLabel("Equipment description", { exact: true })
    .fill(reference + " equipment");
  await form
    .getByLabel("Room", { exact: true })
    .selectOption({ label: "Office" });
  await form.getByLabel("Equipment X (mm)", { exact: true }).fill(String(x));
  await form.getByLabel("Placement grid (mm)", { exact: true }).fill("1");
  await form.getByLabel("Equipment Y (mm)", { exact: true }).fill("1000");
  await form
    .getByRole("button", { name: "Create floor equipment", exact: true })
    .click();
  await expect(
    page.getByRole("table", { name: "Room equipment schedule", exact: true }),
  ).toContainText(reference);
}

test("floor-first devices, board/circuit schedules and geometric routes survive undo, export and reload", async ({
  page,
}) => {
  await prepareFloor(page);
  for (const [kind, reference, x] of [
    ["distribution-board-l-n-pe", "DB1", 500],
    ["luminaire-l-n-pe", "L1", 1512],
    ["socket-l-n-pe", "X1", 2500],
    ["wall-switch-single-pole", "S1", 3500],
  ] as const)
    await createDevice(page, kind, reference, x);
  let project = await readProject(page);
  expect(project.devices).toHaveLength(4);
  expect(project.planEquipment).toHaveLength(4);
  expect(project.symbolInstances).toHaveLength(4);
  expect(project.wires).toHaveLength(0);
  expect(project.manufacturerParts).toHaveLength(0);
  await page
    .getByRole("button", { name: "Undo · Header", exact: true })
    .click();
  await expect(page.locator("[data-plan-equipment-id]")).toHaveCount(3);
  await page
    .getByRole("button", { name: "Redo · Header", exact: true })
    .click();
  await expect(page.locator("[data-plan-equipment-id]")).toHaveCount(4);
  await page
    .getByLabel("Selected equipment", { exact: true })
    .selectOption({ label: "L1" });
  const placement = page.getByRole("form", {
    name: "Save floor placement",
    exact: true,
  });
  await expect(
    placement.getByLabel("Snap equipment to grid", { exact: true }),
  ).not.toBeChecked();
  await placement
    .getByLabel("Mounting height (mm)", { exact: true })
    .fill("2200");
  await placement
    .getByRole("button", { name: "Save floor placement", exact: true })
    .click();
  expect((await readProject(page)).planEquipment[1].position.x).toBe(1512);

  await page.locator(".circuit-route-tools > summary").click();
  const board = page.getByRole("form", {
    name: "Save distribution board",
    exact: true,
  });
  await board
    .getByLabel("Distribution board name", { exact: true })
    .fill("DB Office");
  await board
    .locator("select[name=device]")
    .selectOption({ label: "DB1 · DB1 equipment" });
  await board
    .getByRole("button", { name: "Save distribution board", exact: true })
    .click();
  const circuit = page.getByRole("form", { name: "Save circuit", exact: true });
  await circuit.getByLabel("Circuit name", { exact: true }).fill("C1 Office");
  await circuit
    .locator("select[name=board]")
    .selectOption({ label: "DB Office" });
  await circuit.getByLabel("Supply voltage (V)", { exact: true }).fill("230");
  await circuit.getByLabel("Phases", { exact: true }).selectOption("1");
  for (const reference of ["L1", "X1", "S1"])
    await circuit
      .getByRole("checkbox", {
        name: `${reference} · ${reference} equipment`,
        exact: true,
      })
      .check();
  await circuit.getByLabel("Active load (W): L1", { exact: true }).fill("12.5");
  await circuit.getByLabel("Active load (W): S1", { exact: true }).fill("0");
  await circuit
    .getByRole("button", { name: "Save circuit", exact: true })
    .click();
  const schedule = page.locator("[data-circuit-schedule-id]");
  await expect(schedule).toHaveCount(1);
  await expect(schedule).toContainText("12.5");
  project = await readProject(page);
  expect(project.circuits[0].deviceIds).toHaveLength(3);
  expect(
    project.circuits[0].loads
      .map((l: { activePowerW: number }) => l.activePowerW)
      .sort((a: number, b: number) => a - b),
  ).toEqual([0, 12.5]);
  await expect(schedule.locator("td").nth(5)).toHaveText("1");
  await expect(schedule.locator("td").nth(6)).not.toHaveText("12.5");
  await expect(
    page.getByRole("button", {
      name: "Remove distribution board",
      exact: true,
    }),
  ).toBeDisabled();

  const route = page.getByRole("form", {
    name: "Save plan route",
    exact: true,
  });
  await route.getByLabel("Route name", { exact: true }).fill("Office cable");
  await route.locator("select[name=kind]").selectOption("cable");
  await route
    .locator("select[name=circuit]")
    .selectOption({ label: "C1 Office" });
  await route.locator("textarea").fill("12,12\n3012,12\n3012,4012");
  await route.getByLabel("Route grid (mm)", { exact: true }).fill("50");
  await route
    .getByRole("button", { name: "Save plan route", exact: true })
    .click();
  await expect(page.locator("[data-plan-route-id] polyline")).toHaveAttribute(
    "points",
    "0,0 3000,0 3000,4000",
  );
  await expect(page.locator("[data-plan-route-label]")).toContainText(
    "C1 Office",
  );
  await expect(schedule.locator("td").last()).toHaveText("7");
  await expect(
    page.getByRole("button", { name: "Remove circuit", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Undo · Header", exact: true })
    .click();
  await expect(page.locator("[data-plan-route-id]")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Redo · Header", exact: true })
    .click();
  await expect(page.locator("[data-plan-route-id]")).toHaveCount(1);
  await circuit.getByLabel("Active load (W): X1", { exact: true }).fill("1000");
  await circuit
    .getByRole("button", { name: "Save circuit", exact: true })
    .click();
  await expect(schedule.locator("td").nth(5)).toHaveText("0");
  await expect(schedule.locator("td").nth(6)).toHaveText("1012.5");
  project = await readProject(page);
  expect(project.wires).toHaveLength(0);
  expect(project.planRoutes[0].points).toEqual([
    { x: 0, y: 0 },
    { x: 3000, y: 0 },
    { x: 3000, y: 4000 },
  ]);
  const beforeReload = JSON.stringify(project);
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export project", exact: true })
    .click();
  const download = await downloadPromise;
  expect(JSON.parse(await readFile((await download.path())!, "utf8"))).toEqual(
    project,
  );
  await reloadAndReopenProject(page);
  await page
    .getByRole("button", { name: "Building design", exact: true })
    .click();
  await page.locator(".circuit-route-tools > summary").click();
  await expect(schedule.locator("td").nth(6)).toHaveText("1012.5");
  await expect(page.locator("[data-plan-route-id] polyline")).toHaveAttribute(
    "points",
    "0,0 3000,0 3000,4000",
  );
  expect(JSON.stringify(await readProject(page))).toBe(beforeReload);
  await page.setViewportSize({ width: 390, height: 844 });
  const table = page.getByRole("table", {
    name: "Circuit schedule",
    exact: true,
  });
  expect(
    await table.evaluate((element) => {
      const wrapper = element.parentElement!;
      return wrapper.scrollWidth > wrapper.clientWidth;
    }),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("floor equipment and routes reject invalid changes and respect locked/hidden plan layers", async ({
  page,
}) => {
  await prepareFloor(page);
  await createDevice(page, "luminaire-l-n-pe", "L1", 1000);
  const form = page.getByRole("form", {
    name: "Create floor equipment",
    exact: true,
  });
  const before = JSON.stringify(await readProject(page));
  await form.getByLabel("New device reference", { exact: true }).fill("L1");
  await form
    .getByRole("button", { name: "Create floor equipment", exact: true })
    .click();
  expect(JSON.stringify(await readProject(page))).toBe(before);
  await page.locator(".circuit-route-tools > summary").click();
  const route = page.getByRole("form", {
    name: "Save plan route",
    exact: true,
  });
  await route.getByLabel("Route name", { exact: true }).fill("Tray A");
  await route.locator("select[name=kind]").selectOption("tray");
  await route.locator("textarea").fill("12,7\n1012,7");
  await route
    .getByLabel("Snap route points to grid", { exact: true })
    .uncheck();
  await route
    .getByRole("button", { name: "Save plan route", exact: true })
    .click();
  await expect(page.locator("[data-plan-route-id]")).toHaveCount(1);
  await route.getByLabel("Route name", { exact: true }).fill("Tray A renamed");
  await route
    .getByRole("button", { name: "Save plan route", exact: true })
    .click();
  await expect(page.locator("[data-plan-route-id] polyline")).toHaveAttribute(
    "points",
    "12,7 1012,7",
  );
  const saved = JSON.stringify(await readProject(page));
  await route.locator("textarea").fill("0,0\n0,0");
  await route
    .getByRole("button", { name: "Save plan route", exact: true })
    .click();
  expect(JSON.stringify(await readProject(page))).toBe(saved);
  await page
    .getByRole("checkbox", { name: "Locked: Power", exact: true })
    .check();
  await expect(
    form.getByRole("button", { name: "Create floor equipment", exact: true }),
  ).toBeDisabled();
  await expect(
    route.getByRole("button", { name: "Save plan route", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Remove plan route", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("checkbox", { name: "Visible: Power", exact: true })
    .uncheck();
  await expect(page.locator("[data-plan-equipment-id]")).toHaveCount(0);
  await expect(page.locator("[data-plan-route-id]")).toHaveCount(0);
  await expect(page.locator("[data-route-schedule-id]")).toHaveCount(1);
  await expect(page.locator("[data-equipment-schedule-id]")).toHaveCount(1);
  await reloadAndReopenProject(page);
  await page
    .getByRole("button", { name: "Building design", exact: true })
    .click();
  await page.locator(".wall-tools > summary").click();
  await page
    .getByRole("checkbox", { name: "Visible: Power", exact: true })
    .check();
  await page
    .getByRole("checkbox", { name: "Locked: Power", exact: true })
    .uncheck();
  await page.locator(".circuit-route-tools > summary").click();
  await page.locator("[data-plan-route-id]").focus();
  await page.keyboard.press("Enter");
  await page
    .getByRole("button", { name: "Remove plan route", exact: true })
    .click();
  await expect(page.locator("[data-plan-route-id]")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Undo · Header", exact: true })
    .click();
  await expect(page.locator("[data-plan-route-id]")).toHaveCount(1);
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
