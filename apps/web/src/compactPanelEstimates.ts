import { ductOccupancy } from "../../../packages/panel-engineering/estimates.ts";
import { compactPanelObj } from "./compactPanelExport.ts";
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
    compactPanelObj,
    featureVertices,
    fitsRailMountingPlane,
    panelFaceSize,
    volumesIntersect,
  },
});
