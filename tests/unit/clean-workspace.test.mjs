import { test } from "node:test";
import assert from "node:assert/strict";
import { nativeProject } from "../fixtures/native-project.mjs";
import {
  loadWorkspaceLibrary,
  clearActiveProject,
  saveLibrary,
  loadLibrary,
} from "../../packages/project-storage/repository.ts";

test("boot is empty while saved project data remains available for explicit reopening", () => {
  let value = null;
  const storage = {
    getItem: () => value,
    setItem: (_, next) => {
      value = next;
    },
  };
  const project = nativeProject();
  saveLibrary(storage, { projects: [project], activeProjectId: project.id });
  const before = value;
  const workspace = loadWorkspaceLibrary(storage);
  assert.equal(workspace.activeProjectId, null);
  assert.deepEqual(workspace.projects, [project]);
  assert.equal(value, before);
  clearActiveProject(storage);
  assert.equal(loadLibrary(storage).activeProjectId, null);
  assert.deepEqual(loadLibrary(storage).projects, [project]);
});

test("session cleanup uses the latest library and preserves corrupt bytes", () => {
  let value = null;
  const storage = {
    getItem: () => value,
    setItem: (_, next) => {
      value = next;
    },
  };
  const original = nativeProject();
  const other = {
    ...nativeProject(),
    id: "another-project",
    name: "Another saved project",
  };
  saveLibrary(storage, {
    projects: [original, other],
    activeProjectId: other.id,
  });
  clearActiveProject(storage);
  assert.deepEqual(loadLibrary(storage).projects, [original, other]);
  value = "{corrupt";
  assert.throws(() => clearActiveProject(storage));
  assert.equal(value, "{corrupt");
});
