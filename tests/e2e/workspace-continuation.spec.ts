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
