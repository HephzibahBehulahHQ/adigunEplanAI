import {
  parseProject,
  serializeProject,
  type Project,
} from "../electrical-model/project.ts";
export type StorageAdapter = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};
export const projectStorageKey = "adiguneplanai.projects.v1";
export function accountStorageKey(ownerId: string | null): string {
  if (ownerId === null) return projectStorageKey;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      ownerId,
    )
  )
    throw new Error("Invalid account storage identity");
  return `${projectStorageKey}.owner.${ownerId.toLowerCase()}`;
}
/** Guest data retains its original key; it is never adopted by a signed-in account. */
export function accountStorage(
  storage: StorageAdapter,
  ownerId: string | null,
): StorageAdapter {
  const scopedKey = accountStorageKey(ownerId);
  return {
    getItem(key) {
      if (key !== projectStorageKey)
        throw new Error("Unknown project storage key");
      return storage.getItem(scopedKey);
    },
    setItem(key, value) {
      if (key !== projectStorageKey)
        throw new Error("Unknown project storage key");
      storage.setItem(scopedKey, value);
    },
  };
}
export type ProjectLibrary = {
  projects: Project[];
  activeProjectId: string | null;
};
/** Saved projects are a library; the active canvas is never restored at startup. */
export function loadWorkspaceLibrary(storage: StorageAdapter): ProjectLibrary {
  return { ...loadLibrary(storage), activeProjectId: null };
}
/** Only clear the session pointer. Never discard the latest saved project snapshots. */
export function clearActiveProject(storage: StorageAdapter): void {
  const library = loadLibrary(storage);
  if (library.activeProjectId !== null)
    saveLibrary(storage, { ...library, activeProjectId: null });
}
export function loadLibrary(storage: StorageAdapter): ProjectLibrary {
  const raw = storage.getItem(projectStorageKey);
  if (raw === null) return { projects: [], activeProjectId: null };
  if (new TextEncoder().encode(raw).length > 5 * 1024 * 1024)
    throw new Error("Project library exceeds storage limit");
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== "object")
    throw new Error("Invalid project library");
  const value = data as Record<string, unknown>;
  if (
    Object.keys(value).some(
      (key) => !["version", "projects", "activeProjectId"].includes(key),
    )
  )
    throw new Error("Unknown project library fields");
  if (
    value.version !== 1 ||
    !Array.isArray(value.projects) ||
    value.projects.length > 100
  )
    throw new Error("Invalid project library version or entries");
  const projects = value.projects.map(
    (project) => parseProject(JSON.stringify(project)).project,
  );
  const ids = projects.map((project) => project.id);
  if (new Set(ids).size !== ids.length)
    throw new Error("Duplicate stored project");
  if (
    value.activeProjectId !== null &&
    (typeof value.activeProjectId !== "string" ||
      !ids.includes(value.activeProjectId))
  )
    throw new Error("Missing active project");
  return { projects, activeProjectId: value.activeProjectId as string | null };
}
export function saveLibrary(
  storage: StorageAdapter,
  library: ProjectLibrary,
): void {
  if (library.projects.length > 100)
    throw new Error("Project library is limited to 100 projects");
  const candidate = {
    version: 1,
    projects: library.projects.map((project) =>
      JSON.parse(serializeProject(project)),
    ),
    activeProjectId: library.activeProjectId,
  };
  const text = JSON.stringify(candidate);
  if (new TextEncoder().encode(text).length > 5 * 1024 * 1024)
    throw new Error("Project library exceeds storage limit");
  loadLibrary({ getItem: () => text, setItem: () => {} });
  storage.setItem(projectStorageKey, text);
}
