# ENG-0601 overload mounting accessory — in progress

Adds Siemens 3RU2926-3AA01 to the existing native library. The mechanical body view uses the manufacturer's support dimensions, explicitly not the assembled relay envelope. Screw electrical terminals exist physically, but their terminal map is not yet modelled; no connectable pins are invented.

Existing Properties can link the accessory to a compatible canonical F2 instance using its stable internal ID. The link survives persistence, and incompatible targets are rejected. The accessory remains a separate material item; F2 is not duplicated. Missing or replaced targets show a review notice in the accessory Properties.

Manufacturer source: https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RU2926-3AA01 (2025-10-29, page 1/3). Assembly research and archived manual evidence are in ENG-0601-overload-mounting-research.md.

Local focused suite: 45 passed. Full local checks passed (403 tests). Browser regression now covers library insertion, linking, canonical target rename and save/reopen; CI execution and visual review remain required before merge. This increment is not merged or deployed. Do not claim a complete F2 assembly or complete A3 layout. Next: add browser coverage, verify BOM quantity, exercise target rename/deletion/replacement, then validate and publish. Afterwards resolve accessory terminal mapping and implement coordinated assembly geometry.
