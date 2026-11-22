import { ductOccupancy } from "../../../packages/panel-engineering/estimates.ts";
import {
  featureVertices,
  panelFaceSize,
} from "../../../packages/panel-engineering/features.ts";
import {
  accessBounds,
  fitsRailMountingPlane,
  volumesIntersect,
} from "../../../packages/panel-engineering/geometry.ts";

Object.assign(window, { AdigunPanelEstimates: { ductOccupancy } });
Object.assign(window, {
  AdigunPanelGeometry: {
    accessBounds,
    featureVertices,
    fitsRailMountingPlane,
    panelFaceSize,
    volumesIntersect,
  },
});
