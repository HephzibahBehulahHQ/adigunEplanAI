# Native project model — schema version 1

packages/electrical-model/project.ts defines the project envelope and strict bounded schemas for every Part 5.1 entity family. Stable IDs connect engineering entities. Wire paths are separate from physical wire endpoints; changing graphical path points does not change terminal connectivity. Values use explicit millimetre, metre, volt and square-millimetre fields. Manufacturer source links accept HTTP(S) only. These schemas describe data; they do not claim circuit simulation, calculation or manufacturer certification.

Validation rejects unknown fields, duplicate entity IDs/device references, dangling references, mismatched symbol/terminal/pin mappings, duplicate reference lists, self-connected wires, wire-path page mismatches, nonfinite dimensions, invalid timestamps and out-of-range/duplicate PLC channel addresses. Geometry and electrical-semantic algorithms are later domain milestones.

Version 1 is the first product format. The development version-0 envelope consists of the same header with optional collections; migration fills missing collections and retains existing fields for strict validation. Unknown future versions are rejected. No proprietary ECAD format compatibility is implied.

The browser library uses one atomic localStorage value under adiguneplanai.projects.v1, containing version 1, project documents and the active project ID. Limits: 5 MiB per import/library and 100 local projects. Quota failure preserves the previous saved value and current in-memory editable project; export remains available. Corrupt storage is preserved, can be downloaded as recovery data and can only be reset after explicit confirmation. No automatic overwrite occurs on load failure. Cloud persistence belongs to Milestone 12.

Undo/redo uses validated, isolated native document snapshots, at most 50 history entries and approximately 20 MiB of serialized UTF-8 history. New edits clear redo; invalid edits leave history unchanged. Browser reload restores saved documents, not the transient undo stack. Each local project has its own in-session history.

Schema version 2 adds explicit page-owned graphical layers, groups, annotations, glyph dimensions and mirror state. Version-1 migration derives initial layers and normalizes wire route endpoints to the same native pin anchors while preserving electrical IDs. Shared coordinate transforms live in packages/engineering-core. Valid persisted paths must meet their referenced pins. Native paper dimensions are bounded to 32–2000 mm per axis.
