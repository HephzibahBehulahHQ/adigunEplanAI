# A3 linked panel placements

Panel views refer to canonical electrical component IDs and do not create duplicate devices or BOM entries. Existing component Properties offers an A3 target sheet and Add linked panel placement when a verified footprint exists. Creation does not switch the canvas. Selecting the destination sheet exposes a native selectable, movable, rotatable view; existing Properties shows the reference, dimensions, scale and footprint source.

F1 uses the previously recorded Siemens 2026-11-12 datasheet, page 3: W45 H97 D97 mm. This is a body envelope, not mounting-hole geometry or a clearance envelope. Only this part currently has placement footprint data. No completed panel assembly or installation approval is claimed.

Placements store stable device identity and original footprint part identity. Renaming resolves the current canonical reference. A replaced or deleted device produces a visible REVIEW marker rather than misleading geometry. Missing links remain saveable for correction; malformed coordinates, scale and identities are rejected. Original manufacturer dimensions remain immutable.

Validation: local full repository checks passed; final focused model suite 43 passed. Browser regression covers creation without duplicate devices, movement, rotation and local save/reopen; CI execution and screenshot review pending. Locked interface styling is unchanged. Full project A3 placement, clearances, rails, ducts, thermal assessment and A4 remain unfinished.
