# F3/F4 panel envelopes — local increment

F3 Siemens 5SY4110-7: nominal 18 W × 90 H × 76 D mm, distinct 70 mm installation depth. Siemens manufacturer data sheet 2021-01-19, page 2, opened and read:
https://media.distributordatasolutions.com/siemenscomplete/2021q1/documents/753c2eba1f9ad8086c03b48ce8404e151b080a9b.pdf
Use nominal tabulated envelope; do not substitute a 17.6 mm drawing dimension without defining its planes.

F4 Phoenix Contact 2908262: 6.2 W × 105.8 H × 55.6 D mm, depth includes 7.5 mm DIN rail. Indexed manufacturer PDF hosted by Mouser, 2025-11-13 page 4:
https://www.mouser.com/datasheet/3/507/10/phoenix_contact_2908262_en.pdf
Direct PDF retrieval returned cache miss; indexed primary document dimensions were available and consistent with existing application-note dimensions. No new drawing-image inspection claimed. Corrected old specifications' axis names (length105.8/height55.6) to height105.8/depthIncludingRail55.6.

Added linked proposed A3 views F3 (220,420), F4 (300,420), scale0.5, keeping plate-centre label clear. Five views now; underlying components/BOM/electrical identities unchanged. Clearances/rail/thermal approval remain outstanding.

52 focused tests passed, including exact axes, one canonical BOM quantity, pairwise body separation and unchanged27nets. Full check session7611 running, work/protection-footprints-check.log. Changes are local/unpublished. Main is PR109 merge49d92a7d7133b97848f47eea1264cd6201659d20. Publish only engine mirrors/tests/note after checks, then inspect five-device A3 screenshot before merge/deploy. Goal remains incomplete.

PR110 opened at cda12dcbbf815c6f390b803d83d36a13db40c3de, branch codex/eng0601-control-protection-layout, based on 49d92a7d7133b97848f47eea1264cd6201659d20. Selected files published; no deployment yet. Poll full check session7611 and CI for this head, then inspect default A3 screenshot before merge. Goal remains active.

Both premerge CI runs43710104395/43710100485 and local full check7611 passed. Artifact14159774637 screenshot work/pr110-layout-review.png exposed narrow F3/F4 labels crossing their body outlines. Changed native panel rendering to place labels above envelopes narrower than14 drawing mm; UI shell unchanged. Added browser assertion that F3/F4 text bounds are above their body bounds.

PR110 current head bd819566b8b41a360cf7d288a9749be359e2a8b1, not merged. Local full check46019 running at work/narrow-label-check.log. Fetch CI for this new head and review updated screenshot before merging; previous green checks do not cover the label correction.

## Release verified

PR110 merged as6b97d9b088ecf2f84570d96a9d07fb32c1812128 after CI43710465540/43710462510 passed on bd819566. Local full check46019 passed. Artifact14160640484 screenshot work/pr110-final-labels.png reviewed: F3/F4 labels now above their body outlines; five views separate inside plate. Pages43710658416 succeeded. Production build-info matches merge; downloaded live engine validates ENG0601 and returns all five linked views. Main CI43710658411 was in progress. Interactive production browser not exercised. Remaining component assemblies, terminals, rails/ducts and cable/thermal/bonding engineering are unfinished; goal stays active.
