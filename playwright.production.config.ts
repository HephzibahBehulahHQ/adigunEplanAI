import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  testMatch: ["**/copied-interface.spec.ts"],
  use: { ...base.use, baseURL: "http://127.0.0.1:43189" },
  webServer: {
    command:
      "node node_modules/vite/bin/vite.js preview apps/web --host 127.0.0.1 --port 43189 --strictPort",
    url: "http://127.0.0.1:43189",
    reuseExistingServer: false,
  },
});

