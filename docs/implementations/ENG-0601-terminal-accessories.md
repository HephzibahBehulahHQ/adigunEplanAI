# Terminal accessory library increment

Local implementation; full checks, browser review, merge and deployment pending.

Four native manufacturer-identified mechanical accessories use existing Electrical / Symbol Library, Properties, assembly-link and panel-view controls. They have no fabricated conductor pins or internal electrical paths. Definitions remain immutable; instance tags, location and comments are editable. Body rendering is an explicitly labelled 1:1 envelope, not detailed product geometry.

| Item | Model | Body W × H × D (mm) | Source |
| --- | --- | --- | --- |
| 3003020 | D-UK 4/10 | 1.8 × 42.5 × 35.9 | https://www.phoenixcontact.com/en-us/products/end-cover-d-uk-410-3003020?type=pdf |
| 3047028 | D-UT 2,5/10 | 2.2 × 47 × 39.8 | https://www.phoenixcontact.com/en-gb/products/end-cover-d-ut-2510-3047028?type=pdf |
| 3212060 | D-PT 16 N | 2.2 × 75.4 × 45.6 | https://www.phoenixcontact.com/en-us/products/end-cover-d-pt-16-n-3212060 |
| 3022276 | CLIPFIX 35-5 | 5.2 × 48.6 × 35.3 | https://www.phoenixcontact.com/en-us/products/end-block-clipfix-35-5-3022276?type=pdf |

Manufacturer tables reviewed 2026-11-15. CLIPFIX prose mentions 5.15 mm; the nominal dimension table specifies 5.2 mm, used here. These depths are accessory body depths, not installed rail depths.

UT cover compatibility is supported by the UT 2,5 manufacturer accessory listing: https://www.phoenixcontact.com/de-de/produkte/durchgangsklemme-ut-25-3044076?type=pdf. PE cover compatibility is listed at https://www.phoenixcontact.com/us/products/3212147/pdf. UK cover identity/dimensions are verified but its device-specific compatibility remains unrecorded because the accessible UK 5 N page did not expose an accessory list. No unverified assembly link is enabled. CLIPFIX is identified for NS 35/7.5 and NS 35/15 rails; no device-specific link is claimed.

These parts are not yet instantiated into ENG-0601. Complete strip orientation, quantities, rail selection/locations, clamps/covers placement and physical assembly verification remain subsequent work. 55 focused engineering tests pass, including source dimensions, immutable definitions, no electrical pins, compatible linking, incompatible-link rejection, material quantities and local reopen.
