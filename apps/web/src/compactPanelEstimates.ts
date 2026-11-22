import { ductOccupancy } from "../../../packages/panel-engineering/estimates.ts";
import { fitsRailMountingPlane } from "../../../packages/panel-engineering/geometry.ts";

Object.assign(window, { AdigunPanelEstimates: { ductOccupancy } });
Object.assign(window, { AdigunPanelGeometry: { fitsRailMountingPlane } });
