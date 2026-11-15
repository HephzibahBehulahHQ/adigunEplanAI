# ENG-0601 operating sequence increment

Adds native editable A2/012 operating sequence and interlocks. Expected behaviour follows the existing terminal-bound control topology: stop, Q2 auxiliary, overload healthy contact and pressure permissive interrupt the holding circuit. A released healthy start button is required for restoration without automatic restart. Held/welded start and welded power contacts are explicitly outside the protection provided by this ordinary control circuit.

Documents H1/H2 meanings, control-supply loss, manual restart, isolation boundaries and required commissioning evidence. No simulated actuation, physical test results or installation approval is asserted. Main protection/cable/bonding/layout work remains open.

Corrects stale notes about PS1/F3/F4, H1/H2 and the pressure assumptions. All objects are ordinary editable text, use the existing project model, and retain stable sheet identities. The A1–A4 containers and interface stylesheet are unchanged.

Validation: 25 targeted engineering tests passed locally. Full checks and browser layout/save-reopen regression pending. The browser test measures all authored text on this page against the sheet boundaries and checks for overlaps.
