import { validateProject, type Project } from "../electrical-model/project.ts";

export type NumberChange = {
  collection: "wires" | "devices" | "terminals";
  id: string;
  before: string;
  after: string;
};
export type NumberingScope = "wires" | "devices" | "terminalStrip";

/** Preview is explicit and deterministic; terminal pin designations are never inferred. */
export function previewNumbering(
  project: Project,
  scope: NumberingScope,
  stripId?: string,
): NumberChange[] {
  validateProject(project);
  const changes: NumberChange[] = [];
  if (scope === "terminalStrip") {
    const strip = project.terminalStrips.find((item) => item.id === stripId);
    if (!strip) throw new Error("Unknown terminal strip");
    strip.terminalIds.forEach((id, index) => {
      const terminal = project.terminals.find((item) => item.id === id)!;
      // PE, A1/A2 and other semantic designations require an explicit domain edit.
      if (/^[0-9]+$/.test(terminal.designation))
        changes.push({
          collection: "terminals",
          id,
          before: terminal.designation,
          after: String(index + 1),
        });
    });
  } else {
    const counters = new Map<string, number>();
    for (const item of [...project[scope]].sort((a, b) =>
      a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
    )) {
      const before = "reference" in item ? item.reference : item.name;
      const match =
        scope === "wires" ? "W" : before.match(/^([^0-9]+)[0-9]+$/)?.[1];
      if (!match)
        throw new Error("Device reference requires an explicit tag prefix");
      const index = (counters.get(match) ?? 0) + 1;
      counters.set(match, index);
      changes.push({
        collection: scope,
        id: item.id,
        before,
        after: `${match}${index}`,
      });
    }
  }
  return changes.filter((change) => change.before !== change.after);
}

/** Call through ProjectHistory.execute: validates a clone and refuses stale previews. */
export function applyNumbering(
  project: Project,
  changes: NumberChange[],
): Project {
  const next = structuredClone(project);
  const seen = new Set<string>();
  for (const change of changes) {
    if (seen.has(change.id)) throw new Error("Duplicate numbering target");
    seen.add(change.id);
    const item = next[change.collection].find(
      (entity) => entity.id === change.id,
    );
    if (!item) throw new Error("Numbering target no longer exists");
    const field =
      change.collection === "devices"
        ? "reference"
        : change.collection === "terminals"
          ? "designation"
          : "name";
    const target = item as unknown as Record<string, string>;
    if (target[field] !== change.before)
      throw new Error("Numbering preview is stale");
    target[field] = change.after;
  }
  for (const collection of ["wires", "devices"] as const) {
    const values = next[collection].map((item) =>
      "reference" in item ? item.reference : item.name,
    );
    if (new Set(values).size !== values.length)
      throw new Error("Numbering would create duplicate identifiers");
  }
  return validateProject(next);
}
