# ENG-0601 continuation register — in progress

Local increment after PR96 merge 8f81d4beae940cc803a64f93c8d28961f37e518e: added native editable A2/018, 37 paired continuation rows derived from wire attachments, component terminal identities and current sheet numbers. This is a snapshot, explicitly not a physical cable/core schedule. No wiring, manufacturer specifications or interface geometry changed. Fresh example now has 19 sheets. Original user projects unchanged.

35 focused tests pass, including per-endpoint register coverage, native text edit/save/reopen and template independence. PR96 post-merge CI also succeeded. Pending: full check, browser screenshot coverage/review (two columns, 19 rows max, 21mm spacing), reviewed-file publication, CI, merge/deploy/live verification. Do not claim this increment deployed. Next substantive engineering work remains cable selection/calculations and A3/A4 assembly documentation.

PR #97 opened at fcd3e5a56354b964f698fa422f911f4d41fc1283. Full local check passed 393 tests/build; browser screenshot coverage added and format checked. CI handles 43682089211 and 43682086379. Catalogue A2/018 also requires potential labels, reference coordinates and physical cable/core identities; current register is an incremental terminal-pair snapshot only. These requirements remain open alongside cable selection; do not call the project or full register complete.

PR97 merged as 996794e75e364a774d8b3c62680099ab7a70f094. Both exact-head CI runs succeeded. Artifact 14148314832 reviewed: 37 rows in two columns, no title-block overlap. Screenshot work/register-review/copied-interface-ENG-0601--8083d-erlaps-and-roundtrips-edits/eng0601-continuation-register.png. Deployment/live verification pending. Next cable work researched in ENG-0601-cable-research.md.

Pages run 43682515007 succeeded. Production build-info matches 996794e75e364a774d8b3c62680099ab7a70f094; production HTML-linked engine contains the register generator and snapshot label. Live UI navigation still to verify; main CI 43682514995 pending.
