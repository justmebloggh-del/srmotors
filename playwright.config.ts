import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

// Same env the app uses (.env.local), so tests can clean up via the local Supabase stack.
loadEnvConfig(process.cwd());

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3010",
    channel: "chrome", // uses the installed Google Chrome — no browser download needed
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chrome", use: { ...devices["Desktop Chrome"], channel: "chrome" } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3010",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
