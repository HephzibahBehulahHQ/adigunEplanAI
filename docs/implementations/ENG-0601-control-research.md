# ENG-0601 control design evidence — 2026-11-15

Development evidence, not an installation release. Preserve the existing native project and locked interface.

## Verified load data

- Siemens 3RT2026-2KB40 exact product datasheet, page 4, dated 2025-09-10: 24 V DC coil, 4.5 W closing and holding power; varistor suppression; operating voltage factor 0.7–1.25. Nominal coil current calculated as 4.5/24 = 0.1875 A. Source: https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RT2026-2KB40 . Do not substitute main-contact heat loss for coil power.
- Telemecanique manufacturer catalogue, electrical durability section, printed page 17: XMLA/XMLB DC supply table specifies 31 W broken at 24 V for one million operating cycles, under its stated test conditions. This is separate evidence from the model datasheet's 0.1 A at 250 V DC-13 rating; do not extrapolate that rating to 24 V. Source: https://telemecaniquesensors.dam-broadcast.com/medias/domain13481/media100745/223564-minegdk9wa.pdf . The nominal K1 coil load is below the published 31 W test load; this comparison alone does not approve the complete circuit or predict installed service life.
- Exact XMLB004A2S11 datasheet page 6 operating curve was visually inspected. Source: https://downloads.telemecaniquesensors.com/dam/datasheets/en/XMLB004A2S11_EN.pdf . Local evidence: work/xmlb-manufacturer-operating-curves.jpg. Pressure settings remain nullable design inputs; current validation checks ranges/order, not the entire admissible curve.

## Maintenance-isolator restart issue

The installed development candidate Q2 has no supplied auxiliary contacts. Opening only its motor poles can leave K1's control latch energised; closing Q2 could then restart the motor. The completed design must interrupt the control hold path when Q2 opens, as well as provide lockout. Do not claim the existing power-only drawings already prevent this restart.

Siemens catalogue LV10 04/2022, auxiliary-switch selection table, lists 3LD9200-5B (1 NO + 1 NC) for front-mounted 3LD22 (32 A), with lagging switch-on and leading switch-off. Candidate accessory for the existing front-mounted Q2; verify exact terminal numbering, DC utilisation, installation instructions and mechanical assembly before adding its native component definition. Source: https://cache.industry.siemens.com/dl/files/643/109750643/att_1104557/v1/08_SwitchDisconnectors_LV10_042022_EN_202205241458164260.pdf . Exact product source: https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3LD92005B . The 3LD9240-0B part is a neutral module, not this auxiliary switch.

## Next circuit work

Use existing single physical K1 and F2 identities with terminal-bound cross-sheet connections, not duplicate physical devices to depict their auxiliary functions. Proposed ordinary control chain: protected 24 V DC → local stop → Q2 auxiliary permissive → F2 healthy contact → B1 pressure permissive → parallel momentary start / K1 seal-in → K1 coil; separate explicit 0 V return. Verify the actual pressure contact path/direction before drawing it. A basic three-wire seal-in assumes the momentary start button is released and healthy; do not claim monitored reset or stuck-start protection.

Select and verify the indicator, auxiliary supply protection and isolator accessory, add missing real parts to the library, then author the complete control and auxiliary-supply sheets. Reconcile actual page allocation with the required 30-sheet register, and derive installation/report data from the same device identities. Protection coordination, cable sizing, complete PE/bonding and commissioning remain unfinished.
