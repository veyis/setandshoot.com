import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

// 1. Side-by-side TS 6 API for typescript-eslint v8
const Module = require("node:module");
const originalLoad = Module._load;
const tsV6 = require("typescript-v6");
Module._load = function (request) {
  if (request === "typescript") {
    return tsV6;
  }
  return originalLoad.apply(this, arguments);
};

// 2. ESLint 10 backwards-compat polyfills for legacy plugin context methods
const eslintPath = require.resolve("eslint");
const { FileContext } = require(
  path.join(path.dirname(eslintPath), "../lib/linter/file-context.js"),
);
FileContext.prototype.getFilename = function () {
  return this.filename;
};
FileContext.prototype.getPhysicalFilename = function () {
  return this.physicalFilename;
};
FileContext.prototype.getSourceCode = function () {
  return this.sourceCode;
};
FileContext.prototype.getCwd = function () {
  return this.cwd;
};

// 3. ESLint 10 SourceCode.finalize compatibility for custom parsers lacking scopeManager.addGlobals
const SourceCode = require(
  path.join(path.dirname(eslintPath), "../lib/languages/js/source-code/source-code.js"),
);
const origFinalize = SourceCode.prototype.finalize;
SourceCode.prototype.finalize = function () {
  if (this.scopeManager && typeof this.scopeManager.addGlobals !== "function") {
    this.scopeManager.addGlobals = function (names) {
      const gScope = this.scopes ? this.scopes[0] : this.globalScope;
      if (gScope && gScope.set) {
        for (const name of names) {
          if (!gScope.set.has(name)) {
            gScope.set.set(name, {
              name,
              eslintImplicitGlobalSetting: undefined,
              eslintExplicitGlobal: undefined,
              eslintExplicitGlobalComments: undefined,
              writeable: false,
            });
          }
        }
      }
    };
  }
  return origFinalize.apply(this, arguments);
};

// 4. Dynamically import Next.js ESLint config and tseslint
const next = (await import("eslint-config-next")).default;
const tseslint = (await import("typescript-eslint")).default;

export default tseslint.config(
  // eslint-config-next already registers the @typescript-eslint plugin and its
  // recommended rules; spreading tseslint.configs.recommended here as well made
  // ESLint fail hard with `Cannot redefine plugin "@typescript-eslint"`.
  ...next,
  {
    // Scoped to TS files: eslint-config-next registers the @typescript-eslint
    // plugin only for those, so an unscoped block cannot resolve its rules.
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Core rule — keep it applying to every file, as it did before the split.
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../*"],
              message: "Use the @/* alias instead of relative parent imports.",
            },
          ],
        },
      ],
    },
  },
  {
    ignores: [
      ".next/",
      "node_modules/",
      "playwright-report/",
      "test-results/",
      "coverage/",
      "src/migrations/",
      "src/app/(payload)/admin/importMap.js",
      "payload-types.ts",
      "public/",
      ".agents/",
    ],
  },
);
