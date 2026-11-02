# Native symbol-family coverage

This records drawing/interface coverage for MASTER_SPECIFICATION.md Part 5.2. The engineering library has 69 original definitions, in addition to the nine native drawing primitives. Original artwork is not copied from a standards database or manufacturer datasheet. No IEC/ANSI version compliance, manufacturer pinout, equipment rating or operating simulation is certified by this table.

| Group | Native drawing coverage | Scope limits |
|---|---|---|
| Power | Transformer, generator, UPS, inverter, rectifier, DC/DC converter, supply, battery, busbar, isolator and distribution-board interfaces | Busbar and distribution-board drawings currently have connection/building primary categories; cross-category browsing needs review. |
| Protection | Native fuse; MCB, MCCB, RCD, RCBO, overload relay, motor-protection switch, surge protection and protection-relay interfaces | Independent component ports; no inferred trip curves, coordination or protection operation. |
| Switching | Native NO contact/coil; NC/auxiliary contact, relay, contactor, pushbutton, selector, emergency-stop and limit-switch drawings | Wiring documentation; actuator/coil/contact simulation remains separate. |
| Motors | Native DC motor; single-phase run/start windings, three-phase, servo, stepper and starter assembly | No torque, rotation, startup or thermal behavior is calculated. |
| Automation | PLC CPU, digital/analog I/O, remote I/O, communication module, timer, counter, sensor and solenoid-actuator interfaces | Generic documented terminals; no executable PLC, timer, counter, motion or protocol behavior. |
| Instrumentation | Voltmeter, ammeter, energy meter, temperature/pressure/flow transducers and measurement disconnect terminal | No measurement values or manufacturer calibration are invented. |
| Building | Socket, wall switch, luminaire, emergency luminaire, detector, distribution board and empty junction-box housing | Housing is explicitly pinless. Populated assemblies, architectural placement and circuit schedules remain engineering integration work. |
| Connections | Native terminal/PE; pass-through connectors, plug/socket interfaces, mechanical gland, shielded cable/drain and protective bonding clamp | No automatic mating. Shield is not automatically bonded to PE; each explicit core/drain/bond group retains its own node. |
| Industrial controls | VFD, soft starter, dual-channel safety relay, DC motor controller, industrial serial bridge and serial HMI interfaces | No manufacturer safety certification, network execution or HMI runtime is implied. |

The 22 new definitions are in packages/component-library/extended-symbols.ts. Shared original line/circle/pin/rectangle/contact artwork helpers are in symbol-primitives.ts. Existing definition identities and metadata are preserved.

Verification: every definition installs, places, validates bounded artwork/connection points and serializes as a native document. Four additional domain tests verify independent module ports, explicit shield/PE bonding, shared PE-clamp taps and plug/socket pole isolation. Twenty-two individual Chromium workflows verify each new interface's declared pin/node counts, real external wiring where applicable and reload. The complete 101-test unit/tooling gate and 79-scenario Chromium suite passed. The 22 rendered previews were visually reviewed without clipped artwork or labels.

These are symbol definitions, not 69 verified manufacturer parts or tested engineering example projects. The catalog still contains four source-backed records. Broader manufacturer metadata, standards-version documentation, cross-category browsing and real 3D mappings remain acceptance work; the 500-project requirement is unchanged.
