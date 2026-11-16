# Cable assignment diagnostics — local follow-up to PR98

Engine: analyzeProject returns cableIssues and marks report invalid when the same cable tag/core occurs on disconnected global nets, or paired continuation segments have different/partly missing assignments. Files remain saveable so users can correct the design. No physical cable product/current rating inferred.

UI: existing Electrical checks previously called only sheet-local analyze, so engine-only diagnostics were invisible. Added normalized project-wide analysis using collectProjectObjects, projectSheets and native serialize/parse, with escaped project findings rendered inside the existing panel. No CSS/menu/layout change.

Validation: 37 focused tests passed before UI integration. Added browser fixture that imports inconsistent assignments, opens Electrical checks, asserts visible finding and verifies saved objects unchanged. Full check running session21238, log work/cable-diagnostics-check.log. No publication yet. Publish engine and HTML mirrors (raw apps/web/index.html), unit/e2e tests and this note only against current main da766128a8683d004a89492242d5ed4513814a77. Browser connection unavailable in earlier turn; CI coverage is required before merge.

Full goal remains incomplete: verified cable product library and instance routes/length/core mapping, engineering calculations, A3 coordinated assembly and A4 final records. Existing example remains educational development, not approved installation.

PR99 opened at 753774f3be1e799821537819b1faa9a861d8256e, branch codex/cable-assignment-diagnostics. Template/type/lint passed; initial full check stopped on browser-test formatting after screenshot edit. Prettier corrected it; remaining format/test/licenses/notices/build commands completed successfully (work/cable-diagnostics-remaining.log). No local process remains. Await exact-head CI and inspect cable-diagnostic-findings.png before merge/deploy. Published files include HTML mirrors because panel previously ran sheet-local analysis only.

PR99 merged after both CI runs passed and artifact14154711053 screenshot review. Project finding readable in existing panel. New local LAPP library work is separate and unpublished; see lapp-cable-library.md. Deployment still pending verification.

Production build-info now matches PR99 merge d469f130f6f06d33232d6211adf9e2505185a28d. Pages run43696559791; main CI43696559795. Interactive live verification remains pending; prior browser connection timed out, CI imported-conflict workflow and screenshot passed.
