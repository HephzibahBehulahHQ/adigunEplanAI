import { useEffect, useRef, useState } from "react";
import {
  boxVertices,
  projectPoint3d,
  type PanelVolume,
} from "../../../packages/panel-engineering/geometry.ts";
import {
  meshWorldVertices,
  type MeshGeometry,
} from "../../../packages/panel-engineering/mesh.ts";

export const boxTriangles: MeshGeometry["triangles"] = [
  [0, 3, 7],
  [0, 7, 4],
  [1, 5, 6],
  [1, 6, 2],
  [0, 4, 5],
  [0, 5, 1],
  [3, 2, 6],
  [3, 6, 7],
  [0, 1, 2],
  [0, 2, 3],
  [4, 7, 6],
  [4, 6, 5],
];
export function envelopeMesh(item: PanelVolume): MeshGeometry {
  return {
    vertices: boxVertices({ min: { x: 0, y: 0, z: 0 }, max: item.sizeMm }).map(
      (p) => [p.x, p.y, p.z],
    ),
    triangles: boxTriangles,
  };
}
type Object3D = {
  item: PanelVolume;
  mesh?: MeshGeometry;
  color: string;
  opacity?: number;
};
type Pipeline = {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  buffer: WebGLBuffer;
};

function pipeline(canvas: HTMLCanvasElement): Pipeline {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  if (!gl) throw new Error("WebGL unavailable");
  const shaders: WebGLShader[] = [];
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    shaders.push(shader);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      throw new Error("Mesh shader compilation failed");
    return shader;
  };
  const program = gl.createProgram()!,
    buffer = gl.createBuffer()!;
  try {
    gl.attachShader(
      program,
      compile(
        gl.VERTEX_SHADER,
        `attribute vec3 position; attribute vec4 color; uniform vec4 view; uniform vec2 depth; varying vec4 surface; void main(){ gl_Position=vec4(2.0*(position.x-view.x)/view.z-1.0,1.0-2.0*(position.y-view.y)/view.w,1.0-2.0*(position.z-depth.x)/depth.y,1.0); surface=color; }`,
      ),
    );
    gl.attachShader(
      program,
      compile(
        gl.FRAGMENT_SHADER,
        `precision mediump float; varying vec4 surface; void main(){ gl_FragColor=surface; }`,
      ),
    );
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error("Mesh shader linking failed");
  } catch (error) {
    gl.deleteProgram(program);
    gl.deleteBuffer(buffer);
    throw error;
  } finally {
    for (const shader of shaders) gl.deleteShader(shader);
  }
  return { gl, program, buffer };
}

function geometry(objects: Object3D[], yaw: number, pitch: number) {
  const values: number[] = [];
  const transparent: { depth: number; values: number[] }[] = [];
  let minZ = Infinity,
    maxZ = -Infinity,
    triangles = 0;
  for (const { item, mesh, color, opacity = 1 } of objects) {
    const shape = mesh ?? envelopeMesh(item);
    const points = meshWorldVertices(shape, item).map((p) =>
      projectPoint3d(p, yaw, pitch),
    );
    const rgb = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16) / 255);
    for (const face of shape.triangles) {
      const [a, b, c] = face.map((i) => points[i]);
      const u = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z },
        v = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };
      const normal = {
        x: u.y * v.z - u.z * v.y,
        y: u.z * v.x - u.x * v.z,
        z: u.x * v.y - u.y * v.x,
      };
      const length = Math.hypot(normal.x, normal.y, normal.z);
      const light = length
        ? 0.42 +
          0.58 *
            Math.abs(
              (normal.x * -0.3 + normal.y * -0.4 + normal.z * 0.8660254) /
                length,
            )
        : 0.42;
      const faceValues: number[] = [];
      for (const p of [a, b, c]) {
        minZ = Math.min(minZ, p.z);
        maxZ = Math.max(maxZ, p.z);
        faceValues.push(p.x, p.y, p.z, ...rgb.map((n) => n * light), opacity);
      }
      if (opacity < 1)
        transparent.push({ depth: (a.z + b.z + c.z) / 3, values: faceValues });
      else values.push(...faceValues);
      triangles++;
    }
  }
  const opaqueVertices = values.length / 7;
  for (const face of transparent.sort((a, b) => a.depth - b.depth))
    values.push(...face.values);
  return {
    data: new Float32Array(values),
    minZ,
    maxZ,
    triangles,
    opaqueVertices,
  };
}

/** GPU depth testing keeps imported concave/intersecting surfaces correctly occluded. */
export function PanelMeshSurface({
  objects,
  yaw,
  pitch,
  view,
  errorLabel,
}: {
  objects: Object3D[];
  yaw: number;
  pitch: number;
  view: { x: number; y: number; w: number; h: number };
  errorLabel: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    gpu = useRef<Pipeline | null>(null);
  const [error, setError] = useState(false);
  useEffect(
    () => () => {
      const p = gpu.current;
      if (p) {
        p.gl.deleteBuffer(p.buffer);
        p.gl.deleteProgram(p.program);
        gpu.current = null;
      }
    },
    [],
  );
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let frame = 0;
    const paint = () => {
      try {
        const p = gpu.current ?? (gpu.current = pipeline(element)),
          { gl, program, buffer } = p;
        const scene = geometry(objects, yaw, pitch);
        const rect = element.getBoundingClientRect(),
          ratio = Math.min(devicePixelRatio || 1, 2);
        element.width = Math.max(1, Math.round(rect.width * ratio));
        element.height = Math.max(1, Math.round(rect.height * ratio));
        const scale = Math.min(element.width / view.w, element.height / view.h);
        const w = Math.round(view.w * scale),
          h = Math.round(view.h * scale);
        gl.viewport(
          Math.round((element.width - w) / 2),
          Math.round((element.height - h) / 2),
          w,
          h,
        );
        gl.clearColor(0, 0, 0, 0);
        gl.clearDepth(1);
        gl.depthMask(true);
        gl.disable(gl.BLEND);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.disable(gl.CULL_FACE);
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, scene.data, gl.DYNAMIC_DRAW);
        for (const [name, offset, size] of [
          ["position", 0, 3],
          ["color", 12, 4],
        ] as const) {
          const index = gl.getAttribLocation(program, name);
          gl.enableVertexAttribArray(index);
          gl.vertexAttribPointer(index, size, gl.FLOAT, false, 28, offset);
        }
        gl.uniform4f(
          gl.getUniformLocation(program, "view"),
          view.x,
          view.y,
          view.w,
          view.h,
        );
        gl.uniform2f(
          gl.getUniformLocation(program, "depth"),
          scene.minZ - 1,
          scene.maxZ - scene.minZ + 2,
        );
        gl.drawArrays(gl.TRIANGLES, 0, scene.opaqueVertices);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
        gl.drawArrays(
          gl.TRIANGLES,
          scene.opaqueVertices,
          scene.triangles * 3 - scene.opaqueVertices,
        );
        gl.depthMask(true);
        if (gl.getError() !== gl.NO_ERROR)
          throw new Error("Mesh rendering failed");
        element.dataset.triangles = String(scene.triangles);
        element.dataset.rendered = "true";
        setError(false);
      } catch {
        element.dataset.rendered = "false";
        setError(true);
      }
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(paint);
    };
    const lost = (event: Event) => {
      event.preventDefault();
      gpu.current = null;
      setError(true);
      element.dataset.rendered = "false";
    };
    const restored = () => schedule();
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    element.addEventListener("webglcontextlost", lost);
    element.addEventListener("webglcontextrestored", restored);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      element.removeEventListener("webglcontextlost", lost);
      element.removeEventListener("webglcontextrestored", restored);
    };
  }, [objects, yaw, pitch, view]);
  return (
    <>
      <canvas ref={canvas} className="panel-mesh-surface" aria-hidden="true" />
      {error && (
        <p className="panel-mesh-error" role="alert">
          {errorLabel}
        </p>
      )}
    </>
  );
}
