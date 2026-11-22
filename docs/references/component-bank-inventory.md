# Component bank inventory

Run `node scripts/export-component-inventory.mjs` to generate the CSV and JSON
in `test-results/component-inventory`. Each manufacturer and exact order-code
combination has one row with its engineering and compact editor implementations.
The exporter reads both catalogs and registers the same six generic PLC symbols
as the compact editor. It does not read user project files.

At the roadmap checkpoint `7501b6f`, the exporter found 48 distinct
source-backed manufacturer part records across 53 implementations. It counted
74 original engineering symbols, 30 compact symbol families, 142 compact symbol
units, and 13 distinct parts with a compact panel representation. The 38 compact
manufacturer definitions with declared pin maps are a coverage count. The
inventory has no fleet-wide independent validation count. Generic symbols,
layout views and custom user definitions do not count toward the 10,000 parts.

## First terminal-system batch

Three WAGO TOPJOB S through terminals are placeable from the compact library.
The 2002-1301 and 2002-1401 share one potential across three and four clamping
positions. The 2002-2401 has eight positions split across two isolated levels.
The software assigns stable schematic clamp labels and keeps those separate
from product markings. The body envelopes use the documented DIN rail datum.

- 2002-1301, WAGO datasheet dated 21 June 2021, pages 2–3. [Datasheet](https://www.tme.com/Document/48da317c62302f1fde27b2c2b6a09f40/2002-1301.pdf)
- 2002-1401, WAGO datasheet dated 02 November 2021, pages 2–3. [Datasheet](https://4donline.ihs.com/images/VipMasterIC/IC/WAGO/WAGO-S-A0013864068/WAGO-S-A0013864653-1.pdf?hkey=6D3A4C79FDBF58556ACFDE234799DDF0)
- 2002-2401, WAGO datasheet version 27 June 2024, pages 1–2. [Datasheet](https://tlauk.net/document/65105/Wago%2C%202002-2401.pdf)
