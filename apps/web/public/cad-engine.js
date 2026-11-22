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
  function validDuctInputs({kind,cableDiametersMm,usableCrossSectionMm2,maximumFillPercent}) {
    if(cableDiametersMm===undefined&&usableCrossSectionMm2===undefined&&maximumFillPercent===undefined)return true;
    const positive=(value,min,max)=>finite(value)&&value>=min&&value<=max;
    return kind==='cable-duct'&&
      (cableDiametersMm===undefined||Array.isArray(cableDiametersMm)&&cableDiametersMm.every(value=>positive(value,1e-6,1e6)))&&
      (usableCrossSectionMm2===undefined||positive(usableCrossSectionMm2,1e-9,1e12))&&
      (maximumFillPercent===undefined||positive(maximumFillPercent,1e-6,100));
  }
  function validImportScale(value) { return value===undefined||finite(value)&&value>0&&value<=1000000; }
  const floorEngineeringProfiles=Object.freeze({'de-v1':'Germany · DIN/VDE documentation v1','iec-v1':'IEC documentation v1'});
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
    panelFootprint: {widthMm:45,heightMm:102,depthMm:107,source:'https://media.distributordatasolutions.com/siemenscomplete/2021q1/documents/140fbadef58253c91d9bfa905f73b01c016bbca8.pdf',edition:'2021-01-21',page:5,note:'Manufacturer body envelope from archived Siemens datasheet; no mounting holes or clearance envelope rendered. Verify the delivered revision before installation.',clearancesMm:{sideBySide:{front:10,top:10,bottom:10,side:0},groundedParts:{front:10,top:10,bottom:10,side:6},liveParts:{front:10,top:10,bottom:10,side:6}}},
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
    panelFootprint: { widthMm:45, heightMm:97, depthMm:97, source:'https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2321-4BC10', edition:'2026-11-12', page:3, note:'Body envelope only; mounting holes and clearance envelopes are not represented.' },
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
    panelFootprint: {widthMm:45,heightMm:80,depthMm:100,source:'https://tableeditor.cicservice.siemens.com/teddatasheet/?caller=documentservice&format=PDF&language=en&mlfbs=6EP1332-5BA00',edition:'2026-11-08',page:3,clearancesMm:{top:50,bottom:50,left:0,right:0},mountingEnvelope:{widthMm:45,heightMm:180},note:'Body envelope only; allow 50 mm above and below for convection. 180 mm is installation height including clearance, not body height. DIN rail 35 x 7.5/15; verify orientation, derating and actual assembly.'},
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
    sources: [{publisher:'Siemens',title:'6EP1332-5BA00 data sheet · mechanical data',url:'https://tableeditor.cicservice.siemens.com/teddatasheet/?caller=documentservice&format=PDF&language=en&mlfbs=6EP1332-5BA00',documentRevision:'2026-11-08 · page 3/5',revisionNote:'45 x 80 x 100 mm body; 45 x 180 mm installation envelope; top/bottom 50 mm and side 0 mm spacing; EN 60715 35 x 7.5/15 rail.',retrievedAt:'2026-11-15'}, { publisher: 'Siemens', title: 'SITOP PSU100C operating instructions · 6EP1332-5BA00', url: 'https://support.industry.siemens.com/cs/attachments/65647808/PSU100C_Handbuch_englisch_en-US.pdf', documentRevision: 'C98130-A7599-A1-2-762937 · 06/2013', revisionNote: 'Manufacturer sections 2.2 and 6.1–6.7 identify L/N/PE line input, + and − DC output, 85–264 V AC / 110–300 V DC input ranges, 24 V/2.5 A output and two physical − output screw terminals. Schematic coordinates are not physical geometry.', retrievedAt: '2026-11-12' }]
  });
  const phoenixProtectiveEarthTerminalDefinition = deepFreeze({
    schemaVersion: COMPONENT_SCHEMA_VERSION, id: 'phoenix-contact-3212147', manufacturer: 'Phoenix Contact', manufacturerPartNumber: '3212147',
    panelFootprint: { widthMm:12.2,heightMm:75.4,depthMm:52.6,source:'https://www.phoenixcontact.com/us/products/3212147/pdf',note:'Manufacturer dimensions; depth on NS 35/7.5. Body envelope only: end covers, end clamps, conductor access and mounting clearances are separate. Reviewed 2026-11-15.' },
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
      panelFootprint:{widthMm:width,heightMm:height,depthMm:depth7,source:url,note:'Manufacturer dimensions; depth on NS 35/7.5. Body envelope only: end covers, end clamps, conductor access and mounting clearances are separate. Reviewed 2026-11-15.'},
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
    panelFootprint:{widthMm:67,heightMm:83,depthMm:93,source:'https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3LD2203-0TK51',note:'Manufacturer overall envelope, rounded depth in the current datasheet. Front mounting has four fixings. Use the exact drilling template and check the installed auxiliary block separately.'},
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
    supportedComponentIds:['siemens-3ld2203-0tk51'],
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
    panelFootprint: {widthMm:18,heightMm:90,depthMm:76,source:'https://media.distributordatasolutions.com/siemenscomplete/2021q1/documents/753c2eba1f9ad8086c03b48ce8404e151b080a9b.pdf',edition:'2021-01-19',page:2,note:'Nominal manufacturer body envelope; 70 mm installation depth is distinct from 76 mm overall depth. Mounting details and clearances require verification.'},
    symbol:{id:'breaker.5sy4110-7.v1',view:'schematic',unit:'mm',width:100,height:100,pins:[{id:'terminal-top',localNumber:'TOP',name:'Top terminal · model-local designation',x:-50,y:0,electricalType:'passive',connectionType:'screw'},{id:'terminal-bottom',localNumber:'BOTTOM',name:'Bottom terminal · model-local designation',x:50,y:0,electricalType:'passive',connectionType:'screw'}],internalConnections:[],numberingNote:'Source verifies combined top and bottom terminals. TOP/BOTTOM are model-local physical-side identifiers, not claimed manufacturer terminal numbers. Coordinates are schematic; tripping is not simulated.'},
    specifications:{ratedCurrent:{value:10,unit:'A'},trippingCharacteristic:{value:'C'},poleCount:{value:1},ratedVoltage:{value:'230/400 V AC'},breakingCapacityEN60898:{value:10,unit:'kA'},neutralSwitching:{value:false}},
    instanceProperties:{position:{type:'string',default:'',maximumLength:24},marking:{type:'string',default:'',maximumLength:40},comment:{type:'string',default:'Verify fault level, cable protection and ambient derating.',maximumLength:160}},
    sources:[{publisher:'Siemens',title:'5SY4110-7 manufacturer data sheet',url:'https://cdn-reichelt.de/documents/datenblatt/D710/LS_4110_7_DB_EN.pdf',documentRevision:'12.05.2015 · 5 pages; Siemens document hosted by Reichelt',revisionNote:'Exact C10 single-pole identity, EN 60898 breaking capacity and top/bottom terminal construction. TOP/BOTTOM labels are explicitly model-local.',retrievedAt:'2026-11-15'}]
  });
  const ptcbDefinition=deepFreeze({
    schemaVersion:COMPONENT_SCHEMA_VERSION,id:'phoenix-contact-2908262',manufacturer:'Phoenix Contact',manufacturerPartNumber:'2908262',model:'PTCB E1 24DC/1-8A NO',name:'Adjustable electronic DC circuit breaker',family:'electronic-circuit-breaker',referencePrefix:'F',category:'Electrical · Verified auxiliary protection',
    panelFootprint: {widthMm:6.2,heightMm:105.8,depthMm:55.6,source:'https://www.mouser.com/datasheet/3/507/10/phoenix_contact_2908262_en.pdf',edition:'2025-11-13',page:4,note:'Manufacturer front envelope; 55.6 mm depth includes the 7.5 mm DIN rail. No rail or clearance approval is inferred.'},
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
    specifications:{operatingVoltage:{minimum:18,maximum:30,unit:'V DC'},ratedVoltage:{value:24,unit:'V DC'},channelSettings:{value:[1,2,3,4,5,6,7,8],unit:'A'},factorySetting:{value:4,unit:'A'},quiescentCurrentTypical:{value:12,unit:'mA'},signalContact:{value:'NO, 0–30 V DC, 100 mA'},isolation:{value:'No electrical isolation'},dimensions:{width:{value:6.2,unit:'mm'},height:{value:105.8,unit:'mm'},depthIncludingRail:{value:55.6,unit:'mm'}}},
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
  function lappBlackCable(part,cores,section,diameter){
    const model='ÖLFLEX CLASSIC 110 BLACK 0,6/1 kV '+cores.length+'G'+section;
    const article='https://www.lapp.com/en_US/us/oelflex-classic-110-black-0-6/1-kv/p/'+part;
    return deepFreeze({
      ...lappFourCoreCableDefinition,id:'lapp-'+part,manufacturerPartNumber:part,model:model,name:model,
      symbol:{...lappFourCoreCableDefinition.symbol,id:'cable.lapp.'+part+'.endpoints.v1',
        pins:cores.flatMap(function(core,index){
          const y=(index-(cores.length-1)/2)*24;
          return ['a','b'].map(function(end){return {id:end+'-'+core,localNumber:end.toUpperCase()+':'+core,name:'End '+end.toUpperCase()+' · core '+core,x:end==='a'?-90:90,y:y,electricalType:'passive',connectionType:'cable-core'};});
        }),
        internalConnections:cores.map(function(core){return ['a-'+core,'b-'+core];}),
        numberingNote:'A/B identify model-local ends. Numbered working cores and green/yellow PE each have a separate end-to-end conductive path.'},
      specifications:{...lappFourCoreCableDefinition.specifications,coreCount:{value:cores.length},crossSection:{value:section,unit:'mm²'},ratedVoltage:{value:'600/1000',unit:'V U0/U'},outerDiameter:{value:diameter,unit:'mm'},fixedBendRadius:{value:Number((diameter*4).toFixed(1)),unit:'mm'},application:{value:'Fixed installation or occasional movement within manufacturer conditions'}},
      sources:[{publisher:'LAPP',title:model+' · article '+part,url:article,documentRevision:null,revisionNote:'Manufacturer article identity, core numbering and conductor size.',retrievedAt:'2026-11-21'},
        {publisher:'LAPP',title:'ÖLFLEX CLASSIC 110 BLACK family article table',url:'https://vn.lapp.com/en/products/1120361',documentRevision:null,revisionNote:'Nominal jacket diameters for the exact article numbers.',retrievedAt:'2026-11-21'},
        {publisher:'LAPP',title:'ÖLFLEX CLASSIC 110 BLACK family datasheet',url:'https://imager.lapp.com/e/lapp/2XGk_cm3ZjNqCvMXEttr9w~~/DB1120232EN.pdf',documentRevision:'DB1120232EN v11',revisionNote:'Fixed minimum bend radius is four times outer diameter.',retrievedAt:'2026-11-21'}]
    });
  }
  const lappMotorCableDefinition=lappBlackCable('1120360',['1','2','3','PE'],4,13.8);
  const lappFieldControlCableDefinition=lappBlackCable('1120307',['1','2','PE'],1.5,10.1);
  const rittalEnclosureDefinition=deepFreeze({
    schemaVersion:COMPONENT_SCHEMA_VERSION,id:'rittal-1059000',manufacturer:'Rittal',manufacturerPartNumber:'1059000',model:'AX 1059.000',name:'Compact sheet-steel enclosure with mounting plate',family:'mechanical-enclosure',referencePrefix:'ENC',category:'Panel · Manufacturer-identified enclosure',
    symbol:{id:'enclosure.ax1059.front-half-scale.v1',view:'panel',unit:'mm',width:340,height:460,pins:[],internalConnections:[],numberingNote:'Mechanical front view at 1:2 drawing scale. No electrical terminals are invented; door and mounting-plate protective bonding must be designed separately. Actual dimensions are manufacturer specifications.'},
    specifications:{dimensions:{width:{value:600,unit:'mm'},height:{value:800,unit:'mm'},depth:{value:400,unit:'mm'}},mountingPlate:{width:{value:545,unit:'mm'},height:{value:775,unit:'mm'},thickness:{value:2.5,unit:'mm'}},material:{value:'Sheet steel'},colour:{value:'RAL 7035'},doorCount:{value:1},lockCount:{value:2},enclosureProtection:{value:'IP66 as supplied; modified assembly must be verified'},supplyIncludes:{value:['Enclosure with door','Base gland plate','Mounting plate','Perforated door strip']}},
    instanceProperties:{location:{type:'string',default:'',maximumLength:80},installationNote:{type:'string',default:'Verify device clearances, thermal load, mounting, cable entry and protective bonding.',maximumLength:160},comment:{type:'string',default:'',maximumLength:160}},
    sources:[{publisher:'Rittal',title:'Basic enclosure AX, sheet steel · AX 1059000',url:'https://www.rittal.com/uk-en/products/PG20231215KLI101/PG20231245KLI1005/PG20240116KLI210/PRO67138?variantId=1059000',documentRevision:null,revisionNote:'Live manufacturer product page. Enclosure rating is not a completed assembly approval.',retrievedAt:'2026-11-15'}]
  });
  const rittalFieldEnclosureDefinition=deepFreeze({
    ...rittalEnclosureDefinition,id:'rittal-1033000',manufacturerPartNumber:'1033000',model:'AX 1033.000',name:'AX 1033.000 sheet-steel field enclosure',
    symbol:{...rittalEnclosureDefinition.symbol,id:'enclosure.ax1033.front-half-scale.v1',width:190,height:210},
    specifications:{...rittalEnclosureDefinition.specifications,
      dimensions:{width:{value:300,unit:'mm'},height:{value:300,unit:'mm'},depth:{value:210,unit:'mm'}},
      mountingPlate:{width:{value:250,unit:'mm'},height:{value:275,unit:'mm'},thickness:{value:2,unit:'mm'}},
      doorThickness:{value:1.5,unit:'mm'},lockCount:{value:1},glandPlateSize:{value:1}},
    sources:[{publisher:'Rittal',title:'AX 1033000 sheet-steel enclosure datasheet',url:'https://www.rittal.com/pdf-creator/variant/lt-en/1033000',documentRevision:'2026',revisionNote:'External dimensions, plate dimensions, door thickness and gland plate size. Installed enclosure performance requires assembly verification.',retrievedAt:'2026-11-21'}]
  });
  const overloadSupportDefinition=deepFreeze({
    schemaVersion:COMPONENT_SCHEMA_VERSION,id:'siemens-3ru2926-3aa01',manufacturer:'Siemens',manufacturerPartNumber:'3RU2926-3AA01',model:'SIRIUS 3RU2926-3AA01',name:'S0 screw-terminal support for separate overload mounting',family:'mechanical-support',referencePrefix:'ACC',category:'Panel · Manufacturer-identified mounting accessory',
    supportedComponentIds:['siemens-3ru2126-4bb0'],
    symbol:{id:'support.3ru2926.mechanical-body.v1',view:'panel',unit:'mm',width:160,height:110,pins:[],internalConnections:[],numberingNote:'Mechanical body view at 1:2 scale, matching the enclosure view. This support has screw electrical connections, but their terminal map is not modelled here; do not wire to this representation. Link it to the canonical overload relay for installation documentation.'},
    specifications:{dimensions:{width:{value:45,unit:'mm'},height:{value:97,unit:'mm'},depth:{value:87,unit:'mm'}},frameSize:{value:'S0'},mounting:{value:'Screw or snap-on mounting on 35 mm DIN rail'},mainConnection:{value:'Screw-type terminals; electrical terminal map not modelled'},supportedFamily:{value:'3RU21 / 3RB30 / 3RB31 / 3RR2 S0'},assemblyNote:{value:'Support body dimensions are not the assembled relay dimensions.'}},
    instanceProperties:{location:{type:'string',default:'',maximumLength:80},comment:{type:'string',default:'Verify assembly, electrical terminal mapping and delivered revision.',maximumLength:160}},
    sources:[{publisher:'Siemens',title:'3RU2926-3AA01 product data sheet',url:'https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RU2926-3AA01',documentRevision:'2025-10-29',revisionNote:'Page 1/3; support body dimensions, not a complete assembly.',retrievedAt:'2026-11-15'}]
  });
  const overloadSupportElectricalDefinition=deepFreeze(Object.assign({},overloadSupportDefinition,{
    id:'siemens-3ru2926-3aa01-electrical',name:'S0 overload support · three isolated electrical paths',family:'terminal-support',category:'Electrical · Manufacturer-identified mounting support',
    symbol:{id:'support.3ru2926.electrical.v1',view:'schematic',unit:'mm',width:190,height:110,
      pins:['l1','l2','l3'].flatMap(function(phase,index){return [{id:'line-'+phase,localNumber:['1/L1','3/L2','5/L3'][index],name:'Manufacturer-labelled incoming screw terminal',x:-85,y:-24+index*24,electricalType:'passive',connectionType:'screw-terminal'},{id:'mate-'+phase,localNumber:'MATE '+phase.toUpperCase(),name:'Model-local interface to relay input '+['1/L1','3/L2','5/L3'][index],x:85,y:-24+index*24,electricalType:'passive',connectionType:'assembly-interface'}];}),
      internalConnections:['l1','l2','l3'].map(function(phase){return ['line-'+phase,'mate-'+phase];}),
      numberingNote:'Incoming 1/L1, 3/L2, 5/L3 are manufacturer labels. MATE L1/L2/L3 identify model-local relay mating interfaces, not extra manufacturer screw terminals. Three isolated conductive paths follow the source graphic. Coordinates are schematic. Assembly association alone does not create electrical connections.'},
    specifications:Object.assign({},overloadSupportDefinition.specifications,{mainConnection:{value:'Three isolated screw-terminal paths; relay-side MATE IDs are model-local'},assemblyNote:{value:'Explicitly connect each mating interface to its corresponding relay input. No automatic electrical link is implied by the mechanical association.'}}),
    sources:overloadSupportDefinition.sources.concat([{publisher:'Siemens',title:'3RU2926-3AA01 connection graphic, page 3/3',url:'https://docs.rs-online.com/c473/0900766b814bb84d.pdf',documentRevision:'2024-09-23',revisionNote:'Manufacturer datasheet hosted by RS; connection graphic visually verified. Mating-side IDs are model-local.',retrievedAt:'2026-11-15'}])
  }));
  function terminalAccessoryDefinition(part,model,name,width,height,depth,url,supported,compatibilityUrl,compatibilitySource){
    return deepFreeze({schemaVersion:COMPONENT_SCHEMA_VERSION,id:'phoenix-contact-'+part,manufacturer:'Phoenix Contact',manufacturerPartNumber:part,model:model,name:name,family:'terminal-accessory',referencePrefix:'ACC',category:'Panel · Manufacturer-identified terminal accessories',supportedComponentIds:supported,
      symbol:{id:'accessory.phoenix.'+part+'.body.v1',view:'panel',unit:'mm',width:150,height:120,pins:[],internalConnections:[],numberingNote:'Mechanical body envelope at 1:1; no conductor terminals or electrical connections. Mounting orientation and installed assembly must be checked separately.'},
      panelFootprint:{widthMm:width,heightMm:height,depthMm:depth,source:url,note:'Manufacturer body dimensions, excluding rail. Envelope only; not a drilling template.'},
      specifications:{dimensions:{width:{value:width,unit:'mm'},height:{value:height,unit:'mm'},depth:{value:depth,unit:'mm'}},color:{value:'Gray (RAL 7042)'},function:{value:name},electricalConnection:{value:'None; mechanical accessory'},compatibility:{value:supported.length?'Supported device IDs listed in component definition':'No verified device-specific assembly link recorded'}},
      instanceProperties:{location:{type:'string',default:'',maximumLength:80},comment:{type:'string',default:'Verify installation orientation, rail and complete assembly.',maximumLength:160}},
      sources:[{publisher:'Phoenix Contact',title:model+' product dimensions',url:url,documentRevision:'Manufacturer product record reviewed 2026-11-15',revisionNote:'Nominal body dimensions, not a detailed mounting drawing.',retrievedAt:'2026-11-15'}].concat(compatibilityUrl?[Object.assign({publisher:'Phoenix Contact',title:'Terminal manufacturer accessory listing',url:compatibilityUrl,documentRevision:'Manufacturer accessory record reviewed 2026-11-15',revisionNote:'Accessory listing establishes the supported terminal family.',retrievedAt:'2026-11-15'},compatibilitySource)]:[])
    });
  }
  const ukCoverDefinition=terminalAccessoryDefinition('3003020','D-UK 4/10','Terminal end cover',1.8,42.5,35.9,'https://www.phoenixcontact.com/en-us/products/end-cover-d-uk-410-3003020?type=pdf',['phoenix-contact-3004362'],'https://www.ilecsys.co.uk/sites/default/files/2025/02/01/phoenix-contact-3004362-en.pdf',{documentRevision:'2025-02-01, page 3',revisionNote:'Manufacturer datasheet for 3004362 lists D-UK 4/10, article 3003020.',retrievedAt:'2026-11-21'});
  const utCoverDefinition=terminalAccessoryDefinition('3047028','D-UT 2,5/10','Terminal end cover',2.2,47,39.8,'https://www.phoenixcontact.com/en-gb/products/end-cover-d-ut-2510-3047028?type=pdf',['phoenix-contact-3044076'],'https://www.phoenixcontact.com/de-de/produkte/durchgangsklemme-ut-25-3044076?type=pdf');
  const peCoverDefinition=terminalAccessoryDefinition('3212060','D-PT 16 N','Terminal end cover',2.2,75.4,45.6,'https://www.phoenixcontact.com/en-us/products/end-cover-d-pt-16-n-3212060',['phoenix-contact-3212147','phoenix-contact-3212147-rail-view'],'https://www.phoenixcontact.com/us/products/3212147/pdf');
  const terminalEndBracketDefinition=terminalAccessoryDefinition('3022276','CLIPFIX 35-5','End bracket for NS 35/7.5 or NS 35/15',5.2,48.6,35.3,'https://www.phoenixcontact.com/en-us/products/end-block-clipfix-35-5-3022276?type=pdf',[],null);
  const COMPONENTS = Object.freeze({[ukCoverDefinition.id]:ukCoverDefinition,[utCoverDefinition.id]:utCoverDefinition,[peCoverDefinition.id]:peCoverDefinition,[terminalEndBracketDefinition.id]:terminalEndBracketDefinition,[overloadSupportElectricalDefinition.id]:overloadSupportElectricalDefinition,[overloadSupportDefinition.id]:overloadSupportDefinition,[rittalEnclosureDefinition.id]:rittalEnclosureDefinition,[rittalFieldEnclosureDefinition.id]:rittalFieldEnclosureDefinition,[lappFourCoreCableDefinition.id]:lappFourCoreCableDefinition,[lappMotorCableDefinition.id]:lappMotorCableDefinition,[lappFieldControlCableDefinition.id]:lappFieldControlCableDefinition,[phoenixPeRailViewDefinition.id]:phoenixPeRailViewDefinition,[mainIsolatorDefinition.id]:mainIsolatorDefinition,[feederContactorDefinition.id]:feederContactorDefinition,[feederMagneticBreakerDefinition.id]:feederMagneticBreakerDefinition,[feederOverloadRelayDefinition.id]:feederOverloadRelayDefinition,[greenPilotDefinition.id]:greenPilotDefinition,[redPilotDefinition.id]:redPilotDefinition,[auxiliaryMcbDefinition.id]:auxiliaryMcbDefinition,[ptcbDefinition.id]:ptcbDefinition,[isolatorAuxiliaryDefinition.id]:isolatorAuxiliaryDefinition,[siemensMaintenanceIsolatorDefinition.id]:siemensMaintenanceIsolatorDefinition,[sewDeltaTerminalBoardDefinition.id]:sewDeltaTerminalBoardDefinition, [xmlbPressureSwitchDefinition.id]:xmlbPressureSwitchDefinition, [uk5TerminalDefinition.id]:uk5TerminalDefinition,[ut25TerminalDefinition.id]:ut25TerminalDefinition, [terminalDefinition.id]: terminalDefinition, [relayDefinition.id]: relayDefinition, [contactorDefinition.id]: contactorDefinition, [siemensPowerContactorDefinition.id]: siemensPowerContactorDefinition, [siemensOverloadRelayDefinition.id]: siemensOverloadRelayDefinition, [siemensStarDeltaTimerDefinition.id]: siemensStarDeltaTimerDefinition, [schneiderStartPushButtonDefinition.id]: schneiderStartPushButtonDefinition, [schneiderStopPushButtonDefinition.id]: schneiderStopPushButtonDefinition, [motorProtectionBreakerDefinition.id]: motorProtectionBreakerDefinition, [lowRangeMotorProtectionBreakerDefinition.id]: lowRangeMotorProtectionBreakerDefinition, [starDeltaMotorProtectionBreakerDefinition.id]: starDeltaMotorProtectionBreakerDefinition, [motorStarterDefinition.id]: motorStarterDefinition, [motorDefinition.id]: motorDefinition, [sewStarDeltaMotorDefinition.id]: sewStarDeltaMotorDefinition, [siemensCpuDefinition.id]: siemensCpuDefinition, [ifmInductiveSensorDefinition.id]: ifmInductiveSensorDefinition, [ifmPressureSensorDefinition.id]: ifmPressureSensorDefinition, [siemensSitopPsuDefinition.id]: siemensSitopPsuDefinition, [phoenixProtectiveEarthTerminalDefinition.id]: phoenixProtectiveEarthTerminalDefinition });

  function reorderObject(objects,id,direction) {
    if (!Array.isArray(objects) || (direction !== 1 && direction !== -1)) return false;
    const index = objects.findIndex(function (object) { return object && object.id === id; });
    const target = index + direction;
    if (index < 0 || target < 0 || target >= objects.length) return false;
    const moved = objects.splice(index, 1)[0];
    objects.splice(target, 0, moved);
    return true;
  }

  function validWallOpenings(wall) {
    if(!wall.wallThickness||!Array.isArray(wall.wallOpenings))return false;
    const length=Math.hypot(wall.x2-wall.x1,wall.y2-wall.y1);
    if(!finite(length))return false;
    let end=1;
    return wall.wallOpenings.every(function(opening){
      if(!opening||!['door','window'].includes(opening.kind)||!finite(opening.offset)||!finite(opening.width)||opening.offset<end||opening.width<1||opening.offset+opening.width>length-1)return false;
      end=opening.offset+opening.width;
      return true;
    });
  }
  function resizeGraphicObject(object, corner, point) {
    if (object && object.kind === 'component-instance') {
      const result=validateInstance(object);
      if(!result.valid||object.locked||!['nw','ne','sw','se'].includes(corner)||!point||!finite(point.x)||!finite(point.y))return false;
      const turned=object.rotation===90||object.rotation===270;
      const width=turned?result.definition.symbol.height:result.definition.symbol.width;
      const height=turned?result.definition.symbol.width:result.definition.symbol.height;
      const previous=object.displayScale||1,xDirection=corner.endsWith('w')?-1:1,yDirection=corner.startsWith('n')?-1:1;
      const fixedX=object.x-xDirection*width*previous/2,fixedY=object.y-yDirection*height*previous/2;
      const dx=(point.x-fixedX)*xDirection,dy=(point.y-fixedY)*yDirection;
      if(dx<=0||dy<=0)return false;
      const scale=Math.max(0.25,Math.min(4,(dx*width+dy*height)/(width*width+height*height)));
      object.displayScale=scale;
      object.x=fixedX+xDirection*width*scale/2;
      object.y=fixedY+yDirection*height*scale/2;
      return true;
    }
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
  const wagoTopjobTerminals=new Map();
  function registerWagoTerminalBatch(rows){
    if(!Array.isArray(rows)||!rows.length)throw new TypeError('Expected a nonempty WAGO terminal batch');
    const batch=new Map();
    const isSource=value=>typeof value==='string'&&/^https:\/\/[^/\s]+\/\S+$/.test(value);
    for(const part of rows){
      const id='wago-'+part?.orderCode;
      if(!part||typeof part.orderCode!=='string'||!/^(?:2000|2001|2002|2004|2006|2010|2016|2201|2202)-[0-9]{4}$/.test(part.orderCode)||
        !Array.isArray(part.positions)||part.positions.length<1||part.positions.length>2||
        !Array.from(part.positions).every(count=>Number.isInteger(count)&&count>=2&&count<=4)||
        ![part.nominalVoltage,part.ratedCurrent,part.widthMm,part.heightMm,part.depthMm,part.nominalCrossSectionMm2].every(value=>Number.isFinite(value)&&value>0)||
        ![part.finish,part.revision,part.pages].every(value=>typeof value==='string'&&value.trim())||
        typeof part.slug!=='string'||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(part.slug)||
        !Number.isInteger(part.dimensionPage)||part.dimensionPage<1||!isSource(part.datasheet)||
        (part.actuationMethod!==undefined&&!['Push-button','Operating tool'].includes(part.actuationMethod))||
        (part.markerCarrier!==undefined&&typeof part.markerCarrier!=='boolean')||
        (part.retrievedAt!==undefined&&(typeof part.retrievedAt!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(part.retrievedAt)))||
        (part.datasheetSha256!==undefined&&(typeof part.datasheetSha256!=='string'||!/^[a-f0-9]{64}$/.test(part.datasheetSha256)))||
        (part.connectionSource!==undefined&&!isSource(part.connectionSource))){
        throw new TypeError('Invalid WAGO terminal catalog row: '+id);
      }
      if(batch.has(id)||wagoTopjobTerminals.has(id))throw new Error('Duplicate WAGO terminal catalog ID: '+id);
      batch.set(id,deepFreeze(createWagoTerminal(part,id)));
    }
    for(const [id,definition] of batch)wagoTopjobTerminals.set(id,definition);
  }

  function createWagoTerminal(part,id){
    const deckCount=part.positions.length,height=deckCount*54+16;
    const title=deckCount===2?'Double-deck through terminal block':'Through terminal block';
    const productUrl='https://www.wago.com/gb/rail-mount-terminal-blocks/'+part.slug+'/p/'+part.orderCode;
    const pins=[],internalConnections=[],artwork=[{kind:'rect',x:-48,y:-height/2,width:96,height}];
    const line=(x1,y1,x2,y2)=>({kind:'line',from:{x:x1,y:y1},to:{x:x2,y:y2}});
    for(const [deck,count] of part.positions.entries()){
      const y=(deck-(deckCount-1)/2)*54,group=[];
      artwork.push(line(-34,y,34,y));
      for(let index=0;index<count;index++){
        const side=index<Math.ceil(count/2)?-1:1;
        const pinY=count===2?y:y+(index%2===0?-10:10),localNumber=(deckCount===1?'':deck===0?'U':'L')+(index+1);
        const pin={id:'clamp-'+localNumber.toLowerCase(),localNumber,name:'Clamping position '+localNumber,
          x:side*72,y:pinY,electricalType:'passive',connectionType:'Push-in CAGE CLAMP'};
        pins.push(pin);group.push(pin.id);
        artwork.push(line(pin.x,pin.y,side*34,pin.y));
        if(pin.y!==y)artwork.push(line(side*34,pin.y,side*34,y));
      }
      internalConnections.push(group);
    }
    return {schemaVersion:COMPONENT_SCHEMA_VERSION,id,manufacturer:'WAGO',manufacturerPartNumber:part.orderCode,
      model:'TOPJOB S '+part.orderCode,name:title,family:'topjob-terminal',referencePrefix:'X',category:'Electrical · WAGO terminal systems',
      symbol:{id:id+'-schematic-v1',view:'schematic',unit:'mm',width:144,height,pins,internalConnections,artwork,
        numberingNote:'Anchor labels identify schematic clamping positions. Each level is one documented potential; no cross-level or adjacent-block jumper is included.'},
      specifications:{connectionCount:{value:pins.length},levels:{value:deckCount},potentials:{value:deckCount},
        ratedCurrent:{value:part.ratedCurrent,unit:'A'},nominalVoltage:{value:part.nominalVoltage,unit:'V',basis:'IEC/EN, category III, pollution degree 3'},
        finish:{value:part.finish},...(part.actuationMethod?{actuationMethod:{value:part.actuationMethod}}:{}),
        ...(part.markerCarrier===undefined?{}:{markerCarrier:{value:part.markerCarrier?'Fitted':'Without marker carrier'}}),
        nominalCrossSection:{value:part.nominalCrossSectionMm2,unit:'mm²'},mounting:{value:'DIN rail 35 × 7.5 or 35 × 15 mm'},
        railReferencedDimensions:{width:{value:part.widthMm,unit:'mm'},height:{value:part.heightMm,unit:'mm'},depthAboveRail:{value:part.depthMm,unit:'mm'}}},
      panelFootprint:{widthMm:part.widthMm,heightMm:part.heightMm,depthMm:part.depthMm,source:part.datasheet,edition:part.revision,page:part.dimensionPage,
        note:'Envelope depth is measured from the upper edge of the DIN rail. Use the rail mounting plane as the rear datum.'},
      instanceProperties:{marking:{type:'string',default:'',maximumLength:40},comment:{type:'string',default:'',maximumLength:160}},
      sources:[{publisher:'WAGO',title:`${part.orderCode} datasheet, pp. ${part.pages}`,url:part.datasheet,documentRevision:part.revision,
        revisionNote:'Connection count, separate potentials, IEC ratings and rail-referenced dimensions.',retrievedAt:part.retrievedAt||'2026-11-22',
        ...(part.datasheetSha256?{sha256:part.datasheetSha256}:{})},
        {publisher:'WAGO',title:`${part.orderCode} product record`,url:productUrl,revisionNote:'Exact order identity and DIN rail sizes.',retrievedAt:part.retrievedAt||'2026-11-22'},
        ...(part.connectionSource?[{publisher:'WAGO',title:'Connection schedule, p. 1',url:part.connectionSource,documentRevision:'30 September 2008',
          revisionNote:'Three clamping positions on one potential.',retrievedAt:'2026-11-22'}]:[])]};
  }
  const BUILDING_COMPONENTS=deepFreeze(Object.fromEntries([
    ['building-luminaire','Floor-plan luminaire','LUM','M-50 -50L50 50M-50 50L50 -50',[-60,-60,120,120]],
    ['building-socket','Floor-plan socket outlet','SO','M-32 -14H32M-32 14H32',[-50,-50,100,100]],
    ['building-distribution-board','Floor-plan distribution board','DB','M-55 -30H55M-55 0H55M-55 30H55',[-75,-55,150,110]],
    ['building-earthing-bond-point','Floor-plan earthing bond point','PE','M-20 20H20M0 20V-12M-24 -12H24M-16 -23H16M-8 -34H8',[-50,-50,100,100],['PE1','PE2']],
    ['building-emergency-luminaire','Floor-plan emergency luminaire','EL','M-45 -25L-8 12M-45 12L-8 -25M8 -23H46V9H8ZM46 -13H52V-1H46M17 -7H29M23 -13V-1',[-60,-60,120,120]],
    ['building-fire-alarm-loop-interface','Floor-plan fire alarm loop interface','FA','M0 -38A34 34 0 1 1 -0.01 -38M0 -25V1M0 12V16',[-50,-50,100,100],['LOOP+','LOOP-']],
    ['building-data-outlet-8p8c-shielded','Floor-plan shielded 8P8C data outlet','DO','M-81 -35H81V11H45V26H-45V11H-81ZM-60 -24V-5M-40 -24V-5M-20 -24V-5M0 -24V-5M20 -24V-5M40 -24V-5M60 -24V-5',[-120,-55,240,110],['1','2','3','4','5','6','7','8','SHIELD']],
    ['building-wall-switch','Floor-plan single-pole wall switch','SW','M-20 30V8L17 -24M20 30V-12',[-50,-50,100,100],['LINE','LOAD']]
  ].map(function(entry){
    const [id,name,referencePrefix,path,body,terminalIds=['L','N','PE']]=entry;
    const [x,y,width,height]=body;
    const bonded=id==='building-earthing-bond-point';
    const pinPitch=terminalIds.length>3?24:40;
    const pins=terminalIds.map(function(number,index){
      return {id:number,localNumber:number,name:number,x:(index-(terminalIds.length-1)/2)*pinPitch,y:80,electricalType:'passive',connectionType:'schematic'};
    });
    const artwork=[{kind:'rect',x,y,width,height},{kind:'path',d:path},...pins.map(pin=>({
      kind:'line',from:{x:pin.x,y:y+height},to:pin
    }))];
    return [id,{schemaVersion:COMPONENT_SCHEMA_VERSION,id,name,model:name,generic:true,manufacturer:'Not assigned',manufacturerPartNumber:'Not assigned',
      family:'building-device',referencePrefix,category:'Building · floor-plan devices',connectionClass:'electrical',
      symbol:{id:id+'-symbol',view:'schematic',unit:'mm',width:Math.max(160,width+20),height:180,artwork,pins,internalConnections:bonded?[['PE1','PE2']]:[],
        numberingNote:'Logical floor-plan terminals. Supply, product ratings and installed footprint require design inputs.'},
      specifications:{},instanceProperties:{
        comment:{type:'string',default:'',maximumLength:160},
        ...(!['building-luminaire','building-socket','building-emergency-luminaire'].includes(id)?{}:{
          activePowerW:{type:'number',default:null,minimum:0,maximum:1e9},
          demandFactor:{type:'number',default:null,minimum:0,maximum:1}
        })
      },sources:[]}];
  })));
  const plcComponents=new Map();
  function registerPlcSymbols(entries){
    for(const {kind,channels,symbol} of entries){
      const id='generic-plc-'+kind;
      const pins=symbol.pins.map(pin=>({id:pin.id,localNumber:pin.id,name:pin.id,x:pin.position.x,y:pin.position.y,
        plcChannel:pin.kind==='signal',electricalType:'passive',connectionType:'schematic'}));
      plcComponents.set(id,deepFreeze({schemaVersion:COMPONENT_SCHEMA_VERSION,id,name:symbol.name,model:symbol.name,generic:true,
        manufacturer:'Not assigned',manufacturerPartNumber:'Not assigned',family:'generic-plc',plcKind:kind,referencePrefix:'A',
        category:'Automation · Generic PLC',connectionClass:'electrical',symbol:{id:symbol.id,view:'schematic',unit:'mm',width:symbol.width,
          height:symbol.height,artwork:symbol.artwork,pins,internalConnections:[],numberingNote:'Logical terminals for schematic documentation. Select actual hardware before assigning ratings or physical pin numbers.'},
        specifications:{channelCount:{value:channels}},instanceProperties:{comment:{type:'string',default:'',maximumLength:160}},sources:[]}));
    }
  }
  function component(id) { return COMPONENTS[id] || EPLAN_COMPONENTS[id] || BUILDING_COMPONENTS[id] || wagoTopjobTerminals.get(id) || plcComponents.get(id) || null; }
  function catalog() {
    return Object.keys(EPLAN_COMPONENTS).concat(Object.keys(COMPONENTS),Object.keys(BUILDING_COMPONENTS),Array.from(wagoTopjobTerminals.keys()),Array.from(plcComponents.keys())).map(function (id) {
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
  function plcIoPins(def){
    if(def?.family==='generic-plc')return def.symbol.pins.filter(pin=>pin.plcChannel);
    return def?.family==='plc-cpu'?def.symbol.pins.filter(pin=>/^(DI|DQ|AI) /.test(pin.name)):[];
  }
  const automationNoteKinds=Object.freeze(['interlock','emergency-stop','motor-control','sequence','safety']);
  function validAutomationNote(note){
    return note&&automationNoteKinds.includes(note.kind)&&Array.isArray(note.deviceIds)&&note.deviceIds.length<=1000&&
      note.deviceIds.every(id=>typeof id==='string'&&id.length>0&&id.length<=100)&&new Set(note.deviceIds).size===note.deviceIds.length;
  }
  function validPlcIo(def,records){
    if(!records||typeof records!=='object'||Array.isArray(records))return false;
    const pins=new Set(plcIoPins(def).map(pin=>pin.id)),addresses=new Set();
    return Object.entries(records).every(([id,row])=>{
      if(!pins.has(id)||!row||typeof row.signal!=='string'||row.signal.length>120||typeof row.address!=='string'||row.address.length>40)return false;
      const address=row.address.trim().toUpperCase();
      if(address&&addresses.has(address))return false;
      if(address)addresses.add(address);
      return true;
    });
  }
  function validateInstance(instance) {
    const errors = [];
    if (!instance || typeof instance !== 'object') return { valid: false, errors: ['Component instance must be an object.'] };
    const def = component(instance.componentId);
    if(instance.assemblyFor!==undefined&&(typeof instance.assemblyFor!=='string'||!instance.assemblyFor||instance.assemblyFor===instance.id))errors.push('Accessory assembly target must be a distinct stable device ID.');
    if (instance.kind !== 'component-instance') errors.push('Object is not a component instance.');
    if (instance.schemaVersion !== COMPONENT_SCHEMA_VERSION) errors.push('Unsupported component schema version.');
    if (!def) errors.push('Component ID has no verified definition.');
    if(instance.plcIo!==undefined&&!validPlcIo(def,instance.plcIo))errors.push('PLC I/O requires valid signal terminals and unique configured addresses per CPU.');
    if (!finite(instance.x) || !finite(instance.y)) errors.push('Component position is invalid.');
    if(instance.displayScale!==undefined&&(!finite(instance.displayScale)||instance.displayScale<0.25||instance.displayScale>4))errors.push('Component drawing scale must be between 0.25 and 4.');
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
    const scale=instance.displayScale||1;
    return result.definition.symbol.pins.map(function (pin) {
      return {
        id: pin.id,
        number: pin.localNumber,
        name: pin.name,
        electricalType: pin.electricalType,
        x: instance.x + scale * pin.x * cos - scale * pin.y * sin,
        y: instance.y + scale * pin.x * sin + scale * pin.y * cos
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
  // Panel views refer to canonical electrical instances; they never own a second device.
  function linkAssemblyAccessory(project, accessoryId, deviceId) {
    const objects=project.objects||[],accessory=objects.find(function(o){return o.id===accessoryId&&o.kind==='component-instance';}),device=objects.find(function(o){return o.id===deviceId&&o.kind==='component-instance';});
    if(!accessory||!device||accessory.id===device.id)throw new Error('Select an accessory and a distinct canonical device.');
    const definition=component(accessory.componentId);
    if(!definition||!(definition.supportedComponentIds||[]).includes(device.componentId))throw new Error('This accessory has no verified compatibility with the selected device.');
    return objects.map(function(o){return o.id===accessoryId?Object.assign({},o,{assemblyFor:device.id}):o;});
  }
  function resolvePanelDevice(project, placement) {
    if (!placement || typeof placement.deviceId !== 'string' || !placement.deviceId) throw new Error('Panel placement requires a stable device ID.');
    const matches = (project.objects || []).filter(function (object) { return object.kind === 'component-instance' && object.id === placement.deviceId; });
    if (matches.length !== 1) throw new Error('Panel device is missing or ambiguous: ' + placement.deviceId + '.');
    const instance = matches[0];
    const definition = component(instance.componentId);
    if (!definition) throw new Error('Panel device has an unknown component: ' + instance.componentId + '.');
    return { instance: instance, definition: definition, sheetId: instance.sheetId, ref: instance.ref };
  }

  function createPanelPlacement(project, deviceId, sheetId, x, y, scale) {
    const resolved=resolvePanelDevice(project,{deviceId:deviceId}), footprint=resolved.definition.panelFootprint;
    if (!footprint) throw new Error('No verified panel footprint for ' + resolved.definition.model + '.');
    if (!(project.sheets||[]).some(function(sheet){return sheet.id===sheetId;})) throw new Error('Unknown panel sheet.');
    if (![x,y,scale].every(finite)||scale<=0) throw new Error('Panel position and positive scale are required.');
    return {id:'panel-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),kind:'panel-placement',deviceId:deviceId,footprintComponentId:resolved.instance.componentId,sheetId:sheetId,x:x,y:y,scale:scale,rotation:0};
  }
  function panelPlacementGeometry(project, placement) {
    const resolved=resolvePanelDevice(project,placement);
    if (resolved.instance.componentId!==placement.footprintComponentId) throw new Error('Panel footprint requires review after component replacement.');
    const footprint=resolved.definition.panelFootprint;
    if (!footprint) throw new Error('Panel device has no verified footprint.');
    if (![placement.x,placement.y,placement.scale].every(finite)||placement.scale<=0||![0,90,180,270].includes(placement.rotation===undefined?0:placement.rotation)) throw new Error('Invalid panel placement geometry.');
    return {x:placement.x,y:placement.y,width:footprint.widthMm*placement.scale,height:footprint.heightMm*placement.scale,rotation:placement.rotation||0,ref:resolved.ref,footprint:footprint};
  }
  function panelBodyScene(project,sheetId){
    const placements=project.objects.filter(object=>object.kind==='panel-placement'&&object.sheetId===sheetId);
    if(!placements.length)throw new Error('Open a sheet with linked panel placements.');
    const scale=placements[0].scale;
    if(placements.some(placement=>placement.scale!==scale))throw new Error('3D requires one common drawing scale for the panel placements.');
    const cabinet=project.sheets?.find(sheet=>sheet.id===sheetId)?.cabinetBounds;
    const structures=[];
    const bodies=[],issues=[],clearanceRules=[];
    for(const item of project.objects){
      if(item.sheetId!==sheetId||!item.panelStructure)continue;
      const shape=item.panelStructure;
      const rotated=item.rotation===90||item.rotation===270;
      const width=Math.abs(item.x2-item.x)/scale,height=Math.abs(item.y2-item.y)/scale;
      const structure={id:item.id,kind:shape.kind,x:(item.x+item.x2)/2/scale,y:(item.y+item.y2)/2/scale,
        width:rotated?height:width,height:rotated?width:height,z:shape.z??0,depth:shape.depth};
      if(!finite(shape.depth)){
        issues.push({id:item.id,message:'Enter a structure depth to include this item in 3D.'});
        continue;
      }
      structures.push(structure);
      if(cabinet&&(structure.x-structure.width/2<cabinet.x||structure.y-structure.height/2<cabinet.y||
        structure.x+structure.width/2>cabinet.x+cabinet.width||structure.y+structure.height/2>cabinet.y+cabinet.height||
        structure.z+structure.depth>cabinet.depth))issues.push({id:item.id,message:'Mounting structure extends beyond the declared cabinet boundary.'});
    }
    for(const placement of placements){
      try{
        const geometry=panelPlacementGeometry(project,placement),{footprint}=geometry;
        if(!finite(footprint.depthMm)||footprint.depthMm<=0)throw new Error('Verified body depth is unavailable.');
        const rotated=geometry.rotation===90||geometry.rotation===270;
        const body={id:placement.id,ref:geometry.ref,x:geometry.x/scale,y:geometry.y/scale,
          width:rotated?footprint.heightMm:footprint.widthMm,height:rotated?footprint.widthMm:footprint.heightMm,depth:footprint.depthMm,
          z:placement.mountingDepthMm??0,mountingRailId:placement.mountingRailId,
          accessDirection:placement.accessDirection??'front',accessClearanceMm:placement.accessClearanceMm};
        bodies.push(body);
        const settings=footprint.clearancesMm;
        if(settings){
          const condition=placement.clearanceCondition;
          const source=condition?settings[condition]:settings;
          const offsets={front:source?.front};
          const sides=['top','right','bottom','left'],turns=geometry.rotation/90;
          sides.forEach((side,index)=>{
            offsets[sides[(index+turns)%4]]=source?.[side]??(['left','right'].includes(side)?source?.side:undefined);
          });
          const rules=Object.entries(offsets).filter(([,value])=>finite(value)&&value>0);
          if(rules.length)clearanceRules.push({body,rules,source:footprint.source});
          else if(!condition&&Object.values(settings).some(value=>value&&typeof value==='object'))
            issues.push({id:body.ref,message:'Choose a documented clearance condition to evaluate this device.'});
        }
        if(cabinet&&(body.x-body.width/2<cabinet.x||body.y-body.height/2<cabinet.y||
          body.x+body.width/2>cabinet.x+cabinet.width||body.y+body.height/2>cabinet.y+cabinet.height||
          body.z+body.depth>cabinet.depth))issues.push({id:body.ref,message:'Body extends beyond the declared cabinet boundary.'});
      }catch(error){issues.push({id:placement.id,message:error.message});}
    }
    const collisions=[],clearanceConflicts=[];
    const overlap=(minA,maxA,minB,maxB)=>{
      const shared=Math.min(maxA,maxB)-Math.max(minA,minB);
      return shared>16*Number.EPSILON*Math.max(Math.abs(minA),Math.abs(maxA),Math.abs(minB),Math.abs(maxB))?shared:0;
    };
    const box=body=>[[body.x-body.width/2,body.x+body.width/2],[body.y-body.height/2,body.y+body.height/2],[body.z,body.z+body.depth]];
    const bodyBoxes=new Map(bodies.map(body=>[body.id,box(body)]));
    const cabinetBox=cabinet&&[[cabinet.x,cabinet.x+cabinet.width],[cabinet.y,cabinet.y+cabinet.height],[0,cabinet.depth]];
    const faceAxes={left:[0,0],right:[0,1],top:[1,0],bottom:[1,1],front:[2,1]};
    for(const {body,rules,source} of clearanceRules){
      const envelope=bodyBoxes.get(body.id);
      for(const [face,requiredMm] of rules){
        const [axis,end]=faceAxes[face];
        const edge=envelope[axis][end],limit=edge+(end?requiredMm:-requiredMm);
        const conflict=(obstacle,availableMm)=>clearanceConflicts.push({id:body.id,ref:body.ref,face,requiredMm,obstacle,availableMm,source});
        if(cabinetBox){
          const available=(cabinetBox[axis][end]-edge)*(end?1:-1);
          if(available<requiredMm)conflict('Cabinet boundary',available);
        }
        const span=end?[edge,limit]:[limit,edge];
        for(const other of bodies){
          if(other===body)continue;
          const otherBox=bodyBoxes.get(other.id);
          const intersects=otherBox.every(([min,max],dimension)=>overlap(min,max,...(dimension===axis?span:envelope[dimension])));
          if(intersects)conflict(other.ref,(otherBox[axis][1-end]-edge)*(end?1:-1));
        }
      }
    }
    for(let i=0;i<bodies.length;i++){
      const a=bodies[i];
      for(let j=i+1;j<bodies.length;j++){
        const b=bodies[j];
        const x=overlap(a.x-a.width/2,a.x+a.width/2,b.x-b.width/2,b.x+b.width/2);
        const y=overlap(a.y-a.height/2,a.y+a.height/2,b.y-b.height/2,b.y+b.height/2);
        const z=overlap(a.z,a.z+a.depth,b.z,b.z+b.depth);
        if(x&&y&&z)collisions.push({ids:[a.id,b.id],refs:[a.ref,b.ref],overlapMm:{x,y,z}});
      }
    }
    return {bodies,structures,issues,cabinet,collisions,clearanceConflicts};
  }
  function validCabinetBounds(value){
    return value&&['x','y','width','height','depth'].every(key=>finite(value[key])&&Math.abs(value[key])<=1e6)
      &&[value.width,value.height,value.depth].every(dimension=>dimension>0);
  }
  const cabinetFeatureFaces=Object.freeze(['back','front','left','right','top','bottom']);
  function validPanelThermalInputs(value){
    return value&&finite(value.ambientC)&&value.ambientC>=-273.15&&value.ambientC<=1000&&
      finite(value.heatTransferCoefficientWm2K)&&value.heatTransferCoefficientWm2K>=1e-9&&value.heatTransferCoefficientWm2K<=1e6&&
      finite(value.exposedAreaM2)&&value.exposedAreaM2>=1e-9&&value.exposedAreaM2<=1e12&&
      [value.additionalLossW,value.coolingW].every(loss=>finite(loss)&&loss>=0&&loss<=1e12);
  }
  function validCabinetFeatures(records){
    if(!Array.isArray(records))return false;
    const ids=new Set();
    return records.every(feature=>{
      if(!feature||typeof feature.id!=='string'||!feature.id||ids.has(feature.id))return false;
      ids.add(feature.id);
      return ['mounting-hole','cable-entry'].includes(feature.kind)&&cabinetFeatureFaces.includes(feature.face)&&
        ['circle','rectangle'].includes(feature.shape)&&[feature.positionMm?.x,feature.positionMm?.y].every(value=>finite(value)&&value>=0&&value<=1e6)&&
        [feature.widthMm,feature.heightMm].every(value=>finite(value)&&value>0&&value<=1e6)&&
        (feature.shape!=='circle'||feature.widthMm===feature.heightMm);
    });
  }

  function validateProject(project) {
    const errors = [];
    if (!project || typeof project !== 'object') return { valid: false, errors: ['Project must be a JSON object.'] };
    if(project.connectionIssues!==undefined&&(!Array.isArray(project.connectionIssues)||project.connectionIssues.some(function(issue){return !issue||typeof issue.id!=='string'||typeof issue.code!=='string'||typeof issue.message!=='string'||!Array.isArray(issue.endpoints);})))errors.push('Project connection diagnostics are malformed.');
    if (project.format !== PROJECT_FORMAT) errors.push('Unsupported Adigun project format.');
    if (![1, PROJECT_VERSION].includes(project.version)) errors.push('Unsupported project version.');
    if(project.calculations!==undefined){
      const records=project.calculations,ids=new Set();
      const map=(value,check)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.values(value).every(check);
      if(!Array.isArray(records)||records.some(record=>{
        if(!record||typeof record.id!=='string'||!/^[A-Za-z0-9_.:-]{1,128}$/.test(record.id)||ids.has(record.id)||
          typeof record.name!=='string'||!record.name.trim()||record.name.length>160||
          typeof record.kind!=='string'||!record.kind||typeof record.methodReference!=='string'||!record.methodReference||
          !map(record.inputs,finite)||!map(record.units,value=>typeof value==='string')||
          !Array.isArray(record.assumptions)||record.assumptions.some(value=>typeof value!=='string'))return true;
        ids.add(record.id);
        return false;
      }))errors.push('Invalid or duplicate calculation records.');
    }
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
        if(sheet.floorPlan!==undefined){
          const plan=sheet.floorPlan;
          if(!plan||typeof plan!=='object'||['building','level'].some(key=>typeof plan[key]!=='string'||!plan[key].trim()||plan[key].length>80)||plan.elevationMm!==undefined&&!finite(plan.elevationMm)||!validImportScale(plan.importMmPerUnit))errors.push('Invalid building floor plan on sheet '+sheet.id+'.');
          if(plan?.engineeringProfile!==undefined&&(typeof plan.engineeringProfile!=='string'||!Object.prototype.hasOwnProperty.call(floorEngineeringProfiles,plan.engineeringProfile))||
            plan?.standardEdition!==undefined&&(!plan.engineeringProfile||typeof plan.standardEdition!=='string'||!plan.standardEdition.trim()||plan.standardEdition.length>120))errors.push('Invalid floor engineering profile on sheet '+sheet.id+'.');
        }
        if(sheet.drafting!==undefined){
          const drafting=sheet.drafting;
          if(!drafting||!['du','mm','in'].includes(drafting.units)||['minor','major','snap'].some(key=>!Number.isFinite(drafting[key])||drafting[key]<1e-5||drafting[key]>1e6)){
            errors.push('Invalid drafting settings on sheet '+sheet.id+'.');
          }
        }
        if(sheet.guides!==undefined){
          const guides=sheet.guides,ids=new Set();
          if(!Array.isArray(guides)||guides.some(guide=>{
            if(!guide||typeof guide.id!=='string'||!guide.id||ids.has(guide.id)||!['x','y'].includes(guide.axis)||!Number.isFinite(guide.position)||typeof guide.hidden!=='boolean'||typeof guide.locked!=='boolean')return true;
            ids.add(guide.id);
            return false;
          }))errors.push('Invalid drafting guides on sheet '+sheet.id+'.');
        }
        if(sheet.cabinetBounds!==undefined&&!validCabinetBounds(sheet.cabinetBounds))errors.push('Invalid cabinet boundaries on sheet '+sheet.id+'.');
        if(sheet.cabinetFeatures!==undefined&&(!sheet.cabinetBounds||!validCabinetFeatures(sheet.cabinetFeatures)))errors.push('Invalid cabinet openings on sheet '+sheet.id+'.');
        if(sheet.panelThermal!==undefined&&!validPanelThermalInputs(sheet.panelThermal))errors.push('Invalid panel thermal assumptions on sheet '+sheet.id+'.');
        if(sheet.paper!==undefined){
          const paper=sheet.paper,paperSizes={A0:841,A1:594,A2:420,A3:297,A4:210};
          const size=paper?.format==='Custom'?Math.min(paper.customWidth,paper.customHeight):paperSizes[paper?.format];
          if(!paper||!Number.isFinite(size)||!['portrait','landscape'].includes(paper.orientation)||
            [paper.customWidth,paper.customHeight].some(value=>!Number.isFinite(value)||value<20||value>5000)||
            !Number.isFinite(paper.margin)||paper.margin<0||paper.margin>=size/2||
            ['centerX','centerY'].some(key=>paper[key]!==undefined&&(!finite(paper[key])||Math.abs(paper[key])>10000000))||
            !Number.isFinite(paper.scale)||paper.scale<0||paper.scale>10000)errors.push('Invalid paper settings on sheet '+sheet.id+'.');
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
      const objectsById=new Map(project.objects.filter(Boolean).map(object=>[object.id,object]));
      const rooms=new Map(project.objects.filter(object=>object?.roomName).map(room=>[room.id,room]));
      const floorSheets=new Map((Array.isArray(project.sheets)?project.sheets:[]).filter(sheet=>sheet?.floorPlan).map(sheet=>[sheet.id,sheet]));
      const floorIds=new Set(floorSheets.keys());
      project.objects.forEach(function (object, index) {
        if (!object || typeof object !== 'object') {
          errors.push('Drawing object ' + (index + 1) + ' is invalid.');
          return;
        }
        if (typeof object.id !== 'string' || !object.id || objectIds.has(object.id)) errors.push('Drawing object ID is missing or duplicated: '+object.id);
        objectIds.add(object.id);
        if(object.zIndex!==undefined&&!Number.isSafeInteger(object.zIndex))errors.push('Drawing object '+object.id+' requires an integer draw order.');
        if(object.layer!==undefined&&!['connections','devices','annotations','architecture'].includes(object.layer))errors.push('Drawing object '+object.id+' requires a supported drawing layer.');
        if(object.lineType!==undefined&&!['solid','dashed','dotted'].includes(object.lineType))errors.push('Drawing object '+object.id+' requires a supported line type.');
        if(object.dimensionOffset!==undefined&&(object.kind!=='line'||object.wallThickness!==undefined||!finite(object.dimensionOffset)||![object.x1,object.y1,object.x2,object.y2].every(finite)||Math.hypot(object.x2-object.x1,object.y2-object.y1)<2))errors.push('Invalid dimension line '+object.id+'.');
        if(object.planImport!==undefined){
          const source=object.planImport;
          if(!source||typeof source.closed!=='boolean'||!validImportScale(source.overrideMmPerUnit)||['file','layer','element'].some(key=>typeof source[key]!=='string'||!source[key].trim()||source[key].length>255)||
            object.kind!=='freehand'||!Array.isArray(object.points)||object.points.length<(source.closed?3:2)||
            object.points.length>10000||object.points.some(point=>!point||!finite(point.x)||!finite(point.y)))errors.push('Invalid imported plan geometry '+object.id+'.');
        }
        if(object.wallThickness!==undefined&&(object.kind!=='line'||!finite(object.wallThickness)||object.wallThickness<1||![object.x1,object.y1,object.x2,object.y2].every(finite)||Math.hypot(object.x2-object.x1,object.y2-object.y1)<2))errors.push('Invalid wall outline '+object.id+'.');
        if(object.wallOpenings!==undefined&&!validWallOpenings(object))errors.push('Invalid hosted openings on wall '+object.id+'.');
        if(object.floorRouteKind!==undefined&&(object.kind!=='freehand'||!['cable','conduit','tray'].includes(object.floorRouteKind)||!validFloorRoutePoints(object.points)||!floorIds.has(object.sheetId||(project.sheets?.length===1?project.sheets[0]?.id:null))))errors.push('Invalid measured floor route '+object.id+'.');
        if(object.floorRouteTag!==undefined&&(!object.floorRouteKind||typeof object.floorRouteTag!=='string'||!object.floorRouteTag.trim()||object.floorRouteTag.length>64))errors.push('Invalid floor route tag '+object.id+'.');
        if(object.voltageDrop!==undefined){
          const drop=object.voltageDrop;
          if(object.floorRouteKind!=='cable'||!drop||![1,3].includes(drop.phases)||
            ['voltage','current','resistancePerLength','reactancePerLength','powerFactor','dropLimit'].some(key=>!finite(drop[key])||drop[key]<0)||
            drop.voltage<=0||drop.powerFactor>1||drop.dropLimit<=0||drop.dropLimit>100||
            typeof drop.evidence!=='string'||drop.evidence.trim().length<8||drop.evidence.length>400)errors.push('Invalid route voltage drop inputs '+object.id+'.');
        }
        if(object.ampacity!==undefined){
          const ampacity=object.ampacity;
          if(object.floorRouteKind!=='cable'||!ampacity||!finite(ampacity.current)||ampacity.current<0||
            ['ratedCurrent','tabulatedAmpacity','temperatureFactor','groupingFactor','installationFactor','area'].some(key=>!finite(ampacity[key])||ampacity[key]<=0)||
            typeof ampacity.evidence!=='string'||ampacity.evidence.trim().length<8||ampacity.evidence.length>400)errors.push('Invalid route ampacity inputs '+object.id+'.');
        }
        if(object.coordination!==undefined){
          const record=object.coordination;
          if(object.floorRouteKind!=='cable'||!record||!finite(record.faultCurrent)||record.faultCurrent<0||
            ['selectivityLimit','breakingCapacity'].some(key=>!finite(record[key])||record[key]<=0)||
            typeof record.evidence!=='string'||record.evidence.trim().length<8||record.evidence.length>400)errors.push('Invalid route coordination inputs '+object.id+'.');
        }
        if(object.riserTargetSheetId!==undefined){
          const sheetId=object.sheetId||(project.sheets?.length===1?project.sheets[0]?.id:null);
          if(!object.floorRouteKind||floorRiserLength(floorSheets.get(sheetId),floorSheets.get(object.riserTargetSheetId))===null)errors.push('Invalid floor riser '+object.id+'.');
        }
        if(object.floorCircuits!==undefined||object.floorCircuit!==undefined){
          const sheetId=object.sheetId||(project.sheets?.length===1?project.sheets[0]?.id:null);
          const boardId='building-distribution-board';
          const circuits=object.floorCircuits;
          if(circuits!==undefined&&(object.kind!=='component-instance'||object.componentId!==boardId||!floorIds.has(sheetId)||!Array.isArray(circuits)||
            circuits.some(circuit=>!circuit||typeof circuit.id!=='string'||!circuit.id||typeof circuit.name!=='string'||!circuit.name.trim()||circuit.name.length>40)||
            new Set(circuits.map(circuit=>circuit.id)).size!==circuits.length||new Set(circuits.map(circuit=>circuit.name)).size!==circuits.length))errors.push('Invalid floor circuits on '+object.id+'.');
          if(object.floorCircuit!==undefined){
            const assignment=object.floorCircuit,board=objectsById.get(assignment?.boardId);
            const eligible=object.floorRouteKind&&object.kind==='freehand'||object.kind==='component-instance'&&Boolean(component(object.componentId)?.instanceProperties.activePowerW);
            if(!floorIds.has(sheetId)||!eligible||
              board?.kind!=='component-instance'||board.componentId!==boardId||(board.sheetId||sheetId)!==sheetId||!Array.isArray(board.floorCircuits)||
              !board.floorCircuits.some(circuit=>circuit&&circuit.id===assignment.circuitId))errors.push('Invalid floor circuit assignment on '+object.id+'.');
          }
        }
        if(object.roomId!==undefined){
          const sheetId=object.sheetId||(project.sheets?.length===1?project.sheets[0]?.id:null);
          const room=rooms.get(object.roomId);
          if(!room||!floorIds.has(sheetId)||(room.sheetId||sheetId)!==sheetId||object.kind!=='component-instance'||component(object.componentId)?.family!=='building-device')errors.push('Invalid room assignment on '+object.id+'.');
        }
        if(object.roomName!==undefined&&(object.kind!=='rect'||typeof object.roomName!=='string'||!object.roomName.trim()||object.roomName.length>80||![object.x,object.y,object.x2,object.y2].every(finite)||Math.abs(object.x2-object.x)<2||Math.abs(object.y2-object.y)<2))errors.push('Invalid room outline '+object.id+'.');
        if(object.floorZone!==undefined){
          const zone=object.floorZone;
          const sheetId=object.sheetId||(project.sheets?.length===1?project.sheets[0]?.id:null);
          const width=Math.abs(object.x2-object.x),length=Math.abs(object.y2-object.y);
          const validBoundary=object.kind==='rect'?finite(width*length)&&width>=2&&length>=2:
            object.kind==='freehand'&&floorZonePolygonArea(object.points)!==null;
          if(!zone||!['electrical','distribution'].includes(zone.kind)||typeof zone.name!=='string'||!zone.name.trim()||zone.name.length>80||
            !validBoundary||object.roomName!==undefined||!floorIds.has(sheetId))errors.push('Invalid floor zone '+object.id+'.');
          if(zone?.roomIds!==undefined&&(!Array.isArray(zone.roomIds)||new Set(zone.roomIds).size!==zone.roomIds.length||
            zone.roomIds.some(id=>!rooms.has(id)||(rooms.get(id).sheetId||sheetId)!==sheetId)))errors.push('Zone rooms must be unique and on the same floor.');
          if(zone?.boardId!==undefined){
            const board=objectsById.get(zone.boardId);
            if(zone.kind!=='distribution'||board?.kind!=='component-instance'||board.componentId!=='building-distribution-board'||
              (board.sheetId||sheetId)!==sheetId)errors.push('A distribution zone board must be on the same floor.');
          }
        }
        if(object.kind==='wire'){try{wireRoute(object);}catch(error){errors.push(error.message);}}
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
        if(object.mountingDepthMm!==undefined&&(object.kind!=='panel-placement'||!finite(object.mountingDepthMm)||object.mountingDepthMm<0||object.mountingDepthMm>1e6))errors.push('Invalid mounting depth '+object.id+'.');
        if(object.heatLossW!==undefined&&(object.kind!=='panel-placement'||!finite(object.heatLossW)||object.heatLossW<0||object.heatLossW>1e12))errors.push('Invalid panel equipment loss '+object.id+'.');
        if(object.mountingRailId!==undefined&&(object.kind!=='panel-placement'||typeof object.mountingRailId!=='string'||!object.mountingRailId))errors.push('Invalid mounting rail reference '+object.id+'.');
        if(object.automationNote!==undefined&&(object.kind!=='text'||!validAutomationNote(object.automationNote)))errors.push('Invalid automation note '+object.id+'.');
        if(object.accessDirection!==undefined&&(object.kind!=='panel-placement'||!['front','back','left','right','top','bottom'].includes(object.accessDirection)))errors.push('Invalid service access direction '+object.id+'.');
        if(object.accessClearanceMm!==undefined&&(object.kind!=='panel-placement'||!finite(object.accessClearanceMm)||object.accessClearanceMm<=0||object.accessClearanceMm>1e6))errors.push('Invalid service access distance '+object.id+'.');
        if(object.panelStructure!==undefined){
          const shape=object.panelStructure;
          if(object.kind!=='rect'||!shape||!['mounting-plate','din-rail','cable-duct','terminal-rail','panel-door','panel-compartment'].includes(shape.kind)||
            ![object.x,object.y,object.x2,object.y2].every(finite)||object.x===object.x2||object.y===object.y2||
            shape.z!==undefined&&(!finite(shape.z)||shape.z<0||shape.z>1e6)||
            shape.depth!==undefined&&(!finite(shape.depth)||shape.depth<=0||shape.depth>1e6)||!validDuctInputs(shape))errors.push('Invalid panel mounting structure '+object.id+'.');
        }
        if(object.clearanceCondition!==undefined&&(object.kind!=='panel-placement'||
          !['sideBySide','groundedParts','liveParts'].includes(object.clearanceCondition)||
          !component(object.footprintComponentId)?.panelFootprint?.clearancesMm?.[object.clearanceCondition]))errors.push('Invalid panel clearance condition '+object.id+'.');
        if (object.kind === 'panel-placement') {
          if(typeof object.deviceId!=='string'||!object.deviceId||typeof object.footprintComponentId!=='string'||!object.footprintComponentId||![object.x,object.y,object.scale].every(finite)||object.scale<=0||![0,90,180,270].includes(object.rotation===undefined?0:object.rotation))errors.push('Panel placement '+object.id+' has invalid identity or geometry.');
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
    result.forEach(function(object){
      if(selected.has(object.roomId))delete object.roomId;
      if(selected.has(object.floorCircuit?.boardId))delete object.floorCircuit;
      const zone=object.floorZone;
      if(zone?.roomIds)zone.roomIds=zone.roomIds.filter(id=>!selected.has(id));
      if(zone&&selected.has(zone.boardId))delete zone.boardId;
    });
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
    if(replacementId!==original.componentId&&target.plcIo)throw new Error('Clear the PLC I/O assignments before replacing this CPU.');
    if(replacement.family!=='building-device'){delete target.roomId;delete target.floorCircuit;}
    if(!replacement.instanceProperties.activePowerW)delete target.floorCircuit;
    if(replacementId!=='building-distribution-board'&&target.floorCircuits){
      delete target.floorCircuits;
      for(const load of result)if(load.floorCircuit?.boardId===target.id)delete load.floorCircuit;
    }
    if(original.componentId==='building-distribution-board'&&replacementId!==original.componentId){
      for(const item of result)if(item.floorZone?.boardId===target.id)delete item.floorZone.boardId;
    }
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
    const titles=['Project overview','Title and revision','Contents and drawing register','Equipment and device register','Symbols, terms and potentials','Design basis and calculations','Supply interface and contactor','Overload and outgoing motor interface','Field isolation and delta motor','Local stop, permissives and seal-in','Auxiliary supply and control protection','Coil-voltage and overload-trip indication','Operating sequence and interlocks','Motor feeder short-circuit protection','Supply isolation and distribution','Field terminal connections','Field control terminal interfaces','Earthing and bonding','Cross-sheet connection register','Enclosure dimensions and installation boundary'];
    const sections=defaultProjectSections(),sheets=titles.map(function(title,index){return {id:'eng0601-'+(index<6?'a1-'+index:index<19?'a2-'+(index-6):'a3-'+(index-19)),sectionId:index<6?'A1':index<19?'A2':'A3',name:title,number:(index<6?'A1/':index<19?'A2/':'A3/')+String(index).padStart(3,'0'),metadata:{revision:'P01',issueStatus:'Engineering development'}};});
    const objects=[];
    function text(page,id,x,y,value,size,width){objects.push({id:'eng0601-'+id,sheetId:sheets[page].id,kind:'text',x:x,y:y,text:value,fontFamily:'Arial',fontSize:size||14,textWidth:width||1050,rotation:0,stroke:'#183c50'});}
    function rows(page,lines){lines.forEach(function(line,index){text(page,'p'+page+'-r'+index,60,125+index*24,line,13,1070);});}
    titles.forEach(function(title,index){text(index,'heading-'+index,60,65,'ENG-0601 | '+title,22);});
    text(0,'p0-r0',60,100,'Direct-on-line pump starter | Local manual baseline',14);
    function overviewPath(id,title,y,steps){
      text(0,'overview-path-'+id,60,y-14,title,12);
      steps.forEach(function(step,index){
        const x=60+index*174,key=id+'-'+index;
        objects.push({id:'eng0601-overview-block-'+key,sheetId:sheets[0].id,kind:'rect',x:x,y:y,x2:x+146,y2:y+54,stroke:'#64748b',fill:'#eef4f8'});
        text(0,'overview-label-'+key,x+10,y+20,step,12,126);
        if(index<steps.length-1){
          objects.push({id:'eng0601-overview-arrow-'+key,sheetId:sheets[0].id,kind:'arrow',x:x+149,y:y+27,x1:x+149,y1:y+27,x2:x+171,y2:y+27,stroke:'#183c50'});
        }
      });
    }
    overviewPath('power','MOTOR POWER PATH',145,['Site supply\nW1 boundary','Q1 / F1\nIsolate and protect','K1\nSwitch motor power','F2\nOverload relay','Q2\nField isolator','M1\nPump motor']);
    overviewPath('control','24 V CONTROL PATH',267,['PS1 / F4\nProtected supply','S0 / Q2:AUX\nStop and field enable','F2:95/96 / B1\nOverload and pressure','S1 / K1:13–14\nStart and hold','K1:A1/A2\nContactor coil','PS1\n0 V return']);
    text(0,'overview-scope',60,360,'Arrows show functional dependencies. See A2 for electrical wires and terminal identities.\nPanel: protection, starter, control supply, terminals, operator controls and indication.\nField: motor and pump, lockable Q2 isolator and B1 pressure device. PE bypasses both isolators.\nExternal interfaces: site supply and PE, hydraulic process and mechanical pump coupling.\nH1 shows coil command. H2 shows overload trip when its protected control supply is available.\nSee the interlock matrix for power restoration and the held-S1 limitation. Ordinary control is not a safety function.',13);
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
      'Next issue: cable/protection calculations, coordinated device footprints, installation details and final verification of A4.',
      'Revision record is editable project text; append subsequent changes without deleting this issue history.'
    ]);
    text(2,'dependencies',60,535,'All listed sheets exist. Paired A2 references use the project sheet numbers shown after ↔.\nA1 defines the design basis. A3 uses the A2 device identities. A4 reports derive from A2 and A3.',11);
    rows(3,[
      'Tags below are reserved once per physical device. Candidate order codes are not procurement approval.',
      'K1 | Panel | motor contactor | Siemens 3RT2027-2KB40 | 32 A AC-3; 24 V DC coil; S0.',
      'F2 | Panel | thermal overload | Siemens 3RU2126-4BB0 | 14–20 A / Class 10; design setting 15.2 A.',
      'F1 | Panel | magnetic-only starter breaker | Siemens 3RV2321-4BC10 | 20 A; instantaneous release 260 A.',
      'M1 | Field | pump drive | SEW-EURODRIVE DRN132M4 | candidate motor family; exact build to be selected.',
      'PS1 | Panel | auxiliary supply | Siemens 6EP1332-5BA00 | candidate; input and load budget to verify.',
      'S0 / S1 | Panel door | stop NC / start NO | Schneider XB5AA42 / XB5AA31 | candidates.',
      'B1 | Field | pressure permissive | Telemecanique XMLB004A2S11 | terminal/rating suitability unresolved.',
      'Q1 | Panel | Siemens 3LD2244-1TL51, four poles. Q2 | Field | 3LD2203-0TK51 in proposed ENC2.',
      'F3 Siemens 5SY4110-7 C10; F4 Phoenix 2908262 set to 1 A. Verify upstream and branch coordination.',
      'H1 / H2 | Panel door | coil voltage / F2 trip contact | Schneider XB5AVB3 green / XB5AVB4 red.',
      'X1–X5 / XPE | Panel terminals with sourced covers and brackets. See A3 layouts and the A4 material register.',
      'Cable tags: W1 supply, W2 panel to Q2, W3 Q2 to M1, W4 pressure, W5 Q2 auxiliary. Sizes and routes open.',
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

    const q2=part(8,'siemens-3ld2203-0tk51','Q2',400,250,0,'Field maintenance isolator proposed for ENC2. Verify OFF locking, auxiliary fit and upstream protection.'),
      m1=part(8,'sew-eurodrive-drn132m4-delta-board','M1',400,450,0,'Field pump motor candidate. 400 V delta schematic; exact motor build, mechanical duty and installation approval unresolved.'),
      pe=part(8,'phoenix-contact-3212147-rail-view','XPE:1',200,530,0,'Panel PE interface shown at the field boundary; rail, enclosure and door bonding remain to be completed.');
    for(let n=1;n<=3;n++){
      const x=300+n*50,terminal=objects.find(function(o){return o.ref==='X2:'+n;}),out={x:x,y:650-(n-1)*40},input={x:x,y:180-(n-1)*40};
      terminal.properties.comment='Panel outgoing phase terminal to field Q2; cable sizing and enclosure selection remain unresolved.';
      const a=wire(7,'field-out-'+n,pin(terminal,'connection-2'),out,'W2:'+n),
        b=wire(8,'field-in-'+n,input,pin(q2,'line-l'+n),'W2:'+n);
      a.cable={tag:'W2',core:String(n)};
      b.cable={tag:'W2',core:String(n)};
      a.continuationEnds=['end'];b.continuationEnds=['start'];
      powerLinks.push({id:'eng0601-x2-q2-'+n,name:'W2:'+n+' · X2:'+n+' → Q2:'+String(n*2-1)+'L'+n,endpoints:[
        {sheetId:sheets[7].id,wireId:a.id,point:out,connector:{targetSheetId:sheets[8].id,targetRef:'Q2',direction:'right'}},
        {sheetId:sheets[8].id,wireId:b.id,point:input,connector:{targetSheetId:sheets[7].id,targetRef:'X2:'+n,direction:'left'}}
      ]});
      const phase=['u','v','w'][n-1],other=['w','u','v'][n-1];
      wire(8,'q2-m1-'+n,pin(q2,'load-t'+n),pin(m1,'winding-'+phase+'1'),'W3:'+n).cable={tag:'W3',core:String(n)};
      wire(8,'delta-'+n,pin(m1,'winding-'+phase+'1'),pin(m1,'winding-'+other+'2'),'M1 bridge '+n);
    }
    const fieldPE=part(8,'phoenix-contact-3212147','XPEF:1',335,540,0,'Proposed ENC2 PE terminal. W2 PE enters clamp 1 and W3 PE leaves clamp 2. Check its rail bond and actual conductor fit.');
    const fieldEarth=wire(8,'isolator-pe',pin(pe,'connection-2'),pin(fieldPE,'connection-1'),'W2:PE');
    const motorEarth=wire(8,'motor-pe',pin(fieldPE,'connection-2'),pin(m1,'protective-earth'),'W3:PE');
    fieldEarth.cable={tag:'W2',core:'PE'};
    motorEarth.cable={tag:'W3',core:'PE'};
    for(const earth of [fieldEarth,motorEarth]){earth.stroke='#178743';earth.conductorColor='green/yellow';}
    text(8,'pe-label',75,620,'XPE:1 → XPEF:1 → M1 frame\nW2:PE and W3:PE stay unswitched.\nVerify conductor sizing and ENC2 bonds.',12,540);
    text(8,'field-notes',680,120,
      'FIELD MOTOR SEGMENT — DEVELOPMENT\n\nQ2: Siemens 3LD2203-0TK51.\nOFF-position locking; three poles; no auxiliary contacts.\n22 A AC-23 at 400 V; 32 A uninterrupted current.\nFront-mounted part: see proposed ENC2 field housing.\n\nM1: SEW DRN132M4 candidate, 7.5 kW / 15.2 A.\n400 V delta: U1–W2, V1–U2 and W1–V2 bridges.\nThis view is schematic, not a physical mounting drawing.\n\nW2 and W3 define phase and PE core assignments.\nLengths, core sizes, grouping and voltage drop are pending.\nPE bypasses Q2; green/yellow identification is explicit.\nNo neutral is used in the motor power circuit.\n\nLock out, secure against reclosure and verify isolation.\nControl restart inhibition and complete protection remain\nunresolved. Do not energise this development design.',13,460);
    objects.find(function(o){return o.id==='eng0601-overload-notes';}).text=
      'PANEL OVERLOAD SEGMENT — DEVELOPMENT\n\nF2: Siemens 3RU2126-4BB0, 14–20 A, Class 10.\nIncoming phases originate at K1.\n95/96 and 97/98 await the control/trip circuits.\n\nX2:1 / :2 / :3 continue via W2:1 / :2 / :3 to Q2.\nUse the paired references to open the field motor sheet.\n\nNo overload setting is claimed as approved.\nThe 15.2 A candidate motor is within the adjustment range;\nthis alone does not verify protection coordination.\n\nPhysical separation here is documentation only.\nFinal A3 layout must follow mounting instructions.\nUnused-control terminals are intentional pending design.';
    for(let n=1;n<=3;n++){const label=objects.find(function(o){return o.id==='eng0601-load-label-'+n;});label.x-=20;}


    const auxiliary=part(8,'siemens-3ld9200-5b','Q2:AUX',150,350,0,'Mechanically mounted to Q2. NO 23/24 interrupts the hold circuit before the motor poles open; verify assembly and sequence.'),
      stop=part(9,'schneider-electric-xb5aa42','S0',250,200,0,'Local stop NC 21/22. Ordinary control only; not an emergency-stop safety circuit.'),
      start=part(9,'schneider-electric-xb5aa31','S1',800,350,0,'Momentary start NO 13/14. Released healthy button assumed; this is not monitored-reset or stuck-button protection.'),
      pressure=part(9,'telemecanique-xmlb004a2s11','B1',500,350,0,'Field discharge-pressure cutout. 11/12 control path; verify contact action and setpoints during commissioning.'),
      positive=part(9,'phoenix-contact-3004362','X3:1',130,180,0,'24 V DC control-source boundary. Source and circuit protection remain to be designed.'),
      negative=part(9,'phoenix-contact-3004362','X3:2',130,520,0,'0 V return boundary. No neutral/PE bond is implied.');
    auxiliary.assemblyFor=q2.id;
    pressure.properties.risingPressureBar=2;pressure.properties.fallingPressureBar=1;
    pressure.properties.processPoint='Pump discharge';
    pressure.properties.thresholdDesignNote='Educational assumption: stop at 2 bar rising, allow reset below 1 bar. Verify process suitability, contact action and differential before use.';
    function continuation(id,from,fromPin,fromPoint,to,toPin,toPoint,label,fromDirection,toDirection,cable){
      const fp=sheets.findIndex(function(s){return s.id===from.sheetId;}),tp=sheets.findIndex(function(s){return s.id===to.sheetId;}),a=wire(fp,id+'-from',pin(from,fromPin),fromPoint,label),b=wire(tp,id+'-to',toPoint,pin(to,toPin),label);
      a.continuationEnds=['end'];b.continuationEnds=['start'];
      if(cable){a.cable=Object.assign({},cable);b.cable=Object.assign({},cable);}
      powerLinks.push({id:'eng0601-control-'+id,name:label,endpoints:[{sheetId:from.sheetId,wireId:a.id,point:fromPoint,connector:{targetSheetId:to.sheetId,targetRef:to.ref,targetInstanceId:to.id,direction:fromDirection||'right'}},{sheetId:to.sheetId,wireId:b.id,point:toPoint,connector:{targetSheetId:from.sheetId,targetRef:from.ref,targetInstanceId:from.id,direction:toDirection||'left'}}]});
    }
    const fieldControl=[1,2,3,4].map(function(n){return part(16,'phoenix-contact-3044076','X5:'+n,400,80+n*100,0,'Panel field-control interface; feed-through terminal. Cable/core assignments and accessory selection remain to be verified.');});
    continuation('field-q2-feed',fieldControl[0],'connection-2',{x:580,y:180},auxiliary,'no-23',{x:60,y:270},'Q2-FEED','right','right',{tag:'W5',core:'1'});
    continuation('field-q2-return',auxiliary,'no-24',{x:280,y:330},fieldControl[1],'connection-2',{x:580,y:280},'Q2-RETURN','left','right',{tag:'W5',core:'2'});
    continuation('field-b1-feed',fieldControl[2],'connection-2',{x:580,y:380},pressure,'terminal-11',{x:620,y:250},'B1-FEED','right','right',{tag:'W4',core:'1'});
    continuation('field-b1-return',pressure,'terminal-12',{x:620,y:470},fieldControl[3],'connection-2',{x:580,y:480},'B1-RETURN','right','right',{tag:'W4',core:'2'});
    text(16,'field-control-basis',60,110,'PANEL X5 — four independent feed-through terminals; field devices remain on their existing sheets.',12,1070);
    text(16,'field-control-notes',740,180,'X5:1 / X5:2 — Q2 auxiliary via W5 cores 1/2.\nX5:3 / X5:4 — B1 pressure via W4 cores 1/2.\nNo bridging between these four terminals.\nX5:4 feeds Start and the K1 holding contact.\nTerminal coordinates are schematic only.\nCable products, lengths and PE details remain open.',12,400);
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
    text(17,'pe-rail-notes',650,170,'EXPLICIT PE PATHS — ENGINEERING DEVELOPMENT\nXPE:0/1/2 are panel protective-conductor terminals.\nRAIL denotes each terminal grounding foot, not a clamp.\nGreen rail paths document conductive mounting continuity.\nThey are not two wires inserted in one conductor clamp.\nXPE:1 connection 2 supplies M1 PE via XPEF:1 in ENC2.\nXPE:2 connection 2 supplies the power-supply PE terminal.\nUnused conductor clamps remain available, not bridged.',12,480);
    text(17,'pe-release-checks',60,520,'INSTALLATION: see A3 Protective bonding schedule.\nReserve XPE:0 connection 2 for the separate cabinet PE distribution bond.\nVerify rail and strap fault duty and protective continuity on the actual assembly.\nNo physical test result or installation approval is claimed.',12,630);
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
    for(const [index,kind,refs] of [
      [1,'motor-control',['S1','K1']], [2,'motor-control',['S0','K1']],
      [3,'interlock',['Q2','K1']], [4,'interlock',['F2','H2','K1']],
      [5,'interlock',['B1','K1']], [7,'sequence',['S1','K1','F2','B1','Q2']],
      [10,'safety',['S1','K1']], [11,'safety',['K1','H1','H2']]
    ]){
      const note=objects.find(item=>item.id==='eng0601-p12-r'+index);
      note.automationNote={kind,deviceIds:refs.map(ref=>objects.find(item=>item.kind==='component-instance'&&item.ref===ref)?.id).filter(Boolean)};
    }
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
      const cable=objects.find(function(o){return o.id===link.endpoints[0].wireId;}).cable;
      text(18,'continuation-row-'+index,index<19?60:620,145+(index%19)*21,ends.join(' → ')+(cable?' · '+cable.tag+':'+cable.core:''),10,510);
    });
    text(18,'continuation-scope',60,560,'Each row records one paired continuation. Same-sheet wires are omitted.\nRAIL identifies a mounting-foot interface. Assigned cable cores appear alongside endpoints.\nAfter rewiring, inspect Electrical checks; this snapshot does not auto-refresh.\nCable products, lengths and installation calculations remain open.',10,610);
    const enclosure=part(19,'rittal-1059000','ENC1',300,350,0,'Educational enclosure choice; final assembly thermal, clearance and bonding verification remains required.');
    enclosure.properties.location='Indoor starter/control cabinet';
    const panelProject={objects:objects,sheets:sheets};
    objects.push(createPanelPlacement(panelProject,f1.id,sheets[19].id,220,240,0.5));
    objects.push(createPanelPlacement(panelProject,k1.id,sheets[19].id,300,240,0.5));
    objects.push(createPanelPlacement(panelProject,ps1.id,sheets[19].id,380,240,0.5));
    objects.push(createPanelPlacement(panelProject,f3.id,sheets[19].id,220,420,0.5));
    objects.push(createPanelPlacement(panelProject,f4.id,sheets[19].id,300,420,0.5));
    text(19,'panel-inventory-heading',650,125,'PANEL DEVICE REGISTER — existing A2 identities',12,460);
    const externalRefs=new Set(['M1','Q2','Q2:AUX','B1','ENC2','XPEF:1']);
    const panelDevices=objects.filter(function(o){return o.kind==='component-instance'&&o.id!==enclosure.id&&!externalRefs.has(o.ref);});
    panelDevices.forEach(function(device,index){const definition=component(device.componentId);text(19,'panel-inventory-'+index,650,150+index*13,device.ref+' · '+definition.model,10,460);});
    text(19,'external-boundary',650,525,'EXTERNAL: M1 motor; ENC2 with Q2 and its auxiliary; B1 pressure device.\nSee the Field isolator enclosure sheet for the separate enclosure.',11,460);
    text(19,'enclosure-scope',60,620,'DIMENSIONAL BASIS — 1:2 front view; manufacturer dimensions are in mm.\nPlate outline shows its size. See the separate A3 terminal rail mounting and protective bonding sheets.\nF1, K1, PS1, F3 and F4: linked body envelopes at 1:2; proposed positions only.\nRemaining device footprints, ducts and enclosure thermal load require engineering.\nThe device register is an editable snapshot of A2 instances.',11,620);
    let accessoryCount=0;
    const coverByTerminal=new Map([ukCoverDefinition,utCoverDefinition,peCoverDefinition].flatMap(function(cover){return cover.supportedComponentIds.map(function(id){return [id,cover];});}));
    const railSegments=[];
    const terminalDetailStart=sheets.length;
    const accessorySheet=terminalDetailStart+2;
    sheets[accessorySheet]={id:'eng0601-a3-accessories',sectionId:'A3',name:'Terminal accessory instances',number:'A3/'+String(accessorySheet).padStart(3,'0'),metadata:{revision:'P01',issueStatus:'Development detail — not installation approved'}};
    // Enlarged terminal body arrangements retain canonical A2 device identities.
    [['X1','X2','X3'],['X4','X5','XPE']].forEach(function(strips,pageOffset){
      const index=terminalDetailStart+pageOffset,id='eng0601-a3-'+(pageOffset+1);
      sheets[index]={id:id,sectionId:'A3',name:'Terminal body arrangement '+(pageOffset+1),number:'A3/'+String(index).padStart(3,'0'),metadata:{revision:'P01',issueStatus:'Development detail — not installation approved'}};
      text(index,'terminal-layout-heading-'+index,60,65,'ENG-0601 | Terminal body arrangement '+(pageOffset+1),22);
      text(index,'terminal-layout-basis-'+index,60,100,'5:1 BODY ENVELOPES AND PROPOSED RAILS — drawing coordinates only. Rail stock: Phoenix Contact 0801733.',11,1080);
      strips.forEach(function(strip,column){
        const devices=objects.filter(function(o){return o.kind==='component-instance'&&o.ref.split(':')[0]===strip;}).sort(function(a,b){return a.ref.localeCompare(b.ref,undefined,{numeric:true});});
        const lastTerminal=devices.at(-1),cover=coverByTerminal.get(lastTerminal.componentId);
        function accessory(definition,suffix,comment){
          const slot=accessoryCount++, x=130+slot%6*170, y=175+Math.floor(slot/6)*140;
          const instance=part(accessorySheet,definition.id,'ACC-'+strip+'-'+suffix,x,y,0,comment);
          instance.properties.location='Terminal strip '+strip;
          text(accessorySheet,'accessory-'+instance.ref,x-65,y+44,instance.ref+'\n'+definition.model,10,155);
          return instance;
        }
        const leftBracket=accessory(terminalEndBracketDefinition,'L','Proposed left end bracket on NS 35/7.5 rail.');
        const rightBracket=accessory(terminalEndBracketDefinition,'R','Proposed right end bracket on NS 35/7.5 rail.');
        const arranged=[leftBracket,...devices];
        if(cover){
          const endCover=accessory(cover,'C','Proposed cover on the final terminal in this strip.');
          endCover.assemblyFor=lastTerminal.id;
          arranged.push(endCover);
        }
        arranged.push(rightBracket);
        const spareWidth=component(lastTerminal.componentId).panelFootprint.widthMm;
        const width=arranged.reduce(function(total,o){return total+component(o.componentId).panelFootprint.widthMm*5;},spareWidth*5);
        const center=220+column*330;
        // Keep the cut centred around complete slots with the same margin at each cut end.
        const slotCount=Math.max(2,1+Math.ceil((width/5+8-33)/25));
        const railLength=33+(slotCount-1)*25;
        const slotOffsets=Array.from({length:slotCount},function(_,slot){return (slot-(slotCount-1)/2)*25;});
        if(width/5+8>railLength)throw new Error('Terminal bodies exceed the planned rail span for '+strip+'.');
        const bodyHeight=Math.max(...arranged.map(function(device){return component(device.componentId).panelFootprint.heightMm;}));
        railSegments.push({strip:strip,length:railLength,slotOffsets:slotOffsets,bodyHeight:bodyHeight,x:105+column*165,y:350+pageOffset*330});
        const railHalfLength=railLength*2.5;
        objects.push({id:'eng0601-terminal-rail-'+strip,sheetId:id,kind:'rect',x:center-railHalfLength,y:252.5,x2:center+railHalfLength,y2:427.5,stroke:'#6b7280',fill:'#e5e7eb'});
        let left=center-width/2;
        text(index,'terminal-strip-'+strip,130+column*330,135,strip+' — '+devices.length+' terminals'+(cover?'':' | cover pending'),12,290);
        arranged.forEach(function(device){const footprint=component(device.componentId).panelFootprint;objects.push(createPanelPlacement(panelProject,device.id,id,left+footprint.widthMm*2.5,340,5));left+=footprint.widthMm*5;});
        objects.push({id:'eng0601-rail-spare-'+strip,sheetId:id,kind:'rect',x:left,y:252.5,x2:left+spareWidth*5,y2:427.5,stroke:'#64748b',lineType:'dashed',fill:'none'});
        text(index,'rail-spare-label-'+strip,130+column*330,523,'Spare rail space: '+spareWidth+' mm',10,290);
        text(index,'terminal-rail-size-'+strip,130+column*330,547,'NS 35/7.5 · proposed '+railLength+' mm segment',10,290);
      });
      text(index,'terminal-layout-limit-'+index,60,570,'Dashed space reserves one matching terminal beyond the current end stop. Reposition the end stop and cover if used.\nNo spare terminal is fitted. See Terminal rail mounting for plate datums and slot centres.',11,1050);
    });
    text(sheets.length-1,'accessory-register-heading',60,65,'ENG-0601 | Terminal accessory instances',22);
    text(sheets.length-1,'accessory-register-basis',60,105,'Editable accessories. Linked 5:1 body views are on the preceding A3 sheets.\nUK 5 N (3004362): Phoenix Contact lists end cover D-UK 4/10 (3003020), 1.8 mm wide.',11);
    function developmentSheet(section,id,title){
      const index=sheets.length;
      sheets.push({id:id,sectionId:section,name:title,number:section+'/'+String(index).padStart(3,'0'),metadata:{revision:'P01',issueStatus:'Engineering development — not approved'}});
      text(index,'heading-'+index,60,65,'ENG-0601 | '+title,22);
      return index;
    }
    const railPage=developmentSheet('A3','eng0601-a3-rail-mounting','Terminal rail mounting and access');
    function railRectangle(id,x,y,width,height,fill){
      objects.push({id:'eng0601-'+id,sheetId:sheets[railPage].id,kind:'rect',x:x,y:y,x2:x+width,y2:y+height,stroke:'#64748b',fill:fill});
    }
    const plate={x:80,y:125,scale:0.5};
    const plateSize=rittalEnclosureDefinition.specifications.mountingPlate;
    const plateCenter={x:plate.x+plateSize.width.value*plate.scale/2,y:plate.y+plateSize.height.value*plate.scale/2};
    const cabinetViews=objects.filter(function(o){return o.kind==='panel-placement'&&o.sheetId===enclosure.sheetId;});
    railRectangle('rail-plate',plate.x,plate.y,plateSize.width.value*plate.scale,plateSize.height.value*plate.scale,'none');
    const ductWidth=20,ductInset=20,ductTop=50,ductLength=700;
    const controlDuctX=plateSize.width.value-ductInset-ductWidth;
    railRectangle('duct-power',plate.x+ductInset*plate.scale,plate.y+ductTop*plate.scale,ductWidth*plate.scale,ductLength*plate.scale,'#e0edff');
    railRectangle('duct-control',plate.x+controlDuctX*plate.scale,plate.y+ductTop*plate.scale,ductWidth*plate.scale,ductLength*plate.scale,'#dcfce7');
    text(railPage,'duct-power-label',80,530,'LEFT: POWER',10,110);
    text(railPage,'duct-control-label',270,530,'RIGHT: CONTROL',10,130);
    text(railPage,'duct-corridor-datums',410,520,'DUCT RESERVATIONS · '+ductWidth+' mm wide × '+ductLength+' mm long, y '+ductTop+'–'+(ductTop+ductLength)+' from plate datum.\nPower x '+ductInset+'–'+(ductInset+ductWidth)+'; control x '+controlDuctX+'–'+(controlDuctX+ductWidth)+'. Select actual ducts after cable fill and bend checks.\nConfirm branch routes and separation between power and control before drilling.',11,680);
    const psPlacement=cabinetViews.find(function(o){return o.deviceId===ps1.id;});
    const psGeometry=panelPlacementGeometry(panelProject,psPlacement);
    const psCenter={x:plateCenter.x+psGeometry.x-enclosure.x,y:plateCenter.y+psGeometry.y-enclosure.y};
    const psClearance=psGeometry.footprint.clearancesMm;
    const psZoneTop=psCenter.y-psGeometry.height/2-psClearance.top*plate.scale;
    const psZoneHeight=psGeometry.height+(psClearance.top+psClearance.bottom)*plate.scale;
    railRectangle('rail-ps1-zone',psCenter.x-psGeometry.width/2,psZoneTop,psGeometry.width,psZoneHeight,'#fef3c7');
    text(railPage,'rail-ps1-label',psCenter.x-27,psZoneTop-5,'PS1 convection',9,100);
    cabinetViews.forEach(function(view){
      objects.push(createPanelPlacement(panelProject,view.deviceId,sheets[railPage].id,plateCenter.x+view.x-enclosure.x,plateCenter.y+view.y-enclosure.y,plate.scale));
    });
    const f2Support=part(railPage,overloadSupportDefinition.id,'ACC-F2',plate.x+432.5*plate.scale,plate.y+490*plate.scale,0,'Proposed stand-alone support for F2. Shown at 1:2 using support body dimensions. Verify the installed relay envelope and wiring before fabrication.');
    f2Support.assemblyFor=f2.id;
    text(railPage,'rail-datum',80,112,'0,0 · PLATE FRONT / TOP LEFT · 1:2',11,300);
    text(railPage,'rail-table-heading',410,110,'CENTRES AND FASTENER LOCATIONS · mm from plate datum',13,680);
    railSegments.forEach(function(rail,index){
      const cx=plate.x+rail.x*plate.scale,cy=plate.y+rail.y*plate.scale;
      const halfWidth=rail.length*plate.scale/2,halfAccess=(rail.bodyHeight/2+50)*plate.scale;
      railRectangle('rail-access-'+rail.strip,cx-halfWidth-7.5,cy-halfAccess,halfWidth*2+15,halfAccess*2,'#eef4f8');
      railRectangle('rail-segment-'+rail.strip,cx-halfWidth,cy-8.75,halfWidth*2,17.5,'#cbd5e1');
      rail.slotOffsets.forEach(function(offset,slot){railRectangle('rail-slot-'+rail.strip+'-'+slot,cx+(offset-7.5)*plate.scale,cy-1.55,15*plate.scale,3.1,'#ffffff');});
      text(railPage,'rail-plate-label-'+rail.strip,cx-halfWidth,cy-13,rail.strip,9,45);
      text(railPage,'rail-mount-'+rail.strip,410,143+index*25,rail.strip+' · cut '+rail.length+' · centre ('+rail.x+', '+rail.y+') · slots x '+rail.slotOffsets.map(function(offset){return rail.x+offset;}).join(' / ')+' at y '+rail.y,12,680);
    });
    const railAccessZones=objects.filter(function(o){return o.sheetId===sheets[railPage].id&&o.id.startsWith('eng0601-rail-access-');});
    const ductGaps=['power','control'].map(function(side){
      const duct=objects.find(function(o){return o.id==='eng0601-duct-'+side;});
      return Math.min(...railAccessZones.filter(function(zone){return duct.y<zone.y2&&duct.y2>zone.y;}).map(function(zone){
        return (side==='power'?zone.x-duct.x2:duct.x-zone.x2)/plate.scale;
      }));
    });
    text(railPage,'rail-duct-gap',410,595,'DRAWN DUCT-TO-SERVICE GAPS · power '+ductGaps[0]+' mm / control '+ductGaps[1]+' mm. Check delivered assembly fit separately.',11,680);
    text(railPage,'rail-mount-notes',410,315,'STOCK 0801733 · 35 × 7.5 mm · 15 × 6.2 mm slots at 25 mm pitch.\nCentre each cut around the listed slots. Confirm cut tolerance, burr-free ends and full washer seating.\nCandidate M5 through-fasteners with washers and locking nuts. Check grip and enclosure rear space.\n50 mm above/below body and 15 mm at rail ends are proposed service spaces. Check cable bend radii.\nKeep the existing PS1 50 mm upper and lower convection zones free. Route ducts outside these zones.',11,680);
    text(railPage,'rail-mount-status',410,451,'Linked bodies share device identities with the cabinet view. Reconcile proposed coordinates after moving either view.\nACC-F2: proposed support centre (432.5, 490). Verify the complete F2 assembly envelope and clearance.\nSee Protective bonding schedule for the separate PE connection requirements.',11,680);
    const peDevices=new Map([pe,fieldPE,m1,auxPE,ps1].map(function(device){return [device.id,device];}));
    function bondingPath(segment){
      return ['start','end'].map(function(end){
        const attachment=segment.attachments[end],device=peDevices.get(attachment.instanceId);
        return device.ref+':'+pin(device,attachment.pinId).number;
      }).join(' → ');
    }
    const bondingPage=developmentSheet('A3','eng0601-a3-bonding','Protective bonding schedule');
    rows(bondingPage,[
      'BONDING DATUM: incoming PE → XPE:0 connection 1; XPE:0/1/2 share the dedicated XPE rail.',
      'XPE:0 connection 2 → dedicated cabinet PE distribution point. Use one conductor per clamp.',
      'PE distribution → ENC1 enclosure stud; use the Rittal designated earthing point and assembly hardware.',
      'Enclosure stud → door M8 earthing point via flexible AX strap. Hinges are not the bonding path.',
      'Enclosure stud → removable mounting plate earthing point via separate AX strap.',
      'PE distribution → metal X1–X5 support rails as required by the assembly bonding design.',
      'Rittal SZ 2564000 (M8, 170 mm, 4 mm²) is a catalog candidate; confirm door travel and duty.',
      'Verify the XPE rail and mounting feet against required fault duty. Do not rely on rail mounting screws as the sole cabinet bond.',
      'Check each strap and conductor size, connection hardware and torque against actual protective duty and instructions.',
      'Verify continuity from incoming PE to each exposed part and record results. Keep N and 0 V separate from PE.',
      'MODELED PE PATHS · See the A2 protective-earth and field motor sheets for rail continuations.',
      'Field: '+bondingPath(fieldEarth)+' (W2 PE); '+bondingPath(motorEarth)+' (W3 PE).',
      'Auxiliary: '+bondingPath(psEarth)+'. Site and assembly bonds above require separate evidence.'
    ]);
    const doorPage=developmentSheet('A3','eng0601-a3-door','Door operator and indication layout');
    const doorSheet=sheets[doorPage].id;
    const doorOrigin={x:80,y:122},doorScale=0.5;
    const enclosureSize=rittalEnclosureDefinition.specifications.dimensions;
    objects.push({id:'eng0601-door-envelope',sheetId:doorSheet,kind:'rect',x:doorOrigin.x,y:doorOrigin.y,x2:doorOrigin.x+enclosureSize.width.value*doorScale,y2:doorOrigin.y+enclosureSize.height.value*doorScale,stroke:'#64748b',fill:'none'});
    text(doorPage,'door-datum',80,110,'1:2 · ENCLOSURE FRONT ENVELOPE · DATUM AT UPPER LEFT',10,330);
    const doorDevices=[
      {device:h1,x:225,y:180,label:'COIL COMMAND',color:'#178743'},
      {device:h2,x:375,y:180,label:'OVERLOAD TRIP',color:'#b91c1c'},
      {device:stop,x:225,y:280,label:'STOP',color:'#b91c1c'},
      {device:start,x:375,y:280,label:'START',color:'#178743'},
      {device:q1,x:300,y:440,label:'MAIN ISOLATOR',color:'#183c50'}
    ];
    doorDevices.forEach(function(item,index){
      const ref=item.device.ref,x=doorOrigin.x+item.x*doorScale,y=doorOrigin.y+item.y*doorScale;
      objects.push({id:'eng0601-door-cutout-'+ref,sheetId:doorSheet,kind:'circle',x:x,y:y,x2:x+22.5*doorScale/2,y2:y,stroke:item.color,fill:'none'});
      text(doorPage,'door-label-'+ref,x-6,y+23,ref,10,32);
      text(doorPage,'door-register-'+ref,420,140+index*30,ref+' '+item.label+' · '+component(item.device.componentId).manufacturerPartNumber+' · ('+item.x+', '+item.y+') mm · Ø22.5 '+(item.device===q1?'central mounting':'recommended finished hole'),12,710);
    });
    text(doorPage,'door-mounting',420,305,'HARMONY XB5: nominal finished tolerance Ø22.3 to Ø22.7 mm.\nSource clearance for screw-clamp mounting: 30 mm horizontal and 40 mm vertical.\nDrawing proposes 150 mm horizontal and 100 mm vertical centre spacing within that group.\nQ1: reserve central handle opening. Verify shaft centre, engagement, travel and exact mounting template.',11,710);
    text(doorPage,'door-interface',420,411,'Check door skin, stiffeners, locks, behind-door depth and harness travel before drilling.\nRoute the flexible door PE bond as shown in the Protective bonding schedule.\nVerify seals and installed enclosure protection after cut-outs. These are project layout coordinates.\nH1 indicates coil command; H2 indicates overload trip. S0 is the ordinary stop.',11,710);
    const entryPage=developmentSheet('A3','eng0601-a3-cable-entry','Cable entry and routing plan');
    const entrySheet=sheets[entryPage].id;
    const entryOrigin={x:80,y:155},entryScale=0.75;
    objects.push({id:'eng0601-entry-envelope',sheetId:entrySheet,kind:'rect',x:entryOrigin.x,y:entryOrigin.y,x2:entryOrigin.x+436*entryScale,y2:entryOrigin.y+221*entryScale,stroke:'#64748b',fill:'none'});
    text(entryPage,'entry-datum',80,130,'AX SIZE 7 ENVELOPE · VIEW FROM INSIDE · REAR AT TOP',10,360);
    const entries=[
      {tag:'W1',x:75,y:68,duty:'Incoming L1/L2/L3/N/PE',candidate:'Select to suit source and upstream protection'},
      {tag:'W2',x:165,y:68,duty:'X2 to Q2 · 3 phases + PE allowance',candidate:'LAPP 1120360 · 4G4 · nominal OD 13.8 mm'},
      {tag:'W4',x:275,y:151,duty:'X5 to B1 · two working cores + PE allowance',candidate:'LAPP 1120307 · 3G1.5 · nominal OD 10.1 mm'},
      {tag:'W5',x:365,y:151,duty:'X5 to Q2:AUX · two working cores',candidate:'Select after separate route and Q2 enclosure checks'}
    ];
    entries.forEach(function(entry,index){
      const x=entryOrigin.x+entry.x*entryScale,y=entryOrigin.y+entry.y*entryScale;
      objects.push({id:'eng0601-entry-zone-'+entry.tag,sheetId:entrySheet,kind:'rect',x:x-18,y:y-12,x2:x+18,y2:y+12,stroke:'#64748b',fill:entry.y<100?'#eef4f8':'#fef3c7'});
      text(entryPage,'entry-tag-'+entry.tag,x-7,y+3,entry.tag,10,30);
      text(entryPage,'entry-route-'+entry.tag,445,132+index*42,entry.tag+' · '+entry.duty+'\n'+entry.candidate,11,700);
    });
    text(entryPage,'entry-enclosure',80,350,'436 × 221 mm replacement plate envelope.\nRectangles indicate route reservations, not membrane locations.\nW3 runs from Q2 to the motor outside ENC1.',10,340);
    text(entryPage,'entry-membrane',445,318,'Rittal SZ 2567.300 candidate: size 7 with 10–15 mm membranes among other ranges.\nCheck the delivered jacket diameters, retention, strain relief and sealing before choosing actual entries.\nLAPP candidates are unshielded. If substituted with shielded cables, document EMC termination separately.',11,700);
    text(entryPage,'entry-bend',445,391,'Keep incoming and motor power routes separate from the field-control route.\nFor fixed routing, allow at least 55.2 mm for the 13.8 mm candidate and 40.4 mm for the 10.1 mm candidate.\nCheck actual cable bend radii and reserve jacket bends before the terminal service spaces.\nPreserve PE continuity through Q2 and to B1. Confirm actual PE terminations at the field equipment.',11,700);
    const assemblyPage=developmentSheet('A3','eng0601-a3-assembly','Assembly and installation review');
    rows(assemblyPage,[
      '1. Check device revisions, W1 site supply and fault data, and the proposed panel and field boundaries.',
      '2. Trial fit ENC1 plate, rail segments, ducts, Q1 shaft and door components with the enclosure de-energised.',
      '3. Check the cabinet back clearance, hinge motion, label visibility and tool access before releasing cut-outs.',
      '4. Prepare cable entries and strain relief, then route power and control separately. Keep service zones clear.',
      '5. Review rail feet, separate bonds and the door strap against the A3 protective bonding schedule.',
      '6. Verify conductor and ferrule fit at Q1, F1, K1, F2, X1–XPE, Q2, B1 and M1 before termination.',
      '7. Use the exact product instructions for torque and strip lengths. Record revision and verified values.',
      '8. Check enclosure heat dissipation, device losses, duty and derating against measured ambient conditions.',
      '9. Confirm ratings after all entries and devices are fitted, then complete the A4 inspection plan.',
      '10. Record departures from the design and update the native project before independent review.'
    ]);
    const f1Loss=10.5*Math.pow(15.2/20,2);
    const selectedLosses=f1Loss+6.3+4.5+8.1+9;
    text(assemblyPage,'thermal-heading',60,390,'ENC1 · Worked heat-load subtotal',14,1060);
    text(assemblyPage,'thermal-screen',60,418,
      'F1: Siemens 10.5 W at 20 A, quadratic dependence. At the candidate 15.2 A: '+f1Loss.toFixed(2)+' W.\n'+
      'K1 allowances: 6.3 W hot at rated current and 4.5 W typical without load current, budgeted separately.\n'+
      'F2 allowance: 8.1 W hot at rated current. PS1 allowance: 9 W typical at rated output.\n'+
      'Selected-device subtotal: '+selectedLosses.toFixed(2)+' W using these mixed operating points.\n'+
      'Add Q1, F3/F4, terminal, conductor and other losses. Apply actual duty and worst-case ambient.\n'+
      'Use the installed enclosure heat-transfer conditions and temperature limits before assessing cooling.',
      11,1060);
    const fieldPage=developmentSheet('A3','eng0601-a3-field-isolator','Field isolator enclosure');
    const fieldBox=part(fieldPage,rittalFieldEnclosureDefinition.id,'ENC2',245,295,0,'Proposed wall-mounted Q2 enclosure. Confirm the environment, four-hole cut-out and protective bonding.');
    fieldBox.properties.location='Field maintenance isolator';
    objects.push(createPanelPlacement(panelProject,q2.id,sheets[fieldPage].id,fieldBox.x,fieldBox.y-28,0.5));
    objects.push(createPanelPlacement(panelProject,fieldPE.id,sheets[fieldPage].id,fieldBox.x,fieldBox.y+43,0.5));
    text(fieldPage,'field-box-fit',440,128,'ENC2 · Rittal AX 1033.000 · 300 × 300 × 210 mm external.\n250 × 275 mm mounting plate, 1.5 mm door and size 1 gland plate.\nQ2 · Siemens 3LD2203-0TK51 · 67 × 83 × 93 mm overall envelope.\nLinked view shows Q2 at the proposed door position. Keep Q2:AUX with the isolator.',12,700);
    text(fieldPage,'field-box-cable',440,236,'Use W2 as the panel feed, W3 as the motor exit and W5 for the Q2 auxiliary contacts.\nXPEF:1 accepts W2 PE at clamp 1 and W3 PE at clamp 2; PE bypasses Q2.\nVerify the XPEF rail connection and provide separate enclosure, plate and flexible door bonds.\nTrial fit the switch, auxiliary block, gland retention, cable bends and access with the door closed.',12,700);
    text(fieldPage,'field-box-review',440,326,'Verify the hole pattern against the delivered Siemens template before drilling.\nVerify actuator travel, OFF locking and auxiliary timing before commissioning.\nIP66 is the bare enclosure rating. Verify the installed unit for the actual site.',12,700);
    const q2Cutout={x:245,y:475,pitch:48,mountingDiameter:5,centreWidth:10};
    function cutoutCircle(id,x,y,diameter){
      objects.push({id:'eng0601-q2-cutout-'+id,sheetId:sheets[fieldPage].id,kind:'circle',x:x,y:y,x2:x+diameter/2,y2:y,stroke:'#183c50',fill:'none'});
    }
    [-1,1].forEach(function(column){
      [-1,1].forEach(function(row){
        cutoutCircle(column+'-'+row,q2Cutout.x+column*q2Cutout.pitch/2,q2Cutout.y+row*q2Cutout.pitch/2,q2Cutout.mountingDiameter);
      });
    });
    cutoutCircle('centre',q2Cutout.x,q2Cutout.y,q2Cutout.centreWidth);
    text(fieldPage,'q2-cutout-label',440,425,'Q2 MOUNTING DETAIL · 1:1 · Siemens 3LD2203-0TK51\n4 × Ø5 mm at 48 × 48 mm centres. Centre opening 10 mm wide.\nOrigin: centre opening. Mounting holes at x ±24 and y ±24 mm.\nEnlarged detail. Transfer the pattern to the approved door datum before fabrication.',12,700);
    const a4Start=sheets.length;
    // Native editable A4 snapshots generated from this same project's canonical objects.
    function a4Sheet(title){const index=sheets.length;const sheet={id:'eng0601-a4-'+(index-a4Start),sectionId:'A4',name:title,number:'A4/'+String(index).padStart(3,'0'),metadata:{revision:'P01',issueStatus:'Development snapshot — not approved'}};sheets.push(sheet);text(index,'heading-'+index,60,65,'ENG-0601 | '+title,22);return index;}
    const bom=billOfMaterials(objects);
    if(!bom.valid)throw new Error('Cannot author A4 material report: '+bom.errors.join(' '));
    for(let offset=0;offset<bom.rows.length;offset+=10){const page=a4Sheet('Equipment and material register '+(1+offset/10));
      text(page,'bom-scope-'+page,60,105,'Canonical device quantities; development selection, not an approved procurement list.',12);
      bom.rows.slice(offset,offset+10).forEach(function(row,i){text(page,'bom-'+row.componentId,60,140+i*38,row.quantity+' × '+row.manufacturer+' · '+row.partNumber+' | '+row.references.join(', ')+'\n'+row.description,11,1060);});
      text(page,'bom-note-'+page,60,545,'Editable snapshot. After changes, regenerate/compare using the existing bill-of-materials report.\nManufacturer source URLs and verified specifications remain on the native component records.',10,1060);
    }
    const terminals=objects.filter(function(o){return o.kind==='component-instance'&&/^X/.test(o.ref);});
    for(let offset=0;offset<terminals.length;offset+=6){const page=a4Sheet('Terminal connection register '+(1+offset/6));
      text(page,'terminal-scope-'+page,60,105,'Exact model terminal identities and authored conductor labels. Unwired ports remain explicit.',12);
      terminals.slice(offset,offset+6).forEach(function(device,i){const definition=component(device.componentId),sheet=sheets.find(function(sheet){return sheet.id===device.sheetId;});const lines=definition.symbol.pins.map(function(pin){const connected=objects.filter(function(w){return w.kind==='wire'&&Object.values(w.attachments||{}).some(function(a){return a.instanceId===device.id&&a.pinId===pin.id;});});return pin.localNumber+': '+(connected.length?connected.map(function(w){return w.conductorId||w.id;}).join(', '):'UNWIRED');});text(page,'terminal-register-'+device.id,60,145+i*62,device.ref+' · '+definition.manufacturerPartNumber+' · '+sheet.number+'\n'+lines.join(' | '),11,1060);});
      text(page,'terminal-note-'+page,60,545,'Editable snapshot: compare after rewiring. Cross-sheet destinations are listed on A2/018.\nMounting-foot RAIL is not a conductor clamp; cable sizes, lengths and installation checks remain unresolved.',10,1060);
    }
    const checks=a4Sheet('Inspection and commissioning plan');rows(checks,[
      'STATUS: NOT PERFORMED. This is a review plan, not a test certificate or permission to energise.',
      'Before testing: approve the design basis, cable calculations, protection coordination and fault level.',
      'Verify equipment against actual nameplates and the approved bill of materials; record substitutions.',
      'Inspect assembly, conductor identification, terminal assignments, separation, clearances and enclosure entries.',
      'Verify protective bonding and continuity with an appropriate method; record instrument and measured results.',
      'Plan insulation and protective-device tests for the actual installation and connected electronic equipment.',
      'Confirm F2 setting against the motor nameplate, starting duty and manufacturer instructions.',
      'Under an authorised procedure: verify stop, pressure permissive, overload trip and indication behaviour.',
      'With S1 released, verify K1 stays off after power or permissive restoration until a new start command.',
      'INSTALLATION HOLD: held or welded S1 can re-command K1. Resolve this before using the design on equipment.',
      'Verify Q2 isolation and sources. At 23/24 verify opening before and closing after the main poles.',
      'Record test method, acceptance criterion, actual value, date, instrument, tester and independent review.',
      'No measured result, signature, successful test or installation approval is implied by this document.'
    ]);
    const feederMotor=component(m1.componentId).specifications,feederBreaker=component(f1.componentId).specifications;
    const nominalVoltage=400,motorCurrent=feederMotor.ratedLineCurrentAt400V50Hz.value;
    const feederReview=a4Sheet('Motor feeder acceptance worksheet');rows(feederReview,[
      'PATH: supply → Q1 → X1 → F1 → K1 → F2 → X2 → Q2 → M1. Auxiliary F3 branches after Q1.',
      'DESIGN BASIS: '+nominalVoltage+' V three-phase; M1 '+motorCurrent+' A candidate. F2 '+f2.properties.overloadSettingA+' A proposal; confirm duty and nameplate.',
      'F1 data at '+nominalVoltage+' V: '+feederBreaker.icuAt400V.value+' kA Icu / '+feederBreaker.icsAt400V.value+' kA Ics. Individual breaker ratings are separate from starter coordination.',
      'Supply inputs: maximum prospective fault current ___ kA; minimum earth fault current ___ A; method/date ___.',
      'Upstream device and settings ___; maximum fault duty at Q1, F1 and auxiliary branch ___; evidence ___.',
      'Compare maximum duty with exact switchgear and Siemens combination conditions, including upstream limits.',
      'Record W1–W3 routes, lengths, core sizes, installation methods, grouping and ambient temperature.',
      'Verify effective ampacity, start/run voltage drop, minimum-fault disconnection and conductor thermal withstand.',
      'Check F2 setting, start duration and overload class; verify selectivity and auxiliary branch protection.',
      'Confirm supply and neutral switching requirements for Q1. Confirm PE continuity using the A3 bond schedule.',
      'REVIEW: pending site inputs and independent review. Record evidence, reviewer and acceptance date ___.',
    ]);
    const cableEndpoints=new Map();
    const devicesById=new Map(objects.filter(function(o){return o.kind==='component-instance';}).map(function(o){return [o.id,o];}));
    objects.filter(function(o){return o.kind==='wire'&&o.cable;}).forEach(function(wire){
      const tag=wire.cable.tag,core=wire.cable.core;
      if(!cableEndpoints.has(tag))cableEndpoints.set(tag,new Map());
      const cable=cableEndpoints.get(tag);
      if(!cable.has(core))cable.set(core,[]);
      Object.values(wire.attachments||{}).forEach(function(binding){
        const device=devicesById.get(binding.instanceId);
        const terminal=worldPins(device).find(function(pin){return pin.id===binding.pinId;});
        cable.get(core).push(device.ref+':'+terminal.number);
      });
    });
    const incomingLinePins=worldPins(q1).filter(function(pin){return /^line-(l[1-3]|n)$/.test(pin.id);});
    const incomingEarthPin=worldPins(incomingPE).find(function(pin){return pin.id==='connection-1';});
    const w1Terminals=incomingLinePins.map(function(pin){return q1.ref+':'+pin.number;});
    w1Terminals.push(incomingPE.ref+':'+incomingEarthPin.number+' (PE)');
    text(feederReview,'feeder-core-heading',60,400,'W1 SITE TERMINALS AND FIELD WORKING CORES · editable snapshot',11,1060);
    text(feederReview,'feeder-cable-W1',60,424,'W1 | Site supply → '+w1Terminals.join('   /   ')+' | Confirm cable and core identification on site.',11,1060);
    Array.from(cableEndpoints).sort(function(a,b){return a[0].localeCompare(b[0]);}).forEach(function(entry,index){
      const [tag,cores]=entry;
      const labels=Array.from(cores,function(core){return core[0]+' '+core[1].join(' → ');});
      text(feederReview,'feeder-cable-'+tag,60,447+index*23,tag+' | '+labels.join('   /   '),11,1060);
    });
    const dropPage=a4Sheet('Motor feeder voltage-drop study');
    const startRatio=7.8;
    const startingCurrent=motorCurrent*startRatio;
    const nominalPickup=feederBreaker.instantaneousShortCircuitRelease.value;
    const conductorTemperature=70,copperCoefficient=0.00393,resistanceAt20=4.95,reactance=0.08;
    const hotResistance=resistanceAt20*(1+copperCoefficient*(conductorTemperature-20));
    const runPowerFactor=feederMotor.powerFactor.value,startPowerFactor=0.35;
    function feederDrop(current,powerFactor,lengthM){
      return Math.sqrt(3)*current*lengthM/1000*(hotResistance*powerFactor+reactance*Math.sqrt(1-powerFactor*powerFactor));
    }
    rows(dropPage,[
      'WORKED STUDY · W2 + W3 only. Candidate LAPP 1120360, 4G4 bare copper Class 5. No measured route is assumed.',
      'SEW 400 V candidate data: Iₙ '+motorCurrent+' A, running power factor '+runPowerFactor+', Iₐ/Iₙ '+startRatio+' → starting current '+startingCurrent.toFixed(2)+' A.',
      'Illustrative inputs: conductor '+conductorTemperature+' °C; starting power factor '+startPowerFactor+'; reactance '+reactance+' Ω/km.',
      'Use '+resistanceAt20+' Ω/km at 20 °C and α = '+copperCoefficient+' /°C → '+hotResistance.toFixed(3)+' Ω/km at '+conductorTemperature+' °C.',
      'ΔU = √3 × I × L × (R cosφ + X sinφ). L is combined one-way W2 + W3 length in km.',
      ...[20,40,60].map(function(length){
        const run=feederDrop(motorCurrent,runPowerFactor,length),start=feederDrop(startingCurrent,startPowerFactor,length);
        return length+' m scenario: run '+run.toFixed(2)+' V ('+(run/nominalVoltage*100).toFixed(2)+'%); start '+start.toFixed(2)+' V ('+(start/nominalVoltage*100).toFixed(2)+'%).';
      }),
      'The study excludes W1, upstream impedance, switchgear and joints. Starting current is an estimate at nameplate voltage.',
      'F1 nominal instantaneous pickup: '+nominalPickup+' A (Siemens data). Estimated M1 starting current is '+(startingCurrent/nominalPickup*100).toFixed(1)+'% of nominal pickup.',
      'Obtain the F1 trip band and actual motor starting current trace. Check inrush, start duration and minimum fault current.',
      'Replace all scenario inputs with verified values. Check minimum motor voltage and acceleration time under actual load.',
      'Use the feeder acceptance worksheet for separate ampacity, disconnection, fault-duty and thermal checks.'
    ]);
    const handover=a4Sheet('Handover and unresolved design register');rows(handover,[
      'EDUCATIONAL APP EXAMPLE · Engineering development, not approved for installation.',
      'Deliverable: one native editable project; A1 basis, A2 circuits, A3 enclosure basis and A4 report snapshots.',
      'W1 supply terminals and W2–W5 working cores are mapped. See the feeder worksheet for cable design inputs.',
      'Supply assumptions: Germany, 400/230 V TN-S, indoor 25 °C; confirm actual site conditions.',
      'Outstanding: prospective fault current, upstream protection and complete source-isolation verification.',
      'Outstanding: cable installation methods, grouping, voltage drop, protective conductor and fault checks.',
      'Outstanding: verify proposed rails, service zones and bond hardware. Complete duct design and enclosure thermal checks.',
      'Outstanding: motor/pump selection, pressure thresholds and machinery risk review of held or welded S1 restart.',
      'Outstanding: verify mounting and terminal-strip fit, cable entry and field installation details on the actual build.',
      'For a future installation, obtain independent engineering review, inspection, commissioning and owner approval.',
      'Keep manufacturer records distinct from editable design assumptions; approve replacements separately.',
      'After edits, run Electrical checks and compare the cable core export with the A4 report snapshots.',
      'Save a named local copy, reopen it, and confirm sheets, component identities and cross-sheet links.'
    ]);
    text(handover,'handover-practice-heading',60,455,'EDITOR PRACTICE · Use a separate copy of the example',14,1060);
    text(handover,'handover-practice',60,482,
      '1. Follow the 24 V path from F4 through S0, Q2:AUX, F2 and B1 to the S1 start and K1 hold paths.\n'+
      '2. Find Q1 and Q2 on the drawings. Explain why a stop command and the H1 lamp do not prove isolation.\n'+
      '3. In the copy, recolor a wire. Check that its terminal assignments are unchanged, then save and reopen.\n'+
      '4. Review Electrical checks and export the terminal register to compare the saved circuit with the A4 snapshot.',
      11,1060);
    const evidencePage=a4Sheet('Future installation evidence');
    text(evidencePage,'release-evidence-scope',60,105,'This example has no physical installation. Use these fields only if adapting the design for a real site.',12,1060);
    [
      ['01 Supply and protection','Supply, earthing, maximum and minimum fault duty, upstream settings and coordination.',[feederReview]],
      ['02 Feeder calculations','Actual W1–W3 lengths and installation. Ampacity, start/run drop, disconnection and withstand.',[feederReview,dropPage]],
      ['03 Rail and enclosure fit','Delivered rail, terminals, covers and fasteners. Service clearances, door travel and entries.',[railPage,doorPage,entryPage,fieldPage]],
      ['04 Protective bonding','Record cabinet, door, support rail and field PE paths. Link measured continuity and fault-duty review.',[17,bondingPage]],
      ['05 Assembly and thermal review','Record enclosure thermal assessment, final settings, torque checks and installed protection.',[assemblyPage]],
      ['06 Functional commissioning','Record authorised start, stop, pressure, overload, local isolation and restoration tests.',[checks]],
      ['07 As-built documentation','Reconcile revisions, native connections, terminal/cable schedules and installed equipment.',[2,handover]],
      ['08 Independent review and owner release','Record reviewer, owner, signed approval reference and any outstanding conditions.',[checks,handover]]
    ].forEach(function(entry,index){
      const y=140+index*49;
      text(evidencePage,'release-evidence-task-'+index,60,y,entry.slice(0,2).join(' · '),11,1060);
      text(evidencePage,'release-evidence-record-'+index,60,y+18,'Future site record / result: ___   |   Responsible person: ___   |   Date: ___',11,1060);
      text(evidencePage,'release-evidence-sheets-'+index,60,y+33,'Reference sheets: '+entry[2].map(function(page){return sheets[page].number;}).join(' · '),10,1060);
    });
    const cableSchedule=a4Sheet('Cable routes and identification schedule');
    text(cableSchedule,'cable-schedule-basis',60,105,'Example assignments from the native project. Route lengths and installation methods are unspecified.',12,1060);
    [
      ['W1','Incoming supply to panel','Select the supply cable for the eventual site. Identify N blue and PE green/yellow where applicable.'],
      ['W2','Panel X2/XPE to field isolator ENC2','LAPP 1120360 candidate, 4G4 unshielded. Numbered cores 1–3 carry phases. Green/yellow is PE.'],
      ['W3','Field isolator ENC2 to pump motor','LAPP 1120360 candidate, 4G4 unshielded. Numbered cores 1–3 carry phases. Green/yellow is PE.'],
      ['W4','Panel X5 to B1 pressure switch','LAPP 1120307 candidate, 3G1.5 unshielded. The protective core termination requires review.'],
      ['W5','Panel X5 to Q2 auxiliary','Two working cores carry the auxiliary-contact loop. Select the cable and shield treatment for the route.']
    ].forEach(function(entry,index){
      const [tag,route,basis]=entry,y=143+index*82;
      const coreLabels=tag==='W1'?w1Terminals.join(' / '):Array.from(cableEndpoints.get(tag),function(core){return core[0]+' '+core[1].join(' → ');}).join('   /   ');
      text(cableSchedule,'cable-schedule-heading-'+tag,60,y,tag+' · '+route,13,1060);
      text(cableSchedule,'cable-schedule-cores-'+tag,60,y+19,coreLabels+'\n'+basis,11,1060);
    });
    text(cableSchedule,'cable-schedule-update',60,545,'Check A3 cable entry and the A4 voltage-drop study. Re-export the cable core register after rewiring.',10,1060);
    // The contents list refers only to real sheets; unfinished scope belongs in the release register.
    const dependencies=new Map(sheets.map(function(sheet){return [sheet.id,new Set()];}));
    const sheetNumbers=new Map(sheets.map(function(sheet){return [sheet.id,sheet.number];}));
    powerLinks.forEach(function(link){
      const linkedSheets=new Set(link.endpoints.map(function(endpoint){return endpoint.sheetId;}));
      linkedSheets.forEach(function(from){
        linkedSheets.forEach(function(to){
          if(from!==to)dependencies.get(from).add(sheetNumbers.get(to).split('/')[1]);
        });
      });
    });
    const registerRows=Math.ceil(sheets.length/2);
    sheets.forEach(function(sheet,index){
      const linked=Array.from(dependencies.get(sheet.id)).sort();
      const entry=sheet.number+' · '+sheet.metadata.revision+' · '+sheet.name+(linked.length?' ↔ '+linked.join(', '):'');
      text(2,'register-'+index,index<registerRows?60:620,120+(index%registerRows)*20,entry,10,510);
    });
    return parseProject(serializeProject({project:name||'ENG-0601 — Direct-on-line pump starter',projectId:'eng0601-local-manual',sections:sections,activeSection:'A1',activeSheet:null,openSheetIds:[],sheets:sheets,objects:objects,crossSheetConnections:powerLinks,metadata:{jobNumber:'ENG-0601',drawnBy:'Codex',drawingDate:'2026-11-15',issueStatus:'Engineering development — not approved'},example:{id:'eng0601',description:'Native A1–A4 pump-starter project with connected circuit sheets, terminal rail mounting, protective bonding and feeder acceptance documentation. Final assembly depends on site inputs and verification.'}})).project;
  }
  function projectExamples() {
    return [{id:'eng0601',name:'ENG-0601 · Pump starter example',description:'Editable A1–A4 educational project with a connected motor feeder and controls, cabinet and terminal layouts, and engineering reports. Physical installation requires separate site design and verification.'},
      {id:'indicator',name:'Indicator circuit',description:'Terminal → fuse → contact → lamp → return terminal. Generic schematic; no supply rating or simulation.'},
      {id:'relay',name:'Relay control circuit',description:'Terminal → fuse → contact → relay coil → return terminal. Generic schematic; no protection sizing or simulation.'},
      {id:'hardware-plc-input',hardware:true,name:'PLC digital input bench',description:'Siemens CPU 1212C DC/DC/DC with Schneider NO pushbutton, 24 V supply/return and functional-earth boundaries. No PLC program or simulation; protection, bonding and unused channels require engineering.'},
      {id:'hardware-plc-io',hardware:true,name:'PLC input and output indication',description:'Editable Siemens PLC input and indicator output wiring with separate supply boundary terminals, signal documentation and a wiring review note.'},
      {id:'hardware-relay',hardware:true,name:'24 V momentary relay control',description:'Phoenix Contact relay and terminals with Schneider start/stop buttons. External supply/load boundaries; no seal-in or safety function.'},
      {id:'hardware-sensor',hardware:true,name:'PNP proximity sensor terminal wiring',description:'ifm IFS204 pin 1 supply, pin 3 return and pin 4 output with Phoenix Contact terminals. External supply/PLC boundaries.'},
      {id:'hardware-sitop',hardware:true,name:'SITOP 24 V terminal distribution',description:'Siemens PSU100C output distribution through Phoenix Contact terminals. Input supply, bonding and protection require engineering.'}];
  }
  function createHardwareExample(example, name) {
    const sheetId='example-'+example.id,objects=[],byRef={};
    function device(id,ref,x,y,comment){const instance=createInstance(id,x,y,ref);instance.sheetId=sheetId;instance.properties.comment=comment||'';objects.push(instance);byRef[ref]=instance;return instance;}
    function connect(from,pinA,to,pinB){const a=byRef[from],b=byRef[to],ap=worldPins(a).find(function(p){return p.id===pinA;}),bp=worldPins(b).find(function(p){return p.id===pinB;});if(!ap||!bp)throw new Error('Example references an unknown terminal.');objects.push(attachWire({id:'wire-'+example.id+'-'+objects.length,kind:'wire',sheetId:sheetId,x:ap.x,y:ap.y,x1:ap.x,y1:ap.y,x2:bp.x,y2:bp.y,rotation:0,stroke:'#164eac'},Object.assign({},ap,{attachment:{instanceId:a.id,pinId:ap.id}}),Object.assign({},bp,{attachment:{instanceId:b.id,pinId:bp.id}})));}
    const ut='phoenix-contact-3044076',uk='phoenix-contact-3004362';
    if(example.id==='hardware-plc-input'||example.id==='hardware-plc-io'){
      device(ut,'X1',160,204,'External protected 24 V DC supply. Source selection and protection remain project-specific.');
      device(ut,'X2',400,222,'External DC return shared by CPU supply M and input common 1M.');
      device(ut,'X3',500,240,'Functional-earth interface to engineered cabinet bonding; this feed-through terminal is not a PE rail-bonding terminal.');
      device('schneider-electric-xb5aa31','S1',350,312,'NO momentary contact to CPU X10:7 (DI a.0); PLC address/program configuration is not simulated.');
      device('siemens-6es7212-1ae40-0xb0','A1',750,330,'Sinking input with 1M on DC return. Sensor supply, outputs and unused analog inputs require separate project engineering; see manufacturer wiring notes.');
      byRef.A1.plcIo={'x10-7':{signal:'Start pushbutton',address:''}};
      connect('X1','connection-2','A1','x10-1');connect('X2','connection-2','A1','x10-2');connect('X3','connection-2','A1','x10-3');
      connect('X1','connection-1','S1','contact-13');connect('S1','contact-14','A1','x10-7');connect('A1','x10-6','X2','connection-1');
      if(example.id==='hardware-plc-io'){
        device(ut,'X4',975,244,'External protected positive supply boundary for the transistor output group.');
        device(ut,'X5',1110,274,'Output group DC return and pilot-light return. Check the common reference in the final supply design.');
        device('schneider-electric-xb5avb3','H1',1010,354,'Indicator load for the documented output request. Check compatibility and output loading before implementation.');
        byRef.A1.plcIo['x12-3']={signal:'Indicator request',address:''};
        connect('A1','x12-1','X4','connection-1');connect('A1','x12-2','X5','connection-1');
        connect('A1','x12-3','H1','terminal-x1');connect('H1','terminal-x2','X5','connection-2');
        objects.push({id:'plc-io-sequence',kind:'text',sheetId,x:100,y:510,fontSize:14,textWidth:850,rotation:0,stroke:'#164eac',
          text:'Review sequence: S1 is an input request. H1 is commanded by the documented output. Assign the program and confirm supply references, output loading and spare pins before applying power.',
          automationNote:{kind:'sequence',deviceIds:[byRef.S1.id,byRef.A1.id,byRef.H1.id]}});
      }
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

  function wireRoute(wire) {
    const start={x:wire.x1,y:wire.y1},end={x:wire.x2,y:wire.y2},route=wire.route;
    if(wire.waypoints!==undefined){
      if(route!==undefined||!Array.isArray(wire.waypoints)||!wire.waypoints.length||!wire.waypoints.every(function(p){return p&&finite(p.x)&&finite(p.y);}))throw new Error('Manual wire routes require finite bend coordinates and cannot also use a route lane.');
      return [start,...wire.waypoints.map(function(p){return {x:p.x,y:p.y};}),end];
    }
    if(route!==undefined&&(!route||!['x','y'].includes(route.axis)||!finite(route.coordinate)))throw new Error('Wire route requires an x/y axis and finite coordinate.');
    if(!route)return [start,{x:end.x,y:start.y},end];
    return route.axis==='y'?[start,{x:start.x,y:route.coordinate},{x:end.x,y:route.coordinate},end]:[start,{x:route.coordinate,y:start.y},{x:route.coordinate,y:end.y},end];
  }
  function floorRiserLength(source,target){
    if(!source?.floorPlan||!target?.floorPlan||source.id===target.id||source.floorPlan.building!==target.floorPlan.building)return null;
    const a=source.floorPlan.elevationMm,b=target.floorPlan.elevationMm;
    const length=Math.abs(b-a);
    return finite(a)&&finite(b)&&finite(length)&&length>0?length:null;
  }
  function svgLabel(x,y,value,width){
    const escaped=String(value).replace(/[&<>]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[char]));
    const sizing=width&&String(value).length*14>width?` textLength="${width}" lengthAdjust="spacingAndGlyphs"`:'';
    return `<text x="${x}" y="${y}" stroke="none"${sizing}>${escaped}</text>`;
  }
  function floorRiserElevationSvg(project,routeId){
    const route=project.objects.find(item=>item.id===routeId&&item.floorRouteKind);
    const source=project.sheets.find(sheet=>sheet.id===route?.sheetId);
    const target=project.sheets.find(sheet=>sheet.id===route?.riserTargetSheetId);
    const length=floorRiserLength(source,target);
    if(length===null)throw new Error('Select a floor route with a linked riser.');
    const escape=value=>String(value).replace(/[&<>]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[char]));
    const text=svgLabel;
    const levels=[source,target].sort((a,b)=>b.floorPlan.elevationMm-a.floorPlan.elevationMm);
    const ordinates=[120,310];
    const datums=levels.map((sheet,index)=>{
      const y=ordinates[index];
      const end=sheet===source?'From':'To';
      return text(36,y-28,`${end} · ${sheet.number} · ${sheet.floorPlan.level}`)
        +text(36,y-9,`Elevation ${sheet.floorPlan.elevationMm} mm`)
        +`<path d="M36 ${y} H700" stroke="#64748b"/><circle cx="540" cy="${y}" r="5" fill="#1855a4"/>`;
    }).join('');
    const title=`${source.floorPlan.building} · ${route.floorRouteKind} riser elevation`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="297mm" height="210mm" viewBox="0 0 840 594"><title>${escape(title)}</title><rect width="840" height="594" fill="white"/><g font-family="sans-serif" font-size="15" fill="#19283c">${text(36,43,title)}${datums}<path d="M540 120 V310" stroke="#1855a4" stroke-width="4"/><path d="M568 120 H588 M578 120 V310 M568 310 H588" fill="none" stroke="#19283c"/>${text(590,220,`${length} mm`)}${text(36,360,'Floor datum to floor datum · diagram not to scale')}</g></svg>`;
  }
  function buildingRiserDiagramSvg(project,sheetId){
    const building=project.sheets.find(sheet=>sheet.id===sheetId)?.floorPlan?.building;
    if(!building)throw new Error('Open a building floor plan to export its riser diagram.');
    const floors=project.sheets.filter(sheet=>sheet.floorPlan?.building===building&&finite(sheet.floorPlan.elevationMm))
      .sort((a,b)=>b.floorPlan.elevationMm-a.floorPlan.elevationMm);
    const floorById=new Map(floors.map(floor=>[floor.id,floor]));
    const risers=[];
    for(const route of project.objects){
      if(!route.floorRouteKind)continue;
      const source=floorById.get(route.sheetId),target=floorById.get(route.riserTargetSheetId);
      const length=floorRiserLength(source,target);
      if(length!==null)risers.push({route,source,target,length});
    }
    if(!risers.length)throw new Error('This building has no linked risers to export.');
    const datums=new Map();
    for(const floor of floors){
      const elevation=floor.floorPlan.elevationMm;
      if(!datums.has(elevation))datums.set(elevation,[]);
      datums.get(elevation).push(floor);
    }
    const columnStart=780,columnWidth=460,width=Math.max(1120,columnStart+columnWidth*risers.length);
    const ordinate=new Map();
    let y=204;
    const levels=Array.from(datums,([elevation,sheets])=>{
      const base=y;
      ordinate.set(elevation,base);
      y+=Math.max(108,36+sheets.length*20);
      return `<path d="M32 ${base} H${width-32}" stroke="#64748b"/>`
        +svgLabel(36,base-9,`Elevation ${elevation} mm`)
        +sheets.map((sheet,index)=>svgLabel(36,base+22+index*20,`${sheet.number} · ${sheet.floorPlan.level}`,columnStart-65)).join('');
    }).join('');
    const routes=risers.map(({route,source,target,length},index)=>{
      const x=columnStart+index*columnWidth,axis=x+60;
      const from=ordinate.get(source.floorPlan.elevationMm),to=ordinate.get(target.floorPlan.elevationMm);
      return svgLabel(x,108,`R${index+1} · ${route.floorRouteTag||route.floorRouteKind}`,columnWidth-32)
        +svgLabel(x,131,`${source.number} → ${target.number} · ${route.floorRouteKind}`)
        +svgLabel(x,154,`${Number(length.toPrecision(12))} mm vertical`)
        +`<path d="M${axis} ${from} V${to}" stroke="#1855a4" stroke-width="3"/><circle cx="${axis}" cy="${from}" r="5" fill="white" stroke="#1855a4" stroke-width="2"/><circle cx="${axis}" cy="${to}" r="5" fill="#1855a4"/>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${y}" viewBox="0 0 ${width} ${y}"><title>Building riser diagram</title><rect width="${width}" height="${y}" fill="white"/><g font-family="sans-serif" font-size="15" fill="#19283c">${svgLabel(36,38,building+' · Building riser diagram')}${svgLabel(36,66,'Open end = source floor · Filled end = target floor · Elevations arranged schematically')}${levels}${routes}</g></svg>`;
  }
  function validFloorRoutePoints(points){
    return Array.isArray(points)&&points.length>=2&&points.every(function(point,index){
      return point&&finite(point.x)&&finite(point.y)&&(!index||Math.hypot(point.x-points[index-1].x,point.y-points[index-1].y)>0);
    })&&finite(floorRouteLength({points}));
  }
  function floorZonePolygonArea(points){
    if(!Array.isArray(points)||points.length<3||points.length>1000||!validFloorRoutePoints(points))return null;
    if(new Set(points.map(point=>JSON.stringify([point.x,point.y]))).size!==points.length)return null;
    const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
    const intersects=(a,b,c,d)=>{
      if(Math.max(a.x,b.x)<Math.min(c.x,d.x)||Math.max(c.x,d.x)<Math.min(a.x,b.x)||
        Math.max(a.y,b.y)<Math.min(c.y,d.y)||Math.max(c.y,d.y)<Math.min(a.y,b.y))return false;
      const spans=(p,q,r,s)=>Math.sign(cross(p,q,r))*Math.sign(cross(p,q,s))<=0;
      return spans(a,b,c,d)&&spans(c,d,a,b);
    };
    let twiceArea=0;
    for(let i=0;i<points.length;i++){
      const a=points[i],b=points[(i+1)%points.length];
      twiceArea+=cross(points[0],a,b);
      for(let j=i+2;j<points.length;j++){
        if(i===0&&j===points.length-1)continue;
        if(intersects(a,b,points[j],points[(j+1)%points.length]))return null;
      }
    }
    const area=Math.abs(twiceArea)/2;
    return finite(area)&&area>0?area:null;
  }
  function floorRouteLength(route){
    return route.points.slice(1).reduce((sum,point,index)=>sum+Math.hypot(point.x-route.points[index].x,point.y-route.points[index].y),0);
  }
  function wireRouteLength(wire){const points=wireRoute(wire);return points.slice(1).reduce(function(sum,p,i){return sum+Math.hypot(p.x-points[i].x,p.y-points[i].y);},0);}
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
      let points;try{points=wireRoute(object);}catch(error){errors.push({code:'invalid-route',objectId:object.id,message:error.message});return;}
      const end = { x: object.x2, y: object.y2 };
      const segments = points.slice(1).map(function(point,i){return [points[i],point];})
        .filter(function (pair) { return Math.abs(pair[0].x - pair[1].x) > EPSILON || Math.abs(pair[0].y - pair[1].y) > EPSILON; })
        .map(function (pair) { return { a: pair[0], b: pair[1] }; });
      if (!segments.length) {
        errors.push({ code: 'zero-length-wire', objectId: object.id || null, message: 'A wire has zero length.' });
        return;
      }
      wires.push({ id: object.id || 'wire-' + (index + 1), points: points, start: start, end: end, segments: segments, attachments: object.attachments, continuationEnds: (Array.isArray(object.continuationEnds)?object.continuationEnds:[]).concat(Array.isArray(object.detachedEnds)?object.detachedEnds:[]) });
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

    const pinNodesByInstance=new Map();
    for(const pin of pins){
      if(!pinNodesByInstance.has(pin.instanceId))pinNodesByInstance.set(pin.instanceId,new Map());
      pinNodesByInstance.get(pin.instanceId).set(pin.pinId,pin.node);
    }
    validInstances.forEach(function (instance) {
      const def = component(instance.componentId);
      const byId=pinNodesByInstance.get(instance.id);
      if(!byId)return;
      def.symbol.internalConnections.forEach(function ([first,...rest]) {
        if(byId.has(first))for(const id of rest)if(byId.has(id))join(byId.get(first),byId.get(id));
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
    const references=new Map(),referenceIssues=[];
    const sheetLabels=new Map(reports.map(function(sheet){return [sheet.id,sheet.number||sheet.name];}));
    objects.filter(function(object){return object.kind==='component-instance';}).forEach(function(device){
      const key=device.ref.trim().toUpperCase();
      if(!references.has(key))references.set(key,[]);
      references.get(key).push(device);
    });
    references.forEach(function(devices,key){
      if(devices.length<2)return;
      const locations=devices.map(function(device){return sheetLabels.get(device.sheetId)||'Main sheet';});
      referenceIssues.push('Duplicate device reference '+key+' ('+locations.join(', ')+').');
    });
    return {
      valid: unresolvedContinuations.length===0&&cableIssues.length===0&&referenceIssues.length===0,
      errors: unresolvedContinuations.map(function(issue){return issue.message;}).concat(cableIssues,referenceIssues),
      cableIssues: cableIssues,
      referenceIssues: referenceIssues,
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
      scope: 'Paired cross-sheet connectors join validated sheet-local endpoints; only unmatched ends count as open in the project.'
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
        bendX: wireRoute(wire)[1].x,
        routePoints: wireRoute(wire),
        routePath: wireRoute(wire).map(function(p){return p.x+':'+p.y;}).join(' → '),
        endX: wire.x2,
        endY: wire.y2,
        lengthMm: Number(wireRouteLength(wire).toFixed(6)),
        startPinRefs: refsAt(wire.x1, wire.y1),
        endPinRefs: refsAt(wire.x2, wire.y2),
        netPinRefs: netPins
      };
    }).sort(function (a, b) { return a.wireId.localeCompare(b.wireId); });
    return { valid: true, errors: [], rows: rows };
  }

  function cableCoreRegister(project) {
    const sheets = new Map(project.sheets.map(function(sheet) { return [sheet.id, sheet.number || sheet.name]; }));
    const devices = new Map(project.objects.filter(function(o) { return o.kind === 'component-instance'; }).map(function(o) {
      return [o.id, {ref:o.ref, pins:new Map(worldPins(o).map(function(pin) { return [pin.id, pin.number]; }))}];
    }));
    const links = new Map();
    (project.crossSheetConnections || []).forEach(function(link) {
      link.endpoints.forEach(function(endpoint) { links.set(endpoint.wireId, (links.get(endpoint.wireId) || []).concat(link.id)); });
    });
    return project.objects.filter(function(o) { return o.kind === 'wire' && o.cable; }).map(function(wire) {
      function terminal(end) {
        const binding = (wire.attachments || {})[end];
        if (!binding) return (wire.continuationEnds || []).includes(end) ? 'Continuation' : 'No terminal attachment';
        const device = devices.get(binding.instanceId);
        return device && device.pins.has(binding.pinId) ? device.ref + ':' + device.pins.get(binding.pinId) : 'Unresolved terminal';
      }
      return {tag:wire.cable.tag, core:wire.cable.core, sheet:sheets.get(wire.sheetId), wireId:wire.id,
        start:terminal('start'), end:terminal('end'), links:links.get(wire.id) || []};
    }).sort(function(a,b) { return a.tag.localeCompare(b.tag) || a.core.localeCompare(b.core) || a.wireId.localeCompare(b.wireId); });
  }

  function reportCsv(columns, rows) {
    function cell(value) {
      let text = Array.isArray(value) ? value.join('; ') : String(value == null ? '' : value);
      if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
      return '"' + text.replace(/"/g, '""') + '"';
    }
    const lines = [columns.map(function(column) { return cell(column[0]); }).join(',')];
    rows.forEach(function(row) {
      lines.push(columns.map(function(column) { return cell(row[column[1]]); }).join(','));
    });
    return '\uFEFF' + lines.join('\r\n') + '\r\n';
  }
  function plcIoRegisterCsv(project){
    const instances=new Map(project.objects.filter(item=>item.kind==='component-instance').map(item=>[item.id,item]));
    const links=new Map();
    for(const wire of project.objects.filter(item=>item.kind==='wire')){
      for(const [end,attachment] of Object.entries(wire.attachments??{})){
        const key=JSON.stringify([attachment.instanceId,attachment.pinId]);
        const other=wire.attachments[end==='start'?'end':'start'],device=instances.get(other?.instanceId);
        const pin=device&&component(device.componentId)?.symbol.pins.find(item=>item.id===other.pinId);
        const connection={wireId:wire.id,peer:pin?device.ref+':'+pin.localNumber:'Open or routed through drawing geometry'};
        if(!links.has(key))links.set(key,[]);
        links.get(key).push(connection);
      }
    }
    const rows=[];
    for(const cpu of instances.values()){
      for(const pin of plcIoPins(component(cpu.componentId))){
        const assignment=cpu.plcIo?.[pin.id],connections=links.get(JSON.stringify([cpu.id,pin.id]))??[];
        rows.push({cpu:cpu.ref,sheet:project.sheets.find(sheet=>sheet.id===cpu.sheetId)?.number,terminal:pin.localNumber,channel:pin.name,
          signal:assignment?.signal,address:assignment?.address,wires:connections.map(item=>item.wireId),peers:connections.map(item=>item.peer)});
      }
    }
    return reportCsv([['CPU','cpu'],['Sheet','sheet'],['Terminal','terminal'],['Channel','channel'],['Signal','signal'],['Configured address','address'],['Attached wire IDs','wires'],['Direct peers','peers']],rows);
  }
  function automationNoteRegisterCsv(project){
    const devices=new Map(project.objects.filter(item=>item.kind==='component-instance').map(item=>[item.id,item.ref]));
    const sheets=new Map(project.sheets.map(sheet=>[sheet.id,sheet.number]));
    const rows=project.objects.filter(item=>item.kind==='text'&&item.automationNote).map(item=>({
      sheet:sheets.get(item.sheetId),kind:item.automationNote.kind,description:item.text,
      devices:item.automationNote.deviceIds.map(id=>devices.get(id)||`Missing device (${id})`)
    }));
    return reportCsv([['Sheet','sheet'],['Category','kind'],['Description','description'],['Linked devices','devices']],rows);
  }
  function drawingRegisterCsv(project){
    return reportCsv([['Section','sectionId'],['Sheet number','number'],['Sheet reference','sheetReference'],['Sheet title','sheetTitle'],['Drawing number','drawingNumber'],
      ['Revision','revision'],['Issue status','issueStatus'],['Drawing date','drawingDate'],['Job number','jobNumber'],['Project','projectTitle']],
      project.sheets.map(sheet=>({...titleBlockValues(project,sheet),sectionId:sheet.sectionId,number:sheet.number})));
  }
  function deviceRegisterCsv(project){
    const sheetById=new Map(project.sheets.map(sheet=>[sheet.id,sheet.number]));
    const attachedPins=new Map(),placementCounts=new Map();
    for(const item of project.objects){
      if(item.kind==='wire')for(const {instanceId,pinId} of Object.values(item.attachments??{})){
        if(!attachedPins.has(instanceId))attachedPins.set(instanceId,new Set());
        attachedPins.get(instanceId).add(pinId);
      }
      if(item.kind==='panel-placement')placementCounts.set(item.deviceId,(placementCounts.get(item.deviceId)??0)+1);
    }
    const rows=project.objects.filter(item=>item.kind==='component-instance').map(item=>{
      const def=component(item.componentId);
      return {id:item.id,sheet:sheetById.get(item.sheetId),reference:item.ref,name:item.displayName||def?.name,
        manufacturer:def?.generic?'':def?.manufacturer,part:def?.generic?'':def?.manufacturerPartNumber,
        provenance:def?.generic?'Generic schematic':def?'Manufacturer catalog':'Missing definition',source:def?.sources[0]?.url,
        terminals:def?.symbol.pins.length,attachedPins:attachedPins.get(item.id)?.size??0,panelViews:placementCounts.get(item.id)??0};
    });
    return reportCsv([['Sheet','sheet'],['Reference','reference'],['Name','name'],['Manufacturer','manufacturer'],['Part number','part'],
      ['Provenance','provenance'],['Catalog source','source'],['Terminals','terminals'],['Terminals with attached wires','attachedPins'],['Panel views','panelViews'],['Stable ID','id']],rows);
  }
  function projectWireRegisterCsv(project){
    const objectsBySheet=new Map();
    for(const item of project.objects){
      if(!objectsBySheet.has(item.sheetId))objectsBySheet.set(item.sheetId,[]);
      objectsBySheet.get(item.sheetId).push(item);
    }
    const rows=project.sheets.flatMap(sheet=>{
      const report=wireList(objectsBySheet.get(sheet.id)??[]);
      if(!report.valid)throw new Error('Wire register blocked on '+sheet.number+': '+report.errors.join(' '));
      return report.rows.map(row=>({...row,sheet:sheet.number,units:sheet.floorPlan||sheet.drafting?.units==='mm'?'mm':'drawing units'}));
    });
    return reportCsv([['Sheet','sheet'],['Wire ID','wireId'],['Sheet-local net','netId'],['Start terminals','startPinRefs'],['End terminals','endPinRefs'],
      ['Connected terminals on sheet','netPinRefs'],['Route','routePath'],['Route length','lengthMm'],['Units','units']],rows);
  }
  function revisionRegisterCsv(project){
    const revisions=project.sheets.map(sheet=>({...titleBlockValues(project,sheet),number:sheet.number})).filter(row=>row.revision.trim()||row.revisionDate.trim());
    return reportCsv([['Sheet number','number'],['Sheet reference','sheetReference'],['Sheet title','sheetTitle'],['Drawing number','drawingNumber'],['Revision','revision'],
      ['Revision date','revisionDate'],['Issue status','issueStatus'],['Drawn by','drawnBy'],['Checked by','checkedBy'],['Approved by','approvedBy'],['Notes','notes']],revisions);
  }
  const floorProfileColumns=[['Engineering documentation profile','engineeringProfile'],['Declared standard and edition','standardEdition']];
  function floorProfileReport(sheet){
    const plan=sheet.floorPlan;
    return {engineeringProfile:floorEngineeringProfiles[plan.engineeringProfile],standardEdition:plan.standardEdition};
  }

  function floorCircuitRows(project,boardId){
    const emptyTotals=()=>({loads:[],cable:0,conduit:0,tray:0,riser:0,connected:0,unknownConnected:0,demand:0,unknownDemand:0});
    const assignments=new Map(),sheets=new Map(project.sheets.map(sheet=>[sheet.id,sheet]));
    for(const object of project.objects){
      if(!object.floorCircuit)continue;
      const {boardId,circuitId}=object.floorCircuit;
      if(!assignments.has(boardId))assignments.set(boardId,new Map());
      const circuits=assignments.get(boardId);
      if(!circuits.has(circuitId))circuits.set(circuitId,emptyTotals());
      const totals=circuits.get(circuitId);
      if(object.floorRouteKind){
        totals[object.floorRouteKind]+=floorRouteLength(object);
        totals.riser+=floorRiserLength(sheets.get(object.sheetId),sheets.get(object.riserTargetSheetId))??0;
      }
      else{
        totals.loads.push(object.ref);
        const {activePowerW,demandFactor}=object.properties||{};
        if(finite(activePowerW))totals.connected+=activePowerW;
        else totals.unknownConnected++;
        if(finite(activePowerW)&&finite(demandFactor))totals.demand+=activePowerW*demandFactor;
        else totals.unknownDemand++;
      }
    }
    const rows=[];
    for(const board of project.objects){
      if(board.componentId!=='building-distribution-board'||!board.floorCircuits?.length||boardId&&board.id!==boardId)continue;
      const sheet=sheets.get(board.sheetId);
      if(!sheet?.floorPlan)continue;
      for(const circuit of board.floorCircuits)rows.push({building:sheet.floorPlan.building,floor:sheet.floorPlan.level,sheet:sheet.number,
        boardId:board.id,board:board.ref,circuit:circuit.name,...floorProfileReport(sheet),...(assignments.get(board.id)?.get(circuit.id)||emptyTotals())});
    }
    return rows;
  }
  function floorCircuitScheduleCsv(project) {
    const columns=[['Building','building'],['Floor','floor'],['Sheet','sheet'],['Board','board'],['Circuit','circuit'],['Equipment references','loads'],['Cable route length (mm)','cable'],['Conduit route length (mm)','conduit'],['Tray route length (mm)','tray'],['Vertical riser length (mm)','riser'],['Known connected load (W)','connected'],['Loads missing active power','unknownConnected'],['Known estimated demand (W)','demand'],['Loads missing demand inputs','unknownDemand']];
    return reportCsv([...columns,...floorProfileColumns],floorCircuitRows(project));
  }
  function floorCableScheduleCsv(project){
    const sheets=new Map(project.sheets.filter(sheet=>sheet.floorPlan).map(sheet=>[sheet.id,sheet]));
    const boards=new Map(project.objects.filter(object=>object.componentId==='building-distribution-board').map(board=>[board.id,board]));
    const rows=[];
    for(const route of project.objects){
      const source=sheets.get(route.sheetId);
      if(!route.floorRouteKind||!source)continue;
      const assignment=route.floorCircuit;
      const board=boards.get(assignment?.boardId);
      const circuit=board?.floorCircuits?.find(item=>item.id===assignment.circuitId);
      const target=sheets.get(route.riserTargetSheetId);
      const planar=floorRouteLength(route),vertical=floorRiserLength(source,target);
      rows.push({id:route.id,tag:route.floorRouteTag,kind:route.floorRouteKind,
        building:source.floorPlan.building,fromSheet:source.number,fromFloor:source.floorPlan.level,
        toSheet:target?.number,toFloor:target?.floorPlan.level,board:board?.ref,circuit:circuit?.name,
        planar,vertical,total:planar+(vertical??0),...floorProfileReport(source)});
    }
    return reportCsv([['Route ID','id'],['Route tag','tag'],['Route kind','kind'],['Building','building'],
      ['Source sheet','fromSheet'],['Source floor','fromFloor'],['Riser target sheet','toSheet'],['Riser target floor','toFloor'],
      ['Assigned board','board'],['Assigned circuit','circuit'],['Planar length (mm)','planar'],['Vertical length (mm)','vertical'],
      ['Total drawn length (mm)','total'],...floorProfileColumns],rows);
  }
  function floorPanelScheduleCsv(project){
    const sheets=new Map(project.sheets.filter(sheet=>sheet.floorPlan).map(sheet=>[sheet.id,sheet]));
    const objects=new Map(project.objects.map(object=>[object.id,object]));
    const rows=new Map();
    for(const board of project.objects){
      const sheet=sheets.get(board.sheetId);
      if(board.componentId!=='building-distribution-board'||!sheet)continue;
      rows.set(board.id,{
        building:sheet.floorPlan.building,floor:sheet.floorPlan.level,sheet:sheet.number,
        board:board.ref,room:objects.get(board.roomId)?.roomName,zones:[],circuits:0,loads:0,
        connected:0,demand:0,unknownConnected:0,unknownDemand:0,...floorProfileReport(sheet)
      });
    }
    for(const object of project.objects)rows.get(object.floorZone?.boardId)?.zones.push(object.floorZone.name);
    for(const circuit of floorCircuitRows(project)){
      const row=rows.get(circuit.boardId);
      row.circuits++;
      row.loads+=circuit.loads.length;
      for(const key of ['connected','demand','unknownConnected','unknownDemand'])row[key]+=circuit[key];
    }
    return reportCsv([['Building','building'],['Floor','floor'],['Sheet','sheet'],['Board','board'],['Board room','room'],
      ['Distribution zones','zones'],['Circuits','circuits'],['Assigned loads','loads'],['Known connected load (W)','connected'],
      ['Loads missing active power','unknownConnected'],['Known estimated demand (W)','demand'],['Loads missing demand inputs','unknownDemand'],...floorProfileColumns],Array.from(rows.values()));
  }
  function floorBoardSingleLineSvg(project,boardId){
    const rows=boardId?floorCircuitRows(project,boardId):[];
    if(!rows.length)throw new Error('Select a distribution board with at least one floor circuit.');
    const board=rows[0];
    let y=166;
    const branches=rows.map(row=>{
      const top=y;
      const refs=row.loads.join(', ')||'No assigned equipment';
      const labels=[row.circuit,...refs.match(/[\s\S]{1,70}/gu),
        `Known connected ${Number(row.connected.toPrecision(9))} W · ${row.unknownConnected} missing power`,
        `Known demand ${Number(row.demand.toPrecision(9))} W · ${row.unknownDemand} missing inputs`];
      y+=labels.length*23+29;
      return `<path d="M56 ${top} H140"/><circle cx="56" cy="${top}" r="3" fill="#1855a4"/>`
        +labels.map((label,index)=>svgLabel(152,top+5+index*23,label)).join('');
    }).join('');
    const height=y+20;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 980 ${height}" width="980" height="${height}"><title>Distribution board single-line assignments</title><rect width="980" height="${height}" fill="white"/><g font-family="sans-serif" font-size="15" fill="#19283c">${svgLabel(32,32,board.board+' · Distribution board single-line')}${svgLabel(32,56,board.sheet+' · '+board.building)}${svgLabel(32,79,'Floor · '+board.floor)}${svgLabel(32,104,'Branches show assigned equipment. Verify conductor connections in the project.')}${svgLabel(75,138,board.board)}<g stroke="#1855a4" stroke-width="2"><path d="M56 132 V${y-28}" fill="none"/>${branches}</g></g></svg>`;
  }
  function floorProtectiveEarthCsv(project){
    const sheets=new Map(project.sheets.filter(sheet=>sheet.floorPlan).map(sheet=>[sheet.id,sheet]));
    const devices=new Map(project.objects.filter(item=>item.kind==='component-instance').map(item=>[item.id,item]));
    const rows=[];
    const attached=new Set();
    const pinKey=(device,pin)=>JSON.stringify([device.id,pin.id]);
    const isPe=(device,pin)=>component(device.componentId)?.family==='building-device'&&['PE','PE1','PE2'].includes(pin.id);
    for(const wire of project.objects){
      const sheet=sheets.get(wire.sheetId);
      if(!sheet||wire.kind!=='wire')continue;
      const terminals=['start','end'].map(end=>{
        const binding=wire.attachments?.[end];
        const device=devices.get(binding?.instanceId);
        const pin=device?.sheetId===sheet.id?component(device.componentId)?.symbol.pins.find(item=>item.id===binding.pinId):null;
        if(!pin)return null;
        const pe=isPe(device,pin);
        if(pe)attached.add(pinKey(device,pin));
        return {label:device.ref+':'+pin.localNumber,pe};
      });
      if(!terminals.some(terminal=>terminal?.pe))continue;
      const [start,end]=terminals;
      const status=terminals.some(terminal=>terminal&&!terminal.pe)?'Other terminal type':
        start&&end?'PE terminals at both ends':'End without terminal attachment';
      rows.push({sheet:sheet.number,wire:wire.id,start:start?.label,end:end?.label,status,length:wireRouteLength(wire)});
    }
    for(const device of devices.values()){
      const sheet=sheets.get(device.sheetId);
      if(!sheet)continue;
      for(const pin of component(device.componentId)?.symbol.pins||[]){
        if(isPe(device,pin)&&!attached.has(pinKey(device,pin)))rows.push({
          sheet:sheet.number,start:device.ref+':'+pin.localNumber,status:'PE terminal without attached wire'
        });
      }
    }
    return reportCsv([['Floor sheet','sheet'],['Wire ID','wire'],['Start terminal','start'],['End terminal','end'],
      ['Attachment status','status'],['Drawn route length (mm)','length']],rows);
  }
  function roomEquipmentScheduleCsv(project) {
    const columns=[['Building','building'],['Floor','floor'],['Sheet','sheet'],['Room ID','roomId'],['Room','room'],['Reference','reference'],['Equipment','equipment']];
    const objects=project.objects||[],objectsById=new Map(objects.map(object=>[object.id,object]));
    const sheets=new Map(project.sheets.filter(sheet=>sheet.floorPlan).map(sheet=>[sheet.id,sheet]));
    const rows=[];
    for(const object of objects){
      const sheet=sheets.get(object.sheetId),definition=component(object.componentId);
      if(!sheet||object.kind!=='component-instance'||definition?.family!=='building-device')continue;
      const room=objectsById.get(object.roomId);
      rows.push({building:sheet.floorPlan.building,floor:sheet.floorPlan.level,sheet:sheet.number,
        roomId:room?.id||'',room:room?.roomName||'Unassigned',reference:object.ref,equipment:definition.name});
    }
    return reportCsv(columns,rows);
  }
  function cableCoreRegisterCsv(project) {
    return reportCsv([['Cable tag','tag'], ['Core','core'], ['Sheet','sheet'], ['Wire ID','wireId'],
      ['Start terminal','start'], ['End terminal','end'], ['Continuation IDs','links']], cableCoreRegister(project));
  }

  function continuationRegisterCsv(project) {
    const validation = validateProject(project);
    const errors = validation.errors.concat((project.connectionIssues || []).map(function(issue) { return issue.message; }));
    if (errors.length) throw new Error('Continuation export blocked: ' + errors.join(' '));
    const sheets = new Map(project.sheets.map(function(sheet) { return [sheet.id, sheet.number || sheet.name]; }));
    const objects = new Map(project.objects.map(function(object) { return [object.id, object]; }));
    const rows = (project.crossSheetConnections || []).flatMap(function(link) {
      return link.endpoints.map(function(endpoint) {
        const wire = objects.get(endpoint.wireId);
        const terminals = Object.values(wire.attachments || {}).map(function(binding) {
          const device = objects.get(binding.instanceId);
          const pin = device && worldPins(device).find(function(candidate) { return candidate.id === binding.pinId; });
          return pin ? device.ref + ':' + pin.number : 'Unresolved terminal';
        });
        return {id:link.id, name:link.name, sheet:sheets.get(endpoint.sheetId), wire:wire.id,
          x:endpoint.point.x, y:endpoint.point.y, terminals:terminals, tag:wire.cable?.tag, core:wire.cable?.core};
      });
    });
    return reportCsv([['Continuation ID','id'], ['Potential','name'], ['Sheet','sheet'], ['Wire ID','wire'],
      ['Reference X','x'], ['Reference Y','y'], ['Attached terminals','terminals'], ['Cable','tag'], ['Core','core']], rows);
  }

  function terminalRegisterCsv(project) {
    const sheets = new Map(project.sheets.map(function(sheet) { return [sheet.id, sheet.number || sheet.name]; }));
    const assignments = new Map();
    project.objects.filter(function(object) { return object.kind === 'wire'; }).forEach(function(wire) {
      Object.entries(wire.attachments || {}).forEach(function(entry) {
        const [end,binding] = entry;
        const key = JSON.stringify([binding.instanceId,binding.pinId]);
        if (!assignments.has(key)) assignments.set(key,[]);
        assignments.get(key).push({wire:wire.id, end:end, conductor:wire.conductorId, cable:wire.cable?.tag, core:wire.cable?.core});
      });
    });
    const rows = project.objects.filter(function(object) { return object.kind === 'component-instance'; }).flatMap(function(device) {
      const pins=worldPins(device),numbers=new Map(pins.map(pin=>[pin.id,pin.number]));
      const groups=component(device.componentId)?.symbol.internalConnections??[];
      return pins.flatMap(function(pin) {
        const key = JSON.stringify([device.id,pin.id]);
        const commonPositions=groups.filter(group=>group.includes(pin.id)).map(group=>group.map(id=>numbers.get(id)).join(' / '));
        const terminal = {sheet:sheets.get(device.sheetId), ref:device.ref, terminal:pin.number, pin:pin.id, commonPositions};
        return (assignments.get(key) || [{}]).map(function(assignment) {
          return Object.assign({},terminal,assignment,{status:assignment.wire?'Attached':'Unwired'});
        });
      });
    });
    return reportCsv([['Sheet','sheet'], ['Device','ref'], ['Terminal','terminal'], ['Pin ID','pin'],
      ['Status','status'], ['Wire ID','wire'], ['Wire end','end'], ['Conductor','conductor'],
      ['Cable tag','cable'], ['Core','core'], ['Declared common clamping positions','commonPositions']],rows);
  }

  function wireListCsv(objects) {
    const report = wireList(objects);
    if (!report.valid) throw new Error('Wire list export blocked: ' + report.errors.join(' '));
    const columns = [
      ['Wire ID', 'wireId'], ['Net ID', 'netId'], ['Start X (mm)', 'startX'],
      ['Start Y (mm)', 'startY'], ['Bend X (mm)', 'bendX'], ['End X (mm)', 'endX'],
      ['End Y (mm)', 'endY'], ['Route length (mm)', 'lengthMm'], ['Route points (mm)', 'routePath'],
      ['Start pin references', 'startPinRefs'], ['End pin references', 'endPinRefs'],
      ['Connected pin references on net', 'netPinRefs']
    ];
    return reportCsv(columns, report.rows);
  }

  root.AdigunCADEngine = Object.freeze({
    deviceRegisterCsv,
    projectWireRegisterCsv,
    drawingRegisterCsv,
    revisionRegisterCsv,
    automationNoteKinds,
    validAutomationNote,
    automationNoteRegisterCsv,
    registerPlcSymbols,
    registerWagoTerminalBatch,
    plcIoPins,
    validPlcIo,
    plcIoRegisterCsv,
    validPanelThermalInputs,
    cabinetFeatureFaces,
    validCabinetFeatures,
    validDuctInputs,
    linkAssemblyAccessory: linkAssemblyAccessory,
    createPanelPlacement: createPanelPlacement,
    panelPlacementGeometry: panelPlacementGeometry,
    panelBodyScene: panelBodyScene,
    validCabinetBounds: validCabinetBounds,
    resolvePanelDevice: resolvePanelDevice,
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
    validWallOpenings: validWallOpenings,
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
    roomEquipmentScheduleCsv: roomEquipmentScheduleCsv,
    floorCircuitScheduleCsv: floorCircuitScheduleCsv,
    floorZonePolygonArea: floorZonePolygonArea,
    floorEngineeringProfiles: floorEngineeringProfiles,
    floorCableScheduleCsv: floorCableScheduleCsv,
    floorPanelScheduleCsv: floorPanelScheduleCsv,
    floorProtectiveEarthCsv: floorProtectiveEarthCsv,
    floorRiserElevationSvg: floorRiserElevationSvg,
    buildingRiserDiagramSvg: buildingRiserDiagramSvg,
    floorBoardSingleLineSvg: floorBoardSingleLineSvg,
    wireRoute: wireRoute,
    wireRouteLength: wireRouteLength,
    floorRouteLength: floorRouteLength,
    floorRiserLength: floorRiserLength,
    validFloorRoutePoints: validFloorRoutePoints,
    wireList: wireList,
    wireListCsv: wireListCsv,
    cableCoreRegister: cableCoreRegister,
    cableCoreRegisterCsv: cableCoreRegisterCsv,
    continuationRegisterCsv: continuationRegisterCsv,
    terminalRegisterCsv: terminalRegisterCsv
  });
})(typeof window !== 'undefined' ? window : globalThis);


