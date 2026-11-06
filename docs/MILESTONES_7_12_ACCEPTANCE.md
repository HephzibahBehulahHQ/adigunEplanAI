# M7–M12 implementation and retained acceptance

This record describes schema 17 implementation, not final production certification. Full regression/publication receipts belong in VERIFICATION.md and PROJECT_STATUS.md.

| Milestone | Implemented behavior | Remaining acceptance |
| --- | --- | --- |
| M7 | Additional floor-native emergency lighting, fire loop, data and bonded PE; protected inter-floor cable/conduit/tray risers; native board/circuit assignment and dimensioned riser-elevation diagrams and actual-wire PE schedule | Broader specified zone geometry and complete building documentation/layout acceptance |
| M8 | 25 versioned calculator categories; dimensional input conversion; independent reference cases; bounded invalid inputs; replayable records; explicit assumptions, source URLs and user evidence; CSV/JSON reports | Independent engineering review and licensed manufacturer/standards datasets where needed; estimates do not establish ratings or compliance |
| M9 | Shared native 2D/3D enclosure geometry; plate/rail/duct/door/compartment placement; equipment provenance; six-face holes/entries; collision, clearance, mounting and access checks; explicit duct/heat estimates; SVG/OBJ | Licensed STEP/manufacturer CAD conversion and physical machining/thermal/certification validation |
| M10 | Six generic PLC module kinds; own-terminal/channel/type/address constraints; explicit signal assignments; actual wire schedule; control/interlock/safety notes; CSV | Representative motor-control and integrated automation example acceptance; no PLC execution or safety certification claim |
| M11 | Native SVG/PNG/DXF drawings; physical-size browser print/save PDF; devices/BOM/cables/terminals/connections/PLC/drawings/revisions/calculations CSV/JSON; replayed exact-version calculations | STEP export and final CAD/documentation/printing acceptance |
| M12 | Verified nonanonymous Supabase sessions; registration/login/reset/profile/password UI; owner-scoped local workspaces; explicit cloud save/list/reopen/history/conflicts/recovery; private bounded image avatars; truthful compact header/search | Legitimate authenticated production REST/storage round trip; rollback database security fixture confirmation/execution; full production recovery acceptance |

## Evidence and limitations

Focused M8 verification covers all 25 categories, invalid units/bounds, round trips and unavailable method versions. All six calculation browser workflows pass, including four languages and narrow screens. M9 has 22 domain tests and two complete browser workflows including real export downloads and no console errors. M10 has four focused domain tests and a complete browser workflow. Drawing/report browser verification parses actual SVG/PNG/PDF output, native IDs, pixels and physical page dimensions. Account verification covers account-switch isolation/stale responses, conflicts/history/recovery, private-avatar validation, offline same-owner local editing and header behavior. These mocked-session tests do not establish real production credentials or database authorization.

The Supabase history/avatar migration is applied. Direct read-only inspection verifies owner/nonanonymous RLS, immutable client history, restricted grants, nonpublic trigger functions and private image storage. Unauthenticated REST returned 401 for both tables. The rollback fixture in supabase/tests/history-avatars.sql has not executed because mandatory confirmation expired; no substitute mutation was used to bypass that gate.

All native geometry and references remain source-owned and validated. Deleting a last schematic symbol retains a device referenced by automation notes or a PLC signal assignment, with undo/reload regression coverage. No schematic connectivity is inferred from plan position, I/O documentation or a calculated result. User-supplied dimensions, evidence and equipment ratings remain identified as such.
