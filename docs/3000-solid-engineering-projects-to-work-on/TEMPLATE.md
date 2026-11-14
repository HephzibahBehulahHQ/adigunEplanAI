# Default A1–A4 project template

When Create New Project is used, immediately create **one project** owning four empty section containers in the existing sidebar. Do not create four projects. Do not automatically add 30 empty sheets to every user-created project: the 30-sheet minimum is for this catalog's planned examples. A1–A4 are defaults, not a maximum: users may add A5, A6 and further sections.

| Section | Purpose | Catalog baseline |
| --- | --- | --- |
| A1 | Overview, title, contents, devices, symbols, design basis | A1/000–A1/005 |
| A2 | Connected electrical schematics, interfaces, cables, earthing | A2/006–A2/019 |
| A3 | Panel arrangement, mounting, installation and routing | A3/020–A3/025 |
| A4 | BOM, connection reports, commissioning and handover | A4/026–A4/029 |

Default numeric sheet identifiers run continuously across the entire project. The prefix is the section, not a numbering reset. When sections grow, reindex display numbers in A1–A4 order while keeping immutable sheet IDs and updating all references. If A1 ends at /010, A2 begins at /011. Adding a sheet inside an earlier section must not break existing connection identities.

Each sheet record needs immutable ID, project ID, section, numeric display order, title, revision, content type, scope, devices, terminals, connections, cross-references and acceptance evidence. Store cross-references using immutable endpoint/sheet IDs; display the current sheet labels. Save/reopen must preserve section membership, sheet order and endpoint identities.

Connection continuations need matching net/potential labels, source/destination sheet and coordinate, terminal identity, cable ID and core identity. Use explicit declared source/load interfaces; not every external or spare terminal is an error. No unexplained duplicate device tags, missing endpoints or unmatched continuation pairs.

Conductor colours follow circuit purpose and applicable standards: identify PE green/yellow and neutral blue where applicable; define DC polarities, FE and shields separately. Red is not a universal live-conductor rule. No colour substitutes for connectivity or terminal IDs.

A3 must distinguish panel-mounted from external equipment, and reconcile its device identities with A2. A4 must be derived from the authored project data and actual validation evidence.

For passive protection or bonding projects, operational variants apply to auxiliary monitoring/control equipment only. Never interrupt or switch a protective-earth/bonding path as an operating control. Preserve required protection independently of optional communications, sensors and control power. Explicitly document the applicability of each added feature before drawing it.

## Owner clarification — sidebar behaves like VS Code folders/files

- Put a small **+** control beside each section. Each activation creates another real sheet within that section. Allow repeated creation without an arbitrary fixed sheet-count cap; use scalable navigation rather than rendering an unlimited tree all at once.
- Adding a sheet updates the sidebar without opening or switching the canvas. Selecting the sheet is what opens its editable drawing contents in the canvas.
- Support inline renaming by double-click, or a right-click Rename action that activates an inline field. Keep these actions inside the existing sidebar; do not introduce a large screen or modal.
- Show section/name together, such as **A1/0012**, then **A1/Power** after the user renames that sheet Power. Keep the internal sheet ID and numeric ordering separate from the editable display name. Update displayed cross-references after renaming without changing endpoint identities.
- Let sections expand/collapse and let users add further sections through an existing sidebar control or context action. Apply identical sheet creation, selection and renaming behaviour to A1, A2, A3, A4, A5 and every later section.
- Switching sheets must preserve edits. Save/reopen must retain section membership, custom names, order, drawing content and electrical links. Use the approved sidebar geometry and existing canvas; do not redesign the shell.

Acceptance: create a project; verify A1–A4; add multiple sheets independently under A1 and A2; confirm adding does not navigate; rename a sheet inline to Power; select it and verify A1/Power on its editable canvas; add A5 and repeat; save/reopen and verify all names, contents and cross-sheet links. The catalog's fixed baseline labels remain planning identifiers, not a prohibition on user-defined display names.

## Mandatory electrical continuation — all current and future sections

**A2 electrical drawings MUST be connected across sheets, with reciprocal FROM/TO continuation references.** Apply the same rule automatically to electrical drawings in any additional section, including A5/A6 and later. The mandatory [project-wide continuity policy](CONTINUITY.md) is inherited by every catalog project and every new electrical sheet. Follow actual circuit topology and preserve net/sheet identity through rename, reorder, tab closing and save/reopen. Do not treat section names as an electrical boundary.
