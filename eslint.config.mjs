import next from "eslint-config-next";
import tseslint from "typescript-eslint";

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
