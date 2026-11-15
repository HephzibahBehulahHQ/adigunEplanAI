# ENG-0601 mounting footprint research — next A3 stage

Primary Siemens source retrieved by indexed manufacturer datasheet 2026-11-15:
https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2321-4BC10

F1 3RV2321-4BC10: H97 x W45 x D97 mm (datasheet page3/7 dated2026-11-12). General side-by-side clearance: above/below50mm, side0; for grounded/live parts at400V: above/below30mm, side9mm. Keep these distinct; do not equate adjacent device mounting with nearby grounded duct/plate clearances. Older2014 third-party-hosted datasheet says D96mm: prefer current exact-part manufacturer source and retain edition provenance.

K1 current Siemens URL failed through web tool:
https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RT2027-2KB40
Existing local work/siemens-3rt2027.pdf may supply source evidence without another download. A2021 manufacturer datasheet mirrored at https://media.distributordatasolutions.com/siemenscomplete/2021q1/documents/140fbadef58253c91d9bfa905f73b01c016bbca8.pdf reports H102 W45 D107mm; verify local/current edition before adopting. Do not silently use schematic symbol dimensions as physical footprints.

A3 layout must refer to canonical A2 device instance IDs and avoid duplicate BOM/electrical instances. Enclosure sheet is dimensional basis only. Need source-backed footprints and clearance envelopes, rail/duct placement and thermal assessment; these are not satisfied by the existing A3 text inventory.
