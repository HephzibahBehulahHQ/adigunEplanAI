Warning: truncated output (original token count: 14838)
Total output lines: 1584

import {
  openComponentLibrary,
  openEditorTools,
  openWorkbenchPanel,
  selectMenuTab,
} from "./workbench.ts";
import { clickWirePin } from "../fixtures/click-wire-pin";
import { reloadAndReopenProject } from "../fixtures/reopen-project";
import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { nativeProject } from "../fixtures/native-project.mjs";
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
  await openEditorTools(page);
}
test("secondary home ribbon actions remain named when shown as icons", async ({
  page,
}) => {
  await create(page);
  await selectMenuTab(page, "Home");
  const ribbon = page.locator(
    '.workbench-command-popover .ribbon[data-tab="home"]',
  );
  const undo = ribbon.locator('[data-command="undo"]');
  await expect(undo).toHaveAttribute("data-icon-only", "true");
  await expect(undo).toHaveAttribute("title", "Undo");
  await expect(undo).toHaveAccessibleName("Undo · Home");
  await expect(undo.locator("span")).toBeHidden();

  const placement = ribbon.locator('[data-command="ribbonPlace"]');
  await expect(placement).not.toHaveAttribute("data-icon-only", "true");
  await expect(placement).toHaveAccessibleName("Place Component · Home");
  await expect(placement.locator("span")).toBeVisible();
});

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
  await openEditorTools(page);
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
  await reloadAndReopenProject(page);
  await openEditorTools(page);
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
  await page
    .getByRole("main", { name: "Workspace", exact: true })
    .getByRole("button", { name: "Wire", exact: true })
    .click();
  await page.getByRole("button", { name: "R1:2", exact: true }).click();
  await page.getByRole("button", { name: "H1:1", exact: true }).click();
  await page
    .getByRole("main", { name: "Workspace", exact: true })
    .getByRole("button", { name: "Select", exact: true })
    .click();
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
  await page
    .getByRole("button", { name: "Undo · Header", exact: true })
    .click();
  expect((await project(page)).wirePaths[0].points).toEqual(manual);
  await reloadAndReopenProject(page);
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
  await page
    .getByRole("main", { name: "Workspace", exact: true })
    .getByRole("button", { name: "Wire", exact: true })
    .click();
  await page.getByRole("button", { name: "R1:2", exact: true }).click();
  await page.getByRole("button", { name: "H1:1", exact: true }).click();
  await page
    .getByRole("main", { name: "Workspace", exact: true })
    .getByRole("button", { name: "Select", exact: true })
    .click();
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
  await reloadAndReopenProject(page);
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
  await expect(
    panel.getByRole("button", { name: "Errors (1)", exact: true }),
  ).toBeVisible();
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
  await page
    .getByRole("button", { name: "Undo · Header", exact: true })
    .click();
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
  await page
    .getByRole("main", { name: "Workspace", exact: true })
    .getByRole("button", { name: "Wire", exact: true })
    .click();
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
  await page
    .getByRole("main", { name: "Workspace", exact: true })
    .getByRole("button", { name: "Select", exact: true })
    .click();
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
  await page
    .getByRole("button", { name: "Undo · Header", exact: true })
    .click();
  await reloadAndReopenProject(page);
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
  await page
    .getByRole("main", { name: "Workspace", exact: true })
    .getByRole("button", { name: "Select", exact: true })
    .click();
  await clickWorld(page, 50, 50);
  await openWorkbenchPanel(page, "properties");
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
  await page
    .getByRole("button", { name: "Undo · Header", exact: true })
    .click();
  expect((await project(page)).devices[0].reference).toBe("R9");
});
test("property editing, labels, layer locks, sheet sizes and zoom change real state", async ({
  page,
}) => {
  await create(page);
  await place(page, "resistor", 50, 50);
  await page
    .getByRole("main", { name: "Workspace", exact: true })
    .getByRole("button", { name: "Select", exact: true })
    .click();
  await openWorkbenchPanel(page, "properties");
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
  await openEditorTools(page);
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
  await page
    .getByRole("button", { name: "Undo · Header", exact: true })
    .click();
  await expect(page.locator("[data-instance]")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Undo · Header", exact: true })
    .click();
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

test("drawing selection and exact coordinate edits preserve native geometry and history", async ({
  page,
}) => {
  const fixture = nativeProject();
  fixture.pages.push({
    ...fixture.pages[0],
    id: "sheet-2",
    name: "Sheet 2",
    order: 1,
  });
  fixture.symbolInstances[0].position = { x: 100, y: 100 };
  fixture.symbolInstances[1].position = { x: 180, y: 100 };
  fixture.wirePaths[0].points = [
    { x: 100, y: 100 },
    { x: 180, y: 100 },
  ];
  await page.goto("/");
  await page.getByLabel("Import project", { exact: true }).setInputFiles({
    name: "selection.adeplan",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(fixture)),
  });
  const canvas = page.locator(".engineering-canvas");
  await canvas.scrollIntoViewIfNeeded();
  const marqueePoints = () =>
    canvas.evaluate((element) => {
      const matrix = (element as SVGSVGElement).getScreenCTM()!;
      return [new DOMPoint(99, 85), new DOMPoint(120, 115)].map((point) => {
        const { x, y } = point.matrixTransform(matrix);
        return { x, y };
      });
    });
  const before = await project(page);
  const coordinates = page.locator(".status-coordinates");
  const [left] = await marqueePoints();
  await page.mouse.move(left.x, left.y);
  await expect(coordinates).toHaveText(/^X \d+\.\d{2} · Y \d+\.\d{2} mm$/);
  const [readX, readY] = (await coordinates.innerText())
    .match(/\d+\.\d+/g)!
    .map(Number);
  expect(Math.abs(readX - 99)).toBeLessThan(1);
  expect(Math.abs(readY - 85)).toBeLessThan(1);
  await page.locator(".app-header").hover();
  await expect(coordinates).toBeEmpty();
  await canvas.scrollIntoViewIfNeeded();
  const [marqueeLeft, marqueeRight] = await marqueePoints();
  for (const crossing of [false, true]) {
    const [start, end] = crossing
      ? [marqueeRight, marqueeLeft]
      : [marqueeLeft, marqueeRight];
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y);
    await expect(canvas.locator(".schematic-marquee")).toHaveAttribute(
      "data-crossing",
      String(crossing),
    );
    await page.mouse.up();
    await expect(
      canvas.locator('[data-instance][aria-pressed="true"]'),
    ).toHaveCount(crossing ? 1 : 0);
  }
  expect(await project(page)).toEqual(before);
  await openWorkbenchPanel(page, "properties");
  const props = page.getByRole("form", { name: "Prop…4838 tokens truncated…al");
      expect(pe.kind).toBe("pe");
      expect(
        data.nets.find((n: { terminalIds: string[] }) =>
          n.terminalIds.includes(neutral.id),
        ).pinIds,
      ).toHaveLength(4);
      expect(
        data.nets.find((n: { terminalIds: string[] }) =>
          n.terminalIds.includes(pe.id),
        ).pinIds,
      ).toHaveLength(4);
    }
    if (id === "isolator-three-pole-pe") {
      const pe = data.terminals.find((t: { kind: string }) => t.kind === "pe");
      expect(
        data.nets.find((n: { terminalIds: string[] }) =>
          n.terminalIds.includes(pe.id),
        ).pinIds,
      ).toHaveLength(2);
    }
    await reloadAndReopenProject(page);
    expect((await project(page)).nets).toEqual(data.nets);
  });

for (const [id, query, endpoint, count] of [
  ["ac-dc-supply", "AC/DC supply", "positive", 5],
  ["isolated-dc-dc", "isolated DC/DC", "OUT_positive", 4],
  ["dc-ac-inverter", "DC/AC inverter", "L_out", 5],
  ["ups-external-battery", "UPS interface", "L_out", 7],
] as const)
  test(`power interface ${id} retains independent ports and native wiring`, async ({
    page,
  }) => {
    await create(page);
    await openComponentLibrary(page);
    await page.locator(".component-library > summary").click();
    await page
      .locator(".component-library summary")
      .filter({ hasText: /^Engineering symbols$/ })
      .click();
    await page.getByLabel("Search symbols", { exact: true }).fill(query);
    await page.getByRole("button", { name: /^Import symbol:/ }).click();
    await page
      .getByRole("combobox", { name: "Custom symbols", exact: true })
      .selectOption(`library-${id}`);
    await clickWorld(page, 80, 80);
    let data = await project(page);
    expect(data.terminals).toHaveLength(count);
    expect(data.nets).toHaveLength(count);
    await place(page, "terminal", 160, 80);
    await page
      .getByRole("main", { name: "Workspace", exact: true })
      .getByRole("button", { name: "Wire", exact: true })
      .click();
    await page
      .getByRole("button", { name: `U1:${endpoint}`, exact: true })
      .click();
    await page.getByRole("button", { name: "X1:1", exact: true }).click();
    data = await project(page);
    expect(data.wires).toHaveLength(1);
    expect(data.nets).toHaveLength(count);
    await reloadAndReopenProject(page);
    expect((await project(page)).wires).toEqual(data.wires);
  });

for (const [id, query, endpoint, count] of [
  ["rcbo-two-pole", "RCBO", "L_out", 4],
  ["motor-protection-three-pole", "motor-protection switch", "L1_out", 6],
  ["surge-protector-l-pe", "surge protective", "L", 2],
  ["protection-relay-trip", "protection relay", "trip_NO", 7],
] as const)
  test(`protection interface ${id} keeps isolated ports through wiring and reload`, async ({
    page,
  }) => {
    await create(page);
    await openComponentLibrary(page);
    await page.locator(".component-library > summary").click();
    await page
      .locator(".component-library summary")
      .filter({ hasText: /^Engineering symbols$/ })
      .click();
    await page.getByLabel("Search symbols", { exact: true }).fill(query);
    await page
      .locator("li")
      .filter({ has: page.locator(`[data-library-preview="${id}"]`) })
      .getByRole("button", { name: /^Import symbol:/ })
      .click();
    await page
      .getByRole("combobox", { name: "Custom symbols", exact: true })
      .selectOption(`library-${id}`);
    await clickWorld(page, 80, 80);
    let data = await project(page);
    expect(data.terminals).toHaveLength(count);
    expect(data.nets).toHaveLength(count);
    await place(page, "terminal", 160, 80);
    await page
      .getByRole("main", { name: "Workspace", exact: true })
      .getByRole("button", { name: "Wire", exact: true })
      .click();
    await page
      .getByRole("button", { name: `U1:${endpoint}`, exact: true })
      .click();
    await page.getByRole("button", { name: "X1:1", exact: true }).click();
    data = await project(page);
    expect(data.wires).toHaveLength(1);
    expect(data.nets).toHaveLength(count);
    const joined = data.nets.find(
      (net: { terminalIds: string[] }) => net.terminalIds.length === 2,
    );
    expect(joined).toBeDefined();
    expect(
      data.nets.filter(
        (net: { terminalIds: string[] }) => net.terminalIds.length === 1,
      ),
    ).toHaveLength(count - 1);
    await reloadAndReopenProject(page);
    expect((await project(page)).wires).toEqual(data.wires);
    expect((await project(page)).nets).toEqual(data.nets);
  });

for (const [id, query, channel] of [
  ["digital-input-four", "digital input", "IN0"],
  ["digital-output-four", "digital output", "OUT0"],
  ["analog-input-two", "analog input", "IN0_plus"],
  ["analog-output-two", "analog output", "OUT0_plus"],
])
  test(`automation interface ${id} places and wires distinct native channels`, async ({
    page,
  }) => {
    await create(page);
    await openComponentLibrary(page);
    await page.locator(".component-library > summary").click();
    await page
      .locator(".component-library summary")
      .filter({ hasText: /^Engineering symbols$/ })
      .click();
    await page.getByLabel("Search symbols", { exact: true }).fill(query);
    await page
      .locator("li")
      .filter({ has: page.locator(`[data-library-preview="${id}"]`) })
      .getByRole("button")
      .click();
    await page
      .getByRole("combobox", { name: "Custom symbols", exact: true })
      .selectOption(`library-${id}`);
    await clickWorld(page, 80, 80);
    expect((await project(page)).terminals).toHaveLength(6);
    await place(page, "resistor", 150, 80);
    await page
      .getByRole("main", { name: "Workspace", exact: true })
      .getByRole("button", { name: "Wire", exact: true })
      .click();
    const fromPinId = await clickWirePin(page, `U1:${channel}`);
    const toPinId = await clickWirePin(page, "R1:1");
    const data = await project(page);
    expect(data.wires).toMatchObject([{ fromPinId, toPinId }]);
    expect(data.nets).toHaveLength(7);
    await reloadAndReopenProject(page);
    expect((await project(page)).wires).toEqual(data.wires);
  });

test("custom symbols create native pins that wire and survive undo and reload", async ({
  page,
}) => {
  await create(page);
  await openComponentLibrary(page);
  await page.locator(".component-library > summary").click();
  await page
    .locator(".component-library summary")
    .filter({ hasText: /^Custom symbols$/ })
    .click();
  const form = page.getByRole("form", { name: "Custom symbols", exact: true });
  await form.getByLabel("Symbol name", { exact: true }).fill("Interface");
  await form.getByLabel("Body width (mm)", { exact: true }).fill("20");
  await form.getByLabel("Body height (mm)", { exact: true }).fill("20");
  await form.getByLabel(/^Pins:/).fill("IN, -10, 0\nOUT, 10, 0");
  await form
    .getByLabel(/^Artwork in mm:/)
    .fill("line, -10, 0, 10, 0\ncircle, 0, 0, 4");
  await form.getByRole("button", { name: "Create", exact: true }).click();
  const definition = (await project(page)).symbolDefinitions.find(
    (d: { name: string }) => d.name === "Interface",
  );
  await page
    .getByRole("combobox", { name: "Custom symbols", exact: true })
    .selectOption(definition.id);
  await clickWorld(page, 80, 80);
  await expect(page.locator("[data-custom-artwork] line")).toHaveCount(1);
  await expect(page.locator("[data-custom-artwork] circle")).toHaveCount(1);
  await place(page, "lamp", 150, 80);
  await page
    .getByRole("main", { name: "Workspace", exact: true })
    .getByRole("button", { name: "Wire", exact: true })
    .click();
  await page.getByRole("button", { name: "U1:OUT", exact: true }).click();
  await page.getByRole("button", { name: "H1:1", exact: true }).click();
  expect((await project(page)).wires).toHaveLength(1);
  await page
    .getByRole("button", { name: "Undo · Header", exact: true })
    .click();
  expect((await project(page)).wires).toHaveLength(0);
  await page
    .getByRole("button", { name: "Redo · Header", exact: true })
    .click();
  await reloadAndReopenProject(page);
  await expect(
    page.getByRole("button", { name: "U1:IN", exact: true }),
  ).toBeVisible();
  expect((await project(page)).wires).toHaveLength(1);
  await openComponentLibrary(page);
  await page.locator(".component-library > summary").click();
  await page
    .locator(".component-library summary")
    .filter({ hasText: /^Custom symbols$/ })
    .click();
  await page
    .getByLabel("Edit custom symbol", { exact: true })
    .selectOption(definition.id);
  const editForm = page.getByRole("form", {
    name: "Custom symbols",
    exact: true,
  });
  await editForm.getByLabel("Body width (mm)", { exact: true }).fill("24");
  await editForm.getByLabel(/^Pins:/).fill("IN, -12, 0\nOUT, 12, 0");
  const old = (await project(page)).wires[0];
  await editForm.getByRole("button", { name: "Apply", exact: true }).click();
  expect((await project(page)).wires[0]).toEqual(old);
  expect((await project(page)).wirePaths[0].points[0].x).toBe(92);
  await page
    .getByRole("button", { name: "Undo · Header", exact: true })
    .click();
  expect(
    (await project(page)).symbolDefinitions.find(
      (d: { id: string }) => d.id === definition.id,
    ).widthMm,
  ).toBe(20);
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
  await page.locator(".workbench-add-sheet").click();
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
  await reloadAndReopenProject(page);
  expect(
    (await project(page)).nets.find(
      (item: { id: string }) => item.id === net.id,
    ).terminalIds,
  ).toEqual(net.terminalIds);
  const importAccepted = page
    .waitForEvent("dialog")
    .then((dialog) => dialog.accept());
  const importedName = `${data.name} imported`;
  await page.getByLabel("Import project", { exact: true }).setInputFiles({
    name: "recompute.adeplan.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({ ...data, name: importedName, nets: [], findings: [] }),
    ),
  });
  await importAccepted;
  await expect.poll(async () => (await project(page)).name).toBe(importedName);
  expect(
    (await project(page)).nets.find((item: { labels: string[] }) =>
      item.labels.includes("CONTROL_24V"),
    ).terminalIds,
  ).toEqual(net.terminalIds);
});

test("component comparison preserves selections through search and shows missing ratings explicitly", async ({
  page,
}) => {
  await create(page);
  await openComponentLibrary(page);
  await page.locator(".component-library > summary").click();
  await page
    .getByRole("checkbox", {
      name: "Select for comparison: Phoenix Contact 3004362",
      exact: true,
    })
    .check();
  await page
    .getByRole("checkbox", {
      name: "Select for comparison: Schneider Electric ZBE101",
      exact: true,
    })
    .check();
  const table = page.getByRole("table", {
    name: "Compare components",
    exact: true,
  });
  await expect(table).toBeVisible();
  const voltage = table.getByRole("row").filter({
    has: page.getByRole("rowheader", {
      name: "Nominal voltage",
      exact: true,
    }),
  });
  await expect(voltage.getByRole("cell")).toHaveText(["800 V", "Not declared"]);
  const section = table.getByRole("row").filter({
    has: page.getByRole("rowheader", {
      name: "Rated cross-section",
      exact: true,
    }),
  });
  await expect(section.getByRole("cell")).toHaveText(["4 mm²", "Not declared"]);
  await page.getByLabel("Search parts", { exact: true }).fill("ZBE101");
  await expect(
    table.getByRole("columnheader", {
      name: "Phoenix Contact 3004362",
      exact: true,
    }),
  ).toBeVisible();
  const card = page.getByRole("article", {
    name: "Schneider Electric ZBE101",
    exact: true,
  });
  await expect(
    card
      .locator("dt")
      .filter({ hasText: /^Rated cross-section$/ })
      .locator("+ dd"),
  ).toHaveText("Not declared");
  await expect(
    table.getByRole("link", { name: "3004362", exact: true }),
  ).toHaveAttribute("href", /^https:\/\/www\.phoenixcontact\.com\//);
  await page
    .getByRole("checkbox", {
      name: "Select for comparison: Schneider Electric ZBE101",
      exact: true,
    })
    .uncheck();
  await expect(table).toHaveCount(0);
  expect((await project(page)).manufacturerParts).toHaveLength(0);
  expect((await project(page)).devices).toHaveLength(0);
});

test("catalog filters, favorites and recent assignments persist without changing circuit topology", async ({
  page,
}) => {
  await create(page);
  await place(page, "terminal", 100, 100);
  const before = await project(page);
  await openComponentLibrary(page);
  const library = page.locator(".component-library");
  await library.locator(":scope > summary").click();
  await library
    .getByLabel("Minimum declared voltage (V)", { exact: true })
    .fill("1000");
  await expect(library.getByRole("article")).toHaveCount(1);
  await expect(library.getByRole("article")).toHaveAttribute(
    "aria-label",
    "Phoenix Contact 3044076",
  );
  await library
    .getByLabel("Minimum declared current (A)", { exact: true })
    .fill("25");
  await expect(library.getByRole("article")).toHaveCount(0);
  await library
    .getByLabel("Minimum declared voltage (V)", { exact: true })
    .fill("");
  await expect(library.getByRole("article")).toHaveCount(1);
  await library
    .getByRole("checkbox", {
      name: "Favorite: Phoenix Contact 3004362",
      exact: true,
    })
    .check();
  expect(await project(page)).toEqual(before);
  await reloadAndReopenProject(page);
  await library.locator(":scope > summary").click();
  await expect(
    library.getByRole("checkbox", {
      name: "Favorite: Phoenix Contact 3004362",
      exact: true,
    }),
  ).toBeChecked();
  await library
    .getByLabel("Catalog view", { exact: true })
    .selectOption("favorites");
  await expect(library.getByRole("article")).toHaveCount(1);
  await library.getByLabel("Catalog view", { exact: true }).selectOption("all");
  for (const part of ["3004362", "3044076", "3004362"]) {
    const card = library.getByRole("article", {
      name: `Phoenix Contact ${part}`,
      exact: true,
    });
    await card
      .getByLabel("Compatible device", { exact: true })
      .selectOption(before.devices[0].id);
    await card
      .getByRole("button", { name: "Assign part", exact: true })
      .click();
  }
  await reloadAndReopenProject(page);
  await library.locator(":scope > summary").click();
  await library
    .getByLabel("Catalog view", { exact: true })
    .selectOption("recent");
  await expect(library.getByRole("article")).toHaveCount(2);
  await expect(library.getByRole("article").nth(0)).toHaveAttribute(
    "aria-label",
    "Phoenix Contact 3004362",
  );
  await expect(library.getByRole("article").nth(1)).toHaveAttribute(
    "aria-label",
    "Phoenix Contact 3044076",
  );
  const after = await project(page);
  expect(after.pins).toEqual(before.pins);
  expect(after.wires).toEqual(before.wires);
  expect(after.devices[0].partId).toBeDefined();
  expect(after.schemaVersion).toBe(18);
  const terminalPart = after.manufacturerParts.find(
    (part: { partNumber: string }) => part.partNumber === "3044076",
  );
  expect(terminalPart.catalogSnapshot.dimensionsMm).toEqual({
    width: 5.2,
    height: 47.7,
    depth: 46.9,
  });
  expect(terminalPart.catalogSnapshot.mountedDepthsMm[1]).toEqual({
    rail: "NS 35/15",
    depth: 55,
  });
  expect(terminalPart.catalogSnapshot.sourceRevision).toBeUndefined();
});

test("corrupt catalog preferences remain intact until explicit reset without touching the project", async ({
  page,
}) => {
  await create(page);
  const before = await project(page);
  await page.evaluate(() =>
    localStorage.setItem("adiguneplanai.catalog-preferences.v1", "{broken"),
  );
  await reloadAndReopenProject(page);
  await openComponentLibrary(page);
  const library = page.locator(".component-library");
  await library.locator(":scope > summary").click();
  await expect(library.getByRole("alert")).toContainText(
    "Stored data has been preserved",
  );
  await expect(
    library.getByRole("checkbox", {
      name: "Favorite: Phoenix Contact 3004362",
      exact: true,
    }),
  ).toBeDisabled();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("adiguneplanai.catalog-preferences.v1"),
    ),
  ).toBe("{broken");
  expect(await project(page)).toEqual(before);
  await library
    .getByRole("button", { name: "Reset catalog preferences", exact: true })
    .click();
  await library
    .getByRole("checkbox", {
      name: "Favorite: Phoenix Contact 3004362",
      exact: true,
    })
    .check();
  await reloadAndReopenProject(page);
  await library.locator(":scope > summary").click();
  await expect(
    library.getByRole("checkbox", {
      name: "Favorite: Phoenix Contact 3004362",
      exact: true,
    }),
  ).toBeChecked();
  expect(await project(page)).toEqual(before);
});

test("catalog preference quota failure retains session favorites and reports unsaved state", async ({
  page,
}) => {
  await create(page);
  const before = await project(page);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "adiguneplanai.catalog-preferences.v1")
        throw new DOMException("Quota", "QuotaExceededError");
      original.call(this, key, value);
    };
  });
  const library = page.locator(".component-library");
  await openComponentLibrary(page);
  await library.locator(":scope > summary").click();
  await library
    .getByRole("checkbox", {
      name: "Favorite: Phoenix Contact 3004362",
      exact: true,
    })
    .check();
  await expect(library.getByRole("alert")).toContainText("could not be saved");
  await library
    .getByLabel("Catalog view", { exact: true })
    .selectOption("favorites");
  await expect(library.getByRole("article")).toHaveCount(1);
  expect(await project(page)).toEqual(before);
  await reloadAndReopenProject(page);
  await library.locator(":scope > summary").click();
  await expect(
    library.getByRole("checkbox", {
      name: "Favorite: Phoenix Contact 3004362",
      exact: true,
    }),
  ).not.toBeChecked();
});

// These suites exercise the optional full contextual editor controls.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const key = "adiguneplanai.interface.v1";
    const prefs = JSON.parse(localStorage.getItem(key) || "{}");
    localStorage.setItem(key, JSON.stringify({ ...prefs, compact: false }));
  });
});

