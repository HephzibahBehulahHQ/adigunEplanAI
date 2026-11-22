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

The compact editor's M7 workflow now creates native floor-plan sheets in
millimeters. It supports named rectangular rooms, walls with door and
window openings, measured dimension lines, and generic luminaire, socket,
and distribution-board placement with editable terminal connections.
Building equipment uses unassigned manufacturer data. Assign devices to
rooms on the same floor and export the project-wide room equipment CSV,
including unassigned devices. Floor-plan boards support named circuits
and a CSV schedule of their explicitly assigned loads. Circuit assignments
record design intent. Measured planar cable, conduit, and tray routes
support editable corners and separate circuit-schedule length totals.
A route can end in a riser to a different floor of the same building.
The editor derives the vertical length from the two saved elevations and
reports it separately from planar length. With the route selected, the command
palette exports a dimensioned SVG showing both floor datums and the vertical
distance. The building riser diagram exports all linked routes in the active
floor's building against common floor datums, with direction and vertical
dimensions. Protection sizing remains open in the compact editor. The command
palette can draw rectangular or polygonal electrical and distribution zones.
Polygonal zones expose editable corners and report the enclosed area. Zone
names and rectangular dimensions are editable in
Properties. Zones can reference rooms on the same floor, and distribution
zones can also reference a board on that floor. These assignments are explicit
and independent of the drawn boundary.

The floor circuit CSV includes connected active power and estimated demand
from the active power and demand factor entered on each assigned load.
Missing inputs are counted separately so partial totals remain identifiable.
The command palette exports a selected board's single-line assignment diagram
with circuit branches, equipment tags and known load totals. Branches document
assignments independently of conductor connectivity.
The floor panel schedule aggregates circuit counts, known power and demand
by distribution board. It also includes board room and zone assignments and
lists boards with no circuits.
The floor cable schedule lists individual cable, conduit and tray routes
with optional route tags, assigned circuits and destination floors. It
reports planar and vertical lengths separately and sums the drawn route.
Assigned floor devices and routes display their board reference and circuit
name on the drawing. Labels update when the source circuit changes.

The compact editor includes a generic earthing bond point with two common PE
terminals. The floor protective-earth CSV lists wires attached to a building
PE terminal and unattached PE terminals. Its status describes direct terminal
attachments, independently of installed continuity or compliance.
The compact component bank also includes emergency lighting, a fire-alarm
loop interface, a shielded 8P8C data outlet and a single-pole switch. Each
places a native generic device with independently wireable terminals.
Rooms, walls and dimensions default to the Architecture layer. The existing
Layers and visibility inspector can hide it independently of device symbols,
wires and measured routes.
On an open floor sheet, **Import SVG or DXF floor plan** brings supported
geometry into Architecture as native objects. SVG uses the declared physical
viewport and DXF uses the file's declared drawing units. The import report
lists unsupported geometry, and Layers and visibility exposes the source
layers. Floor Properties accepts an optional millimetres-per-source-unit
override for subsequent imports. Clearing the field restores file-based
scaling. Each manually scaled object retains its original override value.
Floor print layouts support a saved model-space centre in millimetres so
scaled frames can cover geometry away from the drawing origin.
Floor Properties also records the German DIN/VDE or IEC documentation
profile and a user-declared standard and edition. The circuit, cable and
panel CSV exports carry the declared basis. Automated jurisdiction-specific
protection and compliance checks remain open.
Cable route Properties runs the versioned voltage-drop estimate using the
route's drawn one-way length, including its linked riser. Users supply the
electrical inputs, evidence and comparison limit. Saved route inputs can be
rechecked after reopening, using the current geometry.
Cable route Properties also runs the versioned candidate ampacity check.
It compares the entered design current and protection rating with the
corrected tabulated ampacity, using user-entered factors and evidence.

Focused M8 verification covers all 25 categories, invalid units/bounds, round trips and unavailable method versions. All six calculation browser workflows pass, including four languages and narrow screens. M9 has 22 domain tests and two complete browser workflows including real export downloads and no console errors. M10 has four focused domain tests and a complete browser workflow. Drawing/report browser verification parses actual SVG/PNG/PDF output, native IDs, pixels and physical page dimensions. Account verification covers account-switch isolation/stale responses, conflicts/history/recovery, private-avatar validation, offline same-owner local editing and header behavior. These mocked-session tests do not establish real production credentials or database authorization.

The Supabase history/avatar migration is applied. Direct read-only inspection verifies owner/nonanonymous RLS, immutable client history, restricted grants, nonpublic trigger functions and private image storage. Unauthenticated REST returned 401 for both tables. The rollback fixture in supabase/tests/history-avatars.sql has not executed because mandatory confirmation expired; no substitute mutation was used to bypass that gate.

All native geometry and references remain source-owned and validated. Deleting a last schematic symbol retains a device referenced by automation notes or a PLC signal assignment, with undo/reload regression coverage. No schematic connectivity is inferred from plan position, I/O documentation or a calculated result. User-supplied dimensions, evidence and equipment ratings remain identified as such.
