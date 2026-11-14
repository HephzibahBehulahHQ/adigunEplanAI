# Default A1–A4 project template

When implementing Create New Project, immediately create **one project** owning four empty section containers in the existing sidebar. Let users select A1, A2, A3 or A4 and add sheets there. Do not create four projects. Do not automatically add 30 empty sheets to every user-created project: the 30-sheet minimum is for this catalog's planned examples.

| Section | Purpose | Catalog baseline |
| --- | --- | --- |
| A1 | Overview, title, contents, devices, symbols, design basis | A1/000–A1/005 |
| A2 | Connected electrical schematics, interfaces, cables, earthing | A2/006–A2/019 |
| A3 | Panel arrangement, mounting, installation and routing | A3/020–A3/025 |
| A4 | BOM, connection reports, commissioning and handover | A4/026–A4/029 |

Numbers run continuously across the entire project. The prefix is the section, not a numbering reset. When sections grow, reindex display numbers in A1–A4 order while keeping immutable sheet IDs and updating all references. If A1 ends at /010, A2 begins at /011. Adding a sheet inside an earlier section must not break existing connection identities.

Each sheet record needs immutable ID, project ID, section, numeric display order, title, revision, content type, scope, devices, terminals, connections, cross-references and acceptance evidence. Store cross-references using immutable endpoint/sheet IDs; display the current sheet labels. Save/reopen must preserve section membership, sheet order and endpoint identities.

Connection continuations need matching net/potential labels, source/destination sheet and coordinate, terminal identity, cable ID and core identity. Use explicit declared source/load interfaces; not every external or spare terminal is an error. No unexplained duplicate device tags, missing endpoints or unmatched continuation pairs.

Conductor colours follow circuit purpose and applicable standards: identify PE green/yellow and neutral blue where applicable; define DC polarities, FE and shields separately. Red is not a universal live-conductor rule. No colour substitutes for connectivity or terminal IDs.

A3 must distinguish panel-mounted from external equipment, and reconcile its device identities with A2. A4 must be derived from the authored project data and actual validation evidence.
