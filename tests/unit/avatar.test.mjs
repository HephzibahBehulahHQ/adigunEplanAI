import { test } from "node:test";
import assert from "node:assert/strict";
import { avatarImages } from "../fixtures/avatar-image.mjs";
import {
  avatarBucket,
  maxAvatarBytes,
  ownedAvatarPath,
  PrivateAvatars,
  validateAvatarFile,
} from "../../packages/project-storage/avatar.ts";
const owner = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const other = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const path = `${owner}/cccccccc-cccc-4ccc-8ccc-cccccccccccc.png`;
const png = () =>
  new Blob([Buffer.from(avatarImages.png, "base64")], { type: "image/png" });
const response = (data) =>
  new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
const make = (
  fetch,
  session = async () => ({ userId: owner, accessToken: "A", epoch: 1 }),
) =>
  new PrivateAvatars({
    url: "https://abcdefghijklmnopqrst.supabase.co",
    publishableKey: "sb_publishable_test",
    ownerId: owner,
    session,
    fetch,
  });

test("avatar validation matches actual PNG/JPEG/WebP signatures and bounded image dimensions", async () => {
  for (const [extension, mime] of [
    ["png", "image/png"],
    ["jpg", "image/jpeg"],
    ["webp", "image/webp"],
  ])
    assert.equal(
      await validateAvatarFile(
        new Blob([Buffer.from(avatarImages[extension], "base64")], {
          type: mime,
        }),
      ),
      extension,
    );
  for (const file of [
    new Blob(["<svg/>"], { type: "image/png" }),
    new Blob([Buffer.from(avatarImages.png, "base64")], { type: "image/jpeg" }),
    new Blob([new Uint8Array(maxAvatarBytes + 1)], { type: "image/png" }),
    new Blob([], { type: "image/png" }),
  ])
    await assert.rejects(validateAvatarFile(file), /avatarInvalid/);
  const huge = Buffer.from(avatarImages.png, "base64");
  huge.writeUInt32BE(5000, 16);
  await assert.rejects(
    validateAvatarFile(new Blob([huge], { type: "image/png" })),
    /avatarInvalid/,
  );
});

test("avatar upload, signing and deletion stay in the captured owner's private bucket", async () => {
  const calls = [];
  const client = make(async (url, options) => {
    calls.push({ url, options });
    if (url.includes("/object/sign/"))
      return response({
        signedURL: `/object/sign/${avatarBucket}/${path}?token=short-lived`,
      });
    return response({});
  });
  const uploaded = await client.upload(png());
  assert.ok(ownedAvatarPath(owner, uploaded));
  assert.ok(calls[0].url.endsWith(`${avatarBucket}/${uploaded}`));
  assert.equal(calls[0].options.headers.Authorization, "Bearer A");
  assert.equal(calls[0].options.headers["Content-Type"], "image/png");
  assert.equal(calls[0].options.headers["x-upsert"], "false");
  assert.match(
    await client.signedUrl(path),
    /^https:\/\/abcdefghijklmnopqrst\.supabase\.co\/storage\/v1\/object\/sign\//,
  );
  assert.deepEqual(JSON.parse(calls[1].options.body), { expiresIn: 300 });
  await client.remove(path);
  assert.equal(calls[2].options.method, "DELETE");
  assert.deepEqual(JSON.parse(calls[2].options.body), { prefixes: [path] });
});

test("avatar paths and signed URLs reject another owner, traversal and untrusted responses", async () => {
  let requests = 0;
  const client = make(async () => {
    requests++;
    return response({ signedURL: "https://example.invalid/image.png" });
  });
  for (const value of [
    `${other}/cccccccc-cccc-4ccc-8ccc-cccccccccccc.png`,
    `${owner}/../x.png`,
    "https://example.invalid/x.png",
  ]) {
    assert.equal(ownedAvatarPath(owner, value), false);
    await assert.rejects(client.remove(value), { code: "denied" });
  }
  assert.equal(requests, 0);
  await assert.rejects(client.signedUrl(path), { code: "invalidResponse" });
});

test("account changes during avatar validation or upload cannot expose stale results", async () => {
  let current = { userId: owner, accessToken: "A", epoch: 1 },
    requests = 0;
  const file = png();
  const read = file.arrayBuffer.bind(file);
  file.arrayBuffer = async () => {
    current = { userId: other, accessToken: "B", epoch: 2 };
    return read();
  };
  const client = make(
    async () => {
      requests++;
      return response({});
    },
    async () => current,
  );
  await assert.rejects(client.upload(file), { code: "accountChanged" });
  assert.equal(requests, 0);
  current = { userId: owner, accessToken: "A", epoch: 3 };
  const late = make(
    async () => {
      current = { ...current, epoch: 5 };
      return response({});
    },
    async () => current,
  );
  await assert.rejects(late.upload(png()), { code: "accountChanged" });
});
