import { validateProject, type Project } from "./project.ts";

type Equipment = Project["equipment3d"][number];
const axes = ["x", "y", "z"] as const;

export function mountCabinetDevice(
  project: Project,
  placement: Equipment,
): Project {
  const enclosure = project.enclosures.find(
    ({ id }) => id === placement.enclosureId,
  );
  if (
    !enclosure ||
    !project.devices.some(({ id }) => id === placement.deviceId)
  )
    throw new Error("The cabinet and device must exist");
  if (
    project.equipment3d.some(({ deviceId }) => deviceId === placement.deviceId)
  )
    throw new Error("The device is already mounted");
  const limits = {
    x: enclosure.widthMm,
    y: enclosure.heightMm,
    z: enclosure.depthMm,
  };
  if (
    axes.some((axis) => {
      const start = placement.positionMm[axis];
      const size = placement.sizeMm[axis];
      return (
        !Number.isFinite(start) ||
        !Number.isFinite(size) ||
        start < 0 ||
        size <= 0 ||
        start + size > limits[axis]
      );
    })
  )
    throw new Error("Equipment must fit inside the cabinet");
  if (
    project.equipment3d.some(
      (existing) =>
        existing.enclosureId === placement.enclosureId &&
        axes.every(
          (axis) =>
            placement.positionMm[axis] <
              existing.positionMm[axis] + existing.sizeMm[axis] &&
            existing.positionMm[axis] <
              placement.positionMm[axis] + placement.sizeMm[axis],
        ),
    )
  )
    throw new Error("Equipment overlaps another mounted device");
  return validateProject({
    ...project,
    equipment3d: [...project.equipment3d, placement],
  });
}
