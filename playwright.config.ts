import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: 2,
  use: { baseURL: "http://127.0.0.1:4173", headless: true },
  webServer: {
    command:
      "node node_modules/vite/bin/vite.js apps/web --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
});
