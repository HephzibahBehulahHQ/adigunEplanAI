import {
  serializeProject,
  validateProject,
  type Project,
} from "../electrical-model/project.ts";
import { validateMeshGeometry } from "./mesh.ts";

export function assignPanelMesh(
  project: Project,
  placementId: string,
  mesh: Project["panelMeshes"][number],
): Project {
  const next = structuredClone(project);
  const placement = next.equipment3d.find((item) => item.id === placementId);
  if (!placement) throw new Error("Select a cabinet device first");
  const existing = next.panelMeshes.find((item) => item.id === mesh.id);
  if (existing && JSON.stringify(existing) !== JSON.stringify(mesh))
    throw new Error("Model identity conflict");
  if (!existing) next.panelMeshes.push(structuredClone(mesh));
  placement.meshId = mesh.id;
  placement.dimensionSource = "mesh";
  placement.sizeMm = validateMeshGeometry(mesh);
  // Reject oversized native documents before changing the active project/history.
  serializeProject(next);
  return validateProject(next);
}

export function detachPanelMesh(
  project: Project,
  placementId: string,
): Project {
  const next = structuredClone(project);
  const placement = next.equipment3d.find((item) => item.id === placementId);
  if (!placement) throw new Error("Unknown cabinet device");
  delete placement.meshId;
  placement.dimensionSource = "manual";
  return validateProject(next);
}
