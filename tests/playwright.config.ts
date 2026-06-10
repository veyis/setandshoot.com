import { execSync } from "node:child_process";
import { defineConfig, devices } from "@playwright/test";

/**
 * Reuse an already-running dev server regardless of the port Next picked
 * (3000 → 3001 → … when a port is taken). Probe localhost:3000-3010 and use
 * the first that responds; otherwise fall back to auto-starting `pnpm dev` on
 * 3000. PLAYWRIGHT_BASE_URL overrides detection entirely.
 */
function detectRunningPort(): number | null {
  for (let port = 3000; port <= 3010; port++) {
    try {
      execSync(`curl -s -o /dev/null --max-time 2 http://localhost:${port}/api/health`, {
        stdio: "ignore",
      });
      return port;
    } catch {
      // nothing listening on this port — try the next
    }
  }
  return null;
}

const explicitBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const detectedPort = explicitBaseURL ? null : detectRunningPort();
const baseURL = explicitBaseURL ?? `http://localhost:${detectedPort ?? 3000}`;
const reuseRunningServer = Boolean(explicitBaseURL) || detectedPort !== null;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: reuseRunningServer
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
