# PS1 manufacturer body and convection spacing — local increment

Siemens data sheet 6EP1332-5BA00, 2026-11-08 page 3/5, indexed primary-source mechanical table:
https://tableeditor.cicservice.siemens.com/teddatasheet/?caller=documentservice&format=PDF&language=en&mlfbs=6EP1332-5BA00

Body 45 W × 80 H × 100 D mm. Installation envelope 45 × 180 mm; top/bottom spacing 50 mm each, left/right 0 mm. Snaps onto EN60715 35 × 7.5/15 rail. These values were verified from the indexed Siemens table; direct PDF open failed, so no new PDF graphic inspection is claimed. Existing electrical operating-manual source retained.

Added immutable panelFootprint metadata and linked PS1 view at (380,240), scale 0.5, on existing A3/019. Uses 40 mm scaled body height, not 90 mm mounting-envelope height. Proposed location leaves the required top/bottom spacing inside the plate and separates it from F1/K1. No rail, overall thermal approval or mounting-hole pattern is inferred.

51 focused tests passed: physical dimensions vs clearance, immutable data, plate boundary, separation, one BOM instance and unchanged 27 global nets. Updated existing default-layout browser expectation from two to three placements; manual creation fixture still tests only F1/K1 after removing seeded views. Full check session 80769 running (work/ps1-placement-check.log). Not published or deployed. Remote main remains PR108 merge 4249edadb68bc41254cc6c7722144f96481f056b. Next publish selected engine mirrors/tests/note after checks, then review CI screenshot and merge/deploy.

PR109 opened at e3e295af9b144981a463946c6bc4b7b3fbe98adf on codex/eng0601-ps1-placement, based on 4249edadb68bc41254cc6c7722144f96481f056b. Selected engine mirrors, tests and note published. Full local check session 80769 remains running; do not restart it. CI and default A3 screenshot review pending. No deployment claimed.

## Release verification

PR109 merged as 49d92a7d7133b97848f47eea1264cd6201659d20 after both CI runs 43709289498/43709284913 passed. Full local check session 80769 passed. Artifact 14159234903 screenshot reviewed at work/pr109-layout-review.png: three separate body views inside plate and clear notes/inventory. Production build-info matches merge; downloaded live engine validates ENG-0601 and creates F1/K1/PS1 views at scale 0.5 with PS1 (380,240). Pages run 43709776739 was still reporting in_progress at initial live verification; recheck final status. Main CI43709776737 also pending. Interactive production browser not exercised. Full assembly/cable/thermal/bonding work remains incomplete; goal active.
