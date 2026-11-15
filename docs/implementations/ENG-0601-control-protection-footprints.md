# F3/F4 panel envelopes — local increment

F3 Siemens 5SY4110-7: nominal 18 W × 90 H × 76 D mm, distinct 70 mm installation depth. Siemens manufacturer data sheet 2021-01-19, page 2, opened and read:
https://media.distributordatasolutions.com/siemenscomplete/2021q1/documents/753c2eba1f9ad8086c03b48ce8404e151b080a9b.pdf
Use nominal tabulated envelope; do not substitute a 17.6 mm drawing dimension without defining its planes.

F4 Phoenix Contact 2908262: 6.2 W × 105.8 H × 55.6 D mm, depth includes 7.5 mm DIN rail. Indexed manufacturer PDF hosted by Mouser, 2025-11-13 page 4:
https://www.mouser.com/datasheet/3/507/10/phoenix_contact_2908262_en.pdf
Direct PDF retrieval returned cache miss; indexed primary document dimensions were available and consistent with existing application-note dimensions. No new drawing-image inspection claimed. Corrected old specifications' axis names (length105.8/height55.6) to height105.8/depthIncludingRail55.6.

Added linked proposed A3 views F3 (220,420), F4 (300,420), scale0.5, keeping plate-centre label clear. Five views now; underlying components/BOM/electrical identities unchanged. Clearances/rail/thermal approval remain outstanding.

52 focused tests passed, including exact axes, one canonical BOM quantity, pairwise body separation and unchanged27nets. Full check session7611 running, work/protection-footprints-check.log. Changes are local/unpublished. Main is PR109 merge49d92a7d7133b97848f47eea1264cd6201659d20. Publish only engine mirrors/tests/note after checks, then inspect five-device A3 screenshot before merge/deploy. Goal remains incomplete.
