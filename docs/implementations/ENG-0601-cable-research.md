# ENG-0601 physical cable selection — research in progress

Primary source checked 2026-11-15: https://www.lapp.com/en/be/oelflex-classic-110/p/1119504

Verified product identity: LAPP OLFLEX CLASSIC 110, article 1119504, 4G4, four 4 mm² cores including protective earth; numbered core identification, PVC, rated U0/U 300/500 V. Manufacturer describes fixed installation / occasional movement without tensile strain, dry or damp spaces. Candidate only, not yet selected into project/library. No installation-specific current capacity or bend radius verified from this page; do not invent these.

Implementation audit: existing model currently only uses conductorColor on selected native wires. No cableId/coreNumber/cableType/crossSection fields found in engine. Physical cables need a native persisted assignment model, editable through existing wire Properties, source-backed immutable product definitions and instance route/length/core mappings. Do not merely add cable labels to text reports or interpret PE rail paths as cable cores.

Next decision: model W2 panel-to-field-isolator and W3 isolator-to-motor as distinct physical cables. Current continuous PE path must gain explicit field PE termination/bypass details matching chosen housing before assigning two cable PE cores. Keep electrical continuity and stable identities while adding physical interfaces. Select field isolator enclosure, PE termination and glands together; verify cable terminal cross-section compatibility. Educational route lengths/environment must be labelled assumptions. Calculate voltage drop, overload/short-circuit protection and fault-loop limits before calling selection complete.
