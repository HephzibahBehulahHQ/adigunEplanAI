import { useRef, useState } from "react";
import type { Project } from "../../../packages/electrical-model/project.ts";
import type { MessageKey } from "../../../packages/localization";

export function CabinetMount({
  project,
  enclosure,
  mount,
  t,
}: {
  project: Project;
  enclosure: Project["enclosures"][number];
  mount: (placement: Project["equipment3d"][number]) => boolean;
  t: (key: MessageKey) => string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [failed, setFailed] = useState(false);
  const mounted = new Set(project.equipment3d.map(({ deviceId }) => deviceId));
  const devices = project.devices.filter(({ id }) => !mounted.has(id));
  const fields = [
    ["x", "X (mm)", enclosure.widthMm],
    ["y", "Y (mm)", enclosure.heightMm],
    ["z", "Z (mm)", enclosure.depthMm],
    ["width", t("cabinetWidth"), enclosure.widthMm],
    ["height", t("cabinetHeight"), enclosure.heightMm],
    ["depth", t("cabinetDepth"), enclosure.depthMm],
  ] as const;
  return (
    <>
      <button
        type="button"
        disabled={!devices.length}
        onClick={() => {
          setFailed(false);
          dialog.current?.showModal();
        }}
      >
        {t("cabinetMount")}
      </button>
      <dialog ref={dialog} aria-label={t("cabinetMount")}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const values = new FormData(form);
            const device = devices.find(
              ({ id }) => id === values.get("device"),
            );
            if (!device) return;
            const ok = mount({
              id: crypto.randomUUID(),
              name: device.name,
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
          {fields.map(([name, label, max], index) => (
            <label key={name}>
              {label}
              <input
                name={name}
                type="number"
                min={index < 3 ? 0 : 0.01}
                max={max}
                step="any"
                required
              />
            </label>
          ))}
          {failed && <p role="alert">{t("cabinetMountError")}</p>}
          <div className="dialog-actions">
            <button type="button" onClick={() => dialog.current?.close()}>
              {t("cancel")}
            </button>
            <button type="submit">{t("cabinetMount")}</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
