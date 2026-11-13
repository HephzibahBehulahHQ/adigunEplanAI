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
    specifications: Object.assign({}, contactorDefinition.specifications, { ac3RatedCurrent: { value: 25, unit: 'A' }, ratedOperationalCurrentAC3At400V: { value: 25, unit: 'A' }, ratedMotorPowerAt400V: { value: 11, unit: 'kW' }, auxiliaryContactComposition: { value: '1 NO + 1 NC' }, frameSize: { value: 'S0' }, connectionMethod: { value: 'Spring-loaded terminal' }, coilSuppression: { value: 'Plugged-in varistor' } }),
    sources: [{ publisher: 'Siemens', title: 'SIRIUS 3RT2026-2KB40 product data sheet', url: 'https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RT2026-2KB40', documentRevision: 'Data sheet, 8 pages; retrieved 2026-11-12.', revisionNote: 'Confirms 25 A AC-3, 11 kW at 400 V, 24 V DC coil, 1 NO + 1 NC auxiliary contacts, spring terminals, S0 frame, and circuit diagram terminal labels A1+/A2−, 1/L1–6/T3, 13/14 and 21/22.', retrievedAt: '2026-11-12' }]
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
    ['X12', '1', '1L'], ['X12', '2', 'DQ a.0'], ['X12', '3', 'DQ a.1'], ['X12', '4', 'DQ a.2'],
    ['X12', '5', 'DQ a.3'], ['X12', '6', '2L'], ['X12', '7', 'DQ a.4'], ['X12', '8', 'DQ a.5']
  ];
  const siemensCpuPins = siemensCpuPinRows.map(function (row, index) {
    const group = row[0], groupIndex = siemensCpuPinRows.slice(0, index).filter(function (item) { return item[0] === group; }).length;
    const y = group === 'X10' ? -126 + groupIndex * 18 : group === 'X11' ? -126 + groupIndex * 18 : -8 + groupIndex * 16;
    return { id: group.toLowerCase() + '-' + row[1], localNumber: group + ':' + row[1], name: row[2], x: group === 'X10' ? -130 : 130, y: y, electricalType: 'passive', connectionType: 'plug-in terminal' };
  });
  const siemensCpuDefinition = deepFreeze({
    schemaVersion: COMPONENT_SCHEMA_VERSION, id: 'siemens-6es7212-1ae40-0xb0', manufacturer: 'Siemens', manufacturerPartNumber: '6ES7212-1AE40-0XB0',
    model: 'SIMATIC S7-1200 CPU 1212C DC/DC/DC', name: 'Compact PLC CPU', family: 'plc-cpu', referencePrefix: 'A', category: 'Automation · Verified PLC CPU',
    symbol: { id: 'plc.siemens.cpu-1212c.dcdcdc.v1', view: 'schematic', unit: 'mm', width: 260, height: 290, pins: siemensCpuPins, internalConnections: [], numberingNote: 'Terminal group and pin identities X10, X11 and X12 match Siemens System Manual V4.7, Table A-49. Pin coordinates are schematic connection points, not physical connector geometry.' },
    specifications: {
      onboardDigitalInputs: { value: 8, unit: '24 V DC DI' }, onboardDigitalOutputs: { value: 6, unit: '24 V DC transistor DQ' }, onboardAnalogInputs: { value: 2, unit: '0–10 V DC AI' },
      supplyVoltage: { minimum: 20.4, maximum: 28.8, unit: 'V DC' }, programDataMemory: { value: 100, unit: 'KB' },
      terminalGroups: { value: ['X10 · power, sensor supply and 8 DI', 'X11 · 2 AI and 2M', 'X12 · 6 DQ and load supplies'] }
    },
    instanceProperties: { marking: { type: 'string', default: '', maximumLength: 40 }, position: { type: 'string', default: '', maximumLength: 24 }, comment: { type: 'string', default: '', maximumLength: 160 } },
    sources: [
      { publisher: 'Siemens', title: 'SIMATIC S7-1200 System Manual V4.7 · CPU 1212C DC/DC/DC · Tables A-49 and A-50', url: 'https://support.industry.siemens.com/cs/attachments/109977302/s71200_system_manual_en-US.pdf', documentRevision: 'V4.7 · 12/2024 · A5E02486680-AQ', revisionNote: 'Manufacturer manual supplies exact connector pin assignments for X10, X11 and X12.' , retrievedAt: '2026-11-12' },
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
  const COMPONENTS = Object.freeze({ [terminalDefinition.id]: terminalDefinition, [relayDefinition.id]: relayDefinition, [contactorDefinition.id]: contactorDefinition, [siemensPowerContactorDefinition.id]: siemensPowerContactorDefinition, [siemensOverloadRelayDefinition.id]: siemensOverloadRelayDefinition, [siemensStarDeltaTimerDefinition.id]: siemensStarDeltaTimerDefinition, [schneiderStartPushButtonDefinition.id]: schneiderStartPushButtonDefinition, [schneiderStopPushButtonDefinition.id]: schneiderStopPushButtonDefinition, [motorProtectionBreakerDefinition.id]: motorProtectionBreakerDefinition, [lowRangeMotorProtectionBreakerDefinition.id]: lowRangeMotorProtectionBreakerDefinition, [starDeltaMotorProtectionBreakerDefinition.id]: starDeltaMotorProtectionBreakerDefinition, [motorStarterDefinition.id]: motorStarterDefinition, [motorDefinition.id]: motorDefinition, [sewStarDeltaMotorDefinition.id]: sewStarDeltaMotorDefinition, [siemensCpuDefinition.id]: siemensCpuDefinition, [ifmInductiveSensorDefinition.id]: ifmInductiveSensorDefinition, [ifmPressureSensorDefinition.id]: ifmPressureSensorDefinition, [siemensSitopPsuDefinition.id]: siemensSitopPsuDefinition, [phoenixProtectiveEarthTerminalDefinition.id]: phoenixProtectiveEarthTerminalDefinition });

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
      return { id: def.id, componentId: def.id, name: def.generic ? def.name : def.model + ' · ' + def.manufacturerPartNumber, category: def.category, family: def.family, tag: def.referencePrefix || 'X' };
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
          (!finite(value) || value < rule.minimum || value > rule.maximum);
        const invalidString = rule.type !== 'number' && value !== undefined &&
          (typeof value !== 'string' || value.length > rule.maximumLength);
        if (invalidNumber || invalidString) {
          errors.push('Component property "' + name + '" is invalid.');
        }
      });
      Object.keys(instance.properties).forEach(function (name) {
        if (!Object.prototype.hasOwnProperty.call(def.instanceProperties, name)) errors.push('Unknown editable component property "' + name + '".');
      });
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
  function validateProject(project) {
    const errors = [];
    if (!project || typeof project !== 'object') return { valid: false, errors: ['Project must be a JSON object.'] };
    if (project.format !== PROJECT_FORMAT) errors.push('Unsupported Adigun project format.');
    if (![1, PROJECT_VERSION].includes(project.version)) errors.push('Unsupported project version.');
    if (!Array.isArray(project.objects) || !Array.isArray(project.sheets)) errors.push('Project objects and sheets must be arrays.');
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
      project.objects.forEach(function (object, index) {
        if (!object || typeof object !== 'object') {
          errors.push('Drawing object ' + (index + 1) + ' is invalid.');
          return;
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
              return object && object.kind === 'component-instance' && object.sheetId === graphic.targetSheetId && object.ref === graphic.targetRef;
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
  function analyze(objects) {
    const source = Array.isArray(objects) ? objects : [];
    const wires = [];
    const pins = [];
    const errors = [];
    const validInstances = [];

    source.forEach(function (object, index) {
      if (!object || object.kind !== 'wire') return;
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
      wires.push({ id: object.id || 'wire-' + (index + 1), points: [start, bend, end], start: start, end: end, segments: segments });
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

    for (let i = 0; i < wires.length; i += 1) {
      for (let j = i + 1; j < wires.length; j += 1) {
        const touches = wires[i].points.some(function (point) {
          return wires[j].segments.some(function (segment) { return pointOnSegment(point, segment); });
        }) || wires[j].points.some(function (point) {
          return wires[i].segments.some(function (segment) { return pointOnSegment(point, segment); });
        });
        if (touches) join(wires[i].node, wires[j].node);
      }
    }
    let connectedPinCount = 0;
    pins.forEach(function (pin) {
      const attachedWires = wires.filter(function (wire) {
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
      scope: 'source-backed component instances and user-authored orthogonal wire geometry; imported/embedded reference artwork is excluded'
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
    return {
      valid: true,
      errors: [],
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
        return {
          id: connection.id + ':' + endpoint.sheetId,
          name: connection.name,
          point: { x: endpoint.point.x, y: endpoint.point.y },
          direction: endpoint.connector.direction,
          targetSheetId: endpoint.connector.targetSheetId,
          targetSheetNumber: target && target.number || endpoint.connector.targetSheetId,
          targetRef: endpoint.connector.targetRef
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


