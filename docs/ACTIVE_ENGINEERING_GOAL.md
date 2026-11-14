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

- Goal-tool replacement failed because the old goal is unfinished; it remains paused. Do not claim a new tracked goal was created or falsely complete the old goal. Use this document as the authorized execution objective until the app supports replacing it.
- Implemented named project persistence and complete saved sheet definitions, including initial built-in sheets.
- Implemented explicit component/pin attachments for new wires, synchronization after movement/rotation, missing-terminal diagnostics, and identity remapping for copied objects/sheets. Legacy unattached wires keep geometric connectivity behavior.
- Generic symbol properties now expose reference/comment in the existing inspector; automatic placement selects unused references.
- Existing New Project dialog now selects blank, indicator circuit, or relay control circuit. Both examples use the same editable generic component/wire model and explicitly state their limitations.
- Focused model tests pass for examples, identity preservation, movement/rotation, missing terminals, malformed attachment data and project round-trips. Full local checks passed before the final null-safe sheet-selection fix; CI and browser workflow checks remain required before merge/deploy.
- Work branch: `codex/engineering-workflow`. Publish only task files from current remote main. Do not claim completion until CI, deployment and live behavior are verified.

## Workspace caution

Local checkout has an old HEAD and unrelated earlier edits/deletions. Do not blanket commit, reset, or delete it. Use current remote main as the merge base and publish only this task's reviewed files. Keep root runtime copies synchronized with apps/web source. Deployment regenerates build-info; do not publish stale local provenance.
