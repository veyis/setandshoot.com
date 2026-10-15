import { defineConfig } from "checkly";
import { Frequency } from "checkly/constructs";

export default defineConfig({
  projectName: "setandshoot.com",
  logicalId: "setandshoot-com",
  repoUrl: "https://github.com/veyis/setandshoot.com",
  checks: {
    locations: ["us-east-1"],
    tags: ["production", "tier2"],
    checkMatch: "__checks__/**/*.check.ts",
    ignoreDirectoriesMatch: ["node_modules/**"],
    playwrightConfig: {
      use: { baseURL: "https://setandshoot.com" },
    },
    browserChecks: {
      frequency: Frequency.EVERY_12H,
      testMatch: "__checks__/**/*.spec.ts",
    },
  },
  cli: {
    runLocation: "us-east-1",
  },
});
