# Native 2D editor

Milestone 4 uses schema version 2. Existing version-1 projects migrate into explicit page-owned layers, symbol geometry and mirror state without changing device or wire endpoint identities. Strict reference checks cover graphical group/layer ownership. Native paper dimensions are bounded to 32–2000 mm per axis; the UI supports A4, A3, A2, A1 and A0 in portrait or landscape.

The SVG canvas uses millimetres as document coordinates. Screen coordinates pass through the inverse SVG transform. Zoom/pan are view state; grid/snapping settings belong to the drawing page. Placement searches bounded grid positions, avoids symbol/label overlap and respects the frame/title-block area. Selection, marquee, grouping, alignment, rotation and mirroring operate through native project transactions. Locked/hidden layers prevent supported mutations. Undo/redo restores the document graph.

Nine original generic glyphs are implemented: terminal, junction, resistor, fuse, normally-open contact, relay coil, lamp, two-terminal DC motor and protective earth. They have actual device, terminal and pin identities; no manufacturer ratings or certification are invented. The expanded engineering/manufacturer library belongs to Milestone 6.

Wires join native pins. Route geometry is separate from connectivity. Orthogonal routing checks symbol body obstacles, tries clear corridors and falls back to a bounded four-neighbour search (250,000 cells maximum). Transforming connected symbols preserves endpoint IDs and regenerates their routes. Inserting a junction into a wire splits that wire into two actual connections sharing a terminal; crossing lines without a junction do not imply a connection. General netlist and electrical rule evaluation belong to Milestone 5.

The native clipboard snapshots selected symbols and their internal wiring, survives deletion and works across drawing tabs. Paste gives new physical identities and unique references; manufacturer mappings are retained. PLC duplication requiring new address assignments is rejected until its domain workflow is implemented. Geometry edits are schema-validated before persistence; rejected edits preserve existing work.

The project navigator selects real drawing pages. The BOM panel lists current native devices once each, with actual mapped part numbers when present. Contextual object properties use the Properties sidebar. Custom drawing backgrounds choose contrasting ink. Desktop layouts at 1001px wide and 780px high or greater use a bounded viewport; smaller layouts remain scrollable.
