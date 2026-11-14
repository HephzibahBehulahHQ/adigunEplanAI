# Active engineering goal — 2026-11-14

## Owner authorization

Continue components, wiring and project examples. Keep the current interface locked and use existing menus. Test, merge and deploy. The earlier navy/cyan screenshot rebuild is superseded; do not resume it.

## Acceptance

1. New project retains its name, owns valid sheets, and can immediately accept symbols and wires.
2. Existing Electrical → Symbol Library exposes the preserved 83 symbols and existing manufacturer parts; instances have editable references/properties and identifiable pins.
3. Wire endpoints attach to explicit component/pin identities, remain attached through movement/rotation, and survive undo/redo and save/reopen. Invalid or dangling endpoints are diagnosed rather than silently connected.
4. Existing project controls provide editable connected examples using the same component and wire model. Examples are schematic learning templates, not certified or simulated installations.
5. Existing properties/checks provide meaningful authored data, with no invented manufacturer facts or compliance claims.
6. Regression tests cover the complete UI workflow and domain edge cases. CSS and menu structure stay unchanged. CI passes before merge; deployment and live behavior are verified.

## Verified starting point

- Remote main checked at `3310212cf8c2b602d6d9035c4e8e9df6b89a1f32` (PR #49).
- PR #49 integrated 74 original engineering symbols and 9 core primitives through the existing library.
- Existing fixed-shell CSS SHA-256: `e74748cfcb584a2be56e86f0aa52d959947718daf9ed4caaf773191ebfd96b29`.
- Previous stage verified 358 tests plus browser symbol placement/save/reopen; revalidate relevant behavior after changes.

## Current implementation and remaining verification

- The owner cleared the obsolete goal on 2026-11-14. The replacement engineering goal is now active: components, terminal wiring and editable real examples, locked interface, existing menus, tests, merge, deploy and live verification.
- Implemented named project persistence and complete saved sheet definitions, including initial built-in sheets.
- Implemented explicit component/pin attachments for new wires, synchronization after movement/rotation, missing-terminal diagnostics, and identity remapping for copied objects/sheets. Legacy unattached wires keep geometric connectivity behavior.
- Generic symbol properties now expose reference/comment in the existing inspector; automatic placement selects unused references.
- Existing New Project dialog now selects blank, indicator circuit, or relay control circuit. Both examples use the same editable generic component/wire model and explicitly state their limitations.
- Verified completion of this increment: 362 unit/tooling tests and four browser tests passed, including development and production-build runs. Browser tests cover manual terminal wiring, coordinate edits, undo/redo, reference edits, named project save/reopen, both examples and locked CSS/menu overlay behavior.
- PR #50 merged as `dc0bcfc9ff90995198c2cd46869f6fc6d7eafbba`. CI: https://github.com/HephzibahBehulahHQ/adigunEplanAI/actions/runs/43633095163 . Pages package/deploy succeeded: https://github.com/HephzibahBehulahHQ/adigunEplanAI/actions/runs/43633198145 .
- Live verification on 2026-11-14: New Project exposed both templates; Indicator circuit opened with five component instances, four wires, eight connected pins, zero unconnected pins, zero open endpoints and zero geometry errors. An invisible hit area fixes selection inside generic unfilled symbols without altering visible artwork.
- Scope limits: examples are generic schematic learning templates, not simulated, manufacturer-configured or certified designs. Legacy wires retain geometry-based attachment; only newly authored bound wires have explicit terminal identities. Broader engineering integrations remain future work.
- Completed work branch: `codex/engineering-workflow`, PR https://github.com/HephzibahBehulahHQ/adigunEplanAI/pull/50 . Start subsequent work from verified current main; do not reimplement this increment or restart the retired interface rebuild.

## Hardware examples increment — PR #51

- Added manufacturer-defined Phoenix Contact UK 5 N (3004362) and UT 2,5 (3044076) screw feed-through terminals through the existing Symbol Library. Ratings and connection limitations cite their primary manufacturer records; connection IDs are explicitly model-local.
- Existing New Project selector now includes three connected editable hardware examples: momentary 24 V relay control, ifm IFS204 PNP terminal wiring, and Siemens SITOP output distribution. External supply/load/protection boundaries and spare pins remain explicit; these are not complete certified installations or simulations.
- Local full checks passed with 364 tests. Circuit-separation, terminal identities, BOM provenance, movement/rotation and save/reopen tests passed. CSS and pre-script interface markup remain identical to the approved main baseline.
- Browser CI found a pre-existing pushbutton renderer lookup against reduced catalog metadata; corrected it to use the full component definition. All five browser tests passed against development and production builds. PR #51 merged as b4011d6d1864ebcac87427b4758304879ffc7315; main CI 43635269217 and Pages 43635269353 passed.
- PR #52 fixed returning-browser caching with content-hashed script URLs at build time. Merged as a7fc11f2be4260a2d57f63bc4a6c873d81746284; PR CI 43635661484 and Pages 43635850375 passed. UI layout, styles and menu structure remain unchanged.
- Live verification on 2026-11-14: New Project exposes all five templates. Hardware relay opens with seven components, six wires, six separate nets, zero open wire endpoints and zero geometry errors. Five intentionally unconnected external/spare component pins remain flagged. Browser CI also verifies the sensor and SITOP examples and save/reopen.
- Current increment fixes project-specific navigator/property metadata: imported sheet records take precedence over sample names; properties refresh on reopening and sheet changes; existing tabs and tree rows display matching project labels. Browser regression covers an imported control sheet renamed CAB/042 / Pump enable circuit and all hardware example property labels. Await CI/merge/deployment verification before reporting this increment live.
- Next: add a source-backed PLC input wiring example through existing project controls. Preserve shell and current five working examples. Goal remains active; do not mark the broad engineering workflow finished merely because an increment shipped.

## Workspace caution

Local checkout has an old HEAD and unrelated earlier edits/deletions. Do not blanket commit, reset, or delete it. Use current remote main as the merge base and publish only this task's reviewed files. Keep root runtime copies synchronized with apps/web source. Deployment regenerates build-info; do not publish stale local provenance.
