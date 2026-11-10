import { useEffect, useRef, useState, type SetStateAction } from "react";
import { electricalTransaction } from "../../../packages/connectivity-engine/transaction.ts";
import { synchronizeConnectivity } from "../../../packages/connectivity-engine/analyze.ts";
import {
  createProject,
  parseProject,
  validateProject,
  type Project,
} from "../../../packages/electrical-model/project.ts";
import { ProjectHistory } from "../../../packages/electrical-model/history.ts";
import {
  loadWorkspaceLibrary,
  clearActiveProject,
  saveLibrary,
  accountStorage,
  projectStorageKey,
  type ProjectLibrary,
} from "../../../packages/project-storage/repository.ts";
import type { MessageKey } from "../../../packages/localization";

export type WorkspaceView = "schematic" | "building" | "automation" | "panel";

type State = {
  library: ProjectLibrary;
  error: MessageKey | null;
  corrupt: boolean;
  saved: boolean;
};
export function useNativeProjects(ownerId: string | null = null) {
  const owner = useRef(ownerId);
  if (owner.current !== ownerId)
    throw new Error("Account changes require a fresh workspace");
  const storage = useRef(
    accountStorage(
      {
        getItem: (key) => localStorage.getItem(key),
        setItem: (key, value) => localStorage.setItem(key, value),
      },
      ownerId,
    ),
  );
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      histories.current.clear();
    };
  }, []);
  const [state, setState] = useState<State>(() => {
    try {
      const library = loadWorkspaceLibrary(storage.current);
      return {
        library: {
          ...library,
          projects: library.projects.map((project) =>
            synchronizeConnectivity(structuredClone(project)),
          ),
        },
        error: null,
        corrupt: false,
        saved: true,
      };
    } catch {
      return {
        library: { projects: [], activeProjectId: null },
        error: "corruptStorage",
        corrupt: true,
        saved: false,
      };
    }
  });
  const histories = useRef(new Map<string, ProjectHistory>());
  const editorSequence = useRef(0);
  const [editorCommand, setEditorCommand] = useState<{
    id: number;
    action: string;
  } | null>(null);
  const [view, setView] = useState<WorkspaceView>("schematic");
  const [selection, setSelection] = useState<{
    projectId: string | null;
    symbols: string[];
    deviceId: string | null;
  }>({ projectId: null, symbols: [], deviceId: null });
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  function resetWorkspaceUI() {
    histories.current.clear();
    setSelection({ projectId: null, symbols: [], deviceId: null });
    setSelectedPageId(null);
    setEditorCommand(null);
    setView("schematic");
  }
  // Autosave success makes work durable; failed saves retain the in-memory project
  // and install a native leaving guard. Cancelling that prompt does not clear it.
  const hasUnsavedChanges =
    !state.saved && state.library.activeProjectId !== null;
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsavedChanges]);
  useEffect(() => {
    const leave = () => {
      try {
        clearActiveProject(storage.current);
      } catch {
        /* Preserve corrupt or unwritable data. */
      }
    };
    const returnFromCache = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      resetWorkspaceUI();
      try {
        setState({
          library: loadWorkspaceLibrary(storage.current),
          error: null,
          corrupt: false,
          saved: true,
        });
      } catch {
        setState((previous) => ({
          ...previous,
          library: { ...previous.library, activeProjectId: null },
          error: "corruptStorage",
          corrupt: true,
        }));
      }
    };
    window.addEventListener("pagehide", leave);
    window.addEventListener("pageshow", returnFromCache);
    return () => {
      window.removeEventListener("pagehide", leave);
      window.removeEventListener("pageshow", returnFromCache);
    };
  }, []);
  const project =
    state.library.projects.find(
      (p) => p.id === state.library.activeProjectId,
    ) ?? null;
  const history = project
    ? (histories.current.get(project.id) ?? new ProjectHistory(project))
    : null;
  if (project && history && !histories.current.has(project.id))
    histories.current.set(project.id, history);
  function persist(library: ProjectLibrary) {
    if (!active.current) return false;
    if (state.corrupt) {
      setState((previous) => ({ ...previous, error: "corruptStorage" }));
      return false;
    }
    try {
      saveLibrary(storage.current, library);
      setState({ library, error: null, corrupt: false, saved: true });
    } catch {
      setState({ library, error: "saveError", corrupt: false, saved: false });
    }
    return true;
  }
  function update(change: (draft: Project) => Project) {
    if (!active.current || !project || !history) return false;
    try {
      const updated = history.execute((draft) => {
        const next = electricalTransaction(draft, change);
        return { ...next, updatedAt: new Date().toISOString() };
      });
      persist({
        ...state.library,
        projects: state.library.projects.map((p) =>
          p.id === updated.id ? updated : p,
        ),
      });
      return true;
    } catch {
      setState((previous) => ({ ...previous, error: "invalidProject" }));
      return false;
    }
  }
  const selectedSymbolIds =
    selection.projectId === project?.id
      ? selection.symbols.filter((id) =>
          project.symbolInstances.some((s) => s.id === id),
        )
      : [];
  const selectedDeviceId =
    selection.projectId === project?.id &&
    project.devices.some((d) => d.id === selection.deviceId)
      ? selection.deviceId
      : null;
  function selectSymbols(value: SetStateAction<string[]>) {
    setSelection((previous) => {
      const before = previous.projectId === project?.id ? previous.symbols : [];
      const symbols = typeof value === "function" ? value(before) : value;
      if (symbols === before) return previous;
      const deviceId =
        project?.symbolInstances.find((s) => s.id === symbols[0])?.deviceId ??
        null;
      return { projectId: project?.id ?? null, symbols, deviceId };
    });
  }
  function selectDevice(deviceId: string | null) {
    const symbols =
      project?.symbolInstances.filter((s) => s.deviceId === deviceId) ?? [];
    const symbol =
      symbols.find((s) => s.pageId === selectedPageId) ?? symbols[0];
    if (symbol) setSelectedPageId(symbol.pageId);
    setSelection({
      projectId: project?.id ?? null,
      symbols: symbol ? [symbol.id] : [],
      deviceId,
    });
  }
  return {
    project,
    view,
    setView,
    editorCommand,
    consumeEditorCommand(id: number) {
      setEditorCommand((previous) => (previous?.id === id ? null : previous));
    },
    requestEditorCommand(action: string) {
      setView("schematic");
      setEditorCommand({ id: ++editorSequence.current, action });
    },
    selectedSymbolIds,
    selectedDeviceId,
    selectSymbols,
    selectDevice,
    selectedPageId,
    selectPage(pageId: string | null) {
      setSelectedPageId(pageId);
      setSelection({
        projectId: project?.id ?? null,
        symbols: [],
        deviceId: null,
      });
    },
    projects: state.library.projects,
    error: state.error,
    saved: state.saved,
    hasUnsavedChanges,
    corrupt: state.corrupt,
    canUndo: history?.canUndo ?? false,
    canRedo: history?.canRedo ?? false,
    create(name: string, pageName: string, documentName: string) {
      if (!active.current || state.corrupt) return;
      try {
        const p = createProject(name);
        const documentId = crypto.randomUUID();
        p.documents.push({
          id: documentId,
          name: documentName,
          kind: "schematic",
          outputLanguage: "en",
        });
        p.pages.push({
          id: crypto.randomUUID(),
          name: pageName,
          documentId,
          widthMm: 420,
          heightMm: 297,
          order: 0,
          gridMm: 5,
          snapping: true,
        });
        resetWorkspaceUI();
        persist({
          projects: [...state.library.projects, validateProject(p)],
          activeProjectId: p.id,
        });
      } catch {
        setState((previous) => ({ ...previous, error: "invalidProject" }));
      }
    },
    select(id: string) {
      if (state.library.projects.some((p) => p.id === id))
        persist({ ...state.library, activeProjectId: id });
    },
    update,
    addPage(pageName: string) {
      if (!project) return;
      update((p) => {
        let document = p.documents.find((d) => d.kind === "schematic");
        if (!document) {
          document = {
            id: crypto.randomUUID(),
            name: pageName,
            kind: "schematic",
            outputLanguage: "en",
          };
          p.documents.push(document);
        }
        p.pages.push({
          id: crypto.randomUUID(),
          name: pageName,
          documentId: document.id,
          widthMm: 420,
          heightMm: 297,
          order: p.pages.length,
          gridMm: 5,
          snapping: true,
        });
        return p;
      });
    },
    undo() {
      if (history && project) {
        const p = history.undo();
        persist({
          ...state.library,
          projects: state.library.projects.map((old) =>
            old.id === p.id ? p : old,
          ),
        });
      }
    },
    redo() {
      if (history && project) {
        const p = history.redo();
        persist({
          ...state.library,
          projects: state.library.projects.map((old) =>
            old.id === p.id ? p : old,
          ),
        });
      }
    },
    save() {
      persist(state.library);
    },
    close(discardUnsaved = false) {
      // Keep saved projects; closing resets the active editor and its transient history.
      if (
        !active.current ||
        state.corrupt ||
        (hasUnsavedChanges && !discardUnsaved)
      )
        return false;
      try {
        const library = hasUnsavedChanges
          ? loadWorkspaceLibrary(storage.current)
          : state.library;
        persist({ ...library, activeProjectId: null });
        resetWorkspaceUI();
        return true;
      } catch {
        setState((previous) => ({ ...previous, error: "saveError" }));
        return false;
      }
    },
    importText(text: string, confirmReplace: () => boolean) {
      if (!active.current) return false;
      try {
        const p = synchronizeConnectivity(parseProject(text).project);
        if (
          state.library.projects.some((old) => old.id === p.id) &&
          !confirmReplace()
        )
          return false;
        histories.current.delete(p.id);
        return persist({
          projects: [
            ...state.library.projects.filter((old) => old.id !== p.id),
            p,
          ],
          activeProjectId: p.id,
        });
      } catch {
        setState((previous) => ({ ...previous, error: "invalidProject" }));
        return false;
      }
    },
    invalidImport() {
      if (!active.current) return;
      setState((previous) => ({ ...previous, error: "invalidProject" }));
    },
    recoveryText() {
      return active.current
        ? (storage.current.getItem(projectStorageKey) ?? "")
        : "";
    },
    resetStorage() {
      if (!active.current) return;
      try {
        const library = { projects: [], activeProjectId: null };
        saveLibrary(storage.current, library);
        histories.current.clear();
        setState({ library, error: null, corrupt: false, saved: true });
      } catch {
        setState((previous) => ({ ...previous, error: "saveError" }));
      }
    },
  };
}
export type NativeProjects = ReturnType<typeof useNativeProjects>;
