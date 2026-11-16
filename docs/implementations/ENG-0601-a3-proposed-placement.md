# ENG-0601 proposed A3 device placement — local increment

Fresh examples now contain linked F1 and K1 panel-placement views on existing A3/019, at 1:2 scale and proposed centres (220,240) and (300,240). Geometry derives from existing manufacturer body-envelope records. Both views are inside the 545 × 775 mm plate outline, do not overlap, and resolve to the canonical A2 device instances; no duplicated BOM quantities. Positioning is proposed, not certified mounting/drill coordinates. Rails, ducts, clearances, remaining devices, thermal design and bonding still require work.

50 focused tests pass, including plate boundaries, spacing, canonical rename, BOM identity and save/reopen. Existing manual placement browser test now removes seeded views from its imported fixture so it still exercises actual creation; a separate default-layout browser test captures the proposed layout and checks save/reopen. Browser verification not yet run.

Full check session 53642 is running, log work/a3-placement-check.log. Current remote main 8deac09dc6e11c682b765505e02050627549c739 (PR107). New changes are local only: engine mirrors, focused/browser tests and this note. Publish only those selected files after checks. Inspect screenshot eng0601-a3-proposed-layout.png before merge. Do not claim complete A3 assembly or installation approval.

PR108 opened at 09ee8618fc1448a56a5d843b1834b585ade3c14c on codex/eng0601-a3-placement. Selected engine mirrors/tests/note published; unrelated checkout files untouched. Full local check session 53642 still needs its final exit result; CI and visual artifact review required before merge.

Local full check 53642 failed browser-test formatting. Reapplied Prettier and verified it passes; formatting correction published as PR108 head 4a95ca76b5b215e644125369f5e122dd8927a319. Full check restarted as session 27271, work/a3-placement-final-check.log. Poll that session rather than starting another check; fetch CI for this exact head. Rendered layout acceptance and deployment remain pending.

Full local check 27271 completed exit 0. Browser CI at 4a95ca76 passed the default/manual A3 workflows but failed the independent-copy comparison because its canonicalizer did not normalize new panel deviceId links. Updated the test to resolve each deviceId to a canonical object index and assert that the target exists; no linkage assertion removed. PR108 current head 10d4fdaa9b8b00f2bc7993c7e016b1bb56657128. Formatting passes; final CI pending.

Artifact 14159024415 layout screenshot reviewed at work/pr108-layout-review.png: F1/K1 body envelopes are separate and inside the plate; explanatory text and inventory do not overlap. Remaining devices are not yet placed, and no complete assembly is claimed. Whole-archive extraction encountered existing paths; the specific screenshot was extracted directly from the downloaded ZIP before review.

## Release verified

PR108 merged as 4249edadb68bc41254cc6c7722144f96481f056b after final CI 43708794929/43708791806 passed. Pages 43708963476 succeeded. Production build-info matches the merge; executing downloaded production engine confirms a valid example with F1 at (220,240) and K1 at (300,240), both scale 0.5 on eng0601-a3-0. Screenshot review covered the unchanged layout before final test-only normalization. Interactive production browser was not exercised in this increment. Next: remaining physical device/support assemblies, rail/duct design and coordinated cable engineering. Goal remains active and full A3 installation design is incomplete.
