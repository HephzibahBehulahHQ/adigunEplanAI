# Terminal accessory library increment

The four manufacturer accessory definitions shipped in PR #113.

Four native manufacturer-identified mechanical accessories use existing Electrical / Symbol Library, Properties, assembly-link and panel-view controls. They have no fabricated conductor pins or internal electrical paths. Definitions remain immutable; instance tags, location and comments are editable. Body rendering is an explicitly labelled 1:1 envelope, not detailed product geometry.

| Item | Model | Body W × H × D (mm) | Source |
| --- | --- | --- | --- |
| 3003020 | D-UK 4/10 | 1.8 × 42.5 × 35.9 | https://www.phoenixcontact.com/en-us/products/end-cover-d-uk-410-3003020?type=pdf |
| 3047028 | D-UT 2,5/10 | 2.2 × 47 × 39.8 | https://www.phoenixcontact.com/en-gb/products/end-cover-d-ut-2510-3047028?type=pdf |
| 3212060 | D-PT 16 N | 2.2 × 75.4 × 45.6 | https://www.phoenixcontact.com/en-us/products/end-cover-d-pt-16-n-3212060 |
| 3022276 | CLIPFIX 35-5 | 5.2 × 48.6 × 35.3 | https://www.phoenixcontact.com/en-us/products/end-block-clipfix-35-5-3022276?type=pdf |

Manufacturer tables reviewed 2026-11-15. CLIPFIX prose mentions 5.15 mm; the nominal dimension table specifies 5.2 mm, used here. These depths are accessory body depths, not installed rail depths.

UT cover compatibility is supported by the UT 2,5 manufacturer accessory listing: https://www.phoenixcontact.com/de-de/produkte/durchgangsklemme-ut-25-3044076?type=pdf. PE cover compatibility is listed at https://www.phoenixcontact.com/us/products/3212147/pdf. UK cover identity/dimensions are verified but its device-specific compatibility remains unrecorded because the accessible UK 5 N page did not expose an accessory list. No unverified assembly link is enabled. CLIPFIX is identified for NS 35/7.5 and NS 35/15 rails; no device-specific link is claimed.

ENG-0601 now proposes two CLIPFIX end brackets per strip, one UT cover for X5 and one PE cover for XPE. The two covers reference the terminal at the right end of each arrangement. The accessory register holds the editable canonical parts and the A3 detail sheets show linked views. The A4 material register counts each native part once. UK covers remain an open selection pending device-specific compatibility evidence.

The detail sheets show editable rail outlines derived from the 35 mm nominal width of [Phoenix Contact 0801733 rail stock](https://www.phoenixcontact.com/en-us/products/din-rail-ns-35-75-perf-2000mm-0801733). The proposed segment span is the combined body widths plus at least 5 mm per end, rounded up to 5 mm. These outlines do not account for slot alignment, required mounting fasteners, installation clearances or rail bonding. They represent proposed cut segments and are therefore recorded separately from the discrete-part material quantities. Cabinet location, actual orientation and fit remain to be verified.
