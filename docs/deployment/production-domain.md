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

## M7–M12 cabinet/export development release — 2026-11-06

Verified source: PR #11 merge `17580877be2f4036137c8e832e213c580b870fab`, tree `d9768e4802f86b01d01a6c331be0d8493e24309b`. This includes merged PR #10 and the corrected cabinet face visibility, native DXF/riser drawings and document-language exports. Source checks passed 289 unit/tooling and 118 browser cases, type/lint/format, licensing/notices/build and production dependency audit.

[Hosted staging 42186682807](https://github.com/HephzibahBehulahHQ/adigunEplanAI/actions/runs/42186682807) checked out the exact source and passed all seven affected workflows against Vite preview of the production build. Its separate scoped publishing job created candidate `e2c5da75f304cbf347f9006324a457814f0aac26` with the source as its sole parent. Artifact SHA-256: `6880d3ec77532e2c8c555f0223f2c7cf44879f87a26b9b01ed62b290bc14daeb`. The exact candidate remote head was read back; only 21 distribution paths changed, with no deletion, source change or CNAME/Pages-configuration change. Earlier hashed assets were preserved.

[PR #12](https://github.com/HephzibahBehulahHQ/adigunEplanAI/pull/12) passed exact-head CI [42186950753](https://github.com/HephzibahBehulahHQ/adigunEplanAI/actions/runs/42186950753) and merged as deployment revision `c0bc73bca9f6722e6ad90341f125d325abf0f617`. [Integrated CI 42187419006](https://github.com/HephzibahBehulahHQ/adigunEplanAI/actions/runs/42187419006) and [Pages 42187418138](https://github.com/HephzibahBehulahHQ/adigunEplanAI/actions/runs/42187418138) passed.

[Canonical-origin verification 42188098759](https://github.com/HephzibahBehulahHQ/adigunEplanAI/actions/runs/42188098759) passed on 2026-11-06 at 08:30 UTC. It checked HTTPS source/tree/artifact provenance, independently hashed all 24 served runtime files and passed seven live cabinet/report/riser browser workflows. TLS verification stayed enabled. `build-info.json` records the source identity, build run, artifact digest and individual asset hashes.

The one-off preparation and verification workflows remain on `codex/prepare-pages-17580877`; they were not merged into main. The established Pages main/root configuration remains unchanged. A build artifact has limited Actions retention; the published Git distribution and its checksums are the durable release record.

This is a verified development increment. M13, the example library and readiness work remain unpublished in an unavailable execution workspace. Read [the continuation/recovery checkpoint](../agent/CONTINUATION_2026_11_06.md). Hosted authenticated acceptance, final engineering requirements and M18–M20 acceptance remain open.
