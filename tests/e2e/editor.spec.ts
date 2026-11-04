import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
const key = "adiguneplanai.projects.v1";
async function create(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "New project", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "New project", exact: true });
  await dialog
    .getByLabel("Project name", { exact: true })
    .fill("Editor reference");
  await dialog.getByRole("button", { name: "Create", exact: true }).click();
  await expect(
    page.getByRole("application", { name: "Sheet 1", exact: true }),
  ).toBeVisible();
}
async function clickWorld(page: Page, x: number, y: number) {
  await page.locator(".engineering-canvas").scrollIntoViewIfNeeded();
  const screen = await page.locator(".engineering-canvas").evaluate(
    (svg, point) => {
      const p = new DOMPoint(point.x, point.y).matrixTransform(
        (svg as SVGSVGElement).getScreenCTM()!,
      );
      return { x: p.x, y: p.y };
    },
    { x, y },
  );
  await page.mouse.click(screen.x, screen.y);
}
async function place(page: Page, kind: string, x: number, y: number) {
  await page
    .getByRole("combobox", { name: "Symbols", exact: true })
    .selectOption(kind);
  await clickWorld(page, x, y);
}
async function project(page: Page) {
  return page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!).projects[0],
    key,
  );
}

test("custom native sheet dimensions display their actual size category", async ({
  page,
}) => {
  await create(page);
  await page.evaluate((storageKey) => {
    const library = JSON.parse(localStorage.getItem(storageKey)!);
    library.projects[0].pages[0].widthMm = 500;
    library.projects[0].pages[0].heightMm = 350;
    localStorage.setItem(storageKey, JSON.stringify(library));
  }, key);
  await page.reload();
  await page.locator(".editor-options summary").click();
  await expect(
    page.getByRole("combobox", { name: "Sheet size", exact: true }),
  ).toHaveValue("custom");
  await page
    .getByRole("combobox", { name: "Sheet size", exact: true })
    .selectOption("A4");
  expect((await project(page)).pages[0].widthMm).toBe(297);
});

test("manual route edits persist and reset through native undo history", async ({
  page,
}) => {
  await create(page);
  await place(page, "resistor", 50, 50);
  await place(page, "lamp", 150, 50);
  await page.getByRole("button", { name: "Wire", exact: true }).click();
  await page.getByRole("button", { name: "R1:2", exact: true }).click();
  await page.getByRole("button", { name: "H1:1", exact: true }).click();
  await page.getByRole("button", { name: "Select", exact: true }).click();
  await clickWorld(page, 100, 50);
  const route = page.getByRole("form", {
    name: "Apply manual route",
    exact: true,
  });
  await route
    .getByRole("textbox")
    .fill("60, 50\n70, 50\n70, 80\n130, 80\n130, 50\n144, 50");
  await route
    .getByRole("button", { name: "Apply manual route", exact: true })
    .click();
  let data = await project(page);
  expect(data.wirePaths[0].routingMode).toBe("manual");
  expect(data.wirePaths[0].points).toHaveLength(6);
  const manual = data.wirePaths[0].points;
  await route
    .getByRole("button", { name: "Restore automatic route", exact: true })
    .click();
  expect((await project(page)).wirePaths[0].routingMode).toBe("auto");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  expect((await project(page)).wirePaths[0].points).toEqual(manual);
  await page.reload();
  data = await project(page);
  expect(data.wirePaths[0].points).toEqual(manual);
  expect(data.wires).toHaveLength(1);
});

test("wire properties and shielded cable cores persist as native engineering metadata", async ({
  page,
}) => {
  await create(page);
  await place(page, "resistor", 50, 50);
  await place(page, "lamp", 150, 50);
  await page.getByRole("button", { name: "Wire", exact: true }).click();
  await page.getByRole("button", { name: "R1:2", exact: true }).click();
  await page.getByRole("button", { name: "H1:1", exact: true }).click();
  await page.getByRole("button", { name: "Select", exact: true }).click();
  await clickWorld(page, 100, 50);
  await page.locator(".wire-properties summary").click();
  const wire = page.getByRole("form", { name: "Wire properties", exact: true });
  await wire.getByLabel("Wire", { exact: true }).fill("W20");
  await wire
    .getByLabel("Drawing color (#RRGGBB)", { exact: true })
    .fill("#123abc");
  await wire
    .getByLabel("Declared physical length (m)", { exact: true })
    .fill("12.5");
  await wire.getByRole("button", { name: "Apply", exact: true }).click();
  const core = page.getByRole("form", {
    name: "Create and assign core",
    exact: true,
  });
  await core.getByLabel("Conductor core", { exact: true }).fill("1");
  await core
    .getByLabel("Core color or designation", { exact: true })
    .fill("BU");
  await core.getByLabel("Cross-section (mm²)", { exact: true }).fill("2.5");
  await core
    .getByRole("button", { name: "Create and assign core", exact: true })
    .click();
  const connectivity = page.getByRole("region", {
    name: "Connectivity",
    exact: true,
  });
  await connectivity
    .locator("summary")
    .filter({ hasText: /^Cable$/ })
    .click();
  const cable = connectivity.getByRole("form", { name: "Cable", exact: true });
  await cable.getByLabel("Cable name", { exact: true }).fill("W-C1");
  let data = await project(page);
  await cable
    .getByLabel("Conductor core", { exact: true })
    .selectOption(data.conductors[0].id);
  await cable.getByLabel("Shielded cable", { exact: true }).check();
  await cable
    .getByLabel("Shield bond terminals", { exact: true })
    .selectOption(data.terminals[0].id);
  await cable.getByRole("button", { name: "Apply", exact: true }).click();
  data = await project(page);
  expect(data.wires[0]).toMatchObject({
    name: "W20",
    color: "#123abc",
    physicalLengthM: 12.5,
    conductorId: data.conductors[0].id,
  });
  expect(data.cables[0]).toMatchObject({
    name: "W-C1",
    shielded: true,
    conductorIds: [data.conductors[0].id],
    shieldBondTerminalIds: [data.terminals[0].id],
  });
  await page.reload();
  expect((await project(page)).cables).toEqual(data.cables);
  const panel = page.getByRole("region", { name: "Connectivity", exact: true });
  await panel
    .locator("summary")
    .filter({ hasText: /^Edit core$/ })
    .click();
  const editor = panel.getByRole("form", { name: "Edit core", exact: true });
  await editor.getByLabel("Cross-section (mm²)", { exact: true }).fill("4");
  await editor.getByRole("button", { name: "Apply", exact: true }).click();
  expect((await project(page)).conductors[0].crossSectionMm2).toBe(4);
  await panel
    .locator("summary")
    .filter({ hasText: /^Terminal properties$/ })
    .click();
  const terminal = panel.getByRole("form", {
    name: "Terminal properties",
    exact: true,
  });
  await terminal.getByLabel("Connection required", { exact: true }).check();
  await terminal
    .getByLabel("Declared maximum wire connections", { exact: true })
    .fill("1");
  await terminal.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(panel).toContainText("Errors: 1");
  await panel
    .locator("summary")
    .filter({ hasText: /^Terminal strip$/ })
    .click();
  const strip = panel.getByRole("form", {
    name: "Terminal strip",
    exact: true,
  });
  await strip.getByLabel("Strip name", { exact: true }).fill("X1");
  await strip
    .getByLabel("Strip members", { exact: true })
    .selectOption([data.terminals[0].id, data.terminals[3].id]);
  await strip.getByRole("button", { name: "Apply", exact: true }).click();
  expect((await project(page)).terminalStrips[0].terminalIds).toEqual([
    data.terminals[0].id,
    data.terminals[3].id,
  ]);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  expect((await project(page)).terminalStrips).toHaveLength(0);
});
test("symbols create native terminals, connect through real pins and reroute after editing", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await create(page);
  await place(page, "resistor", 50, 50);
  await place(page, "lamp", 120, 80);
  await expect(page.locator("[data-instance]")).toHaveCount(2);
  await page.getByRole("button", { name: "Wire", exact: true }).click();
  await page.getByRole("button", { name: "R1:2", exact: true }).click();
  await page.getByRole("button", { name: "H1:1", exact: true }).click();
  await expect(page.locator("[data-wire]")).toHaveCount(1);
  const connectivity = page.getByRole("region", {
    name: "Connectivity",
    exact: true,
  });
  await expect(connectivity).toContainText("Netlist (3)");
  await connectivity.getByText("Connections (1)", { exact: true }).click();
  await expect(connectivity.getByRole("table")).toContainText("W1");
  await expect(connectivity.getByRole("table")).toContainText("R1:2");
  await expect(connectivity.getByRole("table")).toContainText("H1:1");
  await page.getByRole("button", { name: "Select", exact: true }).click();
  await clickWorld(page, 50, 50);
  await page.getByRole("application", { name: "Sheet 1", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  let data = await project(page);
  expect(
    data.symbolInstances.find((s: { name: string }) => s.name === "R1").position
      .x,
  ).toBe(55);
  expect(data.wires).toHaveLength(1);
  expect(data.wirePaths[0].points[0].x).toBe(65);
  await page.getByRole("button", { name: "Rotate", exact: true }).click();
  data = await project(page);
  expect(
    data.symbolInstances.find((s: { name: string }) => s.name === "R1")
      .rotation,
  ).toBe(90);
  expect(data.wires).toHaveLength(1);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.reload();
  data = await project(page);
  expect(
    data.symbolInstances.find((s: { name: string }) => s.name === "R1")
      .rotation,
  ).toBe(0);
  await expect(page.locator("[data-wire]")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("numbering preview can be cancelled, applied and undone", async ({
  page,
}) => {
  await create(page);
  await place(page, "resistor", 50, 50);
  await page.getByRole("button", { name: "Select", exact: true }).click();
  await clickWorld(page, 50, 50);
  const props = page.getByRole("form", { name: "Properties", exact: true });
  await props.getByLabel("Reference", { exact: true }).fill("R9");
  await props.getByRole("button", { name: "Apply", exact: true }).click();
  const connectivity = page.getByRole("region", {
    name: "Connectivity",
    exact: true,
  });
  await connectivity
    .getByLabel("Renumber", { exact: true })
    .selectOption("devices");
  await connectivity
    .getByRole("button", { name: "Preview numbering", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Preview numbering",
    exact: true,
  });
  await expect(dialog).toContainText("R9 → R1");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  expect((await project(page)).devices[0].reference).toBe("R9");
  await connectivity
    .getByRole("button", { name: "Preview numbering", exact: true })
    .click();
  await dialog.getByRole("button", { name: "Apply", exact: true }).click();
  expect((await project(page)).devices[0].reference).toBe("R1");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  expect((await project(page)).devices[0].reference).toBe("R9");
});
test("property editing, labels, layer locks, sheet sizes and zoom change real state", async ({
  page,
}) => {
  await create(page);
  await place(page, "resistor", 50, 50);
  await page.getByRole("button", { name: "Select", exact: true }).click();
  const props = page.getByRole("form", { name: "Properties", exact: true });
  await props.getByLabel("Reference", { exact: true }).fill("R10");
  await props.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "R10:1", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Net label", exact: true }).click();
  await page.getByRole("button", { name: "R10:1", exact: true }).click();
  await page.getByLabel("Label text", { exact: true }).fill("CONTROL_24V");
  await page.getByRole("button", { name: "Add label", exact: true }).click();
  expect((await project(page)).annotations[0].text).toBe("CONTROL_24V");
  await page.locator(".editor-options summary").click();
  await page.getByRole("checkbox", { name: "Locked", exact: true }).check();
  await place(page, "lamp", 140, 100);
  await expect(page.locator("[data-instance]")).toHaveCount(1);
  await page.getByRole("checkbox", { name: "Locked", exact: true }).uncheck();
  await page
    .getByRole("combobox", { name: "Sheet size", exact: true })
    .selectOption("A4");
  await page.getByRole("button", { name: "Portrait", exact: true }).click();
  const data = await project(page);
  expect(data.pages[0].widthMm).toBe(210);
  expect(data.pages[0].heightMm).toBe(297);
  const canvas = page.locator(".engineering-canvas");
  const before = await canvas.getAttribute("viewBox");
  await page.getByRole("button", { name: "+", exact: true }).click();
  expect(await canvas.getAttribute("viewBox")).not.toBe(before);
  await page.getByRole("button", { name: "Fit page", exact: true }).click();
  await expect(canvas).toHaveAttribute("viewBox", "0 0 210 297");
});
test("native clipboard survives deletion and undo restores the original graph", async ({
  page,
}) => {
  await create(page);
  await place(page, "coil", 80, 70);
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.locator("[data-instance]")).toHaveCount(0);
  await page.getByRole("button", { name: "Paste", exact: true }).click();
  await expect(page.locator("[data-instance]")).toHaveCount(1);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator("[data-instance]")).toHaveCount(0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator("[data-instance]")).toHaveCount(1);
});
for (const language of ["en", "de", "yo", "pcm"])
  test(`native editor stays inside mobile viewport in ${language}`, async ({
    page,
  }) => {
    const messages = JSON.parse(
      readFileSync(`packages/localization/${language}.json`, "utf8"),
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(
      (l) =>
        localStorage.setItem(
          "adiguneplanai.interface.v1",
          JSON.stringify({ language: l }),
        ),
      language,
    );
    await page.goto("/");
    await page
      .getByRole("button", { name: messages.newProject, exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: messages.newProject,
      exact: true,
    });
    await dialog
      .getByLabel(messages.projectName, { exact: true })
      .fill("Mobile");
    await dialog
      .getByRole("button", { name: messages.create, exact: true })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });

test("group selection, keyboard transforms, cross-page paste and panning persist real objects", async ({
  page,
}) => {
  await create(page);
  await place(page, "resistor", 80, 80);
  await place(page, "lamp", 140, 130);
  await page.getByRole("button", { name: "Select", exact: true }).click();
  await clickWorld(page, 80, 80);
  await page.keyboard.down("Shift");
  await clickWorld(page, 140, 130);
  await page.keyboard.up("Shift");
  await page.getByRole("button", { name: "Group", exact: true }).click();
  expect((await project(page)).groups).toHaveLength(1);
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  await page
    .getByRole("button", { name: "New drawing page", exact: true })
    .click();
  await page
    .locator(".drawing-tabs")
    .getByRole("button", { name: "Sheet 2", exact: true })
    .click();
  await page.getByRole("button", { name: "Paste", exact: true }).click();
  const data = await project(page);
  expect(data.symbolInstances).toHaveLength(4);
  expect(data.groups).toHaveLength(2);
  expect(
    data.symbolInstances.filter(
      (s: { pageId: string }) => s.pageId === data.pages[1].id,
    ),
  ).toHaveLength(2);
  await page.getByRole("button", { name: "Pan", exact: true }).click();
  const canvas = page.locator(".engineering-canvas");
  await canvas.scrollIntoViewIfNeeded();
  const before = await canvas.getAttribute("viewBox");
  const box = await canvas.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box!.x + box!.width / 2 + 30,
    box!.y + box!.height / 2 + 20,
  );
  await page.mouse.up();
  expect(await canvas.getAttribute("viewBox")).not.toBe(before);
  await page.getByRole("button", { name: "Fit page", exact: true }).click();
  await expect(canvas).toHaveAttribute("viewBox", "0 0 420 297");
});

test("junction insertion updates the real wire graph and BOM while navigator controls the active drawing", async ({
  page,
}) => {
  await create(page);
  await place(page, "resistor", 50, 50);
  await place(page, "lamp", 150, 50);
  await page.getByRole("button", { name: "Wire", exact: true }).click();
  await page.getByRole("button", { name: "R1:2", exact: true }).click();
  await page.getByRole("button", { name: "H1:1", exact: true }).click();
  await place(page, "junction", 100, 50);
  const data = await project(page);
  expect(data.wires).toHaveLength(2);
  expect(data.devices).toHaveLength(3);
  expect(data.wirePaths).toHaveLength(2);
  const bom = page.getByRole("region", {
    name: "Bill of materials",
    exact: true,
  });
  await expect(bom.locator("tbody tr")).toHaveCount(3);
  await expect(bom).toContainText("J1");
  await page
    .getByRole("button", { name: "New drawing page", exact: true })
    .click();
  await page
    .getByRole("region", { name: "Project navigator", exact: true })
    .getByRole("button", { name: "Sheet 2", exact: true })
    .click();
  await expect(
    page.getByRole("application", { name: "Sheet 2", exact: true }),
  ).toBeVisible();
});

test("desktop engineering workspace stays within the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1672, height: 941 });
  await create(page);
  await place(page, "resistor", 80, 80);
  await expect(
    page.getByRole("form", { name: "Properties", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= window.innerHeight,
    ),
  ).toBe(true);
});

test("cross-page net labels persist memberships and navigate to the real drawing", async ({
  page,
}) => {
  await create(page);
  await place(page, "resistor", 50, 50);
  async function label(pin: string) {
    await page.getByRole("button", { name: "Net label", exact: true }).click();
    await page.getByRole("button", { name: pin, exact: true }).click();
    await page.getByLabel("Label text", { exact: true }).fill("CONTROL_24V");
    await page.getByRole("button", { name: "Add label", exact: true }).click();
  }
  await label("R1:1");
  await page
    .getByRole("button", { name: "New drawing page", exact: true })
    .click();
  await page
    .locator(".drawing-tabs")
    .getByRole("button", { name: "Sheet 2", exact: true })
    .click();
  await place(page, "lamp", 50, 50);
  await label("H1:1");
  const data = await project(page);
  const net = data.nets.find((item: { labels: string[] }) =>
    item.labels.includes("CONTROL_24V"),
  );
  expect(net.terminalIds).toHaveLength(2);
  const panel = page.getByRole("region", { name: "Connectivity", exact: true });
  await panel
    .locator("summary")
    .filter({ hasText: /^Netlist/ })
    .click();
  await panel.getByRole("button", { name: "R1:1", exact: true }).click();
  await expect(
    page.getByRole("application", { name: "Sheet 1", exact: true }),
  ).toBeVisible();
  await panel.getByRole("button", { name: "H1:1", exact: true }).click();
  await expect(
    page.getByRole("application", { name: "Sheet 2", exact: true }),
  ).toBeVisible();
  await page.reload();
  expect(
    (await project(page)).nets.find(
      (item: { id: string }) => item.id === net.id,
    ).terminalIds,
  ).toEqual(net.terminalIds);
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator("input[type=file]").setInputFiles({
    name: "recompute.adeplan.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ ...data, nets: [], findings: [] })),
  });
  expect(
    (await project(page)).nets.find((item: { labels: string[] }) =>
      item.labels.includes("CONTROL_24V"),
    ).terminalIds,
  ).toEqual(net.terminalIds);
});
