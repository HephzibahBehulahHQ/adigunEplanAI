import { test, expect, type Page, type Route } from "@playwright/test";
import type { Project } from "../../packages/electrical-model/project.ts";
import { accountStorageKey } from "../../packages/project-storage/repository.ts";
import { avatarImages } from "../fixtures/avatar-image.mjs";
const backend = "https://fqcbfnktdvqojyezxeis.supabase.co";
const a = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  b = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const authKey = "adiguneplanai.auth.v1";
const user = (id: string) => ({
  id,
  aud: "authenticated",
  role: "authenticated",
  email: `${id === a ? "a" : "b"}@example.invalid`,
  email_confirmed_at: "2026-01-01T00:00:00Z",
  confirmed_at: "2026-01-01T00:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {
    other_product: { display_name: "Preserve me" },
    adiguneplanai_profile: { display_name: "", retained: "keep" },
  },
  identities: [],
  is_anonymous: false,
});
type Row = {
  owner_id: string;
  native_project_id: string;
  payload: Project;
  revision: number;
  updated_at: string;
};
function session(id: string) {
  const now = Math.floor(Date.now() / 1000);
  const encoded = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const token = `${encoded({ alg: "HS256", typ: "JWT" })}.${encoded({ sub: id, aud: "authenticated", role: "authenticated", exp: now + 3600, iat: now, iss: `${backend}/auth/v1`, is_anonymous: false })}.mock-signature`;
  return {
    access_token: token,
    refresh_token: `refresh-${id}`,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: now + 3600,
    user: user(id),
  };
}
async function mockBackend(page: Page) {
  const users = new Map([
    [a, user(a)],
    [b, user(b)],
  ]);
  const sessions = new Map([
    [a, session(a)],
    [b, session(b)],
  ]);
  const rows = new Map<string, Row>();
  const history = new Map<string, Row[]>();
  const avatars = new Map<string, Buffer>();
  const calls: {
    method: string;
    url: URL;
    owner: string | null;
    body: Record<string, unknown> | null;
  }[] = [];
  const control = {
    holdOwner: null as string | null,
    held: null as { route: Route; row: Row[] } | null,
    failNextWrite: false,
    anonymous: false,
    failVerify: false,
  };
  const reply = (route: Route, body: unknown, status = 200) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  await page.route(`${backend}/**`, async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    const token = request.headers().authorization?.replace(/^Bearer /, "");
    const owner =
      [...sessions].find(([, value]) => value.access_token === token)?.[0] ??
      null;
    const body =
      request.postData() &&
      request.headers()["content-type"]?.includes("application/json")
        ? (request.postDataJSON() as Record<string, unknown>)
        : null;
    calls.push({ method: request.method(), url, owner, body });
    if (url.pathname === "/auth/v1/token") {
      const id =
        body?.email === "b@example.invalid" ||
        body?.refresh_token === `refresh-${b}`
          ? b
          : a;
      return reply(route, { ...sessions.get(id), user: users.get(id) });
    }
    if (url.pathname === "/auth/v1/user") {
      if (!owner) return reply(route, { message: "unauthorized" }, 401);
      if (control.failVerify && request.method() === "GET")
        return reply(route, { message: "temporarily unavailable" }, 503);
      const current = users.get(owner)!;
      if (request.method() === "PUT" && body?.data)
        Object.assign(current.user_metadata, body.data);
      return reply(route, { ...current, is_anonymous: control.anonymous });
    }
    if (url.pathname === "/auth/v1/logout")
      return route.fulfill({ status: 204 });
    if (url.pathname === "/auth/v1/signup") return reply(route, user(a));
    if (url.pathname === "/auth/v1/recover") return reply(route, {});
    if (url.pathname.startsWith("/storage/v1/")) {
      const prefix = "/storage/v1/object/adiguneplanai-avatars/";
      const signed = "/storage/v1/object/sign/adiguneplanai-avatars/";
      if (url.pathname.startsWith(signed)) {
        const objectPath = url.pathname.slice(signed.length);
        if (
          request.method() === "GET" &&
          url.searchParams.get("token") === "mock-signed" &&
          avatars.has(objectPath)
        )
          return route.fulfill({
            status: 200,
            contentType: "image/png",
            body: avatars.get(objectPath)!,
          });
        if (!owner || !objectPath.startsWith(`${owner}/`))
          return reply(route, {}, 403);
        return reply(route, {
          signedURL:
            url.pathname.replace("/storage/v1", "") + "?token=mock-signed",
        });
      }
      if (!owner) return reply(route, {}, 401);
      if (request.method() === "DELETE") {
        const paths = body?.prefixes as string[];
        expect(paths.every((path) => path.startsWith(`${owner}/`))).toBe(true);
        paths.forEach((path) => avatars.delete(path));
        return reply(route, []);
      }
      if (request.method() === "POST" && url.pathname.startsWith(prefix)) {
        const objectPath = url.pathname.slice(prefix.length);
        expect(objectPath.startsWith(`${owner}/`)).toBe(true);
        avatars.set(objectPath, request.postDataBuffer()!);
        return reply(route, { Key: `adiguneplanai-avatars/${objectPath}` });
      }
      return route.abort();
    }
    if (!url.pathname.startsWith("/rest/v1/")) return route.abort();
    if (!owner) return reply(route, {}, 401);
    expect(request.headers().apikey).toMatch(/^sb_publishable_/);
    expect(request.headers()["accept-profile"]).toBe("adiguneplanai");
    expect(url.searchParams.get("owner_id")).toBe(`eq.${owner}`);
    const id =
      url.searchParams.get("native_project_id")?.replace(/^eq\./, "") ??
      String(body?.native_project_id ?? "");
    const key = `${owner}:${id}`;
    if (url.pathname.endsWith("project_history")) {
      const wanted = url.searchParams.get("revision")?.replace(/^eq\./, "");
      const result = (history.get(key) ?? [])
        .filter((row) => !wanted || row.revision === Number(wanted))
        .sort((x, y) => y.revision - x.revision);
      return reply(route, result);
    }
    if (request.method() === "GET") {
      const result = id
        ? rows.has(key)
          ? [rows.get(key)!]
          : []
        : [...rows.values()]
            .filter((row) => row.owner_id === owner)
            .map((row) => ({ ...row, name: row.payload.name }));
      if (id && control.holdOwner === owner) {
        control.holdOwner = null;
        control.held = { route, row: structuredClone(result) };
        return;
      }
      return reply(route, result);
    }
    if (control.failNextWrite) {
      control.failNextWrite = false;
      return route.abort("failed");
    }
    const existing = rows.get(key);
    if (request.method() === "POST" && existing) return reply(route, {}, 409);
    if (
      request.method() === "PATCH" &&
      (!existing ||
        url.searchParams.get("revision") !== `eq.${existing.revision}`)
    )
      return reply(route, []);
    const row: Row = {
      owner_id: owner,
      native_project_id: id,
      payload: body?.payload as Project,
      revision: (existing?.revision ?? 0) + 1,
      updated_at: new Date().toISOString(),
    };
    rows.set(key, row);
    history.set(key, [...(history.get(key) ?? []), structuredClone(row)]);
    return reply(route, [row], request.method() === "POST" ? 201 : 200);
  });
  return { users, sessions, rows, history, avatars, calls, control };
}
async function openAccount(page: Page) {
  const dialog = page.getByRole("dialog", { name: "Account", exact: true });
  if (!(await dialog.isVisible()))
    await page.getByRole("button", { name: "Account", exact: true }).click();
  return dialog;
}
async function signIn(page: Page, id: string) {
  const dialog = await openAccount(page);
  const form = dialog.getByRole("form", {
    name: "Account credentials",
    exact: true,
  });
  await form
    .getByLabel("Email", { exact: true })
    .fill(`${id === a ? "a" : "b"}@example.invalid`);
  await form.getByLabel("Password", { exact: true }).fill("mock-password-123");
  await form.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator(".account-dot")).toHaveAttribute(
    "data-account-state",
    "verified",
  );
}
async function signOut(page: Page) {
  const dialog = await openAccount(page);
  await dialog
    .getByRole("button", { name: "Sign out of this app", exact: true })
    .click();
  await expect(page.locator(".account-dot")).toHaveAttribute(
    "data-account-state",
    "guest",
  );
}
async function create(page: Page, name: string) {
  await page.getByRole("button", { name: "New project", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "New project", exact: true });
  await dialog.getByLabel("Project name", { exact: true }).fill(name);
  await dialog.getByRole("button", { name: "Create", exact: true }).click();
}
const stored = (
  page: Page,
  owner: string | null,
): Promise<{ projects: Project[] }> =>
  page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? '{"projects":[]}'),
    accountStorageKey(owner),
  );

test("guest, A and B keep local projects and undo histories isolated; stale cloud loads cannot cross sign-out", async ({
  page,
}) => {
  const mock = await mockBackend(page);
  await page.goto("/");
  await create(page, "Guest project");
  await signIn(page, a);
  await expect(
    page.getByRole("heading", { name: "No project open", exact: true }),
  ).toBeVisible();
  await create(page, "A private");
  await page
    .getByRole("button", { name: "New drawing page", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Undo · Header", exact: true }),
  ).toBeEnabled();
  expect(
    mock.calls.filter(
      (call) => call.url.pathname.startsWith("/rest/") && call.method !== "GET",
    ),
  ).toHaveLength(0);
  let dialog = await openAccount(page);
  await dialog
    .getByRole("button", { name: "Save project to cloud", exact: true })
    .click();
  await expect(
    dialog.getByText("Project snapshot saved to cloud.", { exact: true }),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "List cloud projects", exact: true })
    .click();
  mock.control.holdOwner = a;
  await dialog
    .getByRole("button", { name: "Open cloud project: A private", exact: true })
    .click();
  await expect.poll(() => Boolean(mock.control.held)).toBe(true);
  await signOut(page);
  await expect(page.locator(".empty-workspace")).toBeVisible();
  await page
    .getByTestId("project-picker")
    .selectOption({ label: "Guest project" });
  await expect(page.locator(".project-title")).toHaveText("Guest project");
  await expect(
    page.getByRole("button", { name: "Undo · Header", exact: true }),
  ).toBeDisabled();
  await signIn(page, b);
  await expect(
    page.getByRole("heading", { name: "No project open", exact: true }),
  ).toBeVisible();
  await create(page, "B private");
  await mock.control.held!.route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(mock.control.held!.row),
  });
  await expect(page.locator(".project-title")).toHaveText("B private");
  dialog = await openAccount(page);
  await dialog
    .getByRole("button", { name: "List cloud projects", exact: true })
    .click();
  await expect(
    dialog.getByRole("button", {
      name: "Open cloud project: A private",
      exact: true,
    }),
  ).toHaveCount(0);
  expect((await stored(page, b)).projects.map((p) => p.name)).toEqual([
    "B private",
  ]);
  expect((await stored(page, a)).projects.map((p) => p.name)).toEqual([
    "A private",
  ]);
  expect((await stored(page, null)).projects.map((p) => p.name)).toEqual([
    "Guest project",
  ]);
  expect(
    mock.calls
      .filter((call) => call.url.pathname.endsWith("logout"))
      .every((call) => call.url.searchParams.get("scope") === "local"),
  ).toBe(true);
});

test("explicit cloud conflicts, immutable history and failed-save review preserve local recovery", async ({
  page,
}) => {
  const mock = await mockBackend(page);
  await page.goto("/");
  await signIn(page, a);
  await create(page, "Versioned project");
  let dialog = await openAccount(page);
  const save = () =>
    dialog
      .getByRole("button", { name: "Save project to cloud", exact: true })
      .click();
  await save();
  await expect(
    dialog.getByText("Project snapshot saved to cloud.", { exact: true }),
  ).toBeVisible();
  const project = (await stored(page, a)).projects[0],
    key = `${a}:${project.id}`;
  const external = {
    ...mock.rows.get(key)!,
    revision: 2,
    payload: { ...project, name: "Remote revision" },
  };
  mock.rows.set(key, external);
  mock.history.get(key)!.push(structuredClone(external));
  await save();
  await expect(
    dialog.getByRole("button", {
      name: "Replace cloud after review",
      exact: true,
    }),
  ).toBeVisible();
  expect(mock.rows.get(key)!.revision).toBe(2);
  page.once("dialog", (d) => d.accept());
  await dialog
    .getByRole("button", { name: "Replace cloud after review", exact: true })
    .click();
  await expect(
    dialog.getByText("Project snapshot saved to cloud.", { exact: true }),
  ).toBeVisible();
  expect(mock.rows.get(key)!.revision).toBe(3);
  await dialog
    .getByRole("button", { name: "List cloud projects", exact: true })
    .click();
  await dialog
    .getByRole("button", {
      name: "Version history: Versioned project",
      exact: true,
    })
    .click();
  page.once("dialog", (d) => d.accept());
  await dialog
    .getByRole("button", { name: "Open revision 2", exact: true })
    .click();
  await expect(page.locator(".project-title")).toHaveText("Remote revision");
  expect(mock.rows.get(key)!.revision).toBe(3);
  mock.control.failNextWrite = true;
  await save();
  await expect(
    dialog.getByRole("heading", {
      name: "Cloud saves awaiting review",
      exact: true,
    }),
  ).toBeVisible();
  page.once("dialog", (d) => {
    expect(d.type()).toBe("beforeunload");
    d.accept();
  });
  await page.reload();
  await expect(page.locator(".account-dot")).toHaveAttribute(
    "data-account-state",
    "verified",
  );
  dialog = await openAccount(page);
  await expect(
    dialog.getByRole("button", { name: "Save project to cloud", exact: true }),
  ).toBeDisabled();
  await dialog
    .getByRole("button", { name: "Review cloud status", exact: true })
    .click();
  await expect(
    dialog.getByRole("button", {
      name: "Load latest cloud version",
      exact: true,
    }),
  ).toBeVisible();
  expect((await stored(page, a)).projects[0].name).toBe("Remote revision");
});

test("registration/reset stay signed out and verified profiles preserve other product metadata", async ({
  page,
}) => {
  const mock = await mockBackend(page);
  await page.goto("/");
  let dialog = await openAccount(page);
  await dialog.getByRole("button", { name: "Register", exact: true }).click();
  let form = dialog.getByRole("form", {
    name: "Account credentials",
    exact: true,
  });
  await form.getByLabel("Email", { exact: true }).fill("a@example.invalid");
  await form.getByLabel("Password", { exact: true }).fill("mock-password-123");
  await form.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator(".account-dot")).toHaveAttribute(
    "data-account-state",
    "guest",
  );
  await dialog
    .getByRole("button", { name: "Reset password", exact: true })
    .click();
  form = dialog.getByRole("form", { name: "Account credentials", exact: true });
  await form.getByLabel("Email", { exact: true }).fill("a@example.invalid");
  await form.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    dialog.getByText(
      "If the request is eligible, check your email to continue.",
      { exact: true },
    ),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Sign in", exact: true }).click();
  await signIn(page, a);
  dialog = await openAccount(page);
  const profile = dialog.getByRole("form", {
    name: "Save profile",
    exact: true,
  });
  await profile
    .getByLabel("Display name", { exact: true })
    .fill("My engineering profile");
  await profile
    .getByRole("button", { name: "Save profile", exact: true })
    .click();
  await expect(
    dialog.getByText("Profile saved.", { exact: true }),
  ).toBeVisible();
  expect(mock.users.get(a)!.user_metadata.other_product.display_name).toBe(
    "Preserve me",
  );
  expect(mock.users.get(a)!.user_metadata.adiguneplanai_profile.retained).toBe(
    "keep",
  );
  const password = dialog.getByRole("form", {
    name: "Update password",
    exact: true,
  });
  await password
    .getByLabel("New password", { exact: true })
    .fill("mock-updated-password");
  await password
    .getByRole("button", { name: "Update password", exact: true })
    .click();
  await expect(
    dialog.getByText("Password updated.", { exact: true }),
  ).toBeVisible();
  expect(
    mock.calls
      .filter((call) =>
        ["/auth/v1/signup", "/auth/v1/recover"].includes(call.url.pathname),
      )
      .every(
        (call) =>
          call.url.searchParams.get("redirect_to") ===
          "https://adiguneplanai.hephzibahbehulah.com/",
      ),
  ).toBe(true);
});

test("cached sessions never produce a green status for a server-reported anonymous user", async ({
  page,
}) => {
  const mock = await mockBackend(page);
  mock.control.anonymous = true;
  await page.addInitScript(
    (value) =>
      localStorage.setItem("adiguneplanai.auth.v1", JSON.stringify(value)),
    mock.sessions.get(a),
  );
  await page.goto("/");
  await expect(page.locator(".account-dot")).toHaveAttribute(
    "data-account-state",
    "guest",
  );
  expect(
    mock.calls.filter((call) => call.url.pathname.startsWith("/rest/")),
  ).toHaveLength(0);
  expect(
    await page.evaluate((key) => Boolean(localStorage.getItem(key)), authKey),
  ).toBe(true);
});

test("avatar previews validate image content and upload/remove only in the verified owner's private bucket", async ({
  page,
}) => {
  const mock = await mockBackend(page);
  await page.goto("/");
  await signIn(page, a);
  const dialog = await openAccount(page);
  const upload = dialog.getByRole("form", {
    name: "Upload avatar",
    exact: true,
  });
  await upload.getByLabel("Avatar image", { exact: true }).setInputFiles({
    name: "avatar.png",
    mimeType: "image/png",
    buffer: Buffer.from(avatarImages.png, "base64"),
  });
  await expect(
    upload.getByRole("button", { name: "Upload avatar", exact: true }),
  ).toBeEnabled();
  await upload
    .getByRole("button", { name: "Upload avatar", exact: true })
    .click();
  await expect(
    dialog.getByText("Avatar uploaded.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".profile-avatar")).toHaveAttribute(
    "src",
    new RegExp(`/adiguneplanai-avatars/${a}/`),
  );
  expect(mock.avatars.size).toBe(1);
  expect(mock.users.get(a)!.user_metadata.other_product.display_name).toBe(
    "Preserve me",
  );
  await upload.getByLabel("Avatar image", { exact: true }).setInputFiles({
    name: "fake.png",
    mimeType: "image/png",
    buffer: Buffer.from("<svg onload='alert(1)' />"),
  });
  await expect(
    dialog.getByText(
      "Choose a valid PNG, JPEG or WebP image within the stated size limits.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    upload.getByRole("button", { name: "Upload avatar", exact: true }),
  ).toBeDisabled();
  expect(mock.avatars.size).toBe(1);
  await upload
    .getByRole("button", { name: "Remove avatar", exact: true })
    .click();
  await expect(
    dialog.getByText("Avatar removed.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".profile-avatar")).toHaveCount(0);
  expect(mock.avatars.size).toBe(0);
});

test("transient same-account verification failures preserve local editing and disable cloud until reverified", async ({
  page,
}) => {
  const mock = await mockBackend(page);
  await page.goto("/");
  await signIn(page, a);
  await create(page, "Offline A");
  mock.control.failVerify = true;
  await page.evaluate((value) => {
    const channel = new BroadcastChannel("adiguneplanai.auth.v1");
    channel.postMessage({ event: "TOKEN_REFRESHED", session: value });
    channel.close();
  }, mock.sessions.get(a));
  await expect(page.locator(".account-dot")).toHaveAttribute(
    "data-account-state",
    "unverified",
  );
  await expect(page.locator(".project-title")).toHaveText("Offline A");
  await page
    .getByRole("button", { name: "New drawing page", exact: true })
    .click();
  expect((await stored(page, a)).projects[0].pages).toHaveLength(2);
  const dialog = await openAccount(page);
  await expect(
    dialog.getByRole("button", { name: "Save project to cloud", exact: true }),
  ).toBeDisabled();
  await expect(
    dialog.getByRole("button", { name: "List cloud projects", exact: true }),
  ).toBeDisabled();
  mock.control.failVerify = false;
  await dialog
    .getByRole("button", { name: "Verify session again", exact: true })
    .click();
  await expect(page.locator(".account-dot")).toHaveAttribute(
    "data-account-state",
    "verified",
  );
  expect((await stored(page, a)).projects[0].name).toBe("Offline A");
  expect((await stored(page, null)).projects).toHaveLength(0);
  expect(
    mock.calls.filter(
      (call) => call.url.pathname.startsWith("/rest/") && call.method !== "GET",
    ),
  ).toHaveLength(0);
});

test("compact owner toolbar has one settings/help control and searches actual local projects and pages", async ({
  page,
}) => {
  await mockBackend(page);
  await page.goto("/");
  await create(page, "Alpha");
  await page
    .getByRole("button", { name: "New drawing page", exact: true })
    .click();
  await create(page, "Beta");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page
    .getByRole("button", { name: "Search workspace", exact: true })
    .click();
  const search = page.getByRole("dialog", {
    name: "Search workspace",
    exact: true,
  });
  await search
    .getByLabel("Project or page name", { exact: true })
    .fill("Sheet 2");
  await search
    .getByRole("button", { name: "Sheet 2 · Alpha", exact: true })
    .click();
  await expect(page.locator(".project-title")).toHaveText("Alpha");
  await expect(
    page.getByRole("application", { name: "Sheet 2", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Settings", exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Help", exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("combobox", { name: "Language", exact: true }),
  ).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  const boxes = await page
    .locator(".owner-toolbar > button")
    .evaluateAll((elements) =>
      elements.map((element) => {
        const r = element.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      }),
    );
  expect(boxes).toHaveLength(6);
  for (const box of boxes) {
    expect(box.width).toBeGreaterThanOrEqual(29);
    expect(box.height).toBeGreaterThanOrEqual(36);
  }
  for (let i = 1; i < boxes.length; i++)
    if (boxes[i].y === boxes[i - 1].y)
      expect(
        boxes[i].x - (boxes[i - 1].x + boxes[i - 1].width),
      ).toBeGreaterThanOrEqual(5);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
