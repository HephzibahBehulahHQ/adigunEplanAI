import { test } from "node:test";
import assert from "node:assert/strict";
import { CloudProjects } from "../../packages/project-storage/cloud.ts";
import { nativeProject } from "../fixtures/native-project.mjs";

const userId = "eccd6153-a344-482f-b678-915871ebca01";
const session = { userId, accessToken: "test-session-token" };
function row(project, revision = 1) {
  return {
    owner_id: userId,
    native_project_id: project.id,
    payload: project,
    revision,
    updated_at: "2026-11-03T10:00:00Z",
  };
}
function client(request, getSession = async () => session) {
  return new CloudProjects({
    projectRef: "fqcbfnktdvqojyezxeis",
    publishableKey: "sb_publishable_test",
    session: getSession,
    fetch: request,
  });
}
const response = (data, status = 200) =>
  new Response(JSON.stringify(data), { status });

test("cloud create/update preserve native payload and require explicit revision filters", async () => {
  const project = nativeProject();
  const before = structuredClone(project);
  const calls = [];
  const cloud = client(async (url, options) => {
    calls.push({ url: new URL(url), options });
    return response([row(project, calls.length)]);
  });
  const first = await cloud.save(project, null);
  assert.deepEqual(first.project, project);
  assert.equal(first.revision, 1);
  assert.equal((await cloud.save(project, 1)).revision, 2);
  assert.deepEqual(project, before);
  assert.equal(calls[0].options.method, "POST");
  assert.deepEqual(Object.keys(JSON.parse(calls[0].options.body)).sort(), [
    "native_project_id",
    "payload",
  ]);
  assert.equal(calls[1].options.method, "PATCH");
  assert.equal(calls[1].url.searchParams.get("revision"), "eq.1");
  assert.equal(calls[1].url.searchParams.get("owner_id"), `eq.${userId}`);
  assert.equal(calls[1].options.headers["Content-Profile"], "adiguneplanai");
  assert.equal(
    calls[1].options.headers.Authorization,
    "Bearer test-session-token",
  );
});

test("cloud save rejects stale or duplicate saves without retrying or overwriting", async () => {
  for (const [status, data] of [
    [200, []],
    [409, { message: "duplicate" }],
  ]) {
    let count = 0;
    const cloud = client(async () => {
      count++;
      return response(data, status);
    });
    await assert.rejects(
      cloud.save(nativeProject(), status === 409 ? null : 3),
      { code: "conflict" },
    );
    assert.equal(count, 1);
  }
});

test("cloud load checks owner, payload identity, model integrity and revision", async () => {
  const project = nativeProject();
  const good = row(project);
  for (const bad of [
    { ...good, owner_id: "another-owner" },
    { ...good, payload: { ...project, id: "different-project" } },
    { ...good, payload: { ...project, devices: [] } },
    { ...good, revision: 0 },
    { ...good, updated_at: "invalid" },
  ]) {
    await assert.rejects(client(async () => response([bad])).load(project.id), {
      code: "invalidResponse",
    });
  }
  assert.equal(await client(async () => response([])).load(project.id), null);
  assert.deepEqual(
    (await client(async () => response([good])).load(project.id)).project,
    project,
  );
});

test("invalid models and signed-out users never send project data", async () => {
  let count = 0;
  const fetch = async () => {
    count++;
    return response([]);
  };
  await assert.rejects(
    client(fetch).save({ ...nativeProject(), devices: [] }, null),
  );
  await assert.rejects(
    client(fetch, async () => null).save(nativeProject(), null),
    { code: "signedOut" },
  );
  assert.equal(count, 0);
});

test("cloud responses cannot cross account changes and errors do not expose server details", async () => {
  let current = session;
  const cloud = client(
    async () => {
      current = null;
      return response([row(nativeProject())]);
    },
    async () => current,
  );
  await assert.rejects(cloud.load(nativeProject().id), {
    code: "accountChanged",
  });
  for (const status of [401, 403, 500]) {
    await assert.rejects(
      client(async () =>
        response({ message: "private server detail" }, status),
      ).load("id"),
      { message: status === 500 ? "unavailable" : "denied" },
    );
  }
  await assert.rejects(
    client(async () => {
      throw new Error("network detail");
    }).load("id"),
    { message: "unavailable" },
  );
});

test("pinned cloud clients never submit an earlier account's project through a new session", async () => {
  let requests = 0;
  const cloud = new CloudProjects({
    projectRef: "fqcbfnktdvqojyezxeis",
    publishableKey: "sb_publishable_test",
    ownerId: userId,
    session: async () => ({
      userId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      accessToken: "B",
    }),
    fetch: async () => {
      requests++;
      return response([]);
    },
  });
  await assert.rejects(cloud.save(nativeProject(), null), {
    code: "accountChanged",
  });
  assert.equal(requests, 0);
});

test("logout and sign-in to the same account invalidate the old request epoch", async () => {
  let current = { ...session, epoch: 1 };
  const cloud = client(
    async () => {
      current = { ...session, epoch: 3 };
      return response([row(nativeProject())]);
    },
    async () => current,
  );
  await assert.rejects(cloud.load(nativeProject().id), {
    code: "accountChanged",
  });
});

test("cloud list and immutable history validate owner and revision before exposing records", async () => {
  const project = nativeProject();
  const calls = [];
  const cloud = client(async (url) => {
    const parsed = new URL(url);
    calls.push(parsed);
    if (parsed.pathname.endsWith("project_history"))
      return response(
        parsed.searchParams.has("revision")
          ? [row(project, 2)]
          : [
              {
                owner_id: userId,
                native_project_id: project.id,
                revision: 2,
                updated_at: "2026-11-03T10:00:00Z",
              },
            ],
      );
    return response([
      {
        owner_id: userId,
        native_project_id: project.id,
        name: project.name,
        revision: 2,
        updated_at: "2026-11-03T10:00:00Z",
      },
    ]);
  });
  const listed = await cloud.list();
  assert.equal(listed.items[0].name, project.name);
  assert.equal(listed.hasMore, false);
  assert.equal((await cloud.history(project.id)).items[0].revision, 2);
  assert.deepEqual((await cloud.loadRevision(project.id, 2)).project, project);
  assert.ok(
    calls.every((url) => url.searchParams.get("owner_id") === `eq.${userId}`),
  );
  assert.equal(calls[2].searchParams.get("revision"), "eq.2");
  const foreign = {
    owner_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    native_project_id: project.id,
    name: project.name,
    revision: 2,
    updated_at: "2026-11-03T10:00:00Z",
  };
  await assert.rejects(client(async () => response([foreign])).list(), {
    code: "invalidResponse",
  });
  await assert.rejects(
    client(async () => response([foreign])).history(project.id),
    { code: "invalidResponse" },
  );
  await assert.rejects(
    client(async () => response([row(project, 3)])).loadRevision(project.id, 2),
    { code: "invalidResponse" },
  );
});

test("cloud history and list reject duplicate revisions, malformed names and late JSON account changes", async () => {
  const project = nativeProject();
  const r = row(project);
  await assert.rejects(
    client(async () => response([r, r])).history(project.id),
    { code: "invalidResponse" },
  );
  await assert.rejects(
    client(async () => response([{ ...r, name: "" }])).list(),
    { code: "invalidResponse" },
  );
  let current = { ...session, epoch: 1 };
  const cloud = client(
    async () => {
      const result = response([]);
      result.json = async () => {
        current = { ...session, epoch: 2 };
        return [r];
      };
      return result;
    },
    async () => current,
  );
  await assert.rejects(cloud.load(project.id), { code: "accountChanged" });
});
