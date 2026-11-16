# ENG-0601 — feeder research handoff (2026-11-15)

## Current decision evidence — fuseless route

The 16 A breaker combination must not be selected merely because its overload relay dial reaches 16 A. Siemens configuration manual A8E56203880102A/RS-AB/006 (09/2017), 400 V Class 10 tables, pages 31 and 34, limits the corresponding IE3/IE4 setting to 14 A. The example motor's 15.2 A exceeds that limit.

Page 34 lists a type-2 candidate: 3RV2321-4BC10 + 3RT2027-1AP00 + 3RU2126-4BB0, with IE3/IE4 setting range 14–17 A. Page 35 permits other control voltages and spring terminals, but prohibits assembled combinations of three. Preserve this mounting constraint in A3. Proposed 24 V DC spring-terminal contactor variant: 3RT2027-2KB40. This remains a candidate pending complete installation design; do not change existing user instances or manufacturer records.

Manual source: https://cache.industry.siemens.com/dl/files/188/39714188/att_1317160/v1/manual_load_feeder_configuration_en-US.pdf?download=true

Already inspected local evidence: work/siemens-full-feeder.pdf; work/siemens-feeder-table-031.png; work/siemens-feeder-details-034.png; work/siemens-feeder-details-035.png.

Exact part evidence retrieved 2026-11-15:

- Siemens 3RT2027-2KB40 data sheet dated 2021-01-21: 32 A AC-3 at 400 V, 15 kW, 24 V DC, 1 NO + 1 NC, spring terminals, S0; coil closing and holding power each 4.5 W. Manufacturer-authored PDF mirror: https://media.distributordatasolutions.com/siemenscomplete/2021q1/documents/140fbadef58253c91d9bfa905f73b01c016bbca8.pdf
- Siemens 3RU2126-4BB0 data sheet dated 2026-01-27: thermal overload, 14–20 A, Class 10, S0, screw terminals, contactor mounting, manual/automatic reset. https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RU2126-4BB0
- Siemens 3RV2321-4BC10 data sheet dated 2026-11-12: 20 A starter-combination breaker, magnetic instantaneous release 260 A; explicitly NO thermal overload protection. At 400 V, Icu 55 kA and Ics 25 kA. No built-in auxiliary contacts. Main terminals 1/L1–2/T1, 3/L2–4/T2, 5/L3–6/T3. https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2321-4BC10

Do not copy thermal-overload instance settings into this magnetic-only breaker. Do not equate the manual table's conditional combination rating with the individual breaker's Icu or the installation's prospective fault current. Resolve the table rating conditions before asserting a system short-circuit rating. Add the three exact parts as separate immutable library definitions; then update only newly generated example copies, coordinated device reports and references. Existing saved projects must retain their parts and settings.

Remaining implementation: verified symbols/terminal mappings, feeder topology and source assumptions, shared isolation including auxiliary supply, cable/disconnection checks, then coordinated A3/A4. No new parts or feeder drawing have been deployed by this research note.

Release-state correction: PR #90 subsequently deployed 13 native sheets and completed live review of the sequence and separated pilot labels. Historical pending-review statements below describe earlier turns, not the current release.

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

Native implementation progress: added siemens-3ru2126-4bb0 as a separate library definition using the verified S0 terminal diagram, 14–20 A setting limits and source provenance. Original 11–16 A definition remains unchanged. Mirrored runtime files updated. All 26 engineering-workflow tests pass, including out-of-range rejection and native persistence. Full npm check running in exec session 42078; latest stage lint. Not merged/deployed; remaining two feeder parts and circuit integration still pending.

Next native increment: added siemens-3rv2321-4bc10 magnetic-only definition, six verified main terminals, 260 A release, separate 400 V Icu/Ics values, no thermal setting or assumed internal continuity. Existing Properties and schematic renderer support its family without stylesheet changes. All 27 focused tests pass. Previous overload-only full npm check passed (session 42078 complete). New full check is running in session 32935, log work/feeder-breaker-check.log. No merge/deployment yet; add contactor and coordinated circuit before release, with browser coverage for both new component families.

PR #91 opened at head 037d1ef0ea65e32f0b41bf08f96834ae732c0de2. All three native parts and browser regression are included; example topology unchanged. 28 targeted tests pass. Original stylesheet matches main byte-for-byte. Local browser failure is missing sandbox Chromium executable, not a functional assertion; use active CI 43673415106 / 43673412570. Final local full check hit transient test-results deletion during concurrent Playwright startup; previous breaker/overload full check passed. Await CI before merge. Exact contactor terminal drawing cached/rendered in work/siemens-3rt2027.pdf and work/siemens-3rt2027-circuit.png, inspected page 8.

SHIPPED: PR #91 merged as 72a8329dad5d849952274dfd028289c6a18ad11d. Final-head CI 43673960409 / 43673957030 passed: 386 unit/tooling tests, 17 browser tests on both development and production builds. Browser test now closes the existing inspector before placement (no UI change). Live build-info matches the merge; all three new parts visibly present in existing Electrical / Symbol Library. Screenshot work/live-feeder-library.png. Postmerge CI 43674145806 and Pages 43674145785 should be recorded after terminal success. Goal remains active: integrate coordinated feeder and finish A3/A4; example topology is unchanged by this library release.
Postmerge CI 43674145806 and Pages 43674145785 both completed successfully. Live browser verification complete; no further release checks needed for PR #91.
