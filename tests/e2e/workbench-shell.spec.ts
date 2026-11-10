import { expect, test } from "@playwright/test";
import { nativeProject } from "../fixtures/native-project.mjs";
import { clickWirePin } from "../fixtures/click-wire-pin";

for (const [width, height] of [
  [1920, 1080],
  [1440, 900],
  [1366, 768],
  [1280, 720],
]) {
  test(`workbench menus and shell stay anchored at ${width} × ${height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page.getByLabel("Import project", { exact: true }).setInputFiles({
      name: "shell-reference.adeplan",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(nativeProject())),
    });
    const file = page.getByRole("button", { name: "File menu", exact: true });
    const view = page.getByRole("button", { name: "View", exact: true });
    const options = page.getByRole("button", { name: "Options", exact: true });
    const popup = page.locator(".workbench-menu");
    const canvas = page.locator(".engineering-canvas");
    const ribbon = page.locator(".ribbon");
    const positions = () =>
      page
        .locator(
          ".app-header, .app-header button, .ribbon-tabs, [data-menu-trigger], .ribbon, .ribbon button",
        )
        .evaluateAll((nodes) =>
          nodes.map((node) => {
            const { x, y } = node.getBoundingClientRect();
            return [x, y];
          }),
        );
    const initial = await positions();
    await file.click();
    await expect(popup).toHaveAttribute("data-tab", "file");
    await expect(ribbon).toHaveAttribute("data-tab", "home");
    const anchor = (await file.boundingBox())!;
    const menu = (await popup.boundingBox())!;
    const menuBar = (await page.locator(".ribbon-tabs").boundingBox())!;
    expect(menu.y).toBeCloseTo(
      Math.max(anchor.y + anchor.height, menuBar.y + menuBar.height - 1),
      0,
    );
    expect(Math.abs(menu.x - anchor.x)).toBeLessThanOrEqual(5);
    await page.mouse.move(menu.x + 16, menu.y + 10, { steps: 8 });
    await expect(popup).toBeVisible();
    await page.mouse.move(width / 2, height - 12, { steps: 6 });
    await expect(popup).toHaveCount(0);

    await file.click();
    await view.click();
    await expect(popup).toHaveAttribute("data-tab", "view");
    await expect(popup).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(popup).toHaveCount(0);
    await expect(view).toBeFocused();
    await file.click();
    await canvas.click({ position: { x: 100, y: 100 } });
    await expect(popup).toHaveCount(0);

    const home = page.getByRole("button", { name: "Home", exact: true });
    await home.click();
    await expect(popup).toHaveAttribute("data-tab", "home");
    await view.hover();
    await expect(popup).toHaveAttribute("data-tab", "view");
    await options.click();
    await expect(popup).toHaveAttribute("data-tab", "options");
    await expect(
      popup.getByRole("checkbox", { name: "Grid (mm)", exact: true }),
    ).toBeChecked();
    if (width === 1440)
      await testInfo.attach("workbench-options", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
    const edge = (await popup.boundingBox())!;
    expect(edge.x).toBeGreaterThanOrEqual(0);
    expect(edge.x + edge.width).toBeLessThanOrEqual(width);
    expect(edge.y + edge.height).toBeLessThanOrEqual(height);
    await page.keyboard.press("Escape");

    const viewBox = (await canvas.getAttribute("viewBox"))!;
    await canvas.hover();
    await page.mouse.wheel(0, -100);
    await expect(canvas).not.toHaveAttribute("viewBox", viewBox);
    const zoomed = (await canvas.getAttribute("viewBox"))!;
    await page.mouse.wheel(0, 100);
    await expect(canvas).not.toHaveAttribute("viewBox", zoomed);
    const area = (await canvas.boundingBox())!;
    const centerX = area.x + area.width / 2;
    const centerY = area.y + area.height / 2;
    for (const [dx, dy] of [
      [-120, -70],
      [120, 70],
    ]) {
      const before = (await canvas.getAttribute("viewBox"))!;
      await page.mouse.move(centerX, centerY);
      await page.mouse.down({ button: "middle" });
      await page.mouse.move(centerX + dx, centerY + dy);
      await page.mouse.up({ button: "middle" });
      await expect(canvas).not.toHaveAttribute("viewBox", before);
      expect(await positions()).toEqual(initial);
    }
    for (const selector of [
      ".dock-left .panel-body",
      ".dock-right .panel-body",
      ".ribbon-tabs",
      ".ribbon",
    ]) {
      await page.locator(selector).first().hover();
      await page.mouse.wheel(300, 300);
      expect(await positions()).toEqual(initial);
    }
    expect(
      await page
        .locator(".ribbon-tabs, .ribbon")
        .evaluateAll((nodes) =>
          nodes.every(
            (node) =>
              node.scrollLeft === 0 && node.scrollWidth <= node.clientWidth + 1,
          ),
        ),
    ).toBe(true);
    expect(await positions()).toEqual(initial);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    expect((await canvas.boundingBox())!.y).toBeGreaterThanOrEqual(
      (await ribbon.boundingBox())!.y +
        (await ribbon.boundingBox())!.height -
        1,
    );
  });
}

test("independent sidebar toggles reflow the same canvas and preserve real editing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByLabel("Import project", { exact: true }).setInputFiles({
    name: "sidebar-reference.adeplan",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(nativeProject())),
  });
  const canvas = page.locator(".engineering-canvas");
  const original = await canvas.elementHandle();
  const left = page.locator(".sidebar-toggles button").first();
  const right = page.locator(".sidebar-toggles button").last();
  const workspace = page.locator("#workspace");
  const width = async () => (await workspace.boundingBox())!.width;
  const initial = await width();
  await left.click();
  await expect(left).toHaveAttribute("aria-expanded", "false");
  await expect(right).toHaveAttribute("aria-expanded", "true");
  expect(await width()).toBeGreaterThan(initial);
  await left.click();
  await expect(page.locator(".dock-left")).toBeVisible();
  await right.click();
  await expect(page.locator(".dock-right")).toHaveCount(0);
  const withoutRight = await width();
  expect(withoutRight).toBeGreaterThan(initial);
  await left.click();
  expect(await width()).toBeGreaterThan(withoutRight);
  expect(
    await canvas.evaluate((node, original) => node === original, original),
  ).toBe(true);
  const readProject = () =>
    page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("adiguneplanai.projects.v1")!)
          .projects[0],
    );
  const before = await readProject();
  await page.getByRole("button", { name: "Insert menu", exact: true }).click();
  await page
    .locator("#workbench-menu-insert")
    .getByRole("button", {
      name: "Resistor · Engineering commands",
      exact: true,
    })
    .click();
  const placement = await canvas.evaluate((element) => {
    const { x, y } = new DOMPoint(120, 100).matrixTransform(
      (element as SVGSVGElement).getScreenCTM()!,
    );
    return { x, y };
  });
  await page.mouse.click(placement.x, placement.y);
  expect((await readProject()).symbolInstances).toContainEqual(
    expect.objectContaining({ position: { x: 120, y: 100 } }),
  );
  await page.locator('.ribbon [data-command="ribbonSelect"]').click();
  await expect(
    canvas.locator('[data-instance][aria-label="R1"]'),
  ).toHaveAttribute("aria-pressed", "true");
  const drag = await canvas.evaluate((element) => {
    const matrix = (element as SVGSVGElement).getScreenCTM()!;
    return [new DOMPoint(120, 100), new DOMPoint(140, 120)].map((point) => {
      const { x, y } = point.matrixTransform(matrix);
      return { x, y };
    });
  });
  await page.mouse.move(drag[0].x, drag[0].y);
  await page.mouse.down();
  await page.mouse.move(drag[1].x, drag[1].y);
  await page.mouse.up();
  expect((await readProject()).symbolInstances).toContainEqual(
    expect.objectContaining({ position: { x: 140, y: 120 } }),
  );
  await page
    .locator('.ribbon[data-tab="home"] [data-command="ribbonWire"]')
    .click();
  const fromPinId = await clickWirePin(page, "Xa:1");
  const toPinId = await clickWirePin(page, "R1:1");
  const wired = await readProject();
  expect(wired.wires).toContainEqual(
    expect.objectContaining({ fromPinId, toPinId }),
  );
  await page.locator('.ribbon[data-tab="home"] [data-command="undo"]').click();
  expect((await readProject()).wires).toEqual(before.wires);
  await canvas.press("Control+y");
  expect((await readProject()).wires).toEqual(wired.wires);
  await right.click();
  await left.click();
  expect(await width()).toBeCloseTo(initial, 0);
  expect(
    await canvas.evaluate((node, original) => node === original, original),
  ).toBe(true);
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(canvas).toBeVisible();
  expect(
    await canvas.evaluate((node, original) => node === original, original),
  ).toBe(true);
  const view = page.getByRole("button", { name: "View", exact: true });
  await view.click();
  await page
    .getByRole("checkbox", {
      name: "Compact engineering workspace",
      exact: true,
    })
    .uncheck();
  await page.keyboard.press("Escape");
  const topShell = page.locator(".workbench-shell");
  const fixed = await topShell.boundingBox();
  const drawing = page.locator(".drawing-viewport");
  expect(
    await drawing.evaluate(
      (element) => element.scrollHeight > element.clientHeight,
    ),
  ).toBe(true);
  await drawing.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  expect(
    await drawing.evaluate((element) => element.scrollTop),
  ).toBeGreaterThan(0);
  expect(await topShell.boundingBox()).toEqual(fixed);
  expect(errors).toEqual([]);
});
