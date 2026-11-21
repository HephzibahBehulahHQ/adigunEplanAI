# Active engineering goal — 2026-11-14

## Locked control and native component audit — 2026-11-21

The shipped editor starts at `apps/web/index.html` and uses the native project
validator and connectivity engine in `apps/web/public/cad-engine.js`. The
README describes capabilities across the repository. Verify availability from
the shipped entry point and its build, especially for panels also present in
the React source tree. The master specification and the owner's locked-interface
directive govern outstanding work. Manufacturer definitions retain sourced
dimensions and electrical terminals. Editable instances and placement views
carry geometry and presentation. Mechanical parts use applicable assembly and
placement relationships; a part without electrical terminals has no wire pins.

| Existing controls | Command path and acceptance |
| --- | --- |
| Electrical, Project Explorer, open/new/save, sheet controls | Open the native project or instantiate an independent example, manage sheet identities, validate and serialize project state. |
| Electrical Symbol Library, insert button, symbol tool | Resolve real catalog definitions and create native instances on the current sheet. Validate placement, editable properties, real terminal IDs and reopen. |
| Select, wire, shapes, line, curve, freehand, text | Canvas tools select or mutate native objects. Electrical wires bind to terminals. Graphics and annotations retain separate geometry and support native history. |
| Panel Design Properties, Layers and Visibility | Inspect and edit instance fields through the existing inspector. Layer visibility participates in SVG hit-testing. Draw order is an optional saved integer; equal values preserve object order. |
| Automation sheet and PLC entries, Electrical Checks, Bill of Materials | Navigate available native sheets, insert available symbols and analyze the current project. Diagnostics and reports use native objects and relationships. |
| EPLAN-Style, IEC / DIN / US Standards, print, fit, pan, zoom, export | Use the existing navigation, viewport and SVG/print commands. The standards-labelled menu exposes diagnostics and does not implement standards certification. |
| Undo/redo, palette, fill, theme, settings and BOT | Invoke native history, presentation settings, existing command search and the BOT status control. Feature acceptance requires testing each relevant action, including saved settings. |

This inventory identifies existing command paths. Full component-layer styling,
arbitrary graphical resizing of canonical parts, native DXF roundtrip and
complete end-to-end command coverage still need separate verification or work.

## Paper text editing — shipped 2026-11-15

PR #76 merged as 8d151ad02f35f9c52a198a57856466d6ab80c5e3. Existing T tool creates a multiline on-sheet editor; Ctrl+Enter or leaving the editor commits, Escape cancels the current edit. Double-click a note to edit again. Existing Properties offers font, size, text width, alignment, bold/italic/underline and colour. Long text wraps to the chosen width; stored text retains its original line breaks. Existing shapes and palette remain in place. Formatting is per text object, not per selected character range. User drawing shortcuts do not intercept text inputs. Preserve empty startup and sheet/document identities.

Final premerge CI 43653067722 / 43653062454 passed (370 unit/tooling tests, 12 browser tests including writing, formatting, sheet switching, save/reopen and restored editing). Main CI 43653213729 and Pages 43653213725 passed. Live A1 typing, formatting and double-click editing verified; screenshot work/live-paper-editor.jpg. No complete coordinated example project is claimed by this change.


## Sidebar document management — shipped 2026-11-14

PR #72 merged as 9bb407703a13fb61fc096f32e16bd6cbceb5dffd. A1–A4 remain defaults, with additional sections via the root +. Section + creates documents without opening them. Inline rename, folder collapse, drag/drop ordering and cross-section moves retain stable sheet IDs and custom names. Canvas tabs are views: closing never deletes. Only explicit sidebar Delete removes documents; shared cross-page potentials retain their remaining branches. Save/reopen preserves sections, order, contents, connections and open views. Removed the former 200-sheet import/creation cap and object truncation.

Final premerge CI runs 43648428074 and 43648423881 passed, including 11 browser regressions and a 208-sheet roundtrip. Local focused engineering tests: 12 passed; full checks passed before the final connection-deletion fix, which final CI covers. Pages run 43648579087 succeeded. Live verification confirmed four default folders, repeated + creation without tabs, A5 creation, inline A1/Power rename and close/reopen retaining all four documents. Evidence: work/live-sidebar-management.jpg. Static shell/CSS preserved. AGENTS.md records the owner’s sidebar/document/view rules. No coordinated DOL example is claimed complete by this change.


## Default A1–A4 template — owner requirement, shipped 2026-11-14

PR #59 merged as 87e4aae10334c2c77740217878fbae03699cf45b. Every newly created project now owns A1 General information, A2 Electrical design, A3 Panel layout and installation and A4 Final documentation. Blank creation adds no sheets. Selecting a section targets the existing Add Sheet dialog; pages nest under that section and are continuously numbered from 000 across the section order. Stable sheet IDs preserve cross-reference destinations when numbers change. Save/reopen retains the sections and memberships. Legacy imports remain supported; example creation also receives all four sections. The loader now retains per-sheet objects and cross-sheet links.

Validation: 368 local unit/tooling tests; nine browser tests in development and production-build CI. Final premerge runs 43644923863 and 43644918984 passed. Main CI 43645078452 and Pages 43645078487 passed. Live creation showed exactly four sections and zero pages; adding in A2, A4, A1, A3 order produced A1/000, A2/001, A3/002, A4/003 beneath their correct parents. Screenshot: work/live-a1-a4-template.jpg. Static markup/CSS unchanged; existing sidebar/dialog content is connected to the template.

Next requested work remains a coordinated educational project, not six independent bench circuits. Selected master topic: Direct-on-line starter, MASTER_SPECIFICATION.md section 14.3, line 961; acceptance requirements in section 14.12. The owner clarified that the 3 kVA inverter was a structural illustration, not a mandated topic. Choose coherent researched equipment and clearly distinguish educational assumptions from verified manufacturer facts; do not ask the owner to do the research. No complete A1–A4 DOL example has been claimed or delivered yet. Preserve this new default project workflow while building it.

## Explorer discoverability correction — 2026-11-14

The owner could not find examples through Project Explorer. PR #58 (8b007d26ce2bf40d18b34b06bc7ee08b275bdd0c) exposes all six templates as searchable rows at the top of the existing explorer. Activate a row, then use the existing Create from selected example button. Clicking a row alone does not replace current work. Panel navigation now honors hidden state despite flex styles, and returning to Explorer clears stale search filters and scrolls to the examples. No new menu or CSS was added.

Premerge CI 43641726225 and 43641722773 passed with nine browser tests; local checks passed with 367 unit/tooling tests. Pages 43641854901 succeeded. Live verification showed all six rows and opened the PLC input example with 13 drawing objects through Explorer. Screenshot: work/live-project-examples.jpg. Retain this route in future changes; examples must not be discoverable only inside New Project. These are six examples, not a large catalog.

## Current state — supersedes older pending-run notes below

- Engineering workflow goal achieved and verified on 2026-11-14. Preserve the approved interface; any subsequent work uses existing menus and controls.
- Runtime release: main 219ce0140b40f2682648502b2f472853555d1440 (PR #57). Both premerge CI runs 43640407126 and 43640403660 passed. Main CI 43640583841 and Pages deployment 43640583800 passed.
- PR #56 (6d550e1a67d64e3947c3f5e44d7dccec1547fb03) fixed empty active-sheet export. Live downloaded Release-acceptance-bench.adigun.json retained its name, active power sheet, zero objects and both custom/power sheet definitions.
- PR #57 fixed a live-discovered rotation defect: route overlaps previously merged the PLC example's four nets into three. Explicit terminal identities now govern bound endpoints; free endpoints may form geometric branches and legacy unbound wires retain geometric connectivity.
- Final live verification: rotating X1 by 90 degrees in the PLC input example preserves four distinct nets, six wires, five components, zero open wire endpoints and zero geometry errors. The report explicitly identifies 21 spare/external pins. Screenshot: local work/live-rotation-verification.jpg.
- Do not repeat old interface rebuild work or reset the worktree. It contains unrelated prior modifications. New changes must start from verified current remote main and use focused commits.

## Acceptance audit — 2026-11-14

| Requirement | Verified evidence |
| --- | --- |
| Named projects, valid sheets and immediate placement/wiring | Browser regression creates a named blank project, places terminal/resistor from the existing library, wires pins, edits and saves/reopens. Empty active-sheet regression retains definitions; production download inspected. |
| Original symbols and source-backed components in existing controls | Original 83-symbol export/unit regression, library browser regression and manufacturer insertion toolbar regression passed. Properties expose part numbers, source references, editable references/comments and exact or explicitly model-local terminal IDs. |
| Terminal identity, movement/rotation, history and persistence | Manual UI wiring regression verifies attachment IDs, coordinate editing, undo/redo and save/reopen. Domain regression verifies exact net membership across all six examples through every component's movement and four rotations. Browser regression rotates each hardware example and verifies saved/reopened objects and expected net counts. Missing-terminal and cross-sheet mismatch tests reject silent reconnection. Live PLC rotation confirmed the corrected result. |
| Editable connected examples | Six templates: indicator, relay, PLC digital input, momentary hardware relay, PNP sensor and SITOP distribution. All use the same component/wire model, have complete explicit terminal bindings and pass export/import equality tests. Browser tests create all six and edit/save/reopen hardware examples. |
| Meaningful properties and connectivity reports | Manufacturer identities/provenance and declared pins retained; Siemens DC/DC/DC output map corrected against official connector tables. Exact PLC net membership and intentionally spare pins tested. Live checks show separate positive/return/functional-earth/switched-input nets. No safety/compliance or simulation claims. |
| Locked interface, regression, merge and deployment | Approved CSS hash e74748cfcb584a2be56e86f0aa52d959947718daf9ed4caaf773191ebfd96b29 and floating-menu geometry regression passed. All changes use existing menus, inspectors and toolbar buttons. Full local check passed: 367 unit/tooling tests. Eight browser tests passed in development and production-build CI. PRs #50–#57 merged, Pages release and live behavior verified. |
| Next-agent rules | AGENTS.md records the locked-interface rule and authorized engineering scope. This record identifies the final release, evidence and limitations. |

These are editable schematic engineering examples with real part identities and declared external boundaries, not certified installations or electrical simulations. Pin coordinates are schematic, not physical placement coordinates. Manufacturer ratings remain read-only; references and instance properties are editable. Bound wires use explicit terminal identities; legacy unbound wires retain geometry-based behavior.

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
- PR #53 fixed project-specific navigator/property metadata: imported sheet records take precedence over sample names; properties refresh on reopening and sheet changes; existing tabs and tree rows display matching labels. Merged 1e2f1f1c4896508712040eb5c8938fc7909de87a; six browser tests, main CI 43636468597 and Pages 43636468584 passed. Live relay properties show A3/201 / 24 V momentary relay control. Regression covers imported CAB/042 / Pump enable circuit.
- Next: add a source-backed PLC input wiring example through existing project controls. Preserve shell and current five working examples. Goal remains active; do not mark the broad engineering workflow finished merely because an increment shipped.

## PLC source correction

- Manufacturer verification for the next example found that CPU 1212C DC/DC/DC output labels had incorrectly followed the relay variant. Siemens V20 CPU 1212C wiring diagrams, tables 5/6, assign X12:1=3L+, X12:2=3M and X12:3–8=DQ a.0–a.5. Source: https://docs.tia.siemens.cloud/r/simatic_s7_1200_manual_collection_enus_20/technical-specifications/cpu-1212c/cpu-1212c-wiring-diagrams . The earlier PDF endpoint returned 403; use this verified official HTML table.
- Corrected the component definition and source link; existing physical connector IDs and coordinates remain unchanged, so wires are not silently moved to other terminals. Existing properties show a correction note requesting review of earlier output wiring. Targeted tests verify every X12 function and retained endpoint identity. Await full CI and release verification.
- Added PLC digital input bench through the existing New Project selector: CPU supply L+/M, functional-earth boundary, input common 1M on return, and a Schneider NO pushbutton into X10:7. Five manufacturer components and six wires form exactly four tested networks; no PLC program or simulation is claimed. Unused channels, site protection and bonding remain explicit engineering tasks. Browser coverage includes creation, editable properties and save/reopen. This joins the correction in PR #54 while CI is queued.

## Workspace caution

Local checkout has an old HEAD and unrelated earlier edits/deletions. Do not blanket commit, reset, or delete it. Use current remote main as the merge base and publish only this task's reviewed files. Keep root runtime copies synchronized with apps/web source. Deployment regenerates build-info; do not publish stale local provenance.
- PR #54 latest head: 29d1f12a5d408a7a9e27a256dbd2fb50f27817e1; current browser CI run 43637292637, job 132576783167, verified queued. Local full checks pass with 366 tests. Merge/deploy remain outstanding. Check this exact run before starting any replacement work. Next after shipping: connect existing disabled PLC/motor/PE toolbar actions to their already-defined manufacturer parts without adding controls.
- Next uncommitted local increment: existing PLC/motor/PE toolbar controls now map to defined manufacturer parts; no layout/menu changes. Source/root HTML synchronized, browser placement/save/reopen test added; npm run check passed (work/toolbar-check.log). Do not include these files when merging PR #54: they belong to the subsequent toolbar increment. Browser verification remains required before publishing this increment.
- PR #54 final correction moved X2/X3 to avoid overlapping terminal selection targets while preserving the four exact nets. Head c99f3b42aa450efb053dcce67a234a9cfbd4f3f6 passed CI 43638038533; merged as d9a95dd028708110582af1e95c7f33922126e0e5. Deployment/live verification is next. Supersedes earlier queued-head notes.
- PR #54 deployment 43638204206 passed. Live PLC digital input bench verified: 5 components, 6 wires, 4 nets, 0 open wire endpoints, 0 geometry errors; 21 external/unused pins explicitly flagged. Browser connection changed from unavailable ID 3 to Chrome ID 6. Next publish the locally tested toolbar increment from current remote main; no interface redesign.
- PR #55 latest head 15e71aa9723fc2870fbb36ac57265cb57ff591cb passed full CI run 43638899458 (7 browser tests). Existing insertion controls and navigator search are fixed; awaiting merged deployment/live verification. Remaining audit gap: projectSheets() can omit an empty active built-in sheet after navigation because it collects metadata only from state.sheets and authored objects. Add active/visited empty sheet definitions or enforce project-owned navigation, with a save/reopen regression; do not mark the overall goal complete yet.
