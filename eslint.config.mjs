import next from "eslint-config-next";
import tseslint from "typescript-eslint";

export default tseslint.config(
  ...next,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
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
      "payload-types.ts",
      "public/",
      ".agents/",
    ],
  },
);
