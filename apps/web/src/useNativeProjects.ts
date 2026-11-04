import { useRef, useState } from "react";
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
  type ProjectLibrary,
} from "../../../packages/project-storage/repository.ts";
import type { MessageKey } from "../../../packages/localization";

type State = {
  library: ProjectLibrary;
  error: MessageKey | null;
  corrupt: boolean;
  saved: boolean;
};
export function useNativeProjects() {
  const [state, setState] = useState<State>(() => {
    try {
      return {
        library: loadLibrary(localStorage),
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
    if (state.corrupt) {
      setState((previous) => ({ ...previous, error: "corruptStorage" }));
      return;
    }
    try {
      saveLibrary(localStorage, library);
      setState({ library, error: null, corrupt: false, saved: true });
    } catch {
      setState({ library, error: "saveError", corrupt: false, saved: false });
    }
  }
  function update(change: (draft: Project) => Project) {
    if (!project || !history) return;
    try {
      const updated = history.execute((draft) => {
        const next = change(draft);
        return { ...next, updatedAt: new Date().toISOString() };
      });
      persist({
        ...state.library,
        projects: state.library.projects.map((p) =>
          p.id === updated.id ? updated : p,
        ),
      });
    } catch {
      setState((previous) => ({ ...previous, error: "invalidProject" }));
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
      if (state.corrupt) return;
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
      try {
        const p = parseProject(text).project;
        if (
          state.library.projects.some((old) => old.id === p.id) &&
          !confirmReplace()
        )
          return;
        histories.current.delete(p.id);
        persist({
          projects: [
            ...state.library.projects.filter((old) => old.id !== p.id),
            p,
          ],
          activeProjectId: p.id,
        });
      } catch {
        setState((previous) => ({ ...previous, error: "invalidProject" }));
      }
    },
    invalidImport() {
      setState((previous) => ({ ...previous, error: "invalidProject" }));
    },
    resetStorage() {
      try {
        const library = { projects: [], activeProjectId: null };
        saveLibrary(localStorage, library);
        histories.current.clear();
        setState({ library, error: null, corrupt: false, saved: true });
      } catch {
        setState((previous) => ({ ...previous, error: "saveError" }));
      }
    },
  };
}
export type NativeProjects = ReturnType<typeof useNativeProjects>;
