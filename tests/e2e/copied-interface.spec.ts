import { test, expect } from "@playwright/test";
import fs from "node:fs";
import crypto from "node:crypto";
import type { Page } from "@playwright/test";

test("sourced feeder parts use the existing library and preserve editable settings", async ({
  page,
}) => {
  test.setTimeout(90000);
  page.setDefaultTimeout(8000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#newProjectName").fill("Feeder component review");
  await page.locator("#createProject").click();
  await addSectionSheet(page);
  const parts = [
    "siemens-3rt2027-2kb40",
    "siemens-3ru2126-4bb0",
    "siemens-3rv2321-4bc10",
  ];
  for (const [index, id] of parts.entries()) {
    if (await page.locator("#closeRightPanel").isVisible())
      await page.locator("#closeRightPanel").click();
    await page.locator('[data-module="Electrical"]').click();
    await page.getByRole("menuitem", { name: /Symbol Library$/ }).click();
    await page.locator("#symbolSearch").fill(id);
    await page.locator('[data-insert="' + id + '"]').click();
    await page
      .locator("#drawing")
      .click({ position: { x: 240 + index * 210, y: 260 } });
    await page.locator('[data-draw="select"]').click();
    await page.locator("#userDrawings .drawing-object").last().click();
    await page.locator('[data-inspector="Properties"]').click();
    if (id === "siemens-3ru2126-4bb0") {
      await page
        .locator('[data-component-property="overloadSettingA"]')
        .fill("15.2");
      await page
        .locator('[data-component-property="overloadSettingA"]')
        .press("Tab");
    }
    if (id === "siemens-3rv2321-4bc10") {
      await expect(
        page.locator('[data-component-property="overloadSettingA"]'),
      ).toHaveCount(0);
      await expect(
        page.getByText("None — separate overload relay required", {
          exact: true,
        }),
      ).toBeVisible();
    }
  }
  const saved = await saveDrawing(page, "feeder-parts");
  expect(
    saved.data.objects
      .filter((o: { kind: string }) => o.kind === "component-instance")
      .map((o: { componentId: string }) => o.componentId),
  ).toEqual(parts);
  expect(
    saved.data.objects.find(
      (o: { componentId: string }) => o.componentId === parts[1],
    ).properties.overloadSettingA,
  ).toBe(15.2);
  await page.reload();
  await page.locator("#openFile").setInputFiles(saved.path);
  const reopened = await saveDrawing(page, "feeder-parts-reopened");
  expect(reopened.data.objects).toEqual(saved.data.objects);
  expect(errors).toEqual([]);
});

test("example copy remains a native editable project through replacement and local reopen", async ({
  page,
}) => {
  test.setTimeout(90000);
  page.setDefaultTimeout(8000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#projectTemplate").selectOption("eng0601");
  await page.locator("#newProjectName").fill("My editable pump project");
  await page.locator("#createProject").click();
  const initial = await saveDrawing(page, "editable-original");
  const component = (ref: string) =>
    initial.data.objects.find((o: { ref: string }) => o.ref === ref);
  const select = async (id: string) => {
    await page.locator('[data-draw="select"]').click();
    await page.locator('[data-inspector="Properties"]').click();
    await page.locator('[data-object="' + id + '"]').click();
  };
  const edit = async (selector: string, value: string) => {
    await page.locator(selector).fill(value);
    await page.locator(selector).press("Tab");
  };
  await page.locator('[data-sheet="eng0601-a2-0"]').first().click();
  const k1 = component("K1"),
    x1 = component("X1:1");
  await select(k1.id);
  await edit('[data-component-property="ref"]', "KM-PUMP");
  await edit("[data-component-displayname]", "Pump contactor");
  await edit('[data-component-property="comment"]', "Workshop copy reviewed");
  await edit('[data-object-coordinate="x"]', "430");
  await page.locator("[data-rotate-object]").click();
  await page.locator('[data-action="palette"]').click();
  await page.locator('[data-color="#164eac"]').click();
  await page.keyboard.press("Escape");
  await select(x1.id);
  await page
    .getByLabel("Replacement component", { exact: true })
    .selectOption("phoenix-contact-3044076");
  await page.locator("[data-replace-component]").click();
  await page
    .locator('[data-object="' + x1.id + '"]')
    .click({ button: "right" });
  await page.locator('[data-object-command="duplicate"]').click();
  const duplicated = await saveDrawing(page, "editable-duplicated");
  expect(duplicated.data.objects.length).toBe(initial.data.objects.length + 1);
  const copy = duplicated.data.objects.find(
    (o: { id: string }) =>
      !initial.data.objects.some(
        (original: { id: string }) => original.id === o.id,
      ),
  );
  await select(copy.id);
  await page.locator("[data-delete-object]").click();
  const deleted = await saveDrawing(page, "editable-copy-deleted");
  expect(deleted.data.objects.length).toBe(initial.data.objects.length);
  await page.locator('[data-sheet="eng0601-a2-1"]').first().click();
  const f2 = component("F2");
  await select(f2.id);
  await edit('[data-component-property="overloadSettingA"]', "15.2");
  const wire = initial.data.objects.find(
    (o: {
      kind: string;
      sheetId: string;
      attachments?: { end?: { instanceId: string } };
    }) =>
      o.kind === "wire" &&
      o.sheetId === f2.sheetId &&
      o.attachments?.end?.instanceId === f2.id,
  );
  const point = await sheetPoint(page, wire.x1, (wire.y1 + wire.y2) / 2);
  await page.mouse.click(point.x, point.y);
  await edit("[data-wire-label]", "L1 workshop");
  await page.getByLabel("end terminal", { exact: true }).selectOption("");
  await page
    .getByLabel("end terminal", { exact: true })
    .selectOption(f2.id + "|" + wire.attachments.end.pinId);
  await edit("[data-connection-label]", "L1 checked continuation");
  const saved = await saveDrawing(page, "editable-modified");
  const editedK1 = saved.data.objects.find(
    (o: { id: string }) => o.id === k1.id,
  );
  expect(editedK1).toMatchObject({
    ref: "KM-PUMP",
    displayName: "Pump contactor",
    x: 430,
    rotation: 90,
    stroke: "#164eac",
    properties: { comment: "Workshop copy reviewed" },
  });
  expect(
    saved.data.objects.find((o: { id: string }) => o.id === x1.id).componentId,
  ).toBe("phoenix-contact-3044076");
  expect(
    saved.data.objects.find((o: { id: string }) => o.id === f2.id).properties
      .overloadSettingA,
  ).toBe(15.2);
  expect(
    saved.data.objects.find((o: { id: string }) => o.id === wire.id),
  ).toMatchObject({
    conductorId: "L1 workshop",
    attachments: wire.attachments,
  });
  expect(
    saved.data.crossSheetConnections.some(
      (c: { name: string }) => c.name === "L1 checked continuation",
    ),
  ).toBe(true);
  await page.reload();
  await page.locator("#openFile").setInputFiles(saved.path);
  const reopened = await saveDrawing(page, "editable-reopened");
  expect(reopened.data.objects).toEqual(saved.data.objects);
  expect(reopened.data.crossSheetConnections).toEqual(
    saved.data.crossSheetConnections,
  );
  expect(reopened.data.sheets).toEqual(saved.data.sheets);
  expect(reopened.data.project).toBe("My editable pump project");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#projectTemplate").selectOption("eng0601");
  await page.locator("#createProject").click();
  const fresh = await saveDrawing(page, "editable-fresh-template");
  const canonicalObjects = (
    objects: Array<{
      id: string;
      attachments?: Record<string, { instanceId: string; pinId: string }>;
    }>,
  ) =>
    objects.map((object, index) => ({
      ...object,
      id: index,
      attachments: object.attachments
        ? Object.fromEntries(
            Object.entries(object.attachments).map(([end, pin]) => [
              end,
              {
                ...pin,
                instanceId: objects.findIndex((o) => o.id === pin.instanceId),
              },
            ]),
          )
        : undefined,
    }));
  expect(canonicalObjects(fresh.data.objects)).toEqual(
    canonicalObjects(initial.data.objects),
  );
  expect(errors).toEqual([]);
});

test("manufacturer pressure switch inserts through existing library and preserves its terminal interface", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#createProject").click();
  await addSectionSheet(page);
  await page.locator('[data-module="Electrical"]').click();
  await page.getByRole("menuitem", { name: /Symbol Library$/ }).click();
  await page.locator("#symbolSearch").fill("XMLB004A2S11");
  await page.locator('[data-insert="telemecanique-xmlb004a2s11"]').click();
  const point = await sheetPoint(page, 400, 300);
  await page.mouse.click(point.x, point.y);
  await expect(page.locator("#userDrawings [data-terminal]")).toHaveCount(4);
  const saved = await saveDrawing(page, "xmlb-pressure");
  expect(saved.data.objects[0].componentId).toBe("telemecanique-xmlb004a2s11");
  await page.reload();
  await page.locator("#openFile").setInputFiles(saved.path);
  await expect(page.locator("#userDrawings [data-terminal]")).toHaveCount(4);
  const reopened = await saveDrawing(page, "xmlb-reopened");
  expect(reopened.data.objects).toEqual(saved.data.objects);
  delete reopened.data.objects[0].properties.risingPressureBar;
  delete reopened.data.objects[0].properties.fallingPressureBar;
  await page.locator("#openFile").setInputFiles({
    name: "legacy-pressure.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(reopened.data)),
  });
  await page.locator('[data-inspector="Properties"]').click();
  await page.locator("#userDrawings .drawing-object").first().click();
  await page.locator('[data-component-property="risingPressureBar"]').fill("2");
  await page
    .locator('[data-component-property="risingPressureBar"]')
    .press("Tab");
  await page
    .locator('[data-component-property="fallingPressureBar"]')
    .fill("1");
  await page
    .locator('[data-component-property="fallingPressureBar"]')
    .press("Tab");
  const configured = await saveDrawing(page, "pressure-configured");
  expect(configured.data.objects[0].properties).toMatchObject({
    risingPressureBar: 2,
    fallingPressureBar: 1,
  });
  await page
    .locator('[data-component-property="fallingPressureBar"]')
    .fill("3");
  expect(
    await page
      .locator('[data-component-property="fallingPressureBar"]')
      .evaluate((field: HTMLInputElement) => field.validationMessage),
  ).toContain("Falling pressure must be lower");
  await page
    .locator('[data-component-property="fallingPressureBar"]')
    .fill("1");
  await page
    .locator('[data-component-property="fallingPressureBar"]')
    .press("Tab");
  await page.reload();
  await page.locator("#openFile").setInputFiles(configured.path);
  const configuredAgain = await saveDrawing(
    page,
    "pressure-configured-reopened",
  );
  expect(configuredAgain.data.objects).toEqual(configured.data.objects);
});

test("ENG-0601 opens authored paper documents without overlaps and roundtrips edits", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#projectTemplate").selectOption("eng0601");
  await page.locator("#newProjectName").fill("ENG-0601 development");
  await page.locator("#createProject").click();
  await expect(page.locator("[data-project-section]")).toHaveCount(4);
  await expect(page.locator("#projectTree [data-sheet]")).toHaveCount(17);
  await expect(page.locator("#userDrawings .drawing-object")).toHaveCount(0);
  for (let i = 0; i < 8; i++) {
    await page
      .locator(
        '[data-sheet="eng0601-' +
          (i < 6 ? "a1-" + i : i === 6 ? "a2-6" : "a2-9") +
          '"]',
      )
      .first()
      .click();
    const layout = await page
      .locator("#userDrawings .drawing-object")
      .evaluateAll((nodes) => {
        const boxes = nodes.map((node) =>
          (node as SVGGraphicsElement).getBBox(),
        );
        return {
          outside: boxes.filter(
            (b) =>
              b.x < 26 ||
              b.y < 25 ||
              b.x + b.width > 1174 ||
              b.y + b.height > 560,
          ).length,
          overlaps: boxes.some((a, i) =>
            boxes
              .slice(i + 1)
              .some(
                (b) =>
                  a.x < b.x + b.width &&
                  a.x + a.width > b.x &&
                  a.y < b.y + b.height &&
                  a.y + a.height > b.y,
              ),
          ),
        };
      });
    expect(layout).toEqual({ outside: 0, overlaps: false });
  }
  await expect(page.locator("#userDrawings")).toContainText(
    "NATIVE NET SNAPSHOT",
  );
  await expect(page.locator("#userDrawings")).toContainText("Q2 / 1L1");
  await page.screenshot({
    path: test.info().outputPath("eng0601-field-terminals.png"),
  });
  const tabs = await page
    .locator("#sheetTabs .document-tab[data-sheet]")
    .evaluateAll((nodes) =>
      nodes.map((node) => {
        const title = node.querySelector(
          "[data-sheet-tab-title]",
        ) as HTMLElement;
        const close = node.querySelector(".tab-close") as HTMLElement;
        const bounds = node.getBoundingClientRect(),
          text = title.getBoundingClientRect(),
          button = close.getBoundingClientRect();
        return {
          contained:
            text.left >= bounds.left &&
            text.right <= button.left &&
            button.right <= bounds.right,
          overflow: getComputedStyle(title).overflow,
          fullTitle: node.getAttribute("title") === title.textContent?.trim(),
          height: Math.round(bounds.height),
        };
      }),
    );
  expect(tabs).toHaveLength(8);
  for (const tab of tabs)
    expect(tab).toEqual({
      contained: true,
      overflow: "hidden",
      fullTitle: true,
      height: 27,
    });
  const saved = await saveDrawing(page, "eng0601");
  expect(saved.data.sheets).toHaveLength(17);
  expect(saved.data.sections).toHaveLength(4);
  expect(
    saved.data.objects
      .filter((o: { sheetId: string }) => o.sheetId.includes("-a1-"))
      .every((o: { kind: string }) => o.kind === "text"),
  ).toBe(true);
  saved.data.objects.find(
    (o: { id: string }) => o.id === "eng0601-p0-r0",
  ).text = "Reviewed project scope";
  await page.locator('[data-sheet="eng0601-a2-0"]').first().click();
  await expect(page.locator(".cross-sheet-connector")).toHaveCount(16);
  const feederReferenceOverlap = await page
    .locator(".cross-sheet-connector text")
    .evaluateAll((nodes) => {
      const boxes = nodes.map((node) => node.getBoundingClientRect());
      return boxes.some((a, i) =>
        boxes
          .slice(i + 1)
          .some(
            (b) =>
              Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5 &&
              Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5,
          ),
      );
    });
  expect(feederReferenceOverlap).toBe(false);
  await page.locator(".cross-sheet-connector").first().press("Enter");
  await expect(page.locator("#userDrawings")).toContainText("MOTOR FEEDER");
  await expect(page.locator("#userDrawings [data-terminal]")).toHaveCount(6);
  await expect(page.locator(".cross-sheet-connector")).toHaveCount(6);
  await page.screenshot({ path: test.info().outputPath("eng0601-feeder.png") });
  await page.locator(".cross-sheet-connector").first().press("Enter");
  await expect(page.locator("#userDrawings")).toContainText(
    "PANEL POWER SEGMENT",
  );
  await page
    .locator(".cross-sheet-connector")
    .filter({ hasText: /F2/ })
    .first()
    .press("Enter");
  await expect(page.locator("#userDrawings")).toContainText(
    "PANEL OVERLOAD SEGMENT",
  );
  await expect(page.locator("#userDrawings [data-terminal]")).toHaveCount(10);
  for (const terminal of ["95", "96", "97", "98"])
    await expect(
      page.locator('#userDrawings [data-terminal="' + terminal + '"]'),
    ).toBeVisible();
  await page.locator(".cross-sheet-connector").first().press("Enter");
  await expect(page.locator("#userDrawings")).toContainText(
    "PANEL POWER SEGMENT",
  );
  await page.screenshot({ path: test.info().outputPath("eng0601-power.png") });
  await page.locator('[data-sheet="eng0601-a2-8"]').first().click();
  await expect(page.locator("#userDrawings")).toContainText("COMMON ISOLATION");
  await expect(page.locator("#userDrawings [data-terminal]")).toHaveCount(8);
  await expect(page.locator('#userDrawings [data-terminal="N"]')).toHaveCount(
    2,
  );
  await expect(page.locator(".cross-sheet-connector")).toHaveCount(5);
  await page.screenshot({
    path: test.info().outputPath("eng0601-main-isolation.png"),
  });
  await page
    .locator(".cross-sheet-connector")
    .filter({ hasText: "ISO-N" })
    .press("Enter");
  await expect(page.locator("#userDrawings")).toContainText("AUXILIARY SUPPLY");
  await page.locator('[data-sheet="eng0601-a2-2"]').first().click();
  await expect(page.locator("#userDrawings [data-terminal]")).toHaveCount(17);
  await page.screenshot({
    path: test.info().outputPath("eng0601-field-motor.png"),
  });
  await page.locator('[data-sheet="eng0601-a2-3"]').first().click();
  await expect(page.locator("#userDrawings")).toContainText("S0 · STOP (NC)");
  await expect(page.locator(".cross-sheet-connector")).toHaveCount(12);
  await page.screenshot({
    path: test.info().outputPath("eng0601-control.png"),
  });
  await page.locator('[data-sheet="eng0601-a2-10"]').first().click();
  await expect(page.locator("#userDrawings")).toContainText("PANEL X5");
  await expect(page.locator(".cross-sheet-connector")).toHaveCount(9);
  for (const ref of ["X5:1", "X5:2", "X5:3", "X5:4"])
    await expect(page.locator("#userDrawings")).toContainText(ref);
  await page.screenshot({
    path: test.info().outputPath("eng0601-field-control.png"),
  });
  await page
    .locator(".cross-sheet-connector")
    .filter({ hasText: "B1-FEED" })
    .press("Enter");
  await expect(page.locator("#userDrawings")).toContainText(
    "B1 · pressure permissive",
  );
  await page.locator('[data-sheet="eng0601-a2-4"]').first().click();
  await expect(page.locator("#userDrawings")).toContainText("AUXILIARY SUPPLY");
  const protector = saved.data.objects.find(
    (o: { ref: string }) => o.ref === "F4",
  );
  await page.locator('[data-inspector="Properties"]').click();
  await page
    .locator('.drawing-object[data-object="' + protector.id + '"]')
    .click();
  await page.getByLabel("Channel current (A)", { exact: true }).fill("2");
  await page.getByLabel("Channel current (A)", { exact: true }).press("Tab");
  const editedSupply = await saveDrawing(page, "auxiliary-edited");
  expect(
    editedSupply.data.objects.find((o: { ref: string }) => o.ref === "F4")
      .properties.channelCurrentA,
  ).toBe(2);
  await page.screenshot({
    path: test.info().outputPath("eng0601-auxiliary.png"),
  });
  await page.locator('[data-sheet="eng0601-a2-5"]').first().click();
  await expect(page.locator("#userDrawings [data-terminal]")).toHaveCount(4);
  const lampTextOverlaps = await page
    .locator("#userDrawings .drawing-object")
    .evaluateAll((nodes) =>
      nodes
        .filter((node) => node.querySelector("[data-terminal]"))
        .some((node) => {
          const boxes = Array.from(node.querySelectorAll("text")).map((text) =>
            text.getBBox(),
          );
          return boxes.some((a, i) =>
            boxes
              .slice(i + 1)
              .some(
                (b) =>
                  a.x < b.x + b.width &&
                  a.x + a.width > b.x &&
                  a.y < b.y + b.height &&
                  a.y + a.height > b.y,
              ),
          );
        }),
    );
  expect(lampTextOverlaps).toBe(false);
  const lamp = saved.data.objects.find((o: { ref: string }) => o.ref === "H1");
  await page.locator('.drawing-object[data-object="' + lamp.id + '"]').click();
  await page.getByLabel("Legend", { exact: true }).fill("MY CONTROL VOLTAGE");
  await page.getByLabel("Legend", { exact: true }).press("Tab");
  const editedIndication = await saveDrawing(page, "indication-edited");
  expect(
    editedIndication.data.objects.find((o: { ref: string }) => o.ref === "H1")
      .properties.legend,
  ).toBe("MY CONTROL VOLTAGE");
  await page.reload();
  await page.locator("#openFile").setInputFiles(editedIndication.path);
  await page.locator('[data-sheet="eng0601-a2-5"]').first().click();
  await page.locator('[data-inspector="Properties"]').click();
  await page.locator('.drawing-object[data-object="' + lamp.id + '"]').click();
  await expect(page.getByLabel("Legend", { exact: true })).toHaveValue(
    "MY CONTROL VOLTAGE",
  );
  const reopenedIndication = await saveDrawing(page, "indication-reopened");
  expect(reopenedIndication.data.objects).toEqual(
    editedIndication.data.objects,
  );
  expect(reopenedIndication.data.crossSheetConnections).toEqual(
    editedIndication.data.crossSheetConnections,
  );
  await page.screenshot({
    path: test.info().outputPath("eng0601-indication.png"),
  });
  await page.reload();
  await page.locator("#openFile").setInputFiles({
    name: "eng0601.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(saved.data)),
  });
  await page.locator('[data-sheet="eng0601-a1-0"]').first().click();
  await expect(page.locator("#userDrawings")).toContainText(
    "Reviewed project scope",
  );
  await page.screenshot({
    path: test.info().outputPath("eng0601-overview.png"),
  });
});

test("title block edits propagate shared fields and retain sheet overrides", async ({
  page,
}) => {
  page.setDefaultTimeout(5000);
  await page.goto("/");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#createProject").click();
  await addSectionSheet(page, "A1");
  await page.locator("#customSheetFrame rect").last().dblclick();
  await page
    .getByLabel("Project manager", { exact: true })
    .fill("Manager example");
  await page.getByLabel("Project manager", { exact: true }).press("Tab");
  await page.getByLabel("Sheet revision", { exact: true }).fill("02");
  await page.getByLabel("Sheet revision", { exact: true }).press("Tab");
  await expect(page.locator("#customSheetFrame")).toContainText(
    "Manager example",
  );
  const first = await page
    .locator("#projectTree [data-sheet]")
    .first()
    .getAttribute("data-sheet");
  await addSectionSheet(page, "A2");
  await expect(page.locator("#customSheetFrame")).toContainText(
    "Manager example",
  );
  await expect(page.locator("#customSheetFrame")).not.toContainText(
    "Revision: 02",
  );
  await page.locator('#projectTree [data-sheet="' + first + '"]').click();
  const saved = await saveDrawing(page, "title-block");
  expect(saved.data.metadata.manager).toBe("Manager example");
  expect(saved.data.sheets[0].metadata.revision).toBe("02");
  await page.reload();
  await page.locator("#openFile").setInputFiles(saved.path);
  await expect(page.locator("#customSheetFrame")).toContainText("Revision: 02");
  await expect(page.locator("#customSheetFrame")).toContainText(
    "Hephzibah Behulah",
  );
});

test("paper sheets support multiline writing, formatting and saved editing", async ({
  page,
}) => {
  page.setDefaultTimeout(5000);
  page.on("pageerror", (error) => {
    throw error;
  });
  await page.goto("/");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#createProject").click();
  await addSectionSheet(page, "A1");
  await page.locator('[data-draw="text"]').click();
  const point = await sheetPoint(page, 220, 220);
  await page.mouse.click(point.x, point.y);
  const editor = page.getByRole("textbox", {
    name: "Write on sheet",
    exact: true,
  });
  const note =
    "Project overview\nScope: " + "Editable documentation. ".repeat(12);
  await editor.fill(note);
  await editor.press("Control+Enter");
  await page.getByLabel("Text size", { exact: true }).fill("24");
  await page.getByLabel("Text size", { exact: true }).press("Tab");
  await page.getByLabel("Text bold", { exact: true }).check();
  await page.getByLabel("Text italic", { exact: true }).check();
  await page.getByLabel("Text underline", { exact: true }).check();
  await page.getByLabel("Text font", { exact: true }).selectOption("Georgia");
  await page
    .getByLabel("Text alignment", { exact: true })
    .selectOption("middle");
  await page.getByLabel("Text colour", { exact: true }).fill("#cc3300");
  const text = page.locator("#userDrawings text.drawing-object");
  await expect(text).toHaveAttribute("font-size", "24");
  await expect(text).toHaveAttribute("font-weight", "700");
  await expect(text).toHaveAttribute("fill", "#cc3300");
  expect(await text.locator("tspan").count()).toBeGreaterThan(2);
  const firstId = await page
    .locator("#projectTree [data-sheet]")
    .first()
    .getAttribute("data-sheet");
  await addSectionSheet(page, "A2");
  await expect(page.locator("#userDrawings .drawing-object")).toHaveCount(0);
  await page.locator('#projectTree [data-sheet="' + firstId + '"]').click();
  await expect(text).toHaveAttribute("font-family", "Georgia");
  const saved = await saveDrawing(page, "formatted-paper");
  expect(saved.data.objects[0].text).toBe(note);
  expect(saved.data.objects[0].italic).toBe(true);
  await page.reload();
  await page.locator("#openFile").setInputFiles(saved.path);
  await expect(text).toHaveAttribute("text-decoration", "underline");
  await text.locator("tspan").first().dblclick();
  await editor.fill(note + "\nHandover notes");
  await editor.press("Control+Enter");
  const edited = await saveDrawing(page, "edited-paper");
  expect(edited.data.objects[0].text).toBe(note + "\nHandover notes");
});

test("approved interface branding and menu overlay remain intact", async ({
  page,
}) => {
  const source = fs.readFileSync("apps/web/index.html", "utf8");
  expect(
    crypto
      .createHash("sha256")
      .update(source.match(/<style>[\s\S]*?<\/style>/g)!.join(""))
      .digest("hex"),
  ).toBe("e74748cfcb584a2be56e86f0aa52d959947718daf9ed4caaf773191ebfd96b29");
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page).toHaveTitle("AdigunEplanAI — Electrical CAD Workspace");
  await expect(page.locator(".brandname")).toHaveText("AdigunEplanAI");
  const logo = page.getByRole("img", { name: "HB Elektroniker" });
  await expect(logo).toBeVisible();
  await expect(page.locator(".topbar")).toBeVisible();
  await expect(page.locator(".toolbar")).toBeVisible();
  await expect(page.locator(".drawing")).toBeVisible();
  for (let visit = 0; visit < 2; visit++) {
    await expect(page.locator("[data-project-section]")).toHaveCount(0);
    await expect(page.locator("#projectTree [data-sheet]")).toHaveCount(0);
    await expect(page.locator("#sheetTabs [data-sheet]")).toHaveCount(0);
    await expect(page.locator("#projectTree")).toBeEmpty();
    await expect(page.locator("#sheetDesign")).toBeHidden();
    await expect(page.locator("#projectTree")).not.toContainText("Z0010000");
    if (visit === 0) await page.reload();
  }
  const before = await page.locator(".drawing").boundingBox();
  await page.locator('[data-module="Electrical"]').click();
  await expect(page.locator("#moduleMenu")).toBeVisible();
  expect(await page.locator(".drawing").boundingBox()).toEqual(before);
  await page.screenshot({
    path: test.info().outputPath("copied-autocad-interface.png"),
  });
  await page.keyboard.press("Escape");
  await expect(page.locator("#moduleMenu")).toBeHidden();
  expect(errors).toEqual([]);
});

async function sheetPoint(page: Page, x: number, y: number) {
  return page.locator("#drawing").evaluate(
    (element, point) => {
      const svg = element as SVGSVGElement;
      const converted = new DOMPoint(point.x, point.y).matrixTransform(
        svg.getScreenCTM()!,
      );
      return { x: converted.x, y: converted.y };
    },
    { x, y },
  );
}

async function saveDrawing(page: Page, name: string) {
  const event = page.waitForEvent("download", { timeout: 5000 });
  await page
    .getByRole("button", { name: "Save project locally", exact: true })
    .click();
  const download = await event;
  const path = test.info().outputPath(name + ".adigun.json");
  await download.saveAs(path);
  return { path, data: JSON.parse(fs.readFileSync(path, "utf8")) };
}

async function addSectionSheet(page: Page, section = "A2") {
  await page.locator('[data-project-section="' + section + '"]').click();
  await page.locator("#newSheet").click();
  await page.locator("#sheetDialog [data-new-sheet]").first().click();
  await page
    .locator('[data-section-container="' + section + '"] [data-sheet]')
    .last()
    .click();
}

test("new project wires attach to terminals, follow edits, undo and reopen", async ({
  page,
}) => {
  page.setDefaultTimeout(5000);
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#newProjectName").fill("Bench circuit");
  await page.locator("#createProject").click();
  await addSectionSheet(page);
  await page.locator('[data-module="Electrical"]').click();
  await page.getByRole("menuitem", { name: /Symbol Library$/ }).click();
  for (const [id, x] of [
    ["terminal", 200],
    ["resistor", 350],
  ] as const) {
    await page.locator("#symbolSearch").fill("eplan-" + id);
    await page.locator(`[data-insert="eplan-${id}"]`).click();
    const point = await sheetPoint(page, x, 300);
    await page.mouse.click(point.x, point.y);
  }
  await page.locator('[data-draw="wire"]').click();
  const start = await sheetPoint(page, 200, 300),
    end = await sheetPoint(page, 340, 300);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y);
  await page.mouse.up();
  const initial = await saveDrawing(page, "before-move");
  expect(initial.data.project).toBe("Bench circuit");
  const initialWire = initial.data.objects.find(
    (o: { kind: string }) => o.kind === "wire",
  );
  expect(initialWire.attachments.start.pinId).toBe("1");
  expect(initialWire.attachments.end.pinId).toBe("1");
  await page.locator('[data-draw="select"]').click();
  await page.locator('[data-inspector="Properties"]').click();
  await page
    .locator("#userDrawings .drawing-object")
    .filter({ has: page.locator("title", { hasText: "R1 · Resistor" }) })
    .locator(".component-hit-target")
    .click();
  await page.locator('[data-object-coordinate="x"]').fill("450");
  await page.locator('[data-object-coordinate="x"]').press("Tab");
  const moved = await saveDrawing(page, "moved");
  expect(
    moved.data.objects.find((o: { kind: string }) => o.kind === "wire").x2,
  ).toBe(440);
  await page.locator('[data-action="undo"]').first().click();
  const undone = await saveDrawing(page, "undone");
  expect(
    undone.data.objects.find((o: { kind: string }) => o.kind === "wire").x2,
  ).toBe(340);
  await page.locator('[data-action="redo"]').first().click();
  await page.locator('[data-component-property="ref"]').fill("R7");
  await page.locator('[data-component-property="ref"]').press("Tab");
  const saved = await saveDrawing(page, "final-circuit");
  await page.reload();
  await page.locator("#openFile").setInputFiles(saved.path);
  await expect(
    page.locator("#userDrawings title").filter({ hasText: "R7 · Resistor" }),
  ).toHaveCount(1);
  const reopened = await saveDrawing(page, "reopened");
  expect(reopened.data.objects).toEqual(saved.data.objects);
  expect(reopened.data.project).toBe("Bench circuit");
  expect(errors).toEqual([]);
});

test("existing New Project dialog opens both connected editable examples", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  for (const id of ["indicator", "relay"]) {
    await page.locator('[data-action="new"]').first().click();
    await page.locator("#newProjectName").fill(id + " workshop");
    await page.locator("#projectTemplate").selectOption(id);
    await page.locator("#createProject").click();
    await expect(page.locator("#userDrawings .drawing-object")).toHaveCount(0);
    await page.locator("#projectTree [data-sheet]").first().click();
    await expect(page.locator("#userDrawings .drawing-object")).toHaveCount(9);
    const saved = await saveDrawing(page, id);
    expect(saved.data.project).toBe(id + " workshop");
    expect(
      saved.data.objects.filter((o: { kind: string }) => o.kind === "wire"),
    ).toHaveLength(4);
    await page.locator('[data-inspector="Electrical checks"]').click();
    await expect(page.locator("#inspectorContent")).toContainText(
      "No wire geometry issues found",
    );
    await page.locator("#closeRightPanel").click();
  }
  expect(errors).toEqual([]);
});

test("manufacturer projects open, expose editable parts and preserve connections on reopen", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  for (const [id, count, wireCount] of [
    ["hardware-plc-input", 13, 6],
    ["hardware-relay", 15, 6],
    ["hardware-sensor", 9, 3],
    ["hardware-sitop", 7, 2],
  ] as const) {
    await page.locator('[data-action="new"]').first().click();
    await page.locator("#newProjectName").fill(id + " bench");
    await page.locator("#projectTemplate").selectOption(id);
    await page.locator("#createProject").click();
    await expect(page.locator("#userDrawings .drawing-object")).toHaveCount(0);
    await page.locator("#projectTree [data-sheet]").first().click();
    await expect(page.locator("#userDrawings .drawing-object")).toHaveCount(
      count,
    );
    await page.locator('[data-inspector="Properties"]').click();
    await page.locator("#userDrawings .drawing-object").first().click();
    await expect(page.locator("#sheetDesignation")).toHaveText("A2/000");
    await expect(
      page.locator("#inspectorContent .inspector-block").first(),
    ).toContainText(
      id === "hardware-plc-input"
        ? "PLC digital input bench"
        : id === "hardware-relay"
          ? "24 V momentary relay control"
          : id === "hardware-sensor"
            ? "PNP proximity sensor terminal wiring"
            : "SITOP 24 V terminal distribution",
    );
    await expect(page.locator("#inspectorContent")).toContainText(
      /UK 5 N|UT 2,5|SITOP PSU100C/,
    );
    await page.locator('[data-component-property="ref"]').fill("TEST1");
    await page.locator('[data-component-property="ref"]').press("Tab");
    await page.locator("[data-rotate-object]").click();
    const saved = await saveDrawing(page, id);
    expect(saved.data.objects[0].rotation).toBe(90);
    expect(
      saved.data.objects.filter((o: { kind: string }) => o.kind === "wire"),
    ).toHaveLength(wireCount);
    expect(
      saved.data.objects.some((o: { ref?: string }) => o.ref === "TEST1"),
    ).toBe(true);
    await page.reload();
    await page.locator("#openFile").setInputFiles(saved.path);
    const reopened = await saveDrawing(page, id + "-restored");
    expect(reopened.data.objects).toEqual(saved.data.objects);
    await page.locator('[data-inspector="Electrical checks"]').click();
    await expect(page.locator("#inspectorContent")).toContainText(
      "Geometry errors0",
    );
    const expectedNets =
      id === "hardware-plc-input"
        ? 4
        : id === "hardware-relay"
          ? 6
          : id === "hardware-sensor"
            ? 3
            : 2;
    await expect(page.locator("#inspectorContent")).toContainText(
      "Connected nets" + expectedNets,
    );
    await page.locator("#closeRightPanel").click();
  }
  expect(errors).toEqual([]);
});

test("imported sheet metadata overrides sample labels when opening properties", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#newProjectName").fill("Imported cabinet");
  await page.locator("#createProject").click();
  const saved = await saveDrawing(page, "metadata-source");
  delete saved.data.openSheetIds;
  delete saved.data.sections;
  delete saved.data.activeSection;
  saved.data.activeSheet = "control";
  saved.data.sheets = [
    { id: "control", number: "CAB/042", name: "Pump enable circuit" },
  ];
  saved.data.objects = [];
  saved.data.sheetLabels = {};
  await page.locator("#openFile").setInputFiles({
    name: "cabinet.adigun.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(saved.data)),
  });
  await page.locator('[data-inspector="Electrical checks"]').click();
  await page.locator('[data-inspector="Properties"]').click();
  await expect(page.locator("#sheetDesignation")).toHaveText("CAB/042");
  await expect(page.locator('#sheetTabs [data-sheet="control"]')).toContainText(
    "CAB/042 · Pump enable circuit",
  );
  await expect(
    page.locator('#projectTree [data-sheet="control"]'),
  ).toHaveAttribute("aria-label", "CAB/042 · Pump enable circuit");
  await expect(
    page.locator("#inspectorContent .inspector-block").first(),
  ).toContainText("Pump enable circuit");
  await expect(page.locator("#drawing")).toHaveAttribute(
    "aria-label",
    "Electrical drawing · Pump enable circuit",
  );
});

test("existing insertion toolbar places verified PLC motor and earth terminal", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#createProject").click();
  await addSectionSheet(page);
  const parts = [
    ["plc", "siemens-6es7212-1ae40-0xb0"],
    ["motor", "sew-eurodrive-drn63ms4"],
    ["ground", "phoenix-contact-3212147"],
  ];
  for (const [index, [tool]] of parts.entries()) {
    const button = page.locator(`[data-insert-tool="${tool}"]`);
    await expect(button).toBeEnabled();
    await button.click();
    await page
      .locator("#drawing")
      .click({ position: { x: 200 + index * 160, y: 240 } });
  }
  const saved = await saveDrawing(page, "toolbar-parts");
  expect(
    saved.data.objects.map((item: { componentId: string }) => item.componentId),
  ).toEqual(parts.map((part) => part[1]));
  await page.reload();
  await page.locator("#openFile").setInputFiles(saved.path);
  await expect(page.locator("#userDrawings .drawing-object")).toHaveCount(3);
  expect(errors).toEqual([]);
});

test("existing Electrical Symbol Library places and saves original Eplan symbols", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#newProjectName").fill("Eplan symbol regression");
  await page.locator("#createProject").click();
  await addSectionSheet(page);
  await page.locator('[data-module="Electrical"]').click();
  await page.getByRole("menuitem", { name: /Symbol Library$/ }).click();
  await expect(page.locator('#symbolList [data-insert^="eplan-"]')).toHaveCount(
    83,
  );
  await page.locator("#symbolSearch").fill("eplan-resistor");
  await expect(page.locator("#symbolList .symbol-row")).toHaveCount(1);
  await page.locator('[data-insert="eplan-resistor"]').click();
  await page.locator("#drawing").click({ position: { x: 350, y: 220 } });
  const placed = page.locator("#userDrawings .drawing-object").filter({
    has: page.locator("title", {
      hasText: "Original Eplan electrical symbol",
    }),
  });
  await expect(placed).toHaveCount(1);
  await expect(placed.locator("rect:not(.component-hit-target)")).toHaveCount(
    1,
  );
  await expect(placed.locator("circle")).toHaveCount(2);
  const downloadEvent = page.waitForEvent("download");
  await page.locator('[data-action="save"]').first().click();
  const download = await downloadEvent;
  const saved = test.info().outputPath("original-symbol.adigun.json");
  await download.saveAs(saved);
  await page.reload();
  await page.locator("#openFile").setInputFiles(saved);
  await expect(placed).toHaveCount(1);
  await expect(placed.locator("title")).toContainText(
    "manufacturer part not assigned",
  );
  expect(errors).toEqual([]);
});

test("new projects own four empty sections and continuously numbered sheets survive reopening", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('[data-panel="symbols"]').click();
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#newProjectName").fill("Section workflow");
  await page.locator("#createProject").click();
  await expect(page.locator("[data-project-root] b")).toHaveText(
    "Section workflow",
  );
  await expect(page.locator("[data-project-section]")).toHaveCount(4);
  await expect(page.locator("#projectTree [data-sheet]")).toHaveCount(0);
  const empty = await saveDrawing(page, "empty-four-sections");
  expect(
    empty.data.sections.map((section: { id: string }) => section.id),
  ).toEqual(["A1", "A2", "A3", "A4"]);
  expect(empty.data.sheets).toEqual([]);
  expect(empty.data.objects).toEqual([]);
  expect(empty.data.activeSheet).toBeNull();
  await page.reload();
  await page.locator("#openFile").setInputFiles(empty.path);
  await expect(page.locator("[data-project-section]")).toHaveCount(4);
  await expect(page.locator("#projectTree [data-sheet]")).toHaveCount(0);
  for (const section of ["A2", "A4", "A1", "A3", "A1"])
    await addSectionSheet(page, section);
  const saved = await saveDrawing(page, "sectioned");
  expect(
    saved.data.sheets.map((sheet: { number: string }) => sheet.number),
  ).toEqual(["A1/000", "A1/001", "A2/002", "A3/003", "A4/004"]);
  for (const sheet of saved.data.sheets) {
    await expect(
      page.locator(
        '[data-section-container="' +
          sheet.sectionId +
          '"] [data-sheet="' +
          sheet.id +
          '"]',
      ),
    ).toBeVisible();
  }
  await page.reload();
  await page.locator("#openFile").setInputFiles(saved.path);
  const reopened = await saveDrawing(page, "sectioned-reopened");
  expect(reopened.data.sections).toEqual(saved.data.sections);
  expect(reopened.data.sheets).toEqual(saved.data.sheets);
  await addSectionSheet(page, "A2");
  const extended = await saveDrawing(page, "sectioned-extended");
  expect(
    extended.data.sheets.map((sheet: { number: string }) => sheet.number),
  ).toEqual(["A1/000", "A1/001", "A2/002", "A2/003", "A3/004", "A4/005"]);
});

test("Project Explorer exposes searchable examples and opens an editable copy", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('[data-panel="symbols"]').click();
  await expect(page.locator("#projectPanel")).toBeHidden();
  await page.locator('[data-panel="project"]').click();
  await expect(page.locator("#projectPanel")).toBeVisible();
  await expect(page.locator("#symbolsPanel")).toBeHidden();
  const examples = page.locator("#projectTree [data-project-example]");
  await expect(examples).toHaveCount(7);
  await expect(examples.first()).toBeVisible();
  await page.locator("#projectSearch").fill("PLC digital input");
  const plc = page.locator('[data-project-example="hardware-plc-input"]');
  await expect(plc).toBeVisible();
  await expect(page.locator('[data-project-example="indicator"]')).toBeHidden();
  await plc.press("Enter");
  await expect(page.locator("#projectTemplate")).toHaveValue(
    "hardware-plc-input",
  );
  await expect(page.locator("#newProjectName")).toHaveValue(
    "PLC digital input bench",
  );
  await page.locator("#createProject").click();
  await expect(page.locator("#userDrawings .drawing-object")).toHaveCount(0);
  await page.locator("#projectTree [data-sheet]").first().click();
  await expect(page.locator("#userDrawings .drawing-object")).toHaveCount(13);
  await page.locator('[data-inspector="Electrical checks"]').click();
  await expect(page.locator("#inspectorContent")).toContainText(
    "Connected nets4",
  );
  const saved = await saveDrawing(page, "explorer-example");
  expect(
    saved.data.objects.filter(
      (object: { kind: string }) => object.kind === "wire",
    ),
  ).toHaveLength(6);
  await page.locator('[data-panel="project"]').click();
  await expect(page.locator("#projectSearch")).toHaveValue("");
  await expect(page.locator("[data-project-section]")).toHaveCount(4);
});

test("sidebar creates documents without opening, renames inline, reorders and closes views without deleting", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#createProject").click();
  for (let i = 0; i < 5; i++)
    await page.locator('[data-add-section-sheet="A1"]').click();
  await expect(page.locator("#projectTree [data-sheet]")).toHaveCount(5);
  await expect(page.locator("#sheetTabs [data-sheet]")).toHaveCount(0);
  const created = await saveDrawing(page, "sidebar-created");
  const ids = created.data.sheets.map((sheet: { id: string }) => sheet.id);
  expect(created.data.activeSheet).toBeNull();
  const first = page.locator('#projectTree [data-sheet="' + ids[0] + '"]');
  await first.click();
  await page.locator('[data-insert-tool="terminal"]').click();
  const point = await sheetPoint(page, 300, 300);
  await page.mouse.click(point.x, point.y);
  await expect(page.locator("#userDrawings .drawing-object")).toHaveCount(1);
  await page.locator('[data-sheet-name="' + ids[0] + '"]').dblclick();
  await page
    .getByRole("textbox", { name: "Rename sheet", exact: true })
    .fill("Power");
  await page
    .getByRole("textbox", { name: "Rename sheet", exact: true })
    .press("Enter");
  await expect(first).toHaveAttribute("aria-label", "A1/Power");
  await page.locator('#sheetTabs [data-close-sheet="' + ids[0] + '"]').click();
  await expect(page.locator("#sheetTabs [data-sheet]")).toHaveCount(0);
  await expect(first).toBeVisible();
  const closed = await saveDrawing(page, "closed-view");
  expect(closed.data.sheets).toHaveLength(5);
  expect(closed.data.objects).toHaveLength(1);
  expect(closed.data.openSheetIds).toEqual([]);
  await first.click();
  await expect(page.locator("#userDrawings .drawing-object")).toHaveCount(1);
  await page.locator('#projectTree [data-sheet="' + ids[1] + '"]').click();
  await expect(page.locator("#userDrawings .drawing-object")).toHaveCount(0);
  await first.click();
  await expect(page.locator("#userDrawings .drawing-object")).toHaveCount(1);
  const target = page.locator('#projectTree [data-sheet="' + ids[4] + '"]');
  const box = await target.boundingBox();
  await first.dragTo(target, { targetPosition: { x: 40, y: box!.height - 2 } });
  const moved = await saveDrawing(page, "reordered-sidebar");
  expect(moved.data.sheets.map((sheet: { id: string }) => sheet.id)).toEqual([
    ...ids.slice(1),
    ids[0],
  ]);
  expect(moved.data.sheets[4]).toMatchObject({
    id: ids[0],
    name: "Power",
    number: "A1/004",
  });
  expect(moved.data.objects).toEqual(closed.data.objects);
  await page.locator("[data-add-project-section]").click();
  await page.locator("[data-add-project-section]").click();
  await expect(page.locator("[data-project-section]")).toHaveCount(6);
  for (let i = 0; i < 2; i++)
    await page.locator('[data-add-section-sheet="A5"]').click();
  await expect(
    page.locator('[data-section-container="A5"] [data-sheet]'),
  ).toHaveCount(2);
  await expect(
    page.locator('#sheetTabs [data-sheet="' + ids[0] + '"]'),
  ).toHaveAttribute("aria-selected", "true");
  await page.locator('[data-toggle-section="A1"]').click();
  await expect(first).toBeHidden();
  const saved = await saveDrawing(page, "sidebar-state");
  await page.reload();
  await page.locator("#openFile").setInputFiles(saved.path);
  await expect(page.locator("[data-project-section]")).toHaveCount(6);
  await expect(first).toBeHidden();
  await page.locator('[data-toggle-section="A1"]').click();
  await expect(first).toBeVisible();
  await expect(page.locator("#userDrawings .drawing-object")).toHaveCount(1);
  await first.click({ button: "right" });
  await page
    .getByRole("menuitem", { name: "Rename sheet…", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Rename sheet", exact: true })
    .fill("Supply");
  await page
    .getByRole("textbox", { name: "Rename sheet", exact: true })
    .press("Enter");
  await first.click({ button: "right" });
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("menuitem", { name: "Delete sheet", exact: true })
    .click();
  await expect(first).toHaveCount(0);
  const deleted = await saveDrawing(page, "sidebar-deleted");
  expect(deleted.data.sheets).toHaveLength(6);
  expect(deleted.data.objects).toEqual([]);
  await page.reload();
  await page.locator("#openFile").setInputFiles(deleted.path);
  await expect(first).toHaveCount(0);
  await expect(page.locator("#projectTree [data-sheet]")).toHaveCount(6);
  expect(errors).toEqual([]);
});

test("projects above the former sheet limit preserve connections, order and additional sheets", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#createProject").click();
  const seed = await saveDrawing(page, "large-project-seed");
  seed.data.sheets = Array.from({ length: 205 }, (_, index) => ({
    id: "page-" + index,
    sectionId: "A1",
    name: "Sheet",
    customName: false,
    number: "A1/" + String(index).padStart(3, "0"),
  }));
  seed.data.objects = [
    {
      id: "wire-a",
      kind: "wire",
      sheetId: "page-0",
      x1: 100,
      y1: 100,
      x2: 200,
      y2: 100,
    },
    {
      id: "wire-b",
      kind: "wire",
      sheetId: "page-1",
      x1: 100,
      y1: 100,
      x2: 200,
      y2: 100,
    },
  ];
  seed.data.crossSheetConnections = [
    {
      id: "link-1",
      name: "TEST-POTENTIAL",
      endpoints: [
        { sheetId: "page-0", wireId: "wire-a", point: { x: 200, y: 100 } },
        { sheetId: "page-1", wireId: "wire-b", point: { x: 100, y: 100 } },
      ],
    },
  ];
  await page.locator("#openFile").setInputFiles({
    name: "large-project.adigun.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(seed.data)),
  });
  await expect(page.locator("#projectTree [data-sheet]")).toHaveCount(205);
  for (let i = 0; i < 3; i++)
    await page.locator('[data-add-section-sheet="A1"]').click();
  await expect(page.locator("#projectTree [data-sheet]")).toHaveCount(208);
  await expect(page.locator("#sheetTabs [data-sheet]")).toHaveCount(0);
  const last = page.locator("#projectTree [data-sheet]").last();
  await last.click();
  await page.locator('[data-insert-tool="terminal"]').click();
  const point = await sheetPoint(page, 300, 300);
  await page.mouse.click(point.x, point.y);
  const saved = await saveDrawing(page, "large-project-saved");
  expect(saved.data.sheets).toHaveLength(208);
  expect(saved.data.objects).toHaveLength(3);
  expect(saved.data.crossSheetConnections).toEqual(
    seed.data.crossSheetConnections,
  );
  await page.reload();
  await page.locator("#openFile").setInputFiles(saved.path);
  await expect(page.locator("#userDrawings .drawing-object")).toHaveCount(1);
  const restored = await saveDrawing(page, "large-project-restored");
  expect(restored.data.sheets).toEqual(saved.data.sheets);
  expect(restored.data.objects).toEqual(saved.data.objects);
  expect(restored.data.crossSheetConnections).toEqual(
    saved.data.crossSheetConnections,
  );
  await page
    .locator('#projectTree [data-sheet="page-0"]')
    .click({ button: "right" });
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("menuitem", { name: "Delete sheet", exact: true })
    .click();
  await page.locator('[data-inspector="Electrical checks"]').click();
  await expect(page.locator("[data-continuation-issues]")).toContainText(
    "TEST-POTENTIAL",
  );
  const deleted = await saveDrawing(page, "deleted-continuation");
  expect(deleted.data.connectionIssues[0].deletedSheetId).toBe("page-0");
  expect(deleted.data.crossSheetConnections).toEqual([]);
  await page.reload();
  await page.locator("#openFile").setInputFiles(deleted.path);
  await page.locator('[data-inspector="Electrical checks"]').click();
  await expect(page.locator("[data-continuation-issues]")).toContainText(
    "lost sheet",
  );
  await expect(page.locator('#projectTree [data-sheet="page-0"]')).toHaveCount(
    0,
  );
});
