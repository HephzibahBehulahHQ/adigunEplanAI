# ENG-0601 terminal report — local increment

A2/015 Field terminal connections is a native editable text sheet generated at example creation from analyzeProject's cross-sheet electrical nets. It lists X2:1–3 motor interfaces and XPE:1–2 PE interfaces, with manufacturer terminal labels and destination sheet numbers. Motor rows occupy the left column; PE rows stay together on the right. It does not introduce duplicate physical devices or infer cable cores, cable sizing or physical terminal order.

The report explicitly identifies itself as an editable snapshot. Edits to circuits do not silently rewrite user-authored report text; Electrical checks remains the current connectivity inspection. Pressure and isolator auxiliary field terminal allocation still needs implementation, followed by cable and bonding schedules, A3 layouts and A4 documentation. Do not call the project complete.

Local validation: 32 focused engineering tests passed. The new test verifies native editable text, actual motor/PE endpoint labels, independent example copies and local save/reopen. Existing topology remains 31 paired continuations, 81 wires and 27 global nets; project now contains 16 sheets. Browser expected sheet counts updated, but new report screenshot/bounds verification, full checks, PR and deployment remain pending. Preserve LF source line endings and approved stylesheet hash.

Previous release: PR #93 / 7024e5b12a7f210a1a0bf0ad55462997765b0c9e fully verified: main CI 43677787673 and Pages 43677787613 passed; live A2/014 and neutral cross-reference verified. Work from this remote base for the next PR. Do not blanket commit the stale checkout.
