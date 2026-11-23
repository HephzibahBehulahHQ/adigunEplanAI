import accountWorker from "./account.mjs";

const releasePaths = new Set(["/", "/index.html", "/build-info.json"]);

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/account") return accountWorker.fetch(request, env);
    const asset = await env.ASSETS.fetch(request);
    if (!releasePaths.has(pathname)) return asset;
    const response = new Response(asset.body, asset);
    response.headers.set("Cache-Control", "no-store");
    return response;
  },
};
