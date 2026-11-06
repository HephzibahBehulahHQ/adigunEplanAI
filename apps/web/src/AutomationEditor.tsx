import { useState } from "react";
import type { NativeProjects } from "./useNativeProjects";
import type { MessageKey } from "../../../packages/localization";
import type { Project } from "../../../packages/electrical-model/project.ts";
import {
  plcKinds,
  createPlcModule,
  removePlcModule,
  savePlcAddress,
  removePlcAddress,
  plcWiringSchedule,
  saveAutomationNote,
  removeAutomationNote,
  type PlcKind,
} from "../../../packages/automation/plc.ts";
import { csvReport } from "../../../packages/reporting/csv.ts";
import { downloadFile } from "./download";

export function AutomationEditor({
  native,
  t,
}: {
  native: NativeProjects;
  t: (key: MessageKey) => string;
}) {
  const [moduleId, setModuleId] = useState("");
  const [addressId, setAddressId] = useState("");
  const [noteId, setNoteId] = useState("");
  const p = native.project;
  if (!p) return null;
  const module =
    p.plcModules.find((item) => item.id === moduleId) ?? p.plcModules[0];
  const address = p.plcAddresses.find(
    (item) => item.id === addressId && item.moduleId === module?.id,
  );
  const note = p.automationNotes.find((item) => item.id === noteId);
  const schedule = plcWiringSchedule(p);
  const kindKey: Record<PlcKind, MessageKey> = {
    cpu: "plcCpu",
    "digital-input": "plcDi",
    "digital-output": "plcDo",
    "analog-input": "plcAi",
    "analog-output": "plcAo",
    communication: "plcCommunication",
  };
  const notes = [
    "interlock",
    "emergency-stop",
    "motor-control",
    "sequence",
    "safety",
  ] as const;
  const noteKey: Record<(typeof notes)[number], MessageKey> = {
    interlock: "plcInterlock",
    "emergency-stop": "plcEmergency",
    "motor-control": "plcMotor",
    sequence: "plcSequence",
    safety: "plcSafety",
  };
  return (
    <section
      className="engineering-tools automation-editor"
      aria-label={t("automationDesign")}
    >
      <h2>{t("automationDesign")}</h2>
      <p>{t("plcScope")}</p>
      <form
        aria-label={t("plcCreateModule")}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          native.update((project) =>
            createPlcModule(project, {
              kind: String(data.get("kind")) as PlcKind,
              reference: String(data.get("reference")),
              name: String(data.get("name")),
              pageId: String(data.get("page")),
            }),
          );
        }}
      >
        <h3>{t("plcCreateModule")}</h3>
        <label>
          {t("plcModuleKind")}
          <select name="kind" aria-label={t("plcModuleKind")}>
            {plcKinds.map((kind) => (
              <option key={kind} value={kind}>
                {t(kindKey[kind])}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("reference")}
          <input name="reference" required maxLength={160} />
        </label>
        <label>
          {t("device")}
          <input name="name" required maxLength={160} />
        </label>
        <label>
          {t("pageName")}
          <select name="page" aria-label={t("pageName")}>
            {p.pages
              .filter(
                (page) =>
                  p.documents.find((doc) => doc.id === page.documentId)
                    ?.kind === "schematic",
              )
              .map((page) => (
                <option key={page.id} value={page.id}>
                  {page.name}
                </option>
              ))}
          </select>
        </label>
        <button>{t("plcCreateModule")}</button>
      </form>
      <label>
        {t("plcSelectedModule")}
        <select
          aria-label={t("plcSelectedModule")}
          value={module?.id ?? ""}
          onChange={(event) => {
            setModuleId(event.target.value);
            setAddressId("");
          }}
        >
          {p.plcModules.map((item) => (
            <option key={item.id} value={item.id}>
              {
                p.devices.find((device) => device.id === item.deviceId)
                  ?.reference
              }{" "}
              · {item.name}
            </option>
          ))}
        </select>
      </label>
      {module && (
        <>
          <p>
            {t("plcModuleChannels")}: {module.channelCount} ·{" "}
            {t("plcMappingNote")}
          </p>
          <button
            disabled={p.plcAddresses.some(
              (item) => item.moduleId === module.id,
            )}
            onClick={() =>
              native.update((project) => removePlcModule(project, module.id))
            }
          >
            {t("plcRemoveModule")}
          </button>
          <label>
            {t("plcSelectedAddress")}
            <select
              aria-label={t("plcSelectedAddress")}
              value={address?.id ?? ""}
              onChange={(event) => setAddressId(event.target.value)}
            >
              <option value="">{t("plcNewAddress")}</option>
              {p.plcAddresses
                .filter((item) => item.moduleId === module.id)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.address} · {item.name}
                  </option>
                ))}
            </select>
          </label>
          <form
            key={`${module.id}:${JSON.stringify(address)}`}
            aria-label={t("plcIoMapping")}
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const id = address?.id ?? crypto.randomUUID();
              const value: Project["plcAddresses"][number] = {
                id,
                moduleId: module.id,
                name: String(data.get("name")),
                channel: Number(data.get("channel")),
                address: String(data.get("address")),
                dataType: String(data.get("dataType")) as
                  "BOOL" | "INT" | "REAL" | "TIME",
                terminalIds: data.getAll("terminals").map(String),
                ...(data.get("signal")
                  ? { signalDeviceId: String(data.get("signal")) }
                  : {}),
              };
              if (native.update((project) => savePlcAddress(project, value)))
                setAddressId(id);
            }}
          >
            <h3>{t("plcIoMapping")}</h3>
            <label>
              {t("reportDescription")}
              <input
                name="name"
                required
                maxLength={160}
                defaultValue={address?.name ?? ""}
              />
            </label>
            <label>
              {t("reportChannel")}
              <input
                name="channel"
                required
                type="number"
                min={0}
                max={module.channelCount - 1}
                step={1}
                defaultValue={address?.channel ?? 0}
              />
            </label>
            <label>
              {t("reportAddress")}
              <input
                name="address"
                required
                maxLength={160}
                defaultValue={address?.address ?? ""}
              />
            </label>
            <label>
              {t("reportDataType")}
              <select
                name="dataType"
                aria-label={t("reportDataType")}
                defaultValue={
                  address?.dataType ??
                  (module.moduleKind?.startsWith("analog") ? "INT" : "BOOL")
                }
              >
                {["BOOL", "INT", "REAL", "TIME"].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              {t("plcMappedTerminals")}
              <select
                name="terminals"
                multiple
                aria-label={t("plcMappedTerminals")}
                defaultValue={address?.terminalIds ?? []}
              >
                {p.terminals
                  .filter((terminal) => terminal.deviceId === module.deviceId)
                  .map((terminal) => (
                    <option key={terminal.id} value={terminal.id}>
                      {terminal.designation} · {terminal.kind}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              {t("plcSignalDevice")}
              <select
                name="signal"
                aria-label={t("plcSignalDevice")}
                defaultValue={address?.signalDeviceId ?? ""}
              >
                <option value="">{t("plcNoSignalDevice")}</option>
                {p.devices
                  .filter((device) => device.id !== module.deviceId)
                  .map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.reference} · {device.name}
                    </option>
                  ))}
              </select>
            </label>
            <button>{t("plcSaveAddress")}</button>
            {address && (
              <button
                type="button"
                onClick={() => {
                  if (
                    native.update((project) =>
                      removePlcAddress(project, address.id),
                    )
                  )
                    setAddressId("");
                }}
              >
                {t("plcRemoveAddress")}
              </button>
            )}
          </form>
        </>
      )}
      <h3>{t("reportPlc")}</h3>
      <button
        onClick={() =>
          downloadFile(
            "plc-wiring-schedule.csv",
            csvReport([
              [
                t("reference"),
                t("reportChannel"),
                t("reportAddress"),
                t("reportDataType"),
                t("terminal"),
                t("plcSignalDevice"),
                t("documentedWires"),
              ],
              ...schedule.map((row) => [
                row.reference,
                row.channel,
                row.address,
                row.dataType,
                row.terminals.join("; "),
                row.signal,
                row.wireIds
                  .map((id) => p.wires.find((wire) => wire.id === id)!.name)
                  .join("; "),
              ]),
            ]),
            "text/csv;charset=utf-8",
          )
        }
      >
        {t("plcDownloadSchedule")}
      </button>
      <div className="native-table-scroll">
        <table className="native-bom" aria-label={t("reportPlc")}>
          <thead>
            <tr>
              {[
                "reference",
                "reportChannel",
                "reportAddress",
                "reportDataType",
                "terminal",
                "plcSignalDevice",
                "documentedWires",
              ].map((key) => (
                <th key={key}>{t(key as MessageKey)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedule.map((row) => (
              <tr key={row.id}>
                <td>{row.reference}</td>
                <td>{row.channel}</td>
                <td>{row.address}</td>
                <td>{row.dataType}</td>
                <td>{row.terminals.join(", ") || "—"}</td>
                <td>{row.signal ?? "—"}</td>
                <td>{row.wireIds.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3>{t("plcDocumentation")}</h3>
      <label>
        {t("plcSelectedNote")}
        <select
          aria-label={t("plcSelectedNote")}
          value={note?.id ?? ""}
          onChange={(event) => setNoteId(event.target.value)}
        >
          <option value="">{t("plcNewNote")}</option>
          {p.automationNotes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <form
        key={JSON.stringify(note) ?? "new-note"}
        aria-label={t("plcDocumentation")}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const id = note?.id ?? crypto.randomUUID();
          if (
            native.update((project) =>
              saveAutomationNote(project, {
                id,
                name: String(data.get("name")),
                kind: String(data.get("kind")) as (typeof notes)[number],
                description: String(data.get("description")),
                deviceIds: data.getAll("devices").map(String),
              }),
            )
          )
            setNoteId(id);
        }}
      >
        <label>
          {t("plcNoteName")}
          <input
            name="name"
            required
            maxLength={160}
            defaultValue={note?.name ?? ""}
          />
        </label>
        <label>
          {t("plcNoteKind")}
          <select
            name="kind"
            aria-label={t("plcNoteKind")}
            defaultValue={note?.kind ?? "interlock"}
          >
            {notes.map((value) => (
              <option key={value} value={value}>
                {t(noteKey[value])}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("plcAssociatedDevices")}
          <select
            name="devices"
            multiple
            required
            aria-label={t("plcAssociatedDevices")}
            defaultValue={note?.deviceIds ?? []}
          >
            {p.devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.reference}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("reportDescription")}
          <textarea
            name="description"
            required
            maxLength={4000}
            defaultValue={note?.description ?? ""}
          />
        </label>
        <button>{t("plcSaveNote")}</button>
        {note && (
          <button
            type="button"
            onClick={() => {
              if (
                native.update((project) =>
                  removeAutomationNote(project, note.id),
                )
              )
                setNoteId("");
            }}
          >
            {t("plcRemoveNote")}
          </button>
        )}
      </form>
    </section>
  );
}
