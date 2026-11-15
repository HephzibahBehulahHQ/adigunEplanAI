# ENG-0601 native feeder integration

Adds A2/013 Motor feeder short-circuit protection to the same native project. X1 phase terminals feed F1 through three paired continuations; F1 outputs feed K1 through three further pairs. Every connection binds to manufacturer terminal IDs, and existing sheet IDs remain stable. There are 14 authored sheets, 26 continuation pairs and 71 wires. A3/A4 remain incomplete.

New example copies use F1 Siemens 3RV2321-4BC10, K1 3RT2027-2KB40 and F2 3RU2126-4BB0. F2 has an explicitly educational 15.2 A instance setting; manufacturer limits stay 14–20 A. Existing saved projects are not migrated or overwritten. The 24 V contactor retains the verified 4.5 W coil demand, so the documented auxiliary load budget is unchanged.

Selection evidence: Siemens configuration manual A8E56203880102A/RS-AB/006, 09/2017, 400 V Class 10 type-2 table page 34 and notes page 35. The selected family row allows IE3/IE4 settings 14–17 A. Other control voltages and spring terminals are permitted; assembled triple combinations are prohibited. The older 16 A combination's IE3/IE4 maximum setting of 14 A does not cover the example motor's 15.2 A. Exact component sources and immutable ratings are in the library and ENG-0601-feeder-research.md.

F1 is magnetic-only, not overload protection and not the common installation main isolator. Individual Icu/Ics values do not establish a system short-circuit rating. Site fault level, upstream isolation including auxiliary supply, cable/disconnection/thermal checks, complete bonding, physical mounting and commissioning remain unresolved. No installation approval or physical test result is claimed.

Validation: 29 focused engine tests passed. They verify distinct upstream/downstream phase nets, native terminal mapping, stable continuations after moving/rotating F1, save/reopen, immutable example sources and legacy contactor replacement. Browser regression follows a feeder continuation in each direction and captures feeder and power sheets. Full checks and rendered layout review pending. The approved stylesheet and interface structure are unchanged.
