import { test, expect } from "@playwright/test";
import { nativeProject } from "../fixtures/native-project.mjs";

function mappedProject() {
  const project = nativeProject();
  project.symbolInstances[0].position = { x: 100, y: 100 };
  project.symbolInstances[1].position = { x: 200, y: 100 };
  project.wirePaths[0].points = [
    { x: 100, y: 100 },
    { x: 200, y: 100 },
  ];
  project.enclosures.push({
    id: "cabinet",
    name: "Control cabinet",
    widthMm: 400,
    heightMm: 600,
    depthMm: 200,
  });
  for (const [index, suffix] of ["a", "b"].entries()) {
    project.equipment3d.push({
      id: `equipment-${suffix}`,
      name: `Device ${suffix}`,
      enclosureId: "cabinet",
      deviceId: `device-${suffix}`,
      dimensionSource: "manual",
      positionMm: { x: 50 + index * 150, y: 100, z: 10 },
      sizeMm: { x: 60, y: 80, z: 40 },
    });
  }
  return project;
}
test("schematic and cabinet selection synchronize without changing saved engineering data", async ({
  page,
}) => {
  const project = mappedProject();
  await page.goto("/");
  await page.getByLabel("Import project", { exact: true }).setInputFiles({
    name: "mapped.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(project)),
  });
  const cabinet = page.locator('[data-panel="panel3d"]');
  const equipment = cabinet
    .locator('[data-panel-object="equipment-a"]')
    .first();
  await expect(equipment).toBeVisible();
  const stored = await page.evaluate(() =>
    localStorage.getItem("adiguneplanai.projects.v1"),
  );
  const a = page.locator('[data-instance="symbol-a"]');
  await a.focus();
  await a.press("Enter");
  await expect(equipment).toHaveAttribute("aria-pressed", "true");
  const b = cabinet.locator('[data-panel-object="equipment-b"]').first();
  await b.focus();
  await b.press("Enter");
  await expect(page.locator('[data-instance="symbol-b"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(equipment).toHaveAttribute("aria-pressed", "false");
  expect(
    await page.evaluate(() =>
      localStorage.getItem("adiguneplanai.projects.v1"),
    ),
  ).toBe(stored);
  await page.reload();
  await expect(page.locator('[data-instance="symbol-b"]')).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  expect(
    await page.evaluate(() =>
      localStorage.getItem("adiguneplanai.projects.v1"),
    ),
  ).toBe(stored);
});

test("ribbon commands edit native data once, support undo and survive view switches without replay", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Import project", { exact: true }).setInputFiles({
    name: "mapped.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(mappedProject())),
  });
  await page.locator('[data-instance="symbol-a"]').focus();
  await page.locator('[data-instance="symbol-a"]').press("Enter");
  await page.getByRole("button", { name: "Edit menu", exact: true }).click();
  await page
    .getByRole("button", { name: "Rotate · Engineering commands", exact: true })
    .click();
  const rotation = () =>
    page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("adiguneplanai.projects.v1")!)
          .projects[0].symbolInstances[0].rotation,
    );
  await expect.poll(rotation).toBe(90);
  await page
    .getByRole("button", { name: "Building design menu", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Open building designer · Engineering commands",
      exact: true,
    })
    .click();
  await expect(page.locator(".building-editor")).toBeVisible();
  await page
    .getByRole("button", { name: "Power engineering menu", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Open schematic editor · Engineering commands",
      exact: true,
    })
    .click();
  await expect(page.locator('[data-instance="symbol-a"]')).toBeVisible();
  expect(await rotation()).toBe(90);
  await page.getByRole("button", { name: "Edit menu", exact: true }).click();
  await page
    .getByRole("button", { name: "Undo · Engineering commands", exact: true })
    .click();
  await expect.poll(rotation).toBe(0);
  await page
    .getByRole("button", { name: "Redo · Engineering commands", exact: true })
    .click();
  await expect.poll(rotation).toBe(90);
});

test("project tree filtering selects genuine mapped devices without changing native data", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByLabel("Import project", { exact: true })
    .setInputFiles({
      name: "mapped.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(mappedProject())),
    });
  const before = await page.evaluate(() =>
    localStorage.getItem("adiguneplanai.projects.v1"),
  );
  const navigator = page.locator('[data-panel="project"]');
  await navigator.getByLabel("Filter project tree", { exact: true }).fill("Xb");
  await navigator
    .getByRole("button", { name: "Xb · Device b", exact: true })
    .click();
  await expect(page.locator('[data-instance="symbol-b"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(
    page
      .locator('[data-panel="panel3d"] [data-panel-object="equipment-b"]')
      .first(),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    navigator.getByRole("button", { name: "Xa · Device a", exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("adiguneplanai.projects.v1"),
    ),
  ).toBe(before);
});

test("cabinet mapping opens the correct sheet and explicit page navigation clears stale selection", async ({
  page,
}) => {
  const project = mappedProject();
  project.pages.push({
    ...project.pages[0],
    id: "page-2",
    name: "Sheet 2",
    order: 1,
  });
  project.layers.push({
    ...project.layers[0],
    id: "layer-2",
    pageId: "page-2",
  });
  project.devices.push({
    id: "device-c",
    name: "Remote instrument",
    reference: "Xc",
  });
  project.terminals.push({
    ...project.terminals[0],
    id: "terminal-c",
    deviceId: "device-c",
  });
  project.symbolInstances.push({
    ...project.symbolInstances[0],
    id: "symbol-c",
    deviceId: "device-c",
    layerId: "layer-2",
    pageId: "page-2",
  });
  project.pins.push({
    ...project.pins[0],
    id: "pin-c",
    terminalId: "terminal-c",
    symbolInstanceId: "symbol-c",
  });
  project.enclosures.push({
    ...project.enclosures[0],
    id: "cabinet-2",
    name: "Remote cabinet",
  });
  project.equipment3d.push({
    ...project.equipment3d[0],
    id: "equipment-c",
    enclosureId: "cabinet-2",
    deviceId: "device-c",
  });
  await page.goto("/");
  await page
    .getByLabel("Import project", { exact: true })
    .setInputFiles({
      name: "mapped.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(project)),
    });
  const before = await page.evaluate(() =>
    localStorage.getItem("adiguneplanai.projects.v1"),
  );
  const preview = page.locator('[data-panel="panel3d"]');
  await preview
    .getByLabel("Selected enclosure", { exact: true })
    .selectOption("cabinet-2");
  const remote = preview.locator('[data-panel-object="equipment-c"]').first();
  await remote.focus();
  await remote.press("Enter");
  await expect(page.locator('[data-instance="symbol-c"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page
    .locator('[data-panel="project"]')
    .getByRole("button", { name: "Sheet 1", exact: true })
    .click();
  await expect(page.locator('[data-instance="symbol-a"]')).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(remote).toHaveAttribute("aria-pressed", "false");
  await page.locator('[data-instance="symbol-a"]').focus();
  await page.locator('[data-instance="symbol-a"]').press("Enter");
  await expect(
    preview.getByLabel("Selected enclosure", { exact: true }),
  ).toHaveValue("cabinet");
  expect(
    await page.evaluate(() =>
      localStorage.getItem("adiguneplanai.projects.v1"),
    ),
  ).toBe(before);
});
