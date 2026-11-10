import { useRef, useState } from "react";
import type { Project } from "../../../packages/electrical-model/project.ts";
import type { MessageKey } from "../../../packages/localization";

export function CabinetMount({
  project,
  enclosure,
  mount,
  unmount,
  t,
}: {
  project: Project;
  enclosure: Project["enclosures"][number];
  mount: (placement: Project["equipment3d"][number]) => boolean;
  unmount: (id: string) => boolean;
  t: (key: MessageKey) => string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [failed, setFailed] = useState(false);
  const [editId, setEditId] = useState<string>();
  const placements = project.equipment3d.filter(
    (item) => item.enclosureId === enclosure.id,
  );
  const editing = placements.find((item) => item.id === editId);
  const mounted = new Set(project.equipment3d.map(({ deviceId }) => deviceId));
  const devices = project.devices.filter(({ id }) => !mounted.has(id));
  const fields = [
    ["x", "X (mm)", enclosure.widthMm, editing?.positionMm.x],
    ["y", "Y (mm)", enclosure.heightMm, editing?.positionMm.y],
    ["z", "Z (mm)", enclosure.depthMm, editing?.positionMm.z],
    ["width", t("cabinetWidth"), enclosure.widthMm, editing?.sizeMm.x],
    ["height", t("cabinetHeight"), enclosure.heightMm, editing?.sizeMm.y],
    ["depth", t("cabinetDepth"), enclosure.depthMm, editing?.sizeMm.z],
  ] as const;
  return (
    <>
      <button
        type="button"
        disabled={!devices.length}
        onClick={() => {
          setFailed(false);
          setEditId(undefined);
          dialog.current?.showModal();
        }}
      >
        {t("cabinetMount")}
      </button>
      {placements.length > 0 && (
        <details>
          <summary>{t("cabinetMountedDevices")}</summary>
          <div className="navigator-pages">
            {placements.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => {
                  setFailed(false);
                  setEditId(item.id);
                  dialog.current?.showModal();
                }}
              >
                {project.devices.find((device) => device.id === item.deviceId)
                  ?.reference ?? item.name}
              </button>
            ))}
          </div>
        </details>
      )}
      <dialog
        ref={dialog}
        aria-label={t(editing ? "cabinetEditMount" : "cabinetMount")}
      >
        <form
          key={editing?.id ?? "new"}
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const values = new FormData(form);
            const device = project.devices.find(
              ({ id }) => id === (editing?.deviceId ?? values.get("device")),
            );
            if (!device) return;
            const ok = mount({
              id: editing?.id ?? crypto.randomUUID(),
              name: editing?.name ?? device.name,
              deviceId: device.id,
              enclosureId: enclosure.id,
              positionMm: {
                x: Number(values.get("x")),
                y: Number(values.get("y")),
                z: Number(values.get("z")),
              },
              sizeMm: {
                x: Number(values.get("width")),
                y: Number(values.get("height")),
                z: Number(values.get("depth")),
              },
            });
            setFailed(!ok);
            if (ok) {
              form.reset();
              dialog.current?.close();
            }
          }}
        >
          {!editing && (
            <label>
              {t("device")}
              <select
                name="device"
                aria-label={t("device")}
                required
                defaultValue=""
              >
                <option value="" disabled>
                  {t("device")}
                </option>
                {devices.map(({ id, reference, name }) => (
                  <option value={id} key={id}>
                    {reference} · {name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {fields.map(([name, label, max, initial], index) => (
            <label key={name}>
              {label}
              <input
                name={name}
                type="number"
                min={index < 3 ? 0 : 0.01}
                max={max}
                step="any"
                defaultValue={initial}
                required
              />
            </label>
          ))}
          {failed && <p role="alert">{t("cabinetMountError")}</p>}
          <div className="dialog-actions">
            {editing && (
              <button
                type="button"
                onClick={() => {
                  if (unmount(editing.id)) dialog.current?.close();
                }}
              >
                {t("cabinetUnmount")}
              </button>
            )}
            <button type="button" onClick={() => dialog.current?.close()}>
              {t("cancel")}
            </button>
            <button type="submit">
              {t(editing ? "save" : "cabinetMount")}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
