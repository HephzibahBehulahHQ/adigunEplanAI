# ENG-0601 — native indication circuit increment

Status: local implementation; release checks pending. The overall project is not complete: A3/A4 and remaining coordinated design documentation are still outstanding.

Adds A2/011 with native editable H1/H2 instances, four terminal-based cross-sheet connections and a shared return wire. No interface CSS/layout changes.

## Manufacturer evidence

- Schneider Electric XB5AVB3 green pilot light: https://cdn-reichelt.de/documents/datenblatt/C300/XB5AVB3_DB-EN.pdf (4 October 2022, page 1).
- Schneider Electric XB5AVB4 red pilot light: https://www.mouser.com/datasheet/2/357/Schneider-Electric-1565323.pdf (undated manufacturer product sheet, page 1).

Each exact datasheet identifies X1/X2, 24 V AC/DC, 18 mA and the corresponding lens colour. Definitions retain those immutable specifications; editable instance legend, position, marking, comment and drawing stroke are separate. The nominal 22 mm mounting description is not a finished panel cut-out tolerance. Installation drawings remain required for that detail.

## Circuit meaning and limits

H1 is parallel to K1's coil command and return. It indicates coil voltage, not actual contact closure, motor rotation, flow or safe isolation. H2 is fed through F2's distinct 97/98 overload auxiliary contact from the protected control supply. Loss of supply can extinguish H2; a dark lamp does not demonstrate absence of a trip. The application does not simulate lamp illumination or auxiliary-contact actuation.

Conservative nominal load bookkeeping: 0.1875 A K1 coil + two 0.018 A lamps + 0.012 A protector self-consumption = 0.2355 A. This is not a cable, transient, short-circuit or protective-coordination calculation and does not establish installation approval.

## Native editing verification

Regression checks cover distinct coil/trip/supply/return nets, component movement and rotation with attachment synchronization, legend/stroke edits, serialization/reopening and same-terminal green-to-red part replacement. The untouched factory creates a fresh green H1 with its original legend. Manufacturer lens colour changes only by replacing the actual part, never by changing the drawing stroke.

12 authored sheets, 20 cross-sheet links and 62 wires; future sheets remain uncreated rather than empty placeholders.
