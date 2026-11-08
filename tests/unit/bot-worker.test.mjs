import test from "node:test";
import assert from "node:assert/strict";
import { createBotHandler } from "../../apps/bot-worker/handler.mjs";

const origin = "https://adiguneplanai.hephzibahbehulah.com";
const token = "Bearer test-session-token-example";
const user = {
  id: "eccd6153-a344-482f-b678-915871ebca01",
  is_anonymous: false,
};
const help =
  "# Help\n\n## Contents\n\nIndex\n\n## DXF import\n\nUse the Building design workspace.";
function request(
  body = JSON.stringify({ question: "Where do I import DXF?" }),
  headers = {},
) {
  return new Request(origin + "/api/adigun-bot/help", {
    method: "POST",
    headers: {
      Origin: origin,
      Authorization: token,
      "Content-Type": "application/json",
      ...headers,
    },
    body,
  });
}
function bindings(run) {
  return {
    SUPABASE_PUBLISHABLE_KEY: "test-key",
    AI: { run },
    BOT_USER_LIMIT: {
      limit: async ({ key }) => ({ success: key === user.id }),
    },
    BOT_ROUTE_LIMIT: { limit: async () => ({ success: true }) },
  };
}

test("hosted help returns approved source excerpts instead of provider text", async () => {
  const handler = createBotHandler(help, async (url, options) => {
    assert.match(url, /supabase\.co\/auth\/v1\/user$/);
    assert.equal(options.headers.Authorization, token);
    return Response.json(user);
  });
  const result = await handler(
    request(),
    bindings(async (_model, input) => {
      assert.equal(input.messages[1].content, "Where do I import DXF?");
      assert.ok(!JSON.stringify(input).includes(token));
      return { response: "[1,1]" };
    }),
  );
  assert.equal(result.status, 200);
  assert.equal(result.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await result.json(), {
    sources: [
      {
        title: "DXF import",
        excerpt: "Use the Building design workspace.",
        document: "HELP.md",
      },
    ],
  });
});

test("hosted help rejects cross-origin, oversized, extra-data and guest requests before inference", async () => {
  let calls = 0;
  const env = bindings(async () => {
    calls++;
    return { response: "[]" };
  });
  const handler = createBotHandler(help, async () =>
    Response.json({ ...user, is_anonymous: true }),
  );
  assert.equal(
    (
      await handler(
        request(undefined, { Origin: "https://other.example" }),
        env,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handler(
        request(JSON.stringify({ question: "Help", project: {} })),
        env,
      )
    ).status,
    400,
  );
  assert.equal((await handler(request(" ".repeat(5000)), env)).status, 400);
  assert.equal((await handler(request(), env)).status, 401);
  assert.equal(calls, 0);
});

test("hosted help enforces quota and rejects fabricated source IDs", async () => {
  const handler = createBotHandler(help, async () => Response.json(user));
  let calls = 0;
  const env = bindings(async () => {
    calls++;
    return { response: "[999]" };
  });
  assert.equal(
    (
      await handler(request(), {
        ...env,
        BOT_ROUTE_LIMIT: { limit: async () => ({ success: false }) },
      })
    ).status,
    429,
  );
  assert.equal(calls, 0);
  assert.equal((await handler(request(), env)).status, 502);
  assert.equal(calls, 1);
});
