import { serializeProject, validateProject, type Project } from "./project.ts";
export class ProjectHistory {
  #past: Project[] = [];
  #future: Project[] = [];
  #current: Project;
  constructor(project: Project) {
    this.#current = validateProject(project);
  }
  get current(): Project {
    return structuredClone(this.#current);
  }
  get canUndo(): boolean {
    return this.#past.length > 0;
  }
  get canRedo(): boolean {
    return this.#future.length > 0;
  }
  execute(change: (draft: Project) => Project): Project {
    const candidate = validateProject(change(this.current));
    if (serializeProject(candidate) === serializeProject(this.#current))
      return this.current;
    this.#past.push(this.#current);
    this.#current = candidate;
    this.#future = [];
    while (
      this.#past.length > 50 ||
      this.#past.reduce(
        (size, item) =>
          size + new TextEncoder().encode(serializeProject(item)).length,
        0,
      ) >
        20 * 1024 * 1024
    )
      this.#past.shift();
    return this.current;
  }
  undo(): Project {
    if (this.canUndo) {
      this.#future.push(this.#current);
      this.#current = this.#past.pop()!;
    }
    return this.current;
  }
  redo(): Project {
    if (this.canRedo) {
      this.#past.push(this.#current);
      this.#current = this.#future.pop()!;
    }
    return this.current;
  }
}
