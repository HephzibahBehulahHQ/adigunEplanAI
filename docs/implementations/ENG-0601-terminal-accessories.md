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

The manufacturer accessory listings identify the covers for [UK 5 N](https://www.ilecsys.co.uk/sites/default/files/2025/02/01/phoenix-contact-3004362-en.pdf), [UT 2,5](https://www.phoenixcontact.com/de-de/produkte/durchgangsklemme-ut-25-3044076?type=pdf) and [PT 16 N-PE](https://www.phoenixcontact.com/us/products/3212147/pdf). The UK 5 N datasheet dated 2025-02-01 lists D-UK 4/10, article 3003020, on page 3. CLIPFIX is listed for NS 35/7.5 and NS 35/15 rails.

ENG-0601 proposes two CLIPFIX end brackets per strip and a linked cover at the right end of each of the six arrangements. X1–X4 use D-UK 4/10, X5 uses D-UT 2,5/10 and XPE uses D-PT 16 N. The accessory register holds the editable canonical parts, the A3 details show linked views, and the A4 material register counts each installed instance once.

The rail mounting sheet locates six 58 mm segments on the 545 × 775 mm plate. The selected [Phoenix Contact 0801733 stock](https://www.phoenixcontact.com/en-us/products/din-rail-ns-35-75-perf-2000mm-0801733) has 15 × 6.2 mm slots at 25 mm pitch. Centring each cut between two slots gives at least 4 mm per end for the widest modelled strip and 1 mm nominal distance to the next unused slot. The proposal includes candidate fasteners and 50 mm vertical and 15 mm end service reservations. Confirm actual cut tolerance, fastener seating, tool access, cable bend radii and clearances before releasing fabrication dimensions.

The protective bonding schedule locates the cabinet branch at the unused XPE:0 clamp, with separate enclosure, mounting-plate and flexible door bonds. The [Rittal AX strap candidate](https://www.rittal.com/uk-en/products/PG20231215ZUB101/PG2024040ZUB112/PG2024040ZUB113/PRO12064?variantId=2564000) has M8 ends, 170 mm length and 4 mm² section. Actual strap selection depends on reach and calculated duty. The [PT 16 N-PE manufacturer data](https://www.phoenixcontact.com/en-nl/products/ground-terminal-block-pt-16-n-pe-3212147) requires checking rail current capacity. Record actual continuity results separately. The physical schedule leaves the existing electrical netlist intact.

The motor feeder acceptance worksheet records the installed design candidates and identifies the outstanding measured fault duty, upstream protection, cable-route, disconnection and thermal inputs. It uses the [Siemens 400 V coordination tables](https://cache.industry.siemens.com/dl/files/188/39714188/att_868208/v1/manual_load_feeder_configuration_en-US.pdf?download=true) as the basis for comparing the conditional combination separately from individual breaker ratings.
