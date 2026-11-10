// Original closed tetrahedron for geometry tests, not a catalog/manufacturer model.
export const tetraVertices = [
  [-1, -2, -3],
  [1, -2, -3],
  [-1, 1, -3],
  [-1, -2, 1],
];
export const tetraFaces = [
  [0, 2, 1],
  [0, 1, 3],
  [0, 3, 2],
  [1, 2, 3],
];
export function asciiStl(vertices = tetraVertices, faces = tetraFaces) {
  return new TextEncoder().encode(
    `solid test\n${faces.map((face) => `facet normal 0 0 0\nouter loop\n${face.map((i) => `vertex ${vertices[i].join(" ")}`).join("\n")}\nendloop\nendfacet`).join("\n")}\nendsolid test\n`,
  );
}
export function binaryStl() {
  const bytes = new Uint8Array(84 + tetraFaces.length * 50),
    view = new DataView(bytes.buffer);
  bytes.set(new TextEncoder().encode("solid binary header is permitted"));
  view.setUint32(80, tetraFaces.length, true);
  tetraFaces.forEach((face, i) =>
    face.forEach((index, j) =>
      tetraVertices[index].forEach((value, k) =>
        view.setFloat32(84 + i * 50 + 12 + j * 12 + k * 4, value, true),
      ),
    ),
  );
  return bytes;
}
