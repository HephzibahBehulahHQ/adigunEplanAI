import { reloadAndReopenProject } from "../fixtures/reopen-project";
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

test("cabinet camera pan, zoom and fit preserve engineering geometry", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1672, height: 941 });
  const project = mappedProject();
  await page.goto("/");
  await page.getByLabel("Import project", { exact: true }).setInputFiles({
    name: "camera.adeplan",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(project)),
  });
  const preview = page.locator(".panel-preview");
  const canvas = preview.locator(".panel-3d-view");
  await expect(canvas).toBeVisible();
  const original = await canvas.getAttribute("viewBox");
  const polygons = await canvas
    .locator("polygon")
    .evaluateAll((elements) => elements.map((e) => e.getAttribute("points")));
  const before = await page.evaluate(() =>
    localStorage.getItem("adiguneplanai.projects.v1"),
  );
  const rotate = await preview.getByLabel("View yaw (°)").inputValue();
  await preview.getByRole("button", { name: "Pan", exact: true }).click();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.4);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.6, {
    steps: 8,
  });
  await page.mouse.up();
  await expect(canvas).not.toHaveAttribute("viewBox", original!);
  const pointerView = await canvas.getAttribute("viewBox");
  await canvas.press("ArrowRight");
  await expect(canvas).not.toHaveAttribute("viewBox", pointerView!);
  await canvas.press("ArrowLeft");
  const restoredX = Number(
    (await canvas.getAttribute("viewBox"))!.split(" ")[0],
  );
  expect(restoredX).toBeCloseTo(Number(pointerView!.split(" ")[0]), 8);
  await expect(preview.getByLabel("View yaw (°)")).toHaveValue(rotate);
  expect(
    await canvas
      .locator("polygon")
      .evaluateAll((elements) => elements.map((e) => e.getAttribute("points"))),
  ).toEqual(polygons);
  await preview.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(preview.locator(".panel-camera-tools output")).toHaveText(
    "125%",
  );
  await preview.getByRole("button", { name: "Fit page", exact: true }).click();
  await expect(canvas).toHaveAttribute("viewBox", original!);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("adiguneplanai.projects.v1"),
    ),
  ).toBe(before);
  const cube = preview.locator(".panel-3d-stage > .panel-orientation-cube");
  await expect(cube.locator("polygon")).not.toHaveCount(0);
  const cubeBounds = (await cube.boundingBox())!;
  const stageBounds = (await canvas.boundingBox())!;
  const tools = preview.locator(".panel-3d-stage > .panel-camera-tools");
  const toolBounds = (await tools.boundingBox())!;
  expect(toolBounds.x - stageBounds.x).toBeCloseTo(8, 0);
  expect(toolBounds.y - stageBounds.y).toBeCloseTo(8, 0);
  expect(cubeBounds.y - stageBounds.y).toBeCloseTo(8, 0);
  expect(
    stageBounds.x + stageBounds.width - cubeBounds.x - cubeBounds.width,
  ).toBeCloseTo(8, 0);
  const triad = preview.locator(".panel-axis-triad");
  await expect(triad.locator("text")).toHaveText(["X", "Y", "Z"]);
  const triadBounds = (await triad.boundingBox())!;
  expect(triadBounds.y).toBeGreaterThanOrEqual(
    toolBounds.y + toolBounds.height,
  );
  await preview.getByRole("button", { name: "Front", exact: true }).click();
  await expect(triad.locator("text")).toHaveText(["X", "Y"]);
  await expect(preview.getByLabel("View yaw (°)")).toHaveValue("0");
  await expect(preview.getByLabel("View pitch (°)")).toHaveValue("0");
});
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
  await reloadAndReopenProject(page);
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
  await page.getByLabel("Import project", { exact: true }).setInputFiles({
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
  await page.getByLabel("Import project", { exact: true }).setInputFiles({
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

test("compact target workspace gives the drawing space and keeps native insert, undo, zoom and layout controls functional", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1672, height: 941 });
  await page.goto("/");
  await page.getByRole("button", { name: "File menu", exact: true }).click();
  await page
    .getByRole("button", { name: "Example projects", exact: true })
    .first()
    .click();
  await page
    .getByRole("article")
    .filter({ hasText: "Transformer station documentation" })
    .getByRole("button", { name: "Open a copy", exact: true })
    .click();
  await expect(page.locator(".application")).toHaveAttribute(
    "data-compact",
    "true",
  );
  const canvas = page.locator(".engineering-canvas");
  await expect
    .poll(async () => (await canvas.boundingBox())!.height)
    .toBeGreaterThan(450);
  const drawing = (await canvas.boundingBox())!;
  const bottom = (await page.locator(".dock-bottom").boundingBox())!;
  const footer = (await page.locator(".status-bar").boundingBox())!;
  expect(drawing.y + drawing.height).toBeLessThanOrEqual(bottom.y);
  expect(bottom.y + bottom.height).toBeLessThanOrEqual(footer.y);
  await page.getByRole("button", { name: "Insert menu", exact: true }).click();
  await page
    .getByRole("button", { name: "Fuse · Engineering commands", exact: true })
    .click();
  await expect(canvas).toHaveAttribute("data-tool", "fuse");
  const point = await canvas.evaluate((svg: SVGSVGElement) => {
    const p = new DOMPoint(210, 220).matrixTransform(svg.getScreenCTM()!);
    return { x: p.x, y: p.y };
  });
  await page.mouse.click(point.x, point.y);
  const deviceCount = () =>
    page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("adiguneplanai.projects.v1")!)
          .projects[0].devices.length,
    );
  await expect.poll(deviceCount).toBe(16);
  await page.getByRole("button", { name: "Edit menu", exact: true }).click();
  await page
    .getByRole("button", { name: "Undo · Engineering commands", exact: true })
    .click();
  await expect.poll(deviceCount).toBe(15);
  await page.getByRole("button", { name: "Tools menu", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Zoom in · Engineering commands",
      exact: true,
    })
    .click();
  await expect(canvas).not.toHaveAttribute("viewBox", "0 0 420 297");
  await page
    .getByRole("button", {
      name: "Fit page · Engineering commands",
      exact: true,
    })
    .click();
  await expect(canvas).toHaveAttribute("viewBox", "0 0 420 297");
  await page.getByRole("button", { name: "View", exact: true }).click();
  await page
    .getByRole("checkbox", {
      name: "Compact engineering workspace",
      exact: true,
    })
    .uncheck();
  await expect(page.locator(".compact-editor-tools").first()).toBeVisible();
  await reloadAndReopenProject(page);
  await expect(page.locator(".application")).toHaveAttribute(
    "data-compact",
    "false",
  );
});
