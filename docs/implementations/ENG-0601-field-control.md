# Field control interfaces — local increment

A2/016 now contains four native Phoenix Contact UT 2,5 (3044076) feed-through terminals X5:1–4. Q2's auxiliary loop uses X5:1/2; B1 uses X5:3/4. Each terminal has its own electrical net. X5:4 supplies the Start and K1 holding branches. Existing field devices remain single instances on their previous sheets; no duplicate devices or permanent contact bridges were introduced.

The project now has 17 sheets, 36 paired continuations and 90 wires. All 32 focused tests pass, including explicit membership of both connections of each X5 terminal in the correct control net. Save/reopen and component movement regressions retain topology. No deployment yet.

Before publishing: update browser expectations (17 sheets; control sheet now 12 continuation graphics instead of 11), add A2/016 screenshot and X5 placement/editing checks, review wire/label geometry on the control, field-motor and new terminal sheets, reconcile continuation descriptions and stale report prose, and adjust the planned register so the cable schedule has a reserved place. Cable/core selection, full bonding, A3/A4 remain incomplete. Keep all source files LF. Use remote main 407b109548a554b75e1fd4cbb13bd19f17b3bfa6 as base, preserving unrelated worktree changes.
