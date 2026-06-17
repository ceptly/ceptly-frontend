import { defineConfig, devices } from "@playwright/test";

/**
 * E2E runs the real Next.js app against a STUB backend (e2e/mock-server). The
 * frontend fetches the backend server-side via NEXT_PUBLIC_API_URL, so mocking
 * has to happen at that network boundary — pointing the app at the stub — rather
 * than via browser route interception (which never sees SSR/server-action
 * fetches).
 *
 * Two web servers are started:
 *   1. the stub backend on :4500
 *   2. the Next app on :3000, with API URLs pointed at the stub and billing
 *      enforcement disabled so authed routes are reachable with just a session
 *      cookie (see e2e/fixtures/test.ts).
 *
 * First run locally: `npx playwright install chromium`.
 */
const MOCK_PORT = 4500;
const APP_PORT = 3000;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "html",

  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // CI installs Playwright's Chromium; locally fall back to system Chrome
        // when the bundled headless shell isn't present (e.g. partial install).
        ...(isCI ? {} : { channel: "chrome" as const }),
      },
    },
    // Enable additional engines in CI once the suite is stable:
    // { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    // { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],

  webServer: [
    {
      command: `node e2e/mock-server/server.mjs`,
      port: MOCK_PORT,
      reuseExistingServer: !isCI,
      stdout: "pipe",
    },
    {
      // Build + start the production server (NODE_ENV=production), which makes
      // the API base resolution deterministic (always NEXT_PUBLIC_API_URL).
      command: `npm run build && npm run start -- --port ${APP_PORT}`,
      port: APP_PORT,
      reuseExistingServer: !isCI,
      timeout: 180_000,
      env: {
        NEXT_PUBLIC_API_URL: `http://localhost:${MOCK_PORT}`,
        API_URL: `http://localhost:${MOCK_PORT}`,
        NEXT_PUBLIC_BILLING_ENFORCED: "false",
        NEXT_PUBLIC_MARKETING_URL: "https://ceptly.com",
      },
    },
  ],
});
