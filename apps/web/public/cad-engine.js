/* Versioned, source-backed component and connectivity model for Adigun AI AutoCAD. */
(function (root) {
  'use strict';

  const COMPONENT_SCHEMA_VERSION = 1;
  const PROJECT_FORMAT = 'adigun-ai-autocad-workspace';
  const PROJECT_VERSION = 2;
  const EPSILON = 1e-7;

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }
  function finite(value) { return typeof value === 'number' && Number.isFinite(value); }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  const terminalDefinition = deepFreeze({
    schemaVersion: COMPONENT_SCHEMA_VERSION,
    id: 'phoenix-contact-3212144',
    manufacturer: 'Phoenix Contact',
    manufacturerPartNumber: '3212144',
    model: 'PT 16 N OG',
    name: 'Feed-through terminal block',
    family: 'feedthrough-terminal',
    referencePrefix: 'X',
    category: 'Electrical · Verified DIN-rail terminal',
    symbol: {
      id: 'terminal.feedthrough.2-connection.v1',
      view: 'schematic',
      unit: 'mm',
      width: 70,
      height: 26,
      pins: [
        { id: 'connection-1', localNumber: '1', name: 'Connection 1', x: -35, y: 0, electricalType: 'passive', connectionType: 'push-in' },
        { id: 'connection-2', localNumber: '2', name: 'Connection 2', x: 35, y: 0, electricalType: 'passive', connectionType: 'push-in' }
      ],
      internalConnections: [['connection-1', 'connection-2']],
      numberingNote: 'Terminal numbers 1 and 2 are stable model-local connection IDs. The manufacturer page specifies two connections but does not assign these numbers.'
    },
    specifications: {
      nominalVoltage: { value: 1000, unit: 'V' },
      nominalCurrent: { value: 76, unit: 'A' },
      ratedCrossSection: { value: 16, unit: 'mm²' },
      rigidConductorRange: { minimum: 0.5, maximum: 25, unit: 'mm²' },
      flexibleConductorRange: { minimum: 0.5, maximum: 25, unit: 'mm²' },
      connectionCount: { value: 2, unit: 'connections' },
      connectionMethod: { value: 'Push-in' },
      productStandard: { value: 'IEC 60947-7-1' },
      mountingRails: { value: ['NS 35/7.5', 'NS 35/15'] },
      dimensions: {
        width: { value: 12.2, unit: 'mm' },
        height: { value: 75.4, unit: 'mm' },
        depthOnNS35_7_5: { value: 52.6, unit: 'mm' },
        depthOnNS35_15: { value: 60.1, unit: 'mm' }
      },
      color: { value: 'Orange (RAL 2003)' }
    },
    instanceProperties: {
      terminalStrip: { type: 'string', default: '', maximumLength: 40 },
      position: { type: 'string', default: '', maximumLength: 24 },
      marking: { type: 'string', default: '', maximumLength: 40 },
      comment: { type: 'string', default: '', maximumLength: 160 }
    },
    sources: [{
      publisher: 'Phoenix Contact',
      title: 'PT 16 N OG · Feed-through terminal block · Item 3212144',
      url: 'https://www.phoenixcontact.com/en-lt/products/feed-through-terminal-block-pt-16-n-og-3212144',
      documentRevision: null,
      revisionNote: 'Live manufacturer product page; no document revision was displayed.',
      retrievedAt: '2026-11-12'
    }]
  });
  const relayDefinition = deepFreeze({
    schemaVersion: COMPONENT_SCHEMA_VERSION,
    id: 'phoenix-contact-2966171',
    manufacturer: 'Phoenix Contact',
    manufacturerPartNumber: '2966171',
    model: 'PLC-RSC- 24DC/21',
    name: 'PLC-INTERFACE relay module',
    family: 'relay-module',
    referencePrefix: 'K',
    category: 'Electrical · Verified interface relay',
    symbol: {
      id: 'relay.interface.changeover.24vdc.v1',
      view: 'schematic',
      unit: 'mm',
      width: 140,
      height: 60,
      pins: [
        { id: 'coil-a2', localNumber: 'A2', name: 'Coil return', x: -70, y: -20, electricalType: 'passive', connectionType: 'screw' },
        { id: 'coil-a1', localNumber: 'A1', name: 'Coil supply', x: -70, y: 20, electricalType: 'passive', connectionType: 'screw' },
        { id: 'contact-11', localNumber: '11', name: 'Changeover common', x: 70, y: 0, electricalType: 'passive', connectionType: 'screw' },
        { id: 'contact-12', localNumber: '12', name: 'Normally closed', x: 70, y: -25, electricalType: 'passive', connectionType: 'screw' },
        { id: 'contact-14', localNumber: '14', name: 'Normally open', x: 70, y: 25, electricalType: 'passive', connectionType: 'screw' }
      ],
      internalConnections: [],
      numberingNote: 'External terminal designations A1, A2, 11, 12 and 14 follow the manufacturer circuit diagram. Pin coordinates are schematic connection points, not a physical relay footprint.'
    },
    electricalFunctions: {
      coil: { pins: ['coil-a1', 'coil-a2'], nominalVoltage: { value: 24, unit: 'V DC' }, polarity: { positive: 'A1', negative: 'A2' }, suppression: 'Integrated polarity/freewheeling diode and input circuit; preserve A1/A2 polarity.' },
      changeoverContact: { common: 'contact-11', normallyClosed: 'contact-12', normallyOpen: 'contact-14', deenergizedConnections: [['contact-11', 'contact-12']], energizedConnections: [['contact-11', 'contact-14']], actuation: 'coil-a1/coil-a2', simulation: 'Not simulated; static connectivity reports only user-authored wires and does not assume a relay state.' }
    },
    specifications: {
      nominalCoilVoltage: { value: 24, unit: 'V DC' },
      coilInputRangeAt20C: { minimum: 18.5, maximum: 33.6, unit: 'V DC' },
      typicalInputCurrent: { value: 9, unit: 'mA' },
      responseTime: { value: 5, unit: 'ms' },
      releaseTime: { value: 8, unit: 'ms' },
      changeoverContactCount: { value: 1, unit: 'changeover contact' },
      maximumSwitchingVoltage: { value: 250, unit: 'V AC/DC', note: 'Manufacturer installation note applies above 250 V between adjacent identical modules.' },
      limitingContinuousCurrent: { value: 6, unit: 'A', note: 'Manufacturer parameter; temperature and mounting derating apply.' },
      ratedImpulseWithstandVoltage: { value: 6, unit: 'kV' },
      windingContactTestVoltage: { value: 4, unit: 'kV AC' },
      contactStandard: { value: 'IEC 60947-5-1' },
      connectionMethod: { value: 'Screw connection · M3 · 0.6–0.8 Nm' },
      rigidConductorRange: { minimum: 0.14, maximum: 2.5, unit: 'mm²' },
      flexibleConductorRange: { minimum: 0.14, maximum: 2.5, unit: 'mm²' },
      connectionCount: { value: 5, unit: 'external electrical terminals' },
      dimensions: { width: { value: 6.2, unit: 'mm' }, height: { value: 80, unit: 'mm' }, depth: { value: 94, unit: 'mm' } },
      mountingRail: { value: 'NS 35/7.5' }
    },
    instanceProperties: {
      terminalStrip: { type: 'string', default: '', maximumLength: 40 },
      position: { type: 'string', default: '', maximumLength: 24 },
      marking: { type: 'string', default: '', maximumLength: 40 },
      comment: { type: 'string', default: '', maximumLength: 160 }
    },
    sources: [{
      publisher: 'Phoenix Contact',
      title: 'PLC-RSC- 24DC/21 · Relay module · Item 2966171, online catalog PDF',
      url: 'https://www.phoenixcontact.com/en-pc/products/relay-module-plc-rsc-24dc-21-2966171?type=pdf',
      documentRevision: 'Manufacturer catalog PDF generated May 19, 2026 · circuit diagram page 9 of 12',
      revisionNote: 'Manufacturer online catalog PDF; retrieved from Phoenix Contact product page. Circuit diagram supplies external pin identifiers and functional arrangement.',
      retrievedAt: '2026-11-12'
    }]
  });
  const contactorDefinition = deepFreeze({
    schemaVersion: COMPONENT_SCHEMA_VERSION,
    id: 'schneider-electric-lc1d09bd',
    manufacturer: 'Schneider Electric',
    manufacturerPartNumber: 'LC1D09BD',
    model: 'TeSys D LC1D09BD',
    name: '3-pole contactor with 24 V DC coil',
    family: 'contactor',
    referencePrefix: 'KM',
    category: 'Electrical · Verified motor-control contactor',
    symbol: {
      id: 'contactor.tesys-d.lc1d09bd.v1',
      view: 'schematic',
      unit: 'mm',
      width: 280,
      height: 130,
      pins: [
        { id: 'coil-a1', localNumber: 'A1', name: 'DC coil terminal A1', x: -120, y: -25, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'coil-a2', localNumber: 'A2', name: 'DC coil terminal A2', x: -120, y: 25, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'power-l1', localNumber: '1/L1', name: 'Main pole 1 line terminal', x: -50, y: -55, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'power-t1', localNumber: '2/T1', name: 'Main pole 1 load terminal', x: -50, y: 55, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'power-l2', localNumber: '3/L2', name: 'Main pole 2 line terminal', x: 0, y: -55, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'power-t2', localNumber: '4/T2', name: 'Main pole 2 load terminal', x: 0, y: 55, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'power-l3', localNumber: '5/L3', name: 'Main pole 3 line terminal', x: 50, y: -55, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'power-t3', localNumber: '6/T3', name: 'Main pole 3 load terminal', x: 50, y: 55, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'aux-13', localNumber: '13', name: 'Auxiliary normally-open contact terminal', x: 100, y: -55, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'aux-14', localNumber: '14', name: 'Auxiliary normally-open contact terminal', x: 100, y: 55, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'aux-21', localNumber: '21', name: 'Auxiliary normally-closed contact terminal', x: 145, y: -55, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'aux-22', localNumber: '22', name: 'Auxiliary normally-closed contact terminal', x: 145, y: 55, electricalType: 'passive', connectionType: 'screw-clamp' }
      ],
      internalConnections: [],
      numberingNote: 'A1/A2, 1/L1–6/T3, 13/14 and 21/22 are the manufacturer wiring-diagram terminal designations. The schematic pins are electrical connection points, not the contactor physical footprint. Main and auxiliary contacts remain separate nets; contactor state is not simulated.'
    },
    electricalFunctions: {
      contactor: {
        coil: { pins: ['coil-a1', 'coil-a2'], nominalVoltage: { value: 24, unit: 'V DC' }, suppression: 'Built-in bidirectional peak-limiting diode suppressor' },
        mainPoles: [
          { line: 'power-l1', load: 'power-t1', normalState: 'open' },
          { line: 'power-l2', load: 'power-t2', normalState: 'open' },
          { line: 'power-l3', load: 'power-t3', normalState: 'open' }
        ],
        auxiliaryContacts: [
          { first: 'aux-13', second: 'aux-14', normalState: 'open', type: 'mechanically-linked NO' },
          { first: 'aux-21', second: 'aux-22', normalState: 'closed', type: 'mechanically-linked NC' }
        ],
        simulationNote: 'Three main poles and the mechanically-linked auxiliary NO/NC contacts are represented as separate external terminal pairs. Contact actuation and coil-state simulation are not implemented; only user-authored wires establish nets.'
      }
    },
    specifications: {
      poles: { value: '3P, 3 normally-open main poles' },
      ac3RatedCurrent: { value: 9, unit: 'A at ≤440 V AC' },
      ac3RatedOperationalVoltage: { value: 440, unit: 'V AC maximum for 9 A AC-3 rating' },
      ratedOperationalVoltage: { value: 690, unit: 'V AC maximum' },
      nominalCoilVoltage: { value: 24, unit: 'V DC' },
      coilOperationalRangeAt60C: { minimum: 0.7, maximum: 1.25, unit: '× Uc' },
      auxiliaryContactComposition: { value: '1 mechanically-linked NO + 1 mechanically-linked NC' },
      coilSuppressor: { value: 'Built-in bidirectional peak-limiting diode' },
      standards: { value: ['IEC 60947-4-1', 'IEC 60947-5-1', 'UL 508'] },
      terminalConnection: { value: 'Screw clamp; manufacturer torque 1.7 N·m' },
      dimensions: { width: { value: 45, unit: 'mm' }, height: { value: 77, unit: 'mm' }, depth: { value: 95, unit: 'mm' } },
      mountingSupport: { value: ['Rail', 'Plate'] }
    },
    instanceProperties: {
      terminalStrip: { type: 'string', default: '', maximumLength: 40 },
      position: { type: 'string', default: '', maximumLength: 24 },
      marking: { type: 'string', default: '', maximumLength: 40 },
      comment: { type: 'string', default: '', maximumLength: 160 }
    },
    sources: [{
      publisher: 'Schneider Electric',
      title: 'LC1D09BD · TeSys D contactor · Product data sheet',
      url: 'https://iportal.se.com/Contents/docs/SQD-LC1D09BD.PDF',
      productUrl: 'https://www.se.com/us/en/product/LC1D09BD/iec-contactor-tesys-deca-nonreversing-9a-5hp-at-480vac-up-to-100ka-sccr-3-phase-3-no-24vdc-coil-open-style/',
      documentRevision: 'Manufacturer product data sheet; wiring diagram page 6; source document dated September 8, 2017.',
      revisionNote: 'Manufacturer sheet supplies coil, main and auxiliary terminal identities, contact composition, ratings and dimensions. Verify the exact product and application limits against the current manufacturer documentation before engineering use.',
      retrievedAt: '2026-11-12'
    }]
  });
  const createHarmonyPushButtonDefinition = function (partNumber, color, contactType, terminalA, terminalB, positiveOpening) {
    const normallyOpen = contactType === 'normally-open';
    const id = 'schneider-electric-' + partNumber.toLowerCase();
    return deepFreeze({
      schemaVersion: COMPONENT_SCHEMA_VERSION,
      id: id,
      manufacturer: 'Schneider Electric',
      manufacturerPartNumber: partNumber,
      model: 'Harmony XB5 ' + partNumber,
      name: color + ' spring-return push-button, ' + (normallyOpen ? '1 NO' : '1 NC'),
      family: 'pushbutton',
      referencePrefix: 'S',
      category: 'Electrical · Verified control-station push-button',
      symbol: {
        id: 'pushbutton.harmony-xb5.' + partNumber.toLowerCase() + '.v1',
        view: 'schematic',
        unit: 'mm',
        width: 150,
        height: 90,
        representation: { standard: 'IEC-style functional representation', text: 'S', symbolType: 'momentary spring-return push-button contact; not manufacturer CAD geometry' },
        pins: [
          { id: 'contact-' + terminalA.toLowerCase().replace(/[^a-z0-9]+/g, '-'), localNumber: terminalA, name: 'Push-button contact terminal ' + terminalA, x: -55, y: 0, electricalType: 'passive', connectionType: 'screw-clamp' },
          { id: 'contact-' + terminalB.toLowerCase().replace(/[^a-z0-9]+/g, '-'), localNumber: terminalB, name: 'Push-button contact terminal ' + terminalB, x: 55, y: 0, electricalType: 'passive', connectionType: 'screw-clamp' }
        ],
        internalConnections: [],
        numberingNote: 'Terminal designations and normal contact type follow the exact Schneider Electric product data sheet. The static CAD net model does not change continuity when an operator is pressed.'
      },
      electricalFunctions: {
        pushButton: {
          actuation: 'momentary spring-return',
          normalContactState: normallyOpen ? 'open' : 'closed',
          pressedContactState: normallyOpen ? 'closed' : 'open',
          terminalPair: [terminalA, terminalB],
          simulationNote: 'The model documents momentary contact behavior but does not simulate actuation; pin continuity remains unmodeled and authored wires define nets.'
        }
      },
      specifications: {
        productFamily: { value: 'Harmony XB5' },
        operatorProfile: { value: color + ' flush, unmarked' },
        operatorType: { value: 'Spring return' },
        contactComposition: { value: normallyOpen ? '1 NO' : '1 NC' },
        contactOperation: { value: 'Slow-break' },
        terminalDesignation: { value: '(' + terminalA + '-' + terminalB + ')' + (normallyOpen ? 'NO' : 'NC') },
        terminalConnection: { value: 'Screw clamp' },
        mountingDiameter: { value: 22, unit: 'mm' },
        dimensions: { height: { value: 42, unit: 'mm' }, width: { value: 30, unit: 'mm' }, depth: { value: 52, unit: 'mm' } },
        positiveOpening: { value: positiveOpening }
      },
      instanceProperties: {
        terminalStrip: { type: 'string', default: '', maximumLength: 40 },
        position: { type: 'string', default: '', maximumLength: 24 },
        marking: { type: 'string', default: '', maximumLength: 40 },
        comment: { type: 'string', default: '', maximumLength: 160 }
      },
      sources: [{
        publisher: 'Schneider Electric',
        title: partNumber + ' · product data sheet',
        url: partNumber === 'XB5AA31'
          ? 'https://iportal.se.com/Contents/docs/SQD-XB5AA31_DATA%20SHEET.PDF'
          : 'https://www.se.com/id/id/product/XB5AA42/red-flush-complete-pushbutton-%C3%B822-spring-return-1nc-unmarked/',
        documentRevision: partNumber === 'XB5AA31' ? 'Schneider Electric product data sheet, 09-Jan-2019; retrieved 2026-11-12.' : 'Schneider Electric product page and product data; retrieved 2026-11-12.',
        revisionNote: partNumber === 'XB5AA31'
          ? 'Confirms complete green flush Ø22 spring-return push-button, one slow-break normally-open contact, screw-clamp terminals 13-14, and 42 × 30 × 52 mm overall dimensions.'
          : 'Confirms complete red flush Ø22 spring-return push-button, one slow-break normally-closed contact, screw-clamp terminals 21-22, positive opening per EN/IEC 60947-5-1 Appendix K, and 42 × 30 × 52 mm overall dimensions.',
        retrievedAt: '2026-11-12'
      }]
    });
  };
  const schneiderStartPushButtonDefinition = createHarmonyPushButtonDefinition('XB5AA31', 'Green', 'normally-open', '13', '14', false);
  const schneiderStopPushButtonDefinition = createHarmonyPushButtonDefinition('XB5AA42', 'Red', 'normally-closed', '21', '22', true);
  const motorStarterDefinition = deepFreeze({
    schemaVersion: COMPONENT_SCHEMA_VERSION,
    id: 'siemens-3rm1201-1aa04',
    manufacturer: 'Siemens',
    manufacturerPartNumber: '3RM1201-1AA04',
    model: 'SIRIUS 3RM1 3RM1201-1AA04',
    name: '24 V DC reversing motor starter',
    family: 'motor-starter-reversing',
    referencePrefix: 'Q',
    category: 'Electrical · Verified reversing motor starter',
    symbol: {
      id: 'motor-starter.sirius-3rm12.3rm1201-1aa04.v1',
      view: 'schematic',
      unit: 'mm',
      width: 240,
      height: 220,
      pins: [
        { id: 'power-l1', localNumber: '1/L1', name: 'Phase L1 line terminal', x: -50, y: -110, electricalType: 'passive', connectionType: 'screw' },
        { id: 'power-l2', localNumber: '3/L2', name: 'Phase L2 line terminal', x: 0, y: -110, electricalType: 'passive', connectionType: 'screw' },
        { id: 'power-l3', localNumber: '5/L3', name: 'Phase L3 line terminal', x: 50, y: -110, electricalType: 'passive', connectionType: 'screw' },
        { id: 'power-t1', localNumber: '2/T1', name: 'Motor phase T1 output', x: -50, y: 110, electricalType: 'passive', connectionType: 'screw' },
        { id: 'power-t2', localNumber: '4/T2', name: 'Motor phase T2 output', x: 0, y: 110, electricalType: 'passive', connectionType: 'screw' },
        { id: 'power-t3', localNumber: '6/T3', name: 'Motor phase T3 output', x: 50, y: 110, electricalType: 'passive', connectionType: 'screw' },
        { id: 'control-a1', localNumber: 'A1', name: '24 V DC control supply positive', x: -120, y: -75, electricalType: 'passive', connectionType: 'screw' },
        { id: 'control-in1', localNumber: 'IN1', name: 'Start input, direction 1', x: -120, y: -45, electricalType: 'passive', connectionType: 'screw' },
        { id: 'control-in2', localNumber: 'IN2', name: 'Start input, direction 2', x: -120, y: -15, electricalType: 'passive', connectionType: 'screw' },
        { id: 'control-in3', localNumber: 'IN3', name: 'Reset input', x: -120, y: 15, electricalType: 'passive', connectionType: 'screw' },
        { id: 'control-a2', localNumber: 'A2', name: '24 V DC control supply return', x: -120, y: 45, electricalType: 'passive', connectionType: 'screw' },
        { id: 'signal-out', localNumber: 'OUT', name: 'Run signaling output, 24 V DC version', x: 120, y: -60, electricalType: 'passive', connectionType: 'screw' },
        { id: 'signal-95', localNumber: '95', name: 'Fault signaling contact common', x: 120, y: -20, electricalType: 'passive', connectionType: 'screw' },
        { id: 'signal-96', localNumber: '96', name: 'Fault signaling contact terminal 96', x: 120, y: 20, electricalType: 'passive', connectionType: 'screw' },
        { id: 'signal-98', localNumber: '98', name: 'Fault signaling contact terminal 98', x: 120, y: 60, electricalType: 'passive', connectionType: 'screw' }
      ],
      internalConnections: [],
      numberingNote: 'Terminal designations and positions follow Siemens SIRIUS 3RM1 equipment manual circuit diagrams. The model preserves each external connection independently; direction switching, protection and signal-contact state are not simulated.'
    },
    electricalFunctions: {
      reversingStarter: {
        lineTerminals: ['power-l1', 'power-l2', 'power-l3'],
        motorTerminals: ['power-t1', 'power-t2', 'power-t3'],
        directionInputs: ['control-in1', 'control-in2'],
        controlSupply: ['control-a1', 'control-a2'],
        resetInput: 'control-in3',
        runSignalOutput: 'signal-out',
        faultSignalContacts: ['signal-95', 'signal-96', 'signal-98'],
        simulationNote: 'The 3RM12 contains a reversing starter. Internal power switching, motor protection response, direction interlocking and signal-contact behavior are not simulated or included as phantom nets.'
      }
    },
    specifications: {
      maximumRatedOperationalVoltage: { value: 500, unit: 'V' },
      ratedMotorPowerAt400V: { value: 0.12, unit: 'kW', note: 'Maximum motor power at 400 V AC per Siemens catalog.' },
      adjustableRatedOperationalCurrent: { minimum: 0.1, maximum: 0.5, unit: 'A' },
      controlSupplyVoltage: { value: 24, unit: 'V DC' },
      connectionMethod: { value: 'Screw terminals' },
      starterType: { value: 'Standard reversing starter, 3RM12' },
      mainCircuitTerminals: { value: ['1/L1', '3/L2', '5/L3', '2/T1', '4/T2', '6/T3'] },
      controlCircuitTerminals: { value: ['A1', 'A2', 'IN1', 'IN2', 'IN3', 'OUT'] },
      faultSignalTerminals: { value: ['95', '96', '98'] }
    },
    instanceProperties: {
      terminalStrip: { type: 'string', default: '', maximumLength: 40 },
      position: { type: 'string', default: '', maximumLength: 24 },
      marking: { type: 'string', default: '', maximumLength: 40 },
      comment: { type: 'string', default: '', maximumLength: 160 }
    },
    sources: [
      {
        publisher: 'Siemens',
        title: '3RM1201-1AA04 · SIRIUS 3RM1 reversing starter · Industry Mall',
        url: 'https://mall.industry.siemens.com/mall/en/en/Catalog/Product/?mlfb=3RM1201-1AA04',
        documentRevision: 'Live manufacturer product catalog; retrieved 2026-11-12.',
        revisionNote: 'Confirms exact active article number, reversing-starter family, 500 V, 0–0.12 kW, 0.1–0.5 A, 24 V DC and screw terminals.',
        retrievedAt: '2026-11-12'
      },
      {
        publisher: 'Siemens',
        title: 'SIRIUS 3RM1 Motor Starter · Equipment Manual',
        url: 'https://cache.industry.siemens.com/dl/files/730/66295730/att_919653/v3/manual_motorstarter_SIRIUS_3RM1_en-US.pdf',
        documentRevision: 'Equipment Manual, 09/2024, A5E0345285095020A/RS-AJ/009.',
        revisionNote: 'Circuit diagrams and terminal-cover layout identify phase, motor, supply, direction, reset, run-signal and fault-signal terminals for the standard 24 V DC 3RM12 reversing starter.',
        retrievedAt: '2026-11-12'
      }
    ]
  });
  const motorProtectionBreakerDefinition = deepFreeze({
    schemaVersion: COMPONENT_SCHEMA_VERSION,
    id: 'siemens-3rv2011-1ja10',
    manufacturer: 'Siemens',
    manufacturerPartNumber: '3RV2011-1JA10',
    model: 'SIRIUS 3RV2 size S00',
    name: 'Motor-protection circuit breaker',
    family: 'motor-protection-breaker',
    referencePrefix: 'Q',
    category: 'Electrical · Verified motor-protection breaker',
    symbol: {
      id: 'breaker.sirius-3rv2.3rv2011-1ja10.v1',
      view: 'schematic',
      unit: 'mm',
      width: 180,
      height: 220,
      representation: { standard: 'IEC-style functional representation', text: 'Q', symbolType: 'three-pole motor-protection circuit breaker; not manufacturer CAD geometry' },
      pins: [
        { id: 'line-l1', localNumber: '1/L1', name: 'Phase L1 line terminal', x: -50, y: -90, electricalType: 'passive', connectionType: 'screw' },
        { id: 'line-l2', localNumber: '3/L2', name: 'Phase L2 line terminal', x: 0, y: -90, electricalType: 'passive', connectionType: 'screw' },
        { id: 'line-l3', localNumber: '5/L3', name: 'Phase L3 line terminal', x: 50, y: -90, electricalType: 'passive', connectionType: 'screw' },
        { id: 'load-t1', localNumber: '2/T1', name: 'Phase T1 load terminal', x: -50, y: 90, electricalType: 'passive', connectionType: 'screw' },
        { id: 'load-t2', localNumber: '4/T2', name: 'Phase T2 load terminal', x: 0, y: 90, electricalType: 'passive', connectionType: 'screw' },
        { id: 'load-t3', localNumber: '6/T3', name: 'Phase T3 load terminal', x: 50, y: 90, electricalType: 'passive', connectionType: 'screw' }
      ],
      internalConnections: [],
      numberingNote: 'Main terminals follow the Siemens SIRIUS 3RV2 equipment manual: 1/L1, 3/L2, 5/L3 line side and 2/T1, 4/T2, 6/T3 load side. The static drawing model does not assume a contact state, trip response, protection coordination or an electrical bridge between poles.'
    },
    electricalFunctions: {
      motorProtection: {
        lineTerminals: ['line-l1', 'line-l2', 'line-l3'],
        loadTerminals: ['load-t1', 'load-t2', 'load-t3'],
        poles: [['line-l1', 'load-t1'], ['line-l2', 'load-t2'], ['line-l3', 'load-t3']],
        simulationNote: 'Three-pole motor-protection function is documented. Set the overload release against the actual motor nameplate and application review; the adjustment range alone does not establish suitability. Switching state, thermal/magnetic trip behavior, fault interruption and coordination are not simulated; connect only the external terminals with authored wires.'
      }
    },
    specifications: {
      productFamily: { value: 'SIRIUS 3RV2' },
      frameSize: { value: 'S00' },
      overloadTripClass: { value: 10, unit: 'Class' },
      adjustableOverloadRelease: { minimum: 7, maximum: 10, unit: 'A' },
      instantaneousShortCircuitRelease: { value: 130, unit: 'A' },
      mainPoleCount: { value: 3 },
      ratedOperationalVoltage: { minimum: 20, maximum: 690, unit: 'V AC' },
      connectionMethod: { value: 'Screw terminals' },
      referenceCode: { value: 'Q' }
    },
    instanceProperties: {
      overloadSettingA: { type: 'number', default: null, minimum: 7, maximum: 10, step: 'any' },
      terminalStrip: { type: 'string', default: '', maximumLength: 40 },
      position: { type: 'string', default: '', maximumLength: 24 },
      marking: { type: 'string', default: '', maximumLength: 40 },
      comment: { type: 'string', default: '', maximumLength: 160 }
    },
    sources: [
      {
        publisher: 'Siemens',
        title: '3RV2011-1JA10 · product data sheet',
        url: 'https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-1JA10',
        documentRevision: 'Siemens product data sheet, 6 pages; retrieved 2026-11-12.',
        revisionNote: 'Confirms S00 size, Class 10, adjustable overload release 7–10 A, instantaneous N-release 130 A, three main poles and screw terminals.',
        retrievedAt: '2026-11-12'
      },
      {
        publisher: 'Siemens',
        title: 'SIRIUS 3RV Motor Starter Protectors · Equipment Manual',
        url: 'https://support.industry.siemens.com/cs/attachments/60279172/manual_SIRIUS_circuit_breaker_3RV_en-US.pdf',
        documentRevision: 'Equipment Manual, 05/2025, A5E03656507320A/RS-AM/013.',
        revisionNote: 'Identifies the 3RV2 main terminal designations and line/load sides; explains the S00 motor-setting control and connection guidance.',
        retrievedAt: '2026-11-12'
      }
    ]
  });
  const lowRangeMotorProtectionBreakerDefinition = deepFreeze(Object.assign({}, motorProtectionBreakerDefinition, {
    id: 'siemens-3rv2011-0fa10',
    manufacturerPartNumber: '3RV2011-0FA10',
    model: 'SIRIUS 3RV2 size S00',
    name: 'Low-range motor-protection circuit breaker',
    category: 'Electrical · Verified motor-protection breaker',
    symbol: Object.assign({}, motorProtectionBreakerDefinition.symbol, {
      id: 'breaker.sirius-3rv2.3rv2011-0fa10.v1'
    }),
    specifications: Object.assign({}, motorProtectionBreakerDefinition.specifications, {
      adjustableOverloadRelease: { minimum: 0.35, maximum: 0.5, unit: 'A' },
      instantaneousShortCircuitRelease: { value: 6.5, unit: 'A' },
      ratedOperationalCurrent: { value: 0.5, unit: 'A' },
      ratedMotorPower400V: { value: 0.12, unit: 'kW' }
    }),
    instanceProperties: Object.assign({}, motorProtectionBreakerDefinition.instanceProperties, {
      overloadSettingA: { type: 'number', default: null, minimum: 0.35, maximum: 0.5, step: 'any' }
    }),
    sources: [
      {
        publisher: 'Siemens',
        title: '3RV2011-0FA10 · product data sheet',
        url: 'https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10',
        documentRevision: 'Siemens product data sheet, 6 pages; retrieved 2026-11-12.',
        revisionNote: 'Confirms S00 size, Class 10, adjustable overload release 0.35–0.5 A, instantaneous magnetic release 6.5 A, three main poles, 0.5 A rated operational current, 0.12 kW at 400 V and screw terminals.',
        retrievedAt: '2026-11-12'
      },
      motorProtectionBreakerDefinition.sources[1]
    ]
  }));
  const motorDefinition = deepFreeze({
    schemaVersion: COMPONENT_SCHEMA_VERSION,
    id: 'sew-eurodrive-drn63ms4',
    manufacturer: 'SEW-EURODRIVE',
    manufacturerPartNumber: 'DRN63MS4',
    model: 'DRN63MS4',
    name: 'Three-phase AC induction motor',
    family: 'motor-induction',
    referencePrefix: 'M',
    category: 'Electrical · Verified 3-phase motor',
    symbol: {
      id: 'motor.induction.drn63ms4.v1',
      view: 'schematic',
      unit: 'mm',
      width: 120,
      height: 120,
      representation: { standard: 'IEC', text: 'M 3~', symbolType: 'three-phase induction motor' },
      pins: [
        { id: 'winding-u1', localNumber: 'U1', name: 'Winding U line end', x: -50, y: -60, electricalType: 'passive', connectionType: 'terminal-block' },
        { id: 'winding-v1', localNumber: 'V1', name: 'Winding V line end', x: 0, y: -60, electricalType: 'passive', connectionType: 'terminal-block' },
        { id: 'winding-w1', localNumber: 'W1', name: 'Winding W line end', x: 50, y: -60, electricalType: 'passive', connectionType: 'terminal-block' },
        { id: 'winding-u2', localNumber: 'U2', name: 'Winding U star end', x: -50, y: 60, electricalType: 'passive', connectionType: 'terminal-block' },
        { id: 'winding-v2', localNumber: 'V2', name: 'Winding V star end', x: 0, y: 60, electricalType: 'passive', connectionType: 'terminal-block' },
        { id: 'winding-w2', localNumber: 'W2', name: 'Winding W star end', x: 50, y: 60, electricalType: 'passive', connectionType: 'terminal-block' },
        { id: 'protective-earth', localNumber: 'PE', name: 'Protective earth connection', x: 60, y: 0, electricalType: 'passive', connectionType: 'protective-earth' }
      ],
      internalConnections: [],
      numberingNote: 'U1/V1/W1 and U2/V2/W2 are the manufacturer winding-terminal designations; PE is the motor protective-earth terminal. Winding pairs are electrical coils, not galvanically shorted nets. The example wires the high-voltage star point externally.'
    },
    electricalFunctions: {
      statorWindings: [
        { lineEnd: 'winding-u1', starEnd: 'winding-u2', nominalPower: { value: 0.12, unit: 'kW' } },
        { lineEnd: 'winding-v1', starEnd: 'winding-v2', nominalPower: { value: 0.12, unit: 'kW' } },
        { lineEnd: 'winding-w1', starEnd: 'winding-w2', nominalPower: { value: 0.12, unit: 'kW' } }
      ],
      terminalBoard: {
        connection: 'Star (Y) for 400 V, 50 Hz operation',
        phaseInputs: ['winding-u1', 'winding-v1', 'winding-w1'],
        starPoint: ['winding-u2', 'winding-v2', 'winding-w2'],
        protectiveEarth: 'protective-earth'
      },
      simulationNote: 'This component records source-backed winding and PE terminals. Motor torque, speed, rotation, load, thermal behavior and electrical dynamics are not simulated.'
    },
    specifications: {
      frame: { value: '63M' },
      ratedOutputPower: { value: 0.12, unit: 'kW' },
      ratedLineCurrentAt400V50Hz: { value: 0.405, unit: 'A' },
      ratedVoltage: { value: '230 V Δ / 400 V Y' },
      ratedFrequency: { value: 50, unit: 'Hz' },
      ratedSpeed: { value: 1380, unit: 'rpm' },
      ratedTorque: { value: 0.83, unit: 'Nm' },
      powerFactor: { value: 0.64 },
      phaseCount: { value: 3 },
      mountingMethod: { value: 'IEC foot-mounted IM B3' },
      connectionMethod: { value: 'Six-terminal motor board; bolted winding connections' },
      supplyConnectionAt400V: { value: 'Star (Y); U2/V2/W2 linked together' }
    },
    instanceProperties: {
      terminalStrip: { type: 'string', default: '', maximumLength: 40 },
      position: { type: 'string', default: '', maximumLength: 24 },
      marking: { type: 'string', default: '', maximumLength: 40 },
      comment: { type: 'string', default: '', maximumLength: 160 }
    },
    documentation: {
      manufacturerCatalog: 'https://download.sew-eurodrive.com/download/pdf/30590116.pdf',
      installationManual: 'https://download.sew-eurodrive.com/download/pdf/25957074.pdf',
      wiringDiagram: 'https://download.sew-eurodrive.com/download/pdf/25957074.pdf',
      connectionDiagram: 'https://download.sew-eurodrive.com/download/pdf/25957074.pdf',
      diagramReference: 'Star connection for high voltage: U2/V2/W2 linked; L1/L2/L3 on U1/V1/W1.',
      ansiNfpaRepresentation: 'Not included in this IEC-oriented component record; no ANSI/NFPA-specific source representation was verified.',
      compatibleAccessories: [],
      compatibilityNote: 'No motor-specific accessory list is recorded; do not infer accessories from this base motor record.'
    },
    sources: [
      {
        publisher: 'SEW-EURODRIVE',
        title: 'DRN.. AC motors · motor data table, 400 V, 50 Hz, 4-pole',
        url: 'https://download.sew-eurodrive.com/download/pdf/30590116.pdf',
        documentRevision: 'Manufacturer catalog/document 30590116/EN, 03/2023.',
        revisionNote: 'Manufacturer table identifies DRN63MS4, 0.12 kW, 0.405 A, 1380 rpm, 0.83 Nm and power factor 0.64 for 400 V / 50 Hz operation.',
        retrievedAt: '2026-11-12'
      },
      {
        publisher: 'SEW-EURODRIVE',
        title: 'Operating Instructions · AC Motors DR..71–315, DRN63–315, DR2..56–80',
        url: 'https://download.sew-eurodrive.com/download/pdf/25957074.pdf',
        documentRevision: 'Manufacturer operating instructions 25957074/EN, 06/2019.',
        revisionNote: 'Manufacturer wiring diagrams identify U1/V1/W1, U2/V2/W2, the 400 V star connection, terminal-board wiring and PE connection.',
        retrievedAt: '2026-11-12'
      }
    ]
  });
  const siemensPowerContactorDefinition = deepFreeze(Object.assign({}, contactorDefinition, {
    id: 'siemens-3rt2026-2kb40', manufacturer: 'Siemens', manufacturerPartNumber: '3RT2026-2KB40',
    model: 'SIRIUS 3RT2026-2KB40', name: 'Three-pole power contactor · 24 V DC coil', category: 'Electrical · Verified Siemens motor-control contactor',
    symbol: Object.assign({}, contactorDefinition.symbol, { id: 'contactor.siemens-3rt2.3rt2026-2kb40.v1', numberingNote: 'A1+/A2−, 1/L1–6/T3, 13/14 (NO), and 21/22 (NC) follow the Siemens model-specific circuit diagram. Schematic terminal coordinates are connection points, not a physical footprint; contact and coil states are not simulated.' }),
    electricalFunctions: Object.assign({}, contactorDefinition.electricalFunctions, { contactor: Object.assign({}, contactorDefinition.electricalFunctions.contactor, {
      coil: { pins: ['coil-a1','coil-a2'], nominalVoltage: { value: 24, unit: 'V DC' }, polarity: { positive: 'A1', negative: 'A2' }, suppression: 'Plug-in varistor per Siemens product data sheet' },
      simulationNote: 'Main poles, auxiliary contacts, coil actuation and interlocking are not simulated. Only explicitly wired external terminals are joined in the static net model.'
    }) }),
    specifications: Object.assign({}, { mainPoleCount: {value:3}, nominalCoilVoltage: {value:24,unit:'V DC'} }, { ac3RatedCurrent: { value: 25, unit: 'A' }, ratedOperationalCurrentAC3At400V: { value: 25, unit: 'A' }, ratedMotorPowerAt400V: { value: 11, unit: 'kW' }, auxiliaryContactComposition: { value: '1 NO + 1 NC' }, frameSize: { value: 'S0' }, connectionMethod: { value: 'Spring-loaded terminal' }, coilSuppression: { value: 'Plugged-in varistor' } }),
    sources: [{ publisher: 'Siemens', title: 'SIRIUS 3RT2026-2KB40 product data sheet', url: 'https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RT2026-2KB40', documentRevision: 'Data sheet, 8 pages; retrieved 2026-11-12.', revisionNote: 'Confirms 25 A AC-3, 11 kW at 400 V, 24 V DC coil, 1 NO + 1 NC auxiliary contacts, spring terminals, S0 frame, and circuit diagram terminal labels A1+/A2−, 1/L1–6/T3, 13/14 and 21/22.', retrievedAt: '2026-11-12' }]
  }));
  const feederContactorDefinition = deepFreeze(Object.assign({}, siemensPowerContactorDefinition, {
    id: 'siemens-3rt2027-2kb40', manufacturerPartNumber: '3RT2027-2KB40', model: 'SIRIUS 3RT2027-2KB40',
    name: 'Three-pole power contactor · 32 A / 24 V DC coil',
    symbol: Object.assign({}, siemensPowerContactorDefinition.symbol, { id: 'contactor.siemens-3rt2.3rt2027-2kb40.v1', numberingNote: 'Model-specific Siemens terminal drawing, data sheet page 8: A1+/A2−, 1/L1–6/T3, 13/14 NO and 21/22 NC. Coordinates are schematic connection points, not a mounting footprint. Contact state is not simulated.' }),
    specifications: Object.assign({}, siemensPowerContactorDefinition.specifications, { ac3RatedCurrent: { value: 32, unit: 'A' }, ratedOperationalCurrentAC3At400V: { value: 32, unit: 'A' }, ratedMotorPowerAt400V: { value: 15, unit: 'kW' }, coilClosingPower: { value: 4.5, unit: 'W' }, coilHoldingPower: { value: 4.5, unit: 'W' } }),
    sources: [{ publisher: 'Siemens', title: 'SIRIUS 3RT2027-2KB40 product data sheet', url: 'https://media.distributordatasolutions.com/siemenscomplete/2021q1/documents/140fbadef58253c91d9bfa905f73b01c016bbca8.pdf', documentRevision: 'Manufacturer data sheet, 2021-01-21, 9 pages; distributor-hosted copy.', revisionNote: 'Confirms 32 A AC-3 / 15 kW at 400 V, 24 V DC coil, 4.5 W closing/holding power, 1 NO + 1 NC, S0 spring terminals and varistor. Page 8 visually verifies polarity and terminal labels. Coordination and installation suitability require separate review.', retrievedAt: '2026-11-15' }]
  }));
  const siemensOverloadRelayDefinition = deepFreeze(Object.assign({}, motorProtectionBreakerDefinition, {
    id: 'siemens-3ru2126-4ab0', manufacturerPartNumber: '3RU2126-4AB0', model: 'SIRIUS 3RU2126-4AB0',
    name: 'Thermal overload relay · 11–16 A', family: 'motor-overload-relay', category: 'Electrical · Verified thermal overload relay',
    symbol: Object.assign({}, motorProtectionBreakerDefinition.symbol, { id: 'overload.siemens-3ru2.3ru2126-4ab0.v1', width: 280,
      pins: motorProtectionBreakerDefinition.symbol.pins.concat([
        { id: 'aux-95', localNumber: '95', name: 'Normally-closed trip contact common', x: 90, y: -20, electricalType: 'passive', connectionType: 'screw' },
        { id: 'aux-96', localNumber: '96', name: 'Normally-closed trip contact output', x: 90, y: -5, electricalType: 'passive', connectionType: 'screw' },
        { id: 'aux-97', localNumber: '97', name: 'Normally-open trip contact common', x: 90, y: 15, electricalType: 'passive', connectionType: 'screw' },
        { id: 'aux-98', localNumber: '98', name: 'Normally-open trip contact output', x: 90, y: 30, electricalType: 'passive', connectionType: 'screw' }
      ]),
      numberingNote: 'Main circuit terminals 1/L1, 3/L2, 5/L3 and 2/T1, 4/T2, 6/T3; auxiliary trip contact 95/96 (NC) and 97/98 (NO) follow Siemens SIRIUS 3RU2 wiring diagrams. The model does not infer internal conductive links or trip state.'
    }),
    electricalFunctions: { motorOverloadProtection: { lineTerminals: ['line-l1','line-l2','line-l3'], loadTerminals: ['load-t1','load-t2','load-t3'], tripContacts: [{ pins: ['aux-95','aux-96'], type: 'NC' }, { pins: ['aux-97','aux-98'], type: 'NO' }], simulationNote: 'Thermal response, reset, trip timing and motor protection are not simulated. The adjustable range alone does not establish application suitability or a selected setting.' } },
    specifications: { productFamily: { value: 'SIRIUS 3RU2' }, frameSize: { value: 'S0' }, overloadTripClass: { value: 10, unit: 'Class' }, adjustableOverloadRelease: { minimum: 11, maximum: 16, unit: 'A' }, mainPoleCount: { value: 3 }, ratedOperationalVoltage: { minimum: 20, maximum: 690, unit: 'V AC' }, connectionMethod: { value: 'Screw terminals' }, resetMode: { value: 'Manual / automatic selectable' }, referenceCode: { value: 'F' } },
    instanceProperties: Object.assign({}, motorProtectionBreakerDefinition.instanceProperties, { overloadSettingA: { type: 'number', default: null, minimum: 11, maximum: 16, step: 'any' } }),
    sources: [
      { publisher: 'Siemens', title: 'SIRIUS 3RU2126-4AB0 product data sheet', url: 'https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RU2126-4AB0', documentRevision: 'Data sheet, 5 pages; retrieved 2026-11-12.', revisionNote: 'Confirms thermal overload relay, 11–16 A adjustable range, three poles, S0, Class 10, screw terminals, contactor mounting and manual/automatic reset.', retrievedAt: '2026-11-12' },
      { publisher: 'Siemens', title: 'SIRIUS 3RU / 3RB overload relays · Equipment Manual', url: 'https://support.industry.siemens.com/cs/attachments/60298164/manual_SIRIUS_overload_relay_3RU_3RB_en-US.pdf', documentRevision: 'Equipment Manual, 07/2024, A5E03656507420A/RS-AF/007.', revisionNote: 'Figure 13-3 identifies the S0 3RU2 main terminals and 95/96 and 97/98 auxiliary contacts.', retrievedAt: '2026-11-12' }
    ]
  }));
  const feederOverloadRelayDefinition = deepFreeze(Object.assign({}, siemensOverloadRelayDefinition, {
    id: 'siemens-3ru2126-4bb0', manufacturerPartNumber: '3RU2126-4BB0', model: 'SIRIUS 3RU2126-4BB0',
    name: 'Thermal overload relay · 14–20 A',
    symbol: Object.assign({}, siemensOverloadRelayDefinition.symbol, { id: 'overload.siemens-3ru2.3ru2126-4bb0.v1' }),
    specifications: Object.assign({}, siemensOverloadRelayDefinition.specifications, { adjustableOverloadRelease: { minimum: 14, maximum: 20, unit: 'A' } }),
    instanceProperties: Object.assign({}, siemensOverloadRelayDefinition.instanceProperties, { overloadSettingA: { type: 'number', default: null, minimum: 14, maximum: 20, step: 'any' } }),
    sources: [
      { publisher: 'Siemens', title: 'SIRIUS 3RU2126-4BB0 product data sheet', url: 'https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RU2126-4BB0', documentRevision: 'Data sheet, 2026-01-27.', revisionNote: 'Confirms 14–20 A thermal overload range, Class 10, S0, screw terminals, contactor mounting and manual/automatic reset. Application coordination must be verified separately.', retrievedAt: '2026-11-15' },
      siemensOverloadRelayDefinition.sources[1]
    ]
  }));
  const feederMagneticBreakerDefinition = deepFreeze(Object.assign({}, motorProtectionBreakerDefinition, {
    id: 'siemens-3rv2321-4bc10', manufacturerPartNumber: '3RV2321-4BC10', model: 'SIRIUS 3RV2321-4BC10',
    name: 'Starter-combination magnetic circuit breaker · 20 A', family: 'magnetic-starter-breaker', category: 'Electrical · Verified magnetic-only starter breaker',
    symbol: Object.assign({}, motorProtectionBreakerDefinition.symbol, {
      id: 'breaker.sirius-3rv2.3rv2321-4bc10.v1',
      representation: { standard: 'IEC-style functional representation', text: 'I>', symbolType: 'Three-pole magnetic-only starter circuit breaker; schematic coordinates, not a mounting footprint' },
      numberingNote: 'Siemens model-specific data sheet circuit diagram: 1/L1–2/T1, 3/L2–4/T2, 5/L3–6/T3. No thermal overload protection or built-in auxiliary contacts. No contact state is inferred.'
    }),
    electricalFunctions: { magneticShortCircuitProtection: {
      lineTerminals: ['line-l1','line-l2','line-l3'], loadTerminals: ['load-t1','load-t2','load-t3'],
      simulationNote: 'Magnetic short-circuit protection only. Requires separate overload protection and coordinated application selection. Switching, interruption and protection operation are not simulated.'
    } },
    specifications: { productFamily: { value: 'SIRIUS 3RV2' }, frameSize: { value: 'S0' }, ratedOperationalCurrent: { value: 20, unit: 'A' }, instantaneousShortCircuitRelease: { value: 260, unit: 'A' }, thermalOverloadProtection: { value: false }, mainPoleCount: { value: 3 }, icuAt400V: { value: 55, unit: 'kA' }, icsAt400V: { value: 25, unit: 'kA' }, connectionMethod: { value: 'Screw terminals' } },
    instanceProperties: { position: { type: 'string', default: '', maximumLength: 24 }, marking: { type: 'string', default: '', maximumLength: 40 }, comment: { type: 'string', default: '', maximumLength: 160 } },
    sources: [{ publisher: 'Siemens', title: '3RV2321-4BC10 product data sheet', url: 'https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2321-4BC10', documentRevision: 'Data sheet, 2026-11-12, 7 pages.', revisionNote: 'Confirms 20 A, 260 A magnetic release, no thermal overload protection, 55 kA Icu and 25 kA Ics at 400 V, S0 screw terminals; pages 6–7 identify all six main terminals. Ratings are not an installation fault-current assessment.', retrievedAt: '2026-11-15' }]
  }));
  const starDeltaMotorProtectionBreakerDefinition = deepFreeze(Object.assign({}, motorProtectionBreakerDefinition, {
    id: 'siemens-3rv2021-4aa10', manufacturerPartNumber: '3RV2021-4AA10', model: 'SIRIUS 3RV2021-4AA10', name: 'Motor-protection circuit breaker · 10–16 A',
    symbol: Object.assign({}, motorProtectionBreakerDefinition.symbol, { id: 'breaker.sirius-3rv2.3rv2021-4aa10.v1' }),
    specifications: Object.assign({}, motorProtectionBreakerDefinition.specifications, { adjustableOverloadRelease: { minimum: 10, maximum: 16, unit: 'A' }, instantaneousShortCircuitRelease: { value: 208, unit: 'A' }, ratedOperationalCurrent: { value: 16, unit: 'A' } }),
    instanceProperties: Object.assign({}, motorProtectionBreakerDefinition.instanceProperties, { overloadSettingA: { type: 'number', default: null, minimum: 10, maximum: 16, step: 'any' } }),
    sources: [
      { publisher: 'Siemens', title: 'SIRIUS 3RV2021-4AA10 product data sheet', url: 'https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2021-4AA10', documentRevision: 'Product data sheet, 6 pages; retrieved 2026-11-12.', revisionNote: 'Confirms size S0, Class 10, 10–16 A adjustable overload release, 208 A instantaneous N-release, three poles and 690 V rated insulation.', retrievedAt: '2026-11-12' },
      motorProtectionBreakerDefinition.sources[1]
    ]
  }));
  const sewStarDeltaMotorDefinition = deepFreeze(Object.assign({}, motorDefinition, {
    id: 'sew-eurodrive-drn132m4', manufacturerPartNumber: 'DRN132M4', model: 'DRN132M4', name: 'Three-phase AC induction motor · 400 V Δ / 690 V Y',
    category: 'Electrical · Verified 3-phase star-delta motor',
    symbol: Object.assign({}, motorDefinition.symbol, { id: 'motor.induction.drn132m4.v1', numberingNote: 'U1/V1/W1 and U2/V2/W2 are the six winding ends; PE is protective earth. SEW standard-voltage table specifies 400 V Δ / 690 V Y for DRN132M–DRN315 at 50 Hz.' }),
    electricalFunctions: Object.assign({}, motorDefinition.electricalFunctions, {
      statorWindings: [{ lineEnd: 'winding-u1', starEnd: 'winding-u2' }, { lineEnd: 'winding-v1', starEnd: 'winding-v2' }, { lineEnd: 'winding-w1', starEnd: 'winding-w2' }],
      terminalBoard: { connection: '400 V Δ / 690 V Y at 50 Hz', phaseInputs: ['winding-u1','winding-v1','winding-w1'], starPoint: ['winding-u2','winding-v2','winding-w2'], protectiveEarth: 'protective-earth' }
    }),
    specifications: { frame: { value: '132M' }, ratedOutputPower: { value: 7.5, unit: 'kW' }, ratedLineCurrentAt400V50Hz: { value: 15.2, unit: 'A' }, ratedVoltage: { value: '400 V Δ / 690 V Y' }, ratedFrequency: { value: 50, unit: 'Hz' }, ratedSpeed: { value: 1468, unit: 'rpm' }, ratedTorque: { value: 49, unit: 'Nm' }, powerFactor: { value: 0.78 }, phaseCount: { value: 3 }, mountingMethod: { value: 'IEC frame 132M; mounting variant not specified' }, connectionMethod: { value: 'Six-terminal motor board; bolted winding connections' }, supplyConnectionAt400V: { value: 'Delta (Δ) after star-delta transition' } },
    sources: [
      { publisher: 'SEW-EURODRIVE', title: 'DRN.. motor data table · 400 V / 50 Hz / 4-pole', url: 'https://download.sew-eurodrive.com/download/pdf/30590116.pdf', documentRevision: 'Manufacturer document 30590116/EN, 03/2023.', revisionNote: 'Motor table records DRN132M4, 7.5 kW, 15.2 A, 1468 rpm, 49 Nm and power factor 0.78 at 400 V / 50 Hz.', retrievedAt: '2026-11-12' },
      { publisher: 'SEW-EURODRIVE', title: 'DRN.. AC motors · standard-voltage table', url: 'https://download.sew-eurodrive.com/download/pdf/30590116.pdf', documentRevision: 'Manufacturer document 30590116/EN, 03/2023.', revisionNote: 'Standard voltage table assigns 400 V Δ / 690 V Y at 50 Hz to DRN132M–DRN315 (7.5–200 kW).', retrievedAt: '2026-11-12' },
      { publisher: 'SEW-EURODRIVE', title: 'AC Motors DR..71–315, DRN63–315 · Operating Instructions', url: 'https://download.sew-eurodrive.com/download/pdf/25957074.pdf', documentRevision: 'Manufacturer operating instructions 25957074/EN, 06/2019.', revisionNote: 'Wiring diagrams identify the six winding ends U1/V1/W1, U2/V2/W2 and PE.', retrievedAt: '2026-11-12' }
    ]
  }));
  const siemensStarDeltaTimerDefinition = deepFreeze({
    schemaVersion: COMPONENT_SCHEMA_VERSION, id: 'siemens-3rp2576-2nw30', manufacturer: 'Siemens', manufacturerPartNumber: '3RP2576-2NW30',
    model: 'SIRIUS 3RP2576-2NW30', name: 'Star-delta timing relay · 3–60 s', family: 'star-delta-timer', referencePrefix: 'K', category: 'Electrical · Verified star-delta timing relay',
    symbol: { id: 'timer.siemens.3rp2576-2nw30.v1', view: 'schematic', unit: 'mm', width: 150, height: 90, representation: { standard: 'IEC functional relay diagram', text: 'Y / Δ', symbolType: 'star-delta timing relay with shared output common' }, pins: [
      { id: 'supply-a1', localNumber: 'A1', name: 'Control supply A1', x: -75, y: -25, electricalType: 'passive', connectionType: 'push-in' },
      { id: 'supply-a2', localNumber: 'A2', name: 'Control supply A2', x: -75, y: 25, electricalType: 'passive', connectionType: 'push-in' },
      { id: 'contact-common-17', localNumber: '17', name: 'Shared output contact common', x: 75, y: -25, electricalType: 'passive', connectionType: 'push-in' },
      { id: 'star-output-18', localNumber: '18', name: 'Instantaneous star output', x: 75, y: 0, electricalType: 'passive', connectionType: 'push-in' },
      { id: 'delta-output-28', localNumber: '28', name: 'Time-delayed delta output', x: 75, y: 25, electricalType: 'passive', connectionType: 'push-in' }
    ], internalConnections: [], numberingNote: 'A1/A2 supply and 17 shared common with 18 instantaneous star and 28 delayed delta follow the Siemens model-specific data sheet. These external pins do not imply simulated contact state.' },
    electricalFunctions: { starDeltaTiming: { supplyPins: ['supply-a1','supply-a2'], sharedOutputCommon: 'contact-common-17', instantaneousStarOutput: 'star-output-18', delayedDeltaOutput: 'delta-output-28', timeRangeSeconds: { minimum: 3, maximum: 60 }, changeoverDelayMilliseconds: 50, note: 'Siemens specifies a 50 ms star-to-delta changeover delay to prevent phase-to-phase shorts. Relay switching is not simulated.' } },
    specifications: { function: { value: 'Star-delta (wye-delta) timing relay' }, outputContacts: { value: '2 NO with shared root' }, timeRangeSeconds: { minimum: 3, maximum: 60, unit: 's' }, controlSupply: { minimum: 12, maximum: 240, unit: 'V AC/DC' }, changeoverDelay: { value: 50, unit: 'ms' }, connectionMethod: { value: 'Spring-type push-in terminal' } },
    instanceProperties: { delaySeconds: { type: 'number', default: null, minimum: 3, maximum: 60, step: 'any' }, terminalStrip: { type: 'string', default: '', maximumLength: 40 }, position: { type: 'string', default: '', maximumLength: 24 }, marking: { type: 'string', default: '', maximumLength: 40 }, comment: { type: 'string', default: '', maximumLength: 160 } },
    sources: [
      { publisher: 'Siemens', title: 'SIRIUS 3RP2576-2NW30 product data sheet', url: 'https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RP25762NW30', documentRevision: 'Data sheet, 6 pages; retrieved 2026-11-12.', revisionNote: 'Confirms 3–60 s star-delta function, 12–240 V AC/DC supply, two NO contacts and terminal identifiers A1, A2, 17, 18 and 28.', retrievedAt: '2026-11-12' },
      { publisher: 'Siemens', title: 'SIRIUS 3RP25 Time Relays · Equipment Manual', url: 'https://support.industry.siemens.com/cs/attachments/103532830/manual_3RP25_time_relay_en-US.pdf', documentRevision: 'Equipment Manual, 09/2019, A5E31947765002A/RS-AC/003.', revisionNote: 'Section 6.6 documents shared-root instantaneous star and delayed delta outputs and the 50 ms transition pause.', retrievedAt: '2026-11-12' }
    ]
  });
  const siemensCpuPinRows = [
    ['X10', '1', 'L+ / 24 V DC'], ['X10', '2', 'M / 24 V DC'], ['X10', '3', 'Functional Earth'],
    ['X10', '4', 'L+ / 24 V DC Sensor Out'], ['X10', '5', 'M / 24 V DC Sensor Out'], ['X10', '6', '1M'],
    ['X10', '7', 'DI a.0'], ['X10', '8', 'DI a.1'], ['X10', '9', 'DI a.2'], ['X10', '10', 'DI a.3'],
    ['X10', '11', 'DI a.4'], ['X10', '12', 'DI a.5'], ['X10', '13', 'DI a.6'], ['X10', '14', 'DI a.7'],
    ['X11', '1', '2M'], ['X11', '2', 'AI 0'], ['X11', '3', 'AI 1'],
    ['X12', '1', '3L+'], ['X12', '2', '3M'], ['X12', '3', 'DQ a.0'], ['X12', '4', 'DQ a.1'],
    ['X12', '5', 'DQ a.2'], ['X12', '6', 'DQ a.3'], ['X12', '7', 'DQ a.4'], ['X12', '8', 'DQ a.5']
  ];
  const siemensCpuPins = siemensCpuPinRows.map(function (row, index) {
    const group = row[0], groupIndex = siemensCpuPinRows.slice(0, index).filter(function (item) { return item[0] === group; }).length;
    const y = group === 'X10' ? -126 + groupIndex * 18 : group === 'X11' ? -126 + groupIndex * 18 : -8 + groupIndex * 16;
    return { id: group.toLowerCase() + '-' + row[1], localNumber: group + ':' + row[1], name: row[2], x: group === 'X10' ? -130 : 130, y: y, electricalType: 'passive', connectionType: 'plug-in terminal' };
  });
  const siemensCpuDefinition = deepFreeze({
    schemaVersion: COMPONENT_SCHEMA_VERSION, id: 'siemens-6es7212-1ae40-0xb0', manufacturer: 'Siemens', manufacturerPartNumber: '6ES7212-1AE40-0XB0',
    model: 'SIMATIC S7-1200 CPU 1212C DC/DC/DC', name: 'Compact PLC CPU', family: 'plc-cpu', referencePrefix: 'A', category: 'Automation · Verified PLC CPU',
    symbol: { id: 'plc.siemens.cpu-1212c.dcdcdc.v2', view: 'schematic', unit: 'mm', width: 260, height: 290, pins: siemensCpuPins, internalConnections: [], numberingNote: 'Terminal groups match Siemens CPU 1212C DC/DC/DC connector table 6. X12 labels were corrected from the relay variant on 2026-11-14: pins 1/2 are 3L+/3M and pins 3–8 are DQ a.0–a.5. Existing physical pin identities are preserved; review earlier output wiring against these corrected functions. Coordinates are schematic, not physical connector geometry.' },
    specifications: {
      onboardDigitalInputs: { value: 8, unit: '24 V DC DI' }, onboardDigitalOutputs: { value: 6, unit: '24 V DC transistor DQ' }, onboardAnalogInputs: { value: 2, unit: '0–10 V DC AI' },
      supplyVoltage: { minimum: 20.4, maximum: 28.8, unit: 'V DC' }, programDataMemory: { value: 100, unit: 'KB' },
      terminalGroups: { value: ['X10 · power, sensor supply and 8 DI', 'X11 · 2 AI and 2M', 'X12 · 6 DQ and load supplies'] }
    },
    instanceProperties: { marking: { type: 'string', default: '', maximumLength: 40 }, position: { type: 'string', default: '', maximumLength: 24 }, comment: { type: 'string', default: '', maximumLength: 160 } },
    sources: [
      { publisher: 'Siemens', title: 'CPU 1212C wiring diagrams · DC/DC/DC · Tables 5 and 6', url: 'https://docs.tia.siemens.cloud/r/simatic_s7_1200_manual_collection_enus_20/technical-specifications/cpu-1212c/cpu-1212c-wiring-diagrams', documentRevision: 'V20 · 11/2024', revisionNote: 'Exact connector assignments for 6ES7212-1AE40-0XB0. DC/DC/DC X12 is 3L+, 3M, then six DQ terminals; do not use the DC/DC/Relay table.' , retrievedAt: '2026-11-14' },
      { publisher: 'Siemens', title: 'SIMATIC S7-1200 CPU 1212C product record', url: 'https://mall.industry.siemens.com/mall/en/gb/Catalog/Product/6ES72121AE400XB0', documentRevision: 'Live manufacturer product record', revisionNote: 'Confirms onboard I/O counts and DC supply range.', retrievedAt: '2026-11-12' }
    ]
  });
  const ifmInductiveSensorDefinition = deepFreeze({
    schemaVersion: COMPONENT_SCHEMA_VERSION, id: 'ifm-ifs204', manufacturer: 'ifm', manufacturerPartNumber: 'IFB3004BBPKG/US-104', model: 'IFS204', name: 'Inductive proximity sensor · PNP NO · 4 mm', family: 'sensor-inductive-pnp', referencePrefix: 'B', category: 'Automation · Verified inductive sensor',
    symbol: { id: 'sensor.ifm.ifs204.pnp-no.v1', view: 'schematic', unit: 'mm', width: 100, height: 70, pins: [
      { id: 'pin-1-lplus', localNumber: '1', name: 'L+ · brown', x: -50, y: -20, electricalType: 'passive', connectionType: 'M12 A-coded' },
      { id: 'pin-3-lminus', localNumber: '3', name: 'L− · blue', x: -50, y: 20, electricalType: 'passive', connectionType: 'M12 A-coded' },
      { id: 'pin-4-output', localNumber: '4', name: 'Switching output · black', x: 50, y: 0, electricalType: 'passive', connectionType: 'M12 A-coded' }
    ], internalConnections: [], numberingNote: 'Pin numbers and wire colors follow the ifm connection diagram. Pin 2 is not a populated contact on this 3-contact connector.' },
    electricalFunctions: { output: { type: 'PNP', normalState: 'open', outputPin: 'pin-4-output', positiveSupplyPin: 'pin-1-lplus', returnPin: 'pin-3-lminus', actuation: 'Object detection within the specified sensing range', simulation: 'Sensor actuation and PLC logic are not simulated; the drawing represents wiring and published device behavior only.' } },
    specifications: { operatingVoltage: { minimum: 10, maximum: 30, unit: 'V DC' }, nominalSensingRange: { value: 4, unit: 'mm' }, outputFunction: { value: 'PNP normally open' }, maximumOutputCurrent: { value: 100, unit: 'mA' }, maximumSwitchingFrequency: { value: 700, unit: 'Hz' }, connection: { value: 'M12 × 1 · A-coded · 3 gold-plated contacts' }, protection: { value: 'IP67' } },
    instanceProperties: { marking: { type: 'string', default: '', maximumLength: 40 }, position: { type: 'string', default: '', maximumLength: 24 }, sensingTarget: { type: 'string', default: '', maximumLength: 60 }, comment: { type: 'string', default: '', maximumLength: 160 } },
    sources: [{ publisher: 'ifm electronic', title: 'IFS204 inductive sensor data sheet · IFB3004BBPKG/US-104', url: 'https://media.ifm.com/dam/546f88cf-4cdf-47ac-b6ee-bee685c33458/Original/IFS204-02_EN-GB.pdf', documentRevision: 'EN-GB · IFS204-02 · 26.06.2025', revisionNote: 'Manufacturer data sheet verifies PNP normally-open output, 4 mm nominal sensing range, 10–30 V DC and the 3-contact M12 connection. Pin 1=L+, pin 3=L−, pin 4=output per manufacturer connection drawing.', retrievedAt: '2026-11-12' }]
  });
  const ifmPressureSensorDefinition = deepFreeze({
    schemaVersion: COMPONENT_SCHEMA_VERSION, id: 'ifm-pn2070', manufacturer: 'ifm electronic', manufacturerPartNumber: 'PN-400-SER14-MFRKG/US/ /V', model: 'PN2070', name: 'Pressure sensor · 0–400 bar · configurable analog output', family: 'sensor-pressure-analog', referencePrefix: 'B', category: 'Automation · Verified pressure sensor',
    symbol: { id: 'sensor.ifm.pn2070.analog.v1', view: 'schematic', unit: 'mm', width: 130, height: 100, pins: [
      { id: 'pin-1-lplus', localNumber: '1', name: 'L+ · BN brown', x: -65, y: -25, electricalType: 'passive', connectionType: 'M12 × 1 · A-coded · 4-pin' },
      { id: 'pin-2-out2', localNumber: '2', name: 'OUT2 · WH white · analog output', x: 65, y: -25, electricalType: 'passive', connectionType: 'M12 × 1 · A-coded · 4-pin' },
      { id: 'pin-3-lminus', localNumber: '3', name: 'L− · BU blue', x: -65, y: 25, electricalType: 'passive', connectionType: 'M12 × 1 · A-coded · 4-pin' },
      { id: 'pin-4-out1', localNumber: '4', name: 'OUT1 · BK black · switching / IO-Link', x: 65, y: 25, electricalType: 'passive', connectionType: 'M12 × 1 · A-coded · 4-pin' }
    ], internalConnections: [], numberingNote: 'ifm connection diagram: pin 1 BN=L+, pin 2 WH=OUT2, pin 4 BK=OUT1, pin 3 BU=L−. OUT2 is configurable as 4–20 mA or 0–10 V; ifm lists 4–20 mA as factory default. Pin coordinates are schematic points, not physical connector geometry.' },
    electricalFunctions: { analogOutput: { outputPin: 'pin-2-out2', supplyPin: 'pin-1-lplus', returnPin: 'pin-3-lminus', digitalOutputPin: 'pin-4-out1', factoryConfiguration: '4–20 mA; verify actual device setting', voltageRange: '0–10 V DC · scalable 1:5', currentRange: '4–20 mA · scalable 1:5', simulation: 'Pressure sensing, analog conversion, calibration and device configuration are not simulated.' } },
    specifications: {
      measuringRange: { minimum: 0, maximum: 400, unit: 'bar relative pressure' }, operatingVoltage: { minimum: 18, maximum: 30, unit: 'V DC' },
      analogVoltageOutput: { minimum: 0, maximum: 10, unit: 'V DC · scalable 1:5' }, analogCurrentOutput: { minimum: 4, maximum: 20, unit: 'mA · scalable 1:5' },
      voltageOutputMinimumLoad: { value: 2000, unit: 'Ω' }, currentOutputMaximumLoad: { value: 500, unit: 'Ω' }, processConnection: { value: 'G 1/4 internal thread' },
      electricalConnection: { value: 'M12 × 1 · A-coded · 4-pin' }, currentConsumption: { value: '<35', unit: 'mA' }
    },
    instanceProperties: { marking: { type: 'string', default: '', maximumLength: 40 }, position: { type: 'string', default: '', maximumLength: 24 }, processPoint: { type: 'string', default: '', maximumLength: 60 }, signalConfigurationNote: { type: 'string', default: '', maximumLength: 100 }, comment: { type: 'string', default: '', maximumLength: 160 } },
    sources: [
      { publisher: 'ifm electronic', title: 'PN2070 · PN-400-SER14-MFRKG/US/ /V product data', url: 'https://www.ifm.com/ae/en/product/PN2070', documentRevision: 'PN2070-02 · 2024-03-01', revisionNote: 'Manufacturer lists the exact product variant, 0–400 bar relative range, 18–30 V DC supply, configurable 0–10 V / 4–20 mA output, G 1/4 process connection and M12 connector.', retrievedAt: '2026-11-12' },
      { publisher: 'ifm electronic', title: 'PN2070 data sheet and connection diagram', url: 'https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf', documentRevision: 'PN2070-02 · 2024-03-01', revisionNote: 'Connection diagram maps pins 1/BN=L+, 2/WH=OUT2, 4/BK=OUT1 and 3/BU=L−. Voltage output minimum load is 2000 Ω; current output maximum load is 500 Ω.', retrievedAt: '2026-11-12' },
      { publisher: 'ifm electronic', title: 'PN pressure sensor programming guide', url: 'https://www.ifm.com/us/en/us/learn-more/pressure/pn/programming', documentRevision: 'Current manufacturer web guide', revisionNote: 'ifm states OUT2 is factory-configured for current; output mode and analog endpoints require device configuration.', retrievedAt: '2026-11-12' }
    ]
  });
  const siemensSitopPsuDefinition = deepFreeze({
    schemaVersion: COMPONENT_SCHEMA_VERSION, id: 'siemens-sitop-psu100c-6ep1332-5ba00', manufacturer: 'Siemens', manufacturerPartNumber: '6EP1332-5BA00',
    model: 'SITOP PSU100C · 24 V/2.5 A', name: 'Single-phase AC/DC power supply', family: 'power-supply-ac-dc', referencePrefix: 'PS', category: 'Power · Verified supply',
    symbol: { id: 'power.siemens.sitop-psu100c.v1', view: 'schematic', unit: 'mm', width: 180, height: 160, pins: [
      { id: 'line-l', localNumber: 'L', name: 'Line input L', x: -90, y: -30, electricalType: 'passive', connectionType: 'screw terminal' },
      { id: 'line-n', localNumber: 'N', name: 'Line input N', x: -90, y: 0, electricalType: 'passive', connectionType: 'screw terminal' },
      { id: 'line-pe', localNumber: 'PE', name: 'Protective earth input', x: -90, y: 30, electricalType: 'passive', connectionType: 'screw terminal' },
      { id: 'output-positive', localNumber: '+', name: '24 V DC positive output', x: 90, y: -30, electricalType: 'passive', connectionType: 'screw terminal' },
      { id: 'output-negative', localNumber: '-', name: 'DC return output', x: 90, y: 30, electricalType: 'passive', connectionType: 'screw terminal' }
    ], internalConnections: [], numberingNote: 'Manufacturer terminal designations L, N, PE, + and − are retained. Siemens specifies two physical − output screw terminals; this schematic symbol represents their shared return as one functional pin. Pin coordinates are schematic connection points, not physical terminal geometry.' },
    electricalFunctions: { supply: { input: 'Single-phase AC or DC', output: '24 V DC', ratedOutputCurrent: '2.5 A', simulation: 'Power conversion, startup, protection response and isolation behavior are not simulated; input and output pins remain separate electrical endpoints.' } },
    specifications: {
      acInputVoltage: { minimum: 85, maximum: 264, unit: 'V AC' }, dcInputVoltage: { minimum: 110, maximum: 300, unit: 'V DC' },
      outputVoltage: { value: 24, unit: 'V DC' }, ratedOutputCurrent: { value: 2.5, unit: 'A' },
      inputConnections: { value: 'L, N, PE · one screw terminal each' }, outputConnections: { value: '+ · one screw terminal; − · two screw terminals' },
      connectionSystem: { value: 'Screw terminal' }, mounting: { value: 'EN 60715 35 × 7.5/15 mm rail' }, degreeOfProtection: { value: 'IP20' }
    },
    instanceProperties: { marking: { type: 'string', default: '', maximumLength: 40 }, position: { type: 'string', default: '', maximumLength: 24 }, comment: { type: 'string', default: '', maximumLength: 160 } },
    sources: [{ publisher: 'Siemens', title: 'SITOP PSU100C operating instructions · 6EP1332-5BA00', url: 'https://support.industry.siemens.com/cs/attachments/65647808/PSU100C_Handbuch_englisch_en-US.pdf', documentRevision: 'C98130-A7599-A1-2-762937 · 06/2013', revisionNote: 'Manufacturer sections 2.2 and 6.1–6.7 identify L/N/PE line input, + and − DC output, 85–264 V AC / 110–300 V DC input ranges, 24 V/2.5 A output and two physical − output screw terminals. Schematic coordinates are not physical geometry.', retrievedAt: '2026-11-12' }]
  });
  const phoenixProtectiveEarthTerminalDefinition = deepFreeze({
    schemaVersion: COMPONENT_SCHEMA_VERSION, id: 'phoenix-contact-3212147', manufacturer: 'Phoenix Contact', manufacturerPartNumber: '3212147',
    model: 'PT 16 N-PE', name: 'Protective-conductor terminal block', family: 'protective-earth-terminal', referencePrefix: 'X', category: 'Electrical · Verified protective-earth terminal',
    symbol: { id: 'terminal.phoenix.pt16npe.2-connection.v1', view: 'schematic', unit: 'mm', width: 70, height: 36, pins: [
      { id: 'connection-1', localNumber: '1', name: 'PE connection 1 · model-local index', x: -35, y: 0, electricalType: 'passive', connectionType: 'push-in' },
      { id: 'connection-2', localNumber: '2', name: 'PE connection 2 · model-local index', x: 35, y: 0, electricalType: 'passive', connectionType: 'push-in' }
    ], internalConnections: [['connection-1', 'connection-2']], numberingNote: 'Phoenix Contact specifies two connections and a grounding foot but does not assign terminal numbers; 1 and 2 are model-local connection indexes. The rail bonding foot is not modeled as a separate pin.' },
    specifications: {
      ratedCrossSection: { value: 16, unit: 'mm²' }, rigidConductorRange: { minimum: 0.5, maximum: 25, unit: 'mm²' },
      flexibleConductorRange: { minimum: 0.5, maximum: 25, unit: 'mm²' }, connectionCount: { value: 2, unit: 'connections' },
      connectionMethod: { value: 'Push-in' }, productStandard: { value: 'IEC 60947-7-2' }, groundingFoot: { value: true },
      mountingRails: { value: ['NS 35/7.5', 'NS 35/15'] }, color: { value: 'Green-yellow' }
    },
    instanceProperties: { terminalStrip: { type: 'string', default: '', maximumLength: 40 }, position: { type: 'string', default: '', maximumLength: 24 }, marking: { type: 'string', default: '', maximumLength: 40 }, comment: { type: 'string', default: '', maximumLength: 160 } },
    sources: [{ publisher: 'Phoenix Contact', title: 'PT 16 N-PE · Protective conductor terminal block · Item 3212147', url: 'https://www.phoenixcontact.com/en-nl/products/ground-terminal-pt-16-n-pe-3212147', documentRevision: 'Live manufacturer product data · retrieved 2026-11-12', revisionNote: 'Manufacturer specifies two push-in connections, 16 mm² rated cross-section, 0.5–25 mm² conductor range, IEC 60947-7-2, green-yellow color and a grounding foot. It does not number the connection points.' , retrievedAt: '2026-11-12' }]
  });
  const phoenixPeRailViewDefinition=deepFreeze(Object.assign({},phoenixProtectiveEarthTerminalDefinition,{
    id:'phoenix-contact-3212147-rail-view',name:'PT 16 N-PE · explicit grounding-foot schematic view',
    symbol:Object.assign({},phoenixProtectiveEarthTerminalDefinition.symbol,{
      id:'terminal.phoenix.pt16npe.rail-view.v1',height:80,
      pins:phoenixProtectiveEarthTerminalDefinition.symbol.pins.concat([{id:'rail-foot',localNumber:'RAIL',name:'Grounding foot · mounting interface, not a wire terminal',x:0,y:40,electricalType:'passive',connectionType:'grounding-foot'}]),
      internalConnections:[['connection-1','connection-2'],['connection-1','rail-foot']],
      numberingNote:'Two manufacturer wire connections plus an explicitly modeled conductive grounding foot. 1/2 and RAIL are model-local labels, not manufacturer numbering. RAIL is a mounting interface, not a third conductor clamp. Rail continuity and current capacity require installation verification; unrelated terminals are not automatically bonded.'
    }),
    sources:phoenixProtectiveEarthTerminalDefinition.sources.concat([{publisher:'Phoenix Contact',title:'PT 16 N-PE connection data — grounding foot and rail capacity',url:'https://www.phoenixcontact.com/en-nl/products/ground-terminal-pt-16-n-pe-3212147',documentRevision:'Live product data reviewed 2026-11-15',revisionNote:'Grounding foot: Yes; two push-in connections; manufacturer instructs observing DIN-rail current capacity. Explicit rail-foot schematic endpoint is a model representation, not an additional wire terminal.',retrievedAt:'2026-11-15'}])
  }));
  function screwTerminalDefinition(part, model, voltage, current, section, minimum, maximum, flexibleMaximum, width, height, depth7, depth15, url) {
    return deepFreeze(Object.assign({}, terminalDefinition, {
      id:'phoenix-contact-'+part,manufacturerPartNumber:part,model:model,name:model+' screw feed-through terminal block',
      symbol:Object.assign({},terminalDefinition.symbol,{id:'terminal.phoenix.'+part+'.v1',pins:terminalDefinition.symbol.pins.map(function(pin){return Object.assign({},pin,{connectionType:'screw'});})}),
      specifications:{nominalVoltage:{value:voltage,unit:'V'},nominalCurrent:{value:current,unit:'A'},ratedCrossSection:{value:section,unit:'mm²'},rigidConductorRange:{minimum:minimum,maximum:maximum,unit:'mm²'},flexibleConductorRange:{minimum:minimum,maximum:flexibleMaximum,unit:'mm²'},connectionCount:{value:2,unit:'connections'},connectionMethod:{value:'Screw connection'},productStandard:{value:'IEC 60947-7-1'},mountingRails:{value:part==='3004362'?['NS 35/7.5','NS 35/15','NS 32']:['NS 35/7.5','NS 35/15']},dimensions:{width:{value:width,unit:'mm'},height:{value:height,unit:'mm'},depthOnNS35_7_5:{value:depth7,unit:'mm'},depthOnNS35_15:{value:depth15,unit:'mm'}},color:{value:'Gray (RAL 7042)'}},
      sources:[{publisher:'Phoenix Contact',title:model+' · Feed-through terminal block · '+part,url:url,documentRevision:'Live manufacturer product record',revisionNote:'Two screw connections at one potential. Connection IDs 1 and 2 are model-local, not manufacturer terminal numbers. Ratings are nominal IEC data; approvals and conductor preparation have separate limits. Symbol coordinates are schematic, not physical.',retrievedAt:'2026-11-14'}]
    }));
  }
  const uk5TerminalDefinition=screwTerminalDefinition('3004362','UK 5 N',800,32,4,0.2,6,4,6.2,42.5,47,54.5,'https://www.phoenixcontact.com/en-us/products/feed-through-terminal-block-uk-5-n-3004362');
  const ut25TerminalDefinition=screwTerminalDefinition('3044076','UT 2,5',1000,24,2.5,0.14,4,4,5.2,47.7,47.5,55,'https://www.phoenixcontact.com/en-us/products/feed-through-terminal-block-ut-25-3044076');

const xmlbPressureSwitchDefinition = deepFreeze({
    schemaVersion: COMPONENT_SCHEMA_VERSION, id: 'telemecanique-xmlb004a2s11',
    manufacturer: 'Telemecanique Sensors', manufacturerPartNumber: 'XMLB004A2S11',
    model: 'XMLB004A2S11', name: 'Mechanical pressure switch · adjustable 4 bar',
    family: 'pressure-switch', referencePrefix: 'B', category: 'Electrical · Verified pressure switch',
    symbol: { id: 'pressure.xmlb004a2s11.4-terminal.v1', view: 'schematic', unit: 'mm', width: 180, height: 100,
      representation: { text: 'P', symbolType: 'Manufacturer terminal interface; contact actuation not simulated' },
      pins: [
        {id:'terminal-13',localNumber:'13',name:'Terminal 13',x:-45,y:-50,electricalType:'passive',connectionType:'screw'},
        {id:'terminal-14',localNumber:'14',name:'Terminal 14',x:-45,y:50,electricalType:'passive',connectionType:'screw'},
        {id:'terminal-11',localNumber:'11',name:'Terminal 11',x:45,y:-50,electricalType:'passive',connectionType:'screw'},
        {id:'terminal-12',localNumber:'12',name:'Terminal 12',x:45,y:50,electricalType:'passive',connectionType:'screw'}
      ],
      internalConnections: [],
      numberingNote: 'Manufacturer diagram shows four terminals: 13/14 left, 11/12 right. This terminal-interface symbol does not infer common links, pressure-dependent continuity or contact state. Coordinates are schematic, not physical. Class I enclosure bonding must be engineered separately; no unidentified earth terminal is invented.'
    },
    specifications: {
      pressureRating:{value:4,unit:'bar'},risingSwitchPoint:{minimum:0.25,maximum:4,unit:'bar'},
      fallingSwitchPoint:{minimum:0.05,maximum:3.75,unit:'bar'},
      contactComposition:{value:'1 C/O; four-terminal block'},
      fluidConnection:{value:'G 1/4 female'},controlledFluids:{value:'Air, fresh water, hydraulic oil; 0–70 °C'},
      ingressProtection:{value:'IP66'},electricalProtectionClass:{value:'Class I'},
      ratedAC15At120V:{value:3,unit:'A'},ratedAC15At240V:{value:1.5,unit:'A'},ratedDC13At250V:{value:0.1,unit:'A'},
      ratingLimitation:{value:'No 24 V DC utilisation rating inferred from the published 250 V DC value.'},
      dimensions:{width:{value:35,unit:'mm'},height:{value:158,unit:'mm'},depth:{value:77.5,unit:'mm'}},
      selectionLimitation:{value:'Threshold differential, pressure direction, contact continuity, load compatibility and enclosure bonding must be verified for the application.'}
    },
    instanceProperties: {
      processPoint:{type:'string',default:'',maximumLength:60},
      risingPressureBar:{type:'number',default:null,minimum:0.25,maximum:4,step:'any'},
      fallingPressureBar:{type:'number',default:null,minimum:0.05,maximum:3.75,step:'any'},
      thresholdDesignNote:{type:'string',default:'Unselected: verify rising/falling setpoints and differential against the manufacturer curves.',maximumLength:160},
      marking:{type:'string',default:'',maximumLength:40},position:{type:'string',default:'',maximumLength:24},
      comment:{type:'string',default:'Terminal interface only; pressure switching is not simulated.',maximumLength:160}
    },
    sources:[
      {publisher:'Telemecanique Sensors',title:'XMLB004A2S11 product data sheet',url:'https://downloads.telemecaniquesensors.com/dam/datasheets/en/XMLB004A2S11_EN.pdf',documentRevision:'2024-07-30, pages 1–6; operating curves on page 6',revisionNote:'Product identity, pressure ranges, published utilisation ratings, four-terminal block, Class I and body dimensions. Ratings are not an application approval.',retrievedAt:'2026-11-15'},
      {publisher:'Telemecanique Sensors',title:'XMLB004A2S11 terminal model',url:'https://telemecaniquesensors.com/sites/default/files/bsl/epds/contents/194552-bc94onykhv/G-SE-0043466.1.gif',documentRevision:'Manufacturer product wiring image, inspected 2026-11-15',revisionNote:'Terminal labels 13/14 and 11/12 visually verified. No three-terminal generic changeover mapping substituted.',retrievedAt:'2026-11-15'}
    ]
  });
const siemensMaintenanceIsolatorDefinition=deepFreeze({
    schemaVersion:COMPONENT_SCHEMA_VERSION,id:'siemens-3ld2203-0tk51',manufacturer:'Siemens',manufacturerPartNumber:'3LD2203-0TK51',
    model:'SENTRON 3LD2203-0TK51',name:'Three-pole lockable switch disconnector',family:'switch-disconnector',referencePrefix:'Q',category:'Electrical · Verified switch disconnector',
    symbol:{id:'switch.3ld2203.3pole.v1',view:'schematic',unit:'mm',width:180,height:140,pins:[
      {id:'line-l1',localNumber:'1L1',name:'Pole 1 incoming',x:-50,y:-55,electricalType:'passive',connectionType:'box-terminal'},
      {id:'load-t1',localNumber:'2T1',name:'Pole 1 outgoing',x:-50,y:55,electricalType:'passive',connectionType:'box-terminal'},
      {id:'line-l2',localNumber:'3L2',name:'Pole 2 incoming',x:0,y:-55,electricalType:'passive',connectionType:'box-terminal'},
      {id:'load-t2',localNumber:'4T2',name:'Pole 2 outgoing',x:0,y:55,electricalType:'passive',connectionType:'box-terminal'},
      {id:'line-l3',localNumber:'5L3',name:'Pole 3 incoming',x:50,y:-55,electricalType:'passive',connectionType:'box-terminal'},
      {id:'load-t3',localNumber:'6T3',name:'Pole 3 outgoing',x:50,y:55,electricalType:'passive',connectionType:'box-terminal'}
    ],internalConnections:[],numberingNote:'Siemens terminal diagram: 1L1–2T1, 3L2–4T2, 5L3–6T3. No auxiliary contacts supplied. Schematic coordinates, not physical geometry; switch position is not simulated.'},
    specifications:{uninterruptedCurrent:{value:32,unit:'A'},ratedAC23CurrentAt400V:{value:22,unit:'A'},poleCount:{value:3},offPositionLockable:{value:true},maximumPadlocks:{value:3},padlockShackle:{minimum:4,maximum:8,unit:'mm'},frontProtection:{value:'IP65 at front; not a complete field enclosure'},mountingMethod:{value:'Front mounting, four-hole handle fixing; not DIN rail'},operatingTemperature:{minimum:-25,maximum:55,unit:'°C'},dimensions:{height:{value:83,unit:'mm'},width:{value:67,unit:'mm'},depth:{value:92.5,unit:'mm'}},selectionNote:{value:'Field housing, lockout arrangement and upstream protection must be selected. Manufacturer headline lists 11.5 kW at 400 V while the 2024 table lists 12 kW; reconcile before using the power figure. No emergency-stop function or standalone fault interruption claimed.'}},
    instanceProperties:{position:{type:'string',default:'',maximumLength:24},marking:{type:'string',default:'',maximumLength:40},comment:{type:'string',default:'Front-mounted part; enclosure and protection require engineering.',maximumLength:160}},
    sources:[
      {publisher:'Siemens',title:'3LD2203-0TK51 Industry Mall product record',url:'https://mall.industry.siemens.com/mall/en/it/Catalog/Product/3LD2203-0TK51',documentRevision:'Manufacturer product record, reviewed 2026-11-15',revisionNote:'Exact identity, three poles, 32 A Iu, black rotary handle and front mounting.',retrievedAt:'2026-11-15'},
      {publisher:'Siemens (manufacturer PDF hosted by RS)',title:'3LD2203-0TK51 data sheet and terminal diagram',url:'https://docs.rs-online.com/d8c0/A700000011902110.pdf',documentRevision:'2024-08-16, pages 1–5, Chinese-language Siemens datasheet',revisionNote:'22 A AC-23 at 400 V; OFF locking; no included auxiliary contacts; body dimensions; six terminal labels. Conditional fault withstand is not an independent breaking rating.',retrievedAt:'2026-11-15'}
    ]
  });
  const sewDeltaTerminalBoardDefinition=deepFreeze(Object.assign({},sewStarDeltaMotorDefinition,{
    id:'sew-eurodrive-drn132m4-delta-board',name:'DRN132M4 · delta terminal-board schematic view',family:'motor-terminal-board',category:'Electrical · Verified motor · terminal-board view',
    symbol:Object.assign({},sewStarDeltaMotorDefinition.symbol,{id:'motor.drn132m4.delta-board.v1',width:210,height:120,pins:sewStarDeltaMotorDefinition.symbol.pins.map(function(pin){const positions={'winding-u1':[-50,-30],'winding-v1':[0,-30],'winding-w1':[50,-30],'winding-w2':[-50,30],'winding-u2':[0,30],'winding-v2':[50,30],'protective-earth':[100,0]};return Object.assign({},pin,{x:positions[pin.id][0],y:positions[pin.id][1]});}),numberingNote:'Alternative schematic view of the same DRN132M4 motor, not a different order code. U1–W2, V1–U2 and W1–V2 delta bridges must be explicitly wired; no internal shorts are inferred. Diagram positions are schematic, not a verified physical footprint.'}),
    specifications:Object.assign({},sewStarDeltaMotorDefinition.specifications,{supplyConnectionAt400V:{value:'Delta; starting method and supply suitability remain project-specific'}})
  }));

  const isolatorAuxiliaryDefinition=deepFreeze({
    schemaVersion:COMPONENT_SCHEMA_VERSION,id:'siemens-3ld9200-5b',manufacturer:'Siemens',manufacturerPartNumber:'3LD9200-5B',model:'SENTRON 3LD9200-5B',name:'Front-mounted isolator auxiliary switch · 1 NO + 1 NC',family:'isolator-auxiliary',referencePrefix:'Q',category:'Electrical · Verified isolator accessory',
    symbol:{id:'auxiliary.3ld9200-5b.v1',view:'schematic',unit:'mm',width:160,height:100,pins:[
      {id:'no-23',localNumber:'23',name:'Normally-open input',x:-60,y:-20,electricalType:'passive',connectionType:'screw'},
      {id:'no-24',localNumber:'24',name:'Normally-open output',x:60,y:-20,electricalType:'passive',connectionType:'screw'},
      {id:'nc-11',localNumber:'11',name:'Normally-closed input',x:-60,y:20,electricalType:'passive',connectionType:'screw'},
      {id:'nc-12',localNumber:'12',name:'Normally-closed output',x:60,y:20,electricalType:'passive',connectionType:'screw'}
    ],internalConnections:[],numberingNote:'23/24 NO and 11/12 NC follow the Siemens product marking. NO closes after and opens before the main switch; NC has the opposite sequence. Requires compatible mechanical mounting. Coordinates are schematic; switching and mechanical coupling are not simulated.'},
    specifications:{contactComposition:{value:'1 NO + 1 NC'},ratedDC13At24V:{value:4,unit:'A'},ratedAC15At230V:{value:3,unit:'A'},mounting:{value:'3LD2 front mounting; compatible with 3LD22 per LV10 selection table'},noSequence:{value:'Lagging switch-on; leading switch-off'},ncSequence:{value:'Leading switch-on; lagging switch-off'},screwTorque:{minimum:0.8,maximum:1.2,unit:'N·m'}},
    instanceProperties:{position:{type:'string',default:'',maximumLength:24},marking:{type:'string',default:'',maximumLength:40},comment:{type:'string',default:'Verify mechanical mounting and control function; not a standalone safety function.',maximumLength:160}},
    sources:[{publisher:'Siemens',title:'3LD9200-5B product datasheet',url:'https://www.mouser.lt/datasheet/3/5917/6/3LD92005B_datasheet_en.pdf',documentRevision:'Siemens datasheet 4/7/2026, 3 pages; manufacturer document hosted by Mouser.',revisionNote:'Exact identity, contact marking, 4 A DC-13 at 24 V, contact sequence and terminal torque. Not installation approval.',retrievedAt:'2026-11-15'},{publisher:'Siemens',title:'LV10 04/2022 switch disconnectors · auxiliary-switch selection',url:'https://cache.industry.siemens.com/dl/files/643/109750643/att_1104557/v1/08_SwitchDisconnectors_LV10_042022_EN_202205241458164260.pdf',documentRevision:'04/2022',revisionNote:'3LD9200-5B front-mount accessory listed for 3LD22 32 A.',retrievedAt:'2026-11-15'}]
  });

  const auxiliaryMcbDefinition=deepFreeze({
    schemaVersion:COMPONENT_SCHEMA_VERSION,id:'siemens-5sy4110-7',manufacturer:'Siemens',manufacturerPartNumber:'5SY4110-7',model:'SENTRON 5SY4110-7',name:'Single-pole miniature circuit breaker · C10',family:'miniature-circuit-breaker',referencePrefix:'F',category:'Electrical · Verified auxiliary protection',
    symbol:{id:'breaker.5sy4110-7.v1',view:'schematic',unit:'mm',width:100,height:100,pins:[{id:'terminal-top',localNumber:'TOP',name:'Top terminal · model-local designation',x:-50,y:0,electricalType:'passive',connectionType:'screw'},{id:'terminal-bottom',localNumber:'BOTTOM',name:'Bottom terminal · model-local designation',x:50,y:0,electricalType:'passive',connectionType:'screw'}],internalConnections:[],numberingNote:'Source verifies combined top and bottom terminals. TOP/BOTTOM are model-local physical-side identifiers, not claimed manufacturer terminal numbers. Coordinates are schematic; tripping is not simulated.'},
    specifications:{ratedCurrent:{value:10,unit:'A'},trippingCharacteristic:{value:'C'},poleCount:{value:1},ratedVoltage:{value:'230/400 V AC'},breakingCapacityEN60898:{value:10,unit:'kA'},neutralSwitching:{value:false}},
    instanceProperties:{position:{type:'string',default:'',maximumLength:24},marking:{type:'string',default:'',maximumLength:40},comment:{type:'string',default:'Verify fault level, cable protection and ambient derating.',maximumLength:160}},
    sources:[{publisher:'Siemens',title:'5SY4110-7 manufacturer data sheet',url:'https://cdn-reichelt.de/documents/datenblatt/D710/LS_4110_7_DB_EN.pdf',documentRevision:'12.05.2015 · 5 pages; Siemens document hosted by Reichelt',revisionNote:'Exact C10 single-pole identity, EN 60898 breaking capacity and top/bottom terminal construction. TOP/BOTTOM labels are explicitly model-local.',retrievedAt:'2026-11-15'}]
  });
  const ptcbDefinition=deepFreeze({
    schemaVersion:COMPONENT_SCHEMA_VERSION,id:'phoenix-contact-2908262',manufacturer:'Phoenix Contact',manufacturerPartNumber:'2908262',model:'PTCB E1 24DC/1-8A NO',name:'Adjustable electronic DC circuit breaker',family:'electronic-circuit-breaker',referencePrefix:'F',category:'Electrical · Verified auxiliary protection',
    symbol:{id:'protection.ptcb.2908262.v1',view:'schematic',unit:'mm',width:220,height:180,pins:[
      {id:'input-1.1',localNumber:'1.1',name:'IN+ terminal',x:-110,y:-55,electricalType:'passive',connectionType:'push-in'},
      {id:'bridge-1.2',localNumber:'1.2',name:'IN+ bridge shaft',x:-110,y:-20,electricalType:'passive',connectionType:'plug-in bridge'},
      {id:'negative-3.1',localNumber:'3.1',name:'IN− self supply only',x:-110,y:35,electricalType:'passive',connectionType:'push-in'},
      {id:'negative-3.2',localNumber:'3.2',name:'IN− self supply only',x:-110,y:70,electricalType:'passive',connectionType:'push-in'},
      {id:'output-2.1',localNumber:'2.1',name:'Protected OUT+ terminal',x:110,y:-55,electricalType:'passive',connectionType:'push-in'},
      {id:'bridge-2.2',localNumber:'2.2',name:'Protected OUT+ bridge shaft',x:110,y:-20,electricalType:'passive',connectionType:'plug-in bridge'},
      {id:'signal-13',localNumber:'13',name:'Remote indication NO',x:110,y:35,electricalType:'passive',connectionType:'push-in'},
      {id:'signal-14',localNumber:'14',name:'Remote indication NO',x:110,y:70,electricalType:'passive',connectionType:'push-in'}
    ],internalConnections:[['input-1.1','bridge-1.2'],['output-2.1','bridge-2.2'],['negative-3.1','negative-3.2']],numberingNote:'Manufacturer connection assignments retained, including separate input/output bridge shafts. IN− powers electronics only; never route load return through it. Protected input/output and NO signal are not permanently bridged; switching/tripping is not simulated.'},
    specifications:{operatingVoltage:{minimum:18,maximum:30,unit:'V DC'},ratedVoltage:{value:24,unit:'V DC'},channelSettings:{value:[1,2,3,4,5,6,7,8],unit:'A'},factorySetting:{value:4,unit:'A'},quiescentCurrentTypical:{value:12,unit:'mA'},signalContact:{value:'NO, 0–30 V DC, 100 mA'},isolation:{value:'No electrical isolation'},dimensions:{width:{value:6.2,unit:'mm'},length:{value:105.8,unit:'mm'},height:{value:55.6,unit:'mm'}}},
    instanceProperties:{channelCurrentA:{type:'number',default:4,minimum:1,maximum:8,integer:true},position:{type:'string',default:'',maximumLength:24},marking:{type:'string',default:'',maximumLength:40},comment:{type:'string',default:'Set channel current on the physical device. Verify source reserve and load return routing.',maximumLength:160}},
    sources:[{publisher:'Phoenix Contact',title:'PTCB E1 24DC/1-8A NO · 2908262',url:'https://www.phoenixcontact.com/en-us/products/device-circuit-breakers-ptcb-e1-24dc1-8a-no-2908262',documentRevision:'Current manufacturer product data',revisionNote:'Identity, adjustable integer settings, factory 4 A, voltage range and IN− self-supply-only restriction.',retrievedAt:'2026-11-15'},{publisher:'Phoenix Contact',title:'PTCB device circuit breaker application note',url:'https://assets.phoenixcontact.com/file/ebbfcb23-6830-4184-bc8d-c99191d07722/media/original?Application_Note-ptcb_108344_en_02.pdf=',documentRevision:'108344_en_02 · 13 pages',revisionNote:'Visually checked pages 4–5, 8, 10–11: connection/bridge assignments, operating settings, trip curve and dimensions. Actual protection coordination requires project verification.',retrievedAt:'2026-11-15'}]
  });

  function pilotLightDefinition(part,colour,url,revision){return deepFreeze({
    schemaVersion:COMPONENT_SCHEMA_VERSION,id:'schneider-electric-'+part.toLowerCase(),manufacturer:'Schneider Electric',manufacturerPartNumber:part,model:'Harmony XB5 '+part,name:colour+' 24 V pilot light',family:'pilot-light',referencePrefix:'H',category:'Electrical · Verified indication',
    symbol:{id:'indication.'+part.toLowerCase()+'.v1',view:'schematic',unit:'mm',width:120,height:100,pins:[{id:'terminal-x1',localNumber:'X1',name:'Pilot-light terminal X1',x:-60,y:0,electricalType:'passive',connectionType:'screw clamp'},{id:'terminal-x2',localNumber:'X2',name:'Pilot-light terminal X2',x:60,y:0,electricalType:'passive',connectionType:'screw clamp'}],internalConnections:[],numberingNote:'X1/X2 follow the exact product datasheet. Lamp load is not a zero-ohm bridge. Coordinates are schematic; illumination and electrical load are not simulated. Drawing stroke colour does not change the manufacturer lens colour.'},
    specifications:{ratedSupply:{value:'24 V AC/DC, 50/60 Hz'},dcSupplyRange:{minimum:19.2,maximum:30,unit:'V DC'},currentConsumption:{value:18,unit:'mA'},lensColour:{value:colour},signalling:{value:'Steady; integral LED'},nominalMountingDiameter:{value:22,unit:'mm'},dimensions:{width:{value:30,unit:'mm'},height:{value:42,unit:'mm'},depth:{value:54,unit:'mm'}}},
    instanceProperties:{legend:{type:'string',default:'',maximumLength:60},position:{type:'string',default:'',maximumLength:24},marking:{type:'string',default:'',maximumLength:40},comment:{type:'string',default:'Verify actual installation and indication function; no simulated illumination.',maximumLength:160}},
    sources:[{publisher:'Schneider Electric',title:part+' product datasheet',url:url,documentRevision:revision,revisionNote:'Exact identity, lens colour, X1/X2 terminals, 24 V AC/DC, 18 mA and nominal dimensions. Finished cut-out tolerances require the installation drawing.',retrievedAt:'2026-11-15'}]
  });}
  const greenPilotDefinition=pilotLightDefinition('XB5AVB3','Green','https://cdn-reichelt.de/documents/datenblatt/C300/XB5AVB3_DB-EN.pdf','4 October 2022 · 5 pages; manufacturer document hosted by Reichelt');
  const redPilotDefinition=pilotLightDefinition('XB5AVB4','Red','https://www.mouser.com/datasheet/2/357/Schneider-Electric-1565323.pdf','Manufacturer datasheet hosted by Mouser; printed product pages 1–3 plus distributor page; undated');
  const mainIsolatorDefinition=deepFreeze({
    schemaVersion:COMPONENT_SCHEMA_VERSION,id:'siemens-3ld2244-1tl51',manufacturer:'Siemens',manufacturerPartNumber:'3LD2244-1TL51',
    model:'SENTRON 3LD2244-1TL51',name:'Four-pole main switch disconnector with neutral',family:'switch-disconnector',referencePrefix:'Q',category:'Electrical · Verified switch disconnector',
    symbol:{id:'switch.3ld2244.4pole.v1',view:'schematic',unit:'mm',width:240,height:140,pins:[
      {id:'line-l1',localNumber:'1L1',name:'Pole 1 incoming',x:-75,y:-55,electricalType:'passive',connectionType:'box-terminal'},
      {id:'load-t1',localNumber:'2T1',name:'Pole 1 outgoing',x:-75,y:55,electricalType:'passive',connectionType:'box-terminal'},
      {id:'line-l2',localNumber:'3L2',name:'Pole 2 incoming',x:-25,y:-55,electricalType:'passive',connectionType:'box-terminal'},
      {id:'load-t2',localNumber:'4T2',name:'Pole 2 outgoing',x:-25,y:55,electricalType:'passive',connectionType:'box-terminal'},
      {id:'line-l3',localNumber:'5L3',name:'Pole 3 incoming',x:25,y:-55,electricalType:'passive',connectionType:'box-terminal'},
      {id:'load-t3',localNumber:'6T3',name:'Pole 3 outgoing',x:25,y:55,electricalType:'passive',connectionType:'box-terminal'},
      {id:'line-n',localNumber:'N',name:'Neutral incoming',x:75,y:-55,electricalType:'passive',connectionType:'box-terminal'},
      {id:'load-n',localNumber:'N',name:'Neutral outgoing',x:75,y:55,electricalType:'passive',connectionType:'box-terminal'}
    ],internalConnections:[],numberingNote:'Manufacturer diagram: 1L1–2T1, 3L2–4T2, 5L3–6T3, N–N. Neutral endpoints have distinct model IDs but identical manufacturer labels. No PE pole. Contact timing and switch state are not simulated; early-make/late-break timing remains unverified.'},
    specifications:{uninterruptedCurrent:{value:32,unit:'A'},poleCount:{value:4},mountingMethod:{value:'Floor mounting with door coupling; 22.5 mm central handle mounting'},handleColour:{value:'Black'},selectionNote:{value:'Main isolation candidate, not an emergency-stop system or overcurrent protective device. Verify utilization category, upstream protection, neutral contact timing and assembly dimensions before installation.'}},
    instanceProperties:{position:{type:'string',default:'',maximumLength:24},marking:{type:'string',default:'',maximumLength:40},comment:{type:'string',default:'Common isolation candidate; neutral timing and protection require verification.',maximumLength:160}},
    sources:[{publisher:'Siemens',title:'3LD2244-1TL51 data sheet and terminal diagram',url:'https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3LD22441TL51',documentRevision:'2026-11-10, pages 1 and 5',revisionNote:'Exact identity, four poles, 32 A Iu, floor mounting with door coupling and manufacturer terminal labels. Schematic coordinates are not physical mounting dimensions.',retrievedAt:'2026-11-15'}]
  });
  const lappFourCoreCableDefinition=deepFreeze({
    schemaVersion:COMPONENT_SCHEMA_VERSION,id:'lapp-1119504',manufacturer:'LAPP',manufacturerPartNumber:'1119504',model:'ÖLFLEX CLASSIC 110 4G4',name:'Four-core flexible power/control cable',family:'multicore-cable',referencePrefix:'W',category:'Electrical · Manufacturer-identified cable',
    symbol:{id:'cable.4g4.endpoints.v1',view:'schematic',unit:'mm',width:180,height:130,
      pins:['1','2','3','PE'].flatMap(function(core,index){return [{id:'a-'+core,localNumber:'A:'+core,name:'End A · core '+core,x:-90,y:-36+index*24,electricalType:'passive',connectionType:'cable-core'},{id:'b-'+core,localNumber:'B:'+core,name:'End B · core '+core,x:90,y:-36+index*24,electricalType:'passive',connectionType:'cable-core'}];}),
      internalConnections:['1','2','3','PE'].map(function(core){return ['a-'+core,'b-'+core];}),
      numberingNote:'A/B identify model-local cable ends, not manufacturer terminals. Three numbered working cores and one protective conductor are represented. Symbol coordinates are schematic, not physical cable routing.'},
    specifications:{coreCount:{value:4},crossSection:{value:4,unit:'mm²'},ratedVoltage:{value:'300/500',unit:'V U0/U'},protectiveEarth:{value:true},coreIdentification:{value:'Numbered cores; includes protective earth'},sheath:{value:'PVC'},application:{value:'Fixed installation or occasional movement without tensile strain; dry or damp spaces'}},
    instanceProperties:{route:{type:'string',default:'',maximumLength:160},lengthAssumption:{type:'string',default:'Not assigned; physical route and length must be established',maximumLength:160},comment:{type:'string',default:'Cable sizing, termination compatibility and installation conditions require verification.',maximumLength:160}},
    sources:[{publisher:'LAPP',title:'ÖLFLEX CLASSIC 110 4G4 · article 1119504',url:'https://www.lapp.com/en/be/oelflex-classic-110/p/1119504',documentRevision:null,revisionNote:'Live product page. No installation-specific ampacity or physical route is claimed.',retrievedAt:'2026-11-15'}]
  });
  const COMPONENTS = Object.freeze({[lappFourCoreCableDefinition.id]:lappFourCoreCableDefinition,[phoenixPeRailViewDefinition.id]:phoenixPeRailViewDefinition,[mainIsolatorDefinition.id]:mainIsolatorDefinition,[feederContactorDefinition.id]:feederContactorDefinition,[feederMagneticBreakerDefinition.id]:feederMagneticBreakerDefinition,[feederOverloadRelayDefinition.id]:feederOverloadRelayDefinition,[greenPilotDefinition.id]:greenPilotDefinition,[redPilotDefinition.id]:redPilotDefinition,[auxiliaryMcbDefinition.id]:auxiliaryMcbDefinition,[ptcbDefinition.id]:ptcbDefinition,[isolatorAuxiliaryDefinition.id]:isolatorAuxiliaryDefinition,[siemensMaintenanceIsolatorDefinition.id]:siemensMaintenanceIsolatorDefinition,[sewDeltaTerminalBoardDefinition.id]:sewDeltaTerminalBoardDefinition, [xmlbPressureSwitchDefinition.id]:xmlbPressureSwitchDefinition, [uk5TerminalDefinition.id]:uk5TerminalDefinition,[ut25TerminalDefinition.id]:ut25TerminalDefinition, [terminalDefinition.id]: terminalDefinition, [relayDefinition.id]: relayDefinition, [contactorDefinition.id]: contactorDefinition, [siemensPowerContactorDefinition.id]: siemensPowerContactorDefinition, [siemensOverloadRelayDefinition.id]: siemensOverloadRelayDefinition, [siemensStarDeltaTimerDefinition.id]: siemensStarDeltaTimerDefinition, [schneiderStartPushButtonDefinition.id]: schneiderStartPushButtonDefinition, [schneiderStopPushButtonDefinition.id]: schneiderStopPushButtonDefinition, [motorProtectionBreakerDefinition.id]: motorProtectionBreakerDefinition, [lowRangeMotorProtectionBreakerDefinition.id]: lowRangeMotorProtectionBreakerDefinition, [starDeltaMotorProtectionBreakerDefinition.id]: starDeltaMotorProtectionBreakerDefinition, [motorStarterDefinition.id]: motorStarterDefinition, [motorDefinition.id]: motorDefinition, [sewStarDeltaMotorDefinition.id]: sewStarDeltaMotorDefinition, [siemensCpuDefinition.id]: siemensCpuDefinition, [ifmInductiveSensorDefinition.id]: ifmInductiveSensorDefinition, [ifmPressureSensorDefinition.id]: ifmPressureSensorDefinition, [siemensSitopPsuDefinition.id]: siemensSitopPsuDefinition, [phoenixProtectiveEarthTerminalDefinition.id]: phoenixProtectiveEarthTerminalDefinition });

  function reorderObject(objects,id,direction) {
    if (!Array.isArray(objects) || (direction !== 1 && direction !== -1)) return false;
    const index = objects.findIndex(function (object) { return object && object.id === id; });
    const target = index + direction;
    if (index < 0 || target < 0 || target >= objects.length) return false;
    const moved = objects.splice(index, 1)[0];
    objects.splice(target, 0, moved);
    return true;
  }

  function resizeGraphicObject(object, corner, point) {
    if (!object || !['rect', 'ellipse', 'triangle', 'circle'].includes(object.kind) ||
        !['nw', 'ne', 'sw', 'se'].includes(corner) || !point ||
        !finite(point.x) || !finite(point.y) ||
        !finite(object.x) || !finite(object.y) || !finite(object.x2) || !finite(object.y2)) return false;
    const minimum = 8; // 2 mm in the workspace's 4 SVG units per mm.
    if (object.kind === 'circle') {
      const radius = Math.hypot(point.x - object.x, point.y - object.y) / Math.SQRT2;
      if (radius < minimum) return false;
      object.x2 = object.x + radius;
      object.y2 = object.y;
      if (Object.prototype.hasOwnProperty.call(object, 'x1')) {
        object.x1 = object.x;
        object.y1 = object.y;
      }
      return true;
    }
    const left = Math.min(object.x, object.x2);
    const right = Math.max(object.x, object.x2);
    const top = Math.min(object.y, object.y2);
    const bottom = Math.max(object.y, object.y2);
    const fixedX = corner.endsWith('w') ? right : left;
    const fixedY = corner.startsWith('n') ? bottom : top;
    const nextLeft = Math.min(point.x, fixedX);
    const nextRight = Math.max(point.x, fixedX);
    const nextTop = Math.min(point.y, fixedY);
    const nextBottom = Math.max(point.y, fixedY);
    if (nextRight - nextLeft < minimum || nextBottom - nextTop < minimum) return false;
    object.x = nextLeft;
    object.y = nextTop;
    object.x2 = nextRight;
    object.y2 = nextBottom;
    if (Object.prototype.hasOwnProperty.call(object, 'x1')) {
      object.x1 = nextLeft;
      object.y1 = nextTop;
    }
    return true;
  }

  const EPLAN_COMPONENTS = Object.freeze(Object.fromEntries((root.AdigunEplanSymbols || []).map(function(def) { return [def.id, deepFreeze(def)]; })));
  function component(id) { return COMPONENTS[id] || EPLAN_COMPONENTS[id] || null; }
  function catalog() {
    return Object.keys(EPLAN_COMPONENTS).concat(Object.keys(COMPONENTS)).map(function (id) {
      const def = component(id);
      return { id: def.id, componentId: def.id, name: def.generic ? def.name : def.model + ' · ' + def.manufacturerPartNumber + (def.family==='motor-terminal-board'?' · Delta terminal-board view':''), category: def.category, family: def.family, tag: def.referencePrefix || 'X' };
    });
  }
  function createInstance(componentId, x, y, ref) {
    const def = component(componentId);
    if (!def) throw new Error('Unknown verified component: ' + componentId);
    if (!finite(x) || !finite(y)) throw new TypeError('Component coordinates must be finite numbers.');
    const properties = {};
    Object.keys(def.instanceProperties).forEach(function (name) {
      properties[name] = def.instanceProperties[name].default;
    });
    return {
      schemaVersion: COMPONENT_SCHEMA_VERSION,
      kind: 'component-instance',
      id: 'cmp-' + (root.crypto && typeof root.crypto.randomUUID === 'function'
        ? root.crypto.randomUUID()
        : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 11)),
      componentId: componentId,
      ref: typeof ref === 'string' && ref.trim() ? ref.trim().slice(0, 32) : (def.referencePrefix || 'X') + '1',
      x: x,
      y: y,
      rotation: 0,
      properties: properties
    };
  }
  function validateInstance(instance) {
    const errors = [];
    if (!instance || typeof instance !== 'object') return { valid: false, errors: ['Component instance must be an object.'] };
    const def = component(instance.componentId);
    if (instance.kind !== 'component-instance') errors.push('Object is not a component instance.');
    if (instance.schemaVersion !== COMPONENT_SCHEMA_VERSION) errors.push('Unsupported component schema version.');
    if (!def) errors.push('Component ID has no verified definition.');
    if (!finite(instance.x) || !finite(instance.y)) errors.push('Component position is invalid.');
    if (![0, 90, 180, 270].includes(instance.rotation)) errors.push('Component rotation must be 0, 90, 180, or 270 degrees.');
    if (typeof instance.id !== 'string' || !instance.id || instance.id.length > 100) errors.push('Component instance ID is invalid.');
    if (typeof instance.ref !== 'string' || !instance.ref.trim() || instance.ref.length > 32) errors.push('Component reference is invalid.');
    if (!instance.properties || typeof instance.properties !== 'object' || Array.isArray(instance.properties)) errors.push('Component instance properties are missing.');
    if (def && instance.properties && typeof instance.properties === 'object' && !Array.isArray(instance.properties)) {
      Object.keys(def.instanceProperties).forEach(function (name) {
        const value = instance.properties[name];
        const rule = def.instanceProperties[name];
        const invalidNumber = rule.type === 'number' && value !== undefined && value !== null &&
          (!finite(value) || value < rule.minimum || value > rule.maximum || rule.integer && !Number.isInteger(value));
        const invalidString = rule.type !== 'number' && value !== undefined &&
          (typeof value !== 'string' || value.length > rule.maximumLength);
        if (invalidNumber || invalidString) {
          errors.push('Component property "' + name + '" is invalid.');
        }
      });
      Object.keys(instance.properties).forEach(function (name) {
        if (!Object.prototype.hasOwnProperty.call(def.instanceProperties, name)) errors.push('Unknown editable component property "' + name + '".');
      });
      if(def.family==='pressure-switch' && finite(instance.properties.risingPressureBar) && finite(instance.properties.fallingPressureBar) && instance.properties.fallingPressureBar>=instance.properties.risingPressureBar)errors.push('Falling pressure must be lower than rising pressure. Verify the selected differential against the manufacturer operating curves; range validation alone does not establish suitability.');
    }
    return { valid: errors.length === 0, errors: errors, definition: def };
  }

  function moveInstance(instance, x, y) {
    const result = validateInstance(instance);
    if (!result.valid) throw new Error(result.errors.join(' '));
    if (!finite(x) || !finite(y)) throw new TypeError('Component coordinates must be finite numbers.');
    instance.x = x;
    instance.y = y;
    return instance;
  }
  function rotateInstance(instance, degrees) {
    const result = validateInstance(instance);
    if (!result.valid) throw new Error(result.errors.join(' '));
    if (!finite(degrees) || degrees % 90 !== 0) throw new TypeError('Component rotation must use 90-degree increments.');
    const next = ((instance.rotation + degrees) % 360 + 360) % 360;
    if (![0, 90, 180, 270].includes(next)) throw new TypeError('Component rotation must be 0, 90, 180, or 270 degrees.');
    instance.rotation = next;
    return instance;
  }
  function worldPins(instance) {
    const result = validateInstance(instance);
    if (!result.valid) return [];
    const angle = instance.rotation * Math.PI / 180;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    return result.definition.symbol.pins.map(function (pin) {
      return {
        id: pin.id,
        number: pin.localNumber,
        name: pin.name,
        electricalType: pin.electricalType,
        x: instance.x + pin.x * cos - pin.y * sin,
        y: instance.y + pin.x * sin + pin.y * cos
      };
    });
  }
  function defaultProjectSections() {
    return [{id:'A1',name:'General information'},{id:'A2',name:'Electrical design'},{id:'A3',name:'Panel layout and installation'},{id:'A4',name:'Final documentation'}];
  }
  function numberProjectSheets(sheets,sections) {
    const order=new Map(sections.map(function(section,index){return [section.id,index];}));
    if(sheets.some(function(sheet){return !order.has(sheet.sectionId);}))throw new Error('Every sheet must belong to a project section.');
    return sheets.slice().sort(function(a,b){return order.get(a.sectionId)-order.get(b.sectionId);}).map(function(sheet,index){return Object.assign({},sheet,{number:sheet.sectionId+'/'+String(index).padStart(3,'0')});});
  }
  function sheetDeletionDiagnostics(connections,sheet){
    return connections.filter(function(connection){return connection.endpoints.some(function(endpoint){return endpoint.sheetId===sheet.id;});}).map(function(connection){
      return {id:'deleted-sheet:'+sheet.id+':'+connection.id,code:'deleted-sheet-continuation',
        connectionId:connection.id,connectionName:connection.name||connection.id,
        deletedSheetId:sheet.id,deletedSheetNumber:sheet.number||'',deletedSheetName:sheet.name||'',
        endpoints:JSON.parse(JSON.stringify(connection.endpoints)),
        message:'Connection '+(connection.name||connection.id)+' lost sheet '+(sheet.number||sheet.id)+' '+(sheet.name||'')+'. Review and repair the affected continuation; it was not reassigned.'};
    });
  }
  function removeSheetConnections(connections,sheetId){
    return connections.map(function(connection){
      const endpoints=connection.endpoints.filter(function(endpoint){return endpoint.sheetId!==sheetId;}).map(function(endpoint){
        if(endpoint.connector&&endpoint.connector.targetSheetId===sheetId){const copy=Object.assign({},endpoint);delete copy.connector;return copy;}return endpoint;
      });
      return Object.assign({},connection,{endpoints:endpoints});
    }).filter(function(connection){return new Set(connection.endpoints.map(function(endpoint){return endpoint.sheetId;})).size>=2;});
  }
  function moveProjectSheet(sheets,sections,sourceId,targetId,position,sectionId){
    const source=sheets.find(function(sheet){return sheet.id===sourceId;});
    if(!source)throw new Error('Unknown source sheet.');
    if(targetId===sourceId)return numberProjectSheets(sheets,sections);
    const target=targetId?sheets.find(function(sheet){return sheet.id===targetId;}):null;
    if(targetId&&!target)throw new Error('Unknown target sheet.');
    const destination=target?target.sectionId:sectionId;
    if(!sections.some(function(section){return section.id===destination;}))throw new Error('Unknown destination section.');
    const result=sheets.filter(function(sheet){return sheet.id!==sourceId;});
    const moved=Object.assign({},source,{sectionId:destination});
    if(target){const index=result.findIndex(function(sheet){return sheet.id===target.id;});result.splice(index+(position==='after'?1:0),0,moved);}
    else{const index=result.map(function(sheet){return sheet.sectionId;}).lastIndexOf(destination);result.splice(index<0?result.length:index+1,0,moved);}
    return numberProjectSheets(result,sections);
  }
  function validateProject(project) {
    const errors = [];
    if (!project || typeof project !== 'object') return { valid: false, errors: ['Project must be a JSON object.'] };
    if(project.connectionIssues!==undefined&&(!Array.isArray(project.connectionIssues)||project.connectionIssues.some(function(issue){return !issue||typeof issue.id!=='string'||typeof issue.code!=='string'||typeof issue.message!=='string'||!Array.isArray(issue.endpoints);})))errors.push('Project connection diagnostics are malformed.');
    if (project.format !== PROJECT_FORMAT) errors.push('Unsupported Adigun project format.');
    if (![1, PROJECT_VERSION].includes(project.version)) errors.push('Unsupported project version.');
    if (!Array.isArray(project.objects) || !Array.isArray(project.sheets)) errors.push('Project objects and sheets must be arrays.');
    if(project.sections !== undefined) {
      const sections=project.sections;
      if(!Array.isArray(sections)||sections.length<4||sections.some(function(section,index){return !section||section.id!=='A'+(index+1)||typeof section.name!=='string'||!section.name.trim();}))errors.push('Project sections must start with A1–A4 and continue with consecutively numbered sections.');
      else if(Array.isArray(project.sheets)){
        try{const numbered=numberProjectSheets(project.sheets,sections);if(numbered.some(function(sheet,index){return sheet.id!==project.sheets[index].id||sheet.number!==project.sheets[index].number;}))errors.push('Project sheet numbers must be continuous across sections.');}catch(error){errors.push(error.message);}
        if(project.activeSection&&!sections.some(function(section){return section.id===project.activeSection;}))errors.push('Unknown active project section.');
        if(project.activeSheet&&!project.sheets.some(function(sheet){return sheet.id===project.activeSheet;}))errors.push('Unknown active project sheet.');
        if(Array.isArray(project.objects)&&project.objects.some(function(object){return !object.sheetId;}))errors.push('Every object must belong to a project sheet.');
      }
    }
    if (Array.isArray(project.sheets)) {
      const sheetIds = new Set();
      project.sheets.forEach(function (sheet, index) {
        if (!sheet || typeof sheet !== 'object' || typeof sheet.id !== 'string' || !sheet.id.trim()) {
          errors.push('Sheet ' + (index + 1) + ' must have a non-empty string ID.');
          return;
        }
        if (sheetIds.has(sheet.id)) errors.push('Duplicate sheet ID: ' + sheet.id + '.');
        sheetIds.add(sheet.id);
      });
      if (Array.isArray(project.objects)) {
        project.objects.forEach(function (object, index) {
          if (!object || typeof object !== 'object') return;
          if (object.sheetId && !sheetIds.has(object.sheetId)) {
            errors.push('Drawing object ' + (object.id || index + 1) + ' refers to unknown sheet ' + object.sheetId + '.');
          } else if (project.sheets.length > 1 && !object.sheetId) {
            errors.push('Drawing object ' + (object.id || index + 1) + ' must identify its sheet in a multi-sheet project.');
          }
        });
      }
    }
    if (Array.isArray(project.objects)) {
      const objectIds = new Set();
      project.objects.forEach(function (object, index) {
        if (!object || typeof object !== 'object') {
          errors.push('Drawing object ' + (index + 1) + ' is invalid.');
          return;
        }
        if (typeof object.id !== 'string' || !object.id || objectIds.has(object.id)) errors.push('Drawing object ID is missing or duplicated: '+object.id);
        objectIds.add(object.id);
        if(object.kind==='wire'&&object.continuationEnds!==undefined&&(!Array.isArray(object.continuationEnds)||object.continuationEnds.some(function(end){return !['start','end'].includes(end);})||new Set(object.continuationEnds).size!==object.continuationEnds.length))errors.push('Wire continuation endpoints must be unique start/end identifiers.');
        if(object.kind==='wire'&&object.cable!==undefined){const c=object.cable;if(!c||typeof c!=='object'||Array.isArray(c)||Object.keys(c).some(function(k){return !['tag','core'].includes(k);})||['tag','core'].some(function(k){return typeof c[k]!=='string'||!c[k].trim()||c[k].length>64;}))errors.push('Wire cable assignment requires a cable tag and core identifier (1–64 characters).');}
        if (object.kind === 'wire' && object.attachments !== undefined) {
          const endpoints = object.attachments;
          if (!endpoints || typeof endpoints !== 'object' || Array.isArray(endpoints)) errors.push('Wire attachments must be an endpoint map.');
          else Object.keys(endpoints).forEach(function(end) {
            const target=endpoints[end];
            if (!['start','end'].includes(end) || !target || typeof target.instanceId !== 'string' || !target.instanceId || typeof target.pinId !== 'string' || !target.pinId) errors.push('Wire has an invalid terminal attachment.');
          });
        }
        if (object.kind === 'component-instance') {
          const validation = validateInstance(object);
          validation.errors.forEach(function (error) { errors.push('Object ' + (object.ref || index + 1) + ': ' + error); });
        } else if (object.kind === 'catalog-symbol' || ['terminal', 'plc', 'motor', 'ground'].includes(object.kind)) {
          errors.push('Project contains a legacy visual-only component. It must be replaced with a verified component before import.');
        } else if (object.kind === 'wire' && ![object.x1, object.y1, object.x2, object.y2].every(finite)) {
          errors.push('Wire ' + (object.id || index + 1) + ' has invalid coordinates.');
        }
      });
    }
    if(project.openSheetIds !== undefined){
      const ids=project.openSheetIds,known=new Set((project.sheets||[]).map(function(sheet){return sheet.id;}));
      if(!Array.isArray(ids)||ids.some(function(id){return typeof id!=='string'||!known.has(id);})||new Set(ids).size!==ids.length)errors.push('Open sheet views must refer to unique project sheets.');
      else if(project.activeSheet&&!ids.includes(project.activeSheet))errors.push('The active sheet must have an open view.');
    }
    if (project.crossSheetConnections !== undefined && !Array.isArray(project.crossSheetConnections)) {
      errors.push('Project cross-sheet connections must be an array.');
    }

    if (Array.isArray(project.crossSheetConnections)) {
      const knownSheetIds = new Set((Array.isArray(project.sheets) ? project.sheets : []).filter(function (sheet) {
        return sheet && typeof sheet.id === 'string';
      }).map(function (sheet) { return sheet.id; }));
      const connectionIds = new Set();
      const globallyUsedEndpoints = new Set();
      project.crossSheetConnections.forEach(function (connection, index) {
        const label = 'Cross-sheet connection ' + (connection && connection.id || index + 1);
        if (!connection || typeof connection !== 'object' || typeof connection.id !== 'string' ||
            !connection.id.trim() || typeof connection.name !== 'string' || !connection.name.trim()) {
          errors.push(label + ' must have a non-empty ID and name.');
          return;
        }
        if (connectionIds.has(connection.id)) errors.push('Duplicate cross-sheet connection ID: ' + connection.id + '.');
        connectionIds.add(connection.id);
        if (!Array.isArray(connection.endpoints) || connection.endpoints.length < 2) {
          errors.push(label + ' must link at least two sheet-local wire endpoints.');
          return;
        }
        const endpointKeys = new Set();
        const endpointSheets = new Set();
        connection.endpoints.forEach(function (endpoint) {
          if (!endpoint || typeof endpoint !== 'object' || typeof endpoint.sheetId !== 'string' ||
              typeof endpoint.wireId !== 'string' || !endpoint.sheetId.trim() || !endpoint.wireId.trim() ||
              !endpoint.point || !finite(endpoint.point.x) || !finite(endpoint.point.y)) {
            errors.push(label + ' has an invalid endpoint; sheetId, wireId, and finite endpoint coordinates are required.');
            return;
          }
          const key = endpoint.sheetId + '\u0000' + endpoint.wireId + '\u0000' + endpoint.point.x + ',' + endpoint.point.y;
          if (endpointKeys.has(key) || globallyUsedEndpoints.has(key)) errors.push(label + ' repeats a linked wire endpoint.');
          endpointKeys.add(key);
          globallyUsedEndpoints.add(key);
          endpointSheets.add(endpoint.sheetId);
          if (!knownSheetIds.has(endpoint.sheetId)) errors.push(label + ' refers to unknown sheet ' + endpoint.sheetId + '.');
          const wire = (Array.isArray(project.objects) ? project.objects : []).find(function (object) {
            return object && object.kind === 'wire' && object.id === endpoint.wireId && object.sheetId === endpoint.sheetId;
          });
          if (!wire) errors.push(label + ' refers to missing wire ' + endpoint.wireId + ' on sheet ' + endpoint.sheetId + '.');
          else if (!((endpoint.point.x === wire.x1 && endpoint.point.y === wire.y1) ||
                     (endpoint.point.x === wire.x2 && endpoint.point.y === wire.y2))) {
            errors.push(label + ' point is not an endpoint of wire ' + endpoint.wireId + '.');
          }
          if (endpoint.connector !== undefined) {
            const graphic = endpoint.connector;
            if (!graphic || typeof graphic !== 'object' ||
                !['left', 'right'].includes(graphic.direction) ||
                typeof graphic.targetSheetId !== 'string' || !graphic.targetSheetId.trim() ||
                typeof graphic.targetRef !== 'string' || !graphic.targetRef.trim()) {
              errors.push(label + ' has an invalid off-page connector graphic.');
            } else if (graphic.targetSheetId === endpoint.sheetId || !knownSheetIds.has(graphic.targetSheetId)) {
              errors.push(label + ' off-page connector must reference a different known sheet.');
            } else if (!(Array.isArray(project.objects) ? project.objects : []).some(function (object) {
              return object && object.kind === 'component-instance' && object.sheetId === graphic.targetSheetId && (graphic.targetInstanceId?object.id===graphic.targetInstanceId:object.ref === graphic.targetRef);
            })) {
              errors.push(label + ' off-page connector target ' + graphic.targetRef + ' does not exist on sheet ' + graphic.targetSheetId + '.');
            }
          }
        });
        if (endpointSheets.size < 2) errors.push(label + ' must connect at least two different sheets.');
      });
    }
    if (project.version === PROJECT_VERSION && (project.componentSchemaVersion !== COMPONENT_SCHEMA_VERSION || project.netSchemaVersion !== 1)) {
      errors.push('Project component or net schema version is unsupported.');
    }
    return { valid: errors.length === 0, errors: errors };
  }
  const titleBlockProjectFields = ['jobNumber','manager','customer','site','drawnBy','checkedBy','approvedBy','drawingDate','issueStatus','notes'];
  const titleBlockSheetFields = ['drawingNumber','revision','revisionDate','drawnBy','checkedBy','approvedBy','drawingDate','issueStatus','notes'];
  function titleBlockValues(project,sheet) {
    const shared=project.metadata||{},local=sheet.metadata||{},values={};
    titleBlockProjectFields.forEach(function(key){values[key]=typeof shared[key]==='string'?shared[key]:'';});
    titleBlockSheetFields.forEach(function(key){if(typeof local[key]==='string')values[key]=local[key];else if(values[key]===undefined)values[key]='';});
    values.projectTitle=typeof project.project==='string'?project.project:'';
    values.sheetTitle=sheet.name||'';
    values.sheetReference=sheet.customName?sheet.sectionId+'/'+sheet.name:sheet.number;
    values.corporateIdentity='Hephzibah Behulah';
    values.softwareIdentity='AdigunEplanAI';
    return values;
  }
  function titleBlockBounds(width,height,margin) {
    if(!Number.isFinite(width)||!Number.isFinite(height)||width<300||height<240)throw new Error('Invalid drawing dimensions.');
    margin=Number.isFinite(margin)?Math.max(0,margin):26;
    const blockWidth=Math.min(474,width-2*margin),blockHeight=160;
    if(blockWidth<200||height-2*margin<blockHeight)throw new Error('Drawing margins leave no room for the title block.');
    return {x:width-margin-blockWidth,y:height-margin-blockHeight,width:blockWidth,height:blockHeight};
  }
  function assignWireCable(project, wireId, assignment) {
    if(!project||!Array.isArray(project.objects))throw new Error('A native project is required.');
    const wire=project.objects.find(function(o){return o.id===wireId&&o.kind==='wire';});
    if(!wire)throw new Error('Select a wire before assigning a cable core.');
    let cable=null;
    if(assignment!==null){
      if(!assignment||typeof assignment.tag!=='string'||typeof assignment.core!=='string')throw new Error('Cable tag and core identifier are required.');
      cable={tag:assignment.tag.trim(),core:assignment.core.trim()};
      if(!cable.tag||!cable.core||cable.tag.length>64||cable.core.length>64)throw new Error('Cable tag and core must contain 1–64 characters.');
    }
    const ids=new Set([wireId]);let changed=true;
    while(changed){changed=false;(project.crossSheetConnections||[]).forEach(function(link){if(link.endpoints.some(function(e){return ids.has(e.wireId);}))link.endpoints.forEach(function(e){if(!ids.has(e.wireId)){ids.add(e.wireId);changed=true;}});});}
    return project.objects.map(function(o){if(!ids.has(o.id))return o;const copy=Object.assign({},o);if(cable)copy.cable=Object.assign({},cable);else delete copy.cable;return copy;});
  }
  function serializeProject(project) {
    const payload = Object.assign({}, project, {
      format: PROJECT_FORMAT,
      version: PROJECT_VERSION,
      componentSchemaVersion: COMPONENT_SCHEMA_VERSION,
      netSchemaVersion: 1
    });
    const validation = validateProject(payload);
    if (!validation.valid) throw new Error(validation.errors.join(' '));
    return JSON.stringify(payload, null, 2);
  }
  function parseProject(text) {
    let project;
    try { project = JSON.parse(text); }
    catch (error) { return { valid: false, errors: ['Project file is not valid JSON.'] }; }
    const validation = validateProject(project);
    return { valid: validation.valid, errors: validation.errors, project: validation.valid ? project : null };
  }

  function pointOnSegment(point, segment) {
    const cross = (point.x - segment.a.x) * (segment.b.y - segment.a.y)
      - (point.y - segment.a.y) * (segment.b.x - segment.a.x);
    if (Math.abs(cross) > EPSILON) return false;
    return point.x >= Math.min(segment.a.x, segment.b.x) - EPSILON
      && point.x <= Math.max(segment.a.x, segment.b.x) + EPSILON
      && point.y >= Math.min(segment.a.y, segment.b.y) - EPSILON
      && point.y <= Math.max(segment.a.y, segment.b.y) + EPSILON;
  }
  function endpointPin(objects, attachment, sheetId) {
    if (!attachment || typeof attachment.instanceId !== 'string' || typeof attachment.pinId !== 'string') return null;
    const instance = objects.find(function(obj) { return obj && obj.kind === 'component-instance' && obj.id === attachment.instanceId && (!sheetId || !obj.sheetId || obj.sheetId === sheetId); });
    return instance ? worldPins(instance).find(function(pin) { return pin.id === attachment.pinId; }) || null : null;
  }
  function wireAttachmentIssues(objects) {
    const issues = [];
    objects.filter(function(obj) { return obj && obj.kind === 'wire'; }).forEach(function(wire) {
      ['start', 'end'].forEach(function(end, index) {
        const attachment = wire.attachments && wire.attachments[end];
        if (!attachment) return;
        const pin = endpointPin(objects, attachment, wire.sheetId), x = wire[index ? 'x2' : 'x1'], y = wire[index ? 'y2' : 'y1'];
        if (!pin) issues.push({code:'missing-terminal',objectId:wire.id,message:'Wire '+wire.id+' '+end+' refers to a missing component terminal.'});
        else if (Math.hypot(pin.x-x,pin.y-y)>EPSILON) issues.push({code:'detached-terminal',objectId:wire.id,message:'Wire '+wire.id+' '+end+' is detached from '+attachment.pinId+'.'});
      });
    });
    return issues;
  }
  function synchronizeWireAttachments(objects) {
    objects.filter(function(obj) { return obj && obj.kind === 'wire'; }).forEach(function(wire) {
      ['start','end'].forEach(function(end,index) {
        const pin = endpointPin(objects,wire.attachments && wire.attachments[end],wire.sheetId);
        if (!pin) return;
        wire[index?'x2':'x1']=pin.x;wire[index?'y2':'y1']=pin.y;
        if (!index) {wire.x=pin.x;wire.y=pin.y;}
      });
    });
    return wireAttachmentIssues(objects);
  }
  function attachWire(wire, start, end) {
    wire.attachments = {};
    if (start.attachment) wire.attachments.start = Object.assign({},start.attachment);
    if (end.attachment) wire.attachments.end = Object.assign({},end.attachment);
    return wire;
  }
function removeDrawingObjects(objects,ids){
    const selected=new Set(ids),removed=(objects||[]).filter(function(o){return selected.has(o.id);}),result=clone((objects||[]).filter(function(o){return !selected.has(o.id);})),detached=[];
    result.forEach(function(wire){if(wire.kind!=='wire'||!wire.attachments)return;Object.keys(wire.attachments).forEach(function(end){const target=wire.attachments[end];if(!selected.has(target.instanceId))return;detached.push({wireId:wire.id,end:end,instanceId:target.instanceId,pinId:target.pinId});delete wire.attachments[end];wire.detachedEnds=Array.from(new Set((wire.detachedEnds||[]).concat(end)));});});
    return {objects:result,removed:removed,detached:detached};
  }
  function replaceComponent(objects,instanceId,replacementId){
    const original=(objects||[]).find(function(o){return o.id===instanceId&&o.kind==='component-instance';}),replacement=component(replacementId);
    if(!original||!replacement)throw new Error('Select an existing component and a library replacement.');
    const previous=component(original.componentId);
    (objects||[]).forEach(function(wire){if(wire.kind!=='wire'||!wire.attachments)return;Object.values(wire.attachments).forEach(function(endpoint){
      if(endpoint.instanceId!==instanceId)return;
      const oldPin=previous.symbol.pins.find(function(p){return p.id===endpoint.pinId;}),newPin=replacement.symbol.pins.find(function(p){return p.id===endpoint.pinId;});
      if(!oldPin||!newPin||oldPin.localNumber!==newPin.localNumber)throw new Error('Replacement cannot preserve connected terminal '+(oldPin?oldPin.localNumber:endpoint.pinId)+'. Disconnect or remap that wire before replacing.');
    });});
    const result=clone(objects),target=result.find(function(o){return o.id===instanceId;}),reset=[];
    target.componentId=replacementId;target.properties={};
    Object.keys(replacement.instanceProperties).forEach(function(name){
      const rule=replacement.instanceProperties[name],value=original.properties[name];
      const compatible=rule.type==='number'?(value===null||finite(value)&&value>=rule.minimum&&value<=rule.maximum&&(!rule.integer||Number.isInteger(value))):typeof value==='string'&&value.length<=rule.maximumLength;
      target.properties[name]=compatible?value:rule.default;
      if(value!==undefined&&!compatible)reset.push(name);
    });
    const validation=validateInstance(target);if(!validation.valid)throw new Error(validation.errors.join(' '));
    synchronizeWireAttachments(result);
    return {objects:result,resetProperties:reset};
  }
  function nextReference(objects, prefix) {
    const occupied = new Set(objects.filter(function(obj){return obj.kind==='component-instance';}).map(function(obj){return obj.ref;}));
    let number=1;while(occupied.has(prefix+number))number++;
    return prefix+number;
  }
function createPumpStarterDocumentation(name) {
    const titles=['Project overview','Title and revision','Contents and drawing register','Equipment and device register','Symbols, terms and potentials','Design basis and calculations','Supply interface and contactor','Overload and outgoing motor interface','Field isolation and delta motor','Local stop, permissives and seal-in','Auxiliary supply and control protection','Coil-voltage and overload-trip indication','Operating sequence and interlocks','Motor feeder short-circuit protection','Supply isolation and distribution','Field terminal connections','Field control terminal interfaces','Earthing and bonding','Cross-sheet connection register'];
    const sections=defaultProjectSections(),sheets=titles.map(function(title,index){return {id:'eng0601-'+(index<6?'a1-'+index:'a2-'+(index-6)),sectionId:index<6?'A1':'A2',name:title,number:(index<6?'A1/':'A2/')+String(index).padStart(3,'0'),metadata:{revision:'P01',issueStatus:'Engineering development'}};});
    const objects=[];
    function text(page,id,x,y,value,size,width){objects.push({id:'eng0601-'+id,sheetId:sheets[page].id,kind:'text',x:x,y:y,text:value,fontFamily:'Arial',fontSize:size||14,textWidth:width||1050,rotation:0,stroke:'#183c50'});}
    function rows(page,lines){lines.forEach(function(line,index){text(page,'p'+page+'-r'+index,60,125+index*24,line,13,1070);});}
    titles.forEach(function(title,index){text(index,'heading-'+index,60,65,'ENG-0601 | '+title,22);});
    rows(0,[
      'Direct-on-line pump starter | Local manual baseline',
      'Purpose: one locally started pump motor, pressure permissive, stop control and operating indication.',
      'Power path: site supply → panel isolation/protection → K1 contactor → F2 overload → Q2 field isolator → M1.',
      'Control path: protected 24 V DC → stop → overload healthy → pressure permissive → start / K1 hold → K1 coil.',
      'These arrows describe functional dependencies. They are not electrical connections or terminal assignments.',
      'Start requires a deliberate local command. Stop, overload trip, loss of permissive or power drops K1.',
      'Power restoration alone must not restart the motor. Resetting an overload must not issue a start command.',
      'Panel scope: protection, starter, control supply, terminals, operator controls and indication.',
      'Field scope: motor/pump, lockable maintenance isolator and pressure device; retain their field locations.',
      'External services: site supply/protection/PE, hydraulic process and mechanical pump coupling.',
      'Safety boundary: ordinary controls are not a safety-rated emergency-stop or machinery safety system.',
      'Current delivery: six A1 documents and eleven connected A2 circuit sheets and two editable reports; A3/A4 remain empty.',
      'Release gate: coordinated circuit, fault/protection/cable checks, layout, testing and competent review.'
    ]);
    rows(1,[
      'Project identifier: ENG-0601',
      'Project: Direct-on-line pump starter — Local manual baseline',
      'Repository owner: HephzibahBehulahHQ | Product: AdigunEplanAI',
      'Prepared by: Codex | Checked by: not appointed | Approved by: not approved',
      'Revision P01 | 2026-11-15 | Purpose: design development and educational review',
      'P01 change: establish scope, drawing register, candidate devices, terminology and design assumptions.',
      'Source brief: catalogue motor-control/ENG-0601.md; one coordinated project, four sections.',
      'Do not use these development documents as installation instructions or an energisation permit.',
      'Manufacturer data and engineering assumptions are labelled separately in the design basis.',
      'No physical test results, commissioning signatures or approval dates have been supplied or invented.',
      'Next issue: verified device selection and complete terminal-bound A2 circuits, followed by A3/A4.',
      'Revision record is editable project text; append subsequent changes without deleting this issue history.'
    ]);
    const register=[
      '000 Project overview','001 Title and revision','002 Contents and drawing register',
      '003 Equipment and device register','004 Symbols, terms and potentials','005 Design basis and calculations',
      '006 Supply interface and contactor','007 Overload and outgoing motor interface','008 Motor circuit / isolation',
      '009 Local stop, permissives and seal-in','010 Auxiliary supply and control protection','011 Coil-voltage and trip indication',
      '012 Operating sequence and interlocks','013 Motor feeder short-circuit protection','014 Supply isolation and distribution',
      '015 Field terminal connections','016 Field control terminal interfaces','017 Earthing and bonding',
      '018 Cross-sheet connection register','019 Protection and cable calculations','020 Panel general arrangement',
      '021 Mounting plate and DIN rails','022 Door layout and operator devices','023 Terminal-strip layout',
      '024 Cable entry and routing','025 Assembly and installation','026 Final bill of materials',
      '027 Final connection reports','028 Inspection and commissioning','029 Handover and unresolved items'
    ];
    register.forEach(function(line,index){
      const section=index<6?'A1':index<20?'A2':index<26?'A3':'A4';
      const status=index<19?'P01 / authored development':'planned / not yet created';
      text(2,'register-'+index,index<15?60:620,120+(index%15)*25,section+'/'+line+' | '+status,11,510);
    });
    text(2,'dependencies',60,535,'Dependencies: A1 basis → A2 circuits → A3 installation → A4 derived reports. Planned references are not live links.',12);
    rows(3,[
      'Tags below are reserved once per physical device. Candidate order codes are not procurement approval.',
      'K1 | Panel | motor contactor | Siemens 3RT2027-2KB40 | 32 A AC-3; 24 V DC coil; S0.',
      'F2 | Panel | thermal overload | Siemens 3RU2126-4BB0 | 14–20 A / Class 10; design setting 15.2 A.',
      'F1 | Panel | magnetic-only starter breaker | Siemens 3RV2321-4BC10 | 20 A; instantaneous release 260 A.',
      'M1 | Field | pump drive | SEW-EURODRIVE DRN132M4 | candidate motor family; exact build to be selected.',
      'PS1 | Panel | auxiliary supply | Siemens 6EP1332-5BA00 | candidate; input and load budget to verify.',
      'S0 / S1 | Panel door | stop NC / start NO | Schneider XB5AA42 / XB5AA31 | candidates.',
      'B1 | Field | pressure permissive | Telemecanique XMLB004A2S11 | terminal/rating suitability unresolved.',
      'Q1 | Panel | Siemens 3LD2244-1TL51, four poles. Q2 | Field | 3LD2203-0TK51; enclosure unresolved.',
      'F3 Siemens 5SY4110-7 C10; F4 Phoenix 2908262 set to 1 A. Verify upstream and branch coordination.',
      'H1 / H2 | Panel door | coil voltage / F2 trip contact | Schneider XB5AVB3 green / XB5AVB4 red.',
      'X1 / X2 / X3 / X4 / X5 / XPE | Panel | power / control / PE terminal strips | current, accessories and order codes unresolved.',
      'Cables W1 supply, W2 motor, W3 pressure: route, lengths, installation methods and core sizes unresolved.',
      'K1, F2, M1, PS1 and S0/S1 candidates already exist in the component library; no generic substitutions.',
      'Q2:AUX | Field | Siemens 3LD9200-5B | mechanically mounted on Q2; 23/24 in hold circuit.',
      'A4 BOM must be generated from final instantiated devices, not this provisional candidate register.'
    ]);
    rows(4,[
      'K = contactor; F = protective device; M = motor; S = operator switch; B = process sensor.',
      'Q = isolating/switching device; H = indication; PS = power supply; X = terminals; W = cable.',
      'A1–A4 identify documentation sections, not four projects or electrical potentials.',
      'L1/L2/L3 are three-phase conductors. N is neutral only where the final supply circuit actually uses it.',
      '+24V and 0V identify the proposed control supply. 0V is not automatically PE, FE or neutral.',
      'PE is protective earth: continuous, unswitched and identified green/yellow. Do not bridge N to PE here.',
      'FE is functional earth where explicitly required by the selected device; it does not replace PE.',
      'Colour is not a substitute for a conductor identifier. Use blue for N where applicable; no universal red rule.',
      'Contacts are documented de-energised and unactuated; pressure contact state needs its source diagram.',
      'Pin labels must be the device manufacturer labels. Internal software IDs stay stable through renaming.',
      'An off-page continuation requires a matching net, stable endpoint, terminal, cable/core and destination.',
      'Drawing crossings do not imply a junction. A junction must have explicit connectivity in the native model.',
      'Block diagrams describe functions only. Physical layouts must distinguish panel equipment from field devices.',
      'H1 indicates K1 coil voltage only; H2 indicates the F2 trip contact. Neither proves motor operation or isolation.'
    ]);
    rows(5,[
      'Design assumptions (educational basis, not site measurements): Germany; 400 V, 50 Hz, three-phase supply.',
      'Assumed 400/230 V TN-S at panel boundary; Q1 switches L1/L2/L3/N. Confirm PE/N separation.',
      'Environment assumed: indoor panel, non-hazardous area, 25 °C ambient; actual IP/thermal needs unresolved.',
      'Proposed motor duty: one 7.5 kW pump drive. Hydraulic duty point and mechanical coupling remain unresolved.',
      'Manufacturer candidate M1: DRN132M4, 15.2 A at 400 V / 50 Hz, power factor 0.78, 1468 rpm.',
      'Published standard winding voltage: 400 V delta / 690 V star. Proposed 400 V operation uses delta.',
      'Input-power sanity check: sqrt(3) × 400 × 15.2 × 0.78 / 1000 = 8.21 kW; 7.5 / 8.21 ≈ 91.3%.',
      'This check is not a motor efficiency certification, starting-current calculation or protective-device sizing.',
      'F2: 14–20 A hardware range; 15.2 A design setting. Verify actual nameplate, manual reset and start duration.',
      'K1: 32 A AC-3. F1/K1/F2 selected from the Siemens IE3/IE4 14–17 A coordination-table row.',
      'Proposed controls: 24 V DC; verify PSU loading, inrush, contact utilisation and suppression compatibility.',
      'Unresolved: prospective fault current, upstream protection, voltage drop, cable methods/lengths and grouping.',
      'Unresolved: pressure trip/reset thresholds, safe failure response, isolator auxiliary contacts and restart risk.',
      'Primary sources: manufacturer URLs attached to the existing K1/F2/M1 library records; retain exact revisions.',
      'Release hold: verify the above, complete A2–A4, independently review, then record actual commissioning.'
    ]);

    const powerLinks=[];
    function part(page,id,ref,x,y,rotation,comment){const obj=createInstance(id,x,y,ref);obj.sheetId=sheets[page].id;obj.rotation=rotation||0;obj.properties.comment=comment;objects.push(obj);return obj;}
    function pin(obj,id){const p=worldPins(obj).find(function(p){return p.id===id;});if(!p)throw new Error('Unknown project terminal '+id);return Object.assign({},p,{attachment:{instanceId:obj.id,pinId:id}});}
    function wire(page,id,a,b,label){const w=attachWire({id:'eng0601-wire-'+id,kind:'wire',sheetId:sheets[page].id,x:a.x,y:a.y,x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:'#3c4853',rotation:0,conductorId:label},a,b);objects.push(w);return w;}
    const k1=part(6,'siemens-3rt2027-2kb40','K1',400,280,0,'Panel contactor, 32 A AC-3. Same device supplies the power poles, coil and seal-in contact.'),
      f2=part(7,'siemens-3ru2126-4bb0','F2',400,300,0,'Panel overload relay; educational setting 15.2 A. Verify motor nameplate, starting duration and manual reset.'),
      f1=part(13,'siemens-3rv2321-4bc10','F1',400,300,0,'Magnetic-only starter protection. Separate F2 provides overload protection. Not the installation main isolator.');
    f2.properties.overloadSettingA=15.2;
    text(13,'feeder-basis',680,125,'MOTOR FEEDER — ENGINEERING DEVELOPMENT\nF1: magnetic-only 3RV2321-4BC10, 20 A / 260 A.\nF2 separately provides thermal overload protection.\nSiemens 400 V / Class 10 type-2 table, page 34:\n3RV2321-4BC10 + 3RT2027 + 3RU2126-4BB0.\nIE3/IE4 table setting range: 14–17 A.\nF2 design setting 15.2 A; verify actual motor data.\nPage 35 permits other coil voltages and spring terminals.\nDo not assemble a mechanically linked triple combination.\nBreaker Icu 55 kA / Ics 25 kA at 400 V.\nThese are device ratings, not a declared system rating.\nSite fault level, cable checks and main isolation pending.',12,460);
    text(13,'feeder-source',60,550,'Source: Siemens A8E56203880102A/RS-AB/006, 09/2017, pp. 34–35.\nAll six continuations are paired native electrical links. Main isolation must also account for the auxiliary supply.',11,1070);
    ['L1','L2','L3'].forEach(function(phase,index){
      const n=index+1,x=350+index*50;
      const source=part(6,'phoenix-contact-3004362','X1:'+n,100,[160,340,440][index],0,'Supply interface '+phase+'. Feeds F1 on the feeder sheet. Upstream common isolation and cable design remain outstanding.');
      continuation('feeder-input-'+n,source,'connection-2',{x:180,y:[160,340,440][index]},f1,'line-l'+n,{x:x,y:180-index*30},'FEED-'+phase,'right','left');
      continuation('feeder-output-'+n,f1,'load-t'+n,{x:x,y:480-index*40},k1,'power-l'+n,{x:x,y:150-index*30},'PROT-'+phase,'right','left');
      text(6,'supply-label-'+n,65,[130,310,410][index],phase,12,70);
      const outgoing={x:x,y:480-index*40},incoming={x:x,y:180-index*40};
      const a=wire(6,'k1-out-'+n,pin(k1,'power-t'+n),outgoing,'K1-T'+n);
      const b=wire(7,'f2-in-'+n,incoming,pin(f2,'line-l'+n),'K1-T'+n);
      a.continuationEnds=['end'];b.continuationEnds=['start'];
      powerLinks.push({id:'eng0601-k1-f2-'+n,name:'K1:'+String(n*2)+'/T'+n+' → F2:'+String(n*2-1)+'/L'+n,endpoints:[
        {sheetId:sheets[6].id,wireId:a.id,point:outgoing,connector:{targetSheetId:sheets[7].id,targetRef:'F2',direction:'right'}},
        {sheetId:sheets[7].id,wireId:b.id,point:incoming,connector:{targetSheetId:sheets[6].id,targetRef:'K1',direction:'left'}}
      ]});
      const load=part(7,'phoenix-contact-3004362','X2:'+n,x,480,90,'Outgoing motor circuit interface. Field maintenance isolator, motor, cable and PE route are not yet drawn.');
      wire(7,'f2-load-'+n,pin(f2,'load-t'+n),pin(load,'connection-1'),'F2-T'+n);
      text(7,'load-label-'+n,x-12,545,'T'+n,12,70);
    });
    text(6,'power-notes',680,120,
      'PANEL POWER SEGMENT — DEVELOPMENT\n\nX1:1 / :2 / :3 are supply interfaces.\nUpstream isolation and protection remain unresolved.\n\nK1: Siemens 3RT2027-2KB40\nMain poles: 1/L1–2/T1, 3/L2–4/T2, 5/L3–6/T3.\nCoil and auxiliary contacts link to the control sheet.\n\nK1-T1/T2/T3 continue to F2 on the next sheet.\nClick a continuation to open its matching sheet.\n\nNo neutral or PE connection is inferred.\nThe protective-earth system must be drawn separately.\n\nNo installation release: fault level, cable sizing,\ncoordination and maintenance isolation are outstanding.',13,460);
    text(7,'overload-notes',680,120,
      'PANEL OVERLOAD SEGMENT — DEVELOPMENT\n\nF2: Siemens 3RU2126-4BB0, 14–20 A, Class 10.\nThree incoming conductors originate at K1.\n95/96 and 97/98 await the control/trip circuits.\n\nX2:1 / :2 / :3 are outgoing circuit interfaces.\nThey do not represent the motor or field isolator.\nMotor, delta links, cable/core IDs and PE remain to draw.\n\nNo overload setting is claimed as approved.\nA 15.2 A candidate motor is within the adjustment range;\nthis alone does not verify protection coordination.\n\nPhysical separation here is documentation only.\nFinal A3 layout must follow mounting instructions.\nOpen boundary and unused-control terminals are intentional.',13,460);

    const q2=part(8,'siemens-3ld2203-0tk51','Q2',400,250,0,'Field maintenance isolator candidate. OFF-lockable front-mounted part; field enclosure, accessories and protection require verification.'),
      m1=part(8,'sew-eurodrive-drn132m4-delta-board','M1',400,450,0,'Field pump motor candidate. 400 V delta schematic; exact motor build, mechanical duty and installation approval unresolved.'),
      pe=part(8,'phoenix-contact-3212147-rail-view','XPE:1',200,530,0,'Panel PE interface shown at the field boundary; rail, enclosure and door bonding remain to be completed.');
    for(let n=1;n<=3;n++){
      const x=300+n*50,terminal=objects.find(function(o){return o.ref==='X2:'+n;}),out={x:x,y:650-(n-1)*40},input={x:x,y:180-(n-1)*40};
      terminal.properties.comment='Panel outgoing phase terminal to field Q2; cable sizing and enclosure selection remain unresolved.';
      const a=wire(7,'field-out-'+n,pin(terminal,'connection-2'),out,'W2:'+n),
        b=wire(8,'field-in-'+n,input,pin(q2,'line-l'+n),'W2:'+n);
      a.continuationEnds=['end'];b.continuationEnds=['start'];
      powerLinks.push({id:'eng0601-x2-q2-'+n,name:'W2:'+n+' · X2:'+n+' → Q2:'+String(n*2-1)+'L'+n,endpoints:[
        {sheetId:sheets[7].id,wireId:a.id,point:out,connector:{targetSheetId:sheets[8].id,targetRef:'Q2',direction:'right'}},
        {sheetId:sheets[8].id,wireId:b.id,point:input,connector:{targetSheetId:sheets[7].id,targetRef:'X2:'+n,direction:'left'}}
      ]});
      const phase=['u','v','w'][n-1],other=['w','u','v'][n-1];
      wire(8,'q2-m1-'+n,pin(q2,'load-t'+n),pin(m1,'winding-'+phase+'1'),'W3:'+n);
      wire(8,'delta-'+n,pin(m1,'winding-'+phase+'1'),pin(m1,'winding-'+other+'2'),'M1 bridge '+n);
    }
    const earth=wire(8,'motor-pe',pin(pe,'connection-2'),pin(m1,'protective-earth'),'PE');
    earth.stroke='#178743';earth.conductorColor='green/yellow';
    text(8,'pe-label',75,620,'PE boundary → M1 frame\nGreen/yellow; never switched.\nVerify PE sizing and upstream bonding.',12,540);
    text(8,'field-notes',680,120,
      'FIELD MOTOR SEGMENT — DEVELOPMENT\n\nQ2: Siemens 3LD2203-0TK51.\nOFF-position locking; three poles; no auxiliary contacts.\n22 A AC-23 at 400 V; 32 A uninterrupted current.\nFront-mounted part: field housing is not yet selected.\n\nM1: SEW DRN132M4 candidate, 7.5 kW / 15.2 A.\n400 V delta: U1–W2, V1–U2 and W1–V2 bridges.\nThis view is schematic, not a physical mounting drawing.\n\nW2 and W3 identify phase circuits, not selected cables.\nLengths, core sizes, grouping and voltage drop are pending.\nPE bypasses Q2; green/yellow identification is explicit.\nNo neutral is used in the motor power circuit.\n\nLock out, secure against reclosure and verify isolation.\nControl restart inhibition and complete protection remain\nunresolved. Do not energise this development design.',13,460);
    objects.find(function(o){return o.id==='eng0601-overload-notes';}).text=
      'PANEL OVERLOAD SEGMENT — DEVELOPMENT\n\nF2: Siemens 3RU2126-4BB0, 14–20 A, Class 10.\nIncoming phases originate at K1.\n95/96 and 97/98 await the control/trip circuits.\n\nX2:1 / :2 / :3 continue via W2:1 / :2 / :3 to Q2.\nUse the paired references to open the field motor sheet.\n\nNo overload setting is claimed as approved.\nThe 15.2 A candidate motor is within the adjustment range;\nthis alone does not verify protection coordination.\n\nPhysical separation here is documentation only.\nFinal A3 layout must follow mounting instructions.\nUnused-control terminals are intentional pending design.';
    for(let n=1;n<=3;n++){const label=objects.find(function(o){return o.id==='eng0601-load-label-'+n;});label.x-=20;}


    const auxiliary=part(8,'siemens-3ld9200-5b','Q2:AUX',150,350,0,'Mechanically mounted to Q2. NO 23/24 interrupts the hold circuit before the motor poles open; verify assembly and sequence.'),
      stop=part(9,'schneider-electric-xb5aa42','S0',250,200,0,'Local stop NC 21/22. Ordinary control only; not an emergency-stop safety circuit.'),
      start=part(9,'schneider-electric-xb5aa31','S1',800,350,0,'Momentary start NO 13/14. Released healthy button assumed; this is not monitored-reset or stuck-button protection.'),
      pressure=part(9,'telemecanique-xmlb004a2s11','B1',500,350,0,'Field discharge-pressure cutout. 11/12 control path; verify contact action and setpoints during commissioning.'),
      positive=part(9,'phoenix-contact-3004362','X3:1',130,180,0,'24 V DC control-source boundary. Source and circuit protection remain to be designed.'),
      negative=part(9,'phoenix-contact-3004362','X3:2',130,520,0,'0 V return boundary. No neutral/PE bond is implied.');
    pressure.properties.risingPressureBar=2;pressure.properties.fallingPressureBar=1;
    pressure.properties.processPoint='Pump discharge';
    pressure.properties.thresholdDesignNote='Educational assumption: stop at 2 bar rising, allow reset below 1 bar. Verify process suitability, contact action and differential before use.';
    function continuation(id,from,fromPin,fromPoint,to,toPin,toPoint,label,fromDirection,toDirection){
      const fp=sheets.findIndex(function(s){return s.id===from.sheetId;}),tp=sheets.findIndex(function(s){return s.id===to.sheetId;}),a=wire(fp,id+'-from',pin(from,fromPin),fromPoint,label),b=wire(tp,id+'-to',toPoint,pin(to,toPin),label);
      a.continuationEnds=['end'];b.continuationEnds=['start'];
      powerLinks.push({id:'eng0601-control-'+id,name:label,endpoints:[{sheetId:from.sheetId,wireId:a.id,point:fromPoint,connector:{targetSheetId:to.sheetId,targetRef:to.ref,targetInstanceId:to.id,direction:fromDirection||'right'}},{sheetId:to.sheetId,wireId:b.id,point:toPoint,connector:{targetSheetId:from.sheetId,targetRef:from.ref,targetInstanceId:from.id,direction:toDirection||'left'}}]});
    }
    const fieldControl=[1,2,3,4].map(function(n){return part(16,'phoenix-contact-3044076','X5:'+n,400,80+n*100,0,'Panel field-control interface; feed-through terminal. Cable/core assignments and accessory selection remain to be verified.');});
    continuation('field-q2-feed',fieldControl[0],'connection-2',{x:580,y:180},auxiliary,'no-23',{x:60,y:270},'Q2-FEED','right','right');
    continuation('field-q2-return',auxiliary,'no-24',{x:280,y:330},fieldControl[1],'connection-2',{x:580,y:280},'Q2-RETURN','left','right');
    continuation('field-b1-feed',fieldControl[2],'connection-2',{x:580,y:380},pressure,'terminal-11',{x:620,y:250},'B1-FEED','right','right');
    continuation('field-b1-return',pressure,'terminal-12',{x:620,y:470},fieldControl[3],'connection-2',{x:580,y:480},'B1-RETURN','right','right');
    text(16,'field-control-basis',60,110,'PANEL X5 — four independent feed-through terminals; field devices remain on their existing sheets.',12,1070);
    text(16,'field-control-notes',740,180,'X5:1 / X5:2 — Q2 auxiliary loop.\nX5:3 / X5:4 — B1 pressure loop.\nNo bridging between these four terminals.\nX5:4 feeds Start and the K1 holding contact.\nTerminal coordinates are schematic only.\nCable/core and physical rail design pending.',12,400);
    wire(9,'control-positive',pin(positive,'connection-2'),pin(stop,'contact-21'),'24V-01');
    continuation('stop-isolator',stop,'contact-22',{x:400,y:200},fieldControl[0],'connection-1',{x:220,y:180},'24V-02 · S0:22 → X5:1','right','right');
    continuation('isolator-overload',fieldControl[1],'connection-1',{x:220,y:280},f2,'aux-95',{x:600,y:250},'24V-03 · X5:2 → F2:95','left','right');
    continuation('overload-pressure',f2,'aux-96',{x:600,y:360},fieldControl[2],'connection-1',{x:220,y:380},'24V-04 · F2:96 → X5:3','right','right');
    continuation('pressure-start',fieldControl[3],'connection-1',{x:340,y:550},start,'contact-13',{x:700,y:530},'24V-05-START','left','right');
    continuation('hold-feed',fieldControl[3],'connection-1',{x:220,y:480},k1,'aux-13',{x:620,y:180},'24V-05-HOLD','right','right');
    continuation('hold-output',k1,'aux-14',{x:620,y:380},start,'contact-14',{x:980,y:430},'24V-06 · K1:14 → S1:14','right','left');
    continuation('coil-command',start,'contact-14',{x:980,y:350},k1,'coil-a1',{x:200,y:220},'24V-06 · S1:14 → K1:A1','left','left');
    continuation('coil-return',negative,'connection-2',{x:260,y:520},k1,'coil-a2',{x:260,y:550},'0V · X3:2 → K1:A2','right','right');
    k1.properties.comment='Same physical K1: power poles on this sheet; coil and NO seal-in connected to local control. No actuation simulation or approval.';
    f2.properties.comment='15.2 A educational setting; verify nameplate, start time and manual reset. 95/96 interrupts control; 97/98 drives trip indication.';
    text(9,'control-source',60,110,'24 V DC SOURCE BOUNDARY — protection and supply design pending',13,1050);
    text(9,'control-stop',185,145,'S0 · STOP (NC)',13,200);
    text(9,'control-start',745,300,'S1 · START (NO)',13,250);
    text(9,'control-pressure',380,435,'B1 · pressure permissive (field)',12,240);
    text(9,'control-notes',680,95,'DEVELOPMENT — NOT FOR ENERGISATION\nStop, Q2 OFF, F2 trip or B1 cutout drops K1.\nK1:13/14 parallels S1 for the hold path.\nRestoration requires Start with a healthy released button.\nNo monitored reset or safety function is claimed.\nB1: 2 bar / 1 bar are educational process assumptions.\nIndicator, supply protection and checks remain unfinished.',11,460);
    objects.find(function(o){return o.id==='eng0601-field-notes';}).text=objects.find(function(o){return o.id==='eng0601-field-notes';}).text.replace('OFF-position locking; three poles; no auxiliary contacts.','OFF-position locking; three poles; added Q2:AUX.').replace('Control restart inhibition and complete protection remain','Q2:AUX opens the control hold path; complete protection remains');
    objects.find(function(o){return o.id==='eng0601-overload-notes';}).text=objects.find(function(o){return o.id==='eng0601-overload-notes';}).text.replace('95/96 and 97/98 await the control/trip circuits.','95/96 connects the control chain; 97/98 remains spare.').replace('Unused-control terminals are intentional pending design.','Verify reset mode and protection before energisation.');

    const powerNote=objects.find(function(o){return o.id==='eng0601-power-notes';});
    if(powerNote){powerNote.x=680;powerNote.y=470;powerNote.fontSize=12;powerNote.text='PANEL POWER SEGMENT — DEVELOPMENT\nK1 coil and seal-in refer to local control.\nF1 protection refers to the feeder sheet.\nVerify coordination and cable sizing.\nDo not energise this development design.';}
    const overloadNote=objects.find(function(o){return o.id==='eng0601-overload-notes';});
    overloadNote.x=680;overloadNote.y=430;overloadNote.fontSize=12;overloadNote.text='PANEL OVERLOAD SEGMENT — DEVELOPMENT\nF2 95/96 is in the control hold chain.\n97/98 is reserved for trip indication.\nX2 phases continue to field Q2.\nF2 design setting 15.2 A; verify reset and application.\nNo installation approval is claimed.';

    const ps1=part(10,'siemens-sitop-psu100c-6ep1332-5ba00','PS1',550,290,0,'230 V AC design assumption; 24 V / 2.5 A. Verify derating, source reserve, input protection and commissioning.'),
      f3=part(10,'siemens-5sy4110-7','F3',330,180,0,'C10 follows PSU input recommendation. Fault level, cable protection and upstream isolation require final checks.'),
      f4=part(10,'phoenix-contact-2908262','F4',800,250,0,'Design setting 1 A; factory setting is 4 A. Program and verify physically. IN− is self supply only; return load directly to PSU.'),
      acL=part(10,'phoenix-contact-3004362','X4:L',150,180,0,'230 V AC line from the same installation, downstream of main isolation. Upstream supply sheet remains unfinished.'),
      acN=part(10,'phoenix-contact-3004362','X4:N',150,290,0,'Neutral for 230 V auxiliary supply. Never connect this directly to the DC return.'),
      auxPE=part(10,'phoenix-contact-3212147-rail-view','XPE:2',150,350,0,'Unswitched protective-earth connection to PSU; same installation PE as the motor. Rail/bonding installation remains to document.');
    f4.properties.channelCurrentA=1;
    wire(10,'aux-ac-line',pin(acL,'connection-2'),pin(f3,'terminal-top'),'L-AUX');
    wire(10,'aux-ac-protected',pin(f3,'terminal-bottom'),pin(ps1,'line-l'),'L-PS1');
    const neutralWire=wire(10,'aux-neutral',pin(acN,'connection-2'),pin(ps1,'line-n'),'N');neutralWire.stroke='#1672b8';neutralWire.conductorColor='blue';
    const psEarth=wire(10,'aux-pe',pin(auxPE,'connection-2'),pin(ps1,'line-pe'),'PE');psEarth.stroke='#178743';psEarth.conductorColor='green/yellow';
    wire(10,'aux-positive',pin(f4,'input-1.1'),pin(ps1,'output-positive'),'24V-RAW');
    wire(10,'aux-self-return',pin(f4,'negative-3.1'),pin(ps1,'output-negative'),'0V-SELF');
    continuation('aux-control-positive',f4,'output-2.1',{x:1040,y:430},positive,'connection-1',{x:60,y:300},'24V-01 · F4:2.1 → X3:1','left','right');
    continuation('aux-control-return',ps1,'output-negative',{x:640,y:500},negative,'connection-1',{x:60,y:580},'0V · PS1:− → X3:2','left','right');
    const incomingPE=part(17,'phoenix-contact-3212147-rail-view','XPE:0',350,250,0,'Incoming site PE boundary at connection 1; grounding foot feeds the documented rail PE paths. Verify rail assembly, current capacity and protective continuity.');
    continuation('pe-rail-motor',incomingPE,'rail-foot',{x:350,y:440},pe,'rail-foot',{x:60,y:570},'PE-RAIL-M','right','right');
    continuation('pe-rail-aux',incomingPE,'rail-foot',{x:500,y:350},auxPE,'rail-foot',{x:60,y:420},'PE-RAIL-AUX','right','right');
    text(17,'pe-boundary',60,110,'SITE PE BOUNDARY — XPE:0 connection 1; separate from all switched phases, neutral and DC return.',12,1070);
    text(17,'pe-rail-notes',650,170,'EXPLICIT PE PATHS — ENGINEERING DEVELOPMENT\nXPE:0/1/2 are panel protective-conductor terminals.\nRAIL denotes each terminal grounding foot, not a clamp.\nGreen rail paths document conductive mounting continuity.\nThey are not two wires inserted in one conductor clamp.\nXPE:1 connection 2 supplies the motor PE terminal.\nXPE:2 connection 2 supplies the power-supply PE terminal.\nUnused conductor clamps remain available, not bridged.',12,480);
    text(17,'pe-release-checks',60,520,'INSTALLATION CHECKS STILL REQUIRED\nSelect and verify conductive rail, supports, connections and fault-current capacity.\nProvide enclosure, mounting-plate and door bonding when their hardware is selected.\nVerify protective continuity physically; no test result or installation approval is claimed.',12,630);
    pe.properties.comment='Panel PE terminal: motor conductor at connection 2; explicit grounding-foot path to XPE:0. Verify conductive rail and assembly.';
    auxPE.properties.comment='Panel PE terminal: PSU conductor at connection 2; explicit grounding-foot path to XPE:0. Verify conductive rail and assembly.';
    for(const o of objects.filter(function(o){return o.id.startsWith('eng0601-wire-pe-rail-');})){o.stroke='#178743';}
    positive.properties.comment='Protected 24 V from F4 output 2.1 via paired continuation. Same physical control interface.';
    negative.properties.comment='Load return directly to PS1 negative output, not through F4 self-supply terminals. No N/PE bond is implied.';
    text(10,'aux-assumption',60,105,'DESIGN ASSUMPTION: 230 V AC L/N/PE auxiliary feed; upstream main isolation and final cable checks outstanding.',12,1080);
    text(10,'aux-line-label',110,135,'L · AC input',12,150);text(10,'aux-neutral-label',80,260,'N',12,70);
    text(10,'aux-notes',700,470,'AUXILIARY SUPPLY — DEVELOPMENT\nPS1: 24 V / 2.5 A; F4 design setting 1 A.\nK1 nominal coil: 4.5 W / 24 V = 0.1875 A.\nF4 self demand: typically 12 mA.\nVerify fault reserve, cables and protection.\nIN− must never carry the load return.',11,450);
    text(10,'aux-pe-note',60,560,'PE is continuous and unswitched.\nNo automatic N–0V or PE–0V bond.\nDetermine secondary earthing in the final design.',11,560);
    objects.find(function(o){return o.id==='eng0601-control-source';}).text='24 V DC FROM PS1 / F4 — paired supply references; verify final protection and commissioning';
    objects.find(function(o){return o.id==='eng0601-control-notes';}).text=objects.find(function(o){return o.id==='eng0601-control-notes';}).text.replace('Indicator, supply protection and checks remain unfinished.','Indicator and final protection checks remain unfinished.');

    const h1=part(11,'schneider-electric-xb5avb3','H1',500,220,0,'Panel door. Parallel to K1 coil voltage; not proof of contact closure, motor rotation or flow.'),
      h2=part(11,'schneider-electric-xb5avb4','H2',500,400,0,'Panel door. Powered through F2 97/98 trip contact; dark lamp is not proof that overload or supply is healthy.');
    h1.properties.legend='K1 COIL VOLTAGE';h2.properties.legend='F2 TRIP CONTACT';
    continuation('h1-command',start,'contact-14',{x:920,y:520},h1,'terminal-x1',{x:300,y:220},'24V-06 · H1:X1','left','right');
    continuation('trip-feed',f2,'aux-97',{x:550,y:400},positive,'connection-2',{x:180,y:410},'24V-01 · F2:97','right','right');
    continuation('trip-indication',f2,'aux-98',{x:520,y:450},h2,'terminal-x1',{x:300,y:400},'TRIP · H2:X1','right','right');
    continuation('indication-return',h1,'terminal-x2',{x:650,y:520},negative,'connection-2',{x:260,y:620},'0V · H1/H2 return','right','right');
    wire(11,'h2-return',pin(h2,'terminal-x2'),pin(h1,'terminal-x2'),'0V');
    text(11,'h1-title',300,150,'H1 · K1 coil-voltage indication',15,650);
    text(11,'h2-title',300,330,'H2 · F2 overload-trip contact',15,650);
    text(11,'h1-notes',700,180,'GREEN LENS — XB5AVB3\nVoltage is taken from the K1 coil-command net.\nLamp on does not prove main contacts closed,\nmotor rotation, hydraulic flow or safe isolation.',12,430);
    text(11,'h2-notes',700,360,'RED LENS — XB5AVB4\nF2 97/98 supplies the lamp after a trip.\nIndication requires the protected 24 V supply.\nVerify physical contact action and reset mode.\nDark is not a healthy-state guarantee.',12,430);
    text(11,'indication-load',60,580,'Each pilot light: manufacturer 18 mA at rated supply.\nConservative nominal sum: K1 0.1875 A + two lights 0.036 A + F4 self demand 0.012 A = 0.2355 A.\nThis is not a fault-current, startup, cable-sizing or protection-coordination calculation.',11,630);
    f2.properties.comment='95/96 in control hold chain; 97/98 feeds H2 trip indication. Verify overload setting, reset mode and short-circuit coordination.';
    objects.find(function(o){return o.id==='eng0601-overload-notes';}).text=objects.find(function(o){return o.id==='eng0601-overload-notes';}).text.replace('97/98 is reserved for trip indication.','97/98 supplies the H2 trip indicator.');
    objects.find(function(o){return o.id==='eng0601-control-notes';}).text=objects.find(function(o){return o.id==='eng0601-control-notes';}).text.replace('Indicator and final protection checks remain unfinished.','H1/H2 are on the indication sheet; final checks remain.');

    text(12,'sequence-basis',60,110,'EXPECTED BEHAVIOUR — engineering review, not recorded physical test results',14,1060);
    rows(12,[
      'Normal start: Q2 ON; S0 closed; F2 healthy; B1 permissive; protected 24 V available.',
      'Press S1: 13/14 supplies K1:A1. K1 auxiliary 13/14 maintains the command after S1 release.',
      'Press S0: its NC 21/22 opens the series chain; K1 drops and its holding contact opens.',
      'Q2 OFF: Q2:AUX NO 23/24 opens before the main poles; the control holding path is interrupted.',
      'F2 trip: NC 95/96 opens the holding path; NO 97/98 supplies H2 if control power remains available.',
      'B1 cutout: assumed 11/12 control path opens; verify actual switching action at commissioning.',
      'Loss of AC auxiliary feed or F4 output: K1 and H1 lose voltage. H2 cannot indicate without its supply.',
      'Restore power, pressure, Q2 or reset F2: with S1 released, K1 must remain de-energised.',
      'Restart: clear the cause, restore permissives and deliberately press/release S1.',
      'H1 indicates coil-command voltage only. H2 indicates the overload trip contact, not every fault.',
      'Held/welded S1 can cause restart when a permissive returns; this circuit has no monitored reset.',
      'Welded K1 power contacts are not detected. Neither lamp proves stopped motion or safe isolation.',
      'Ordinary stop and interlocks are not emergency-stop or safety-rated protective functions.',
      'Before maintenance: isolate all applicable supplies, secure against reclosure and verify absence of voltage.',
      'Commissioning acceptance: exercise each event; record measured results and responsible reviewer in A4.',
      'Do not energise: main protection, cable checks, full bonding, layout and independent review remain open.'
    ]);
    objects.find(o=>o.id==='eng0601-sequence-basis').y=95;
    const controlNotes=objects.find(o=>o.id==='eng0601-control-notes');
    controlNotes.text=controlNotes.text.replace('Indicator, supply protection and checks remain unfinished.','H1/H2 and PS1/F3/F4 are connected; final checks remain.');
    objects.find(o=>o.id==='eng0601-control-source').text='24 V DC FROM PS1 VIA F4 — see auxiliary supply sheet; final protection checks pending';
    positive.properties.comment='Protected 24 V from PS1 through F4; see auxiliary supply sheet. Final coordination and cable checks remain open.';
    objects.find(o=>o.id==='eng0601-p5-r11').text='B1 thresholds 2 bar rising / 1 bar falling are assumed; verify process suitability and contact action.';
    const q1=part(14,'siemens-3ld2244-1tl51','Q1',400,260,0,'Common L1/L2/L3/N isolation candidate. Incoming terminals remain live with Q1 OFF. Neutral timing, protection and assembly require verification.');
    ['L1','L2','L3'].forEach(function(phase,index){
      const n=index+1,target=objects.find(function(o){return o.ref==='X1:'+n;});
      continuation('main-phase-'+n,q1,'load-t'+n,{x:325+index*50,y:470-index*40},target,'connection-1',{x:60,y:[200,380,480][index]},'ISO-'+phase,'right','right');
      target.properties.comment=phase+' from Q1 via paired continuation; supplies F1. Verify cable and upstream protection.';
    });
    continuation('main-aux-line',q1,'load-t1',{x:150,y:350},acL,'connection-1',{x:60,y:220},'ISO-L1-AUX','left','right');
    continuation('main-aux-neutral',q1,'load-n',{x:475,y:510},acN,'connection-1',{x:60,y:320},'ISO-N','right','right');
    for(const o of objects.filter(function(o){return o.id==='eng0601-wire-main-aux-neutral-from'||o.id==='eng0601-wire-main-aux-neutral-to';})){o.stroke='#1672b8';o.conductorColor='blue';}
    text(14,'main-boundary',60,110,'SITE BOUNDARY: assumed 400/230 V, L1/L2/L3/N and separate PE. Verify supply and upstream protection.',12,1080);
    text(14,'main-input',230,155,'L1         L2         L3          N',12,400);
    text(14,'main-notes',650,180,'COMMON ISOLATION — DEVELOPMENT\nQ1 switches phases and neutral; never PE.\nMotor feeder and auxiliary L/N share Q1.\nIncoming terminals stay live with Q1 OFF.\n32 A Iu is not an overcurrent trip rating.\nVerify utilization category and upstream protection.\nNeutral contact sequence remains unverified.\nNo emergency-stop or switch simulation claimed.',12,480);
    text(14,'main-pe',60,560,'PE remains continuous through XPE:1 and XPE:2 on the existing field/auxiliary sheets.\nNo N–PE or DC-return–PE bond is inferred. Complete panel bonding and cable design remain outstanding.',11,630);
    acL.properties.comment='L1 downstream of common Q1 isolation via paired continuation; F3 protects the auxiliary branch.';
    acN.properties.comment='Neutral downstream of Q1 neutral pole via paired continuation; separate from PE and DC return.';
    objects.find(function(o){return o.id==='eng0601-aux-assumption';}).text='230 V AC auxiliary L/N from Q1 on A2/014; separate continuous PE. Final protection and cable checks outstanding.';
    for(const o of objects.filter(function(o){return o.kind==='text';})){o.text=o.text.replace('Upstream isolation and protection remain unresolved.','Q1 supplies the feeder; upstream protection checks remain.').replace('Site fault level, cable checks and main isolation pending.','Site fault level, cable and isolation application checks pending.');}
    const terminalReport=analyzeProject(parseProject(serializeProject({project:name||'Pump starter',sections:sections,sheets:sheets,objects:objects,crossSheetConnections:powerLinks})).project);
    const fieldRefs=['X2:1','X2:2','X2:3','XPE:1','XPE:2'];
    const terminalRows=[];
    fieldRefs.forEach(function(ref){
      if(ref==='XPE:1')while(terminalRows.length<16)terminalRows.push('');
      const device=objects.find(function(o){return o.ref===ref;});
      const page=sheets.find(function(s){return s.id===device.sheetId;});
      terminalRows.push(ref+' | '+page.number+' | '+device.componentId);
      const nets=terminalReport.globalNets.filter(function(net){return net.pins.some(function(p){return p.ref===ref;});});
      nets.forEach(function(net){
        net.pins.filter(function(p){return p.ref!==ref&&!p.ref.startsWith('XPE:');}).forEach(function(p){
          const targetPage=sheets.find(function(s){return s.id===p.sheetId;});
          terminalRows.push('  Connected net: '+p.ref+' / '+p.number+' | '+targetPage.number);
        });
      });
      terminalRows.push('');
    });
    text(15,'terminal-report-basis',60,105,'NATIVE NET SNAPSHOT — generated from terminal identities and paired continuations at example creation.',12,1070);
    terminalRows.forEach(function(value,index){if(!value)return;text(15,'terminal-report-'+index,index<16?60:620,145+(index%16)*23,value,11,510);});
    text(15,'terminal-report-scope',60,510,'Editable report snapshot: after rewiring, use Electrical checks to inspect current connectivity.\nRows list connected equipment, not cable cores or terminal order. PE rail paths are on A2/017.\nField control interfaces are on A2/016. Cable selection and physical rail/accessory design remain pending.',11,1070);
    text(18,'continuation-basis',60,105,'TERMINAL-BOUND CONTINUATIONS — editable snapshot at example creation; not a physical cable/core schedule.',12,1070);
    powerLinks.forEach(function(link,index){
      const ends=link.endpoints.map(function(endpoint){
        const segment=objects.find(function(o){return o.id===endpoint.wireId;});
        const binding=Object.values(segment.attachments||{})[0];
        const device=binding&&objects.find(function(o){return o.id===binding.instanceId;});
        const terminal=device&&worldPins(device).find(function(p){return p.id===binding.pinId;});
        const page=sheets.find(function(p){return p.id===endpoint.sheetId;});
        if(!device||!terminal||!page)throw new Error('Unresolved continuation register endpoint: '+link.id);
        return page.number+' '+device.ref+':'+terminal.number;
      });
      text(18,'continuation-row-'+index,index<19?60:620,145+(index%19)*21,ends.join(' → '),10,510);
    });
    text(18,'continuation-scope',60,560,'Each row records one paired continuation. Same-sheet wires are omitted.\nRAIL is a mounting-foot interface, not a conductor clamp.\nAfter rewiring, inspect Electrical checks; this snapshot does not auto-refresh.\nCable products, cores, lengths and installation calculations remain unselected.',10,610);
    return parseProject(serializeProject({project:name||'ENG-0601 — Direct-on-line pump starter',projectId:'eng0601-local-manual',sections:sections,activeSection:'A1',activeSheet:null,openSheetIds:[],sheets:sheets,objects:objects,crossSheetConnections:powerLinks,metadata:{jobNumber:'ENG-0601',drawnBy:'Codex',drawingDate:'2026-11-15',issueStatus:'Engineering development — not approved'},example:{id:'eng0601',description:'ENG-0601 development issue: six A1 documents and eleven connected A2 circuit sheets and two editable reports. Control, source protection, complete bonding, cable sizing and installation remain incomplete.'}})).project;
  }
  function projectExamples() {
    return [{id:'eng0601',name:'ENG-0601 · Pump starter (development)',description:'Six A1 documents and eleven connected A2 circuit sheets and two editable reports including motor feeder protection, field isolation, delta motor terminals and PE. Control, complete bonding, protection coordination and A3–A4 remain incomplete; not installation-approved.'},
      {id:'indicator',name:'Indicator circuit',description:'Terminal → fuse → contact → lamp → return terminal. Generic schematic; no supply rating or simulation.'},
      {id:'relay',name:'Relay control circuit',description:'Terminal → fuse → contact → relay coil → return terminal. Generic schematic; no protection sizing or simulation.'},
      {id:'hardware-plc-input',hardware:true,name:'PLC digital input bench',description:'Siemens CPU 1212C DC/DC/DC with Schneider NO pushbutton, 24 V supply/return and functional-earth boundaries. No PLC program or simulation; protection, bonding and unused channels require engineering.'},
      {id:'hardware-relay',hardware:true,name:'24 V momentary relay control',description:'Phoenix Contact relay and terminals with Schneider start/stop buttons. External supply/load boundaries; no seal-in or safety function.'},
      {id:'hardware-sensor',hardware:true,name:'PNP proximity sensor terminal wiring',description:'ifm IFS204 pin 1 supply, pin 3 return and pin 4 output with Phoenix Contact terminals. External supply/PLC boundaries.'},
      {id:'hardware-sitop',hardware:true,name:'SITOP 24 V terminal distribution',description:'Siemens PSU100C output distribution through Phoenix Contact terminals. Input supply, bonding and protection require engineering.'}];
  }
  function createHardwareExample(example, name) {
    const sheetId='example-'+example.id,objects=[],byRef={};
    function device(id,ref,x,y,comment){const instance=createInstance(id,x,y,ref);instance.sheetId=sheetId;instance.properties.comment=comment||'';objects.push(instance);byRef[ref]=instance;return instance;}
    function connect(from,pinA,to,pinB){const a=byRef[from],b=byRef[to],ap=worldPins(a).find(function(p){return p.id===pinA;}),bp=worldPins(b).find(function(p){return p.id===pinB;});if(!ap||!bp)throw new Error('Example references an unknown terminal.');objects.push(attachWire({id:'wire-'+example.id+'-'+objects.length,kind:'wire',sheetId:sheetId,x:ap.x,y:ap.y,x1:ap.x,y1:ap.y,x2:bp.x,y2:bp.y,rotation:0,stroke:'#164eac'},Object.assign({},ap,{attachment:{instanceId:a.id,pinId:ap.id}}),Object.assign({},bp,{attachment:{instanceId:b.id,pinId:bp.id}})));}
    const ut='phoenix-contact-3044076',uk='phoenix-contact-3004362';
    if(example.id==='hardware-plc-input'){
      device(ut,'X1',160,204,'External protected 24 V DC supply. Source selection and protection remain project-specific.');
      device(ut,'X2',400,222,'External DC return shared by CPU supply M and input common 1M.');
      device(ut,'X3',500,240,'Functional-earth interface to engineered cabinet bonding; this feed-through terminal is not a PE rail-bonding terminal.');
      device('schneider-electric-xb5aa31','S1',350,312,'NO momentary contact to CPU X10:7 (DI a.0); PLC address/program configuration is not simulated.');
      device('siemens-6es7212-1ae40-0xb0','A1',750,330,'Sinking input with 1M on DC return. Sensor supply, outputs and unused analog inputs require separate project engineering; see manufacturer wiring notes.');
      connect('X1','connection-2','A1','x10-1');connect('X2','connection-2','A1','x10-2');connect('X3','connection-2','A1','x10-3');
      connect('X1','connection-1','S1','contact-13');connect('S1','contact-14','A1','x10-7');connect('A1','x10-6','X2','connection-1');
    }else if(example.id==='hardware-relay'){
      device(uk,'X1',140,320,'External protected 24 V DC positive supply boundary; protection and supply selection remain project-specific.');
      device(ut,'X2',500,180,'External 0 V return boundary.');
      device('schneider-electric-xb5aa42','S1',320,320,'Momentary stop NC 21/22; not an emergency-stop safety circuit.');
      device('schneider-electric-xb5aa31','S2',500,320,'Momentary start NO 13/14. No seal-in circuit is modeled.');
      device('phoenix-contact-2966171','K1',760,300,'A1 positive; A2 return. Contacts 11/12/14 are not simulated.');
      device(ut,'X3',1000,300,'External dry-contact common boundary.');
      device(ut,'X4',1000,440,'External normally-open load interface; assign an appropriate load and protection.');
      connect('X1','connection-2','S1','contact-21');connect('S1','contact-22','S2','contact-13');connect('S2','contact-14','K1','coil-a1');connect('X2','connection-2','K1','coil-a2');connect('K1','contact-11','X3','connection-1');connect('K1','contact-14','X4','connection-1');
    }else if(example.id==='hardware-sensor'){
      device(ut,'X1',200,310,'External 24 V DC positive supply boundary.');device(ut,'X2',400,350,'External 0 V return boundary.');device('ifm-ifs204','B1',750,330,'PNP normally-open output on M12 pin 4; connect to a compatible input. No switching simulation.');device(ut,'X3',1000,330,'External PLC digital-input interface; select a compatible input and common.');
      connect('X1','connection-2','B1','pin-1-lplus');connect('X2','connection-2','B1','pin-3-lminus');connect('B1','pin-4-output','X3','connection-1');
    }else if(example.id==='hardware-sitop'){
      device('siemens-sitop-psu100c-6ep1332-5ba00','PS1',300,300,'L/N/PE input boundary intentionally left for site-specific supply, protection and bonding design.');device(uk,'X1',650,270,'24 V positive distribution terminal.');device(ut,'X2',650,330,'0 V return distribution terminal.');connect('PS1','output-positive','X1','connection-1');connect('PS1','output-negative','X2','connection-1');
    }
    objects.push({id:'note-'+example.id,kind:'text',sheetId:sheetId,x:100,y:100,text:example.name,rotation:0,stroke:'#164eac'});
    objects.push({id:'scope-'+example.id,kind:'text',sheetId:sheetId,x:100,y:600,text:'Editable wiring example. External boundaries and spare pins remain to be engineered; not simulated or certified.',rotation:0,stroke:'#164eac'});
    return parseProject(serializeProject({project:String(name||example.name).slice(0,80),activeSheet:sheetId,sheets:[{id:sheetId,name:example.name,number:'A3/201'}],objects:objects,crossSheetConnections:[],example:{id:example.id,description:example.description}})).project;
  }

  function createExample(id, name) {
    if(id==='eng0601')return createPumpStarterDocumentation(name);
    const example=projectExamples().find(function(item){return item.id===id;});
    if(!example)throw new Error('Unknown project example.');
    if(example.hardware)return createHardwareExample(example,name);
    const sheetId='example-'+id, kinds=['terminal','fuse','contact',id==='indicator'?'lamp':'coil','terminal'], refs=['X1','F1','S1',id==='indicator'?'H1':'K1','X2'];
    const instances=kinds.map(function(kind,index){const instance=createInstance('eplan-'+kind,200+index*160,300,refs[index]);instance.sheetId=sheetId;instance.properties.comment=index===0?'Supply boundary: assign the actual supply and rating':index===4?'Return boundary: assign the actual return':example.description;return instance;});
    const wires=[];
    for(let i=0;i<instances.length-1;i++){
      const a=instances[i],b=instances[i+1],ap=worldPins(a).slice().sort(function(p,q){return q.x-p.x;})[0],bp=worldPins(b).slice().sort(function(p,q){return p.x-q.x;})[0];
      wires.push(attachWire({id:'wire-'+id+'-'+i,kind:'wire',sheetId:sheetId,x:ap.x,y:ap.y,x1:ap.x,y1:ap.y,x2:bp.x,y2:bp.y,rotation:0,stroke:'#164eac'},Object.assign({},ap,{attachment:{instanceId:a.id,pinId:ap.id}}),Object.assign({},bp,{attachment:{instanceId:b.id,pinId:bp.id}})));
    }
    const project={project:String(name||example.name).slice(0,80),activeSheet:sheetId,sheets:[{id:sheetId,name:example.name,number:'A3/201'}],objects:instances.concat(wires),crossSheetConnections:[],example:{id:id,description:example.description}};
    return parseProject(serializeProject(project)).project;
  }

  function analyze(objects) {
    const source = Array.isArray(objects) ? objects : [];
    const wires = [];
    const pins = [];
    const errors = wireAttachmentIssues(source);
    const invalidWires = new Set(errors.map(function(issue){return issue.objectId;}));
    const validInstances = [];

    source.forEach(function (object, index) {
      if (!object || object.kind !== 'wire' || invalidWires.has(object.id)) return;
      const coords = [object.x1, object.y1, object.x2, object.y2];
      if (!coords.every(finite)) {
        errors.push({ code: 'invalid-coordinate', objectId: object.id || null, message: 'A wire has a missing or non-finite endpoint.' });
        return;
      }
      const start = { x: object.x1, y: object.y1 };
      const bend = { x: object.x2, y: object.y1 };
      const end = { x: object.x2, y: object.y2 };
      const segments = [[start, bend], [bend, end]]
        .filter(function (pair) { return Math.abs(pair[0].x - pair[1].x) > EPSILON || Math.abs(pair[0].y - pair[1].y) > EPSILON; })
        .map(function (pair) { return { a: pair[0], b: pair[1] }; });
      if (!segments.length) {
        errors.push({ code: 'zero-length-wire', objectId: object.id || null, message: 'A wire has zero length.' });
        return;
      }
      wires.push({ id: object.id || 'wire-' + (index + 1), points: [start, bend, end], start: start, end: end, segments: segments, attachments: object.attachments, continuationEnds: (Array.isArray(object.continuationEnds)?object.continuationEnds:[]).concat(Array.isArray(object.detachedEnds)?object.detachedEnds:[]) });
    });

    source.forEach(function (object) {
      if (!object || object.kind !== 'component-instance') return;
      const validation = validateInstance(object);
      if (!validation.valid) {
        validation.errors.forEach(function (message) {
          errors.push({ code: 'invalid-component-instance', objectId: object.id || null, message: message });
        });
        return;
      }
      validInstances.push(object);
      worldPins(object).forEach(function (pin) {
        pins.push({ instanceId: object.id, ref: object.ref, pinId: pin.id, number: pin.number, name: pin.name, point: { x: pin.x, y: pin.y } });
      });
    });

    const parents = [];
    const addNode = function () { const id = parents.length; parents.push(id); return id; };
    const find = function (id) {
      while (parents[id] !== id) { parents[id] = parents[parents[id]]; id = parents[id]; }
      return id;
    };
    const join = function (a, b) {
      const rootA = find(a), rootB = find(b);
      if (rootA !== rootB) parents[rootB] = rootA;
    };
    wires.forEach(function (wire) { wire.node = addNode(); });
    pins.forEach(function (pin) { pin.node = addNode(); });

    // Explicit terminal bindings own connectivity; only free endpoints may form geometric branches.
    const junctionPoints = function (wire) { return wire.attachments ? ['start','end'].filter(function (end) { return !wire.attachments[end]&&!wire.continuationEnds.includes(end); }).map(function (end) { return wire[end]; }) : wire.points; };
    for (let i = 0; i < wires.length; i += 1) {
      for (let j = i + 1; j < wires.length; j += 1) {
        const touches = junctionPoints(wires[i]).some(function (point) {
          return wires[j].segments.some(function (segment) { return pointOnSegment(point, segment); });
        }) || junctionPoints(wires[j]).some(function (point) {
          return wires[i].segments.some(function (segment) { return pointOnSegment(point, segment); });
        });
        if (touches) join(wires[i].node, wires[j].node);
      }
    }
    let connectedPinCount = 0;
    pins.forEach(function (pin) {
      const attachedWires = wires.filter(function (wire) {
        if (wire.attachments) return ['start','end'].some(function (end) {
          const attachment = wire.attachments[end];
          return attachment ? attachment.instanceId === pin.instanceId && attachment.pinId === pin.pinId : !wire.continuationEnds.includes(end)&&Math.abs(wire[end].x-pin.point.x)<=EPSILON && Math.abs(wire[end].y-pin.point.y)<=EPSILON;
        });
        return wire.segments.some(function (segment) { return pointOnSegment(pin.point, segment); });
      });
      if (attachedWires.length) connectedPinCount += 1;
      attachedWires.forEach(function (wire) { join(pin.node, wire.node); });
    });

    validInstances.forEach(function (instance) {
      const def = component(instance.componentId);
      def.symbol.internalConnections.forEach(function (pair) {
        const first = pins.find(function (pin) { return pin.instanceId === instance.id && pin.pinId === pair[0]; });
        const second = pins.find(function (pin) { return pin.instanceId === instance.id && pin.pinId === pair[1]; });
        if (first && second) join(first.node, second.node);
      });
    });

    const openEndpoints = [];
    wires.forEach(function (wire) {
      [wire.start, wire.end].forEach(function (endpoint) {
        const connectedToWire = wires.some(function (other) {
          return other !== wire && other.segments.some(function (segment) { return pointOnSegment(endpoint, segment); });
        });
        const connectedToPin = pins.some(function (pin) {
          return Math.abs(pin.point.x - endpoint.x) <= EPSILON && Math.abs(pin.point.y - endpoint.y) <= EPSILON;
        });
        if (!connectedToWire && !connectedToPin) openEndpoints.push({ wireId: wire.id, point: endpoint });
      });
    });

    const groups = new Map();
    wires.forEach(function (wire) {
      const key = find(wire.node);
      if (!groups.has(key)) groups.set(key, { wires: [], pins: [] });
      groups.get(key).wires.push(wire.id);
    });
    pins.forEach(function (pin) {
      const key = find(pin.node);
      if (!groups.has(key)) groups.set(key, { wires: [], pins: [] });
      groups.get(key).pins.push({ instanceId: pin.instanceId, ref: pin.ref, pinId: pin.pinId, number: pin.number, name: pin.name });
    });
    const nets = [];
    groups.forEach(function (group) {
      if (group.wires.length) nets.push(group);
    });
    nets.sort(function (a, b) {
      const aKey = a.wires[0] || a.pins[0].instanceId + ':' + a.pins[0].pinId;
      const bKey = b.wires[0] || b.pins[0].instanceId + ':' + b.pins[0].pinId;
      return aKey.localeCompare(bKey);
    });
    const serializedNets = nets.map(function (net, index) {
      return { id: 'net-' + (index + 1), wireIds: net.wires.slice().sort(), pins: net.pins.slice().sort(function (a, b) { return a.ref.localeCompare(b.ref) || a.number.localeCompare(b.number); }) };
    });

    return {
      componentSchemaVersion: COMPONENT_SCHEMA_VERSION,
      netSchemaVersion: 1,
      wireCount: wires.length,
      componentCount: validInstances.length,
      componentPinCount: pins.length,
      connectedPinCount: connectedPinCount,
      unconnectedPinCount: pins.length - connectedPinCount,
      netCount: serializedNets.length,
      nets: serializedNets,
      openEndpointCount: openEndpoints.length,
      openEndpoints: openEndpoints,
      geometryErrorCount: errors.length,
      errors: errors,
      scope: 'defined component terminals and user-authored orthogonal wire geometry; imported/embedded reference artwork is excluded'
    };
  }


  function analyzeProject(project) {
    const validation = validateProject(project);
    if (!validation.valid) return { valid: false, errors: validation.errors, sheetCount: 0, sheets: [] };
    const objects = Array.isArray(project.objects) ? project.objects : [];
    const definitions = Array.isArray(project.sheets) ? project.sheets : [];
    const sheets = definitions.length ? definitions : [{ id: project.activeSheet || 'main', number: '', name: 'Main sheet' }];
    const reports = sheets.map(function (sheet) {
      const sheetObjects = objects.filter(function (object) {
        return object && (object.sheetId === sheet.id || (!object.sheetId && sheets.length === 1));
      });
      const analysis = analyze(sheetObjects);
      analysis.nets.forEach(function (net) { net.id = sheet.id + ':' + net.id; });
      return { id: sheet.id, number: sheet.number || '', name: sheet.name || '', analysis: analysis };
    });
    const localNets = [];
    const endpointToNet = new Map();
    reports.forEach(function (sheet) {
      sheet.analysis.nets.forEach(function (net) {
        localNets.push({ key: net.id, sheetId: sheet.id, net: net });
        net.wireIds.forEach(function (wireId) { endpointToNet.set(sheet.id + '\u0000' + wireId, net.id); });
      });
    });
    const parents = new Map();
    localNets.forEach(function (entry) { parents.set(entry.key, entry.key); });
    function find(key) {
      let parent = parents.get(key);
      while (parent !== parents.get(parent)) {
        parents.set(parent, parents.get(parents.get(parent)));
        parent = parents.get(parent);
      }
      return parent;
    }
    function join(a, b) {
      const rootA = find(a), rootB = find(b);
      if (rootA !== rootB) parents.set(rootB, rootA);
    }
    const linkedOpenEndpointKeys = new Set();
    const links = (Array.isArray(project.crossSheetConnections) ? project.crossSheetConnections : []).map(function (connection) {
      const endpointNets = connection.endpoints.map(function (endpoint) {
        return endpointToNet.get(endpoint.sheetId + '\u0000' + endpoint.wireId);
      });
      const open = connection.endpoints.map(function (endpoint, index) {
        const sheet = reports.find(function (entry) { return entry.id === endpoint.sheetId; });
        const key = endpoint.sheetId + '\u0000' + endpoint.wireId + '\u0000' + endpoint.point.x + ',' + endpoint.point.y;
        const isOpen = sheet && sheet.analysis.openEndpoints.some(function (candidate) {
          return candidate.wireId === endpoint.wireId &&
            candidate.point.x === endpoint.point.x && candidate.point.y === endpoint.point.y;
        });
        return { key: key, isOpen: Boolean(isOpen), netId: endpointNets[index] };
      });
      if (endpointNets.some(function (key) { return !key; }) || open.some(function (entry) { return !entry.isOpen; })) {
        return { id: connection.id, name: connection.name, valid: false, errors: ['Every link must terminate at a real open endpoint on a valid sheet-local net.'] };
      }
      for (let i = 1; i < endpointNets.length; i += 1) join(endpointNets[0], endpointNets[i]);
      open.forEach(function (endpoint) { linkedOpenEndpointKeys.add(endpoint.key); });
      return {
        id: connection.id,
        name: connection.name,
        valid: true,
        endpoints: connection.endpoints.map(function (endpoint, index) {
          return { sheetId: endpoint.sheetId, wireId: endpoint.wireId, point: endpoint.point, netId: endpointNets[index] };
        })
      };
    });
    const linkErrors = links.filter(function (link) { return !link.valid; }).flatMap(function (link) {
      return link.errors.map(function (message) { return link.id + ': ' + message; });
    });
    if (linkErrors.length) return { valid: false, errors: linkErrors, sheetCount: reports.length, sheets: reports };
    const groups = new Map();
    localNets.forEach(function (entry) {
      const root = find(entry.key);
      if (!groups.has(root)) groups.set(root, { localNetIds: [], sheetIds: [], wireIds: [], pins: [] });
      const group = groups.get(root);
      group.localNetIds.push(entry.key);
      group.sheetIds.push(entry.sheetId);
      entry.net.wireIds.forEach(function (wireId) { group.wireIds.push(entry.sheetId + ':' + wireId); });
      entry.net.pins.forEach(function (pin) { group.pins.push({ sheetId: entry.sheetId, ref: pin.ref, number: pin.number, pinId: pin.pinId }); });
    });
    const globalNets = Array.from(groups.values()).map(function (group) {
      group.localNetIds.sort();
      group.sheetIds = Array.from(new Set(group.sheetIds)).sort();
      group.wireIds.sort();
      group.pins.sort(function (x, y) {
        return x.sheetId.localeCompare(y.sheetId) || x.ref.localeCompare(y.ref) || x.number.localeCompare(y.number);
      });
      return group;
    }).sort(function (x, y) { return x.localNetIds[0].localeCompare(y.localNetIds[0]); })
      .map(function (group, index) { return Object.assign({ id: 'global-net-' + (index + 1) }, group); });
    const localOpenEndpointCount = reports.reduce(function (sum, sheet) { return sum + sheet.analysis.openEndpointCount; }, 0);
    const cableIssues=[],coreNets=new Map();
    (project.objects||[]).filter(function(o){return o.kind==='wire'&&o.cable;}).forEach(function(wire){
      const net=globalNets.find(function(n){return n.wireIds.includes(wire.sheetId+':'+wire.id);});
      if(!net)return;
      const key=JSON.stringify([wire.cable.tag,wire.cable.core]);
      if(!coreNets.has(key))coreNets.set(key,{tag:wire.cable.tag,core:wire.cable.core,nets:new Set()});
      coreNets.get(key).nets.add(net.id);
    });
    coreNets.forEach(function(core){if(core.nets.size>1)cableIssues.push('Cable '+core.tag+' core '+core.core+' is assigned to disconnected electrical nets.');});
    (project.crossSheetConnections||[]).forEach(function(link){
      const assignments=link.endpoints.map(function(e){const wire=project.objects.find(function(o){return o.id===e.wireId;});return wire&&wire.cable?JSON.stringify([wire.cable.tag,wire.cable.core]):'';});
      if(new Set(assignments).size>1)cableIssues.push('Continuation '+link.name+' has inconsistent cable/core assignments.');
    });
    const unresolvedContinuations=project.connectionIssues||[];
    return {
      valid: unresolvedContinuations.length===0&&cableIssues.length===0,
      errors: unresolvedContinuations.map(function(issue){return issue.message;}).concat(cableIssues),
      cableIssues: cableIssues,
      unresolvedContinuations: unresolvedContinuations,
      sheetCount: reports.length,
      wireCount: reports.reduce(function (sum, sheet) { return sum + sheet.analysis.wireCount; }, 0),
      componentCount: reports.reduce(function (sum, sheet) { return sum + sheet.analysis.componentCount; }, 0),
      netCount: reports.reduce(function (sum, sheet) { return sum + sheet.analysis.netCount; }, 0),
      globalNetCount: globalNets.length,
      crossSheetConnectionCount: links.length,
      crossSheetConnections: links,
      globalNets: globalNets,
      localOpenEndpointCount: localOpenEndpointCount,
      openEndpointCount: localOpenEndpointCount - linkedOpenEndpointKeys.size,
      geometryErrorCount: reports.reduce(function (sum, sheet) { return sum + sheet.analysis.geometryErrorCount; }, 0),
      sheets: reports,
      scope: 'Sheet-local nets are joined only at exact, validated open endpoints; connector graphics are not yet rendered.'
    };
  }

  function crossSheetConnectors(project, sheetId) {
    const sheets = new Map((Array.isArray(project && project.sheets) ? project.sheets : []).map(function (sheet) {
      return [sheet.id, sheet];
    }));
    return (Array.isArray(project && project.crossSheetConnections) ? project.crossSheetConnections : []).flatMap(function (connection) {
      return (Array.isArray(connection.endpoints) ? connection.endpoints : []).filter(function (endpoint) {
        return endpoint.sheetId === sheetId && endpoint.connector;
      }).map(function (endpoint) {
        const target = sheets.get(endpoint.connector.targetSheetId);
        const device=(project.objects||[]).find(function(object){return object.id===endpoint.connector.targetInstanceId&&object.sheetId===endpoint.connector.targetSheetId;});
        return {
          id: connection.id + ':' + endpoint.sheetId,
          name: connection.name,
          point: { x: endpoint.point.x, y: endpoint.point.y },
          direction: endpoint.connector.direction,
          targetSheetId: endpoint.connector.targetSheetId,
          targetSheetNumber: target && target.number || endpoint.connector.targetSheetId,
          targetRef: device?device.ref:endpoint.connector.targetRef
        };
      });
    });
  }

  function billOfMaterials(objects) {
    const groups = new Map();
    const errors = [];
    (Array.isArray(objects) ? objects : []).forEach(function (instance, index) {
      if (!instance) return;
      if (instance.kind !== 'component-instance') {
        if (['catalog-symbol', 'terminal', 'plc', 'motor', 'ground'].includes(instance.kind)) errors.push('Object ' + (instance.ref || index + 1) + ': unverified legacy symbol cannot be included in a verified BOM.');
        return;
      }
      const validation = validateInstance(instance);
      if (!validation.valid) {
        errors.push('Object ' + (instance.ref || index + 1) + ': ' + validation.errors.join(' '));
        return;
      }
      const definition = validation.definition;
      if (!Array.isArray(definition.sources) || !definition.sources.length) {
        errors.push('Object ' + instance.ref + ': verified source provenance is missing.');
        return;
      }
      if (!groups.has(definition.id)) groups.set(definition.id, { definition: definition, references: [] });
      groups.get(definition.id).references.push(instance.ref);
    });
    const rows = Array.from(groups.values()).map(function (group) {
      const definition = group.definition;
      const source = definition.sources[0];
      return {
        componentId: definition.id, manufacturer: definition.manufacturer, model: definition.model,
        partNumber: definition.manufacturerPartNumber, description: definition.name,
        quantity: group.references.length,
        references: group.references.slice().sort(function (a, b) { return a.localeCompare(b); }),
        sourcePublisher: source.publisher || '', sourceTitle: source.title || '',
        sourceDocumentRevision: source.documentRevision || '', sourceRevisionNote: source.revisionNote || '',
        sourceUrl: source.url, sourceRetrievedAt: source.retrievedAt || ''
      };
    }).sort(function (a, b) { return a.componentId.localeCompare(b.componentId); });
    return { valid: errors.length === 0, errors: errors, rows: rows };
  }
  function billOfMaterialsCsv(objects) {
    const report = billOfMaterials(objects);
    if (!report.valid) throw new Error('BOM export blocked: ' + report.errors.join(' '));
    const columns = [
      ['Manufacturer', 'manufacturer'], ['Model', 'model'], ['Part number', 'partNumber'],
      ['Description', 'description'], ['Quantity', 'quantity'], ['References', 'references'],
      ['Source publisher', 'sourcePublisher'], ['Source title', 'sourceTitle'],
      ['Source document revision', 'sourceDocumentRevision'], ['Source revision note', 'sourceRevisionNote'],
      ['Source URL', 'sourceUrl'], ['Source retrieved date', 'sourceRetrievedAt']
    ];
    function cell(value) {
      let text = Array.isArray(value) ? value.join(', ') : String(value == null ? '' : value);
      if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
      return '"' + text.replace(/"/g, '""') + '"';
    }
    const lines = [columns.map(function (column) { return cell(column[0]); }).join(',')];
    report.rows.forEach(function (row) { lines.push(columns.map(function (column) { return cell(row[column[1]]); }).join(',')); });
    return '\uFEFF' + lines.join('\r\n') + '\r\n';
  }


  function wireList(objects) {
    const source = Array.isArray(objects) ? objects : [];
    const wires = source.filter(function (object) { return object && object.kind === 'wire'; });
    const errors = [];
    const seen = new Set();
    wires.forEach(function (wire, index) {
      if (typeof wire.id !== 'string' || !wire.id.trim()) errors.push('Wire ' + (index + 1) + ' has no stable object ID.');
      else if (seen.has(wire.id)) errors.push('Wire ID "' + wire.id + '" is duplicated.');
      else seen.add(wire.id);
    });
    source.forEach(function (object, index) {
      if (object && ['catalog-symbol', 'terminal', 'plc', 'motor', 'ground'].includes(object.kind)) {
        errors.push('Object ' + (object.ref || object.id || index + 1) + ': unverified legacy symbols cannot be used for a connected wire list.');
      }
    });
    const analysis = analyze(source);
    analysis.errors.forEach(function (issue) {
      errors.push((issue.objectId ? issue.objectId + ': ' : '') + issue.message);
    });
    if (errors.length) return { valid: false, errors: errors, rows: [] };

    const netByWire = new Map();
    analysis.nets.forEach(function (net) {
      net.wireIds.forEach(function (id) { netByWire.set(id, net); });
    });
    const pinLocations = [];
    source.forEach(function (instance) {
      if (!instance || instance.kind !== 'component-instance') return;
      const validation = validateInstance(instance);
      if (!validation.valid) return;
      worldPins(instance).forEach(function (pin) {
        pinLocations.push({ ref: instance.ref, number: pin.number, x: pin.x, y: pin.y });
      });
    });
    function refsAt(x, y) {
      return pinLocations.filter(function (pin) {
        return Math.abs(pin.x - x) <= EPSILON && Math.abs(pin.y - y) <= EPSILON;
      }).map(function (pin) { return pin.ref + ':' + pin.number; }).sort();
    }
    const rows = wires.map(function (wire) {
      const net = netByWire.get(wire.id);
      const netPins = net ? net.pins.map(function (pin) { return pin.ref + ':' + pin.number; }).sort() : [];
      return {
        wireId: wire.id,
        netId: net ? net.id : '',
        startX: wire.x1,
        startY: wire.y1,
        bendX: wire.x2,
        endX: wire.x2,
        endY: wire.y2,
        lengthMm: Number((Math.abs(wire.x2 - wire.x1) + Math.abs(wire.y2 - wire.y1)).toFixed(6)),
        startPinRefs: refsAt(wire.x1, wire.y1),
        endPinRefs: refsAt(wire.x2, wire.y2),
        netPinRefs: netPins
      };
    }).sort(function (a, b) { return a.wireId.localeCompare(b.wireId); });
    return { valid: true, errors: [], rows: rows };
  }

  function wireListCsv(objects) {
    const report = wireList(objects);
    if (!report.valid) throw new Error('Wire list export blocked: ' + report.errors.join(' '));
    const columns = [
      ['Wire ID', 'wireId'], ['Net ID', 'netId'], ['Start X (mm)', 'startX'],
      ['Start Y (mm)', 'startY'], ['Bend X (mm)', 'bendX'], ['End X (mm)', 'endX'],
      ['End Y (mm)', 'endY'], ['Route length (mm)', 'lengthMm'],
      ['Start pin references', 'startPinRefs'], ['End pin references', 'endPinRefs'],
      ['Connected pin references on net', 'netPinRefs']
    ];
    function cell(value) {
      let text = Array.isArray(value) ? value.join('; ') : String(value == null ? '' : value);
      if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
      return '"' + text.replace(/"/g, '""') + '"';
    }
    const lines = [columns.map(function (column) { return cell(column[0]); }).join(',')];
    report.rows.forEach(function (row) {
      lines.push(columns.map(function (column) { return cell(row[column[1]]); }).join(','));
    });
    return '\uFEFF' + lines.join('\r\n') + '\r\n';
  }

  root.AdigunCADEngine = Object.freeze({
    sheetDeletionDiagnostics: sheetDeletionDiagnostics,
    removeSheetConnections: removeSheetConnections,
    moveProjectSheet: moveProjectSheet,
    defaultProjectSections: defaultProjectSections,
    numberProjectSheets: numberProjectSheets,
    endpointPin: endpointPin,
    attachWire: attachWire,
    synchronizeWireAttachments: synchronizeWireAttachments,
    wireAttachmentIssues: wireAttachmentIssues,
    nextReference: nextReference,
    projectExamples: projectExamples,
    createExample: createExample,
    replaceComponent: replaceComponent,
    removeDrawingObjects: removeDrawingObjects,
    componentSchemaVersion: COMPONENT_SCHEMA_VERSION,
    netSchemaVersion: 1,
    projectFormat: PROJECT_FORMAT,
    projectVersion: PROJECT_VERSION,
    component: component,
    catalog: catalog,
    createInstance: createInstance,
    moveInstance: moveInstance,
    reorderObject: reorderObject,
    resizeGraphicObject: resizeGraphicObject,
    rotateInstance: rotateInstance,
    validateInstance: validateInstance,
    worldPins: worldPins,
    validateProject: validateProject,
    titleBlockValues: titleBlockValues,
    titleBlockBounds: titleBlockBounds,
    titleBlockProjectFields: Object.freeze(titleBlockProjectFields),
    titleBlockSheetFields: Object.freeze(titleBlockSheetFields),
    assignWireCable: assignWireCable,
    serializeProject: serializeProject,
    parseProject: parseProject,
    analyze: analyze,
    analyzeProject: analyzeProject,
    crossSheetConnectors: crossSheetConnectors,
    billOfMaterials: billOfMaterials,
    billOfMaterialsCsv: billOfMaterialsCsv,
    wireList: wireList,
    wireListCsv: wireListCsv
  });
})(typeof window !== 'undefined' ? window : globalThis);


