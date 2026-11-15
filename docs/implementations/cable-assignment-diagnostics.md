# Cable assignment diagnostics — local follow-up to PR98

Engine: analyzeProject returns cableIssues and marks report invalid when the same cable tag/core occurs on disconnected global nets, or paired continuation segments have different/partly missing assignments. Files remain saveable so users can correct the design. No physical cable product/current rating inferred.

UI: existing Electrical checks previously called only sheet-local analyze, so engine-only diagnostics were invisible. Added normalized project-wide analysis using collectProjectObjects, projectSheets and native serialize/parse, with escaped project findings rendered inside the existing panel. No CSS/menu/layout change.

Validation: 37 focused tests passed before UI integration. Added browser fixture that imports inconsistent assignments, opens Electrical checks, asserts visible finding and verifies saved objects unchanged. Full check running session21238, log work/cable-diagnostics-check.log. No publication yet. Publish engine and HTML mirrors (raw apps/web/index.html), unit/e2e tests and this note only against current main da766128a8683d004a89492242d5ed4513814a77. Browser connection unavailable in earlier turn; CI coverage is required before merge.

Full goal remains incomplete: verified cable product library and instance routes/length/core mapping, engineering calculations, A3 coordinated assembly and A4 final records. Existing example remains educational development, not approved installation.
