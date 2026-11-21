# ENG-0601 F2 physical mounting research

## Evidence for the current F2 decision

The [Siemens 07/2024 equipment manual](https://support.industry.siemens.com/cs/attachments/60298164/manual_SIRIUS_overload_relay_3RU_3RB_en-US.pdf?download=true)
distinguishes three different envelopes. Figure C-5 shows the contactor-mounted
3RU2126-..B0 arrangement. Figure C-6 shows the 45 × 97 mm installed front
envelope for 3RU2126-4.B1. Figure C-55 shows the 45 × 97.1 mm front envelope
and mounting hole pattern for the 3RU2926-3AA01 support itself.

The [Siemens-hosted UL certificate](https://cache.industry.siemens.com/dl/files/299/40223299/att_1326996/v1/3RU2126_CoC_202505131337157102.pdf)
identifies 3RU2926-3AA01 as a stand-alone connecting kit for the covered
3RU2126 series. The [exact F2 product record](https://sieportal.siemens.com/en-be/products-services/detail/3RU21264BB0)
identifies 3RU2126-4BB0 as the contactor-mounting order code.

These sources establish a support option and its own footprint. The complete
installed envelope for the selected 3RU2126-4BB0 with that support still needs
an exact assembly drawing or measurement. Confirm the selected separately
wired arrangement against Siemens' starter coordination conditions before
using the planned arrangement for release. Keep F2 in the native circuit and
defer its mounting footprint and drill coordinates until those checks have
evidence.

Primary source: https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RU2126-4BB0

Indexed Siemens datasheet, printed page 2/5, dated 2026-01-27, inspected 2026-11-15: 3RU2126-4BB0 body height 85 mm, width 45 mm, depth 85 mm. Fastening method is contactor mounting. The mounting-position text distinguishes contactor-mounted and stand-alone installation; this alone does not identify or verify a stand-alone terminal/mounting accessory.

Do not draw F2 as independently rail-mounted without selecting and verifying the required mounting accessory. Do not sum K1 and F2 bounding-box heights to invent an assembled dimension. Need a manufacturer assembly drawing or a documented separate-mounting arrangement consistent with the selected feeder coordination. Earlier feeder research says assembled triple combination is prohibited for the selected coordination; distinguish that restriction from allowable contactor/overload pairing before placing components.

No F2 footprint or assembly geometry has been added from this research yet. Third-party listings disagree on dimensions; the exact-part Siemens source governs. Clearance categories require direct verification for the selected arrangement.

## Separate-mounting candidate found — 2026-11-15

Siemens identifies 3RU2926-3AA01 as the S0 screw-terminal support for stand-alone assembly, compatible with 3RU21 family. Official product entry states screw/snap mounting on 35 mm DIN rail:
https://simplicityhub.siemens.com/my/en/products/generic-stand-alone-assembly-support-for-3ru213rb303rb313rr2-size-s0-stand-alone-prod0000101469

The 07/2024 equipment manual A5E03656507420A/RS-AF/007, section 11.2, provides the terminal-support procedure; inspect the exact 3RU subsection and dimensional drawing before implementing the assembly. Indexed page 153 text also discusses 3RB variants, so do not blindly apply its torque values to 3RU:
https://support.industry.siemens.com/cs/attachments/60298164/manual_SIRIUS_overload_relay_3RU_3RB_en-US.pdf?download=true

Candidate only: no accessory library entry, terminal mapping, assembly dimensions or design selection has been committed yet. This route could permit a documented separately wired F2 layout while avoiding an invented direct-mount assembly with K1. Coordination/terminal compatibility still requires verification.

## Archived manual verified locally — mounting decision

Downloaded the Siemens-hosted 09/2014 manual A5E03656507420A/RS-AA/002:
https://cache.industry.siemens.com/dl/files/164/60298164/att_95533/v1/manual_overload_relay_3RU2_3RB3_en-US.pdf
Local source: work/siemens-overload-manual-2014.pdf. The current 07/2024 manual endpoint returned access denied; do not label the archived evidence as current.

Section 10.2, printed page 84, explicitly permits 3RU21 individual installation using the appropriate S0 terminal support, snapped on 35 mm DIN rail or screw-mounted. Table 10-1 describes inserting the S0 screw-terminal relay from below and tightening the contacts. Page 109 confirms separate mounting with terminal support. This supports selecting the separately wired support arrangement for F2; keep K1 and F2 separate rather than inventing a direct-mounted combined envelope.

Visually inspected page 153 (work/overload-drawing-153.png). Figure C-6 labels the standalone 3RU2126-4.B1 assembly, front envelope W45 H97 mm. The side drawing includes separate 5 mm, 90 mm and 62 mm dimensions; preserve their reference planes before encoding depth. Figure C-5 is the contactor-mounted arrangement (H152) and must not be substituted for the standalone arrangement or automatically assigned to the selected spring-terminal K1.

Next implementation: add 3RU2926-3AA01 as a source-backed accessory in the existing library/BOM, associate it with F2 via a stable assembly relation, and model the verified front envelope without duplicating F2's electrical identity. Accessory screw connections must be represented honestly; do not fabricate terminal numbers from a mechanical illustration. Verify the assembly's external terminal mapping and mounting orientation before wiring/placement claims. Current-release verification remains required for installation.
