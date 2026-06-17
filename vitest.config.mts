import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Unit + component tests (jsdom). E2E lives in /e2e and is run by Playwright,
 * so it is excluded here.
 *
 * Note: Vitest cannot render *async* Server Components — those are covered by
 * Playwright E2E. Unit tests target pure helpers; component tests target
 * client ("use client") components.
 */
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["test/**/*.test.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
    css: false,
  },
});
