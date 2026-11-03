# AdigunEplanAI help

## Contents

- [Custom components](#custom-components)
- [Component revisions and replacement](#component-revisions-and-replacement)
- [Component files](#component-files)
- [Mechanical symbols](#mechanical-symbols)
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
