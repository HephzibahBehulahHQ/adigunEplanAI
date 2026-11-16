# ENG-0601 terminal panel footprints

Status: local implementation; merge/deployment pending.

The existing UK 5 N, UT 2,5 and PT 16 N-PE definitions now support the existing linked panel-placement action. No new menu or shell change. The PE rail-view inherits the same physical envelope. Electrical pins, internal connections and instance identities are unchanged.

Manufacturer dimension tables reviewed 2026-11-15:

| Part | Width | Height | Depth on NS 35/7.5 | Source |
| --- | --- | --- | --- | --- |
| UK 5 N / 3004362 | 6.2 mm | 42.5 mm | 47 mm | https://www.phoenixcontact.com/en-gb/products/feed-through-terminal-block-uk-5-n-3004362?type=pdf (page 3) |
| UT 2,5 / 3044076 | 5.2 mm | 47.7 mm | 47.5 mm | https://www.phoenixcontact.com/en-us/products/feed-through-terminal-block-ut-25-3044076?type=pdf |
| PT 16 N-PE / 3212147 | 12.2 mm | 75.4 mm | 52.6 mm | https://www.phoenixcontact.com/us/products/3212147/pdf (page 3) |

These are body envelopes, not complete terminal-strip assemblies. End covers, clamps, conductor bending space, rail bonding/capacity and installation clearances remain separate design work. No automatic terminal placement is added to ENG-0601 in this increment.

Regression coverage creates linked views for all three installed types, changes a canonical device reference, saves/reopens the native project and verifies geometry, stable device references, unchanged material quantities and electrical net count.

## Release verification

PR111 merged as 2a9d21c98c11ece6022c40b9ceec42d9da044c66. Final CI 43712720443/43712716272 and local npm run check passed. Browser regression exposed a real component double-click issue: canvas redraw/pointer capture prevented native double-click from opening Properties. Stable-object repeated-click handling fixes it without shell/style changes. Browser tests now assert the panel opens and all three terminal views can be created and saved/reopened. Reviewed UK 5 N and PE Properties screenshots from artifact 14161146687.

Pages run 43713001697 succeeded. Production build-info matches the merge, production HTML includes the click handler, and executing downloaded production engine creates/reopens all three terminal views with 27 nets unchanged. This is CI browser verification plus deployed-source/runtime verification, not an interactive production-browser session. Automatic terminal-strip placement, rails, covers/clamps and completed A3 engineering remain outstanding; the overall goal stays active.
