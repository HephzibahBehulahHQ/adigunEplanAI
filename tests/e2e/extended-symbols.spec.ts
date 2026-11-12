import { openComponentLibrary, openEditorTools } from "./workbench";
import { clickWirePin } from "../fixtures/click-wire-pin";
import { reloadAndReopenProject } from "../fixtures/reopen-project";
import { test, expect } from "@playwright/test";
const cases = [
  ["modular-controller-interface", "Modular controller", "supply", 2, 2],
  ["plc-cpu-serial", "PLC CPU", "I0", 8, 8],
  ["remote-io-four", "remote I/O", "CH0", 8, 8],
  ["communication-dual-serial", "Dual-port serial communication", "P2_A", 6, 6],
  ["timer-relay-changeover", "Timer relay", "out_NO", 6, 6],
  ["counter-relay-reset", "Counter relay", "pulse", 7, 7],
  ["solenoid-linear-actuator", "Solenoid linear", "A1", 2, 2],
  [
    "motor-single-phase-windings",
    "separate run and start windings",
    "U1",
    5,
    5,
  ],
  ["starter-three-phase-trip", "starter assembly", "L1_out", 10, 10],
  ["soft-starter-three-phase", "soft-starter", "RUN", 10, 10],
  ["safety-relay-two-channel", "Dual-channel safety", "CH1_in", 10, 10],
  ["dc-motor-controller", "DC motor controller", "M_plus", 7, 7],
  ["hmi-serial-interface", "Operator HMI", "bus_A", 5, 5],
  ["measurement-disconnect-terminal", "Measurement disconnect", "in", 2, 2],
  ["wall-switch-single-pole", "wall switch", "L_out", 2, 2],
  ["junction-box-empty", "junction-box housing", null, 0, 0],
  ["cable-four-core-shield", "shielded signal cable", "core1/out1", 5, 10],
  ["protective-bonding-clamp", "bonding clamp", "PE/bond", 1, 3],
  ["mcb-single-pole", "miniature circuit breaker", "out", 2, 2],
  ["mccb-three-pole", "molded-case circuit breaker", "L1_out", 6, 6],
  ["plug-two-pole", "Two-pole plug", "pole1/mate1", 2, 4],
  ["socket-two-pole", "Two-pole socket", "pole1/mate1", 2, 4],
  [
    "industrial-serial-bridge",
    "industrial serial network bridge",
    "P2_A",
    7,
    7,
  ],
] as const;
for (const [id, query, endpoint, nodes, pinCount] of cases)
  test(`native library interface ${id} preserves its connection schema`, async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "New project", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "New project",
      exact: true,
    });
    await dialog
      .getByLabel("Project name", { exact: true })
      .fill(`Interface ${id}`);
    await dialog.getByRole("button", { name: "Create", exact: true }).click();
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
    const canvas = page.locator(".engineering-canvas");
    const click = async (x: number, y: number) => {
      await canvas.scrollIntoViewIfNeeded();
      const point = await canvas.evaluate(
        (svg, p) => {
          const screen = new DOMPoint(p.x, p.y).matrixTransform(
            (svg as SVGSVGElement).getScreenCTM()!,
          );
          return { x: screen.x, y: screen.y };
        },
        { x, y },
      );
      await page.mouse.click(point.x, point.y);
    };
    const project = () =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("adiguneplanai.projects.v1")!)
            .projects[0],
      );
    await click(100, 100);
    let data = await project();
    expect(data.terminals).toHaveLength(nodes);
    expect(data.pins).toHaveLength(pinCount);
    expect(data.nets).toHaveLength(nodes);
    if (endpoint) {
      await openEditorTools(page);
      await page
        .getByRole("combobox", { name: "Symbols", exact: true })
        .selectOption("terminal");
      await click(240, 100);
      await page.getByRole("button", { name: "Wire", exact: true }).click();
      const fromPinId = await clickWirePin(page, `U1:${endpoint}`);
      const toPinId = await clickWirePin(page, "X1:1");
      data = await project();
      expect(data.wires).toMatchObject([{ fromPinId, toPinId }]);
      expect(data.nets).toHaveLength(nodes);
    } else {
      expect(data.devices[0].reference).toBe("ME1");
      expect(data.wires).toHaveLength(0);
    }
    await reloadAndReopenProject(page);
    expect((await project()).pins).toEqual(data.pins);
    expect((await project()).nets).toEqual(data.nets);
    expect((await project()).wires).toEqual(data.wires);
  });

// These suites exercise the optional full contextual editor controls.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const key = "adiguneplanai.interface.v1";
    const prefs = JSON.parse(localStorage.getItem(key) || "{}");
    localStorage.setItem(key, JSON.stringify({ ...prefs, compact: false }));
  });
});
