import { test, expect } from "@playwright/test";

test("buildings, floors and dimensioned room outlines persist with undo and isolated floor views", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New project", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "New project", exact: true });
  await dialog
    .getByLabel("Project name", { exact: true })
    .fill("Building reference");
  await dialog.getByRole("button", { name: "Create", exact: true }).click();
  await page
    .getByRole("button", { name: "Building design", exact: true })
    .click();
  const building = page.getByRole("form", {
    name: "Add building",
    exact: true,
  });
  await building.getByLabel("Building name", { exact: true }).fill("Workshop");
  await building.getByLabel("Building address", { exact: true }).fill("Site A");
  await building
    .getByRole("button", { name: "Add building", exact: true })
    .click();
  const floor = page.getByRole("form", { name: "Add floor", exact: true });
  await floor.getByLabel("Floor name", { exact: true }).fill("Ground");
  await floor.getByRole("button", { name: "Add floor", exact: true }).click();
  const room = page.getByRole("form", { name: "Add room", exact: true });
  await room.getByLabel("Room name", { exact: true }).fill("Office");
  await room.getByLabel("Room X (mm)", { exact: true }).fill("-1000");
  await room.getByRole("button", { name: "Add room", exact: true }).click();
  await expect(page.locator("[data-room-id] polygon")).toHaveAttribute(
    "points",
    "-1000,0 3000,0 3000,3000 -1000,3000",
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator("[data-room-id]")).toHaveCount(0);
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(page.locator("[data-room-id]")).toHaveCount(1);
  await floor.getByLabel("Floor name", { exact: true }).fill("Upper");
  await floor.getByLabel("Elevation (mm)", { exact: true }).fill("3000");
  await floor.getByRole("button", { name: "Add floor", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Floor name", exact: true })
    .selectOption({ label: "Upper" });
  await expect(page.locator("[data-room-id]")).toHaveCount(0);
  await page.reload();
  await page
    .getByRole("button", { name: "Building design", exact: true })
    .click();
  await expect(page.locator("[data-room-id] polygon")).toHaveAttribute(
    "points",
    "-1000,0 3000,0 3000,3000 -1000,3000",
  );
  await page
    .locator(".building-editor summary")
    .filter({ hasText: /^Office$/ })
    .click();
  await expect(page.locator(".building-editor dl")).toContainText("12 m²");
  await expect(page.locator(".building-editor dl")).toContainText("14 m");
  await page
    .getByRole("checkbox", { name: "Show room edge dimensions", exact: true })
    .check();
  await expect(page.locator("[data-room-dimension]")).toHaveCount(4);
  await expect(page.locator("[data-room-dimension]").first()).toHaveText(
    "4000 mm",
  );
  const edit = page.getByRole("form", {
    name: "Edit room: Office",
    exact: true,
  });
  await edit
    .getByLabel("Boundary vertices (x,y mm per line)", { exact: true })
    .fill("0,0\n4000,0\n4000,2000\n2000,2000\n2000,4000\n0,4000");
  await edit.getByRole("button", { name: "Apply room", exact: true }).click();
  await expect(page.locator("[data-room-id] polygon")).toHaveAttribute(
    "points",
    "0,0 4000,0 4000,2000 2000,2000 2000,4000 0,4000",
  );
  await expect(page.locator(".building-editor dl")).toContainText("12 m²");
  await expect(page.locator(".building-editor dl")).toContainText("16 m");
  await expect(page.locator("[data-room-dimension]")).toHaveCount(6);
  await edit
    .getByLabel("Boundary vertices (x,y mm per line)", { exact: true })
    .fill("0,0\n4000,4000\n0,4000\n4000,0");
  await edit.getByRole("button", { name: "Apply room", exact: true }).click();
  await expect(page.locator("[data-room-id] polygon")).toHaveAttribute(
    "points",
    "0,0 4000,0 4000,2000 2000,2000 2000,4000 0,4000",
  );
  await page.reload();
  await page
    .getByRole("button", { name: "Building design", exact: true })
    .click();
  await expect(page.locator("[data-room-id] polygon")).toHaveAttribute(
    "points",
    "0,0 4000,0 4000,2000 2000,2000 2000,4000 0,4000",
  );
  await page
    .getByRole("button", { name: "Remove room: Office", exact: true })
    .click();
  await expect(page.locator("[data-room-id]")).toHaveCount(0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator("[data-room-id]")).toHaveCount(1);
});

test("graphical room drawing snaps vertices and commits only on Finish", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New project", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "New project", exact: true });
  await dialog.getByLabel("Project name", { exact: true }).fill("Drawn room");
  await dialog.getByRole("button", { name: "Create", exact: true }).click();
  await page
    .getByRole("button", { name: "Building design", exact: true })
    .click();
  const building = page.getByRole("form", {
    name: "Add building",
    exact: true,
  });
  await building.getByLabel("Building name", { exact: true }).fill("Building");
  await building
    .getByRole("button", { name: "Add building", exact: true })
    .click();
  const floor = page.getByRole("form", { name: "Add floor", exact: true });
  await floor.getByLabel("Floor name", { exact: true }).fill("Floor");
  await floor.getByRole("button", { name: "Add floor", exact: true }).click();
  const read = () =>
    page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("adiguneplanai.projects.v1")!)
          .projects[0],
    );
  const before = await read();
  const draw = page.getByRole("form", { name: "Draw room", exact: true });
  await draw.getByLabel("Room name", { exact: true }).fill("Drawn");
  await draw.getByRole("button", { name: "Draw room", exact: true }).click();
  const canvas = page.locator(".building-plan");
  const click = async (x: number, y: number) => {
    await canvas.scrollIntoViewIfNeeded();
    const point = await canvas.evaluate(
      (svg, p) => {
        const point = new DOMPoint(p.x, p.y).matrixTransform(
          (svg as SVGSVGElement).getScreenCTM()!,
        );
        return { x: point.x, y: point.y };
      },
      { x, y },
    );
    await page.mouse.click(point.x, point.y);
  };
  await click(1060, 1060);
  await click(3060, 1060);
  expect(await read()).toEqual(before);
  await canvas.press("Escape");
  await expect(page.locator("[data-room-draft]")).toHaveCount(0);
  expect(await read()).toEqual(before);
  await draw.getByRole("button", { name: "Draw room", exact: true }).click();
  for (const [x, y] of [
    [1060, 1060],
    [3060, 1060],
    [3060, 2060],
    [1060, 2060],
  ])
    await click(x, y);
  await page
    .getByRole("button", { name: "Remove last vertex", exact: true })
    .click();
  await expect(page.locator("[data-room-draft]")).toHaveAttribute(
    "points",
    "1100,1100 3100,1100 3100,2100",
  );
  await click(1060, 2060);
  expect(await read()).toEqual(before);
  await page.getByRole("button", { name: "Finish room", exact: true }).click();
  await expect(page.locator("[data-room-id] polygon")).toHaveAttribute(
    "points",
    "1100,1100 3100,1100 3100,2100 1100,2100",
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  expect((await read()).rooms).toHaveLength(0);
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  const after = await read();
  await page.reload();
  expect((await read()).rooms).toEqual(after.rooms);
});

test("native walls obey architectural layer visibility and locking and survive reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New project", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "New project", exact: true });
  await dialog
    .getByLabel("Project name", { exact: true })
    .fill("Walls reference");
  await dialog.getByRole("button", { name: "Create", exact: true }).click();
  await page
    .getByRole("button", { name: "Building design", exact: true })
    .click();
  const building = page.getByRole("form", {
    name: "Add building",
    exact: true,
  });
  await building.getByLabel("Building name", { exact: true }).fill("B");
  await building
    .getByRole("button", { name: "Add building", exact: true })
    .click();
  const floor = page.getByRole("form", { name: "Add floor", exact: true });
  await floor.getByLabel("Floor name", { exact: true }).fill("Ground");
  await floor.getByRole("button", { name: "Add floor", exact: true }).click();
  await page.locator(".wall-tools > summary").click();
  const layer = page.getByRole("form", { name: "Add plan layer", exact: true });
  await layer
    .getByLabel("Plan layer name", { exact: true })
    .fill("Architecture");
  await layer
    .getByRole("button", { name: "Add plan layer", exact: true })
    .click();
  const wall = page.getByRole("form", { name: "Add wall", exact: true });
  await wall.getByLabel("Wall name", { exact: true }).fill("North wall");
  await wall.getByRole("button", { name: "Add wall", exact: true }).click();
  await expect(page.locator("[data-wall-id]")).toHaveAttribute(
    "points",
    "0,100 4000,100 4000,-100 0,-100",
  );
  await page
    .getByRole("checkbox", { name: "Locked: Architecture", exact: true })
    .check();
  await expect(
    wall.getByRole("button", { name: "Add wall", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Remove wall: North wall", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("checkbox", { name: "Visible: Architecture", exact: true })
    .uncheck();
  await expect(page.locator("[data-wall-id]")).toHaveCount(0);
  await page.reload();
  await page
    .getByRole("button", { name: "Building design", exact: true })
    .click();
  await page.locator(".wall-tools > summary").click();
  await expect(
    page.getByRole("checkbox", { name: "Locked: Architecture", exact: true }),
  ).toBeChecked();
  await page
    .getByRole("checkbox", { name: "Visible: Architecture", exact: true })
    .check();
  await expect(page.locator("[data-wall-id]")).toHaveCount(1);
  await page
    .getByRole("checkbox", { name: "Locked: Architecture", exact: true })
    .uncheck();
  await page
    .getByRole("button", { name: "Remove wall: North wall", exact: true })
    .click();
  await expect(page.locator("[data-wall-id]")).toHaveCount(0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator("[data-wall-id]")).toHaveCount(1);
  await page.getByText("Edit wall: North wall", { exact: true }).click();
  const opening = page.getByRole("form", {
    name: "Add opening: North wall",
    exact: true,
  });
  await opening.getByLabel("Opening name", { exact: true }).fill("D1");
  await opening
    .getByRole("button", { name: "Add opening", exact: true })
    .click();
  await expect(page.locator("[data-wall-id]")).toHaveCount(2);
  await expect(page.locator("[data-opening-id] path")).toHaveAttribute(
    "d",
    "M 1400 0 A 900 900 0 0 1 500 900",
  );
  await expect(
    page.getByRole("button", { name: "Remove wall: North wall", exact: true }),
  ).toBeDisabled();
  await opening.getByLabel("Opening name", { exact: true }).fill("W1");
  await opening
    .getByLabel("Opening type", { exact: true })
    .selectOption("window");
  await opening
    .getByLabel("Offset along wall (mm)", { exact: true })
    .fill("2200");
  await opening.getByLabel("Opening width (mm)", { exact: true }).fill("1000");
  await opening.getByLabel("Opening height (mm)", { exact: true }).fill("1000");
  await opening.getByLabel("Sill height (mm)", { exact: true }).fill("1000");
  await opening
    .getByRole("button", { name: "Add opening", exact: true })
    .click();
  await expect(page.locator("[data-wall-id]")).toHaveCount(3);
  await expect(page.locator("[data-opening-id] polygon")).toHaveAttribute(
    "points",
    "2200,100 3200,100 3200,-100 2200,-100",
  );
  const edit = page.getByRole("form", {
    name: "Edit wall: North wall",
    exact: true,
  });
  await edit.getByLabel("End X (mm)", { exact: true }).fill("1000");
  await edit.getByRole("button", { name: "Edit wall", exact: true }).click();
  await expect(page.locator("[data-wall-id]")).toHaveCount(3);
  await edit.getByLabel("End X (mm)", { exact: true }).fill("5000");
  await edit.getByRole("button", { name: "Edit wall", exact: true }).click();
  await expect(page.locator("[data-wall-id]").last()).toHaveAttribute(
    "points",
    "3200,100 5000,100 5000,-100 3200,-100",
  );
  await page
    .getByRole("checkbox", { name: "Locked: Architecture", exact: true })
    .check();
  await expect(
    opening.getByRole("button", { name: "Add opening", exact: true }),
  ).toBeDisabled();
  await expect(
    edit.getByRole("button", { name: "Edit wall", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await page
    .getByRole("button", { name: "Building design", exact: true })
    .click();
  await expect(page.locator("[data-opening-id]")).toHaveCount(2);
  await page.locator(".wall-tools > summary").click();
  await page
    .getByRole("checkbox", { name: "Locked: Architecture", exact: true })
    .uncheck();
  await page.getByText("Edit wall: North wall", { exact: true }).click();
  await page
    .getByRole("button", { name: "Remove opening: D1", exact: true })
    .click();
  await expect(page.locator("[data-opening-id] path")).toHaveCount(0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator("[data-opening-id] path")).toHaveCount(1);
});
