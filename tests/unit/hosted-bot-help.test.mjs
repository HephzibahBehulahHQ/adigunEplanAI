import test from "node:test";
import assert from "node:assert/strict";
import { requestHostedHelp } from "../../apps/web/src/requestHostedHelp.ts";

test("hosted help sends only the question to the same origin and rejects redirects", async () => {
  const signal = new AbortController().signal;
  const source = {
    document: "HELP.md",
    title: "DXF import",
    excerpt: "Use Building design.",
  };
  const result = await requestHostedHelp(
    "  How do I import DXF?  ",
    "test-token",
    signal,
    async (path, options) => {
      assert.equal(path, "/api/adigun-bot/help");
      assert.equal(options.redirect, "error");
      assert.equal(options.signal, signal);
      assert.equal(options.headers.Authorization, "Bearer test-token");
      assert.deepEqual(JSON.parse(options.body), {
        question: "How do I import DXF?",
      });
      return Response.json({ sources: [source] });
    },
  );
  assert.deepEqual(result, [source]);
});

test("hosted help reports sign-out, rate limiting and malformed source responses", async () => {
  const signal = new AbortController().signal;
  for (const [status, code] of [
    [401, "signedOut"],
    [429, "rateLimited"],
    [500, "unavailable"],
  ]) {
    await assert.rejects(
      requestHostedHelp(
        "Help",
        "test-token",
        signal,
        async () => new Response(null, { status }),
      ),
      { code },
    );
  }
  await assert.rejects(
    requestHostedHelp("Help", "test-token", signal, async () =>
      Response.json({
        sources: [{ document: "other.md", title: "Wrong", excerpt: "Wrong" }],
      }),
    ),
    { code: "unavailable" },
  );
});
