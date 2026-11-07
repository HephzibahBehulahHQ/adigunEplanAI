import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig(base, {
  testMatch: [
    "**/workspace-continuation.spec.ts",
    "**/bot-window.spec.ts",
    "**/examples.spec.ts",
    "**/reports.spec.ts",
  ],
  use: { ...base.use, baseURL: "http://127.0.0.1:4174" },
  webServer: {
    command:
      "node node_modules/vite/bin/vite.js preview apps/web --host 127.0.0.1 --port 4174 --strictPort",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: false,
  },
});
