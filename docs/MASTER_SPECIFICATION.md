# ACTIVE OWNER PRIORITY — 2026-11-12: UI-001 PROJECT A → PROJECT B INTERFACE FIRST

> **BINDING CURRENT MILESTONE:** First transform the **AdigunEplanAI (Project A)** application interface into the approved **AdigunAiAutoCad (Project B)** compact CAD workstation appearance. The owner specifically wants the **EXACT PROJECT B INTERFACE ARCHITECTURE**, not a merely similar, redesigned, or generic substitute. The only differences should be Project A branding and real internal engineering features.
>
> **WRITABLE TARGET: Project A ONLY:** https://github.com/HephzibahBehulahHQ/adigunEplanAI
>
> **READ-ONLY REFERENCE: Project B:** https://github.com/HephzibahBehulahHQ/AdigunAiAutoCad — **NEVER MODIFY PROJECT B** (no writes, PRs, commits, releases or configuration edits).
>
> **FULL EXECUTION SPECIFICATION AND NEXT-AGENT HANDOFF:** [docs/PROJECT_B_INTERFACE_TRANSFORMATION.md](docs/PROJECT_B_INTERFACE_TRANSFORMATION.md). Read this **before** continuing any development. Use Project B's actual `index.html`, master pursuing-goal specification and approved reference screenshots as the exact UI source; rebuild its compact layout in Project A's existing React/TypeScript/Vite architecture without replacing the electrical model or copying Project B's simplified CAD engine.
>
> **FIRST-DELIVERY CONTENT:** compact navy header and native document tabs; light compact icon toolbar; narrow left/right navigation icon rails; Project B-style floating menus and panels; full-size white editable native electrical drawing canvas; thin status rail; zero dropdown-caused layout shifts; existing engineering commands preserved and accessible.
>
> **ORDER:** inspect Project A and read Project B → protect current engineering functionality → build Project B visual shell in Project A → validate with screenshots and browser/engineering regression tests → commit and PR → merge only after required checks/approvals → deploy Project A and verify live UI → **STOP for explicit owner visual review**. Do not begin new electrical, PLC, building, panel, AI or 500-example engineering development during UI-001.
>
> **CONTINUATION STATE:** A Project A-only draft PR #39 exists on branch `codex/project-b-interface-first` with an initial, unapproved shell implementation. This is work in progress, not merged or deployed. Verify the latest CI logs, fix issues, test visual equivalence, and preserve existing services. All original scope and remaining milestones below are retained, not deleted.
>
> **SUPERSESSION RULE:** Earlier references to an EPLAN-like screenshot or a large expanded engineering ribbon are superseded **only for interface composition and styling**. The engineering specifications in Parts 1–27, legal/safety constraints, enterprise branding, persistence, native editing, test criteria and later milestones remain binding.
>
> **AGENT HOLD POINT:** Once the interface is genuinely merged, deployed and verified, report live URL, screenshots and CI evidence, then STOP until the user explicitly approves the visual result. Do not skip this hold point.

---

# ADIGUNEPLANAI
## OFFICIAL CODEX MASTER ENGINEERING AND IMPLEMENTATION SPECIFICATION
### Hephzibah Behulah → HB Elektroniker → AdigunEplanAI

**Project:** AdigunEplanAI  
**Product category:** Professional AI-assisted Electrical Computer-Aided Design (ECAD), Building Electrical Design, Industrial Automation and 3D Panel Engineering  
**Owner:** Hephzibah Behulah  
**Division:** HB Elektroniker  
**Development repository:** https://github.com/HephzibahBehulahHQ/adigunEplanAI  
**Development method:** Incremental, test-driven, production-oriented engineering  
**Target platforms:** Modern web browsers, installable PWA, and optional desktop application  
**Mandatory languages:** English, German, Yoruba and Nigerian Pidgin

---

# PART 1 — YOUR MISSION

You are Codex, acting as a multidisciplinary engineering software development team consisting of:

- Senior full-stack software architect
- Professional electrical engineer
- Industrial automation engineer
- Building electrical installation designer
- Electrical CAD and schematic software developer
- 3D mechanical and electrical enclosure designer
- Numerical computation engineer
- AI engineering and tool-integration specialist
- Cybersecurity engineer
- Database and cloud infrastructure engineer
- UI/UX designer
- Automated testing and quality assurance engineer
- Technical documentation and internationalization specialist

Your mission is to design, implement, test, document, and prepare AdigunEplanAI for deployment as an independent professional electrical engineering application.

The supplied EPLAN Electric P8 screenshot is the functional and visual workspace reference.

Build a similarly capable class of engineering workspace, with its own implementation, design system, data models, and user experience.

Do not copy proprietary source code, artwork, trademarks, licensed symbol libraries, protected assets, or undocumented proprietary formats.

The final application must contain real engineering features. No decorative-only engineering controls, fake simulations, fabricated calculations, misleading exports, or unverified project examples.

No software agent can guarantee zero defects. Instead, implement measurable acceptance criteria, automated tests, regression checks, engineering verification, and release gates.

---

# PART 2 — MANDATORY GITHUB REPOSITORIES

Inspect these repositories before implementing the application.

## A. Corporate repository

https://github.com/HephzibahBehulahHQ/HephzibahBehulahHQ.github.io

Use as the authority for corporate identity, ownership, brand philosophy, website links, and organizational hierarchy.

## B. HB Elektroniker repository

https://github.com/HephzibahBehulahHQ/hb-elektroniker

Use as the authority for the electrical engineering division, its approved accent color, technical mission, and engineering-product positioning.

## C. Corporate design system

https://github.com/HephzibahBehulahHQ/hb-design-system

Read and apply:

- AGENTS.md
- README.md
- README_AI.md
- SYSTEM_PROMPT.md
- tokens/corporate.json
- tokens/brands.json
- docs/brand-and-product-naming.md
- templates/universal-product/README.md
- templates/universal-product/product.config.json

The universal product configuration currently contains AdigunSPs-specific values. Adapt those values for AdigunEplanAI. Do not blindly inherit the old product name, repository, or PLC-specific requirements.

## D. Product repository

https://github.com/HephzibahBehulahHQ/adigunEplanAI

This is the exclusive destination for AdigunEplanAI application code, tests, assets, documentation, engineering libraries, and deployment workflows.

Do not develop this application inside the corporate website, division, or shared design-system repositories.

Inspect local uncommitted files and Git history before making changes.

Create an appropriate feature/development branch. Do not overwrite existing work or force-push.

---

# PART 3 — CORPORATE IDENTITY

Apply the following approved design tokens.

| Token | Color |
|---|---|
| Midnight Navy | #0B1220 |
| Royal Blue | #2563EB |
| Metallic Gold | #D4AF37 |
| Ivory White | #F8FAFC |
| HB Elektroniker accent | #22D3EE |

Use the actual shared tokens as the source of truth.

## Logo rules

Use exactly one verified official Hephzibah Behulah corporate logo in the primary application header.

The logo source must be checked against the design-system assets.

Display the product name as a text wordmark:

**AdigunEplanAI**

Show the division label:

**BY HB ELEKTRONIKER**

Do not add competing corporate, division, or product logos to the header.

Adigun BOT may have its own assistant icon, but it must not compete with the corporate logo.

## Themes

Implement functional light and dark themes.

The default engineering workspace may use a dark professional shell, but the schematic drawing sheet must support white, dark, and user-configurable backgrounds.

Maintain clear contrast for symbols, electrical conductors, selection handles, warnings, and annotations.

Theme changes must not modify engineering data.

## Localization

Provide complete UI dictionaries for:

- English — en
- German — de
- Yoruba — yo
- Nigerian Pidgin — pcm

Translate navigation, dialogs, tooltips, validation, notifications, project templates, user settings, and Adigun BOT controls.

Preserve standard electrical notation, units, IEC references, terminal numbers, manufacturer part numbers, and engineering symbols.

Allow project documentation to specify its own output language independently of the UI language.

Include missing-translation detection in CI.

---

# PART 4 — APPLICATION EXPERIENCE AND SCREENSHOT RECONSTRUCTION

Implement a professional multi-panel engineering workspace inspired by the supplied screenshot.

The interface must not be a static picture.

Every major panel must be interactive, resizable, keyboard-accessible where practical, and connected to the same underlying project data.

## 4.1 Main layout

Build the following workspace arrangement:

### A. Top application title bar

Display:

- Corporate logo
- AdigunEplanAI wordmark
- Current project name
- Save status
- Undo/redo status
- Workspace mode
- User profile
- Language selector
- Theme selector
- Settings
- Help

### B. Ribbon/menu toolbar

Provide functional menu categories:

File, Home, Insert, Edit, View, Project, Electrical, Connections, Components, Automation, PLC, Building Design, Power Engineering, 3D Panel, Documentation, Analysis, AI Tools, Tools, Settings and Help.

Each menu must contain relevant working commands.

Support compact ribbon and classic menu modes.

### C. Left project navigator

Create a hierarchical project explorer with expandable nodes.

Include:

- Project root
- Project properties
- Locations and structures
- Buildings and floors
- Rooms and distribution zones
- Electrical drawing pages
- Single-line diagrams
- Multiline schematics
- Installation plans
- Functional diagrams
- PLC diagrams
- Terminal strips
- Cable schedules
- Devices and equipment
- Panel layouts
- 3D enclosures
- Reports
- Revision history
- Project templates

Provide search, filtering, drag-and-drop ordering, context menus, multi-selection, renaming, duplication, and deletion with undo.

Use stable internal IDs instead of relying on display names.

### D. Central electrical schematic workspace

This is the primary engineering editor.

Implement:

- Infinite or bounded engineering canvas
- Configurable sheet sizes
- A4, A3, A2, A1 and A0
- Portrait and landscape orientation
- Zoom, pan and fit-to-page
- Configurable grid and snapping
- Object alignment
- Layer management
- Symbol placement
- Electrical connection routing
- Wire junctions
- Net labels
- Terminal assignment
- Object rotation and mirroring
- Copy, paste, duplicate and delete
- Grouping and ungrouping
- Multi-object selection
- Contextual property editing
- Cross-references
- Drawing frames and title blocks
- Revision annotations
- Real-time validation indicators
- Keyboard shortcuts
- Undo and redo

Use a normalized engineering document model, not pixels as the source of truth.

### E. Right 3D engineering workspace

Create a synchronized 3D viewer for:

- Electrical cabinets
- Control panels
- Mounting plates
- DIN rails
- Terminal assemblies
- Electrical components
- Cable ducts
- Panel doors
- Cable entries
- Mechanical clearances
- Equipment mounting
- Device labels
- Panel wiring routes

Support orbit, zoom, pan, orthographic views, perspective views, section views, exploded views, object selection, dimension tools and visibility controls.

A component selected in the schematic must highlight the corresponding device in the 3D panel where a valid mapping exists.

### F. Bottom workspace

Provide:

- Properties inspector
- Engineering diagnostics
- Errors and warnings
- Build/validation results
- Project output
- Connection information
- Adigun BOT activity
- Calculation results
- Revision information

### G. Status bar

Show:

- Current project
- Drawing page
- Cursor coordinates
- Grid spacing
- Zoom percentage
- Selected object count
- Units
- Validation status
- Save status
- Connectivity status

## 4.2 Interface behavior

Panels must be dockable, collapsible, and resizable.

Persist layout preferences per user.

Support multiple drawing tabs and split-screen editing.

Prevent overlapping toolbars, clipped dialogs, inaccessible controls, and horizontal overflow at supported screen sizes.

For small screens, offer a simplified project viewer and editing mode. Do not pretend that a full desktop ECAD interface will be equally usable on a phone.

---

# PART 5 — ELECTRICAL SCHEMATIC ENGINE

Implement a real electrical CAD data model and editing engine.

## 5.1 Canonical project data

Define versioned schemas for:

- Project
- Document
- Drawing page
- Symbol definition
- Symbol instance
- Device
- Manufacturer part
- Electrical terminal
- Electrical pin
- Wire
- Net
- Cable
- Conductor
- Connection point
- Terminal strip
- PLC module
- PLC address
- Panel enclosure
- 3D equipment instance
- Building
- Floor
- Room
- Circuit
- Distribution board
- Calculation
- Report
- Revision
- Validation finding

Use stable IDs, schema validation, referential integrity and migration support.

Separate graphical representations from engineering meaning.

A wire drawn on screen must correspond to a real electrical connection object.

## 5.2 Electrical symbol library

Provide a searchable, categorized symbol library.

Support IEC-style symbols where legally and technically appropriate, with documented standards versions and original or appropriately licensed artwork.

Categories must include:

Power:
transformers, generators, UPS, inverters, rectifiers, converters, supplies, batteries, busbars, isolators and distribution devices.

Protection:
fuses, MCBs, MCCBs, RCDs, RCBOs, overload relays, motor-protection switches, surge protective devices and protection relays.

Switching:
contactors, relays, pushbuttons, selector switches, emergency stops, limit switches and auxiliary contacts.

Motors:
single-phase motors, three-phase motors, DC motors, servo motors, stepper motors and motor starters.

Automation:
PLC CPUs, digital I/O, analog I/O, remote I/O, communication modules, timers, counters, sensors and actuators.

Instrumentation:
voltmeters, ammeters, energy meters, transducers, temperature sensors, pressure sensors, flow sensors and measurement terminals.

Building installations:
sockets, switches, luminaires, emergency lights, detectors, distribution boards, junction boxes and protective devices.

Connections:
terminals, connectors, plugs, sockets, cable glands, shielding, grounding, bonding and cable assemblies.

Industrial controls:
VFDs, soft starters, safety relays, motor controllers, industrial networking devices and HMI interfaces.

Support custom symbols and manufacturer part mapping.

Every symbol must have appropriate connection points, properties, and validation metadata.

Do not assign invented ratings or manufacturer identities.

---

# PART 6 — WIRING, NETLISTS AND DEVICE CONNECTIONS

Implement an electrical connectivity engine.

Required features:

- Automatic connection-point snapping
- Orthogonal wire routing
- Manual wire routing
- Wire branch creation
- Junction detection
- Net connectivity graph
- Wire numbering
- Device tagging
- Terminal numbering
- Cable-core assignment
- Cable shielding representation
- Connection cross-references
- Wire color properties
- Conductor cross-section properties
- Wire-length estimates where geometry is available
- Source/destination reporting
- Open-connection detection
- Duplicate reference detection
- Invalid connection detection
- Terminal capacity checks where rated data exists

Generate netlists from the canonical model.

Do not infer connectivity merely because two lines visually cross.

Implement explicit junction semantics.

Support automatic renumbering with preview and undo.

---

# PART 7 — BUILDING ELECTRICAL AND ARCHITECTURAL DESIGN

AdigunEplanAI must support electrical design within architectural floor plans.

## 7.1 Building structure

Implement:

- Building creation
- Floor creation
- Room definition
- Room names and dimensions
- Electrical zones
- Distribution zones
- Building levels
- Drawing scales
- Layer management
- Dimension annotations
- Room-based equipment schedules

## 7.2 Architectural drawing tools

Support:

- Walls
- Doors
- Windows
- Room outlines
- Dimension lines
- Reference grids
- Equipment symbols
- Lighting fixtures
- Sockets
- Switches
- Distribution boards
- Cable routes
- Conduit routes
- Cable trays
- Electrical risers
- Earthing points
- Fire alarm devices
- Data and communication outlets

Use separate architectural and electrical layers.

Allow importing suitable floor-plan formats.

DXF and SVG import should preserve supported geometry, scale, units and layers. Unsupported objects must produce a clear report.

## 7.3 Building electrical design

Implement:

- Lighting circuit layout
- Socket circuit layout
- Distribution-board assignment
- Circuit grouping
- Connected load schedules
- Demand-factor calculations
- Single-line diagrams
- Circuit labeling
- Cable schedules
- Panel schedules
- Earthing and bonding documentation
- Emergency lighting layout
- Building riser diagrams
- Room-by-room equipment reports

Electrical code compliance must be jurisdiction-specific and explicitly versioned.

Provide German and IEC-oriented engineering profiles where legally supportable, without claiming universal compliance.

---

# PART 8 — ENGINEERING CALCULATION ENGINE

All engineering calculations must use documented formulas, correct units, explicit assumptions and automated reference tests.

## 8.1 Required calculators

Implement:

- Ohm's law
- AC and DC power
- Single-phase power
- Three-phase power
- Apparent power
- Reactive power
- Power factor
- Voltage drop
- Cable resistance
- Load current
- Circuit loading
- Transformer sizing estimates
- Motor full-load current estimates
- Motor starting current estimates
- Energy consumption
- Cable-loss calculations
- Short-circuit calculations within supported methods
- Protective-device coordination where verified data exists
- Cable sizing based on documented conditions
- Demand and diversity calculations
- Battery autonomy estimates
- UPS capacity estimates
- Generator sizing estimates
- Lighting load estimates
- Earthing calculations where supported by verified models

## 8.2 Calculation integrity

Each calculator must expose:

Inputs, units, formula or method, assumptions, calculation results, warnings, limitations, and reference standards.

Use a unit-aware numerical library.

Do not silently mix millimeters, meters, amperes, milliamperes, watts or kilowatts.

Never manufacture missing cable installation conditions, temperature coefficients, protective-device curves or fault-current data.

When required inputs are missing, ask for them or mark the result as an estimate.

Separate educational estimates from verified engineering design calculations.

Provide traceable calculation reports.

Safety-critical results must require professional review before real-world construction.

---

# PART 9 — 3D PANEL AND ENCLOSURE ENGINEERING

Build a functional 3D cabinet design subsystem.

## 9.1 Enclosure tools

Support:

- Cabinet creation
- Enclosure dimensions
- Mounting plates
- DIN rails
- Cable ducts
- Terminal rails
- Equipment mounting
- Device rotation
- Mounting-hole positions
- Clearance zones
- Cable entry positions
- Panel doors
- Internal compartments
- Equipment labels
- Device dimensions
- Mounting coordinates

## 9.2 Component geometry

Use verified dimensions where available.

Support STEP and other suitable licensed 3D assets through validated conversion/import workflows.

When a real manufacturer model is unavailable, provide a clearly labeled dimensionally accurate generic representation only if sufficient verified dimensional data exists.

Do not claim a generic model is an authentic manufacturer CAD model.

## 9.3 Engineering checks

Implement:

- Component collision detection
- Enclosure boundary detection
- Mounting clearance checks
- Rail placement validation
- Cable duct occupancy estimates
- Device mounting compatibility
- Panel space utilization
- Equipment accessibility checks where rules are defined
- Heat dissipation estimates using documented assumptions
- 2D/3D device synchronization

## 9.4 Outputs

Generate:

- Panel layout drawings
- Equipment placement lists
- Cabinet BOM
- Mounting coordinates
- Selected 3D exports
- Dimension reports
- Collision reports
- Panel assembly documentation

---

# PART 10 — INDUSTRIAL AUTOMATION AND PLC DESIGN

Implement electrical documentation for PLC and industrial control systems.

Required features:

- PLC device catalog
- CPU and module definitions
- Digital inputs
- Digital outputs
- Analog inputs
- Analog outputs
- PLC address assignment
- PLC terminal mapping
- Sensor wiring
- Actuator wiring
- Relay wiring
- Motor-control circuits
- Interlocking documentation
- Emergency-stop circuit documentation
- Safety component identification
- I/O lists
- PLC wiring schedules
- Cross-references between PLC addresses and electrical devices

Support IEC 61131-3-oriented naming and data structures where applicable.

Actual PLC code generation or simulation must use separately validated adapters and supported execution semantics.

Never describe a drawn emergency-stop circuit as a certified safety function.

---

# PART 11 — POWER ENGINEERING

Provide engineering tools for:

- Low-voltage distribution
- Medium-voltage schematic documentation
- Transformer stations
- Switchgear documentation
- Power distribution
- Protection equipment
- Single-line diagrams
- Metering systems
- Backup power
- Generator changeover
- UPS systems
- Solar PV electrical documentation
- Battery energy storage
- Industrial feeders
- Substation equipment diagrams

The supplied screenshot's substation project should be used as an initial acceptance scenario.

Create an original example containing a transformer, incoming feeder, switching devices, protection equipment, metering, secondary control wiring, terminal references, and a corresponding 3D panel.

Use independently authored symbols and diagrams.

Do not copy proprietary sample project data.

---

# PART 12 — ADIGUN BOT: FUNCTIONAL AI ENGINEERING ASSISTANT

Adigun BOT is a mandatory product-aware engineering assistant.

It must be available from a floating button throughout the application.

The assistant must not be a decorative chatbot.

## 12.1 Interface

Provide:

- Floating launch button
- Expandable chat panel
- Conversation history
- Contextual project awareness
- Suggested engineering actions
- Searchable documentation
- Action previews
- Confirmation dialogs
- Undo support
- Progress and error indicators
- Four-language interface

## 12.2 Knowledge

Ground responses in:

- Verified product documentation
- Supported component schemas
- Engineering calculation definitions
- Project-specific data
- Approved technical references
- Supported tool capabilities

Never fabricate standards, ratings, calculations, or manufacturer specifications.

## 12.3 Engineering tools

Implement validated tools for:

1. Create project
2. Create drawing page
3. Add electrical symbol
4. Place component
5. Connect terminals
6. Route wires
7. Rename devices
8. Assign reference designations
9. Generate netlist
10. Run electrical rule checks
11. Calculate load current
12. Calculate voltage drop
13. Generate cable schedule
14. Generate terminal schedule
15. Generate BOM
16. Create building floor
17. Add rooms
18. Place lighting fixtures
19. Place sockets and switches
20. Assign distribution circuits
21. Create distribution-board schedule
22. Create cabinet
23. Place 3D equipment
24. Run collision checks
25. Generate project documentation
26. Search project components
27. Explain validation findings
28. Suggest engineering corrections
29. Generate a project from natural language
30. Compare project revisions

## 12.4 Natural-language engineering workflow

Example request:

"Design a three-phase motor starter with overload protection, start and stop buttons, a contactor, terminal blocks, and a control cabinet."

Adigun BOT must:

1. Interpret the request.
2. Identify missing technical parameters.
3. Produce a structured design proposal.
4. Select suitable supported components.
5. Generate a canonical project document.
6. Validate symbol and connection schemas.
7. Preview the schematic.
8. Show engineering assumptions.
9. Ask for confirmation.
10. Import the approved design.
11. Run electrical rule checks.
12. Generate relevant reports.

Do not draw fake circuit pictures disconnected from the engineering model.

## 12.5 Secure action protocol

Use structured tool calls with:

- Action type
- Schema version
- Validated payload
- User identity
- Project permissions
- Preview/diff
- Explicit confirmation
- Transactional application
- Undo support
- Audit logging

The AI must not execute arbitrary shell commands, modify project files without authorization, or bypass engineering validation.

Provide a secure server-side model gateway. Keep API credentials out of the frontend.

Use cost controls, timeouts, request limits, cancellation, and usage monitoring.

When AI services are unavailable, manual engineering tools must continue to work.

---

# PART 13 — COMPONENT AND MANUFACTURER LIBRARIES

Build an extensible engineering component catalog.

## 13.1 Metadata

Each real component record must contain appropriate verified fields:

- Manufacturer
- Part number
- Device category
- Description
- Electrical ratings
- Mechanical dimensions
- Terminal information
- Connection schema
- Mounting requirements
- Datasheet reference
- Source and revision
- Licensing status
- Verification status

Do not fabricate manufacturer part numbers or electrical specifications.

## 13.2 Library functions

Implement:

- Category browsing
- Full-text search
- Property filtering
- Favorites
- Recent components
- Custom components
- Import/export
- Versioning
- Component comparison
- Part replacement
- Datasheet references
- Symbol-to-part mapping
- Part-to-3D-model mapping
- Missing-data warnings

Use openly licensed, user-supplied, or properly authorized data.

Manufacturer libraries and proprietary formats require appropriate rights.

---

# PART 14 — 500 READY-MADE ELECTRICAL AND ARCHITECTURAL PROJECTS

Deliver a library of 500 independently authored, functional, tested engineering examples.

The library must not consist of 500 renamed copies of one schematic.

Each project must have a meaningful engineering purpose, a valid native project document, realistic component relationships, and a repeatable validation procedure.

## Project allocation

| Category | Required examples |
|---|---:|
| Residential electrical installations | 60 |
| Commercial building electrical systems | 50 |
| Industrial motor control | 60 |
| PLC and automation wiring | 50 |
| Control cabinet and panel design | 50 |
| Power distribution and substations | 45 |
| Solar, renewable energy and storage | 40 |
| Lighting and emergency lighting | 40 |
| Fire alarm, security and low-voltage systems | 35 |
| Electrical protection and grounding | 35 |
| Advanced integrated engineering projects | 35 |
| **Total** | **500** |

## 14.1 Residential projects — 60

Include variations of:

- Single-room lighting
- Two-way switching
- Staircase lighting
- Socket outlet circuits
- Kitchen circuits
- Bathroom electrical zones
- Distribution boards
- RCD-protected circuits
- Garage installations
- Outdoor lighting
- EV charging documentation
- Apartment electrical plans
- Multi-floor residential risers
- Smart-home control wiring
- Whole-house electrical documentation

## 14.2 Commercial projects — 50

Include:

- Office lighting
- Office power distribution
- Retail shop installations
- Warehouse lighting
- Emergency lighting
- Small hotel distribution
- Restaurant electrical systems
- School classroom circuits
- Hospital room electrical documentation
- Data room power
- Commercial distribution boards
- Multi-floor office risers

## 14.3 Industrial motor-control projects — 60

Include:

- Direct-on-line starter
- Forward/reverse starter
- Star-delta starter
- Motor overload protection
- Two-motor interlocking
- Conveyor motor control
- Pump control
- Compressor control
- Soft-starter wiring
- VFD control wiring
- Motor protection monitoring
- Sequential motor starting

## 14.4 PLC and automation projects — 50

Include:

- Start/stop control
- Conveyor sensors
- Tank-level control
- Pump alternation
- Traffic-light wiring
- Packaging machine I/O
- Temperature control
- Pressure control
- Counting systems
- Limit-switch control
- Industrial alarm systems
- PLC-controlled motor starter

## 14.5 Control cabinet projects — 50

Include:

- Motor starter panels
- PLC cabinets
- Pump control panels
- Lighting control panels
- Distribution cabinets
- Industrial terminal panels
- VFD cabinets
- Instrumentation cabinets
- Network/control cabinets
- Multi-device automation enclosures

## 14.6 Power engineering projects — 45

Include:

- Low-voltage distribution
- Transformer feeder documentation
- Switchgear single-line diagrams
- Metering circuits
- Protection relay wiring
- Generator changeover
- UPS distribution
- Transformer station secondary circuits
- Industrial substation documentation

## 14.7 Renewable energy projects — 40

Include:

- Residential PV
- Commercial PV
- PV string documentation
- Inverter connection
- Battery storage wiring
- Hybrid inverter systems
- Backup power systems
- PV protection
- DC isolation
- AC distribution integration

## 14.8 Lighting projects — 40

Include:

- Residential lighting
- Office lighting
- Warehouse lighting
- Staircase lighting
- Emergency lighting
- Exit lighting
- DALI documentation
- Outdoor lighting
- Occupancy sensor control
- Lighting distribution schedules

## 14.9 Low-voltage systems — 35

Include:

- Fire alarm device circuits
- Access control
- CCTV power distribution
- Doorbell systems
- Intercom systems
- Network cabling
- Intrusion detection
- Building communication systems

## 14.10 Protection and grounding — 35

Include:

- Protective earthing
- Equipotential bonding
- Surge protection
- RCD arrangements
- Overcurrent protection
- Selectivity studies with verified data
- Earth-fault documentation
- Cable protection
- Industrial grounding documentation

## 14.11 Advanced integrated projects — 35

Include:

- Multi-floor office electrical design
- Industrial production line
- Automated warehouse
- Smart building
- Manufacturing plant distribution
- Integrated PLC cabinet
- Commercial PV and storage
- Industrial power distribution
- Transformer station with control panel
- Large building electrical documentation

## 14.12 Individual project acceptance

Every example must include:

- Unique ID
- Descriptive title
- Category
- Difficulty level
- Learning objectives
- Native project file
- Valid component references
- Schematic pages
- Connection data
- Appropriate calculations
- Relevant reports
- Expected validation results
- Source and licensing metadata
- Test evidence

Where applicable, include architectural layouts and 3D cabinet assemblies.

Do not force unrelated 3D assets into projects that do not need them.

Create a machine-readable manifest listing all 500 projects.

Every example must be independently loadable and validated.

A project cannot be marked "tested" simply because its JSON parses.

Use functional, structural, numerical, and visual checks appropriate to each project.

Track each example's status as:

Draft → Implemented → Validated → Reviewed → Released.

Do not claim 500 verified examples until all 500 have passed their applicable checks.

---

# PART 15 — PROJECT TEMPLATES AND WIZARDS

Provide functional creation wizards for:

- Empty ECAD project
- Residential electrical project
- Commercial building project
- Industrial control project
- PLC wiring project
- Motor-control project
- Distribution-board project
- Substation project
- Control cabinet project
- Solar PV project
- Lighting project
- Building electrical plan

Each wizard must request appropriate project parameters and generate a valid native project structure.

Support project cloning, template versioning, and custom user templates.

---

# PART 16 — DOCUMENTATION AND EXPORTS

Implement real export pipelines for supported formats.

Required outputs:

- PDF drawings
- SVG diagrams
- PNG images
- CSV reports
- JSON native project files
- BOM reports
- Cable schedules
- Terminal schedules
- Device lists
- Connection lists
- PLC I/O lists
- Drawing indexes
- Revision reports
- Calculation reports

Add DXF import/export where a verified library supports the required geometry.

Add STEP export or conversion for supported 3D geometry through a suitable engineering geometry backend.

For DWG, proprietary EPLAN formats, IFC, and other complex formats, evaluate licensing and technical feasibility before promising support.

Do not rename an SVG or JSON file to imitate another engineering format.

Preserve scale, units, layer semantics and supported metadata.

Report unsupported entities rather than silently discarding them.

---

# PART 17 — ACCOUNTS, DATABASE AND PROJECT SAVING

Implement a functional account system with:

- Email/password authentication
- Secure login
- Registration
- Password reset
- Profile settings
- Avatar upload
- Project ownership
- Private projects
- Local saving
- Cloud saving
- Project reopening
- Version history
- Autosave
- Recovery after interruption

Use Supabase if compatible with the selected architecture and available credentials.

Implement row-level security for user-owned records and appropriate storage access policies.

Never trust user-editable profile fields for administrator authorization.

Support local-first engineering editing with durable recovery.

For offline work, queue synchronization and handle conflicts explicitly.

Define a guest-access policy in the AdigunEplanAI configuration. Do not inherit AdigunSPs' ten-minute trial restriction without product-specific approval.

---

# PART 18 — TECHNOLOGY ARCHITECTURE

Prefer a modular TypeScript-based architecture where practical.

Recommended starting stack, subject to repository and feasibility audit:

Frontend:
- React
- TypeScript
- Vite
- Shared design-system tokens
- Accessible UI component primitives
- Zustand or equivalent state management

2D engineering canvas:
- SVG and/or Canvas rendering
- Custom geometry and interaction layer
- Spatial indexing for efficient selection
- Deterministic connectivity model

3D:
- Three.js
- React Three Fiber where appropriate
- Verified geometry import and conversion tools

Backend:
- TypeScript server or suitable backend framework
- Secure REST or typed API
- Schema validation
- Project services
- Report generation
- AI tool execution service

Database:
- PostgreSQL/Supabase where configured
- Versioned project document storage
- Indexed metadata
- Secure file storage

Engineering computation:
- Dedicated deterministic calculation modules
- Unit-aware numerical utilities
- Tested algorithms
- Optional specialized geometry/numerical service where required

Testing:
- Vitest
- React Testing Library
- Playwright
- API integration tests
- Property-based tests
- Engineering reference tests
- Visual regression tests

Deployment:
- Cloudflare Pages/Workers where compatible
- Separate backend services where required
- GitHub Actions CI/CD
- Environment-specific configuration

Do not select technologies merely because they are fashionable.

Use architecture decision records to explain major choices.

---

# PART 19 — REPOSITORY STRUCTURE

Organize the product repository approximately as follows:

adigunEplanAI/
- README.md
- AGENTS.md
- PROJECT_STATUS.md
- ROADMAP.md
- CHANGELOG.md
- LICENSE
- package.json
- pnpm-workspace.yaml
- apps/
  - web/
  - desktop/ (only if implemented)
  - api/
- packages/
  - ui/
  - design-tokens/
  - localization/
  - engineering-core/
  - electrical-model/
  - schematic-editor/
  - connectivity-engine/
  - symbol-library/
  - component-catalog/
  - building-design/
  - calculations/
  - panel-3d/
  - plc-engineering/
  - reporting/
  - import-export/
  - ai-tools/
  - project-storage/
- examples/
  - manifest.json
  - residential/
  - commercial/
  - industrial/
  - automation/
  - panels/
  - power/
  - renewable/
  - lighting/
  - low-voltage/
  - protection/
  - integrated/
- docs/
  - architecture/
  - engineering/
  - standards/
  - api/
  - user-guide/
  - testing/
  - security/
  - deployment/
- tests/
  - unit/
  - integration/
  - e2e/
  - engineering/
  - visual/
  - sample-projects/
- scripts/
- .github/
  - workflows/

Adjust the structure only when a documented architecture decision justifies it.

Avoid unnecessary packages and circular dependencies.

---

# PART 20 — PERFORMANCE AND USER EXPERIENCE

Target responsive professional desktop operation.

Implement:

- Efficient large-document rendering
- Virtualized component lists
- Incremental validation
- Lazy-loaded engineering libraries
- Background computation workers where appropriate
- Debounced autosaving
- Cancelable long-running calculations
- Efficient 3D rendering
- Resource cleanup
- Crash recovery
- Keyboard shortcuts
- Accessible dialogs
- Clear progress indicators

Establish measurable performance budgets using representative engineering projects.

Do not invent benchmark results.

Test large projects with thousands of devices and connections, then document actual supported limits.

---

# PART 21 — SECURITY, ENGINEERING SAFETY AND LICENSING

Implement:

- Input validation
- Output encoding
- Authentication and authorization
- Secure session handling
- Rate limiting
- Dependency scanning
- Secret scanning
- Project ownership enforcement
- Secure upload validation
- AI tool permission checks
- Audit logging
- Backup and recovery procedures

Engineering safety:

- Never present estimated results as certified calculations.
- Identify assumptions and limitations.
- Use verified component ratings.
- Require human review for safety-critical designs.
- Do not claim automatic certification against IEC, DIN, VDE, NFPA, UL or other standards.
- Track standards versions and licensed reference data.
- Mark unsupported compliance checks as unavailable.

Licensing:

- Respect EPLAN's proprietary rights.
- Do not redistribute proprietary symbol libraries.
- Do not reverse-engineer protected formats through unauthorized methods.
- Verify licenses for 3D models, manufacturer data, and third-party libraries.
- Document attribution requirements.

---

# PART 22 — COMPLETE DEVELOPMENT ROADMAP

Implement the full product in progressive milestones.

## Milestone 0 — Repository and feasibility audit

Inspect the destination repository and all three reference repositories.

Confirm branding assets, architecture constraints, deployment options, and third-party licensing.

Create architecture documents, a risk register, and a traceable feature matrix.

## Milestone 1 — Application foundation

Implement the monorepo, build system, linting, formatting, type checking, CI, and shared configuration.

## Milestone 2 — Corporate interface

Implement the header, ribbon, navigator, dockable panels, footer, themes, and four-language localization.

## Milestone 3 — Native project data model

Implement versioned project schemas, persistence, validation, migrations, and undo/redo.

## Milestone 4 — 2D schematic editor

Implement the drawing canvas, symbols, selection, zoom, snapping, layers, wiring and property editing.

## Milestone 5 — Electrical connectivity

Implement nets, terminals, cross-references, wire numbering and electrical rule checks.

## Milestone 6 — Engineering component library

Implement component metadata, symbol mapping, search, filtering, and verified catalog records.

## Milestone 7 — Building electrical design

Implement architectural floor plans, rooms, lighting, sockets, distribution boards and circuit schedules.

## Milestone 8 — Engineering calculations

Implement unit-aware calculators and engineering reference tests.

## Milestone 9 — 3D panel engineering

Implement enclosures, mounting equipment, DIN rails, 3D placement, synchronization and collision checking.

## Milestone 10 — PLC and industrial automation

Implement PLC wiring documentation, I/O mapping, motor-control examples and automation project support.

## Milestone 11 — Reports and exports

Implement actual PDF, SVG, CSV, JSON and other verified export capabilities.

## Milestone 12 — Accounts and cloud persistence

Implement authentication, profiles, secure project ownership, autosave, and recovery.

## Milestone 13 — Adigun BOT

Implement the secure assistant backend, grounded knowledge, validated engineering actions, previews and confirmation workflows.

## Milestone 14 — First 50 example projects

Build and individually validate 50 representative projects across all major categories.

## Milestone 15 — Expand to 150 examples

Add additional beginner and intermediate examples with independent validation evidence.

## Milestone 16 — Expand to 300 examples

Add complex industrial, building, renewable-energy, PLC and panel engineering projects.

## Milestone 17 — Complete 500 examples

Finish all categories and verify the manifest, project loading, connectivity, calculations, and applicable exports.

## Milestone 18 — System integration and regression

Test complete engineering workflows, 2D/3D synchronization, AI-generated designs, security, accessibility and localization.

## Milestone 19 — Production readiness

Complete deployment documentation, performance testing, backup procedures, security review and release checklist.

## Milestone 20 — Release

Deploy the verified application, publish the documentation, record the release version and verify the live service.

Do not mark a milestone complete without passing its acceptance criteria.

---

# PART 23 — MANDATORY END-TO-END ACCEPTANCE SCENARIOS

Before release, prove that the following workflows function:

### Scenario A — Motor starter

Create a motor starter, add real symbols, wire components, assign terminals, generate a netlist, run validation, save, reopen and export the drawing.

### Scenario B — Residential building

Create a building floor, add rooms, place lighting and sockets, assign circuits, calculate connected loads, generate distribution schedules and export drawings.

### Scenario C — Industrial PLC cabinet

Create a PLC wiring schematic, map I/O addresses, place associated devices into a 3D cabinet, run collision checks and generate a BOM.

### Scenario D — Transformer station

Create an original substation project with primary equipment, secondary control circuits, terminal references, protection documentation, and a synchronized panel layout.

### Scenario E — Adigun BOT

Request a motor-control schematic in natural language, inspect the generated proposal, confirm insertion, validate the resulting project, save it and export it.

### Scenario F — Persistence

Save a complex project, close the application, reopen it and verify that all engineering relationships remain intact.

### Scenario G — Localization

Switch between English, German, Yoruba and Nigerian Pidgin without losing project state or altering engineering values.

### Scenario H — Project library

Load all 500 sample projects independently and produce a per-project test result.

---

# PART 24 — QUALITY GATES

A release candidate must satisfy:

- Successful production build
- Passing TypeScript checks
- Passing lint checks
- Passing relevant unit tests
- Passing integration tests
- Passing engineering reference tests
- Passing project persistence tests
- Passing supported import/export tests
- Passing critical end-to-end workflows
- Passing security authorization tests
- Passing localization completeness checks
- Passing representative visual regression tests
- Passing applicable sample-project validation
- Documented known limitations
- No unresolved critical defects

A passing build alone does not prove the application is functional.

Maintain traceable evidence for every completed feature.

---

# PART 25 — CODEX EXECUTION AND TOKEN DISCIPLINE

The user operates multiple Codex projects with limited shared usage.

Optimize for reliable progress per unit of AI usage.

Mandatory rules:

1. Do not repeatedly paste the full specification into conversation responses.
2. Read the specification once and reference its sections thereafter.
3. Inspect only relevant files for the current milestone.
4. Do not repeatedly scan unrelated repositories.
5. Avoid unnecessary full-file rewrites.
6. Do not launch subagents without approval.
7. Avoid repeated dependency installations.
8. Use local automated tools for mechanical checks.
9. Prefer focused tests before broad regression suites.
10. Do not enter unlimited retry loops.
11. Do not rebuild working features unnecessarily.
12. Do not silently change architectural decisions.
13. Preserve uncommitted work.
14. Never force-push.
15. Never claim tests passed without running them.
16. Stop after the approved milestone.
17. Keep the full roadmap and progress status in repository files.
18. Resume from the last verified milestone instead of starting over.

Use Low reasoning for straightforward UI and documentation work, Medium for ordinary implementation, and High only for difficult engineering algorithms or investigations.

Do not use Extra High automatically.

Reasoning selection is a user-controlled Codex setting, not something the repository can guarantee.

---

# PART 26 — DEVELOPMENT CONTINUATION PROTOCOL

At the beginning of a new Codex session:

1. Inspect the current Git branch and working-tree status.
2. Read AGENTS.md.
3. Read PROJECT_STATUS.md.
4. Inspect the most recent relevant changes.
5. Identify the next incomplete approved milestone.
6. Implement only that milestone.
7. Run the required tests.
8. Update progress documentation.
9. Report results.
10. Wait for approval.

Do not restart the application from scratch.

Do not assume remote GitHub reflects local unpushed changes.

At the end of every milestone, use:

STATUS

Done:
- Actual implementation completed.

Tested:
- Tests executed and results.

Blocked:
- Outstanding issues, if any.

Next:
- Next recommended milestone.

Keep reports concise.

---

# PART 27 — FINAL DELIVERABLES

The final release must contain:

1. Functional AdigunEplanAI application.
2. Professional screenshot-inspired ECAD workspace.
3. Corporate-compliant branding.
4. Four complete UI languages.
5. Functional schematic editor.
6. Electrical connectivity engine.
7. Building electrical design tools.
8. Engineering calculation modules.
9. Functional 3D panel editor.
10. PLC and automation documentation tools.
11. Secure Adigun BOT engineering assistant.
12. Real component and symbol libraries.
13. 500 individually validated example projects.
14. Functional project saving and reopening.
15. Working supported exports.
16. Comprehensive user documentation.
17. Engineering calculation documentation.
18. Automated test suite.
19. Security and deployment documentation.
20. Verified GitHub commits and release records.

Any feature that remains incomplete must be clearly documented and must not be presented as finished.

---

# FINAL DIRECTIVE

Build AdigunEplanAI as a serious, independently developed engineering product under Hephzibah Behulah.

Respect the canonical corporate and HB Elektroniker design system.

Preserve the exact approved product name and destination repository.

Use the approved Project B workstation as the **current interface visual and interaction authority** under the UI-001 addendum. Earlier EPLAN screenshot guidance applies only to engineering content and useful workbench functionality, not the current shell layout.

Prioritize real engineering data, meaningful electrical connections, verified calculations, useful 3D geometry, functional AI tools, and traceable testing.

The full specification defines the destination.

Milestones define the execution path.

Current work must **continue from the actual existing implementation, beginning with UI-001**. Do not restart completed Milestones 0–12. Complete the Project B-style interface, verify/merge/deploy, and stop for owner UI approval before resuming incomplete milestones.

Never substitute an attractive interface for working engineering software.
