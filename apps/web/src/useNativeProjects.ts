import { useEffect, useRef, useState } from "react";
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
  loadLibrary,
  saveLibrary,
  accountStorage,
  projectStorageKey,
  type ProjectLibrary,
} from "../../../packages/project-storage/repository.ts";
import type { MessageKey } from "../../../packages/localization";

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
      const library = loadLibrary(storage.current);
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
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
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
  return {
    project,
    selectedPageId,
    selectPage: setSelectedPageId,
    projects: state.library.projects,
    error: state.error,
    saved: state.saved,
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
