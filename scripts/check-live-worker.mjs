import { createHash } from "node:crypto";
import { setTimeout } from "node:timers/promises";

const origin = "https://adiguneplanai.hephzibahbehulah.com";
const commit = process.argv[2];
if (!/^[a-f0-9]{40}$/.test(commit ?? "")) {
  throw new Error("Provide the expected source commit SHA");
}

const request = (path, init) =>
  fetch(`${origin}${path}`, {
    redirect: "error",
    signal: AbortSignal.timeout(10000),
    ...init,
  });

for (let attempt = 0; attempt < 8; attempt++) {
  try {
    const manifest = await request("/build-info.json");
    if (!manifest.ok) throw new Error(`Build manifest HTTP ${manifest.status}`);
    const info = await manifest.json();
    if (info.sourceCommit !== commit) throw new Error("Source commit differs");

    const index = await request("/");
    for (const entry of [manifest, index]) {
      if (!entry.headers.get("Cache-Control")?.includes("no-store")) {
        throw new Error("Release document may be reused from cache");
      }
    }
    const hash = createHash("sha256")
      .update(Buffer.from(await index.arrayBuffer()))
      .digest("hex");
    if (!index.ok || info.assets?.["index.html"] !== hash) {
      throw new Error("Entry page content differs from the manifest");
    }

    const account = await request("/api/account", {
      headers: { Origin: origin },
    });
    if (
      account.status !== 405 ||
      (await account.json()).error !== "method-not-allowed"
    ) {
      throw new Error("Account route did not return the expected response");
    }
    console.log(`Verified ${commit} and the account Worker route at ${origin}`);
    break;
  } catch (error) {
    if (attempt === 7) throw error;
    await setTimeout(8000);
  }
}
