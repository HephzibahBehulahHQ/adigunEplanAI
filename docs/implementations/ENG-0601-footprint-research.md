# ENG-0601 mounting footprint research — next A3 stage

Primary Siemens source retrieved by indexed manufacturer datasheet 2026-11-15:
https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2321-4BC10

F1 3RV2321-4BC10: H97 x W45 x D97 mm (datasheet page3/7 dated2026-11-12). General side-by-side clearance: above/below50mm, side0; for grounded/live parts at400V: above/below30mm, side9mm. Keep these distinct; do not equate adjacent device mounting with nearby grounded duct/plate clearances. Older2014 third-party-hosted datasheet says D96mm: prefer current exact-part manufacturer source and retain edition provenance.

K1 current Siemens URL failed through web tool:
https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RT2027-2KB40
Existing local work/siemens-3rt2027.pdf may supply source evidence without another download. A2021 manufacturer datasheet mirrored at https://media.distributordatasolutions.com/siemenscomplete/2021q1/documents/140fbadef58253c91d9bfa905f73b01c016bbca8.pdf reports H102 W45 D107mm; verify local/current edition before adopting. Do not silently use schematic symbol dimensions as physical footprints.

A3 layout must refer to canonical A2 device instance IDs and avoid duplicate BOM/electrical instances. Enclosure sheet is dimensional basis only. Need source-backed footprints and clearance envelopes, rail/duct placement and thermal assessment; these are not satisfied by the existing A3 text inventory.
## K1 verification — 2026-11-15

Read the existing local Siemens PDF with bundled pypdf. Its printed page 5/6 identifies 3RT20272KB40 and edition 1.21.2021. Physical PDF has nine pages; source citation uses the printed page number, not an invented current edition.

Verified body dimensions: height 102 mm, width 45 mm, depth 107 mm. Side-by-side spacing front/top/bottom 10 mm, side 0 mm. Grounded and live-part categories each specify front/top/bottom 10 mm and side 6 mm. Screw or snap mounting on 35 mm rail is stated; mounting-hole locations and rail part selection remain unverified. These clearance values are preserved as distinct metadata categories, not rendered or automatically certified by the placement tool.

The immutable K1 panel footprint now cites the archived manufacturer PDF URL above, date 2021-01-21, page 5. It explicitly requires delivered-revision verification before installation. No current-edition claim is made. Placement is now available through the existing component Properties without changing the interface.
