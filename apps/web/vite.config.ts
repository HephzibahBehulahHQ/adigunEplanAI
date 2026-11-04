import { defineConfig } from "vite";

export default defineConfig({
  // Worker-only imports are not discovered by the initial HTML dependency scan.
  // Prebundle before navigation so first DXF use cannot trigger a page reload.
  optimizeDeps: { include: ["dxf-parser"] },
});
