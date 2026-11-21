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
  await expect(page.locator('[data-object="' + copy.id + '"]')).toHaveClass(
    /selected-object/,
  );
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
  await page.getByLabel("Cable tag", { exact: true }).fill("W-TEST");
  await page.getByLabel("Core identifier", { exact: true }).fill("1");
  await page.locator("[data-assign-cable]").click();
  await expect(page.getByLabel("Cable tag", { exact: true })).toHaveValue(
    "W-TEST",
  );
  await page.screenshot({
    path: test.info().outputPath("native-cable-properties.png"),
  });
  await page.getByLabel("end terminal", { exact: true }).selectOption("");
  await page
    .getByLabel("end terminal", { exact: true })
    .selectOption(f2.id + "|" + wire.attachments.end.pinId);
  await edit("[data-connection-label]", "L1 checked continuation");
  const saved = await saveDrawing(page, "editable-modified");
  expect(
    saved.data.objects.find((o: { id: string }) => o.id === wire.id).cable,
  ).toEqual({ tag: "W-TEST", core: "1" });
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
      deviceId?: string;
      assemblyFor?: string;
      attachments?: Record<string, { instanceId: string; pinId: string }>;
    }>,
  ) => {
    const targetIndex = (id: string) => {
      const index = objects.findIndex((object) => object.id === id);
      expect(index).toBeGreaterThanOrEqual(0);
      return index;
    };
    return objects.map((object, index) => ({
      ...object,
      id: index,
      deviceId: object.deviceId ? targetIndex(object.deviceId) : undefined,
      assemblyFor: object.assemblyFor
        ? targetIndex(object.assemblyFor)
        : undefined,
      attachments: object.attachments
        ? Object.fromEntries(
            Object.entries(object.attachments).map(([end, pin]) => [
              end,
              {
                ...pin,
                instanceId: targetIndex(pin.instanceId),
              },
            ]),
          )
        : undefined,
    }));
  };
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
  await expect(page.locator("#projectTree [data-sheet]")).toHaveCount(40);
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
            boxes.slice(i + 1).some((b, offset) => {
              const ids = [nodes[i], nodes[i + 1 + offset]].map(
                (node) => (node as SVGElement).dataset.object ?? "",
              );
              const block = ids.find((id) =>
                id.startsWith("eng0601-overview-block-"),
              );
              if (block && ids.includes(block.replace("-block-", "-label-"))) {
                const [outer, inner] = ids[0] === block ? [a, b] : [b, a];
                if (
                  inner.x >= outer.x &&
                  inner.y >= outer.y &&
                  inner.x + inner.width <= outer.x + outer.width &&
                  inner.y + inner.height <= outer.y + outer.height
                )
                  return false;
              }
              return (
                a.x < b.x + b.width &&
                a.x + a.width > b.x &&
                a.y < b.y + b.height &&
                a.y + a.height > b.y
              );
            }),
          ),
        };
      });
    expect(layout, "Authored paper check index " + i).toEqual({
      outside: 0,
      overlaps: false,
    });
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
  expect(saved.data.sheets).toHaveLength(40);
  expect(saved.data.sections).toHaveLength(4);
  expect(
    saved.data.objects
      .filter((o: { sheetId: string }) => o.sheetId.includes("-a1-"))
      .every(
        (o: { kind: string; sheetId: string }) =>
          o.kind === "text" ||
          (o.sheetId === "eng0601-a1-0" && ["rect", "arrow"].includes(o.kind)),
      ),
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
  await expect(page.locator("#userDrawings [data-terminal]")).toHaveCount(22);
  await expect(
    page.locator('#userDrawings [aria-label^="XPEF:1"] [data-terminal]'),
  ).toHaveCount(2);
  await expect(page.locator("#userDrawings")).toContainText(
    "W2:PE and W3:PE stay unswitched",
  );
  await page.screenshot({
    path: test.info().outputPath("eng0601-field-motor.png"),
  });
  await page.locator('[data-sheet="eng0601-a2-11"]').first().click();
  await expect(page.locator("#userDrawings")).toContainText(
    "EXPLICIT PE PATHS",
  );
  await expect(
    page.locator('#userDrawings [data-terminal="RAIL"]'),
  ).toHaveCount(1);
  await expect(page.locator(".cross-sheet-connector")).toHaveCount(2);
  await page.screenshot({
    path: test.info().outputPath("eng0601-bonding.png"),
  });
  await page
    .locator(".cross-sheet-connector")
    .filter({ hasText: "PE-RAIL-AUX" })
    .press("Enter");
  await expect(page.locator("#userDrawings")).toContainText("AUXILIARY SUPPLY");
  await page.locator('[data-sheet="eng0601-a2-12"]').first().click();
  await expect(
    page.locator('#userDrawings [data-object^="eng0601-continuation-row-"]'),
  ).toHaveCount(37);
  await expect(page.locator("#userDrawings")).toContainText(
    "not a physical cable/core schedule",
  );
  await page.screenshot({
    path: test.info().outputPath("eng0601-continuation-register.png"),
  });
  await page.locator('[data-sheet="eng0601-a3-0"]').first().click();
  await expect(page.locator("#userDrawings")).toContainText(
    "EXTERNAL: M1 motor; ENC2 with Q2 and its auxiliary",
  );
  await expect(page.locator("#userDrawings [data-terminal]")).toHaveCount(0);
  await page.screenshot({
    path: test.info().outputPath("eng0601-enclosure-basis.png"),
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

test("the docked library keeps the project tree visible and the left sidebar can close", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#createProject").click();
  await addSectionSheet(page);
  await page.locator('[data-module="Electrical"]').click();
  await page.getByRole("menuitem", { name: "Symbol Library" }).click();
  await expect(page.locator("#projectTree [data-sheet]").first()).toBeVisible();
  await page
    .getByRole("searchbox", { name: "Search symbols" })
    .fill("resistor");
  await expect(page.locator('[data-insert="eplan-resistor"]')).toBeVisible();
  const explorer = (await page.locator("#projectPanel").boundingBox())!;
  const library = (await page.locator("#symbolsPanel").boundingBox())!;
  expect(library.x).toBe(explorer.x);
  expect(library.y).toBeGreaterThan(explorer.y);
  const before = (await page.locator(".editor").boundingBox())!.width;
  await page.getByRole("button", { name: "Close left sidebar" }).click();
  await expect(page.locator("#sidepanel")).toBeHidden();
  const collapsed = (await page.locator(".editor").boundingBox())!.width;
  expect(collapsed - before).toBeGreaterThan(200);
  await page
    .getByRole("button", { name: "Symbol library", exact: true })
    .click();
  await expect(page.locator("#projectTree [data-sheet]").first()).toBeVisible();
  await expect(page.locator('[data-insert="eplan-resistor"]')).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath("library-below-project-explorer.png"),
  });
});

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
  test.setTimeout(60000);
  page.setDefaultTimeout(6000);
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
    await page.locator('[data-draw="select"]').click();
    await page.locator('[data-inspector="Properties"]').click();
    const target = await page
      .locator("#userDrawings .component-hit-target")
      .first()
      .boundingBox();
    expect(target).toBeTruthy();
    await page.mouse.click(
      target!.x + target!.width / 4,
      target!.y + target!.height / 4,
    );
    const reference = page.locator('[data-component-property="ref"]');
    await expect(reference).toHaveValue("X1");
    await reference.fill("EDITED1");
    await reference.press("Tab");
    const saved = await saveDrawing(page, id);
    expect(saved.data.project).toBe(id + " workshop");
    expect(
      saved.data.objects.some((o: { ref?: string }) => o.ref === "EDITED1"),
    ).toBe(true);
    expect(
      saved.data.objects.filter((o: { kind: string }) => o.kind === "wire"),
    ).toHaveLength(4);
    const existing = saved.data.objects.find(
      (o: { kind: string }) => o.kind === "wire",
    );
    const middle = await sheetPoint(
      page,
      (existing.x1 + existing.x2) / 2,
      existing.y1,
    );
    await page.mouse.click(middle.x, middle.y);
    await page.locator('[data-delete-object="' + existing.id + '"]').click();
    await page.locator('[data-draw="wire"]').click();
    const start = await sheetPoint(page, existing.x1, existing.y1);
    const end = await sheetPoint(page, existing.x2, existing.y2);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y);
    await page.mouse.up();
    const rewired = await saveDrawing(page, id + "-rewired");
    const wires = rewired.data.objects.filter(
      (o: { kind: string }) => o.kind === "wire",
    );
    expect(wires).toHaveLength(4);
    expect(
      wires.find(
        (o: { id: string }) =>
          !saved.data.objects.some(
            (previous: { id: string }) => previous.id === o.id,
          ),
      ).attachments,
    ).toEqual(existing.attachments);
    await page.reload();
    await page.locator("#openFile").setInputFiles(rewired.path);
    const reopened = await saveDrawing(page, id + "-reopened");
    expect(reopened.data.objects).toEqual(rewired.data.objects);
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
  await expect(page.locator("#projectPanel")).toBeVisible();
  await page.locator('[data-panel="project"]').click();
  await expect(page.locator("#projectPanel")).toBeVisible();
  await expect(page.locator("#symbolsPanel")).toBeVisible();
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

test("Electrical checks exposes persisted inconsistent cable core assignments", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#projectTemplate").selectOption("eng0601");
  await page.locator("#createProject").click();
  const saved = await saveDrawing(page, "cable-diagnostic-fixture");
  const pair = saved.data.crossSheetConnections[0];
  pair.endpoints.forEach((endpoint: { wireId: string }, index: number) => {
    saved.data.objects.find(
      (o: { id: string }) => o.id === endpoint.wireId,
    ).cable = { tag: "W-CHECK", core: String(index + 1) };
  });
  await page.locator("#openFile").setInputFiles({
    name: "cable-conflict.adigun.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(saved.data)),
  });
  await page.locator('[data-sheet="eng0601-a2-0"]').first().click();
  await page.locator('[data-inspector="Electrical checks"]').click();
  await expect(page.locator("[data-project-electrical-issues]")).toContainText(
    "inconsistent cable/core assignments",
  );
  await page.screenshot({
    path: test.info().outputPath("cable-diagnostic-findings.png"),
  });
  const restored = await saveDrawing(page, "cable-conflict-reopened");
  expect(restored.data.objects).toEqual(saved.data.objects);
});

test("LAPP cable inserts through the existing library and preserves editable route", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#newProjectName").fill("Cable library verification");
  await page.locator("#createProject").click();
  await addSectionSheet(page);
  await page.locator('[data-module="Electrical"]').click();
  await page.getByRole("menuitem", { name: /Symbol Library$/ }).click();
  await page.locator("#symbolSearch").fill("lapp-1119504");
  await page.locator('[data-insert="lapp-1119504"]').click();
  const point = await sheetPoint(page, 400, 300);
  await page.mouse.click(point.x, point.y);
  await page.locator('[data-draw="select"]').click();
  await page.locator("#userDrawings .drawing-object").last().click();
  await page.locator('[data-inspector="Properties"]').click();
  await page
    .locator('[data-component-property="route"]')
    .fill("Panel to field isolator");
  await page.locator('[data-component-property="route"]').press("Tab");
  await page
    .locator('[data-component-property="lengthAssumption"]')
    .fill("20 m educational assumption; not measured");
  await page
    .locator('[data-component-property="lengthAssumption"]')
    .press("Tab");
  await expect(page.locator("#userDrawings [data-terminal]")).toHaveCount(8);
  await page.screenshot({
    path: test.info().outputPath("lapp-cable-library.png"),
  });
  const saved = await saveDrawing(page, "lapp-cable-edited");
  expect(saved.data.objects[0]).toMatchObject({
    componentId: "lapp-1119504",
    properties: {
      route: "Panel to field isolator",
      lengthAssumption: "20 m educational assumption; not measured",
    },
  });
  await page.reload();
  await page.locator("#openFile").setInputFiles(saved.path);
  const reopened = await saveDrawing(page, "lapp-cable-reopened");
  expect(reopened.data.objects).toEqual(saved.data.objects);
});

test("sourced LAPP motor and control cables expose only their real cores and keep wire attachments", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#createProject").click();
  await addSectionSheet(page);
  await page.locator('[data-module="Electrical"]').click();
  await page.getByRole("menuitem", { name: /Symbol Library$/ }).click();
  for (const [id, x, pins] of [
    ["1120360", 330, 8],
    ["1120307", 680, 6],
  ] as const) {
    await page.locator("#symbolSearch").fill(id);
    await page.locator('[data-insert="lapp-' + id + '"]').click();
    const point = await sheetPoint(page, x, 300);
    await page.mouse.click(point.x, point.y);
    await expect(
      page
        .locator("#userDrawings .drawing-object")
        .last()
        .locator("[data-terminal]"),
    ).toHaveCount(pins);
  }
  const [a, b] = await Promise.all([
    sheetPoint(page, 420, 264),
    sheetPoint(page, 590, 276),
  ]);
  await page.locator('[data-draw="wire"]').click();
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y);
  await page.mouse.up();
  const initial = await saveDrawing(page, "sourced-cables");
  const cable = initial.data.objects.find(
    (o: { componentId?: string }) => o.componentId === "lapp-1120307",
  );
  const wire = initial.data.objects.find(
    (o: { kind: string }) => o.kind === "wire",
  );
  expect(wire.attachments.start.pinId).toBe("b-1");
  expect(wire.attachments.end).toMatchObject({
    instanceId: cable.id,
    pinId: "a-1",
  });
  await page.locator('[data-draw="select"]').click();
  const pick = await sheetPoint(page, 680, 309);
  await page.mouse.dblclick(pick.x, pick.y);
  await page.locator('[data-object-coordinate="x"]').fill("740");
  await page.locator('[data-object-coordinate="x"]').press("Tab");
  const corner = await page
    .locator('#userDrawings [data-resize-handle="se"]')
    .boundingBox();
  expect(corner).toBeTruthy();
  const resizeTo = await sheetPoint(page, 920, 430);
  await page.mouse.move(
    corner!.x + corner!.width / 2,
    corner!.y + corner!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(resizeTo.x, resizeTo.y);
  await page.mouse.up();
  await expect(
    page.getByRole("spinbutton", { name: "Drawing scale" }),
  ).toHaveValue("1.5");
  await page
    .getByRole("combobox", { name: "Drawing rotation" })
    .selectOption("90");
  await page
    .getByRole("button", { name: "Rotate selected component 90°" })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Drawing rotation" }),
  ).toHaveValue("180");
  await page.locator('[data-action="undo"]').click();
  await expect(
    page.getByRole("combobox", { name: "Drawing rotation" }),
  ).toHaveValue("90");
  const strokeColor = page.getByRole("textbox", {
    name: "Stroke color",
    exact: true,
  });
  await strokeColor.fill("#802a14");
  await strokeColor.press("Tab");
  await page.getByRole("spinbutton", { name: "Line weight (mm)" }).fill("1.5");
  await page.getByRole("spinbutton", { name: "Line weight (mm)" }).press("Tab");
  await page
    .getByRole("combobox", { name: "Line type" })
    .selectOption("dashed");
  await page
    .getByRole("combobox", { name: "Drawing layer" })
    .selectOption("annotations");
  const glyph = page.locator('#userDrawings [data-object="' + cable.id + '"]');
  await expect(glyph).toHaveAttribute("stroke", "#802a14");
  await expect(glyph).toHaveAttribute("stroke-width", "1.5");
  await expect(glyph).toHaveAttribute("stroke-dasharray", "6 3");
  await expect(glyph).toHaveAttribute("data-layer", "annotations");
  await page
    .getByRole("complementary", { name: "Inspector tools" })
    .getByRole("button", { name: "Layers and visibility" })
    .click();
  await page.locator('#inspectorContent [data-layer="annotations"]').uncheck();
  await expect(glyph).toBeHidden();
  await page.locator('#inspectorContent [data-layer="annotations"]').check();
  await expect(glyph).toBeVisible();
  const edited = await saveDrawing(page, "sourced-cables-moved");
  expect(
    edited.data.objects.find((o: { id: string }) => o.id === wire.id),
  ).toMatchObject({ x2: 821, y2: 197.5, attachments: wire.attachments });
  expect(
    edited.data.objects.find((o: { id: string }) => o.id === cable.id),
  ).toMatchObject({
    stroke: "#802a14",
    strokeWidth: 1.5,
    lineType: "dashed",
    layer: "annotations",
    displayScale: 1.5,
    rotation: 90,
  });
  await page.reload();
  await page.locator("#openFile").setInputFiles(edited.path);
  const reopened = await saveDrawing(page, "sourced-cables-reopened");
  expect(reopened.data.objects).toEqual(edited.data.objects);
});

test("Rittal enclosure inserts as editable mechanical data without electrical pins", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#newProjectName").fill("Enclosure verification");
  await page.locator("#createProject").click();
  await addSectionSheet(page);
  await page.locator('[data-module="Electrical"]').click();
  await page.getByRole("menuitem", { name: /Symbol Library$/ }).click();
  await page.locator("#symbolSearch").fill("rittal-1059000");
  await page.locator('[data-insert="rittal-1059000"]').click();
  const point = await sheetPoint(page, 400, 350);
  await page.mouse.click(point.x, point.y);
  await page.locator('[data-draw="select"]').click();
  await page.locator("#userDrawings .drawing-object").last().click();
  await page.locator('[data-inspector="Properties"]').click();
  await page
    .locator('[data-component-property="location"]')
    .fill("Indoor starter cabinet");
  await page.locator('[data-component-property="location"]').press("Tab");
  await expect(page.locator("#userDrawings [data-terminal]")).toHaveCount(0);
  await expect(page.locator("#userDrawings")).toContainText("545 × 775 mm");
  await page.locator('[data-module="Electrical"]').click();
  await page.getByRole("menuitem", { name: /Symbol Library$/ }).click();
  await page.locator("#symbolSearch").fill("rittal-1033000");
  await page.locator('[data-insert="rittal-1033000"]').click();
  const fieldPoint = await sheetPoint(page, 760, 350);
  await page.mouse.click(fieldPoint.x, fieldPoint.y);
  await page.locator('[data-draw="select"]').click();
  await page.mouse.dblclick(fieldPoint.x, fieldPoint.y);
  await page
    .locator('[data-component-property="location"]')
    .fill("Field isolator");
  await page.locator('[data-component-property="location"]').press("Tab");
  await expect(page.locator("#userDrawings")).toContainText("250 × 275 mm");
  await expect(page.locator("#userDrawings [data-terminal]")).toHaveCount(0);
  await page.screenshot({
    path: test.info().outputPath("rittal-enclosure-library.png"),
  });
  const saved = await saveDrawing(page, "enclosure-edited");
  expect(saved.data.objects[0]).toMatchObject({
    componentId: "rittal-1059000",
    properties: { location: "Indoor starter cabinet" },
  });
  expect(saved.data.objects[1]).toMatchObject({
    componentId: "rittal-1033000",
    properties: { location: "Field isolator" },
  });
  await page.reload();
  await page.locator("#openFile").setInputFiles(saved.path);
  const reopened = await saveDrawing(page, "enclosure-reopened");
  expect(reopened.data.objects).toEqual(saved.data.objects);
});

test("linked panel placement preserves its canonical device on local reopen", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#projectTemplate").selectOption("eng0601");
  await page.locator("#newProjectName").fill("Linked panel verification");
  await page.locator("#createProject").click();
  const initial = await saveDrawing(page, "panel-source");
  await page.locator("#openFile").setInputFiles({
    name: "panel-without-views.adigun.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        ...initial.data,
        objects: initial.data.objects.filter(
          (o: { kind: string }) => o.kind !== "panel-placement",
        ),
      }),
    ),
  });
  const device = initial.data.objects.find(
    (o: Record<string, unknown>) => o.ref === "F1",
  );
  expect(device).toBeTruthy();
  await page
    .locator('[data-sheet="' + device.sheetId + '"]')
    .first()
    .click();
  await page.locator('[data-draw="select"]').click();
  await page.locator('#userDrawings [data-object="' + device.id + '"]').click();
  await page.locator('[data-inspector="Properties"]').click();
  await expect(
    page
      .getByRole("combobox", { name: "Panel placement sheet" })
      .locator("option"),
  ).toHaveText(
    initial.data.sheets
      .filter((sheet: { sectionId: string }) => sheet.sectionId === "A3")
      .map(
        (sheet: { number: string; name: string }) =>
          sheet.number + " · " + sheet.name,
      ),
  );
  await page
    .getByRole("button", { name: "Add linked panel placement" })
    .click();
  const contactor = initial.data.objects.find(
    (o: Record<string, unknown>) => o.ref === "K1",
  );
  await page
    .locator('[data-sheet="' + contactor.sheetId + '"]')
    .first()
    .click();
  await page
    .locator('#userDrawings [data-object="' + contactor.id + '"]')
    .click();
  await page
    .getByRole("button", { name: "Add linked panel placement" })
    .click();
  await page.locator('[data-sheet="eng0601-a3-0"]').first().click();
  const saved = await saveDrawing(page, "panel-linked");
  const placement = saved.data.objects.find(
    (o: Record<string, unknown>) => o.kind === "panel-placement",
  );
  expect(placement.deviceId).toBe(device.id);
  const contactorView = saved.data.objects.find(
    (o: Record<string, unknown>) =>
      o.kind === "panel-placement" && o.deviceId === contactor.id,
  );
  expect(contactorView).toMatchObject({
    footprintComponentId: "siemens-3rt2027-2kb40",
    scale: 0.5,
  });
  const normalizeConnections = (data: typeof saved.data) =>
    data.crossSheetConnections.map(
      (link: {
        endpoints: {
          wireId: string;
          sheetId: string;
          wireEnd?: string;
          point: { x: number; y: number };
        }[];
      }) => ({
        ...link,
        endpoints: link.endpoints.map((endpoint) => {
          const wire = data.objects.find(
            (o: Record<string, unknown>) =>
              o.id === endpoint.wireId && o.sheetId === endpoint.sheetId,
          );
          expect(wire).toBeTruthy();
          const atStart =
            endpoint.point.x === wire.x1 && endpoint.point.y === wire.y1;
          const atEnd =
            endpoint.point.x === wire.x2 && endpoint.point.y === wire.y2;
          expect(atStart || atEnd).toBe(true);
          const wireEnd = atStart ? "start" : "end";
          if (endpoint.wireEnd) expect(endpoint.wireEnd).toBe(wireEnd);
          return { ...endpoint, wireEnd };
        }),
      }),
    );
  expect(normalizeConnections(saved.data)).toEqual(
    normalizeConnections(initial.data),
  );
  expect(
    saved.data.objects.filter(
      (o: Record<string, unknown>) => o.kind === "panel-placement",
    ),
  ).toHaveLength(2);
  expect(
    saved.data.objects.filter(
      (o: Record<string, unknown>) => o.kind === "component-instance",
    ).length,
  ).toBe(
    initial.data.objects.filter(
      (o: Record<string, unknown>) => o.kind === "component-instance",
    ).length,
  );
  await page
    .locator('#userDrawings [data-object="' + placement.id + '"]')
    .click();
  await page.locator('[data-object-coordinate="x"]').fill("200");
  await page.locator('[data-object-coordinate="x"]').press("Tab");
  await page.locator('[data-object-coordinate="y"]').fill("330");
  await page.locator('[data-object-coordinate="y"]').press("Tab");
  await page.locator('[data-rotate-object="' + placement.id + '"]').click();
  const edited = await saveDrawing(page, "panel-edited");
  expect(
    edited.data.objects.find(
      (o: Record<string, unknown>) => o.id === placement.id,
    ),
  ).toMatchObject({ x: 200, y: 330, rotation: 90, deviceId: device.id });
  await page.reload();
  await page.locator("#openFile").setInputFiles(edited.path);
  const reopened = await saveDrawing(page, "panel-reopened");
  expect(reopened.data.objects).toEqual(edited.data.objects);
  await page.screenshot({
    path: test.info().outputPath("linked-panel-placement.png"),
  });
});

test("mounting accessory links to the canonical overload and survives rename and reopen", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#projectTemplate").selectOption("eng0601");
  await page.locator("#newProjectName").fill("Accessory verification");
  await page.locator("#createProject").click();
  await page.locator('[data-sheet="eng0601-a3-0"]').first().click();
  await page.locator('[data-module="Electrical"]').click();
  await page.getByRole("menuitem", { name: /Symbol Library$/ }).click();
  await page.locator("#symbolSearch").fill("3ru2926");
  await page.locator('[data-insert="siemens-3ru2926-3aa01"]').click();
  const point = await sheetPoint(page, 350, 250);
  await page.mouse.click(point.x, point.y);
  await page.locator('[data-draw="select"]').click();
  await page.locator("#userDrawings .drawing-object").last().click();
  await expect(
    page
      .locator("#userDrawings .drawing-object")
      .last()
      .locator("rect:not(.component-hit-target)")
      .first(),
  ).toHaveAttribute("width", "22.5");
  await expect(
    page
      .locator("#userDrawings .drawing-object")
      .last()
      .locator("rect:not(.component-hit-target)")
      .first(),
  ).toHaveAttribute("height", "48.5");
  await page.locator('[data-inspector="Properties"]').click();
  await page.getByRole("button", { name: "Link mounting accessory" }).click();
  await expect(page.locator("#selectionDetails")).toContainText(
    "Assembly device: F2",
  );
  await expect(page.locator("#userDrawings [data-terminal]")).toHaveCount(0);
  const saved = await saveDrawing(page, "accessory-linked");
  const relay = saved.data.objects.find(
    (o: Record<string, unknown>) => o.ref === "F2",
  );
  const accessory = saved.data.objects.find(
    (o: Record<string, unknown>) =>
      o.componentId === "siemens-3ru2926-3aa01" && o.sheetId === "eng0601-a3-0",
  );
  expect(accessory.assemblyFor).toBe(relay.id);
  await page.locator('[data-panel="project"]').click();
  await page
    .locator('[data-sheet="' + relay.sheetId + '"]')
    .first()
    .click();
  await page.locator('#userDrawings [data-object="' + relay.id + '"]').click();
  await page.locator('[data-component-property="ref"]').fill("F20");
  await page.locator('[data-component-property="ref"]').press("Tab");
  await page.locator('[data-sheet="eng0601-a3-0"]').first().click();
  await page
    .locator('#userDrawings [data-object="' + accessory.id + '"]')
    .click();
  await expect(page.locator("#selectionDetails")).toContainText(
    "Assembly device: F20",
  );
  const edited = await saveDrawing(page, "accessory-renamed");
  await page.reload();
  await page.locator("#openFile").setInputFiles(edited.path);
  await page
    .locator('#userDrawings [data-object="' + accessory.id + '"]')
    .click();
  await page.locator('[data-inspector="Properties"]').click();
  await expect(page.locator("#selectionDetails")).toContainText(
    "Assembly device: F20",
  );
  const reopened = await saveDrawing(page, "accessory-reopened");
  expect(reopened.data.objects).toEqual(edited.data.objects);
  await page.screenshot({
    path: test.info().outputPath("overload-mounting-accessory.png"),
  });
});

test("electrical support wires to relay terminals and retains bindings after editing", async ({
  page,
}) => {
  page.setDefaultTimeout(5000);
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#newProjectName").fill("Support wiring verification");
  await page.locator("#createProject").click();
  await addSectionSheet(page);
  await page.locator('[data-module="Electrical"]').click();
  await page.getByRole("menuitem", { name: /Symbol Library$/ }).click();
  for (const [id, x, y] of [
    ["siemens-3ru2926-3aa01-electrical", 250, 220],
    ["siemens-3ru2126-4bb0", 600, 400],
  ] as const) {
    await page.locator("#symbolSearch").fill(id);
    await page.locator('[data-insert="' + id + '"]').click();
    const point = await sheetPoint(page, x, y);
    await page.mouse.click(point.x, point.y);
  }
  await page.locator('[data-draw="wire"]').click();
  for (let i = 0; i < 3; i++) {
    const a = await sheetPoint(page, 335, 196 + i * 24);
    const b = await sheetPoint(page, 550 + i * 50, 310);
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(b.x, b.y);
    await page.mouse.up();
  }
  const wired = await saveDrawing(page, "support-wired");
  const support = wired.data.objects.find(
    (o: Record<string, unknown>) =>
      o.componentId === "siemens-3ru2926-3aa01-electrical",
  );
  const relay = wired.data.objects.find(
    (o: Record<string, unknown>) => o.componentId === "siemens-3ru2126-4bb0",
  );
  const wires = wired.data.objects.filter(
    (o: Record<string, unknown>) => o.kind === "wire",
  );
  expect(wires).toHaveLength(3);
  for (let i = 0; i < 3; i++) {
    expect(wires[i].attachments).toEqual({
      start: { instanceId: support.id, pinId: "mate-l" + (i + 1) },
      end: { instanceId: relay.id, pinId: "line-l" + (i + 1) },
    });
  }
  await page.locator('[data-draw="select"]').click();
  await page
    .locator('#userDrawings [data-object="' + support.id + '"]')
    .click({ position: { x: 40, y: 65 } });
  await page.locator('[data-inspector="Properties"]').click();
  await page.getByRole("button", { name: "Link mounting accessory" }).click();
  await page.locator('[data-object-coordinate="x"]').fill("300");
  await page.locator('[data-object-coordinate="x"]').press("Tab");
  await page.locator('[data-rotate-object="' + support.id + '"]').click();
  for (let i = 0; i < wires.length; i++) {
    const wirePoint = await sheetPoint(page, 550 + i * 50, 307.5);
    await page.mouse.click(wirePoint.x, wirePoint.y);
    await page
      .getByRole("combobox", { name: "Wire route axis" })
      .selectOption("y");
    await page
      .getByRole("spinbutton", { name: "Wire lane coordinate" })
      .fill(String(335 + i * 20));
    await page
      .getByRole("spinbutton", { name: "Wire lane coordinate" })
      .press("Tab");
  }
  const edited = await saveDrawing(page, "support-edited");
  expect(
    edited.data.objects.find(
      (o: Record<string, unknown>) => o.id === support.id,
    ),
  ).toMatchObject({ x: 300, rotation: 90, assemblyFor: relay.id });
  expect(
    edited.data.objects
      .filter((o: Record<string, unknown>) => o.kind === "wire")
      .map((w: { attachments: unknown }) => w.attachments),
  ).toEqual(wires.map((w: { attachments: unknown }) => w.attachments));
  expect(
    edited.data.objects
      .filter((o: { kind: string }) => o.kind === "wire")
      .map((w: { route: unknown }) => w.route),
  ).toEqual([335, 355, 375].map((coordinate) => ({ axis: "y", coordinate })));
  await page.reload();
  await page.locator("#openFile").setInputFiles(edited.path);
  const reopened = await saveDrawing(page, "support-reopened");
  expect(reopened.data.objects).toEqual(edited.data.objects);
  await page.screenshot({
    path: test.info().outputPath("support-electrical-wiring.png"),
  });
});

test("ENG-0601 A4 reports open as native editable sheets and survive local reopen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#projectTemplate").selectOption("eng0601");
  await page.locator("#newProjectName").fill("A4 report verification");
  await page.locator("#createProject").click();
  const original = await saveDrawing(page, "a4-source");
  const reports = original.data.sheets.filter(
    (s: { sectionId: string }) => s.sectionId === "A4",
  );
  expect(reports).toHaveLength(11);
  const handover = reports.find(
    (s: { name: string }) =>
      s.name === "Handover and unresolved design register",
  );
  for (const sheet of reports) {
    await page
      .locator('[data-sheet="' + sheet.id + '"]')
      .first()
      .click();
    await expect(page.locator("#userDrawings .drawing-object")).not.toHaveCount(
      0,
    );
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
              b.y + b.height > 574,
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
    if (sheet.id === handover.id) {
      await expect(page.locator("#userDrawings")).toContainText(
        "EDITOR PRACTICE",
      );
    }
    await page.screenshot({ path: test.info().outputPath(sheet.id + ".png") });
  }
  const saved = await saveDrawing(page, "a4-reports");
  await page
    .getByRole("button", { name: "Electrical checks", exact: true })
    .click();
  const exportEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export cable core register CSV" })
    .click();
  const cableExport = await exportEvent;
  const cableCsv = fs.readFileSync(await cableExport.path(), "utf8");
  expect(cableCsv).toContain('"W2","PE"');
  expect(cableCsv).toContain("XPEF:1:");
  expect(cableCsv).toContain('"W5","2"');
  const continuationEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export continuation register CSV" })
    .click();
  const continuationExport = await continuationEvent;
  const continuationCsv = fs.readFileSync(
    await continuationExport.path(),
    "utf8",
  );
  expect(continuationCsv.trimEnd().split("\r\n")).toHaveLength(75);
  expect(continuationCsv).toContain('"X5:1:2","W5","1"');
  const terminalEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export terminal register CSV" })
    .click();
  const terminalExport = await terminalEvent;
  const terminalCsv = fs.readFileSync(await terminalExport.path(), "utf8");
  expect(terminalCsv).toMatch(
    /"XPEF:1","1","connection-1","Attached",[^\r\n]+,"W2","PE"/,
  );
  expect(terminalCsv).toContain('"XPE:0","1","connection-1","Unwired"');
  await page
    .getByRole("button", { name: "Bill of materials", exact: true })
    .click();
  await expect(
    page.getByText("Project bill of materials", { exact: true }),
  ).toBeVisible();
  const bomEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV", exact: true }).click();
  const bomExport = await bomEvent;
  const bomCsv = fs.readFileSync(await bomExport.path(), "utf8");
  expect(bomCsv).toMatch(/"3LD2203-0TK51",[^\r\n]+,"1","Q2",/);
  expect(bomCsv).toMatch(/"1033000",[^\r\n]+,"1","ENC2",/);
  await page.reload();
  await page.locator("#openFile").setInputFiles(saved.path);
  const reopened = await saveDrawing(page, "a4-reopened");
  expect(reopened.data.objects).toEqual(saved.data.objects);
  expect(reopened.data.sheets).toEqual(saved.data.sheets);
  expect(reopened.data.crossSheetConnections).toEqual(
    saved.data.crossSheetConnections,
  );
  const duplicate = reopened.data.objects.find(
    (o: { ref?: string }) => o.ref === "F4",
  );
  duplicate.ref = "f3";
  await page.locator("#openFile").setInputFiles({
    name: "duplicate-tag.adigun.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(reopened.data)),
  });
  await page
    .getByRole("button", { name: "Electrical checks", exact: true })
    .click();
  await expect(page.locator("[data-project-electrical-issues]")).toContainText(
    "Duplicate device reference F3",
  );
});

test("ENG-0601 A3 opens with five editable linked device placements", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#projectTemplate").selectOption("eng0601");
  await page.locator("#createProject").click();
  await page.locator('[data-sheet="eng0601-a3-0"]').first().click();
  const saved = await saveDrawing(page, "a3-default-layout");
  const placements = saved.data.objects.filter(
    (o: { kind: string; sheetId: string }) =>
      o.kind === "panel-placement" && o.sheetId === "eng0601-a3-0",
  );
  expect(placements).toHaveLength(5);
  for (const placement of placements)
    await expect(
      page.locator('#userDrawings [data-object="' + placement.id + '"]'),
    ).toBeVisible();
  for (const placement of placements) {
    const device = saved.data.objects.find(
      (o: { id: string }) => o.id === placement.deviceId,
    );
    if (["F3", "F4"].includes(device.ref)) {
      const clear = await page
        .locator('#userDrawings [data-object="' + placement.id + '"]')
        .evaluate((node) => {
          const body = node.querySelector("rect")!.getBBox();
          const label = node.querySelector("text")!.getBBox();
          return label.y + label.height < body.y;
        });
      expect(clear).toBe(true);
    }
  }
  await page.screenshot({
    path: test.info().outputPath("eng0601-a3-proposed-layout.png"),
  });
  await page.reload();
  await page.locator("#openFile").setInputFiles(saved.path);
  const reopened = await saveDrawing(page, "a3-default-reopened");
  expect(reopened.data.objects).toEqual(saved.data.objects);
});

test("terminal bodies can be added through existing Properties and reopened", async ({
  page,
}) => {
  test.setTimeout(60000);
  page.setDefaultTimeout(5000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#projectTemplate").selectOption("eng0601");
  await page.locator("#newProjectName").fill("Terminal placement verification");
  await page.locator("#createProject").click();
  const initial = await saveDrawing(page, "terminal-source");
  const devices = ["X1:1", "X5:1", "XPE:1"].map((ref) =>
    initial.data.objects.find((o: { ref?: string }) => o.ref === ref),
  );
  for (const device of devices) {
    await page
      .locator('[data-sheet="' + device.sheetId + '"]')
      .first()
      .click();
    await page.locator('[data-draw="select"]').click();
    await page
      .locator('#userDrawings [data-object="' + device.id + '"]')
      .dblclick();
    await expect(page.locator("#rightPanelTitle")).toHaveText("Properties");
    await expect(page.locator("#rightPanel")).toHaveClass(/open/);
    await page.screenshot({
      path:
        "test-results/terminal-" +
        device.ref.replace(/:/g, "-") +
        "-properties.png",
    });
    expect(errors).toEqual([]);
    await expect(page.locator("#selectionDetails")).toContainText(
      "Verified component",
    );
    await expect(page.locator('[data-component-property="ref"]')).toHaveValue(
      device.ref,
    );
    await page
      .getByRole("button", { name: "Add linked panel placement" })
      .click();
  }
  await page.locator('[data-sheet="eng0601-a3-0"]').first().click();
  const saved = await saveDrawing(page, "terminal-views");
  for (const device of devices) {
    const placement = saved.data.objects.find(
      (o: { kind: string; deviceId?: string; sheetId: string }) =>
        o.kind === "panel-placement" &&
        o.deviceId === device.id &&
        o.sheetId === "eng0601-a3-0",
    );
    expect(placement).toMatchObject({
      footprintComponentId: device.componentId,
      scale: 0.5,
    });
    await expect(
      page.locator('#userDrawings [data-object="' + placement.id + '"]'),
    ).toBeVisible();
  }
  await page.reload();
  await page.locator("#openFile").setInputFiles(saved.path);
  const reopened = await saveDrawing(page, "terminal-reopened");
  expect(reopened.data.objects).toEqual(saved.data.objects);
  expect(reopened.data.crossSheetConnections).toEqual(
    saved.data.crossSheetConnections,
  );
});

test("A3 terminal detail sheets render linked bodies and retain native edits", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#projectTemplate").selectOption("eng0601");
  await page.locator("#createProject").click();
  const initial = await saveDrawing(page, "terminal-detail-source");
  for (const id of ["eng0601-a3-1", "eng0601-a3-2"]) {
    await page
      .locator('[data-sheet="' + id + '"]')
      .first()
      .click();
    await expect(
      page.locator('#userDrawings rect[data-object^="eng0601-rail-spare-"]'),
    ).toHaveCount(3);
    const views = initial.data.objects.filter(
      (o: { kind: string; sheetId: string }) =>
        o.kind === "panel-placement" && o.sheetId === id,
    );
    for (const view of views) {
      const body = page.locator(
        '#userDrawings [data-object="' + view.id + '"]',
      );
      await expect(body).toBeVisible();
      const device = initial.data.objects.find(
        (o: { id: string }) => o.id === view.deviceId,
      );
      await expect(body).toContainText(device.ref);
    }
    await page.screenshot({
      path: "test-results/" + id + "-terminal-arrangement.png",
    });
  }
  for (const [id, content] of [
    ["eng0601-a3-rail-mounting", "DUCT RESERVATIONS"],
    ["eng0601-a3-bonding", "dedicated cabinet PE distribution point"],
    ["eng0601-a3-door", "MAIN ISOLATOR"],
    ["eng0601-a3-cable-entry", "436 × 221 mm"],
    ["eng0601-a3-assembly", "Selected-device subtotal: 33.96 W"],
    ["eng0601-a3-field-isolator", "4 × Ø5 mm at 48 × 48 mm centres"],
  ]) {
    await page
      .locator('[data-sheet="' + id + '"]')
      .first()
      .click();
    await expect(page.locator("#userDrawings")).toContainText(content);
    if (id === "eng0601-a3-rail-mounting") {
      await expect(page.locator("#userDrawings")).toContainText("ACC-F2");
      const railViews = initial.data.objects.filter(
        (o: { kind: string; sheetId: string }) =>
          o.kind === "panel-placement" && o.sheetId === id,
      );
      expect(railViews).toHaveLength(5);
      for (const view of railViews) {
        await expect(
          page.locator('#userDrawings [data-object="' + view.id + '"]'),
        ).toBeVisible();
      }
    }
    await page.screenshot({ path: test.info().outputPath(id + ".png") });
  }
  await page.locator('[data-sheet="eng0601-a3-2"]').first().click();
  const moved = initial.data.objects.find(
    (o: { kind: string; sheetId: string }) =>
      o.kind === "panel-placement" && o.sheetId === "eng0601-a3-2",
  );
  await page.locator('[data-draw="select"]').click();
  await page
    .locator('#userDrawings [data-object="' + moved.id + '"]')
    .dblclick();
  await page.locator('[data-object-coordinate="y"]').fill("350");
  await page.locator('[data-object-coordinate="y"]').press("Tab");
  const saved = await saveDrawing(page, "terminal-detail-saved");
  expect(
    saved.data.objects.find((o: { id: string }) => o.id === moved.id),
  ).toMatchObject({ y: 350, deviceId: moved.deviceId });
  await page.reload();
  await page.locator("#openFile").setInputFiles(saved.path);
  const reopened = await saveDrawing(page, "terminal-detail-reopened");
  expect(reopened.data.objects).toEqual(saved.data.objects);
  expect(reopened.data.sheets).toEqual(saved.data.sheets);
  expect(reopened.data.crossSheetConnections).toEqual(
    saved.data.crossSheetConnections,
  );
});

test("terminal accessories insert through the existing library as editable mechanical parts", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#newProjectName").fill("Terminal accessories");
  await page.locator("#createProject").click();
  await addSectionSheet(page, "A3");
  for (const [index, part] of [
    "3003020",
    "3047028",
    "3212060",
    "3022276",
  ].entries()) {
    await page.locator('[data-module="Electrical"]').click();
    await page.getByRole("menuitem", { name: /Symbol Library$/ }).click();
    await page.locator("#symbolSearch").fill(part);
    await page.locator('[data-insert="phoenix-contact-' + part + '"]').click();
    const point = await sheetPoint(page, 200 + index * 250, 250);
    await page.mouse.click(point.x, point.y);
  }
  expect(errors).toEqual([]);
  await expect(page.locator("#statusText")).toContainText(
    "no electrical terminals",
  );
  await expect(page.locator("#userDrawings [data-terminal]")).toHaveCount(0);
  await expect(page.locator("#userDrawings .drawing-object")).toHaveCount(4);
  await page.screenshot({
    path: "test-results/terminal-accessory-library.png",
  });
  await page.locator('[data-draw="select"]').click();
  await page.locator("#userDrawings .drawing-object").last().dblclick();
  await expect(page.locator("#selectionDetails")).toContainText("CLIPFIX 35-5");
  await page.locator('[data-component-property="ref"]').fill("ACC-END");
  await page.locator('[data-component-property="ref"]').press("Tab");
  const saved = await saveDrawing(page, "terminal-accessories");
  expect(
    saved.data.objects.find((o: { ref?: string }) => o.ref === "ACC-END")
      .componentId,
  ).toBe("phoenix-contact-3022276");
  await page.reload();
  await page.locator("#openFile").setInputFiles(saved.path);
  const reopened = await saveDrawing(page, "terminal-accessories-reopened");
  expect(reopened.data.objects).toEqual(saved.data.objects);
});

test("editable draw order controls topmost selection and survives undo and reopen", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#createProject").click();
  await addSectionSheet(page, "A3");
  const fixture = await saveDrawing(page, "draw-order-fixture");
  const sheetId = fixture.data.activeSheet;
  fixture.data.objects.push(
    ...["lower", "upper"].map((id, index) => ({
      id,
      sheetId,
      kind: "rect",
      x: 240 + index * 30,
      y: 200,
      x2: 360 + index * 30,
      y2: 310,
      fill: index === 0 ? "#aabbcc" : "#88aa99",
    })),
  );
  await page.locator("#openFile").setInputFiles({
    name: "draw-order.adigun.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(fixture.data)),
  });
  const point = await sheetPoint(page, 310, 245);
  const topAtPoint = async () =>
    page.evaluate(
      ({ x, y }) =>
        document
          .elementFromPoint(x, y)
          ?.closest("[data-object]")
          ?.getAttribute("data-object"),
      await sheetPoint(page, 310, 245),
    );
  expect(await topAtPoint()).toBe("upper");
  await page.locator('[data-draw="select"]').click();
  await page.mouse.dblclick(point.x, point.y);
  const order = page.getByRole("spinbutton", { name: "Draw order" });
  await expect(order).toHaveAttribute("data-object-z-index", "upper");
  await order.fill("-1");
  await order.press("Tab");
  expect(await topAtPoint()).toBe("lower");
  await page.locator('[data-action="undo"]').click();
  expect(await topAtPoint()).toBe("upper");
  await page.locator('[data-action="redo"]').click();
  expect(await topAtPoint()).toBe("lower");
  const saved = await saveDrawing(page, "draw-order-saved");
  expect(
    saved.data.objects.find((o: { id: string }) => o.id === "upper"),
  ).toMatchObject({ zIndex: -1 });
  await page.reload();
  await page.locator("#openFile").setInputFiles(saved.path);
  expect(await topAtPoint()).toBe("lower");
  const reopened = await saveDrawing(page, "draw-order-reopened");
  expect(reopened.data.objects).toEqual(saved.data.objects);
});

test("every published component renders from a valid native project and reopens exactly", async ({
  page,
}) => {
  test.setTimeout(60000);
  page.setDefaultTimeout(8000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const fixture = await page.evaluate(() => {
    const engine = Reflect.get(window, "AdigunCADEngine");
    const sheets: { id: string; name: string; sectionId: string }[] = [];
    const objects = [];
    for (const [index, entry] of engine.catalog().entries()) {
      const slot = index % 12,
        pageIndex = Math.floor(index / 12);
      if (slot === 0)
        sheets.push({
          id: "catalogue-" + pageIndex,
          name: "Catalogue sheet " + (pageIndex + 1),
          sectionId: "A2",
        });
      const part = engine.createInstance(
        entry.id,
        150 + (slot % 4) * 270,
        155 + Math.floor(slot / 4) * 170,
        "LIB-" + (index + 1),
      );
      part.sheetId = sheets[pageIndex].id;
      part.displayScale = 0.3;
      const definition = engine.component(entry.id);
      if (
        !engine.validateInstance(part).valid ||
        engine.worldPins(part).length !== definition.symbol.pins.length
      )
        throw new Error("Invalid native component: " + entry.id);
      objects.push(part);
    }
    const sections = engine.defaultProjectSections();
    return engine.serializeProject({
      project: "Complete published catalogue",
      sections,
      sheets: engine.numberProjectSheets(sheets, sections),
      activeSheet: sheets[0].id,
      objects,
    });
  });
  const expected = JSON.parse(fixture);
  await page.locator("#openFile").setInputFiles({
    name: "catalogue.adigun.json",
    mimeType: "application/json",
    buffer: Buffer.from(fixture),
  });
  for (const sheet of expected.sheets) {
    await page.locator('#projectTree [data-sheet="' + sheet.id + '"]').click();
    const parts = expected.objects.filter(
      (object: { sheetId: string }) => object.sheetId === sheet.id,
    );
    await expect(page.locator("#userDrawings .drawing-object")).toHaveCount(
      parts.length,
    );
    for (const part of parts) {
      await expect(
        page
          .locator(
            '#userDrawings .drawing-object[data-object="' + part.id + '"]',
          )
          .locator("title"),
      ).toContainText(part.ref);
    }
  }
  const saved = await saveDrawing(page, "all-catalogue-parts");
  expect(saved.data.objects).toEqual(expected.objects);
  await page.reload();
  await page.locator("#openFile").setInputFiles(saved.path);
  const reopened = await saveDrawing(page, "all-catalogue-parts-reopened");
  expect(reopened.data.objects).toEqual(saved.data.objects);
  expect(errors).toEqual([]);
});

test("terminal clicks auto-route and manual bends survive moving both connected parts", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#createProject").click();
  await addSectionSheet(page);
  await page.locator('[data-panel="symbols"]').click();
  await page.locator("#symbolSearch").fill("eplan-terminal");
  const clickAt = async (x: number, y: number) => {
    const point = await sheetPoint(page, x, y);
    await page.mouse.click(point.x, point.y);
  };
  for (const [x, y] of [
    [200, 320],
    [430, 320],
    [630, 440],
  ]) {
    await page.locator('[data-insert="eplan-terminal"]').click();
    await clickAt(x, y);
  }
  await clickAt(200, 320);
  await expect(page.locator("[data-wire-draft-preview]")).toHaveCount(1);
  await clickAt(430, 320);
  await expect(page.locator("[data-wire-draft-preview]")).toHaveCount(0);

  const start = await sheetPoint(page, 430, 320);
  const firstBend = await sheetPoint(page, 480, 240);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(firstBend.x, firstBend.y, { steps: 8 });
  await page.mouse.up();
  await clickAt(550, 395);
  await clickAt(590, 375);
  await clickAt(630, 440);
  await expect(page.locator("[data-wire-draft-preview]")).toHaveCount(0);
  await expect(page.getByLabel("Wire route axis")).toHaveValue("manual");
  const before = await saveDrawing(page, "manual-route-before-move");
  const wires = before.data.objects.filter(
    (o: { kind: string }) => o.kind === "wire",
  );
  expect(wires).toHaveLength(2);
  expect(wires[0].waypoints).toBeUndefined();
  expect(wires[0].attachments.start).toBeTruthy();
  expect(wires[0].attachments.end).toBeTruthy();
  const manual = wires[1];
  expect(manual.attachments.start).toEqual(wires[0].attachments.end);
  expect(manual.attachments.end).toBeTruthy();
  expect(manual.waypoints).toHaveLength(3);
  for (const [index, [x, y]] of [
    [480, 240],
    [550, 395],
    [590, 375],
  ].entries()) {
    expect(Math.abs(manual.waypoints[index].x - x)).toBeLessThan(2);
    expect(Math.abs(manual.waypoints[index].y - y)).toBeLessThan(2);
  }
  for (const [x, y] of [
    [430, 320],
    [630, 440],
  ]) {
    const from = await sheetPoint(page, x - 5, y - 3);
    const to = await sheetPoint(page, x + 12, y + 5);
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 6 });
    await page.mouse.up();
  }
  const after = await saveDrawing(page, "manual-route-after-move");
  const moved = after.data.objects.find(
    (o: { id: string }) => o.id === manual.id,
  );
  expect(moved.waypoints).toEqual(manual.waypoints);
  expect(moved.attachments).toEqual(manual.attachments);
  expect(moved.x1).toBeGreaterThan(manual.x1);
  expect(moved.x2).toBeGreaterThan(manual.x2);
  for (const [end, coordinate] of [
    ["start", "x1"],
    ["end", "x2"],
  ] as const) {
    const part = after.data.objects.find(
      (o: { id: string }) => o.id === manual.attachments[end].instanceId,
    );
    expect(moved[coordinate]).toBe(part.x);
  }
  await page.screenshot({
    path: test.info().outputPath("terminal-wire-bends.png"),
  });
  await page.reload();
  await page.locator("#openFile").setInputFiles(after.path);
  const reopened = await saveDrawing(page, "manual-route-reopened");
  expect(reopened.data.objects).toEqual(after.data.objects);
});

for (const template of [
  "",
  "eng0601",
  "indicator",
  "relay",
  "hardware-plc-input",
  "hardware-relay",
  "hardware-sensor",
  "hardware-sitop",
]) {
  test(`pick, drop, wire, recolor, reroute and reconnect from the existing canvas [${template || "blank"}]`, async ({
    page,
  }) => {
    test.setTimeout(60000);
    page.setDefaultTimeout(7500);
    await page.goto("/");
    await page.locator('[data-action="new"]').first().click();
    if (template) await page.locator("#projectTemplate").selectOption(template);
    await page.locator("#createProject").click();
    await addSectionSheet(page);
    await page.locator('[data-module="Electrical"]').click();
    await page.getByRole("menuitem", { name: "Symbol Library" }).click();
    const clickAt = async (x: number, y: number) => {
      const point = await sheetPoint(page, x, y);
      await page.mouse.click(point.x, point.y);
    };
    const drag = async (
      from: { x: number; y: number },
      to: { x: number; y: number },
    ) => {
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      await page.mouse.move(to.x, to.y, { steps: 8 });
      await page.mouse.up();
    };
    const labelPart = async (label: string) => {
      await expect(page.locator("#rightPanelTitle")).toHaveText("Properties");
      const field = page.getByLabel("Component label", { exact: true });
      await expect(field).toBeVisible();
      await field.fill(label);
      await field.press("Tab");
      await expect(
        page.locator("#userDrawings .selected-object"),
      ).toContainText(label);
    };
    await page.locator("#symbolSearch").fill("eplan-terminal");
    await page.locator('[data-insert="eplan-terminal"]').click();
    const previewPoint = await sheetPoint(page, 200, 320);
    await page.mouse.move(previewPoint.x, previewPoint.y);
    await expect(page.locator('#drawing [opacity="0.55"]')).toBeVisible();
    await clickAt(200, 320);
    await expect(page.locator("#userDrawings .selected-object")).toHaveCount(1);
    await labelPart("Bench input");
    await page.locator("#symbolSearch").fill("eplan-resistor");
    await page.locator('[data-insert="eplan-resistor"]').click();
    await clickAt(200, 320);
    await expect(page.locator("#userDrawings .drawing-object")).toHaveCount(1);
    await clickAt(390, 320);
    await labelPart("Bench resistor");
    await page.locator("#symbolSearch").fill("eplan-terminal");
    const point = await sheetPoint(page, 650, 440);
    const card = await page
      .locator('[data-insert="eplan-terminal"]')
      .boundingBox();
    expect(card).toBeTruthy();
    await page.mouse.move(
      card!.x + card!.width / 2,
      card!.y + card!.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(point.x - 4, point.y, { steps: 10 });
    await page.mouse.move(point.x, point.y, { steps: 3 });
    await page.mouse.up();
    await expect(page.locator("#userDrawings .drawing-object")).toHaveCount(3);
    await labelPart("Bench output");
    if (template === "eng0601") {
      await page.screenshot({
        path: test.info().outputPath("eng0601-component-properties.png"),
      });
    }
    if (template) {
      await expect(page.locator('[data-draw="select"]')).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      const source = await sheetPoint(page, 200, 320);
      const destination = await sheetPoint(page, 380, 320);
      await page.mouse.move(source.x, source.y);
      await page.mouse.down();
      await page.mouse.move(destination.x, destination.y, { steps: 8 });
      await expect(
        page.locator("[data-terminal-wire-preview]"),
      ).toHaveAttribute("d", /M200 320 L380 320/);
      if (template === "eng0601") {
        await page.screenshot({
          path: test.info().outputPath("eng0601-terminal-drag.png"),
        });
      }
      await page.mouse.up();
    } else {
      await page.locator('[data-draw="wire"]').click();
      await clickAt(200, 320);
      await expect(page.locator("#userDrawings .drawing-object")).toHaveCount(
        3,
      );
      await clickAt(380, 320);
    }
    await expect(page.locator("#userDrawings .drawing-object")).toHaveCount(4);
    await page.locator('[data-draw="select"]').click();
    await clickAt(285, 320);
    const color = page.locator(
      'input[type="color"][data-drawing-style="stroke"]',
    );
    await color.fill("#d94024");
    await page
      .getByRole("combobox", { name: "Wire route axis" })
      .selectOption("y");
    const lane = page.getByRole("spinbutton", { name: "Wire lane coordinate" });
    await lane.fill("365");
    await lane.press("Tab");
    const handle = await page
      .locator('[data-wire-end-handle="end"]')
      .boundingBox();
    expect(handle).toBeTruthy();
    await drag(
      { x: handle!.x + handle!.width / 2, y: handle!.y + handle!.height / 2 },
      await sheetPoint(page, 650, 440),
    );
    if (template === "eng0601") {
      await page.screenshot({
        path: test.info().outputPath("eng0601-reconnected-wire.png"),
      });
    }
    const beforeMove = await saveDrawing(page, "workshop-before-move");
    const terminal = beforeMove.data.objects.find(
      (o: { displayName?: string }) => o.displayName === "Bench output",
    );
    const wire = beforeMove.data.objects.find(
      (o: { kind: string; sheetId: string }) =>
        o.kind === "wire" && o.sheetId === terminal.sheetId,
    );
    expect(wire).toMatchObject({
      stroke: "#d94024",
      route: { axis: "y", coordinate: 365 },
      attachments: { end: { instanceId: terminal.id, pinId: "1" } },
    });
    await drag(
      await sheetPoint(page, 646, 437),
      await sheetPoint(page, 659.7, 449.3),
    );
    const saved = await saveDrawing(page, "workshop-complete");
    const moved = saved.data.objects.find(
      (o: { id: string }) => o.id === terminal.id,
    );
    expect(Math.abs(moved.x - 663.7)).toBeLessThan(1);
    expect(moved.x % 2.5).not.toBe(0);
    expect(
      saved.data.objects.find((o: { id: string }) => o.id === wire.id),
    ).toMatchObject({
      x2: moved.x,
      y2: moved.y,
      attachments: wire.attachments,
    });
    await page.reload();
    await page.locator("#openFile").setInputFiles(saved.path);
    const reopened = await saveDrawing(page, "workshop-reopened");
    expect(reopened.data.objects).toEqual(saved.data.objects);
  });
}

test("drafts across the full viewport with a signed, pointer-centered camera", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1750, height: 700 });
  await page.goto("/");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#createProject").click();
  await addSectionSheet(page);
  const drawing = page.locator("#drawing");
  const stage = page.locator("#canvasStage");
  await expect
    .poll(async () => {
      const canvas = await drawing.boundingBox();
      const available = await stage.boundingBox();
      return (
        Math.abs(canvas!.width - available!.width) +
        Math.abs(canvas!.height - available!.height)
      );
    })
    .toBeLessThan(2);

  const start = await sheetPoint(page, -65, 250);
  const end = await sheetPoint(page, -25, 320);
  const box = (await drawing.boundingBox())!;
  expect(start.x).toBeGreaterThan(box.x);
  await page.locator('[data-draw="line"]').click();
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y);
  await page.mouse.up();
  const line = page.locator("#userDrawings [data-object]");
  await expect(line).toHaveCount(1);
  const geometry = await line.innerHTML();

  const anchor = await sheetPoint(page, 200, 300);
  await page.mouse.move(anchor.x, anchor.y);
  await page.mouse.wheel(0, -200);
  await expect(page.locator("#zoomValue")).not.toHaveText("100%");
  const zoomed = await sheetPoint(page, 200, 300);
  expect(Math.abs(zoomed.x - anchor.x)).toBeLessThan(0.5);
  expect(Math.abs(zoomed.y - anchor.y)).toBeLessThan(0.5);
  await page.mouse.down({ button: "middle" });
  await page.mouse.move(anchor.x + 85, anchor.y + 45);
  await page.mouse.up({ button: "middle" });
  const panned = await sheetPoint(page, 200, 300);
  expect(Math.abs(panned.x - zoomed.x - 85)).toBeLessThan(0.5);
  expect(Math.abs(panned.y - zoomed.y - 45)).toBeLessThan(0.5);

  await page.setViewportSize({ width: 1250, height: 900 });
  await expect
    .poll(async () =>
      drawing.evaluate((svg: SVGSVGElement) => {
        const view = svg.viewBox.baseVal;
        return Math.abs(
          view.width / view.height - svg.clientWidth / svg.clientHeight,
        );
      }),
    )
    .toBeLessThan(0.001);
  expect(await line.innerHTML()).toBe(geometry);
});

test("free drafting sheets save their print-frame visibility independently", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#createProject").click();
  await page.locator('[data-project-section="A2"]').click();
  await page.locator("#newSheet").click();
  await page.getByRole("button", { name: "Free drafting" }).click();
  await page.locator("#projectTree [data-generated-sheet]").click();
  const frame = page.locator("#customSheetFrame");
  await expect(frame).toBeHidden();
  await page.locator('[data-inspector="Properties"]').click();
  const setting = page.getByRole("checkbox", { name: "Show print frame" });
  await expect(setting).not.toBeChecked();
  await setting.check();
  await expect(frame).toBeVisible();
  await setting.uncheck();
  await expect(frame).toBeHidden();
  const saved = await saveDrawing(page, "free-drafting-frame");
  expect(saved.data.sheets[0].showPrintFrame).toBe(false);
  await page.locator("#openFile").setInputFiles(saved.path);
  await expect(frame).toBeHidden();
});
