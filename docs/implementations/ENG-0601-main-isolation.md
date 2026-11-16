# ENG-0601 common supply isolation — design record

Publication checkpoint: PR #93, branch `codex/pump-common-isolation`, head `8e520364ba96f8be8e8a5604f695315317fcd618`. CI runs 43677510737 and 43677489248 observed in progress. Local full check passed (389 tests). Browser test now checks eight visible Q1 terminal markers, two N labels, five continuation graphics and ISO-N navigation; power-sheet continuation count is 16. Review CI screenshots before merging. No deployment of this increment yet.

Status: native component and A2/014 integrated locally; not deployed. Preserve PR #92's native documents and the fixed interface.

Integration checkpoint: 15 authored sheets, 31 paired continuations, 81 wires and 27 global nets. Q1 L1 feeds both F1's upstream interface and F3's auxiliary input; Q1 N feeds only PS1 through X4:N. Neutral remains separate from PE and DC return. Five new paired links preserve existing sheet IDs. Thirty-one focused tests pass, including moved/rotated Q1 persistence and independent template copies. Browser expected sheet counts updated. Still required: rendered screenshot review of the new sheet and changed continuation positions, browser interaction coverage for Q1, reconcile remaining A1/device/assumption prose, full check, exact-head CI, merge and deployment. Supply boundary inputs are explicitly external; upstream site protection and neutral sequencing remain unresolved. Do not claim a completed project.

Local implementation: `siemens-3ld2244-1tl51` is registered in the existing component library. The existing disconnector renderer now derives pole positions from native pins, retaining the original three-pole positions and supporting four poles. Both runtime mirrors are synchronized. Thirty focused engineering tests pass, including eight distinct IDs, separate neutral endpoints with identical N labels, no PE pole/internal shorts, immutable source definitions and rotated editable-instance persistence. A2/014 integration and browser visual verification remain outstanding; do not publish this as a completed supply design.

## Candidate and verified identity

Q1 candidate: Siemens SENTRON 3LD2244-1TL51. The manufacturer's exact-part datasheet identifies four poles, 32 A uninterrupted current, floor mounting with door coupling, black rotary handle and 22.5 mm central handle mounting. This is a panel assembly, not a complete external enclosure.

Primary source: [Siemens exact-part datasheet](https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3LD22441TL51), dated 2026-11-10, pages 1 and 5, checked 2026-11-15. Direct retrieval returned HTTP 403 on recheck; indexed manufacturer page text exposed the identification and terminal diagram. Do not treat distributor descriptions as authority for emergency-stop capability.

The terminal diagram identifies phase pairs 1L1–2T1, 3L2–4T2, 5L3–6T3 and a mechanically coupled N–N pole. Native neutral endpoints must have distinct stable IDs (`line-n`, `load-n`) while both displayed manufacturer terminal labels remain `N`. Do not invent numbered neutral terminals. PE is never routed through Q1. No closed-switch internal net merge or switching simulation is implied.

Neutral early-make/late-break timing remains unverified for this exact assembly. Do not infer timing from the neutral drawing or a separately listed accessory. Confirm it from applicable manufacturer instructions before describing the sequence as verified. The headline power figure must not replace utilization-category current checks.

## Required integration

- Add the exact native part to the existing library, preserving immutable sources and editable instance properties. Generalize the existing disconnector artwork by explicit terminal pairs; do not draw an eight-terminal component with a three-pole renderer.
- Add A2/014 in the same project. Preserve all earlier sheet identities and all user-saved projects.
- Declare one educational 400/230 V L1/L2/L3/N/PE supply boundary. Route L1/L2/L3/N through Q1; keep PE continuously bonded.
- Feed the existing X1/F1 motor branch from Q1 phase outputs. Feed X4:L/F3 from the isolated L1 distribution and X4:N from the isolated neutral. Remove the contradictory independent auxiliary-feed assumption in new example copies.
- Use terminal-bound native wires and paired stable cross-sheet references. Distinguish distribution junctions from crossing wires. Keep source-side live terminals explicitly identified when Q1 is OFF.
- Verify utilization category, combined phase loading, upstream protective coordination and conductor design separately. Do not promote a conditional withstand figure into a system short-circuit rating.
- Update the A1 register, device information and design basis together. A3 must depict the body, shaft and door handle appropriately; overall shaft depth is not a mounting-plate body footprint.

## Acceptance checks still required

Eight unique endpoints with the correct displayed labels; no PE switching; separate incoming/outgoing nets; continuity of each isolated output to its intended load; stable neutral identity after move/rotate/rename/save/reopen; compatible replacement behavior; visible terminal markers and nonoverlapping labels; unchanged stylesheet and interface structure. Run native tests, browser workflow and screenshot review before merge/deployment. This record is not installation approval.

CI review checkpoint: original browser run passed 16/17; only stylesheet checksum failed due to CRLF conversion. Restored LF without changing CSS. Local checksum equals e74748cfcb584a2be56e86f0aa52d959947718daf9ed4caaf773191ebfd96b29. Corrected-head runs 43677659888 / 43677656272 active. Visually reviewed CI main-isolation and power screenshots in work/main-supply-review; eight terminals and five separate continuation routes visible, no observed new overlaps. No merge yet.

PR #93 merged as 7024e5b12a7f210a1a0bf0ad55462997765b0c9e after corrected-head CI 43677659888 and 43677656272 both succeeded. Main deployment/live verification still pending.

LIVE VERIFIED: build-info sourceCommit 7024e5b12a7f210a1a0bf0ad55462997765b0c9e. Empty startup confirmed; fresh named example contains A2/014 with eight terminal markers and five continuation graphics. ISO-N opens A2/010 X4:N. Screenshot work/live-main-isolation.png. Remaining project scope: field terminals/cables, full bonding and design checks, coordinated A3 layouts and A4 reports.
