import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

const vitestGlobals = {
  afterAll: "readonly",
  afterEach: "readonly",
  beforeAll: "readonly",
  beforeEach: "readonly",
  describe: "readonly",
  expect: "readonly",
  it: "readonly",
  vi: "readonly"
};

export default defineConfig([
  globalIgnores(["**/dist/**", "**/coverage/**"]),
  {
    linterOptions: {
      reportUnusedDisableDirectives: "off"
    }
  },
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    ignores: ["apps/web/**/*"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node
      },
      sourceType: "module"
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off"
    }
  },
  {
    files: ["**/test/**/*.{ts,tsx,mts,cts}", "**/*.test.{ts,tsx,mts,cts}", "**/*.spec.{ts,tsx,mts,cts}"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...vitestGlobals
      }
    }
  }
]);
