# Production domain and development deployment

Required public origin: **https://adiguneplanai.hephzibahbehulah.com/**.

GitHub Pages settings were inspected on 2026-11-03: deployment source is `main` at `/ (root)`, the required custom domain is configured, and HTTPS enforcement is enabled. The previous root contained CNAME, README.md and _config.yml. These files were preserved when publishing the built development application.

Verified deployment checkpoint: source commit `74706bcff2b9c749f9faed36c0ebf1619ba1c6e2`, source tree `be8c487534fd692b60879f746be2417acf3352dc`, deployment commit `e88f400912737dc3896deaf9bfa4d3d81763bd7f`. Pages run [41583498469](https://github.com/HephzibahBehulahHQ/adigunEplanAI/actions/runs/41583498469) succeeded. HTTPS build-info.json returned the expected source identity and a live nested SVG-import browser workflow passed. This is a development milestone, not completion of production acceptance.

## Publishing verified increments

Run the required checks, license/notices gates and production dependency audit; publish reviewed source to its visible branch and wait for hosted CI. Build the verified source tree and publish runtime files, notices, .nojekyll and build-info.json to the existing Pages main/root branch without replacing unrelated files or custom-domain settings. Use expected-head checks and ordinary forward commits. Verify the Pages run, live source provenance and relevant live behavior. Keep dependencies, caches, credentials, logs and test artifacts out of publication.

Git Credential Manager's official sign-in flow returned Windows Access is denied in this environment. The connected GitHub app can publish canonical source commits; public Git fetch and fast-forward synchronization work. The prior independent local history is retained on codex/milestone-7-building-local-preserved. Do not force-push or discard local changes to synchronize.

## Remaining production work

Cloudflare DNS administration was not changed in this task. Supabase authentication/cloud persistence and its production Site URL/redirect verification remain part of Milestone 12. Do not select another product's backend without verified ownership and authorization. Never place privileged keys in the frontend. Full production readiness, security/backup/performance checks, engineering acceptance and the 500-example validation remain required by MASTER_SPECIFICATION.md; a successful development deployment does not satisfy those gates.

## Verified domain and backend checkpoint — 2026-11-03

Source f8c9109ef356e00d1c84d29922dd83a164ff0f52 is synchronized locally/remotely, with hosted CI runs 41612800375 and 41612792082 successful. The equipment application from e05a96523884d4c5e337b90bf33b057bbe0036e9 is live in deployment 495391b7790fdc1dc8b1fc590418632e648153a5; Pages run 41600847758 and the live equipment browser workflow passed.

Cloudflare administration confirms a DNS-only CNAME from adiguneplanai.hephzibahbehulah.com to hephzibahbehulahhq.github.io (Auto TTL). GitHub Pages main/root serves the canonical HTTPS domain. No DNS replacement was necessary.

The authorized shared Supabase HQ project now has an isolated adiguneplanai schema, private project snapshots, revision trigger, restricted column grants and owner RLS. API schema exposure was saved and verified after reload; existing schema selections and shared Auth Site URL were preserved. The canonical-domain redirect was already allowed. Rollback SQL tests and an anonymous REST denial passed. Authenticated browser cloud saving is still unimplemented; no cloud-connected UI status is claimed. See supabase/README.md for exact evidence and remaining integration work.


## M7 floor electrical distribution — 2026-11-06

Merged source `ca40f313bae0ac8aa7688ca0f498d5c8a379ae69` (tree `04468f5fef8bb51399633e40678401b2bf9fd0a2`) contains the verified PR #9 candidate `296bac8d5c4dfecd87b802868da66b7fc02d58f7`. Hosted runs [42171235299](https://github.com/HephzibahBehulahHQ/adigunEplanAI/actions/runs/42171235299) and [42171243149](https://github.com/HephzibahBehulahHQ/adigunEplanAI/actions/runs/42171243149) passed 171 unit/tooling and 97 browser tests, type/lint/format/build, licenses/notices and the production dependency audit. The main/root distribution copies the reviewed apps/web/dist output and runtime notices while preserving CNAME, .nojekyll, prior hashed assets and unrelated files. build-info.json identifies the source above. The new device/circuit/route workflows also passed against the local production build. Serving state is verified separately against the Pages workflow and canonical-domain build-info; this remains development M7, not M19/M20 acceptance.
