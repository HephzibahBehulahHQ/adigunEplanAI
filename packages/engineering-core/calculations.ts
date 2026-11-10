import type { Project } from "../electrical-model/project.ts";
import { Quantity, isUnit, type Unit } from "./quantities.ts";

/** Changing a numerical method requires a new version: old records must never silently change. */
export const CALCULATION_VERSION = "1.0.0";
export type CalculationRecord = Project["calculations"][number];
export type CalculationInputs = Record<string, number>;
export type CalculationUnits = Record<string, string>;
export type CalculationSource = {
  id: string;
  title: string;
  url: string;
  accessed: string;
};
const eig = "https://www.electrical-installation.org/enwiki/";
const source = (id: string, title: string, url: string): CalculationSource => ({
  id,
  title,
  url,
  accessed: "2026-11-06",
});
export const calculationSources: Record<string, CalculationSource> = {
  ohm: source(
    "ohm",
    "Fluke — Ohm’s law",
    "https://www.fluke.com/en-us/learn/blog/electrical/what-is-ohms-law",
  ),
  power: source(
    "power",
    "Schneider Electric — Installed apparent power",
    `${eig}Installed_apparent_power_(kVA)`,
  ),
  pf: source(
    "pf",
    "Schneider Electric — Definition of power factor",
    `${eig}Definition_of_Power_Factor`,
  ),
  reactive: source(
    "reactive",
    "Schneider Electric — Definition of reactive power",
    `${eig}Definition_of_reactive_power`,
  ),
  drop: source(
    "drop",
    "Schneider Electric — Voltage drop in steady load conditions",
    `${eig}Calculation_of_voltage_drop_in_steady_load_conditions`,
  ),
  cable: source(
    "cable",
    "Schneider Electric — General method for cable sizing",
    `${eig}General_method_for_cable_sizing`,
  ),
  protection: source(
    "protection",
    "Schneider Electric — Practical values for a protective scheme",
    `${eig}Practical_values_for_a_protective_scheme`,
  ),
  ups: source(
    "ups",
    "Eaton — UPS capacity, power factor and runtime sizing",
    "https://www.eaton.com/us/en-us/products/backup-power-ups-surge-it-power-distribution/backup-power-ups/ups-sizing-guide.html",
  ),
  generator: source(
    "generator",
    "Cummins — Specifying and validating motor-starting capability",
    "https://mart.cummins.com/imagelibrary/data/assetfiles/0057945.pdf",
  ),
  fault: source(
    "fault",
    "Schneider Electric — Three-phase short-circuit current at any point in a LV installation",
    `${eig}3-phase_short-circuit_current_(Isc)_at_any_point_within_a_LV_installation`,
  ),
  selectivity: source(
    "selectivity",
    "Schneider Electric — Coordination between circuit-breakers",
    `${eig}Coordination_between_circuit-breakers`,
  ),
  demand: source(
    "demand",
    "Schneider Electric — Application of utilization and coincidence factors",
    `${eig}Example_of_application_of_factors_ku_and_ks`,
  ),
  earth: source(
    "earth",
    "Schneider Electric — Installation and measurements of earth electrodes",
    `${eig}Installation_and_measurements_of_earth_electrodes`,
  ),
  motor: source(
    "motor",
    "European Commission — Electric motors: efficiency is mechanical output divided by electrical input",
    "https://energy-efficient-products.ec.europa.eu/product-list/electric-motors_en",
  ),
  battery: source(
    "battery",
    "Victron Energy — Battery nominal voltage, charge and energy",
    "https://www.victronenergy.com/media/pg/Lithium_Battery_Smart/en/technical-data.html",
  ),
  energy: source(
    "energy",
    "OpenStax — Electric power and energy",
    "https://openstax.org/books/university-physics-volume-2/pages/9-5-electrical-energy-and-power",
  ),
  resistance: source(
    "resistance",
    "OpenStax — Resistivity and resistance",
    "https://openstax.org/books/university-physics-volume-2/pages/9-3-resistivity-and-resistance",
  ),
};

export type CalculationInput = {
  key: string;
  labelKey: string;
  units: readonly Unit[];
  min?: number;
  exclusiveMin?: boolean;
  max?: number;
  integer?: boolean;
  choices?: readonly { value: number; labelKey: string }[];
};
export type CalculationValue = {
  key: string;
  labelKey: string;
  value: number;
  unit: Unit;
};
export type CalculationCheck = {
  key: string;
  labelKey: string;
  passed: boolean;
};
type Computed = {
  values: CalculationValue[];
  checks?: CalculationCheck[];
  warnings?: string[];
};
type Quantities = Record<string, Quantity>;
export type Calculator = {
  id: string;
  titleKey: string;
  formula: string;
  inputs: CalculationInput[];
  assumptionKeys: string[];
  sourceIds: string[];
  evidenceRequired?: boolean;
  run: (q: Quantities) => Computed;
};
export type CalculationResult = {
  calculatorId: string;
  titleKey: string;
  methodReference: string;
  classification: "estimate" | "limited-check";
  inputs: CalculationInputs;
  units: CalculationUnits;
  formula: string;
  values: CalculationValue[];
  checks: CalculationCheck[];
  assumptionKeys: string[];
  warningKeys: string[];
  evidence: string[];
  sources: CalculationSource[];
};
export type CalculationIssue = { code: string; field?: string };
export class CalculationError extends Error {
  readonly issues: CalculationIssue[];
  constructor(issues: CalculationIssue[]) {
    super(
      issues
        .map((issue) => `${issue.code}${issue.field ? `:${issue.field}` : ""}`)
        .join(", "),
    );
    this.name = "CalculationError";
    this.issues = issues;
  }
}
const label = (kind: string, key: string) =>
  `calc${kind}${key[0].toUpperCase()}${key.slice(1)}`;
const field = (
  key: string,
  allowed: readonly Unit[],
  limits: Partial<CalculationInput> = {},
): CalculationInput => ({
  key,
  labelKey: label("Field", key),
  units: allowed,
  min: 0,
  ...limits,
});
const positive = (key: string, allowed: readonly Unit[]) =>
  field(key, allowed, { exclusiveMin: true });
const fraction = (key: string, positiveOnly = false) =>
  field(key, ["1", "%"], { max: 1, exclusiveMin: positiveOnly });
const count = (key: string) =>
  field(key, ["1"], { min: 1, integer: true, max: 1e6 });
const phases = (): CalculationInput => ({
  ...field("phases", ["1"]),
  choices: [
    { value: 1, labelKey: "calcSinglePhase" },
    { value: 3, labelKey: "calcThreePhase" },
  ],
});
const voltage = () => positive("voltage", ["V", "kV", "mV"]);
const current = () => field("current", ["A", "mA", "kA"]);
const activePower = () => field("activePower", ["W", "kW", "MW"]);
const powerFactor = () => fraction("powerFactor", true);
const time = () => field("duration", ["h", "min", "s"]);
const headroom = () => field("headroom", ["1", "%"], { min: 1 });
const out = (key: string, q: Quantity, name: Unit): CalculationValue => ({
  key,
  labelKey: label("Value", key),
  value: q.in(name),
  unit: name,
});
const check = (key: string, passed: boolean): CalculationCheck => ({
  key,
  labelKey: label("Check", key),
  passed,
});
/** Only arithmetic-derived inclusive limits receive roundoff tolerance.
 * This is eight binary64 epsilons relative to the operands, not an engineering
 * safety margin. Manufacturer selectivity and direct input comparisons stay strict.
 */
const withinComputedLimit = (actual: Quantity, limit: Quantity) =>
  actual.si <= limit.si ||
  actual.si - limit.si <=
    8 * Number.EPSILON * Math.max(Math.abs(actual.si), Math.abs(limit.si));
const one = Quantity.of(1, "1");
const n = (q: Quantity) => q.in("1");
const phaseFactor = (q: Quantities) => (n(q.phases) === 3 ? Math.sqrt(3) : 1);
const sinFromPf = (q: Quantity) => Math.sqrt(Math.max(0, 1 - n(q) ** 2));
function bad(code: string, key?: string): never {
  throw new CalculationError([{ code, field: key }]);
}
function acPower(q: Quantities, factor: number): Computed {
  const apparent = q.voltage.mul(q.current).scale(factor);
  return {
    values: [
      out("activePower", apparent.mul(q.powerFactor), "W"),
      out("apparentPower", apparent, "VA"),
      out("reactivePower", apparent.scale(sinFromPf(q.powerFactor)), "var"),
    ],
  };
}
const define = (
  id: string,
  formula: string,
  inputs: CalculationInput[],
  run: Calculator["run"],
  sourceIds: string[],
  assumptionKeys: string[],
  evidenceRequired = false,
): Calculator => ({
  id,
  titleKey: label(
    "Tool",
    id.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()),
  ),
  formula,
  inputs,
  run,
  sourceIds,
  assumptionKeys,
  evidenceRequired,
});
const steady = "calcAssumptionSinusoidal";
const explicit = "calcAssumptionUserData";

export const calculatorRegistry: readonly Calculator[] = [
  define(
    "ohms-law",
    "I = U / R; P = U × I",
    [
      field("voltage", ["V", "kV", "mV"]),
      positive("resistance", ["ohm", "mohm"]),
    ],
    (q) => {
      const i = q.voltage.div(q.resistance);
      return {
        values: [
          out("current", i, "A"),
          out("activePower", q.voltage.mul(i), "W"),
        ],
      };
    },
    ["ohm"],
    ["calcAssumptionOhmic"],
  ),
  define(
    "ac-dc-power",
    "DC: P = U × I; AC: P = U_rms × I_rms × λ",
    [
      {
        ...field("supply", ["1"]),
        choices: [
          { value: 0, labelKey: "calcDc" },
          { value: 1, labelKey: "calcAc" },
        ],
      },
      field("voltage", ["V", "kV", "mV"]),
      current(),
      fraction("powerFactor"),
    ],
    (q) => {
      if (n(q.supply) === 0 && n(q.powerFactor) !== 1)
        bad("calcErrorDcPowerFactor", "powerFactor");
      return {
        values: [
          out("activePower", q.voltage.mul(q.current).mul(q.powerFactor), "W"),
        ],
      };
    },
    ["ohm", "pf"],
    ["calcAssumptionAcDc"],
  ),
  define(
    "single-phase-power",
    "S = U × I; P = S × cosφ; Q = S × √(1 − cos²φ)",
    [voltage(), current(), fraction("powerFactor")],
    (q) => acPower(q, 1),
    ["power", "reactive"],
    [steady],
  ),
  define(
    "three-phase-power",
    "S = √3 × U_LL × I; P = S × cosφ; Q = S × √(1 − cos²φ)",
    [voltage(), current(), fraction("powerFactor")],
    (q) => acPower(q, Math.sqrt(3)),
    ["power", "reactive"],
    [steady, "calcAssumptionBalanced"],
  ),
  define(
    "apparent-power",
    "S = √(P² + Q²)",
    [
      activePower(),
      field("reactivePower", ["var", "kvar"], { min: undefined }),
    ],
    (q) => ({
      values: [
        out(
          "apparentPower",
          q.activePower.pow(2).add(q.reactivePower.pow(2)).pow(0.5),
          "VA",
        ),
      ],
    }),
    ["reactive"],
    [steady],
  ),
  define(
    "reactive-power",
    "|Q| = √(S² − P²)",
    [activePower(), field("apparentPower", ["VA", "kVA", "MVA"])],
    (q) => {
      if (q.activePower.si > q.apparentPower.si)
        bad("calcErrorPowerTriangle", "activePower");
      // Factorization avoids catastrophic cancellation near unity power factor.
      const reactive = q.apparentPower
        .sub(q.activePower)
        .mul(q.apparentPower.add(q.activePower))
        .pow(0.5);
      return { values: [out("reactivePower", reactive, "var")] };
    },
    ["reactive"],
    [steady, "calcAssumptionReactiveMagnitude"],
  ),
  define(
    "power-factor",
    "λ = P / S",
    [activePower(), positive("apparentPower", ["VA", "kVA", "MVA"])],
    (q) => {
      if (q.activePower.si > q.apparentPower.si)
        bad("calcErrorPowerTriangle", "activePower");
      return {
        values: [out("powerFactor", q.activePower.div(q.apparentPower), "1")],
      };
    },
    ["pf"],
    ["calcAssumptionTruePowerFactor"],
  ),
  define(
    "voltage-drop",
    "ΔU = b × I × L × (r × cosφ + x × sinφ); b = 2 (1φ), √3 (3φ); ΔU% = 100 × ΔU / U",
    [
      phases(),
      voltage(),
      current(),
      field("length", ["m", "mm", "km"]),
      field("resistancePerLength", ["ohm/m", "ohm/km"]),
      field("reactancePerLength", ["ohm/m", "ohm/km"]),
      fraction("powerFactor"),
      fraction("dropLimit", true),
    ],
    (q) => {
      const impedance = q.resistancePerLength
        .mul(q.powerFactor)
        .add(q.reactancePerLength.scale(sinFromPf(q.powerFactor)));
      const drop = q.current
        .mul(q.length)
        .mul(impedance)
        .scale(n(q.phases) === 3 ? Math.sqrt(3) : 2);
      const ratio = drop.div(q.voltage);
      return {
        values: [
          out("voltageDrop", drop, "V"),
          out("voltageDropPercent", ratio, "%"),
        ],
        checks: [check("voltageDrop", withinComputedLimit(ratio, q.dropLimit))],
        warnings: drop.si >= q.voltage.si ? ["calcWarningLargeDrop"] : [],
      };
    },
    ["drop"],
    [
      steady,
      "calcAssumptionBalanced",
      "calcAssumptionOneWayLength",
      "calcAssumptionLagging",
      explicit,
    ],
    true,
  ),
  define(
    "cable-resistance",
    "R = ρ_ref × L / A × (1 + α × ΔT)",
    [
      positive("resistivity", ["ohm*mm2/m", "ohm*m"]),
      field("length", ["m", "mm", "km"]),
      positive("area", ["mm2", "m2"]),
      field("temperatureCoefficient", ["1/K"], { min: undefined }),
      field("temperatureRise", ["K"], { min: undefined }),
    ],
    (q) => {
      const factor = one.add(q.temperatureCoefficient.mul(q.temperatureRise));
      if (factor.si <= 0) bad("calcErrorTemperature", "temperatureRise");
      return {
        values: [
          out(
            "resistance",
            q.resistivity.mul(q.length).div(q.area).mul(factor),
            "ohm",
          ),
        ],
      };
    },
    ["resistance"],
    ["calcAssumptionLinearTemperature", "calcAssumptionOneConductor", explicit],
    true,
  ),
  define(
    "load-current",
    "I = P / (b × U × λ); b = 1 (1φ), √3 (3φ)",
    [phases(), voltage(), activePower(), powerFactor()],
    (q) => ({
      values: [
        out(
          "current",
          q.activePower.div(q.voltage.mul(q.powerFactor).scale(phaseFactor(q))),
          "A",
        ),
      ],
    }),
    ["power"],
    ["calcAssumptionElectricalInput", "calcAssumptionBalanced"],
  ),
  define(
    "circuit-loading",
    "I_allow = I_rating × k_allow; loading = I / I_allow",
    [
      current(),
      positive("ratedCurrent", ["A", "mA", "kA"]),
      fraction("allowedLoading", true),
    ],
    (q) => {
      const allowed = q.ratedCurrent.mul(q.allowedLoading);
      return {
        values: [
          out("allowedCurrent", allowed, "A"),
          out("loadingPercent", q.current.div(allowed), "%"),
          out("currentMargin", allowed.sub(q.current), "A"),
        ],
        checks: [
          check("currentLoading", withinComputedLimit(q.current, allowed)),
        ],
      };
    },
    ["cable"],
    ["calcAssumptionLoadingLimit", explicit],
    true,
  ),
  define(
    "transformer-sizing",
    "S_min = P × h / (λ × k_loading)",
    [
      activePower(),
      powerFactor(),
      headroom(),
      fraction("allowedLoading", true),
    ],
    (q) => ({
      values: [
        out(
          "requiredApparentPower",
          q.activePower
            .mul(q.headroom)
            .div(q.powerFactor.mul(q.allowedLoading)),
          "kVA",
        ),
      ],
    }),
    ["power", "demand"],
    ["calcAssumptionTransformer", explicit],
    true,
  ),
  define(
    "motor-full-load",
    "P_in = P_shaft / η; I = P_shaft / (b × U × η × cosφ)",
    [
      phases(),
      voltage(),
      field("shaftPower", ["W", "kW", "MW"]),
      fraction("efficiency", true),
      powerFactor(),
    ],
    (q) => {
      const input = q.shaftPower.div(q.efficiency);
      return {
        values: [
          out("activePower", input, "W"),
          out(
            "current",
            input.div(q.voltage.mul(q.powerFactor).scale(phaseFactor(q))),
            "A",
          ),
        ],
      };
    },
    ["motor", "power"],
    [steady, "calcAssumptionMotorNameplate", explicit],
    true,
  ),
  define(
    "motor-starting",
    "I_start = I_FLC × k_start; S_start = b × U × I_start",
    [
      phases(),
      voltage(),
      current(),
      field("startingMultiplier", ["1"], { min: 1 }),
    ],
    (q) => {
      const start = q.current.mul(q.startingMultiplier);
      return {
        values: [
          out("startingCurrent", start, "A"),
          out(
            "startingApparentPower",
            q.voltage.mul(start).scale(phaseFactor(q)),
            "kVA",
          ),
        ],
      };
    },
    ["power", "motor"],
    ["calcAssumptionStarting", explicit],
    true,
  ),
  define(
    "energy",
    "E = P × t × k_duty",
    [activePower(), time(), fraction("dutyCycle")],
    (q) => ({
      values: [
        out("energy", q.activePower.mul(q.duration).mul(q.dutyCycle), "kWh"),
      ],
    }),
    ["energy"],
    ["calcAssumptionConstantPower"],
  ),
  define(
    "cable-losses",
    "P_loss = n × I² × R; E_loss = P_loss × t",
    [
      current(),
      field("resistance", ["ohm", "mohm"]),
      count("conductors"),
      time(),
    ],
    (q) => {
      const loss = q.current.pow(2).mul(q.resistance).mul(q.conductors);
      return {
        values: [
          out("lossPower", loss, "W"),
          out("energy", loss.mul(q.duration), "kWh"),
        ],
      };
    },
    ["energy"],
    ["calcAssumptionCableLoss", explicit],
    true,
  ),
  define(
    "short-circuit",
    "|Z| = √(R² + X²); I_sym = c × U_LL / (√3 × |Z|)",
    [
      voltage(),
      field("sourceResistance", ["ohm", "mohm"]),
      field("sourceReactance", ["ohm", "mohm"]),
      positive("voltageFactor", ["1"]),
    ],
    (q) => {
      const z = q.sourceResistance
        .pow(2)
        .add(q.sourceReactance.pow(2))
        .pow(0.5);
      if (z.si <= 0) bad("calcErrorImpedance");
      return {
        values: [
          out("impedance", z, "ohm"),
          out(
            "faultCurrent",
            q.voltage
              .mul(q.voltageFactor)
              .div(z)
              .scale(1 / Math.sqrt(3)),
            "kA",
          ),
        ],
      };
    },
    ["fault"],
    ["calcAssumptionFaultModel", explicit],
    true,
  ),
  define(
    "protective-coordination",
    "Check I_fault < I_selectivity; I_fault ≤ I_breaking (manufacturer-declared conditions only)",
    [
      field("faultCurrent", ["A", "kA"]),
      positive("selectivityLimit", ["A", "kA"]),
      positive("breakingCapacity", ["A", "kA"]),
    ],
    (q) => ({
      values: [
        out("selectivityMargin", q.selectivityLimit.sub(q.faultCurrent), "kA"),
        out("breakingMargin", q.breakingCapacity.sub(q.faultCurrent), "kA"),
      ],
      checks: [
        check("selectivity", q.faultCurrent.si < q.selectivityLimit.si),
        check("breakingCapacity", q.faultCurrent.si <= q.breakingCapacity.si),
      ],
    }),
    ["selectivity"],
    [
      "calcAssumptionManufacturerPair",
      "calcAssumptionCoordinationScope",
      explicit,
    ],
    true,
  ),
  define(
    "cable-sizing",
    "k = k_T × k_group × k_install; I_z = I_table × k; I_table,min = I_n / k; check I_b ≤ I_n ≤ I_z",
    [
      current(),
      positive("ratedCurrent", ["A", "kA"]),
      positive("tabulatedAmpacity", ["A", "kA"]),
      positive("temperatureFactor", ["1"]),
      positive("groupingFactor", ["1"]),
      positive("installationFactor", ["1"]),
      positive("area", ["mm2", "m2"]),
    ],
    (q) => {
      const factor = q.temperatureFactor
        .mul(q.groupingFactor)
        .mul(q.installationFactor);
      const capacity = q.tabulatedAmpacity.mul(factor);
      return {
        values: [
          out("candidateArea", q.area, "mm2"),
          out("correctedAmpacity", capacity, "A"),
          out("requiredTabulatedAmpacity", q.ratedCurrent.div(factor), "A"),
        ],
        checks: [
          check("loadProtection", q.current.si <= q.ratedCurrent.si),
          check(
            "ampacityProtection",
            withinComputedLimit(q.ratedCurrent, capacity),
          ),
        ],
      };
    },
    ["cable", "protection"],
    ["calcAssumptionCableCandidate", "calcAssumptionCableScope", explicit],
    true,
  ),
  define(
    "demand-diversity",
    "P_demand = P_connected × k_utilization × k_coincidence",
    [
      activePower(),
      fraction("utilizationFactor"),
      fraction("coincidenceFactor"),
    ],
    (q) => ({
      values: [
        out(
          "demandPower",
          q.activePower.mul(q.utilizationFactor).mul(q.coincidenceFactor),
          "kW",
        ),
      ],
    }),
    ["demand"],
    ["calcAssumptionDemand", explicit],
    true,
  ),
  define(
    "battery-autonomy",
    "E_usable = U × C_Ah × k_usable × η; t = E_usable / P_load",
    [
      voltage(),
      field("capacity", ["Ah", "mAh"]),
      fraction("usableFraction", true),
      fraction("efficiency", true),
      positive("activePower", ["W", "kW", "MW"]),
    ],
    (q) => {
      const energy = q.voltage
        .mul(q.capacity)
        .mul(q.usableFraction)
        .mul(q.efficiency);
      return {
        values: [
          out("usableEnergy", energy, "kWh"),
          out("autonomy", energy.div(q.activePower), "h"),
        ],
      };
    },
    ["battery", "energy"],
    ["calcAssumptionBattery", explicit],
    true,
  ),
  define(
    "ups-sizing",
    "S_min = P × h / λ; P_min = P × h; C_Ah,min = P × t / (U_bat × η × k_usable)",
    [
      activePower(),
      powerFactor(),
      headroom(),
      time(),
      positive("batteryVoltage", ["V", "kV"]),
      fraction("efficiency", true),
      fraction("usableFraction", true),
    ],
    (q) => ({
      values: [
        out(
          "requiredApparentPower",
          q.activePower.mul(q.headroom).div(q.powerFactor),
          "kVA",
        ),
        out("requiredActivePower", q.activePower.mul(q.headroom), "kW"),
        out(
          "requiredCapacity",
          q.activePower
            .mul(q.duration)
            .div(q.batteryVoltage.mul(q.efficiency).mul(q.usableFraction)),
          "Ah",
        ),
      ],
    }),
    ["power", "battery", "energy", "ups"],
    ["calcAssumptionUps", "calcAssumptionBattery", explicit],
    true,
  ),
  define(
    "generator-sizing",
    "P_min = P × h / k_derate; S_steady = P × h / (λ × k_derate); S_min = max(S_steady, S_start / k_derate)",
    [
      activePower(),
      powerFactor(),
      headroom(),
      fraction("derating", true),
      field("startingApparentPower", ["VA", "kVA", "MVA"]),
    ],
    (q) => {
      const requiredP = q.activePower.mul(q.headroom).div(q.derating);
      const steadyS = requiredP.div(q.powerFactor);
      const startingS = q.startingApparentPower.div(q.derating);
      return {
        values: [
          out("requiredActivePower", requiredP, "kW"),
          out(
            "requiredApparentPower",
            steadyS.si >= startingS.si ? steadyS : startingS,
            "kVA",
          ),
        ],
      };
    },
    ["power", "generator"],
    ["calcAssumptionGenerator", explicit],
    true,
  ),
  define(
    "lighting-load",
    "P_total = n × P_fixture; S = P_total / λ; I = S / (b × U); E = P_total × t",
    [
      phases(),
      voltage(),
      field("fixturePower", ["W", "kW"]),
      count("fixtures"),
      powerFactor(),
      time(),
    ],
    (q) => {
      const p = q.fixturePower.mul(q.fixtures);
      const s = p.div(q.powerFactor);
      return {
        values: [
          out("activePower", p, "W"),
          out("apparentPower", s, "VA"),
          out("current", s.div(q.voltage).scale(1 / phaseFactor(q)), "A"),
          out("energy", p.mul(q.duration), "kWh"),
        ],
      };
    },
    ["power", "energy"],
    ["calcAssumptionLighting", "calcAssumptionBalanced"],
  ),
  define(
    "earthing",
    "R_ring ≈ 2 × ρ_soil / L_ring (buried ring in homogeneous soil)",
    [
      positive("soilResistivity", ["ohm*m"]),
      positive("length", ["m", "mm", "km"]),
    ],
    (q) => ({
      values: [
        out("earthResistance", q.soilResistivity.div(q.length).scale(2), "ohm"),
      ],
    }),
    ["earth"],
    ["calcAssumptionEarthRing", explicit],
    true,
  ),
];

export function calculatorById(id: string): Calculator {
  const calculator = calculatorRegistry.find((item) => item.id === id);
  if (!calculator) bad("calcErrorUnknownCalculator");
  return calculator;
}
export function methodReference(id: string): string {
  return `adiguneplanai:calculation:${calculatorById(id).id}:${CALCULATION_VERSION}`;
}

export function calculate(
  id: string,
  inputs: CalculationInputs,
  inputUnits: CalculationUnits,
  evidence: readonly string[] = [],
): CalculationResult {
  const calculator = calculatorById(id);
  const issues: CalculationIssue[] = [];
  const q: Quantities = {};
  if (
    !inputs ||
    typeof inputs !== "object" ||
    Array.isArray(inputs) ||
    !inputUnits ||
    typeof inputUnits !== "object" ||
    Array.isArray(inputUnits)
  )
    bad("calcErrorInvalidInput");
  const expectedKeys = calculator.inputs.map((input) => input.key);
  for (const key of new Set([
    ...Object.keys(inputs),
    ...Object.keys(inputUnits),
  ])) {
    if (!expectedKeys.includes(key))
      issues.push({ code: "calcErrorUnknownInput", field: key });
  }
  for (const input of calculator.inputs) {
    const value = inputs[input.key];
    const name = inputUnits[input.key];
    if (!Object.hasOwn(inputs, input.key)) {
      issues.push({ code: "calcErrorMissingInput", field: input.key });
      continue;
    }
    if (typeof value !== "number" || !Number.isFinite(value)) {
      issues.push({ code: "calcErrorInvalidInput", field: input.key });
      continue;
    }
    if (
      !Object.hasOwn(inputUnits, input.key) ||
      typeof name !== "string" ||
      !isUnit(name) ||
      !input.units.includes(name)
    ) {
      issues.push({ code: "calcErrorUnit", field: input.key });
      continue;
    }
    try {
      const quantity = Quantity.of(value, name);
      const normalized = quantity.in(input.units[0]);
      if (
        (input.min !== undefined &&
          (input.exclusiveMin
            ? normalized <= input.min
            : normalized < input.min)) ||
        (input.max !== undefined && normalized > input.max) ||
        (input.integer && !Number.isInteger(normalized)) ||
        (input.choices &&
          !input.choices.some((choice) => choice.value === normalized))
      ) {
        issues.push({ code: "calcErrorRange", field: input.key });
        continue;
      }
      q[input.key] = quantity;
    } catch {
      issues.push({ code: "calcErrorNumeric", field: input.key });
    }
  }
  if (
    !Array.isArray(evidence) ||
    evidence.length > 50 ||
    evidence.some(
      (note) =>
        typeof note !== "string" || note.trim().length < 8 || note.length > 900,
    )
  )
    bad("calcErrorEvidence");
  const notes = evidence.map((note) => note.trim());
  if (calculator.evidenceRequired && !notes.some((note) => note.length >= 8))
    issues.push({ code: "calcErrorEvidence" });
  if (issues.length) throw new CalculationError(issues);
  let computed: Computed;
  try {
    computed = calculator.run(q);
  } catch (error) {
    if (error instanceof CalculationError) throw error;
    bad("calcErrorNumeric");
  }
  if (computed.values.some((value) => !Number.isFinite(value.value)))
    bad("calcErrorNumeric");
  const checks = computed.checks ?? [];
  return {
    calculatorId: calculator.id,
    titleKey: calculator.titleKey,
    methodReference: methodReference(id),
    classification: checks.length ? "limited-check" : "estimate",
    inputs: { ...inputs },
    units: { ...inputUnits },
    formula: calculator.formula,
    values: computed.values,
    checks,
    assumptionKeys: [...calculator.assumptionKeys],
    warningKeys: [
      "calcWarningEstimate",
      ...(calculator.evidenceRequired ? ["calcWarningEvidence"] : []),
      ...(checks.some((item) => !item.passed)
        ? ["calcWarningCheckFailed"]
        : []),
      ...(computed.warnings ?? []),
    ],
    evidence: notes,
    sources: calculator.sourceIds.map((sourceId) => ({
      ...calculationSources[sourceId],
    })),
  };
}

/** Native records deliberately contain inputs and exact method identity, not untrusted cached outputs. */
export function calculationToRecord(
  result: CalculationResult,
  id: string,
  name: string,
): CalculationRecord {
  if (
    !/^[A-Za-z0-9_.:-]{1,128}$/.test(id) ||
    !name.trim() ||
    name.trim().length > 160
  )
    bad("calcErrorRecord");
  // Recompute before saving: callers cannot smuggle altered results or method references into a record.
  const verified = calculate(
    result.calculatorId,
    result.inputs,
    result.units,
    result.evidence,
  );
  if (verified.methodReference !== result.methodReference)
    bad("calcErrorMethod");
  return {
    id,
    name: name.trim(),
    kind: result.calculatorId,
    inputs: { ...verified.inputs },
    units: { ...verified.units },
    assumptions: [
      ...verified.assumptionKeys.map((key) => `assumption:${key}`),
      ...verified.evidence.map((note) => `evidence:${note}`),
    ],
    methodReference: verified.methodReference,
  };
}
export function calculateRecord(record: CalculationRecord): CalculationResult {
  const calculator = calculatorById(record.kind);
  if (record.methodReference !== methodReference(calculator.id))
    bad("calcErrorMethod");
  if (
    !Array.isArray(record.assumptions) ||
    record.assumptions.some((item) => typeof item !== "string")
  )
    bad("calcErrorRecord");
  const expected = calculator.assumptionKeys.map((key) => `assumption:${key}`);
  const saved = record.assumptions.filter((item) =>
    item.startsWith("assumption:"),
  );
  if (
    saved.length !== expected.length ||
    saved.some((item, index) => item !== expected[index]) ||
    record.assumptions.some(
      (item) =>
        !item.startsWith("assumption:") && !item.startsWith("evidence:"),
    )
  )
    bad("calcErrorRecord");
  return calculate(
    calculator.id,
    record.inputs,
    record.units,
    record.assumptions
      .filter((item) => item.startsWith("evidence:"))
      .map((item) => item.slice(9)),
  );
}

/** Structured, full-precision export. Consumers can localize the stable message keys. */
export function calculationReport(record: CalculationRecord): {
  schema: "adiguneplanai-calculation-report/1";
  record: CalculationRecord;
  result: CalculationResult;
} {
  return {
    schema: "adiguneplanai-calculation-report/1",
    record: structuredClone(record),
    result: calculateRecord(record),
  };
}
