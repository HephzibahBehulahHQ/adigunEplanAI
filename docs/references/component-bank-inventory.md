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

## 2001-series single-deck through terminals

Eighteen exact codes cover six finishes for each two-, three- and four-clamp
layout. The terminal body is 4.2 mm wide and the nominal conductor section is
1.5 mm². The individual WAGO datasheets list an IEC/EN rated current of 17.5 A
and a nominal voltage of 800 V for category III and pollution degree 3. The
18 A shown in the power-loss table refers to that separate measurement.
[Representative 2001-1406 datasheet, pp. 2–3](https://wago.priintcloud.com/datasheets/2001-1406/en)

## 2201- and 2202-series push-button terminals

Thirty-six exact codes cover the six standard housing colors across two-,
three- and four-clamp layouts in both series. Their push-button actuates the
conductor clamp. The schematic shows a single common potential through the
clamping positions. Part records carry the distinct 4.2 mm / 1.5 mm² /
17.5 A and 5.2 mm / 2.5 mm² / 24 A specifications. The IEC/EN nominal voltage
is 800 V for category III and pollution degree 3.
[2201-1201 datasheet](https://wago.priintcloud.com/datasheets/2201-1201/en) ·
[2202-1401 datasheet](https://wago.priintcloud.com/datasheets/2202-1401/en)

## Full-catalog search

The component sidebar and Insert symbol dialog search all loaded entries by
part number and descriptive terms. Results over 250 are paginated. Search
always starts on the first matching page. Placement uses the original native
component IDs, including parts found beyond the initial page.

## 2000- and 2004-series operating-tool terminals

Thirty-six exact codes cover six colors in each two-, three- and four-clamp
layout. The 2000 series is 3.5 mm wide with a 1 mm² nominal conductor section
and 13.5 A IEC rated current. The 2004 series is 6.2 mm wide with a 4 mm²
nominal section and 32 A IEC rated current. Both have one documented common
potential and 800 V nominal for category III and pollution degree 3.
[2000-1201 datasheet](https://wago.priintcloud.com/datasheets/2000-1201/en) ·
[2004-1406 datasheet](https://wago.priintcloud.com/datasheets/2004-1406/en)

The batch stores the exact datasheet version, measurement page and PDF hash.
To reproduce the evidence extraction, use Python with `pypdfium2` and a
directory containing the exact English PDFs downloaded from the candidate
export. The script prints reviewable JSON to standard output and rejects
unsupported or conflicting data.

```powershell
python scripts/extract-wago-through-terminal-datasheets.py dist/component-bank-source/wago-terminal-candidates.jsonl dist/component-bank-source/series-2000-2004 --retrieved-at 2026-11-23
```

## Higher-current operating-tool through terminals

Thirty-eight 2006-, 2010- and 2016-series parts carry 6, 10 and 16 mm² nominal
conductor sections with IEC rated currents of 41, 57 and 76 A respectively.
The catalog uses 800 V for overvoltage category III and pollution degree 3.
The datasheets also show 1,000 V for category III and pollution degree 2.
All added parts have one common potential. The two larger series have a
36.9 mm depth above the DIN rail, compared with 32.9 mm for the 2006 series.
[2006-1201 datasheet](https://wago.priintcloud.com/datasheets/2006-1201/en) ·
[2010-1201 datasheet](https://wago.priintcloud.com/datasheets/2010-1201/en) ·
[2016-1201 datasheet](https://wago.priintcloud.com/datasheets/2016-1201/en)

## 2204- and 2206-series push-button through terminals

Thirty-one exact codes extend the push-button catalog to 4 and 6 mm² nominal
conductor sections. The 2204 series is 6.2 mm wide and rated 32 A under the
documented IEC/EN conditions. The 2206 series is 7.5 mm wide and rated 41 A.
The 2206 two-clamp body is 57.3 mm high, with a depth of 32.9 mm above the rail.
Exact datasheet versions, the physical-data page and PDF hashes are stored
in the batch.
[2204-1201 datasheet](https://wago.priintcloud.com/datasheets/2204-1201/en) ·
[2206-1201 datasheet](https://wago.priintcloud.com/datasheets/2206-1201/en)

## Double-deck through terminals

Fifty distinct 2000-, 2002-, 2200- and 2202-series parts were verified
against their WAGO datasheets. The extractor checks that the printed clamping
totals agree with a reviewed connection diagram showing two isolated groups.
The native symbols expose two or four actual wire clamps per level. Filled
junction dots in the source drawings do not become wire terminals.

The batch preserves each exact PDF hash, circuit-diagram hash, rail
dimensions and the manufacturer potential marking when available. Five
candidates stay out of this batch because the source lacks a reviewed
diagram or shows or describes internal commoning. To review mixed inputs,
pass `--skip-unverified`; the tool reports rejected PDFs to standard error.
[Example source with two isolated levels](https://wago.priintcloud.com/datasheets/2202-2234/en)

## CAGE CLAMP rail terminal families

The 279, 280, 281, 282 and 285 series add 114 distinct through terminals
with dated and hashed exact datasheets. Definitions distinguish standard
CAGE CLAMP and POWER CAGE CLAMP. The sourced 285 rail-mount variants require
35 × 15 mm DIN rail. Part geometry uses the above-rail depth from the
physical-data table.

The source review held 33 candidates out of this batch. They lacked the
expected IEC nominal-rating data or body width, or used a different
mounting interface. The extractor reports these cases separately from
parts accepted into the editor.
[279-681 datasheet](https://wago.priintcloud.com/datasheets/279-681/en) ·
[285-635 datasheet](https://wago.priintcloud.com/datasheets/285-635/en)

## Through-hole PCB terminal blocks

The first 72 WAGO series 250 parts have a documented in-line solder-pin row.
Each schematic pole connects one wire clamp to one solder pin. Poles are
isolated from one another. The PCB footprint records the drill center and
diameter at each documented pitch from the first solder-pin center. The
linked mounting view uses the body projected onto the board and its height
above the board; solder-pin protrusion is recorded separately.

The extractor verified individual order codes, single-pole clamp-to-pin
relationships and the IEC/EN 60664-1 rating basis.
[WAGO 250-316 datasheet](https://wago.priintcloud.com/datasheets/250-316/en)

## Staggered PCB terminal footprints

Forty-six additional series 250 order codes use staggered through-hole pads.
The reviewed WAGO mechanical drawings identify the first pin at the front
right, show alternating rows 5 mm apart and dimension nominal pole pitch at
2.5 or 3.5 mm by exact part. The extractor requires the corresponding drawing
fingerprint and a matching pitch in the exact datasheet. The existing
Properties inspector lists the pad drill centers and hole diameters relative
to the first pin.
[3.5 mm pitch source](https://wago.priintcloud.com/datasheets/250-202/en) ·
[2.5 mm pitch source](https://wago.priintcloud.com/datasheets/250-402/en)

## Wire junctions during component edits

When a terminal moves, the editor checks its changed automatic route against
the other wires on the sheet. If the route changes a geometric junction, the
editor tries an alternate lane that preserves the previous contacts. Manual
bends and authored lanes keep their existing geometry rules. Electrical
checks remain available for drawings that require manual routing.
