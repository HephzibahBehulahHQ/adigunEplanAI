import { defineConfig } from "vite";

export default defineConfig({
  // Worker-only imports are not discovered by the initial HTML dependency scan.
  // Prebundle before navigation so first DXF use cannot trigger a page reload.
  optimizeDeps: { include: ["dxf-parser"] },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "react-runtime",
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            },
            {
              name: "schema-validation",
              test: /[\\/]node_modules[\\/]zod[\\/]/,
            },
            {
              name: "account-runtime",
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            },
          ],
        },
      },
    },
  },
});
