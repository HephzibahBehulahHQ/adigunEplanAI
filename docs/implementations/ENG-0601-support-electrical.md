# Support electrical representation — unpublished increment

Added alternate native electrical definition siemens-3ru2926-3aa01-electrical. It retains the Siemens part identity and provides three isolated paths from manufacturer inputs 1/L1, 3/L2, 5/L3 to explicitly model-local MATE L1/L2/L3 relay interfaces. Mechanical association alone does not connect these ports electrically. The original mechanical-only definition is preserved for existing files.

Primary manufacturer graphic: https://docs.rs-online.com/c473/0900766b814bb84d.pdf (Siemens data sheet 2024-09-23, page 3/3, hosted by RS). Downloaded work/siemens-support-datasheet-2024.pdf and visually inspected work/support-connection-2024.png. The graphic shows three separate conductive paths and the three incoming labels; it does not assign extra screw-terminal numbers to relay-side mating contacts.

Existing library/Properties/connection tools are reused. The electrical renderer draws all six model endpoints and identifies mating labels as model-local. Source-backed manufacturer data remains immutable. Do not insert both representations as two material instances for the same physical support; use one canonical instance and linked panel views when the assembly is integrated.

Focused suite: 47 passed, including exactly two correct support pins per phase net and no inter-phase joining, plus three terminal-bound paths to F2 through movement, four rotations and project reopen. Browser regression now covers native library insertion, three wire-tool connections, assembly linking, movement, rotation and save/reopen; browser execution, full checks, merge and deployment remain pending. Next: exercise native wiring to the F2 inputs, then integrate the linked physical assembly and BOM without double-counting the support. No new engineering installation approval is implied.

## Follow-up verification — 2026-11-15

PR #106 head 5291986a58fe5834d1024835764906b7a905108f corrects the browser selection target to the component group and bounds individual action waits. CI run 43705598389 passed; run 43705603435 has reached production browser verification. The previous timeout was not an electrical-model assertion failure. 47 focused engineering tests passed.

Pending local follow-up: panelPlacementFields now uses sheet.name (with legacy title fallback), and the existing linked-panel browser test asserts the visible option against the saved sheet. This change is not yet published. Full check runs in exec session 4558, log work/panel-sheet-name-check.log. Preserve the current PR head, inspect final CI/screenshots, then publish the label fix with its test and rerun required CI before merging. No deployment or full project completion is claimed.

## Rendered acceptance finding — 2026-11-15

Both CI runs 43705603435 and 43705598389 passed at 5291986a58fe5834d1024835764906b7a905108f. Artifact 14157689654 was downloaded and support-electrical-wiring.png visually reviewed. After a 90-degree support rotation, the three explicitly bound phase wires overlap along a common horizontal path. The connectivity test correctly retains three separate nets because terminal bindings own connectivity, but this does NOT prove readable routing. Do not claim no overlap or render acceptance. PR remains unmerged.

Next implementation: add editable orthogonal route control through existing wire Properties and one shared engine route geometry used by rendering, connectivity and length reports; persist it through save/reopen. Exercise the rotated support with separated routes, assert the route geometry and electrical identities, then review the resulting screenshot. Do not merely change the test screenshot angle to hide the overlap.

Local panel-sheet-name full check (session 4558) completed exit 0. Label fix and regression assertion remain local and unpublished; include them in the next verified PR update. Locked CSS is unchanged.

## Native route editing implementation — local, not deployed

Added optional wire.route {axis: x|y, coordinate: finite mm} through existing wire Properties. The shared engine wireRoute geometry now feeds SVG rendering, connectivity and route-length reports; CSV also includes all route points. Route lanes persist natively. Wire translation shifts the lane; rotation changes its axis and coordinate; selection bounds include routed bends. Automatic elbow remains the legacy default. Explicit terminal bindings remain authoritative.

Added a focused test for routed branch connectivity, avoiding the old elbow location, exact route lengths, invalid route rejection and save/reopen. 48 focused tests pass. Updated the support browser workflow to set separate Y lanes 335/355/375 after rotation and assert stored routes before save/reopen. Browser verification and screenshot review are still required; do not claim overlap resolution until rendered evidence is checked.

Full check is currently running in exec session 71383, output work/wire-route-check.log. Earlier published PR106 head remains 5291986a58fe5834d1024835764906b7a905108f; all route changes and the panel sheet name fix are local only. Publish apps/web/public/cad-engine.js and root mirror, apps/web/index.html and raw-source root mirror, both changed tests, and this implementation note using the existing Git-data workflow, after required checks. Never commit unrelated stale checkout changes.
