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
    .getByRole("button", { name: "Remove room: Office", exact: true })
    .click();
  await expect(page.locator("[data-room-id]")).toHaveCount(0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator("[data-room-id]")).toHaveCount(1);
});
