import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculatorRegistry,
  calculate,
  CalculationError,
  calculationToRecord,
  calculateRecord,
  calculationReport,
} from "../../packages/engineering-core/calculations.ts";
import {
  Quantity,
  convert,
} from "../../packages/engineering-core/quantities.ts";
import {
  createProject,
  serializeProject,
  parseProject,
} from "../../packages/electrical-model/project.ts";

// Reference values are independently evaluated examples, not calls to implementation helpers.
// P/Q/S uses the 3-4-5 triangle; resistance/fault examples use exact 3-4-5 mΩ impedance.
// This evidence is test input only and never appears as a product/manufacturer claim.
const evidence = [
  "Test fixture: explicitly supplied synthetic data; educational reference only.",
];
const fixtures = [
  [
    "ohms-law",
    { voltage: 12, resistance: 4 },
    { voltage: "V", resistance: "ohm" },
    { current: 3, activePower: 36 },
    "resistance",
    0,
  ],
  [
    "ac-dc-power",
    { supply: 0, voltage: 12, current: 2, powerFactor: 1 },
    { supply: "1", voltage: "V", current: "A", powerFactor: "1" },
    { activePower: 24 },
    "supply",
    2,
  ],
  [
    "single-phase-power",
    { voltage: 230, current: 10, powerFactor: 0.8 },
    { voltage: "V", current: "A", powerFactor: "1" },
    { activePower: 1840, apparentPower: 2300, reactivePower: 1380 },
    "powerFactor",
    1.001,
  ],
  [
    "three-phase-power",
    { voltage: 400, current: 10, powerFactor: 0.8 },
    { voltage: "V", current: "A", powerFactor: "1" },
    {
      activePower: 5542.562584220407,
      apparentPower: 6928.203230275509,
      reactivePower: 4156.921938165305,
    },
    "voltage",
    0,
  ],
  [
    "apparent-power",
    { activePower: 3000, reactivePower: -4000 },
    { activePower: "W", reactivePower: "var" },
    { apparentPower: 5000 },
    "activePower",
    -1,
  ],
  [
    "reactive-power",
    { activePower: 3000, apparentPower: 5000 },
    { activePower: "W", apparentPower: "VA" },
    { reactivePower: 4000 },
    "activePower",
    5001,
  ],
  [
    "power-factor",
    { activePower: 3000, apparentPower: 5000 },
    { activePower: "W", apparentPower: "VA" },
    { powerFactor: 0.6 },
    "apparentPower",
    0,
  ],
  [
    "voltage-drop",
    {
      phases: 1,
      voltage: 230,
      current: 10,
      length: 20,
      resistancePerLength: 0.01,
      reactancePerLength: 0.005,
      powerFactor: 0.8,
      dropLimit: 0.03,
    },
    {
      phases: "1",
      voltage: "V",
      current: "A",
      length: "m",
      resistancePerLength: "ohm/m",
      reactancePerLength: "ohm/m",
      powerFactor: "1",
      dropLimit: "1",
    },
    { voltageDrop: 4.4, voltageDropPercent: 1.9130434782608696 },
    "length",
    -1,
  ],
  [
    "cable-resistance",
    {
      resistivity: 0.0175,
      length: 100,
      area: 2.5,
      temperatureCoefficient: 0.004,
      temperatureRise: 50,
    },
    {
      resistivity: "ohm*mm2/m",
      length: "m",
      area: "mm2",
      temperatureCoefficient: "1/K",
      temperatureRise: "K",
    },
    { resistance: 0.84 },
    "area",
    0,
  ],
  [
    "load-current",
    { phases: 1, voltage: 230, activePower: 1840, powerFactor: 0.8 },
    { phases: "1", voltage: "V", activePower: "W", powerFactor: "1" },
    { current: 10 },
    "powerFactor",
    0,
  ],
  [
    "circuit-loading",
    { current: 18, ratedCurrent: 20, allowedLoading: 0.8 },
    { current: "A", ratedCurrent: "A", allowedLoading: "1" },
    { allowedCurrent: 16, loadingPercent: 112.5, currentMargin: -2 },
    "allowedLoading",
    0,
  ],
  [
    "transformer-sizing",
    {
      activePower: 8000,
      powerFactor: 0.8,
      headroom: 1.2,
      allowedLoading: 0.75,
    },
    { activePower: "W", powerFactor: "1", headroom: "1", allowedLoading: "1" },
    { requiredApparentPower: 16 },
    "headroom",
    0.99,
  ],
  [
    "motor-full-load",
    {
      phases: 1,
      voltage: 200,
      shaftPower: 720,
      efficiency: 0.9,
      powerFactor: 0.8,
    },
    {
      phases: "1",
      voltage: "V",
      shaftPower: "W",
      efficiency: "1",
      powerFactor: "1",
    },
    { activePower: 800, current: 5 },
    "efficiency",
    0,
  ],
  [
    "motor-starting",
    { phases: 3, voltage: 400, current: 10, startingMultiplier: 6 },
    { phases: "1", voltage: "V", current: "A", startingMultiplier: "1" },
    { startingCurrent: 60, startingApparentPower: 41.56921938165305 },
    "startingMultiplier",
    0.999,
  ],
  [
    "energy",
    { activePower: 2, duration: 4, dutyCycle: 0.5 },
    { activePower: "kW", duration: "h", dutyCycle: "1" },
    { energy: 4 },
    "dutyCycle",
    1.01,
  ],
  [
    "cable-losses",
    { current: 10, resistance: 0.2, conductors: 3, duration: 2 },
    { current: "A", resistance: "ohm", conductors: "1", duration: "h" },
    { lossPower: 60, energy: 0.12 },
    "conductors",
    1.5,
  ],
  [
    "short-circuit",
    {
      voltage: 400,
      sourceResistance: 0.003,
      sourceReactance: 0.004,
      voltageFactor: 1.1,
    },
    {
      voltage: "V",
      sourceResistance: "ohm",
      sourceReactance: "ohm",
      voltageFactor: "1",
    },
    { impedance: 0.005, faultCurrent: 50.80682368868707 },
    "voltageFactor",
    0,
  ],
  [
    "protective-coordination",
    { faultCurrent: 6, selectivityLimit: 10, breakingCapacity: 6 },
    { faultCurrent: "kA", selectivityLimit: "kA", breakingCapacity: "kA" },
    { selectivityMargin: 4, breakingMargin: 0 },
    "selectivityLimit",
    0,
  ],
  [
    "cable-sizing",
    {
      current: 18,
      ratedCurrent: 20,
      tabulatedAmpacity: 40,
      temperatureFactor: 0.8,
      groupingFactor: 0.75,
      installationFactor: 0.9,
      area: 4,
    },
    {
      current: "A",
      ratedCurrent: "A",
      tabulatedAmpacity: "A",
      temperatureFactor: "1",
      groupingFactor: "1",
      installationFactor: "1",
      area: "mm2",
    },
    {
      candidateArea: 4,
      correctedAmpacity: 21.6,
      requiredTabulatedAmpacity: 37.03703703703704,
    },
    "groupingFactor",
    0,
  ],
  [
    "demand-diversity",
    { activePower: 100, utilizationFactor: 0.8, coincidenceFactor: 0.5 },
    { activePower: "kW", utilizationFactor: "1", coincidenceFactor: "1" },
    { demandPower: 40 },
    "coincidenceFactor",
    1.01,
  ],
  [
    "battery-autonomy",
    {
      voltage: 24,
      capacity: 100,
      usableFraction: 0.8,
      efficiency: 0.9,
      activePower: 432,
    },
    {
      voltage: "V",
      capacity: "Ah",
      usableFraction: "1",
      efficiency: "1",
      activePower: "W",
    },
    { usableEnergy: 1.728, autonomy: 4 },
    "activePower",
    0,
  ],
  [
    "ups-sizing",
    {
      activePower: 800,
      powerFactor: 0.8,
      headroom: 1.25,
      duration: 2,
      batteryVoltage: 24,
      efficiency: 0.8,
      usableFraction: 0.5,
    },
    {
      activePower: "W",
      powerFactor: "1",
      headroom: "1",
      duration: "h",
      batteryVoltage: "V",
      efficiency: "1",
      usableFraction: "1",
    },
    {
      requiredApparentPower: 1.25,
      requiredActivePower: 1,
      requiredCapacity: 166.66666666666666,
    },
    "batteryVoltage",
    0,
  ],
  [
    "generator-sizing",
    {
      activePower: 8,
      powerFactor: 0.8,
      headroom: 1.2,
      derating: 0.8,
      startingApparentPower: 20,
    },
    {
      activePower: "kW",
      powerFactor: "1",
      headroom: "1",
      derating: "1",
      startingApparentPower: "kVA",
    },
    { requiredActivePower: 12, requiredApparentPower: 25 },
    "derating",
    1.01,
  ],
  [
    "lighting-load",
    {
      phases: 1,
      voltage: 200,
      fixturePower: 20,
      fixtures: 10,
      powerFactor: 0.8,
      duration: 5,
    },
    {
      phases: "1",
      voltage: "V",
      fixturePower: "W",
      fixtures: "1",
      powerFactor: "1",
      duration: "h",
    },
    { activePower: 200, apparentPower: 250, current: 1.25, energy: 1 },
    "fixtures",
    0.5,
  ],
  [
    "earthing",
    { soilResistivity: 100, length: 50 },
    { soilResistivity: "ohm*m", length: "m" },
    { earthResistance: 4 },
    "length",
    0,
  ],
];
const close = (actual, expected) =>
  assert.ok(
    Math.abs(actual - expected) <= Math.max(1, Math.abs(expected)) * 1e-11,
    `${actual} ≠ ${expected}`,
  );
const value = (result, key) =>
  result.values.find((item) => item.key === key).value;
function run(id, changes = {}, unitChanges = {}) {
  const [, inputs, units] = fixtures.find((fixture) => fixture[0] === id);
  return calculate(
    id,
    { ...inputs, ...changes },
    { ...units, ...unitChanges },
    evidence,
  );
}
test("the 25 specification categories each have an independent reference fixture", () => {
  assert.deepEqual(
    calculatorRegistry.map((item) => item.id).sort(),
    fixtures.map((item) => item[0]).sort(),
  );
  assert.equal(new Set(calculatorRegistry.map((item) => item.id)).size, 25);
});
for (const [
  id,
  inputs,
  units,
  expected,
  boundaryField,
  invalidBoundary,
] of fixtures) {
  test(`${id}: independent values, forbidden boundary, required inputs and unit safety`, () => {
    const result = calculate(id, inputs, units, evidence);
    assert.deepEqual(
      result.values.map((item) => item.key).sort(),
      Object.keys(expected).sort(),
    );
    for (const [key, expectedValue] of Object.entries(expected))
      close(value(result, key), expectedValue);
    assert.ok(result.sources.length > 0);
    assert.ok(result.formula.length > 0);
    assert.ok(result.assumptionKeys.length > 0);
    assert.ok(result.warningKeys.includes("calcWarningEstimate"));
    assert.throws(
      () =>
        calculate(
          id,
          { ...inputs, [boundaryField]: invalidBoundary },
          units,
          evidence,
        ),
      CalculationError,
    );
    const missing = { ...inputs };
    delete missing[boundaryField];
    assert.throws(
      () => calculate(id, missing, units, evidence),
      (error) =>
        error.issues.some((item) => item.code === "calcErrorMissingInput"),
    );
    assert.throws(
      () =>
        calculate(
          id,
          inputs,
          { ...units, [boundaryField]: "banana" },
          evidence,
        ),
      CalculationError,
    );
    assert.throws(
      () => calculate(id, { ...inputs, [boundaryField]: NaN }, units, evidence),
      CalculationError,
    );
    const saved = calculationToRecord(result, `calc-${id}`, id);
    assert.deepEqual(calculateRecord(saved), result);
    assert.deepEqual(calculationReport(saved).result, result);
  });
}
test("dimension algebra rejects incompatible additions/conversions and silent unit substitutions", () => {
  close(convert(1000, "mA", "A"), 1);
  close(convert(1, "kW", "W"), 1000);
  close(convert(1, "m2", "mm2"), 1e6);
  close(convert(1, "Ah", "C"), 3600);
  close(Quantity.of(24, "V").mul(Quantity.of(100, "Ah")).in("kWh"), 2.4);
  assert.throws(() => convert(1, "m", "mm2"));
  assert.throws(() => Quantity.of(1, "V").add(Quantity.of(1, "A")));
  assert.throws(() => Quantity.of(1, "V").div(Quantity.of(0, "A")));
  assert.throws(() => Quantity.of(Number.MAX_VALUE, "kV"));
  assert.throws(() => Quantity.of(Number.MIN_VALUE, "mA"));
  assert.throws(() => Quantity.of(Number.MIN_VALUE, "J").in("kWh"));
  assert.throws(
    () => run("ohms-law", {}, { resistance: "A" }),
    CalculationError,
  );
  assert.throws(
    () => run("apparent-power", {}, { reactivePower: "W" }),
    CalculationError,
  );
});
test("mixed prefixes, area and time conversions preserve physical results", () => {
  close(
    value(
      run(
        "cable-resistance",
        { length: 100000, area: 0.0000025, resistivity: 1.75e-8 },
        { length: "mm", area: "m2", resistivity: "ohm*m" },
      ),
      "resistance",
    ),
    0.84,
  );
  close(
    value(
      run(
        "voltage-drop",
        {
          length: 20000,
          current: 10000,
          resistancePerLength: 10,
          reactancePerLength: 5,
          powerFactor: 80,
          dropLimit: 3,
        },
        {
          length: "mm",
          current: "mA",
          resistancePerLength: "ohm/km",
          reactancePerLength: "ohm/km",
          powerFactor: "%",
          dropLimit: "%",
        },
      ),
      "voltageDrop",
    ),
    4.4,
  );
  close(
    value(
      run(
        "energy",
        { activePower: 2000, duration: 240, dutyCycle: 50 },
        { activePower: "W", duration: "min", dutyCycle: "%" },
      ),
      "energy",
    ),
    4,
  );
  close(
    value(
      run("battery-autonomy", { capacity: 100000 }, { capacity: "mAh" }),
      "autonomy",
    ),
    4,
  );
});
test("zero loads, unity/reactive endpoints and positive denominators are deliberate", () => {
  close(value(run("ohms-law", { voltage: 0 }), "current"), 0);
  close(
    value(run("single-phase-power", { powerFactor: 0 }), "reactivePower"),
    2300,
  );
  close(
    value(run("single-phase-power", { powerFactor: 1 }), "reactivePower"),
    0,
  );
  close(
    value(run("reactive-power", { activePower: 5000 }), "reactivePower"),
    0,
  );
  close(
    value(
      run("reactive-power", { activePower: 0, apparentPower: 0 }),
      "reactivePower",
    ),
    0,
  );
  close(value(run("power-factor", { activePower: 0 }), "powerFactor"), 0);
  close(value(run("power-factor", { activePower: 5000 }), "powerFactor"), 1);
  close(
    value(run("demand-diversity", { coincidenceFactor: 0 }), "demandPower"),
    0,
  );
  close(value(run("energy", { duration: 0 }), "energy"), 0);
  close(value(run("battery-autonomy", { capacity: 0 }), "autonomy"), 0);
  assert.throws(
    () => run("ac-dc-power", { powerFactor: 0.8 }),
    /calcErrorDcPowerFactor/,
  );
  close(
    value(
      run("ac-dc-power", {
        supply: 1,
        voltage: 230,
        current: 10,
        powerFactor: 0.8,
      }),
      "activePower",
    ),
    1840,
  );
  assert.throws(
    () => run("short-circuit", { sourceResistance: 0, sourceReactance: 0 }),
    /calcErrorImpedance/,
  );
  assert.throws(
    () => run("cable-resistance", { temperatureRise: -250 }),
    /calcErrorTemperature/,
  );
  close(
    value(run("cable-resistance", { temperatureRise: -50 }), "resistance"),
    0.56,
  );
  close(
    value(
      run("cable-resistance", { temperatureCoefficient: -0.004 }),
      "resistance",
    ),
    0.56,
  );
});
test("single/three-phase branch values and resistive/inductive drop are independently checked", () => {
  close(
    value(
      run("load-current", {
        phases: 3,
        voltage: 400,
        activePower: 12000,
        powerFactor: 1,
      }),
      "current",
    ),
    17.32050807568877,
  );
  close(
    value(run("voltage-drop", { phases: 3, powerFactor: 1 }), "voltageDrop"),
    3.4641016151377544,
  );
  close(value(run("voltage-drop", { powerFactor: 0 }), "voltageDrop"), 2);
  close(
    value(run("motor-starting", { phases: 1 }), "startingApparentPower"),
    24,
  );
  close(
    value(
      run("generator-sizing", { startingApparentPower: 1 }),
      "requiredApparentPower",
    ),
    15,
  );
  close(
    value(run("lighting-load", { phases: 3, voltage: 400 }), "current"),
    0.3608439182435161,
  );
  assert.throws(() => run("load-current", { phases: 2 }), /calcErrorRange/);
});
test("checks do not certify coordination, cable sizing, or failed limits", () => {
  const limited = run("protective-coordination");
  assert.equal(limited.classification, "limited-check");
  assert.deepEqual(
    limited.checks.map((item) => item.passed),
    [true, true],
  );
  assert.deepEqual(
    run("protective-coordination", {
      faultCurrent: 10,
      breakingCapacity: 10,
    }).checks.map((item) => item.passed),
    [false, true],
  );
  assert.deepEqual(
    run("protective-coordination", { faultCurrent: 11 }).checks.map(
      (item) => item.passed,
    ),
    [false, false],
  );
  assert.deepEqual(
    run("cable-sizing").checks.map((item) => item.passed),
    [true, true],
  );
  assert.deepEqual(
    run("cable-sizing", { current: 22, tabulatedAmpacity: 30 }).checks.map(
      (item) => item.passed,
    ),
    [false, false],
  );
  assert.equal(run("circuit-loading").checks[0].passed, false);
  assert.equal(run("circuit-loading", { current: 16 }).checks[0].passed, true);
  assert.ok(
    run("circuit-loading").warningKeys.includes("calcWarningCheckFailed"),
  );
  assert.equal(
    run("voltage-drop", { dropLimit: 0.01 }).checks[0].passed,
    false,
  );
  assert.ok(
    run("voltage-drop", { length: 2000 }).warningKeys.includes(
      "calcWarningLargeDrop",
    ),
  );
  for (const calculator of calculatorRegistry.filter(
    (item) => item.evidenceRequired,
  )) {
    const [, inputs, units] = fixtures.find(
      (item) => item[0] === calculator.id,
    );
    assert.throws(
      () => calculate(calculator.id, inputs, units),
      /calcErrorEvidence/,
    );
  }
});
test("computed inclusive limits tolerate roundoff without accepting a material excess", () => {
  const candidate = {
    current: 28,
    ratedCurrent: 28,
    tabulatedAmpacity: 50,
    temperatureFactor: 0.7,
    groupingFactor: 0.8,
    installationFactor: 1,
  };
  assert.deepEqual(
    run("cable-sizing", candidate).checks.map((item) => item.passed),
    [true, true],
  );
  assert.equal(
    run("cable-sizing", { ...candidate, ratedCurrent: 28.000001 }).checks[1]
      .passed,
    false,
  );
  assert.equal(
    run("circuit-loading", {
      current: 29,
      ratedCurrent: 50,
      allowedLoading: 0.58,
    }).checks[0].passed,
    true,
  );
  const drop = {
    voltage: 0.1,
    current: 0.1,
    length: 0.1,
    resistancePerLength: 0.1,
    reactancePerLength: 0,
    powerFactor: 1,
    dropLimit: 0.02,
  };
  assert.equal(run("voltage-drop", drop).checks[0].passed, true);
  assert.equal(
    run("voltage-drop", { ...drop, dropLimit: 0.019999 }).checks[0].passed,
    false,
  );
  assert.equal(
    run("protective-coordination", { faultCurrent: 10, selectivityLimit: 10 })
      .checks[0].passed,
    false,
  );
});
test("input records reject overflow, unknown keys, missing unit maps and altered method/assumptions", () => {
  assert.throws(
    () =>
      run("ohms-law", {
        voltage: Number.MAX_VALUE,
        resistance: Number.MIN_VALUE,
      }),
    CalculationError,
  );
  assert.throws(
    () => run("energy", { hiddenDemandFactor: 0.5 }),
    /calcErrorUnknownInput/,
  );
  assert.throws(() => calculate("energy", null, {}), CalculationError);
  assert.throws(
    () => calculate("unknown", {}, {}),
    /calcErrorUnknownCalculator/,
  );
  assert.throws(
    () =>
      calculate("ohms-law", { voltage: 12, resistance: 4 }, { voltage: "V" }),
    /calcErrorUnit/,
  );
  const result = run("ohms-law");
  const record = calculationToRecord(result, "calc-reference", "DC resistor");
  assert.throws(
    () =>
      calculateRecord({
        ...record,
        methodReference: record.methodReference.replace("1.0.0", "0.9.0"),
      }),
    /calcErrorMethod/,
  );
  assert.throws(
    () => calculateRecord({ ...record, assumptions: [] }),
    /calcErrorRecord/,
  );
  assert.throws(
    () =>
      calculateRecord({
        ...record,
        assumptions: [...record.assumptions, "mystery"],
      }),
    /calcErrorRecord/,
  );
  assert.throws(
    () => calculationToRecord(result, "invalid id", "x"),
    /calcErrorRecord/,
  );
  const copy = calculationReport(record);
  copy.record.inputs.voltage = 100;
  assert.equal(record.inputs.voltage, 12);
});
test("native project serialization keeps auditable inputs and exact method replay", () => {
  const project = createProject("Calculation persistence");
  project.calculations = fixtures.map(([id, inputs, units], index) =>
    calculationToRecord(
      calculate(id, inputs, units, evidence),
      `calc-${index}`,
      id,
    ),
  );
  const restored = parseProject(serializeProject(project)).project;
  assert.equal(restored.calculations.length, 25);
  for (let index = 0; index < 25; index++)
    assert.deepEqual(
      calculateRecord(restored.calculations[index]),
      calculateRecord(project.calculations[index]),
    );
});
