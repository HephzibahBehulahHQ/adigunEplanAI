# ENG-0601 — feeder research handoff (2026-11-15)

Not implemented or selected for installation. Current native project still lacks the complete main supply/protection design.

## Verified table evidence

Siemens "Configuring the SIRIUS modular system", 09/2017, A8E56203880102A/RS-AB/007, section 3.3, printed/PDF page 35: the 3RU2126-4A.. (11–16 A) + 3RT2026.. row gives 16 A AC-3 at 400 V and 500 V, no 690 V assignment. Fuse columns: gG type 1 = 100 A, type 2 = 35 A; aM type 1 = 35 A, type 2 = 20 A. This is a manufacturer coordination-table assignment, not evidence of the site's fault current or installation approval. Page 42 notes require accounting for operating voltage and refer to IEC 60947-4-1.

Source: https://cache.industry.siemens.com/dl/files/188/39714188/att_1352989/v1/manual_load_feeder_configuration_en-US_202512191455324495.pdf

Local evidence: work/siemens-load-feeder.pdf and rendered pages work/siemens-coordination-p35.png and work/siemens-coordination-p42.png. Inspected visually. No need to repeat download.

## Candidate route and exclusions

- 35 A gG fused feeder is a researched route for the existing K1/F2 family; exact fuse, carrier, accessories, terminal assignments, main isolator, cable sizing and fault/disconnection conditions are not yet selected.
- Siemens 5SG7133 is a 63 A, 400 V, D02 three-pole switch disconnector without sleeves or links. Do not treat its bare carrier as a fitted 35 A protective device.
- The pre-equipped 5SG7133-8BA35 appears in Siemens LV10 with an Austria-only variant footnote. Do not silently use it for this example's Germany design basis.
- A 3RV2321-4AC10 alternative was researched but its exact combination with the existing 3RT2026-2KB40 and 3RU2126-4AB0 has not been verified. Nearby/star-delta/other-contactor tables are not sufficient evidence.
- Current auxiliary 230 V supply is a separate declared boundary. A future common main isolator must explicitly account for that supply and neutral; do not imply that opening a three-phase motor isolator isolates an independent auxiliary input.
- A3/A4 are still empty. Current twelve-sheet numbering differs from the catalogue's planned thirty-sheet register; reconcile the final document structure with stable IDs rather than duplicating already-authored circuit content.

Additional primary sources:
https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=5SG7133
https://cache.industry.siemens.com/dl/files/641/109750641/att_1134482/v1/07_FuseSystems_LV10_102022_EN_202303231220115440.pdf?download=true
https://cache.industry.siemens.com/dl/files/810/45314810/att_871018/v1/MAN_L1V30836901A-01_en_en-US.pdf

Browser control timed out this turn; live visual review of the indication release remains pending. User's screenshots confirm the same auxiliary circuit with the Properties inspector closed versus open, and reveal long tab-label overflow. PR #89 addresses that overflow without changing the approved stylesheet or tab dimensions.

## Tab overflow release

PR #89 merged as 5c36248eae71aa3455d726f6318cee28e9dce3f0. Premerge CI 43670083286 / 43670080120 passed with 383 tests and 16 browser tests against each development/production build. Regression opens six named sheets and proves title/close-button containment with the existing 27 px tab height. Existing stylesheet unchanged. Pages deployment 43670212287 succeeded; live build-info matched the merge commit. Main CI 43670212290 must be checked if not yet recorded as successful in the next handoff. Live browser inspection remains unavailable; do not claim manual visual review.

Owner screenshot question answered: both screenshots contain the same auxiliary circuit; the earlier verification screenshot has Properties open, the owner's has it closed and includes the newer indication sheet. There is no withheld more-detailed native project version behind that difference.
