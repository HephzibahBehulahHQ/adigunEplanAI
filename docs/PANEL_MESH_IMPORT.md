# Native cabinet surface models

Panel design → Cabinet equipment → select an existing placement → **3D component models** imports an ASCII or binary STL. Choose the file's coordinate units and axis convention first. Inspect the measured dimensions, triangle count and topology findings, then supply a model name, source and permission/license reference before applying. Preview and cancellation do not change the project.

The file's actual triangles are retained. Coordinates convert to millimetres and translate to a minimum corner of zero; there is no stretching to an existing box. Applying adopts the measured dimensions and preserves the device identity, mounting assignment and position. Moving and quarter-turn rotation use the same native placement and history as other equipment. The project model library can reuse one asset across placements; detaching retains its measured dimensions. Native JSON save/reopen retains geometry and provenance. OBJ export includes imported faces and native placement transforms alongside explicitly generic envelopes for other objects.

Schema 18 adds `panelMeshes` and optional equipment `meshId`; older projects migrate with an empty mesh library. Validation rejects dangling model references, nonfinite coordinates, invalid triangle indices, degenerate faces, inconsistent placement bounds and oversized projects. STL import is bounded to 8 MiB, 20,000 triangles and 60,000 vertices per asset. A project allows 100,000 asset triangles, at most 100,000 placed mesh triangles including reused instances, and retains the existing 5 MiB serialized-project limit. Oversized assignment fails before history commits. Assets are not silently discarded when detached.

WebGL depth testing renders actual surfaces, including occlusion; SVG retains keyboard selection and native outline overlays. Picking tests the projected mesh triangles. Closed door volumes remain translucent. Camera movement changes only the view. A missing/lost WebGL context displays an error rather than a replacement part. The isolated test tetrahedron under `tests/fixtures` is original regression geometry, never a catalog component.

## Limits and evidence

- Source and licensing references are user declarations, accompanied by the original file's SHA-256. They are not manufacturer authentication or a redistribution license.
- No manufacturer model bundle, STEP conversion, parametric solids, material/texture import or certified mechanical fit is provided. Nonstandard binary attribute/color bytes are reported and ignored.
- Open, non-manifold and inconsistently oriented edges are counted, not repaired. A surface import is not a guarantee of a watertight solid; self-intersection and manufacturing validity are not certified.
- Front-layout SVG and collision/clearance checks use conservative bounding envelopes. Mesh detail does not upgrade those checks to exact solid interference or thermal analysis.
- ASCII structure follows the [Library of Congress STL ASCII description](https://www.loc.gov/preservation/digital/formats/fdd/fdd000506.shtml); binary parsing follows its [binary STL description](https://www.loc.gov/preservation/digital/formats/fdd/fdd000505.shtml). Units must be supplied explicitly.

Validation covers ASCII/binary agreement, explicit units and axes, malformed and oversized input, topology reporting, placement identity, undo/reload, exact OBJ faces and projected picking. Browser coverage exercises import preview/cancel, malformed input without mutation, visible GPU pixels, overlay transparency, measured fields, selection, move/rotate/undo, reuse, exports, reload and narrow layouts. Hosted execution results belong in the PR receipt; the presence of a test is not a passing result.
