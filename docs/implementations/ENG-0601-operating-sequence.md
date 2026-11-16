# ENG-0601 operating sequence increment

Adds native editable A2/012 operating sequence and interlocks. Expected behaviour follows the existing terminal-bound control topology: stop, Q2 auxiliary, overload healthy contact and pressure permissive interrupt the holding circuit. A released healthy start button is required for restoration without automatic restart. Held/welded start and welded power contacts are explicitly outside the protection provided by this ordinary control circuit.

Documents H1/H2 meanings, control-supply loss, manual restart, isolation boundaries and required commissioning evidence. No simulated actuation, physical test results or installation approval is asserted. Main protection/cable/bonding/layout work remains open.

Corrects stale notes about PS1/F3/F4, H1/H2 and the pressure assumptions. All objects are ordinary editable text, use the existing project model, and retain stable sheet identities. The A1–A4 containers and interface stylesheet are unchanged.

Validation: 25 targeted engineering tests passed locally. Full checks and browser layout/save-reopen regression pending. The browser test measures all authored text on this page against the sheet boundaries and checks for overlaps.

Release verified: PR #90 merged as 1ef8247a2c7d49d0ea3512d4617b8fa443f13540. Final-head CI 43670821693 and 43670817830 passed: 383 tests, 16 browser tests against each dev/prod build. Pages 43670957397 passed. Live native example shows 13 sheets; A2/012 sequence reviewed visually. Pilot reference/lens labels now separated. Live screenshot: work/live-operating-sequence.png. The broader project remains incomplete (main feeder, full bonding/cables, A3/A4). No installation approval or actuation simulation is claimed.
