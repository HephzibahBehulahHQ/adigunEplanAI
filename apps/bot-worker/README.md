# Hosted Adigun BOT help

This Worker is a read-only hosted help endpoint. It accepts a question and a registered Supabase session. Workers AI selects relevant section IDs from the shipped help index, and the endpoint returns excerpts from the bundled documentation. The request contract accepts no project payload.

Production activation requires the GitHub Actions release flow to bind the Worker to the same-origin path `/api/adigun-bot/help`, supply `SUPABASE_PUBLISHABLE_KEY` as a Worker setting, and verify the two account-wide rate limiter namespace IDs are available. Route integration must preserve the existing static site. The web app still needs a verified account session and a hosted help control. The Worker has no public workers.dev or preview URL.

The binding uses [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/configuration/bindings/). [Rate counters](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) apply per Cloudflare location and are approximate.
