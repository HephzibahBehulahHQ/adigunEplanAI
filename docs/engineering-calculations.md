# Engineering calculation methods (M8)

The registry in `packages/engineering-core/calculations.ts` implements the 25
calculation categories in specification part 8. All results are **educational
estimates or limited checks of explicitly supplied conditions**. The application
does not offer a verified-design or certification status. A source note is a
user declaration, not an independently verified manufacturer dataset.

## Units and numerical behavior

`packages/engineering-core/quantities.ts` is a dependency-free dimensional
numerical library. It stores SI values with mass, length, time, current and
temperature exponents; multiplication/division combine dimensions and addition
and conversion require compatible dimensions. Input metadata additionally keeps
semantically distinct W, VA and var fields separate. Supported prefixes include
mA/A/kA, W/kW/MW, mm/m/km, mm²/m², Ω/m and Ω/km, and Ah/mAh. Energy calculations
convert charge and duration through seconds. A unit change in the form converts
the entered physical value; it does not silently reinterpret the number.

Unknown fields, missing values or units, unsupported units, nonfinite values,
invalid discrete choices, range violations, zero denominators, nonphysical power
triangles, overflow and underflow fail explicitly. No engineering inputs are
prepopulated. Neither material resistivity nor temperature, grouping,
installation, voltage, utilization, coincidence or starting factors are inferred.

Calculations use JavaScript binary64 arithmetic. UI values use up to ten
significant digits; JSON and CSV exports retain the full computed numeric value.
This numerical precision does not imply accuracy of the supplied source data.
Inclusive limits derived by arithmetic allow a relative roundoff tolerance of
eight binary64 epsilons. This prevents an exact 50 A × 0.7 × 0.8 = 28 A boundary
from failing because its binary representation is 27.999999999999996 A. It is
not an engineering allowance. Manufacturer selectivity and direct comparisons
between entered limits remain strict.

## Implemented methods and limits

| Category | Implemented calculation | Required interpretation or limit |
| --- | --- | --- |
| Ohm's law | I = U/R; P = UI | Linear constant-resistance DC load; solves current and power. |
| AC/DC power | P = UIλ, with λ = 1 for DC | AC inputs are single-phase RMS values and true power factor. |
| Single-phase power | S = UI; P = S cosφ; Q = S√(1−cos²φ) | Sinusoidal steady state; Q is a magnitude. |
| Three-phase power | S = √3 U_LL I; P and Q from S and cosφ | Balanced sinusoidal load and line voltage. |
| Apparent power | S = √(P²+Q²) | Sinusoidal power triangle; signed Q is accepted. |
| Reactive power | \|Q\| = √((S−P)(S+P)) | Rejects P>S; direction cannot be inferred from magnitudes. |
| Power factor | λ = P/S | True power factor; not automatically displacement cosφ. |
| Voltage drop | ΔU = bIL(r cosφ+x sinφ), b = 2 or √3 | One-way length, lagging load, supplied operating-temperature/frequency r and x, supplied drop limit. |
| Cable resistance | R = ρL/A · (1+αΔT) | One uniform conductor; supplied material reference temperature and linear correction range. |
| Load current | I = P/(bUλ), b = 1 or √3 | P is electrical input power; balanced load for three-phase. |
| Circuit loading | I_allow = I_rating k; loading = I/I_allow | Supplied permitted loading; no assumed 80% rule. |
| Transformer sizing | S_min = Ph/(λ k_loading) | Steady-load estimate; no product selection, harmonic, inrush or thermal validation. |
| Motor full-load current | P_in = P_shaft/η; I = P_in/(bU cosφ) | Supplied nameplate efficiency and power factor at the operating point. |
| Motor starting | I_start = I_FLC k_start; S_start = bUI_start | Supplied starting-current multiplier; no dynamic starting simulation. |
| Energy | E = Pt k_duty | Constant power while on. |
| Cable losses | P_loss = nI²R; E_loss = P_loss t | n equally loaded conductors; supplied individual resistance and RMS current. |
| Short circuit | I_sym = cU_LL/(√3√(R²+X²)) | Single-source balanced three-phase impedance estimate. c is an explicit voltage multiplier. No IEC 60909 compliance claim. |
| Protective coordination | I_fault < I_selectivity; I_fault ≤ I_breaking | Thresholds must match the exact manufacturer device pair, settings, voltage and conditions. Equality at the selectivity limit is not accepted. |
| Cable sizing | I_z = I_table k_T k_group k_install; I_table,min = I_n/k | Candidate ampacity check, with supplied size and matching source table. Checks I_b ≤ I_n ≤ I_z only. |
| Demand/diversity | P_demand = P_connected k_utilization k_coincidence | One defined load group; coincidence is 0–1, not reciprocal diversity. |
| Battery autonomy | E_usable = U C_Ah k_usable η; t = E_usable/P | Nominal voltage, constant load and supplied usable fraction/efficiency. |
| UPS sizing | P_min = Ph; S_min = Ph/λ; C_Ah,min = Pt/(U_bat η k_usable) | Battery supports the entered load/runtime; h applies to UPS rating only. Check both W and VA product ratings. |
| Generator sizing | P_min = Ph/k_derate; S_min = max(Ph/(λ k_derate), S_start/k_derate) | A steady-load/VA envelope, not transient sizing. S_start includes the entire coincident starting load. |
| Lighting load | P = nP_fixture; S=P/λ; I=S/(bU); E=Pt | Fixture power includes driver losses; no illuminance or emergency-lighting assessment. |
| Earthing | R_ring ≈ 2ρ_soil/L_ring | Buried ring in homogeneous soil only; representative measured soil resistivity and field verification required. |

Transformer, UPS and generator multipliers are explicit user planning allowances
applied to elementary power/energy relations. They are not a manufacturer's
selection algorithm or a standard-mandated sizing rule.

## Sources

Primary references were consulted on **2026-11-06**. The engine includes these
URLs and access date in every relevant report. Equations are implemented from
the stated physical models; no copyrighted standard tables are embedded.

- [Fluke: Ohm's law](https://www.fluke.com/en-us/learn/blog/electrical/what-is-ohms-law)
- [Schneider Electric: installed apparent power](https://www.electrical-installation.org/enwiki/Installed_apparent_power_(kVA))
- [Schneider Electric: true power factor](https://www.electrical-installation.org/enwiki/Definition_of_Power_Factor)
- [Schneider Electric: reactive power](https://www.electrical-installation.org/enwiki/Definition_of_reactive_power)
- [Schneider Electric: voltage drop](https://www.electrical-installation.org/enwiki/Calculation_of_voltage_drop_in_steady_load_conditions)
- [Schneider Electric: cable sizing](https://www.electrical-installation.org/enwiki/General_method_for_cable_sizing)
- [Schneider Electric: protective-device and conductor conditions](https://www.electrical-installation.org/enwiki/Practical_values_for_a_protective_scheme)
- [Schneider Electric: three-phase short-circuit current](https://www.electrical-installation.org/enwiki/3-phase_short-circuit_current_(Isc)_at_any_point_within_a_LV_installation)
- [Schneider Electric: protective-device coordination](https://www.electrical-installation.org/enwiki/Coordination_between_circuit-breakers)
- [Schneider Electric: utilization and coincidence factors](https://www.electrical-installation.org/enwiki/Example_of_application_of_factors_ku_and_ks)
- [Schneider Electric: earth electrodes](https://www.electrical-installation.org/enwiki/Installation_and_measurements_of_earth_electrodes)
- [European Commission: motor efficiency](https://energy-efficient-products.ec.europa.eu/product-list/electric-motors_en)
- [Victron Energy: battery charge, voltage and energy data](https://www.victronenergy.com/media/pg/Lithium_Battery_Smart/en/technical-data.html)
- [Eaton: UPS capacity and runtime sizing](https://www.eaton.com/us/en-us/products/backup-power-ups-surge-it-power-distribution/backup-power-ups/ups-sizing-guide.html)
- [Cummins: motor-starting capability and transient sizing requirements](https://mart.cummins.com/imagelibrary/data/assetfiles/0057945.pdf)
- [OpenStax: electrical energy and power](https://openstax.org/books/university-physics-volume-2/pages/9-5-electrical-energy-and-power)
- [OpenStax: resistivity and temperature correction](https://openstax.org/books/university-physics-volume-2/pages/9-3-resistivity-and-resistance)

## Native records, reports and validation

`calculate(id, inputs, units, evidence)` returns values, limited checks, formula,
assumption/warning localization keys, source notes and reference URLs.
`calculationToRecord(result, id, name)` stores the inputs, units, declared evidence
and exact `adiguneplanai:calculation:<id>:1.0.0` method identity in the native
project. The standard assumption identifiers are retained with the record.
`calculateRecord(record)` refuses mismatched method versions or altered
assumption lists and recomputes outputs. Numerical method changes require a new
version; old results must not silently change.

`calculationReport(record)` exports the native record and a fresh result with
report schema `adiguneplanai-calculation-report/1`. JSON and CSV exports include
inputs, units, formula, version, values, checks, limitations, evidence and sources.
CSV user-controlled cells pass through the shared spreadsheet-formula escaping
utility. Saving updates the native project through its existing transaction,
undo/redo and persistence mechanisms.

`tests/unit/calculations.test.mjs` contains independently evaluated literal
reference values for every registry category, invalid boundaries, missing
values, incorrect units, prefix/area/charge/time conversions, zero-load and
power-factor endpoints, phase variants, failed limit checks, mandatory source
notes, numerical failure, version rejection and native serialization replay.

## Data that remain external

Verified installation-method ampacity tables, complete correction factors,
protective-device curves/selectivity tables, utility fault impedances, motor
starting curves, battery discharge data, UPS/generator performance and measured
site soil data must come from applicable sources. This release does not include
those datasets. Numerical threshold checks do not establish full coordination,
thermal fault withstand, disconnection times, touch/step safety or regulatory
compliance. Those assessments cannot truthfully be accepted as complete merely
because an entered inequality is satisfied.
