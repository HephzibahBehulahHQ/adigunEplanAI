# ENG-0601 A4 development reports — local increment

Creates seven actual native A4 documents from the current example: two material registers (19 canonical part groups), three terminal registers (17 terminal devices), an unperformed inspection/commissioning plan, and an unresolved-design/handover register. Numbering runs A4/020–026 after A3/019. Contents now lists only real sheets, not planned sheets with nonexistent destinations.

Material quantities and terminal labels derive from the same native components and attached wires used by A2. Reports are explicitly editable snapshots, not live reports; after edits users must compare/regenerate using existing reports. No cable selections, measured results, signed approvals or installation release are invented. A3 physical assembly and engineering verification remain unfinished.

49 focused engineering tests passed, including source correspondence, continuity of numbering, independent template copies and native persistence. Full check session 70261 is running (work/a4-check.log). Browser test added for all seven report sheets, screenshots and local save/reopen; not run yet. Current remote main is PR106 merge 8e36b430c5a0cf6a91d96720229265c3a0fd19e6. This increment is local only; publish selected engine mirrors, tests and this note after checks, then inspect rendered reports before merging.

PR #107 opened at 2f14ba42138b122149b14eaeab0ecd710c2cbc03 on codex/eng0601-a4-reports, based on 8e36b430c5a0cf6a91d96720229265c3a0fd19e6. Full local check session 70261 passed. Removed obsolete planned-register generation afterward; final focused run still passes 49 tests (work/a4-final-tests.log). CI and seven report screenshots remain pending; inspect each for wrapping/overlap before merge. These are development reports, not completed A3 engineering or signed final acceptance.

## Browser verification follow-up

First CI failed only the earlier 20-sheet assertion: ENG-0601 now correctly has 27 sheets. Updated it and added per-object SVG overlap/page-boundary assertions for every A4 sheet. PR107 head b441b849f7946274106ffaa99f43dfb3f00612c9; final CI pending.

Reviewed all seven screenshots from artifact 14159325209 (prior head; drawing implementation unchanged). Text is readable, separated and within the sheet/title-block boundary. Native A4 save/reopen browser workflow passed on that run; overall run failed the obsolete count. Images: work/a4-review/copied-interface-ENG-0601--71b9a-ts-and-survive-local-reopen/eng0601-a4-0.png through -6.png. Wait for final head CI before merging.

## Overview wrapping correction

CI at b441b849 failed the existing authored-paper overlap check; the new A4 layout/save/reopen test passed. The expanded A1 overview delivery summary had reached 207 characters. Shortened it to keep the row clear and added the paper-loop index to assertion diagnostics. 49 focused tests pass. PR107 current head efdcaf65126efe9b885aca536539af7160c26f4a; new CI must verify the fix before merge. No layout CSS changed.

CI at efdcaf65 passed all SVG layout assertions, including A1 overview and all seven A4 reports. It then found a second obsolete expected sheet count in the saved-file assertion (20 versus actual 27). Corrected it and searched all relevant tests for further 20-sheet assumptions; none remain. Current PR107 head c333b2ea1abba8a3b5bb5a84b409019681e3a744. Formatting passed. Final CI still required before merge; no production changes in this follow-up.

## Release verified

PR107 merged as 8deac09dc6e11c682b765505e02050627549c739. Final premerge CI 43707713501/43707710500 passed; Pages 43707877237 and main CI 43707877222 passed. Production build-info matches the merge. Executed the downloaded production engine: ENG-0601 creates 27 sheets, A4/020–026, and validates successfully. All seven report screenshots previously reviewed; final CI includes layout assertions and development/production browser save/reopen. No interactive production browser inspection in this increment. A3 detailed assembly, cable engineering and installation verification remain outstanding; active goal is not complete.
