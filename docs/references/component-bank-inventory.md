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

## Second terminal-system batch

Four additional exact parts retain their own ratings, finish, mounting envelope
and clamping groups. The 2002-2201 and 2002-2231 have two clamps per level and a
500 V IEC/EN nominal rating for category III and pollution degree 3. The marker
carrier on the 2002-2231 changes the depth above the rail from 51.7 to 61.8 mm.
The terminal CSV identifies the declared common clamping positions per row.

- 2002-1304, WAGO datasheet 06 September 2024 and the connection schedule dated 30 September 2008. [Electrical and mechanical data](https://www.faitaengineering.com/assets/product_image/674341683-WAGO_2002-1304en_SG.pdf) · [Connection schedule](https://asset.conrad.com/media10/add/160267/c1/-/de/000730641DS01/datablad-730641-wago-2002-1304-doorgangsklem-520-mm-spanveer-toewijzing-n-blauw-1-stuks.pdf)
- 2002-1403, WAGO datasheet 13 June 2025, pages 1–3. [Datasheet](https://www.tme.eu/Document/4f60907ecb4c1bae8b1afd339364dd4e/2002-1403.pdf)
- 2002-2201 and 2002-2231, WAGO datasheets 13 November 2023, pages 1–2. [2002-2201 datasheet](https://pimassetsprdst.blob.core.windows.net/assets/apc_Original/50/73/32715073.pdf) · [2002-2231 datasheet](https://pimassetsprdst.blob.core.windows.net/assets/apc_Original/51/78/32715178.pdf)

## Blue double-deck through terminals

- 2002-2234 has two clamps on each of two isolated potentials and a fitted marker carrier. The IEC/EN rating is 500 V and 24 A. [WAGO datasheet, 06 December 2018, pp. 1–3](https://uk.misumi-ec.com/pdf/vona/el/WAG1/WAG1_2002-2234_Datasheet_en_1.pdf)
- 2002-2404 has four clamps on each of two isolated potentials without a marker carrier. The IEC/EN rating is 800 V and 24 A. [WAGO datasheet, 19 November 2024, pp. 1–2](https://express.ecsnz.com/en/Attachment/DownloadFile?downloadId=3539)

## Manufacturer candidate intake

Download the WAGO product-data ZIP from the [WAGO BMEcat download page](https://www.wago.com/ch-de/lp-danke-bmecat).
Run the following command from the repository root to extract ETIM class
EC000897 into a local review file. Omit the class argument for all candidates.

```powershell
./scripts/export-wago-bmecat-candidates.ps1 -Archive test-results/wago-bmecat-1126.zip -Output test-results/wago-terminal-candidates.jsonl -EtimClass EC000897
```

The JSON Lines output preserves exact manufacturer order codes, English product
and document links, raw ETIM feature values and the SHA-256 of the source ZIP.
A record enters the component bank only after mapping its source-backed
terminal identities and electrical relationships to native schematic geometry
and verifying the relevant mounting and report data. Candidate rows are local
review material and are excluded from the published editor and inventory totals.

## Single-deck through terminal variants

Thirteen additional exact 2002-series order codes add two-, three- and
four-conductor through terminals in several housing colors. Each part has one
potential, an 800 V and 24 A IEC/EN rating for category III and pollution degree
3, and a 32.9 mm depth above the DIN rail. WAGO's overall depth includes the
portion below that datum. The individual English datasheets and their printed
versions are recorded in the part batch.
[WAGO TOPJOB S family catalog, p. 38](https://www.electromate.com/media/assets/catalog-library/pdfs/wago/Wago-Rail-Mount-Terminal-Block-Systems-topjob.pdf)
