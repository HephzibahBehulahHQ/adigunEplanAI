# Field control interfaces — local increment

A2/016 now contains four native Phoenix Contact UT 2,5 (3044076) feed-through terminals X5:1–4. Q2's auxiliary loop uses X5:1/2; B1 uses X5:3/4. Each terminal has its own electrical net. X5:4 supplies the Start and K1 holding branches. Existing field devices remain single instances on their previous sheets; no duplicate devices or permanent contact bridges were introduced.

The project now has 17 sheets, 36 paired continuations and 90 wires. All 32 focused tests pass, including explicit membership of both connections of each X5 terminal in the correct control net. Save/reopen and component movement regressions retain topology. No deployment yet.

Before publishing: update browser expectations (17 sheets; control sheet now 12 continuation graphics instead of 11), add A2/016 screenshot and X5 placement/editing checks, review wire/label geometry on the control, field-motor and new terminal sheets, reconcile continuation descriptions and stale report prose, and adjust the planned register so the cable schedule has a reserved place. Cable/core selection, full bonding, A3/A4 remain incomplete. Keep all source files LF. Use remote main 407b109548a554b75e1fd4cbb13bd19f17b3bfa6 as base, preserving unrelated worktree changes.

PR #95 open at 27ea3a13c2a8443de41b74de1232ba1764057a8e. Local npm run check passed. CI 43678845580 and 43678826641 observed active. Browser checks now expect 17 sheets, 12 control-sheet continuations and nine X5-sheet continuations; follows B1-FEED. Labels reconciled to X5 endpoints and planned page 018 retains cable/continuation schedule. Review field-control, control and field-motor screenshots before merging; no deployment yet.

Initial CI both passed, but screenshot review found X5:4 Start branch crossing its own body/ref and control-sheet B1-return/Start label overlap. Fixed branch stub x400→340 on X5 sheet and Start stub y470→530 on control sheet. Focused tests passed. New head 5433685b8ff0831c3f373a9de0777be4ee8f5b11 requires fresh CI and screenshot review. Original artifacts: work/field-control-review. Do not merge the earlier visual defect.

Routing-head CI 43679526864 / 43679522161 both passed; reviewed corrected screenshots in work/field-control-final. Body crossing and control-reference overlap resolved. One long hold caption still touched branch; shortened to 24V-05-HOLD, retaining destination connector metadata. Final head 4169f989cbd906ba9b152ab110fae2eeb262c3dc awaits CI. Not merged or deployed.

PR #95 merged as 81eb5ab10c42d9abe495276ffb0abb2158f49bd1 after final CI 43679720514 / 43679715771 passed. Deployment and live final-caption verification pending.

DEPLOYED AND LIVE VERIFIED: Pages 43679853906 succeeded; live build-info matches 81eb5ab10c42d9abe495276ffb0abb2158f49bd1. Fresh example shows four native X5 terminals on A2/016. B1-FEED opens B1 on A2/009. Final live screenshot work/live-field-control.png confirms short hold caption clear of branch. Remaining goal: bonding/cable engineering, A3 physical layouts and A4 reports.
