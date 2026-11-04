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
export type ProjectLibrary = {
  projects: Project[];
  activeProjectId: string | null;
};
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
