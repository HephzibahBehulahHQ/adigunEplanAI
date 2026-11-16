# ENG-0601 terminal report — local increment

A2/015 Field terminal connections is a native editable text sheet generated at example creation from analyzeProject's cross-sheet electrical nets. It lists X2:1–3 motor interfaces and XPE:1–2 PE interfaces, with manufacturer terminal labels and destination sheet numbers. Motor rows occupy the left column; PE rows stay together on the right. It does not introduce duplicate physical devices or infer cable cores, cable sizing or physical terminal order.

The report explicitly identifies itself as an editable snapshot. Edits to circuits do not silently rewrite user-authored report text; Electrical checks remains the current connectivity inspection. Pressure and isolator auxiliary field terminal allocation still needs implementation, followed by cable and bonding schedules, A3 layouts and A4 documentation. Do not call the project complete.

Local validation: 32 focused engineering tests passed. The new test verifies native editable text, actual motor/PE endpoint labels, independent example copies and local save/reopen. Existing topology remains 31 paired continuations, 81 wires and 27 global nets; project now contains 16 sheets. Browser expected sheet counts updated, but new report screenshot/bounds verification, full checks, PR and deployment remain pending. Preserve LF source line endings and approved stylesheet hash.

Previous release: PR #93 / 7024e5b12a7f210a1a0bf0ad55462997765b0c9e fully verified: main CI 43677787673 and Pages 43677787613 passed; live A2/014 and neutral cross-reference verified. Work from this remote base for the next PR. Do not blanket commit the stale checkout.

PR #94 open, corrected head 130e393ec875569e2207973d616968a13aa20548. Full local check passed: 390 tests and build. Initial CI report bounds/overlap passed, but stale seven-tab assertion failed after opening an eighth report view; corrected to eight. Current CI 43678280814 / 43678277525 observed active. Screenshot review, merge and deployment pending.

PR #94 merged as 407b109548a554b75e1fd4cbb13bd19f17b3bfa6. Corrected CI 43678280814 and 43678277525 succeeded. Visually reviewed work/terminal-report-review/.../eng0601-field-terminals.png; no text overlaps. Deployment/live verification pending.

DEPLOYED: Pages 43678425161 succeeded; live build-info matches 407b109548a554b75e1fd4cbb13bd19f17b3bfa6. Browser initially loaded previous HTML during rollout; normal refresh loaded current content-versioned engine. Fresh example now displays A2/015 with actual F2/Q2/M1/PS1 terminal destinations. Screenshot work/live-field-terminals.png. Preserve existing user projects. Next: complete field control terminals, cable/bonding design and A3/A4.
