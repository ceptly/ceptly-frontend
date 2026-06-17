import { defineConfig, globalIgnores } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
  ]),
  // Playwright E2E code isn't React/Next. Its fixture API exposes `use()`,
  // which the react-hooks rule mistakes for React's `use` hook.
  {
    files: ["e2e/**/*.{ts,tsx}"],
    rules: { "react-hooks/rules-of-hooks": "off" },
  },
  eslintConfigPrettier,
]);

export default eslintConfig;
