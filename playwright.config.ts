import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke + authenticated flow test against the live Vercel deploy.
 * Run with: BASE_URL=... TEST_EMAIL=... TEST_PASSWORD=... pnpm exec playwright test
 */
export default defineConfig({
  testDir: "./tests",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL ?? "https://xentrix-master-dashboard.vercel.app",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
