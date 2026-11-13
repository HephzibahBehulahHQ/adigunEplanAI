import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default [
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "assets/**",
      "apps/web/public/cad-engine.js",
      "cad-engine.js",
      "eplan-symbols.js",
      "apps/web/public/eplan-symbols.js",
      "work/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.mjs", "playwright.config.ts", "tests/e2e/**/*.ts"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["apps/web/src/**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
  },
];
