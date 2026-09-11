import { defineConfig, devices } from "@playwright/test";

// BASE_URL should point at a deployed preview/production URL — Tranzila's
// Hosted Fields script and handshake call only work over a real HTTPS
// origin, not a local dev server.
const BASE_URL = process.env.BASE_URL || "https://www.vform-nutrition.com";

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
});
