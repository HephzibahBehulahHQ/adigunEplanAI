# A3 linked panel placements

Panel views refer to canonical electrical component IDs and do not create duplicate devices or BOM entries. Existing component Properties offers an A3 target sheet and Add linked panel placement when a verified footprint exists. Creation does not switch the canvas. Selecting the destination sheet exposes a native selectable, movable, rotatable view; existing Properties shows the reference, dimensions, scale and footprint source.

F1 uses the previously recorded Siemens 2026-11-12 datasheet, page 3: W45 H97 D97 mm. This is a body envelope, not mounting-hole geometry or a clearance envelope. K1 Siemens 3RT2027-2KB40 also has a body footprint from its archived 2021-01-21 manufacturer datasheet; see the footprint research record. No completed panel assembly or installation approval is claimed.

Placements store stable device identity and original footprint part identity. Renaming resolves the current canonical reference. A replaced or deleted device produces a visible REVIEW marker rather than misleading geometry. Missing links remain saveable for correction; malformed coordinates, scale and identities are rejected. Original manufacturer dimensions remain immutable.

Validation: local full repository checks passed; final focused model suite 43 passed. Browser regression covers creation without duplicate devices, movement, rotation and local save/reopen; CI execution and screenshot review pending. Locked interface styling is unchanged. Full project A3 placement, clearances, rails, ducts, thermal assessment and A4 remain unfinished.

Release verification: PR #103 merged as 147f93c19e93619ce44681e522b2cbe4099bfd5f. Final CI 43700527107 and 43700523263 passed. Earlier revision screenshot inspected at work/panel-review/copied-interface-linked-pa-390f7-ical-device-on-local-reopen/linked-panel-placement.png: moved/rotated F1 view remains inside the enclosure, clear of register and title block. Deployment verification pending.

Pages run 43700700026 succeeded. Production build-info confirms 147f93c19e93619ce44681e522b2cbe4099bfd5f; live HTML contains placement action, renderer and same-sheet refresh. Interactive production browser check remains pending; browser workflow was verified in CI.
