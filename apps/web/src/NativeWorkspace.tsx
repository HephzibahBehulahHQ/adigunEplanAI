import { useRef, useState } from "react";
import type { MessageKey } from "../../../packages/localization";
import {
  maxProjectBytes,
  serializeProject,
} from "../../../packages/electrical-model/project.ts";
import { projectStorageKey } from "../../../packages/project-storage/repository.ts";
import type { NativeProjects } from "./useNativeProjects";
type Props = { native: NativeProjects; t: (key: MessageKey) => string };
export function ProjectTools({ native, t }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const file = useRef<HTMLInputElement>(null);
  return (
    <div className="native-tools">
      <button
        disabled={native.corrupt}
        onClick={() => dialog.current?.showModal()}
      >
        {t("newProject")}
      </button>
      <button onClick={() => file.current?.click()}>
        {t("importProject")}
      </button>
      <input
        hidden
        ref={file}
        type="file"
        accept=".json,.adeplan"
        aria-label={t("importProject")}
        onChange={async (e) => {
          const selected = e.target.files?.[0];
          if (!selected) return;
          try {
            if (selected.size > maxProjectBytes) native.invalidImport();
            else
              native.importText(await selected.text(), () =>
                window.confirm(t("confirmReplace")),
              );
          } catch {
            native.invalidImport();
          }
          e.target.value = "";
        }}
      />
      {native.project && (
        <>
          <button onClick={() => native.save()}>{t("save")}</button>
          <button
            onClick={() => {
              if (!native.project) return;
              const blob = new Blob([serializeProject(native.project)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const anchor = document.createElement("a");
              anchor.href = url;
              anchor.download = `${native.project.name.replace(/[^A-Za-z0-9_-]/g, "_")}.adeplan.json`;
              anchor.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
          >
            {t("exportProject")}
          </button>
          <button disabled={!native.canUndo} onClick={() => native.undo()}>
            {t("undo")}
          </button>
          <button disabled={!native.canRedo} onClick={() => native.redo()}>
            {t("redo")}
          </button>
        </>
      )}
      {native.corrupt && (
        <button
          onClick={() => {
            try {
              const raw = localStorage.getItem(projectStorageKey) ?? "";
              const url = URL.createObjectURL(
                new Blob([raw], { type: "application/json" }),
              );
              const anchor = document.createElement("a");
              anchor.href = url;
              anchor.download = "AdigunEplanAI-recovery.json";
              anchor.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            } catch {
              native.invalidImport();
            }
          }}
        >
          {t("downloadRecovery")}
        </button>
      )}
      {native.corrupt && (
        <button
          onClick={() => {
            if (window.confirm(t("confirmReset"))) native.resetStorage();
          }}
        >
          {t("resetStorage")}
        </button>
      )}
      <dialog ref={dialog} aria-label={t("newProject")}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const name = String(
              new FormData(event.currentTarget).get("name") ?? "",
            ).trim();
            if (!name) return;
            native.create(name, `${t("sheet")} 1`, t("document"));
            dialog.current?.close();
          }}
        >
          <h2>{t("newProject")}</h2>
          <label>
            {t("projectName")}
            <input
              aria-label={t("projectName")}
              name="name"
              required
              maxLength={160}
              autoFocus
            />
          </label>
          <div className="dialog-actions">
            <button type="button" onClick={() => dialog.current?.close()}>
              {t("cancel")}
            </button>
            <button>{t("create")}</button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
export function ProjectNavigator({ native, t }: Props) {
  return native.projects.length ? (
    <label>
      {t("chooseProject")}
      <select
        aria-label={t("chooseProject")}
        value={native.project?.id ?? ""}
        onChange={(e) => native.select(e.target.value)}
      >
        {native.projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </label>
  ) : (
    <p className="empty-hint">{t("noProject")}</p>
  );
}
export function ProjectProperties({ native, t }: Props) {
  const p = native.project;
  if (!p) return <p className="empty-hint">{t("emptyPanel")}</p>;
  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const name = String(new FormData(e.currentTarget).get("name") ?? "");
          native.update((draft) => ({ ...draft, name }));
        }}
      >
        <label>
          {t("projectName")}
          <input
            key={p.id + p.name}
            aria-label={t("projectName")}
            name="name"
            defaultValue={p.name}
            required
            maxLength={160}
          />
        </label>
        <button>{t("rename")}</button>
      </form>
      {p.documents.map((doc) => (
        <label key={doc.id}>
          {doc.name} · {t("documentLanguage")}
          <select
            aria-label={`${doc.name} ${t("documentLanguage")}`}
            value={doc.outputLanguage}
            onChange={(e) =>
              native.update((draft) => ({
                ...draft,
                documents: draft.documents.map((d) =>
                  d.id === doc.id
                    ? {
                        ...d,
                        outputLanguage: e.target
                          .value as typeof doc.outputLanguage,
                      }
                    : d,
                ),
              }))
            }
          >
            {["en", "de", "yo", "pcm"].map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
      ))}
    </>
  );
}
export function NativeDrawing({ native, t }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const p = native.project;
  if (!p) return null;
  const page = p.pages.find((item) => item.id === selected) ?? p.pages[0];
  return (
    <div className="native-drawing">
      <nav className="drawing-tabs" aria-label={t("pageName")}>
        {p.pages.map((item) => (
          <button
            key={item.id}
            aria-pressed={item.id === page?.id}
            onClick={() => setSelected(item.id)}
          >
            {item.name}
          </button>
        ))}
        <button
          onClick={() => native.addPage(`${t("sheet")} ${p.pages.length + 1}`)}
        >
          {t("newPage")}
        </button>
      </nav>
      {page ? (
        <svg
          className="native-sheet"
          viewBox={`0 0 ${page.widthMm} ${page.heightMm}`}
          role="img"
          aria-label={page.name}
        >
          <rect
            x="8"
            y="8"
            width={page.widthMm - 16}
            height={page.heightMm - 16}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.3"
          />
          <path
            d={`M8 ${page.heightMm - 22} H${page.widthMm - 8}`}
            stroke="currentColor"
            strokeWidth="0.3"
          />
          <text x="12" y={page.heightMm - 13} fontSize="3.5">
            {p.name} · {page.name} · {page.widthMm} × {page.heightMm} mm
          </text>
        </svg>
      ) : (
        <p>{t("noPages")}</p>
      )}
    </div>
  );
}
