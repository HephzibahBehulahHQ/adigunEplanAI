export type ThermalAssumptions = {
  ambientC: number;
  heatTransferCoefficientWm2K: number;
  exposedAreaM2: number;
  additionalLossW: number;
  coolingW: number;
};

/** Steady state lumped heat balance; all assumptions must be user documented. */
export function heatBalance(
  lossesW: (number | undefined)[],
  assumptions: ThermalAssumptions,
) {
  if (
    !Object.values(assumptions).every(Number.isFinite) ||
    assumptions.heatTransferCoefficientWm2K <= 0 ||
    assumptions.exposedAreaM2 <= 0 ||
    assumptions.additionalLossW < 0 ||
    assumptions.coolingW < 0 ||
    lossesW.some(
      (value) => value !== undefined && (!Number.isFinite(value) || value < 0),
    )
  )
    throw new Error("Invalid thermal assumptions");
  const unknownLossCount = lossesW.filter((loss) => loss === undefined).length;
  const knownLossW = lossesW.reduce<number>(
    (total, loss) => total + (loss ?? 0),
    assumptions.additionalLossW,
  );
  const totalLossW = unknownLossCount ? null : knownLossW;
  const thermalConductance =
    assumptions.heatTransferCoefficientWm2K * assumptions.exposedAreaM2;
  if (
    !Number.isFinite(knownLossW) ||
    !Number.isFinite(thermalConductance) ||
    thermalConductance <= 0
  )
    throw new Error("Thermal calculation exceeds finite range");
  const riseK =
    totalLossW === null
      ? null
      : Math.max(0, totalLossW - assumptions.coolingW) / thermalConductance;
  if (
    riseK !== null &&
    (!Number.isFinite(riseK) || !Number.isFinite(assumptions.ambientC + riseK))
  )
    throw new Error("Thermal calculation exceeds finite range");
  return {
    knownLossW,
    unknownLossCount,
    totalLossW,
    riseK,
    estimatedInternalC: riseK === null ? null : assumptions.ambientC + riseK,
  };
}

/** Area estimate using entered cable outside diameters and usable duct area. */
export function ductOccupancy(
  cableDiametersMm: number[],
  usableCrossSectionMm2?: number,
  maximumFillPercent?: number,
) {
  if (
    cableDiametersMm.some(
      (diameter) => !Number.isFinite(diameter) || diameter <= 0,
    ) ||
    (usableCrossSectionMm2 !== undefined &&
      (!Number.isFinite(usableCrossSectionMm2) ||
        usableCrossSectionMm2 <= 0)) ||
    (maximumFillPercent !== undefined &&
      (!Number.isFinite(maximumFillPercent) ||
        maximumFillPercent <= 0 ||
        maximumFillPercent > 100))
  )
    throw new Error("Invalid duct occupancy assumptions");
  const occupiedMm2 = cableDiametersMm.reduce(
    (sum, diameter) => sum + (Math.PI * diameter ** 2) / 4,
    0,
  );
  const fillPercent =
    usableCrossSectionMm2 === undefined
      ? null
      : (occupiedMm2 / usableCrossSectionMm2) * 100;
  if (
    !Number.isFinite(occupiedMm2) ||
    (fillPercent !== null && !Number.isFinite(fillPercent))
  )
    throw new Error("Duct calculation exceeds finite range");
  return {
    cableCount: cableDiametersMm.length,
    occupiedMm2,
    fillPercent,
    exceedsLimit:
      fillPercent === null || maximumFillPercent === undefined
        ? null
        : fillPercent > maximumFillPercent,
  };
}
