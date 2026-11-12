# Project status

## 2026-11-12 — owner-approved UI-001 transformation (Project A only)

**Owner decision:** Project A (`adigunEplanAI`) must adopt the **exact visual workstation design and interaction architecture** seen in Project B (`AdigunAiAutoCad`), which is read-only and must not be modified. Interface comes before further feature work. Preserve Project A's entire 27-part master engineering scope, existing native editors/data and project compatibility. After actual merged/deployed interface verification, **stop for owner visual approval**. See `docs/PROJECT_B_INTERFACE_TRANSFORMATION.md` and updated `AdidunEplanAI Master PlanGoals`.

**Implementation checkpoint:** branch `codex/project-b-interface-first` and draft PR #39. Initial implementation changes `App.tsx`, `WorkspaceHeader.tsx` and new `workbench-shell.css`, adding compact title/document tabs, icon toolbar/rails, white drawing viewport and overlay menu composition without intentionally replacing electrical engines. This code is **not yet accepted as an exact Project B match**. Earlier CI runs failed formatting; one-off Prettier job succeeded, but a final checked head, layout screenshots, native browser regression, merge and deployment are still required. Do not mark UI-001 complete prematurely.

**Next Codex instructions:** fix the pending CI/visual issues; collect desktop/browser evidence; verify no regression in native edit/save/reopen and zero menu layout movement; merge/deploy only after required checks; verify production, then stop for owner sign-off. No changes to Project B.


## 2026-11-10 header/ribbon increment

Previous release: source PR #23 merged as `2260ffdc3bdbebf13286d074d1d628ee41bb16db`;
runtime PR #24 merged as `a5fdd4e294fd07e865a4e2211c5d4b198ec84c51`. Pages run
42776303785 and live verification 42776479457 passed: all 27 runtime hashes and
21 canonical-domain workflows matched the source manifest.

The current increment replaces the header with the owner-approved corporate mark,
native project status and account utilities, and organizes Home into the target command
groups. Cut and equal distribution use native history, geometry and connectivity.
Placement, symbol installation, manufacturer catalogue access, structural validation,
E-Check, BOM, view synchronization and themes invoke implemented paths. Examples
remain in File and the navigator. Autosave/recovery is preserved. Startup now ignores the last active project; pagehide clears only the session pointer. Any open project installs a native beforeunload reminder, even when local autosave succeeds; explicit close/new confirms unsaved changes. Closing/new resets selection, history and the viewport. Tests reopen saved projects explicitly after asserting a blank boot.

Local validation: 346 unit/tooling checks, typecheck, lint, formatting, template,
license/notices and build passed. Desktop visual inspection and native validation dialog
were checked. The first hosted browser run found legacy control selectors, an ambiguous import label and German profile-badge overflow; these have been corrected. Hosted full browser and production checks remain release gates for this
increment; CI and deployment receipts will be recorded in its PR. The local IAB clamps
small viewport overrides, so genuine 390px coverage must come from hosted Chromium.
Full workbench visual parity and the master-plan engineering/account/BOT/example gates
remain open. No manufacturer geometry or cloud-save verification is implied by the shell.

## 2026-11-09 verified PV release and open acceptance

Source `b43202a74aa7c19f48cd92f10cbff16cfe8d969e` (tree `19f012c195065095acf8b9d223fb748762055941`) passed hosted CI run 42623282605. Runtime deployment commit `7b94e649f2c4d2e6c15f768dd5ffd5d638e2804a` passed Pages run 42624237147 and exact-head CI run 42624237149. The package verified 107 runtime files and retained 105 earlier hashed assets. Live HTTPS provenance and hashes for the main bundle, example-library chunk and CSS matched. A production browser session opened the PV project with 9 devices, 8 wires, 2 pages and zero manufacturer-part claims. Local `npm run check` and all five example browser workflows passed.

The shipped library now has five original validated projects; 495 individually validated projects remain for the 500-project acceptance gate. The documented unpublished 233-example expansion was not recovered from available local project files, remote branches or PR history. Rebuild in validated batches. The user's `AdigunEplanTarget interface.png` remains the strict visual acceptance target and is unmet; the target's dense project data, full workbench details, and verified account/cloud/BOT status remain open. Earlier failed Pages attempt `f1a4b659` was superseded by the successful main-source runtime publication at `32c93fb`.

## Active template continuation — 2026-11-07

Current goal and exact CI/deployment receipts: [PR #18](https://github.com/HephzibahBehulahHQ/adigunEplanAI/pull/18).

Active product goal: **AdigunEplanAI — complete the approved master plan and
interface under the canonical global and HB Elektroniker templates**. Owner
authorization continues through commit, main integration and Actions deployment.
The Codex task-bar goal API is not exposed; no task-bar controls are claimed.

Continuation branch: `codex/product-goal-continuation`, based on verified main
`542a22d7b4a27b1bb3c4d0e4a4906ad757c2f094`. The universal product adapter now
feeds header/footer identity. CI enforces approved identity, destinations,
reference repositories, tokens/logo, master/interface consistency and truthful
capabilities. Eighteen focused template checks, TypeScript and full source CI passed. Exact
integration and public-deployment receipts are maintained in PR #18; full-spec
gates remain open.

## Prior verified delivery — 2026-11-07

Current delivery and exact CI/live-publication receipts:
[PR #14](https://github.com/HephzibahBehulahHQ/adigunEplanAI/pull/14).
Receipts are maintained there so a new status-only commit does not invalidate its
own source identity. The owner explicitly authorized commit, push, merge to main
and deployment in this session; no further routine confirmation is required.

Implemented: functional engineering ribbon, searchable native hierarchy,
transient native device selection synchronized between schematic and cabinet,
compact drawing mode, multiline annotation preservation/overflow reporting,
four original educational examples and a persistent nonmodal BOT window with
read-only local project/selection/BOM tools and grounded live connection findings.
Hosted AI and engineering mutation proposals are unavailable and labeled as such.

Frozen source `8d0296035634595c51dcb8e67e082440db62abec` passed 306 unit/tooling,
135 source browser and 18 production-build browser tests locally. A subsequent
active-tool timing improvement passed five repeated built-app checks; final
exact-head hosted evidence is recorded in PR #14. The production dependency audit
found zero vulnerabilities. A clean remote clone restored that source and passed
17 new domain tests using the already installed dependency set. This does not
claim independent-machine disaster recovery.

The managed workspace and native Git HTTPS push now work. Prior unpublished work
was not present in this fresh workspace or its recorded remote branch and was
not discarded. The four new examples do not establish recovery of that work or
completion of the required 500-project library. Legitimate live authenticated
account/storage verification, hosted AI configuration, remaining engineering and
interchange requirements, human review and full M18–M20 acceptance remain open.
Deployment of this tested development increment does not close those gates.

## Current publication and recovery — 2026-11-06 08:32 UTC

PR #11 source `17580877be2f4036137c8e832e213c580b870fab` is merged. Both exact-source CI runs passed 289 unit/tooling and 118 browser tests. Hosted staging run [42186682807](https://github.com/HephzibahBehulahHQ/adigunEplanAI/actions/runs/42186682807) passed seven production-build browser workflows and published candidate `e2c5da75f304cbf347f9006324a457814f0aac26`; its exact remote head and distribution-only changes were verified. PR #12 passed its CI and merged as `c0bc73bca9f6722e6ad90341f125d325abf0f617`. [Pages 42187418138](https://github.com/HephzibahBehulahHQ/adigunEplanAI/actions/runs/42187418138) and integrated-revision CI 42187419006 passed. [Live verification 42188098759](https://github.com/HephzibahBehulahHQ/adigunEplanAI/actions/runs/42188098759) confirmed the exact source, all 24 runtime SHA-256 hashes and seven cabinet/report/riser browser workflows at the canonical HTTPS origin. This development release is deployed; full M7–M20 acceptance remains open.

The execution workspace is unavailable. Local work-branch head `7b4ea96adbe32c8a26810716e722c1fdc141f970` was verified remotely, but subsequent M13/example/readiness WIP is synchronization pending and recovery is unverified. The last local checkpoint contains 233 authored/validated examples, including 183 unregistered additions; it does not establish 233 released examples. [Continuation and recovery](CONTINUATION_2026_11_06.md) records the known files, tests, failures and remaining 267 additions. Full milestone acceptance remains open.

## Implemented scope and retained gates

Current checkpoint: schema 17 continues M7–M12. M7 adds emergency lighting, fire-loop/data/PE devices, protected vertical risers, circuit-assignment diagrams and native PE schedules. M8 provides 25 versioned unit-aware calculation categories with explicit input evidence and limits. M9 provides shared native front/3D enclosure geometry, plates/rails/ducts/doors/compartments, sourced or explicitly manual equipment dimensions, six-face holes/entries, collision/clearance/mounting/access diagnostics, duct/heat estimates and SVG/OBJ export. M10 adds generic PLC modules, validated I/O/address/signal associations and control/safety documentation. M11 adds native drawing SVG/PNG/physical-size browser PDF plus derived CSV/JSON reports. M12 adds verified Supabase accounts, owner-scoped local workspaces, explicit cloud saves/history/conflicts and private avatars.

PR #10 merged as `f475498133c4dc23980b95a61cbae816cff29e1f`. The example-driven face-occlusion defect was corrected by PR #11 before staging the new runtime. Current implementation and acceptance limits are recorded in [M7–M12 acceptance](../MILESTONES_7_12_ACCEPTANCE.md).

The earlier PR #10 frozen-source verification passed all 278 unit/tooling tests, web/domain TypeScript, ESLint, formatting, 159 dependency-license entries, complete runtime notices and production build. All 116 Chromium scenarios passed. The production dependency audit reports zero vulnerabilities. Calculation reports replay the saved method; deletion of PLC/note-referenced devices is guarded. Account runtime splitting keeps the largest main chunk at 359.49 kB without increasing the warning threshold. Production-build workflow checks, hosted CI and deployment receipts are recorded separately.

Supabase migration `20261106065156_adiguneplanai_revision_history_avatars` is applied in the authorized shared project. Read-only inspection confirms owner/nonanonymous RLS, immutable client history, restricted grants and a private 2 MiB image bucket. Both unauthenticated project/history REST requests returned 401. The rollback security fixture was NOT executed: the mandatory tool confirmation expired. A legitimate authenticated production REST/storage round trip remains unverified. No test emails or global Auth configuration changes were made.

Reference repositories were audited 2026-11-06: hb-AI-policy `d42d4e04ac6ab77ebafa1d4fccb724a4dde8d02e`; hb-design-system `52f01f9986d97088413ca9785bc7a2d3f2967123`; hb-elektroniker `1daeed88df067a235b33516fb4cce111350ab80c`; corporate `HephzibahBehulahHQ.github.io` `bd116504412b37105166805018f64a6e7bbe3cde`. Their source files were read only; corporate assets match the product copies.

M13 BOT and the M14–M17 original example library continue on separate files. No hosted AI availability or example count is claimed before validation. Licensed manufacturer/standards data, STEP integration, remaining specified geometry/export requirements, legitimate live account/security verification, native-language review and M18–M20 acceptance remain explicit gates. Owner instruction is to continue through the last milestone; development deployment does not establish final production acceptance.

## Historical checkpoints (superseded where noted above)

Milestones 0–5 are implemented and published in stacked draft PRs #1–#5 with successful hosted CI. They remain unmerged; production deployment is not verified.

Milestone 6 is in progress on codex/milestone-6-library, draft PR #6. The library contains 69 original generic schematic definitions and four source-backed catalog records across three manufacturers. Search/category/manufacturer filtering, compatible native part assignment, custom-symbol creation/editing, bounded vector artwork and schema-6 typed/shared terminal groups are functional. These definitions do not assert manufacturer pinouts, ratings or equipment simulation.

Latest local verification: 81 unit/tooling tests, type checking, lint, formatting, 148 dependency-license entries, runtime notices and production build passed. The full Chromium run passed 46 of 47 scenarios and caught an out-of-bounds RCBO circle. After correcting that geometry, all four protection workflows passed a focused Chromium rerun. Remote publication and CI for this increment are tracked in NEXT_TASKS.md.

Milestone 6 acceptance remains incomplete: outstanding symbol families, verified manufacturer mappings/metadata and Part 13.2 functions (including custom-component import/export/versioning and part-to-3D mapping) need implementation and verification. Symbol definitions are distinct from manufacturer component records.

The complete target remains PURSUED_GOAL.md, MASTER_SPECIFICATION.md and docs/references/target-workspace.png. Milestones 7–20, 500 individually tested projects and production acceptance remain unfinished. The approved live BOT co-pilot addendum extends Milestone 13. The required production origin is https://adiguneplanai.hephzibahbehulah.com/; live Cloudflare/Supabase configuration remains unverified.

Component comparison is now implemented for two to four catalog records. It retains selected parts across search/filter changes, displays sourced ratings with units and explicitly identifies missing values, and links each manufacturer source. Comparison never assigns or changes project parts. A Chromium workflow verifies selection, search persistence, missing-value handling, source URLs and absence of project mutation; type checking, lint, formatting and build passed. Published checkpoint 76be738a2264eed5c51f7211a88d1feaf71498cb has two successful hosted CI runs (41530625706 and 41530616017), including the complete pre-comparison browser suite.

Catalog rating filters, favorites and recent assignments are implemented in four languages. Filters compose with search/category/manufacturer and exclude undeclared ratings when a threshold is active. Separate bounded versioned preferences store favorites and up to twenty distinct recent assignments; they never change project topology. Recent history advances only after an accepted native part assignment. Invalid stored preferences are preserved until explicit catalog-only reset; quota failures retain session state and display an unsaved message. Verification: 85 unit/tooling tests, all 51 Chromium scenarios, type checking, lint, formatting, 148 dependency-license entries, runtime notices and production build passed. Comparison checkpoint 3a12ba9af54c877e4689a397403d5b27d2a54963 has successful hosted runs 41531079213 and 41531070796. The preference/filter increment awaits publication.

Schema 7 adds user-supplied custom components with explicit unverified provenance, data-rights declarations, source revision, optional ratings/source URL, mechanical dimensions, mounting and terminal information, and a frozen native symbol snapshot. Creating the next revision preserves prior records and device assignments; replacement requires an explicit compatible assignment. Component files use a bounded versioned JSON envelope (1 MiB) and include the mapped symbol. Conflicting records/definitions, unsafe URLs, forged verification, invalid geometry and unsupported versions are rejected atomically. Schemas 0–6 migrate without inventing verification. Four-language controls support creation, revision, assignment, import and export; HELP.md documents the workflow. Verification: 92 unit/tooling tests and all 53 Chromium scenarios passed, with type checking, lint, formatting, licensing (148 entries), runtime notices and build passing. Existing browser selectors were made role/label-specific after adding the second import input and nested component fields. Prior checkpoint 6dc5c99650b8b78de0b8ad7587a96568734b0ae0 has successful hosted runs 41532369737 and 41532363991.

Schema 8 adds explicit mechanical symbol classification. Mechanical symbols cannot declare electrical pins; new electrical custom symbols still require connection points, and placed symbols cannot change connection class. The original cable-gland drawing is a pinless mechanical part with an ME reference, normal placement/transforms/clipboard handling and optional user-component/BOM assignment. It creates no terminals, pins, wires or nets. Custom symbol editing and four-language library labels expose the distinction. Schemas 0–7 migrate without guessing mechanical classification for legacy empty definitions. Verification: 97 unit/tooling tests and all 55 Chromium scenarios passed, alongside type checking, lint, formatting, 148 dependency-license entries, runtime notices and build. The build emits a 500 kB chunk advisory (502.22 kB minified, 148.79 kB gzip); performance work remains pending. Prior checkpoint 2e2632fb49e026d19522241eeb547d689ad5026b has successful hosted runs 41535286638 and 41535278348. Milestone 6 remains incomplete.

Engineering-symbol UI/data now load only when that library section is first opened. Search/category state survives collapse/reopen without another module request. A local error boundary and translated loading/error states isolate download failures from native editing and export. The main built chunk is 482.82 kB (143.53 kB gzip), down from 502.22 kB; the separate optional symbol chunk is 22.29 kB (6.49 kB gzip). The build no longer emits the chunk-size advisory; no warning threshold was changed. Verification: 97 unit/tooling tests, all 57 development-server Chromium scenarios and one additional built-app transformer import/placement/undo/reload smoke test passed. Type checking, lint, formatting, licensing, notices and build passed. Preceding mechanical checkpoint e90c22cbe36170ee593a7570f4f8a1cf102a352e has successful hosted runs 41536804704 and 41536794833.

The engineering library now contains 69 original definitions. Twenty-two additions cover PLC/remote I/O/communication/timer/counter/actuator interfaces, single-phase motors and starters, soft starters, safety relays, motor controllers, HMI/serial bridges, measurement terminals, wall switches, an empty mechanical junction box, shielded cable/drain, PE bonding, MCB/MCCB and plug/socket interfaces. Shared artwork primitives preserve existing drawings. All 101 unit/tooling tests and 79 Chromium scenarios passed, including one native wiring/reload workflow per new definition. Visual review found no clipped artwork or labels in the 22 new previews. Type checking, lint, formatting, licensing (148 entries), runtime notices and build passed. Main chunk: 488.78 kB; optional symbols: 32.37 kB; no chunk-size advisory. Coverage limits are recorded in docs/references/symbol-family-coverage.md. No manufacturer part or engineering-example count increased. Prior checkpoint 4245c9a5d053c285bb6b8c67d06f3f0b9c735ea4 has successful hosted runs 41538384730 and 41538372147. Milestone 6 acceptance remains open.

Schema 11 introduces wall-owned door/window opening records and tested domain commands for adding/removing openings and editing walls. Bounds, door sill, overlap, layer protection and referenced-wall deletion are validated atomically. Geometry helpers calculate door swing arcs, opening frames and remaining solid wall intervals; wall edits retain opening identities. Schema 0-10 migration preserves existing work without inventing openings. This increment is domain-only: opening controls and rendering are not yet connected to the building interface, and Milestone 7 remains in progress. Local verification: 124 unit/tooling tests, typecheck, lint, formatting, dependency licensing, runtime notices and production build passed. No deployment or additional dependencies.

All 87 Chromium regression scenarios also passed for schema 11; these cover the existing interface, not the pending opening UI.

Wall editing and opening creation/removal are now connected to the four-language Building design interface. The canvas renders genuine solid wall intervals, door leaves/swing arcs and window frames, with swing bounds included in fit. Protected layers disable controls; referenced walls cannot be deleted until openings are removed. Three building Chromium workflows passed, including exact door/window geometry, invalid shortening, accepted extension, locking, reload, removal and undo. Explicit accessible select labels correct ambiguity found during testing. Remaining M7 work includes architectural imports, zones/scales, equipment/routes, distribution/circuit associations and schedules.

Schema 12 adds native imported architectural geometry with floor/layer references, source identity and explicit millimetres-per-user-unit metadata. A bounded inert SVG reader previews supported lines/polylines/polygons/plain rectangles and reports unsupported content before explicit atomic apply. Group names become native layers; geometry renders at the selected physical scale and supports visibility, protected deletion, undo and reload. Four building browser workflows passed, including exact scaled coordinates, unsupported-circle reporting and rejection of scripts/linked images/stylesheets without project changes. DXF, transforms/curves and automatic viewport/unit mapping remain pending. See HELP for the supported subset and limits; Milestone 7 remains in progress.

Schema-12 verification: 127 unit/tooling tests, all 88 Chromium scenarios, typecheck/lint/format/build, dependency licenses and runtime notices passed. Main bundle: 482.37 kB. No deployment or added dependencies.

SVG coordinate import now composes matrix/translate/scale/rotate/skewX/skewY attributes across root, group and element transforms before explicit millimetre scaling. Native points retain rotations about a center, reflections, nonuniform scale and nested transform order. Invalid/singular/nonfinite transforms skip their subtree with a report; unsupported CSS origin/box overrides are also reported. Limits bound attribute length and operation count. Verification: 130 unit/tooling tests and five building browser workflows passed, plus typecheck/lint/format/license/notices/build gates. Final origin/box exclusion also passed browser checks, formatting and a fresh production build. Existing viewport/manual-scale limitations remain; automatic units, curved geometry and DXF are still pending.

Automatic SVG physical-unit import now resolves absolute root width/height and viewBox coordinates with none/meet/slice alignment, including nonzero origins. Supported root units: px/unitless, mm, cm, in, pt, pc and Q. Root transforms compose outside viewport mapping before conversion to millimetres. Manual scale remains unchanged; automatic mode disables the manual input and invalidates stale previews. Unresolved relative dimensions and invalid viewport data fail before mutation; clipping is explicitly not imported. Six building browser workflows passed, including physical dimensions, invalid percentage rejection and reload. Four independent viewport unit tests cover unit equivalence, alignment, nonuniform scale, slice and transform order. Milestone 7 remains in progress.

DXF reference import now supports bounded ASCII LINE and straight LWPOLYLINE entities with explicit declared-unit conversion, Y-axis conversion, source layers and protected layer states. Unsupported records and nonplanar/curved geometry are reported. A cancellable worker isolates parsing, invalidates stale previews and times out without mutating the project. Explicit Apply uses native atomic import, undo and reload. Four domain tests passed for units, geometry, malformed input, layer protection and persistence; full local check passed. All eight building browser scenarios passed on the final run, including cancellation, unit overrides, layer protection, undo/reload and worker-load failure recovery. An earlier browser run failed while development files were refreshing; the isolated retry and clean suite passed. Source publication is pending for this increment. MIT parser/runtime notices and lockfile review cover 150 entries. Milestone 7 remains in progress; broader imports, zones, equipment/routes and circuit schedules remain open.

Hosted CI for 38266e6 failed two DXF browser scenarios during cold dependency discovery (90 of 92 passed). The development server now explicitly prebundles the worker-only dxf-parser dependency to prevent a first-use reload. The fresh-cache regression reports all 92 scenarios successful; Windows server teardown is still pending at this checkpoint. Git attributes enforce LF text checkouts so Windows autocrlf does not invalidate Prettier checks. No deployment is released until hosted validation passes. Vite dependency optimization reference: https://vite.dev/config/dep-optimization-options .

Schema 13 adds floor-owned electrical/distribution room zones with unique nonempty room membership and optional distribution-board references. Cross-floor/missing references and invalid board ownership are rejected by native validation; referenced rooms cannot be deleted. Four-language controls create/edit/remove zones, highlight selected rooms and preserve identities through undo/reload. Existing schemas migrate without inventing zones. Local check passed 142 unit/tooling tests, type/lint/format/build, 150 dependency-license entries and runtime notices; all nine building browser workflows passed after explicit select accessibility labels and correcting the test expectation to the existing localized preservation message. Source publication is pending at this checkpoint. No dependency or license changes. Free-form zone geometry, scales, equipment/routes and circuit schedules remain open.


Schema 14 adds explicit per-floor drawing scales (1:1–1:10000, default 1:100 on migration) without rescaling native geometry. The four-language scale form participates in undo/reload, and SVG download uses physical millimetre dimensions derived from the visible viewBox. Three domain tests cover exact conversions, invalid scale/bounds, persistence and schema-13 migration. All ten building browser workflows passed, including SVG parsing/escaped title, exact physical dimensions, unchanged native storage and scale undo/reload. Full local checks passed; publication/hosted CI remain pending at this checkpoint. No new dependencies. Standard-sheet layouts/tiling, title blocks and broader report formats remain M11 work; M7 equipment/routes/schedules remain open.

## Equipment placement checkpoint

Schema 15 adds native-device floor placements, optional room assignment with anchor containment, snapped position, rotation, annotation scale and mounting height. Existing schematic identity and wiring remain unchanged. Layer locks/visibility protect mutations; room/device deletion protects references. The room equipment schedule derives native references and assigned parts, including hidden placements. Six new domain tests and all 11 building browser workflows pass; the complete local check, licensing, notices and build pass. Hosted CI and deployment for this increment remain pending publication. Floor-first device creation, routes and circuit schedules remain open.


## 2026-11-10 — Interface integration in progress

- Isolated worktree on `codex/interface-integration` reconciles development (`ecb34e0`) with main (`5b0c93d`); PR #22 was already merged into development. Original worktree and history remain untouched.
- Preserve main’s account, navigator, examples, editor command bus and complete panel geometry engine. Integrate drawing title frame, project-backed calculation records and cabinet pan/zoom/fit/orientation controls. Default compact desktop layout reserves space for the drawing; expanded controls remain available through View.
- Owner reaffirmed the exact supplied target menu order, sidebar/canvas/bottom-panel positions and real active behavior. The master-plan file matches the active specification; do not restart the roadmap.
- Local check passed: 334 unit/tooling tests, types, lint, formatting, licenses, notices and build. Automated Chromium cannot launch inside the current sandbox; hosted browser CI is still required.
- Visual parity is NOT accepted. Keep the integration PR draft; no merge, runtime publication or deployment until visual and CI gates pass. The target’s manufacturer cabinet appearance and full toolbar/BOT layout remain unfinished.
- Local-only Playwright configuration, dependencies, build output and scratch logs are excluded from commits.

## 2026-11-10 — target sidebar and grouped ribbon

Desktop BOT defaults to the fourth docked column; Float/Dock, minimize, maximize and existing read-only native tools remain usable. Mobile starts with the launcher. Saved owner preferences remain scoped and are not overwritten. The bottom diagnostic/calculation/BOM/report row begins after the left navigator, matching the supplied target structure.

Home now groups real editing, wiring, library, checking and document actions in one scrollable row. Added native schematic Print/PDF, Save all, and Close project without deleting saved projects; the navigator reopens a closed project. Library commands activate the actual Library tab. Alignment commands reuse the native transaction/history path. Four language dictionaries include the new labels.

Validation: npm run check passed (334 unit/tooling tests, types, lint, formatting, dependency licenses, notices, build). Manual browser checks verified dock/float, library selection, close/reload/reopen, one-row desktop ribbon, and viewport bounds at 1672 and 375 pixels. Previous hosted CI passed 138 browser tests and failed two compact-layout assumptions; those regressions were updated to exercise the visible Insert command and scrollable calculation pane. Updated hosted CI is still required, including native Print/PDF and saved-project preservation coverage.

Visual acceptance remains open: manufacturer-level cabinet geometry, remaining target ribbon actions and full header/inspector detail are not certified as matching. No merge or deployment is authorized by these partial results. Local-only playwright.local.config.ts, dependency/build caches and scratch logs remain excluded.

## 2026-11-10 — native cabinet mesh import increment

Added schema-18 STL surface assets with explicit units/axes, source/rights references and source SHA-256; real mesh rendering/picking, measured placement bounds, native history, reuse and OBJ faces. See `docs/PANEL_MESH_IMPORT.md`. This supplies a path for genuine licensed models; no manufacturer CAD library or exact target parity is claimed.

Local checks passed 341 unit/tooling tests, types, lint, format, licenses/notices and production build. Manual browser import measured an original regression tetrahedron at 20 × 30 × 40 mm, rendered its actual surface, and retained it after reload. A dock SVG background that initially obscured the WebGL canvas was fixed and regression-covered. Hosted browser checks for this increment remain pending. Test-only native/STL scratch files and `playwright.local.config.ts` are excluded from publication. The engineering example was restored in the preview.

Release remains gated on exact target visual acceptance and full CI. Manufacturer model sourcing, remaining target commands/header/inspector, hosted BOT and wider specification gates remain open; no merge/deployment occurred for this increment.


## 2026-11-12 — workstation baseline and pursuit goal

Added the repository-level workstation preservation contract in `AGENTS.md` and `docs/agent/INTERFACE_BASELINE.md`; the canonical visual target remains `docs/references/target-workspace.png`. The 88 px ribbon rule and geometry regression keep category changes from shifting the approved workbench. Rewrote Part 26 in both synchronized master specification files to resume from the current React/Vite codebase, retain the full engineering destination, and list the current acceptance gates rather than restarting the project.

CI passed on PR #40 head `0077e512ee0ecc1a5ba85834c9f120bb07b3a80e`: template checks, typecheck, lint, formatting, unit suite, build, BOT bundle, 155 browser tests, production browser check, and high-severity dependency audit. The PR is still open; this checkpoint does not claim merge or deployment. Hosted AI, authenticated cloud round-trip, full 500-project target, and exact visual acceptance remain open per `product.config.json` and existing status records.
