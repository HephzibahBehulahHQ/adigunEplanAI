import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  parseStl,
  validateMeshGeometry,
  meshWorldVertices,
  meshHit,
  meshTopology,
  meshLimits,
} from "../../packages/panel-engineering/mesh.ts";
import {
  assignPanelMesh,
  detachPanelMesh,
} from "../../packages/panel-engineering/mesh-commands.ts";
import {
  savePanelPlacement,
  saveEnclosure,
  sourceDimensions,
} from "../../packages/panel-engineering/commands.ts";
import {
  validateProject,
  parseProject,
  serializeProject,
} from "../../packages/electrical-model/project.ts";
import { ProjectHistory } from "../../packages/electrical-model/history.ts";
import {
  panelGeometryObj,
  panelReport,
} from "../../packages/panel-engineering/report.ts";
import { nativeProject } from "../fixtures/native-project.mjs";
import {
  asciiStl,
  binaryStl,
  tetraVertices,
  tetraFaces,
} from "../fixtures/panel-mesh.mjs";
function fixture() {
  let p = saveEnclosure(nativeProject(), {
    name: "Test cabinet",
    widthMm: 100,
    heightMm: 100,
    depthMm: 100,
  });
  return savePanelPlacement(p, {
    name: "Device",
    deviceId: p.devices[0].id,
    enclosureId: p.enclosures[0].id,
    positionMm: { x: 10, y: 20, z: 30 },
    sizeMm: { x: 10, y: 10, z: 10 },
  });
}
function model() {
  const bytes = asciiStl(),
    parsed = parseStl(bytes, "mm", "panel");
  return {
    id: "mesh-test",
    name: "Original test tetrahedron",
    vertices: parsed.vertices,
    triangles: parsed.triangles,
    source: {
      filename: "tetra.stl",
      reference: "Original regression fixture",
      license: "Repository test fixture",
      sha256: createHash("sha256").update(bytes).digest("hex"),
      encoding: parsed.encoding,
      units: "mm",
      axes: "panel",
      attributesIgnored: false,
    },
  };
}

test("ASCII and solid-prefixed binary STL preserve triangles and normalize negative origins", () => {
  const a = parseStl(asciiStl(), "mm", "panel"),
    b = parseStl(binaryStl(), "mm", "panel");
  assert.deepEqual(a.vertices, b.vertices);
  assert.deepEqual(a.triangles, b.triangles);
  assert.deepEqual(a.sizeMm, { x: 2, y: 3, z: 4 });
  assert.equal(a.encoding, "ascii-stl");
  assert.equal(b.encoding, "binary-stl");
  assert.deepEqual(meshTopology(a), {
    boundaryEdges: 0,
    nonManifoldEdges: 0,
    inconsistentEdges: 0,
  });
});
test("STL units and Z-up conversion are explicit, with dimensional consistency", () => {
  assert.deepEqual(parseStl(asciiStl(), "in", "z-up").sizeMm, {
    x: 50.8,
    y: 101.6,
    z: 76.19999999999999,
  });
  assert.deepEqual(parseStl(asciiStl(), "m", "panel").sizeMm, {
    x: 2000,
    y: 3000,
    z: 4000,
  });
  assert.throws(() => parseStl(asciiStl(), "feet", "panel"), /units/);
  assert.throws(() => parseStl(asciiStl(), "mm", "unknown"), /units/);
});
test("malformed, nonfinite, truncated, oversized and degenerate meshes fail before mutation", () => {
  assert.throws(() => parseStl(binaryStl().slice(0, -1), "mm", "panel"));
  const nonfinite = binaryStl();
  new DataView(nonfinite.buffer).setFloat32(96, NaN, true);
  assert.throws(() => parseStl(nonfinite, "mm", "panel"), /coordinate/);
  assert.throws(
    () => parseStl(new Uint8Array(meshLimits.bytes + 1), "mm", "panel"),
    /size/,
  );
  assert.throws(
    () =>
      parseStl(
        asciiStl(tetraVertices, [[0, 0, 1], ...tetraFaces]),
        "mm",
        "panel",
      ),
    /degenerate/,
  );
  assert.throws(
    () =>
      parseStl(
        new TextEncoder().encode("solid x\nvertex 0 0 0\nendsolid x"),
        "mm",
        "panel",
      ),
    /facet/,
  );
  const bad = model();
  bad.triangles[0][0] = 900;
  assert.throws(() => validateMeshGeometry(bad), /range/);
});
test("open surfaces and nonstandard binary attributes are reported without inventing solids or materials", () => {
  const opened = parseStl(
    asciiStl(tetraVertices, tetraFaces.slice(1)),
    "mm",
    "panel",
  );
  assert.equal(opened.boundaryEdges, 3);
  const colored = binaryStl();
  new DataView(colored.buffer).setUint16(132, 0xffff, true);
  assert.equal(parseStl(colored, "mm", "panel").attributesIgnored, true);
});
test("native assignment updates measured dimensions, preserves identity, supports undo/reload and exports real faces", () => {
  const p = fixture(),
    id = p.equipment3d[0].id,
    before = structuredClone(p),
    history = new ProjectHistory(p);
  const withMesh = history.execute((draft) =>
    assignPanelMesh(draft, id, model()),
  );
  assert.deepEqual(p, before);
  assert.equal(withMesh.equipment3d[0].deviceId, p.devices[0].id);
  assert.deepEqual(withMesh.equipment3d[0].sizeMm, { x: 2, y: 3, z: 4 });
  assert.equal(sourceDimensions(withMesh, p.devices[0].id).source, "mesh");
  assert.deepEqual(parseProject(serializeProject(withMesh)).project, withMesh);
  assert.deepEqual(history.undo(), p);
  assert.deepEqual(history.redo(), withMesh);
  const obj = panelGeometryObj(withMesh, p.enclosures[0].id);
  assert.equal(
    obj.split("\n").filter((line) => line.startsWith("f ")).length,
    4,
  );
  assert.match(obj, /v 10 20 30/);
  assert.match(obj, /Original regression fixture/);
  assert.equal(
    panelReport(withMesh, p.enclosures[0].id).equipment[0].meshId,
    model().id,
  );
  const bad = structuredClone(withMesh);
  bad.equipment3d[0].sizeMm.x = 99;
  assert.throws(() => validateProject(bad), /mesh/);
  const detached = detachPanelMesh(withMesh, id);
  assert.equal(detached.equipment3d[0].meshId, undefined);
  assert.deepEqual(detached.equipment3d[0].sizeMm, { x: 2, y: 3, z: 4 });
  assert.equal(detached.panelMeshes.length, 1);
});
test("mesh rotation and picking follow the same millimetre placement without stretching", () => {
  const mesh = model(),
    item = {
      id: "x",
      name: "x",
      positionMm: { x: 10, y: 20, z: 30 },
      sizeMm: { x: 2, y: 3, z: 4 },
      rotationDeg: 90,
    };
  const vertices = meshWorldVertices(mesh, item);
  assert.deepEqual(vertices[0], { x: 13, y: 20, z: 30 });
  assert.ok(meshHit(mesh, item, 0, 0, { x: 12.5, y: 20.1 }) > 30);
  assert.equal(meshHit(mesh, item, 0, 0, { x: 30, y: 30 }), null);
});
test("schema17 projects migrate without losing engineering records and initialize an empty mesh library", () => {
  const old = fixture();
  old.schemaVersion = 17;
  delete old.panelMeshes;
  const result = parseProject(JSON.stringify(old));
  assert.equal(result.migratedFrom, 17);
  assert.equal(result.project.schemaVersion, 18);
  assert.deepEqual(result.project.panelMeshes, []);
  assert.deepEqual(result.project.equipment3d, old.equipment3d);
});
