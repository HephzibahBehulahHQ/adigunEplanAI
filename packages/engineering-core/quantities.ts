/** A deliberately small, dimensional numerical library for the supported electrical methods.
 * Values are stored in SI; addition/conversion reject unlike dimensions. No expression eval.
 * Dimensions are [mass, length, time, electric current, temperature].
 */
type Dimension = readonly [number, number, number, number, number];
type UnitDefinition = { scale: number; dimension: Dimension };
const scalar: Dimension = [0, 0, 0, 0, 0];
const voltage: Dimension = [1, 2, -3, -1, 0];
const current: Dimension = [0, 0, 0, 1, 0];
const resistance: Dimension = [1, 2, -3, -2, 0];
const power: Dimension = [1, 2, -3, 0, 0];
const energy: Dimension = [1, 2, -2, 0, 0];
const length: Dimension = [0, 1, 0, 0, 0];
const area: Dimension = [0, 2, 0, 0, 0];
const time: Dimension = [0, 0, 1, 0, 0];
const charge: Dimension = [0, 0, 1, 1, 0];
const unit = (scale: number, dimension: Dimension): UnitDefinition => ({
  scale,
  dimension,
});
export const units = {
  "1": unit(1, scalar),
  "%": unit(0.01, scalar),
  V: unit(1, voltage),
  mV: unit(0.001, voltage),
  kV: unit(1000, voltage),
  A: unit(1, current),
  mA: unit(0.001, current),
  kA: unit(1000, current),
  ohm: unit(1, resistance),
  mohm: unit(0.001, resistance),
  W: unit(1, power),
  kW: unit(1000, power),
  MW: unit(1e6, power),
  VA: unit(1, power),
  kVA: unit(1000, power),
  MVA: unit(1e6, power),
  var: unit(1, power),
  kvar: unit(1000, power),
  m: unit(1, length),
  mm: unit(0.001, length),
  km: unit(1000, length),
  m2: unit(1, area),
  mm2: unit(1e-6, area),
  s: unit(1, time),
  min: unit(60, time),
  h: unit(3600, time),
  J: unit(1, energy),
  Wh: unit(3600, energy),
  kWh: unit(3.6e6, energy),
  C: unit(1, charge),
  Ah: unit(3600, charge),
  mAh: unit(3.6, charge),
  "ohm*m": unit(1, [1, 3, -3, -2, 0]),
  "ohm*mm2/m": unit(1e-6, [1, 3, -3, -2, 0]),
  "ohm/m": unit(1, [1, 1, -3, -2, 0]),
  "ohm/km": unit(0.001, [1, 1, -3, -2, 0]),
  K: unit(1, [0, 0, 0, 0, 1]),
  "1/K": unit(1, [0, 0, 0, 0, -1]),
  "W/m2": unit(1, [1, 0, -3, 0, 0]),
} as const;
export type Unit = keyof typeof units;
export function isUnit(value: string): value is Unit {
  return Object.hasOwn(units, value);
}
const same = (a: Dimension, b: Dimension) =>
  a.every((value, index) => value === b[index]);
function finite(value: number): number {
  if (!Number.isFinite(value)) throw new Error("Non-finite quantity");
  return value;
}
export class Quantity {
  readonly si: number;
  readonly dimension: Dimension;
  constructor(si: number, dimension: Dimension) {
    this.si = finite(si);
    this.dimension = dimension;
  }
  static of(value: number, name: Unit): Quantity {
    const definition = units[name];
    if (!definition) throw new Error("Unknown unit");
    const si = finite(value) * definition.scale;
    if (value !== 0 && si === 0) throw new Error("Quantity underflow");
    return new Quantity(si, definition.dimension);
  }
  in(name: Unit): number {
    const definition = units[name];
    if (!definition || !same(this.dimension, definition.dimension))
      throw new Error("Incompatible unit");
    const value = finite(this.si / definition.scale);
    if (this.si !== 0 && value === 0) throw new Error("Quantity underflow");
    return value;
  }
  add(other: Quantity): Quantity {
    if (!same(this.dimension, other.dimension))
      throw new Error("Incompatible addition");
    return new Quantity(this.si + other.si, this.dimension);
  }
  sub(other: Quantity): Quantity {
    return this.add(other.scale(-1));
  }
  mul(other: Quantity): Quantity {
    const value = this.si * other.si;
    if (this.si !== 0 && other.si !== 0 && value === 0)
      throw new Error("Quantity underflow");
    return new Quantity(
      value,
      this.dimension.map(
        (v, i) => v + other.dimension[i],
      ) as unknown as Dimension,
    );
  }
  div(other: Quantity): Quantity {
    if (other.si === 0) throw new Error("Division by zero");
    const value = this.si / other.si;
    if (this.si !== 0 && value === 0) throw new Error("Quantity underflow");
    return new Quantity(
      value,
      this.dimension.map(
        (v, i) => v - other.dimension[i],
      ) as unknown as Dimension,
    );
  }
  scale(factor: number): Quantity {
    return this.mul(Quantity.of(factor, "1"));
  }
  pow(exponent: number): Quantity {
    if (!Number.isFinite(exponent)) throw new Error("Invalid exponent");
    const value = this.si ** exponent;
    if (this.si !== 0 && value === 0) throw new Error("Quantity underflow");
    return new Quantity(
      value,
      this.dimension.map((v) => v * exponent) as unknown as Dimension,
    );
  }
}
export function convert(value: number, from: Unit, to: Unit): number {
  return Quantity.of(value, from).in(to);
}
