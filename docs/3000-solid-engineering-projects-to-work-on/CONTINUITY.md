# Mandatory project-wide electrical continuity

## Scope — A2 is mandatory; future sections inherit the rule

All A2 electrical drawings MUST form the connected schematic of one project. They are not standalone circuit illustrations. The same requirement applies to electrical drawings in any other current or future section, including user-created A5, A6 and later sections. Apply it by electrical content, never by a hard-coded list of section names. Section boundaries, separate tabs and sheet names do not create electrical isolation.

This policy is part of the default template and is inherited by every one of the 3,000 catalog projects through NEXT_AGENT.md. A project brief need not repeat this policy in every row for it to be mandatory. Creating any additional electrical sheet or section inherits it immediately.

## What every continuing connection must show

For every conductor that enters a drawing from another sheet, show a continuation/interruption symbol with its potential or signal name and a **FROM** reference identifying the originating section/sheet and grid coordinate. At the departure point, show the corresponding **TO** destination reference. The other drawing must show the reciprocal reference to the exact same connection.

Identify L1, L2, L3, N, PE, DC+, DC−, control signals and shields as actually present in that circuit. Do not add phases to a DC or single-phase system merely to resemble a screenshot. Use conductor colours and line conventions appropriate to the declared circuit and applicable standards, in addition to textual identification. Never switch PE as an operating control.

Each off-page endpoint must retain project-wide net/potential identity, immutable sheet/endpoint identity, device/terminal identity and cable/core identity where applicable. References must distinguish electrically different circuits that happen to use the same visible label. Fan-out branches must show their actual destinations and must not silently merge separate protected supplies.

## Example — connected across existing and future sections

Illustrative references, not actual topology already authored in the planning catalog:

| Drawing | Incoming continuation | Outgoing continuation |
| --- | --- | --- |
| A2/005, at B8 | Declared source or upstream-sheet reference | L1 — TO A2/006:A2 |
| A2/006, at A2 / B8 | L1 — FROM A2/005:B8 | L1 — TO A5/007:A2 |
| A5/007, at A2 | L1 — FROM A2/006:B8 | Actual next-sheet reference or identified load termination |

Show matching references for each other conductor that actually follows that route. Inside a sheet, draw the actual device terminals, protection and connections between its incoming and outgoing interfaces. Do not imply uninterrupted potential across an open contact, converter, transformer, fuse boundary or isolating device without modelling that circuit correctly.

Continuation follows the real electrical topology. It may go to a different section or a nonadjacent sheet; it is not necessarily the next number in the sidebar. The first source and final load must be explicit. Never invent a previous/next-sheet connection where a conductor actually begins or ends. Documentation-only pages must reference the relevant schematic/device/cable data rather than carrying fake conductor rails.

## Editing, navigation and persistence

- Adding a sheet or section must expose the same continuation capabilities and validation as existing A2 drawings.
- Renaming, dragging/reordering or renumbering sheets must update displayed FROM/TO labels while preserving immutable connection identities and actual topology.
- Closing a canvas tab must not remove a sheet or disconnect its conductors. The sidebar remains the project structure.
- Explicitly deleting a referenced sheet must report affected links and leave visible unresolved-reference diagnostics; never silently reconnect to another sheet with the same display number.
- Saving, reopening and exporting must preserve the connection graph and reciprocal references, including links to future A5/A6 sections.

## Required acceptance evidence for each implemented project

1. Trace supply and return conductors through all relevant A2 sheets; identify actual source and load boundaries.
2. Check every continuation for reciprocal source/destination sheet, grid location and electrical identity. Reject missing targets, potential mismatches and unexplained duplicate endpoints.
3. Create an additional electrical section, for example A5, and continue a connection into it and back to another sheet. Validate exactly as for A2.
4. Rename and reorder a connected sheet. Verify updated visible references and unchanged electrical connectivity after save/reopen.
5. Close and reopen its canvas tab. Verify its sidebar entry, drawing and links remain intact.
6. Exercise explicit sheet deletion in a test copy and verify affected links are diagnosed instead of silently reassigned.

These are mandatory implementation and review requirements. Planning documents alone do not demonstrate a working cross-sheet connection or a completed electrical installation.
