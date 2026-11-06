# AdigunEplanAI help

## Contents

- [Vertical risers and building documentation](#vertical-risers-and-building-documentation)
- [Engineering calculations](#engineering-calculations)
- [Panel design](#panel-design)
- [PLC and automation](#plc-and-automation)
- [Reports and real exports](#reports-and-real-exports)
- [Accounts and cloud projects](#accounts-and-cloud-projects)
- [Custom components](#custom-components)
- [Component revisions and replacement](#component-revisions-and-replacement)
- [Component files](#component-files)
- [Mechanical symbols](#mechanical-symbols)
- [Create equipment from a floor plan](#create-equipment-from-a-floor-plan)
- [Distribution boards and circuit schedules](#distribution-boards-and-circuit-schedules)
- [Cable, conduit and tray routes](#cable-conduit-and-tray-routes)
- [Loading engineering symbols](#loading-engineering-symbols)

## Custom components

Create or open a project, then place a native symbol or create a custom symbol. Open Component library → Custom components. Enter your component name, manufacturer/organization, part number, category and description, then select the matching native symbol. These are your supplied declarations and remain marked **Unverified**.

Declare source/data rights and any available source or datasheet URL, source revision, ratings, mounting requirements and terminal information. Blank optional fields remain undeclared. Voltage uses V, current uses A and conductor section uses mm². Mechanical dimensions use mm: enter width, height and depth together or leave all three blank. These dimensions describe the physical part, independently of the schematic symbol body.

Create component saves the record in the native project. It does not automatically assign the component to a device or calculate equipment behavior. Choose a compatible device in the record's assignment form and select Assign part. Locked or hidden symbol layers cannot be assigned.

## Component revisions and replacement

Choose a component in Edit component revision, change its declarations and select Create next revision. Earlier records and device assignments remain unchanged. To replace a device's part, explicitly assign the desired revision to that compatible device. Undo/redo and native project saving include these changes.

Only the latest revision can be used as the base for another revision. Mapped symbol definitions are frozen to preserve the meaning of existing records. To change symbol geometry or connection points, create a new symbol definition and select it in the new component revision. Existing devices retain their original mapping.

## Component files

Export component downloads a .adcomponent.json file containing one revision and its native symbol definition. Import component reads that format into the current project, up to 1 MiB. No external datasheet is downloaded or redistributed.

Exact duplicate imports leave existing records intact. Conflicting record identities, revisions or local symbol edits are rejected; existing project work is preserved. Unsupported versions, unsafe source URLs, invalid geometry and attempts to import a verified status are rejected. Imported user declarations remain unverified. Component files are separate from complete native project exports.

## Mechanical symbols

Use Engineering symbols to search for and import Mechanical cable gland, then select it under Custom symbols and place it on the sheet. It receives an ME reference and has no electrical connection points, so wire tools cannot connect to its body. It can be moved, copied, deleted and included in a BOM through a matching user-supplied custom component. Its drawing does not declare physical dimensions or manufacturer ratings.

To create your own pinless mechanical drawing, open Custom symbols, select Mechanical symbol (no electrical connections), enter the body dimensions, leave Pins empty and optionally enter original artwork. Electrical custom symbols still require pins. Once a symbol is placed, its connection class cannot be changed; create a new definition instead. Mechanical custom-component records can use the pinless definition and follow the same revision/import/export workflow.

## Loading engineering symbols

Open Component library → Engineering symbols to load the symbol definitions. A loading message appears while that section downloads. Closing and reopening the section retains its search and category selection. Opening the library alone does not change the project.

If that download fails, the library shows an error while native editing and project export remain available. Save or export your work before reloading the page to try again. This does not guarantee that uncached assets are available offline.

## Building walls and openings

In Building design, create a building, floor and architectural plan layer, then add a straight wall using millimetre coordinates, thickness and height. Expand Edit wall to change these dimensions or add a named door/window. Opening offset is measured from the wall start; sill and opening height must fit the wall height. Doors require a zero sill. Hinge start/end selects the opening endpoint, and swing left/right is relative to the wall start-to-end direction. Hinge/swing fields apply only to doors.

The plan shows separate solid wall segments, door leaves/swing arcs and window frames. Openings follow wall translation/rotation and retain their identifiers. Shortening/lowering a wall through an opening is rejected. Remove its openings before deleting a wall. Hidden/locked layers disable mutations; visibility changes preserve data. Native undo/redo and project reload include openings. The drawing is a plan representation of all openings, not a structural/egress compliance assessment or height-specific section; joins and 3D extrusion are not implemented.

## Architectural SVG import

Under Building design, choose a floor and expand Import SVG plan. Select an SVG file (maximum 1 MiB), explicitly set millimetres per SVG user unit, and preview the report before applying. For example, a 40-unit source line with 100 mm/unit becomes 4000 mm. In manual mode this is a coordinate import: viewport width, height and viewBox do not determine the chosen physical scale. Confirm the scale against a known dimension before using the plan.

Supported geometry is line, polyline, polygon and unrounded rect with numeric user-unit coordinates. Group labels/IDs become separate architectural layers; source element IDs, source filename and the chosen unit conversion are retained in schema 12. The import creates native geometry rather than embedding SVG markup. Visibility/locking, explicit deletion, undo/redo, JSON persistence and reload apply to the imported entities. Reimport creates distinct layers and entities rather than overwriting work.

The preview reports skipped unsupported elements and subtrees. Curves, paths, text, rounded rectangles, nested viewports, percentage/unit-suffixed shape coordinates and styled/classed/clipped/masked/hidden subtrees are not yet supported. Appearance is not imported. Stylesheets, scripts, event handlers, links, external/embedded images, use references, animation and XML entities/DOCTYPE reject the entire file. Limits also bound element count, nesting, shape count, point count and native coordinates. DXF and broader SVG geometry remain pending; this increment does not complete the import requirements.

Source semantics: [W3C SVG coordinate systems and units](https://www.w3.org/TR/SVG2/coords.html#Units) and [basic shapes](https://www.w3.org/TR/SVG2/shapes.html). The explicit import scale is a product conversion setting, not a claim that all SVG viewports use millimetres.


SVG transform attributes now support matrix, translate, scale, rotate (optionally around a center), skewX and skewY. Transform lists and root/group/element nesting compose in SVG order before the explicit millimetre conversion. Reflections and nonuniform scales are preserved as native points. Singular/nonfinite/malformed transforms skip the affected subtree with a report; valid siblings remain available. CSS transforms and transform-origin/transform-box overrides remain unsupported alongside other stylesheet/style handling; affected subtrees are reported and skipped. Limits: 16 KiB and 256 operations per transform attribute. Source transform syntax is normalized to coordinates, not retained as an editable transform stack.


Use SVG viewport dimensions and physical units enables automatic conversion from absolute root width/height (unitless/px, mm, cm, in, pt, pc or Q). It maps a valid viewBox origin and dimensions with preserveAspectRatio none or the Min/Mid/Max meet/slice alignments. Transform attributes compose outside the root viewport mapping, then coordinates convert at 96 CSS pixels/inch. The stored mmPerUnit is the final post-transform conversion (25.4/96 in this mode); original viewport syntax is normalized into native points. No viewport clipping is performed; the preview reports this. Percentage/relative/missing root dimensions, invalid viewBoxes and unsupported alignment syntax are rejected without changing the project. Manual scaling remains available and is unchanged.

## DXF architectural reference import

Building design > Import DXF plan previews ASCII DXF LINE and straight LWPOLYLINE model-space geometry in a cancellable worker before explicit Apply. Declared INSUNITS supports millimetres, centimetres, decimetres, metres, kilometres, inches, feet, yards and mils. Missing or unsupported units require an explicit millimetres-per-unit override. DXF Y coordinates are reversed into the screen plan coordinate system; geometry is stored in millimetres. Source layer names and locked/off/frozen states are retained (frozen maps to hidden). Imported geometry shares layer controls, protected removal, undo and native persistence.

Limits: 1 MiB input, 2,000 model records, 10,000 vertices per polyline, native coordinate bounds and a 10-second worker timeout. Malformed/binary input is rejected. Unsupported entities are reported, including circles, arcs, legacy POLYLINE, blocks, text and solids; nonplanar geometry, bulges, widths, thickness, non-default extrusion and paper-space entities are skipped. Appearance, layouts and other DXF sections are not imported. This is a supported reference-geometry subset, not full CAD fidelity or completion of Milestone 7.

Source semantics: [Autodesk INSUNITS](https://help.autodesk.com/cloudhelp/2023/ENU/AutoCAD-Core/files/GUID-A58A87BB-482B-4042-A00A-EEF55A2B4FD8.htm) and [LWPOLYLINE group codes](https://help.autodesk.com/cloudhelp/2024/ENU/AutoCAD-DXF/files/GUID-748FC305-F3F2-4F74-825A-61F04D757A50.htm).

## Electrical and distribution zones

Building design > Plan zones groups one or more rooms on the selected floor. Choose New zone, enter a name, choose Electrical zone or Distribution zone, select member rooms and Save zone. Selecting an existing zone highlights its room outlines and allows renaming, membership/type editing or removal. Overlapping memberships are allowed: zones are explicit room groups, not geometric unions or inferred electrical circuits.

Distribution zones can reference an existing native distribution board; a located board must be on the same floor. An unlocated board remains explicitly unlocated. Board selection does not create circuits, perform load calculations or establish protection coverage. Electrical zones cannot carry a board reference. Room deletion is rejected while a zone references it; edit or remove the zone first. Changes participate in native undo/redo and persistence. Schema 13 migrates schemas 0–12 without inventing zones or changing existing room geometry. Room-based zoning does not yet provide free-form sub-room boundaries, cross-floor distribution topology or circuit schedules.


## Drawing scale and physical-size plan export

Each floor stores a drawing-scale denominator from 1 to 10,000 (including fractional values). New floors and migrated schemas 0–13 start at 1:100. Building design > Drawing scale saves the denominator through native undo/redo; it never multiplies room, wall, opening or imported model coordinates. The interactive screen remains fitted to the plan.

Export scaled plan SVG downloads the current visible floor plan with a millimetre viewBox and physical width/height divided by the saved scale. For example, a 4,000 × 3,000 mm room with the current 200 mm view margins exports as 88 × 68 mm at 1:50; the room itself is 80 × 60 mm on paper. Labels, visible layers, dimension display and selected-zone highlighting follow the current view. The file contains its scale and actual-size printing instruction. Print at actual size: fitting to paper changes the physical scale. Large extents are not automatically tiled or clipped to a standard sheet. Export is disabled during unfinished room drawing. The SVG is a floor-view export, not a completed documentation/title-block or all-format reporting system.

## Floor equipment placement (schema 15)

Create the device in the schematic, then open Building design > Floor equipment. Choose its native symbol, a visible unlocked electrical layer and optionally a room. Position uses millimetres and the selected snap grid; rotation and annotation scale control the plan symbol. Mounting height is optional. Save, edit, remove, undo and redo preserve the shared device identity and schematic wiring.

A device has one physical plan placement. Assigned room containment checks the anchor, not a certified physical footprint; annotation scale is not equipment size. Locked/hidden layers reject changes. Remove the plan placement before deleting its schematic device or assigned room. The room equipment schedule includes hidden placements and reports missing room, height and part values explicitly. Floor-first creation, circuit assignments and routes are described in the sections below. Broader building-design acceptance remains open.


## Create equipment from a floor plan

In Building design, select a floor and create a visible, unlocked electrical plan layer. Open Floor equipment → Create floor equipment. Choose a luminaire, socket, wall switch or generic distribution-board interface; enter a unique reference and description; select the linked schematic page, plan layer, optional room, coordinates and symbol scale. Mounting height is optional and remains unspecified when blank. Submit once to create the device, its real typed schematic terminals/pins, linked schematic symbol and floor placement as one undoable operation.

The linked schematic symbol uses a free position on the selected drawing sheet. Existing wires and device identities are preserved. If all existing sheet layers are hidden or locked, creation is blocked; a page with no layers obtains its first layer. An assigned room must contain the equipment anchor. These are generic original symbols with no manufacturer identity or invented ratings. The distribution-board symbol declares independent L/N/PE supply-interface terminals; it does not invent internal connections or downstream protective devices. Designating a device as a distribution board is a separate explicit action.

Use Selected equipment to edit an existing placement. Snap equipment to grid is off by default during edits so changing height, room or rotation preserves exact coordinates. Check it deliberately to quantize coordinates to the stated millimetre grid. New placements snap by default. Room schedules include hidden equipment and derive references from the shared native device.

## Distribution boards and circuit schedules

Open Circuits and cable routes. Select a placed native device and save its distribution-board name. Create a named circuit on an electrical layer, choose its board, explicitly enter supply voltage and phase count, and select its load devices. Each floor device can belong to one floor circuit. The board and all members must have placements on that floor. This increment does not represent multi-floor circuits or device subcircuits.

For each selected device, enter active load in watts if known. A blank load remains unknown; zero means an explicitly known zero load. The schedule shows device count, voltage, phases, known subtotal, count of unspecified loads and a total only when every member has an explicit load. Values are user supplied. No demand factor, protective-device sizing, current calculation or code-compliance result is implied. The route-length column sums associated route records, including overlaps; it is not an installed cable quantity.

Rename/edit the selected board or circuit with Save. Remove associated routes before deleting a circuit, and remove circuits/distribution-zone associations before deleting a board. Assigned floor placements and native devices cannot be removed while referenced. Hidden or locked circuit/device layers protect editing. These explicit associations do not create schematic wires or connect terminals.

## Cable, conduit and tray routes

Create a named Cable, Conduit or Cable tray route on an electrical plan layer. Enter at least two X,Y coordinate pairs, one pair per line, in native millimetres. Optionally assign an existing floor circuit. New routes snap to the chosen grid by default. Editing defaults to exact coordinates; enable Snap route points to grid explicitly when resnapping is intended. Empty/invalid points, zero-length segments, out-of-bounds coordinates and wrong-floor references are rejected without partial saves.

The floor view renders the route and optional circuit label. Click it or focus it and press Enter/Space to select; use Save or Remove plan route to update it. Hidden layers omit geometry while retaining schedule entries. Locked layers block edits. Routes participate in the floor view bounds and physical-size SVG export, native JSON import/export, undo/redo and save/reload.

Route lengths are sums of horizontal polyline segments in metres, excluding rises, drops, slack, bend allowances and installation allowances. Crossing routes do not create electrical connections. A conduit/tray route is not a count of cables inside it. Vertical risers, branch/junction engineering, route-capacity checks and physical conductor routing remain open.

## Vertical risers and building documentation

Building design supports emergency luminaires, original generic fire-loop devices, data interfaces and bonded PE equipment in addition to lighting, sockets, switches and boards. Each floor placement references an actual native schematic device. Vertical risers join two different floors in the same building, with an electrical layer and explicit height for each endpoint. Their floor markers and schedule retain the actual endpoint geometry; locked/hidden layers prevent edits. Risers document physical routes and do not invent conductor connectivity.

The circuit assignment diagram derives from native distribution boards and circuit membership. Download its SVG or the panel schedule CSV. The PE schedule contains actual native wires with PE endpoints; unconnected bonds are not fabricated. Unknown equipment loads remain unknown in circuit totals.

## Engineering calculations

Open the Calculations dock, choose one of the 25 categories and enter the required numeric values and units. Read the formula, assumptions, source references and any requested evidence. Compute displays the result and limited checks. Save creates a versioned native calculation record; reopening replays its exact method. Update replaces the selected record only after explicit action. CSV/JSON reports contain the inputs, units, method version, assumptions, evidence and results.

Manufacturer ratings, soil data, protective-device curves, battery behavior and installation limits must come from appropriate supplied sources. Generic calculations and estimated checks are not certification. See [calculation methods and limits](engineering-calculations.md).

## Panel design

Choose Panel design and create an enclosure with explicit millimetre dimensions. Add plates, DIN rails, ducts, compartments or doors, then place existing native devices. Catalog dimensions are retained from the assigned source snapshot; manual and custom dimensions remain explicitly identified. Front and orbitable 3D views read the same records. Inspect bounds, collision, clearance, mounting, directional access, duct and heat diagnostics, including their assumptions.

Six-face holes and entries retain their face and local geometry. Export SVG for the front layout or OBJ for generic 3D geometry. These outputs are not a STEP/manufacturer CAD conversion or machining certification.

## PLC and automation

Choose PLC and automation to create generic CPU, digital/analog I/O or communication modules. Each mapped address references a module channel and its actual terminals; address/channel/type constraints reject conflicting records. A signal assignment documents a relationship and does not insert a wire. The wiring schedule lists real native wire endpoints. Export the I/O CSV and add interlock, motor-control, sequence or safety notes linked to native devices. Notes do not execute a PLC or prove a safety function.

## Reports and real exports

Open Reports, select a drawing page or a native schedule, then download the offered format. SVG retains native drawing vectors and physical page size. PNG is actually rasterized, with dimensions displayed before download. Print/save PDF opens a print document with physical millimetre page dimensions; choose Save as PDF in the browser print dialog. Review printer scaling and margins when using physical paper.

CSV/JSON reports derive from devices, assigned parts, cables, terminals, actual connections, PLC mappings, drawing pages, revisions and saved calculations. Calculation reports replay the stored method and identify unavailable versions instead of inventing results. CSV output quotes cells and protects text cells from spreadsheet formula interpretation.

## Accounts and cloud projects

Use the profile icon to register or sign in. The green status dot means the current session was verified; local saving alone does not make it green. Profile name, password, reset and private avatar controls belong to the signed-in account. Language, settings, native search and help retain independent labelled controls.

Guest and each authenticated account have separate local project stores. Switching accounts remounts the workspace, preventing stale responses from becoming another account's data. Cloud projects are saved only through explicit controls. Reopen the current cloud revision or an available history snapshot; a revision conflict asks for review rather than overwriting another saved version. If a response is lost, reload the cloud record before retrying because the server may already have accepted the write. Pending local recovery remains available to its owner.

If an already verified account loses its connection, local editing can continue in that owner's workspace while cloud controls remain unavailable. Initial offline visitors remain guests. The application never embeds a privileged Supabase key. Production authenticated REST/storage acceptance is still tracked in [M7–M12 acceptance](MILESTONES_7_12_ACCEPTANCE.md).
