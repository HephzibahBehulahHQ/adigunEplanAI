import { test } from "node:test";
import assert from "node:assert/strict";
import {
  accountStorage,
  accountStorageKey,
  loadLibrary,
  projectStorageKey,
  saveLibrary,
} from "../../packages/project-storage/repository.ts";
import { nativeProject } from "../fixtures/native-project.mjs";
const a = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  b = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
function memory() {
  const data = new Map();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
}
function library(name) {
  const project = { ...nativeProject(), name };
  return { projects: [project], activeProjectId: project.id };
}

test("guest and two accounts retain separate libraries even with identical native project IDs", () => {
  const store = memory();
  saveLibrary(store, library("Guest legacy"));
  const originalGuest = store.getItem(projectStorageKey);
  assert.deepEqual(loadLibrary(accountStorage(store, a)), {
    projects: [],
    activeProjectId: null,
  });
  saveLibrary(accountStorage(store, a), library("Account A"));
  saveLibrary(accountStorage(store, b), library("Account B"));
  assert.equal(
    loadLibrary(accountStorage(store, null)).projects[0].name,
    "Guest legacy",
  );
  assert.equal(
    loadLibrary(accountStorage(store, a)).projects[0].name,
    "Account A",
  );
  assert.equal(
    loadLibrary(accountStorage(store, b)).projects[0].name,
    "Account B",
  );
  assert.equal(store.getItem(projectStorageKey), originalGuest);
  saveLibrary(accountStorage(store, a), {
    projects: [],
    activeProjectId: null,
  });
  assert.equal(
    loadLibrary(accountStorage(store, b)).projects[0].name,
    "Account B",
  );
  assert.equal(
    loadLibrary(accountStorage(store, null)).projects[0].name,
    "Guest legacy",
  );
});
test("corruption and recovery are scoped to the affected account", () => {
  const store = memory();
  saveLibrary(accountStorage(store, b), library("B intact"));
  store.setItem(accountStorageKey(a), "broken A payload");
  assert.throws(() => loadLibrary(accountStorage(store, a)));
  assert.equal(
    accountStorage(store, a).getItem(projectStorageKey),
    "broken A payload",
  );
  assert.equal(
    loadLibrary(accountStorage(store, b)).projects[0].name,
    "B intact",
  );
  assert.equal(accountStorage(store, null).getItem(projectStorageKey), null);
  assert.throws(
    () => accountStorage(store, b).getItem(accountStorageKey(a)),
    /Unknown/,
  );
});
test("account storage identity cannot inject keys or accidentally fall back to guest", () => {
  assert.equal(accountStorageKey(null), projectStorageKey);
  assert.equal(accountStorageKey(a.toUpperCase()), accountStorageKey(a));
  for (const owner of [
    "",
    "guest",
    "../guest",
    "------------------------------------",
    "not-a-uuid",
  ])
    assert.throws(() => accountStorageKey(owner), /identity/);
});
