# Foundation Implementation Plan — Belin Akguel Volleyball Photography

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a deployable Next.js 16 + Payload v3 application with cinematic-editorial design tokens, bilingual DE/EN routing, working admin auth, legal singletons (Impressum + Datenschutz) rendered from the CMS, cookieless analytics, CI guardrails, and a Vercel preview deployment.

**Architecture:** Single Next.js 16 app (App Router) with Payload v3 embedded at `/admin`. Postgres via Neon, photo storage via Vercel Blob (both EU-region). `next-intl` handles locale routing (DE unprefixed, EN at `/en/...`). Tailwind v4 + shadcn/ui with custom design tokens. TypeScript strict, ESLint flat config, lefthook pre-commit, GitHub Actions CI. No cookie banner — Vercel Analytics + Speed Insights are cookieless.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.7, Payload v3, `@payloadcms/db-postgres`, `@payloadcms/storage-vercel-blob`, Tailwind v4, shadcn/ui, `next-intl` v4, `next/font`, Sentry, `@vercel/analytics`, `@vercel/speed-insights`, Vitest 2, Playwright, lefthook, pnpm.

**Spec reference:** `docs/superpowers/specs/2026-05-17-volleyball-photography-website-design.md`

---

## File structure delivered by this plan

```
package.json                            pnpm + scripts
pnpm-lock.yaml
pnpm-workspace.yaml                     (single-app workspace, future-proofing)
tsconfig.json
next.config.ts
next-env.d.ts
vercel.ts                               Vercel config in TS
.env.example                            Documented env vars
.gitignore
.editorconfig
.prettierrc
eslint.config.mjs                       Flat config
lefthook.yml                            Pre-commit hooks
.nvmrc                                  Node 24
README.md

.github/workflows/ci.yml                Lint / typecheck / unit / e2e

src/
  env.ts                                Zod-validated process.env
  middleware.ts                         next-intl locale routing
  app/
    layout.tsx                          Root html, fonts, analytics, Sentry
    globals.css                         Tailwind + tokens import
    [locale]/
      layout.tsx                        Locale wrapper, header + footer
      page.tsx                          Home placeholder
      impressum/page.tsx                Reads global from Payload
      datenschutz/page.tsx              Reads global from Payload
      not-found.tsx
    (payload)/
      admin/[[...segments]]/page.tsx    Payload admin mount
      admin/[[...segments]]/not-found.tsx
      api/[...slug]/route.ts            Payload REST
      api/graphql/route.ts              Payload GraphQL
      api/graphql-playground/route.ts
    api/
      health/route.ts                   Healthcheck

  payload/
    payload.config.ts                   Payload entry config
    collections/users.ts                Admin/editor accounts
    globals/impressum.ts                Legal singleton (DE primary, EN locale)
    globals/datenschutz.ts              Legal singleton
    globals/settings.ts                 Site-wide settings (minimal v1 surface)
    access/
      is-admin.ts                       Access function
      is-admin-or-editor.ts

  components/
    layout/header.tsx
    layout/footer.tsx
    layout/locale-switcher.tsx
    ui/                                 shadcn primitives (installed via CLI)

  lib/
    i18n/
      config.ts                         Locales + default
      routing.ts                        next-intl routing config
      request.ts                        getRequestConfig
    design/tokens.ts                    CSS variable contract typed for TS
    payload/get-payload.ts              Helper to instantiate Payload server-side

  styles/tokens.css                     CSS variables

  messages/
    de.json
    en.json

tests/
  unit/
    lib/i18n.test.ts
    env.test.ts
  e2e/
    smoke.spec.ts                       Home page, locale switch, /admin redirects
    admin-login.spec.ts                 Admin login screen renders
  playwright.config.ts
```

---

## Task 1: Initialize Next.js 16 project + pnpm workspace

**Files:**

- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `next-env.d.ts`
- Create: `.nvmrc`
- Create: `.gitignore`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx` (temporary; will be moved under `[locale]/` in Task 6)

- [ ] **Step 1: Write `.nvmrc`**

```
24
```

- [ ] **Step 2: Write `.gitignore`**

```
node_modules
.next
.vercel
.env*.local
.env
!.env.example
*.log
.DS_Store
coverage
playwright-report
test-results
.turbo
```

- [ ] **Step 3: Write `package.json`**

```json
{
  "name": "belinakguel-web",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "format": "prettier --write ."
  },
  "engines": {
    "node": ">=24"
  },
  "packageManager": "pnpm@9.15.0",
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.7.2"
  }
}
```

- [ ] **Step 4: Write `pnpm-workspace.yaml`**

```yaml
packages:
  - "."
```

- [ ] **Step 5: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 6: Write `next.config.ts`**

```ts
import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    reactCompiler: true,
    typedRoutes: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 90],
    deviceSizes: [640, 768, 1024, 1280, 1536, 1920, 2880],
    imageSizes: [16, 32, 64, 96, 128, 256, 384, 512],
  },
};

export default config;
```

- [ ] **Step 7: Write `next-env.d.ts`**

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

- [ ] **Step 8: Write a temporary `src/app/layout.tsx`**

```tsx
export const metadata = {
  title: "Belin Akguel — Volleyball-Fotografie",
  description: "Cinematic volleyball photography from Bremen.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 9: Write a temporary `src/app/page.tsx`**

```tsx
export default function HomePlaceholder() {
  return <main>belin akguel — coming soon</main>;
}
```

- [ ] **Step 10: Install and verify**

```bash
pnpm install
pnpm typecheck
pnpm dev
```

Expected: `pnpm typecheck` passes silently. `pnpm dev` boots on `http://localhost:3000` and shows "belin akguel — coming soon".

- [ ] **Step 11: Commit**

```bash
git add .
git commit -m "feat(foundation): scaffold Next.js 16 + TS strict + pnpm"
```

---

## Task 2: Quality tooling — ESLint, Prettier, lefthook, editorconfig

**Files:**

- Create: `eslint.config.mjs`
- Create: `.prettierrc`
- Create: `.editorconfig`
- Create: `lefthook.yml`
- Modify: `package.json` (add devDeps and scripts)

- [ ] **Step 1: Write `.editorconfig`**

```
root = true

[*]
end_of_line = lf
insert_final_newline = true
charset = utf-8
indent_style = space
indent_size = 2
trim_trailing_whitespace = true
```

- [ ] **Step 2: Write `.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

- [ ] **Step 3: Write `eslint.config.mjs`**

```js
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
    ignores: [".next/", "node_modules/", "playwright-report/", "test-results/", "coverage/"],
  },
);
```

- [ ] **Step 4: Write `lefthook.yml`**

```yaml
pre-commit:
  parallel: true
  commands:
    typecheck:
      run: pnpm typecheck
    lint:
      glob: "*.{ts,tsx,js,mjs}"
      run: pnpm exec eslint {staged_files}
    format:
      glob: "*.{ts,tsx,js,mjs,json,md,css}"
      run: pnpm exec prettier --check {staged_files}

pre-push:
  commands:
    test:
      run: pnpm test
```

- [ ] **Step 5: Add tooling devDeps**

```bash
pnpm add -D eslint eslint-config-next typescript-eslint prettier prettier-plugin-tailwindcss lefthook
```

- [ ] **Step 6: Install lefthook hooks**

```bash
pnpm exec lefthook install
```

Expected output: `sync hooks: ✔️ (pre-commit, pre-push)`

- [ ] **Step 7: Run lint and format to verify config**

```bash
pnpm lint
pnpm exec prettier --check .
```

Expected: both pass with no errors.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat(foundation): add ESLint, Prettier, lefthook, editorconfig"
```

---

## Task 3: Tailwind v4 + cinematic editorial design tokens

**Files:**

- Create: `src/styles/tokens.css`
- Create: `src/app/globals.css`
- Create: `src/lib/design/tokens.ts`
- Modify: `src/app/layout.tsx`
- Modify: `next.config.ts` (no change — Tailwind v4 plugin auto-detected)

- [ ] **Step 1: Install Tailwind v4**

```bash
pnpm add tailwindcss@^4 @tailwindcss/postcss postcss
```

- [ ] **Step 2: Create `postcss.config.mjs`**

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

- [ ] **Step 3: Write `src/styles/tokens.css`**

```css
:root {
  --bg-canvas: #0b0e13;
  --bg-elevated: #13171f;
  --ink-primary: #f4f1ea;
  --ink-muted: #8c8f97;
  --accent-signal: #e63946;
  --accent-court: #d8b66e;
  --line-hairline: rgba(244, 241, 234, 0.08);

  --font-display: var(--font-fraunces), Georgia, serif;
  --font-body: var(--font-inter), system-ui, -apple-system, sans-serif;
  --font-mono: var(--font-jetbrains-mono), ui-monospace, monospace;
}
```

- [ ] **Step 4: Write `src/app/globals.css`**

```css
@import "tailwindcss";
@import "../styles/tokens.css";

@theme {
  --color-canvas: var(--bg-canvas);
  --color-elevated: var(--bg-elevated);
  --color-ink: var(--ink-primary);
  --color-ink-muted: var(--ink-muted);
  --color-accent: var(--accent-signal);
  --color-court: var(--accent-court);
  --color-hairline: var(--line-hairline);

  --font-display: var(--font-display);
  --font-sans: var(--font-body);
  --font-mono: var(--font-mono);
}

@layer base {
  html,
  body {
    background-color: var(--bg-canvas);
    color: var(--ink-primary);
    font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
  }

  ::selection {
    background-color: var(--accent-signal);
    color: var(--ink-primary);
  }
}
```

- [ ] **Step 5: Write `src/lib/design/tokens.ts`**

```ts
export const tokens = {
  color: {
    canvas: "var(--bg-canvas)",
    elevated: "var(--bg-elevated)",
    ink: "var(--ink-primary)",
    inkMuted: "var(--ink-muted)",
    accent: "var(--accent-signal)",
    court: "var(--accent-court)",
    hairline: "var(--line-hairline)",
  },
  font: {
    display: "var(--font-display)",
    body: "var(--font-body)",
    mono: "var(--font-mono)",
  },
} as const;

export type DesignTokens = typeof tokens;
```

- [ ] **Step 6: Update `src/app/layout.tsx` to import globals**

```tsx
import "./globals.css";

export const metadata = {
  title: "Belin Akguel — Volleyball-Fotografie",
  description: "Cinematic volleyball photography from Bremen.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Verify in the browser**

Run `pnpm dev`, open `http://localhost:3000`. Expected: page background is the deep `#0b0e13`, text is warm off-white `#f4f1ea`.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat(foundation): tailwind v4 + cinematic editorial design tokens"
```

---

## Task 4: Fonts via `next/font` (Fraunces, Inter, JetBrains Mono)

**Files:**

- Modify: `src/app/layout.tsx`
- Create: `src/lib/design/fonts.ts`

- [ ] **Step 1: Write `src/lib/design/fonts.ts`**

```ts
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";

export const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-fraunces",
  display: "swap",
  weight: ["400", "500", "600"],
  axes: ["opsz"],
});

export const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600"],
  preload: true,
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400"],
  preload: false,
});
```

- [ ] **Step 2: Update `src/app/layout.tsx`**

```tsx
import "./globals.css";
import { fraunces, inter, jetbrainsMono } from "@/lib/design/fonts";

export const metadata = {
  title: "Belin Akguel — Volleyball-Fotografie",
  description: "Cinematic volleyball photography from Bremen.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Add a visual sanity check in `src/app/page.tsx`**

```tsx
export default function HomePlaceholder() {
  return (
    <main className="flex min-h-screen flex-col items-start justify-center gap-6 p-12">
      <h1 className="font-display text-7xl tracking-tight">belin akguel</h1>
      <p className="text-ink-muted font-sans">Volleyball photography. Bremen.</p>
      <p className="font-mono text-xs">f/2.8 · 1/2000s · ISO 6400</p>
    </main>
  );
}
```

- [ ] **Step 4: Verify in the browser**

Run `pnpm dev`. Expected: heading renders in Fraunces (serif), paragraph in Inter, EXIF line in JetBrains Mono. No FOUT/FOIT visible.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat(foundation): load fonts via next/font (Fraunces, Inter, JetBrains Mono)"
```

---

## Task 5: Vitest + Playwright with first smoke test

**Files:**

- Create: `vitest.config.ts`
- Create: `tests/unit/sanity.test.ts`
- Create: `tests/playwright.config.ts`
- Create: `tests/e2e/smoke.spec.ts`
- Modify: `package.json` (scripts already present from Task 1)
- Modify: `.gitignore` (already covers test artifacts)

- [ ] **Step 1: Install test deps**

```bash
pnpm add -D vitest @vitest/coverage-v8 @playwright/test
pnpm exec playwright install --with-deps chromium
```

- [ ] **Step 2: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      reporter: ["text", "html"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 3: Write failing unit test `tests/unit/sanity.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { tokens } from "@/lib/design/tokens";

describe("design tokens", () => {
  it("exposes the cinematic canvas color", () => {
    expect(tokens.color.canvas).toBe("var(--bg-canvas)");
  });

  it("exposes the editorial display font binding", () => {
    expect(tokens.font.display).toBe("var(--font-display)");
  });
});
```

- [ ] **Step 4: Run the unit test to verify it passes**

```bash
pnpm test
```

Expected: 2 tests pass.

- [ ] **Step 5: Write `tests/playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
```

- [ ] **Step 6: Write failing e2e test `tests/e2e/smoke.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("home page renders the wordmark", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "belin akguel" })).toBeVisible();
});
```

- [ ] **Step 7: Run the smoke test**

```bash
pnpm exec playwright test --config tests/playwright.config.ts
```

Expected: PASS.

- [ ] **Step 8: Update `package.json` `test:e2e` script**

```json
"test:e2e": "playwright test --config tests/playwright.config.ts"
```

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "test(foundation): vitest + playwright with smoke test"
```

---

## Task 6: next-intl bilingual routing (DE default + EN)

**Files:**

- Create: `src/lib/i18n/config.ts`
- Create: `src/lib/i18n/routing.ts`
- Create: `src/lib/i18n/request.ts`
- Create: `src/middleware.ts`
- Create: `src/messages/de.json`
- Create: `src/messages/en.json`
- Create: `src/app/[locale]/layout.tsx`
- Create: `src/app/[locale]/page.tsx`
- Delete: `src/app/page.tsx`
- Modify: `src/app/layout.tsx` (becomes minimal root)
- Modify: `next.config.ts`
- Create: `tests/unit/lib/i18n.test.ts`

- [ ] **Step 1: Install next-intl**

```bash
pnpm add next-intl@^4
```

- [ ] **Step 2: Write `src/lib/i18n/config.ts`**

```ts
export const locales = ["de", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "de";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
```

- [ ] **Step 3: Write `src/lib/i18n/routing.ts`**

```ts
import { defineRouting } from "next-intl/routing";
import { locales, defaultLocale } from "./config";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
});
```

- [ ] **Step 4: Write `src/lib/i18n/request.ts`**

```ts
import { getRequestConfig } from "next-intl/server";
import { isLocale } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isLocale(requested ?? "") ? requested! : "de";

  const messages = (await import(`@/messages/${locale}.json`)).default;
  return { locale, messages };
});
```

- [ ] **Step 5: Write `src/middleware.ts`**

```ts
import createMiddleware from "next-intl/middleware";
import { routing } from "@/lib/i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
```

- [ ] **Step 6: Write `src/messages/de.json`**

```json
{
  "site": {
    "tagline": "Volleyball-Fotografie. Bremen."
  },
  "nav": {
    "stories": "Stories",
    "highlights": "Highlights",
    "athletes": "Athletinnen",
    "about": "Über mich",
    "services": "Leistungen",
    "journal": "Journal",
    "contact": "Kontakt"
  },
  "footer": {
    "impressum": "Impressum",
    "datenschutz": "Datenschutz",
    "bildrechte": "Bildrechte"
  }
}
```

- [ ] **Step 7: Write `src/messages/en.json`**

```json
{
  "site": {
    "tagline": "Volleyball photography. Bremen."
  },
  "nav": {
    "stories": "Stories",
    "highlights": "Highlights",
    "athletes": "Athletes",
    "about": "About",
    "services": "Services",
    "journal": "Journal",
    "contact": "Contact"
  },
  "footer": {
    "impressum": "Imprint",
    "datenschutz": "Privacy",
    "bildrechte": "Image rights"
  }
}
```

- [ ] **Step 8: Update `next.config.ts` to wire next-intl**

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    reactCompiler: true,
    typedRoutes: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 90],
    deviceSizes: [640, 768, 1024, 1280, 1536, 1920, 2880],
    imageSizes: [16, 32, 64, 96, 128, 256, 384, 512],
  },
};

export default withNextIntl(config);
```

- [ ] **Step 9: Rewrite `src/app/layout.tsx` (root, locale-agnostic)**

```tsx
import "./globals.css";
import { fraunces, inter, jetbrainsMono } from "@/lib/design/fonts";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 10: Delete `src/app/page.tsx`**

```bash
rm src/app/page.tsx
```

- [ ] **Step 11a: Replace `src/app/layout.tsx` so the root reads the active locale**

The root layout owns the single `<html>` element and reads the active locale from `next-intl`. The `[locale]` layout will not render its own `<html>`.

```tsx
import "./globals.css";
import { fraunces, inter, jetbrainsMono } from "@/lib/design/fonts";
import { getLocale } from "next-intl/server";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 11b: Create `src/app/[locale]/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale, locales } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "Belin Akguel — Volleyball-Fotografie",
  description: "Cinematic volleyball photography from Bremen.",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
```

- [ ] **Step 12: Create `src/app/[locale]/page.tsx`**

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <main className="flex min-h-screen flex-col items-start justify-center gap-6 p-12">
      <h1 className="font-display text-7xl tracking-tight">belin akguel</h1>
      <p className="text-ink-muted font-sans">{t("site.tagline")}</p>
      <p className="font-mono text-xs">f/2.8 · 1/2000s · ISO 6400</p>
    </main>
  );
}
```

- [ ] **Step 13: Write failing unit test `tests/unit/lib/i18n.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { isLocale, defaultLocale, locales } from "@/lib/i18n/config";

describe("i18n config", () => {
  it("recognizes supported locales", () => {
    expect(isLocale("de")).toBe(true);
    expect(isLocale("en")).toBe(true);
  });

  it("rejects unsupported locales", () => {
    expect(isLocale("fr")).toBe(false);
    expect(isLocale("")).toBe(false);
  });

  it("defaults to German", () => {
    expect(defaultLocale).toBe("de");
  });

  it("exposes exactly two locales", () => {
    expect(locales).toEqual(["de", "en"]);
  });
});
```

- [ ] **Step 14: Run the unit tests**

```bash
pnpm test
```

Expected: all i18n tests + design tokens tests pass.

- [ ] **Step 15: Update e2e smoke test for both locales**

Replace `tests/e2e/smoke.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("German home renders the German tagline", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "belin akguel" })).toBeVisible();
  await expect(page.getByText("Volleyball-Fotografie. Bremen.")).toBeVisible();
});

test("English home renders the English tagline at /en", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByText("Volleyball photography. Bremen.")).toBeVisible();
});
```

- [ ] **Step 16: Run e2e**

```bash
pnpm test:e2e
```

Expected: both pass.

- [ ] **Step 17: Commit**

```bash
git add .
git commit -m "feat(foundation): next-intl bilingual routing (DE default + EN)"
```

---

## Task 7: Base header + footer + locale switcher

**Files:**

- Create: `src/components/layout/header.tsx`
- Create: `src/components/layout/footer.tsx`
- Create: `src/components/layout/locale-switcher.tsx`
- Modify: `src/app/[locale]/layout.tsx`
- Modify: `src/messages/de.json`, `src/messages/en.json` (already has nav/footer)

- [ ] **Step 1: Write `src/components/layout/locale-switcher.tsx`**

```tsx
"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { locales, type Locale } from "@/lib/i18n/config";

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const switchTo = (next: Locale) => {
    if (next === locale) return;
    const stripped = pathname.replace(/^\/(de|en)(?=\/|$)/, "");
    const target = next === "de" ? stripped || "/" : `/${next}${stripped || ""}`;
    startTransition(() => router.replace(target));
  };

  return (
    <nav aria-label="Sprache umschalten" className="flex items-center gap-2 text-xs uppercase">
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          disabled={pending}
          aria-current={l === locale ? "true" : undefined}
          className={l === locale ? "text-ink" : "text-ink-muted hover:text-ink transition-colors"}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Write `src/components/layout/header.tsx`**

```tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "./locale-switcher";

export async function Header() {
  const t = await getTranslations("nav");

  const items = [
    { href: "/stories", label: t("stories") },
    { href: "/highlights", label: t("highlights") },
    { href: "/athletes", label: t("athletes") },
    { href: "/about", label: t("about") },
    { href: "/services", label: t("services") },
    { href: "/journal", label: t("journal") },
    { href: "/contact", label: t("contact") },
  ];

  return (
    <header className="border-hairline bg-canvas/90 sticky top-0 z-40 flex items-center justify-between border-b px-6 py-4 backdrop-blur">
      <Link href="/" className="font-display text-base tracking-tight">
        belin akguel
      </Link>
      <nav className="hidden gap-6 text-sm lg:flex">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-ink-muted hover:text-ink transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <LocaleSwitcher />
    </header>
  );
}
```

- [ ] **Step 3: Write `src/components/layout/footer.tsx`**

```tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function Footer() {
  const t = await getTranslations("footer");
  return (
    <footer className="border-hairline text-ink-muted mt-24 border-t px-6 py-8 text-xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} Belin Akguel</p>
        <nav className="flex gap-4">
          <Link href="/impressum" className="hover:text-ink transition-colors">
            {t("impressum")}
          </Link>
          <Link href="/datenschutz" className="hover:text-ink transition-colors">
            {t("datenschutz")}
          </Link>
          <Link href="/bildrechte" className="hover:text-ink transition-colors">
            {t("bildrechte")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Update `src/app/[locale]/layout.tsx` to render header and footer**

```tsx
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale, locales } from "@/lib/i18n/config";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Belin Akguel — Volleyball-Fotografie",
  description: "Cinematic volleyball photography from Bremen.",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Header />
      {children}
      <Footer />
    </NextIntlClientProvider>
  );
}
```

- [ ] **Step 5: Write an e2e test for locale switching `tests/e2e/locale-switch.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("locale switcher navigates between DE and EN", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Volleyball-Fotografie. Bremen.")).toBeVisible();

  await page.getByRole("button", { name: "EN" }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.getByText("Volleyball photography. Bremen.")).toBeVisible();

  await page.getByRole("button", { name: "DE" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByText("Volleyball-Fotografie. Bremen.")).toBeVisible();
});
```

- [ ] **Step 6: Run e2e**

```bash
pnpm test:e2e
```

Expected: all e2e tests pass.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat(foundation): header, footer, locale switcher"
```

---

## Task 8: Environment-variable schema with Zod validation

**Files:**

- Create: `src/env.ts`
- Create: `.env.example`
- Create: `tests/unit/env.test.ts`

- [ ] **Step 1: Install Zod**

```bash
pnpm add zod
```

- [ ] **Step 2: Write `src/env.ts`**

```ts
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  PAYLOAD_SECRET: z.string().min(32, "PAYLOAD_SECRET must be ≥ 32 chars"),
  BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
export type Env = z.infer<typeof schema>;
```

- [ ] **Step 3: Write `.env.example`**

```
# Database (Neon Postgres EU)
DATABASE_URL=postgres://user:pass@host/db?sslmode=require

# Payload
PAYLOAD_SECRET=replace-me-with-32-or-more-random-chars

# Vercel Blob (optional for first local boot)
BLOB_READ_WRITE_TOKEN=

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Observability (optional locally)
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

- [ ] **Step 4: Write failing unit test `tests/unit/env.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { z } from "zod";

// Re-define the schema for the test so we can exercise it with synthetic input
// without triggering the side-effect parse in src/env.ts.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  PAYLOAD_SECRET: z.string().min(32),
  BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

describe("env schema", () => {
  it("accepts a valid configuration", () => {
    expect(
      envSchema.parse({
        DATABASE_URL: "postgres://u:p@h/d",
        PAYLOAD_SECRET: "x".repeat(32),
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      }),
    ).toMatchObject({ NODE_ENV: "development" });
  });

  it("rejects a short payload secret", () => {
    expect(() =>
      envSchema.parse({
        DATABASE_URL: "postgres://u:p@h/d",
        PAYLOAD_SECRET: "tooshort",
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      }),
    ).toThrow();
  });

  it("rejects a non-URL site URL", () => {
    expect(() =>
      envSchema.parse({
        DATABASE_URL: "postgres://u:p@h/d",
        PAYLOAD_SECRET: "x".repeat(32),
        NEXT_PUBLIC_SITE_URL: "not-a-url",
      }),
    ).toThrow();
  });
});
```

- [ ] **Step 5: Run the unit tests**

```bash
pnpm test
```

Expected: all env tests pass.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat(foundation): zod-validated env schema"
```

---

## Task 9: Provision Neon Postgres + Vercel Blob (manual setup checkpoint)

This task is human-driven (provisioning external resources) but is captured here so it doesn't get skipped. Mark complete only after `.env.local` contains real values.

**Files:**

- Create: `.env.local` (gitignored)

- [ ] **Step 1: Create a Vercel project and link the local repo**

```bash
pnpm add -g vercel@latest
vercel login
vercel link
```

Choose: create new project named `belinakguel-web`.

- [ ] **Step 2: Provision Neon Postgres via Vercel Marketplace**

In the Vercel dashboard, open the project → **Storage** → **Create Database** → **Neon Postgres**. Choose region **eu-central-1 (Frankfurt)**. Connect to the project.

- [ ] **Step 3: Provision Vercel Blob**

In the same Storage tab → **Create Blob Store** → name `belinakguel-photos` → region **EU**. Connect to the project.

- [ ] **Step 4: Pull env vars to `.env.local`**

```bash
vercel env pull .env.local
```

- [ ] **Step 5: Generate and set `PAYLOAD_SECRET` locally**

```bash
# Generate a strong secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add the output to `.env.local` as `PAYLOAD_SECRET=...`. Also add it to Vercel:

```bash
vercel env add PAYLOAD_SECRET production
vercel env add PAYLOAD_SECRET preview
vercel env add PAYLOAD_SECRET development
```

Paste the same value in all three when prompted.

- [ ] **Step 6: Set `NEXT_PUBLIC_SITE_URL`**

Append to `.env.local`:

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

And add the production value to Vercel:

```bash
vercel env add NEXT_PUBLIC_SITE_URL production
# Enter: https://belinakguel.com (or the chosen prod domain)
```

- [ ] **Step 7: Verify env parses**

```bash
pnpm exec tsx --env-file=.env.local -e "import('./src/env.ts').then((m) => console.log('OK', Object.keys(m.env)))"
```

Expected: `OK [ 'NODE_ENV', 'DATABASE_URL', 'PAYLOAD_SECRET', ... ]`.

If `tsx` isn't installed: `pnpm add -D tsx`.

- [ ] **Step 8: Commit (no secrets in the commit)**

```bash
git status
# Confirm .env.local is NOT tracked.
git add -A
git commit -m "chore(foundation): provision Neon + Vercel Blob (env vars only documented)" --allow-empty
```

---

## Task 10: Install Payload v3 + adapters, define Users collection

**Files:**

- Create: `src/payload/payload.config.ts`
- Create: `src/payload/collections/users.ts`
- Create: `src/payload/access/is-admin.ts`
- Create: `src/payload/access/is-admin-or-editor.ts`
- Create: `src/lib/payload/get-payload.ts`
- Modify: `next.config.ts` (wrap with `withPayload`)
- Modify: `package.json` (Payload scripts)

- [ ] **Step 1: Install Payload v3 + adapters**

```bash
pnpm add payload @payloadcms/next @payloadcms/db-postgres @payloadcms/storage-vercel-blob @payloadcms/richtext-lexical sharp
pnpm add -D @types/sharp
```

- [ ] **Step 2: Write `src/payload/access/is-admin.ts`**

```ts
import type { Access } from "payload";

export const isAdmin: Access = ({ req: { user } }) => {
  return Boolean(user && user.collection === "users" && user.role === "admin");
};
```

- [ ] **Step 3: Write `src/payload/access/is-admin-or-editor.ts`**

```ts
import type { Access } from "payload";

export const isAdminOrEditor: Access = ({ req: { user } }) => {
  return Boolean(
    user && user.collection === "users" && (user.role === "admin" || user.role === "editor"),
  );
};
```

- [ ] **Step 4: Write `src/payload/collections/users.ts`**

```ts
import type { CollectionConfig } from "payload";
import { isAdmin } from "../access/is-admin";

export const Users: CollectionConfig = {
  slug: "users",
  auth: {
    tokenExpiration: 60 * 60 * 24 * 30, // 30 days
    cookies: { sameSite: "Lax", secure: true },
  },
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "role", "createdAt"],
  },
  access: {
    create: isAdmin,
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "editor",
      options: [
        { label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
      ],
    },
    { name: "name", type: "text" },
  ],
};
```

- [ ] **Step 5: Write `src/payload/payload.config.ts`**

```ts
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Users } from "./collections/users";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL,
  secret: process.env.PAYLOAD_SECRET ?? "",
  admin: {
    user: Users.slug,
  },
  collections: [Users],
  globals: [],
  editor: lexicalEditor({}),
  localization: {
    locales: [
      { label: "Deutsch", code: "de" },
      { label: "English", code: "en" },
    ],
    defaultLocale: "de",
    fallback: true,
  },
  typescript: {
    outputFile: path.resolve(dirname, "../../payload-types.ts"),
  },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL ?? "" },
  }),
  plugins: [
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      collections: {},
      token: process.env.BLOB_READ_WRITE_TOKEN ?? "",
    }),
  ],
  sharp,
});

import sharp from "sharp";
```

- [ ] **Step 6: Write `src/lib/payload/get-payload.ts`**

```ts
import { getPayload as getPayloadFn } from "payload";
import config from "@/payload/payload.config";

let cached: Promise<Awaited<ReturnType<typeof getPayloadFn>>> | null = null;

export function getPayload() {
  if (!cached) {
    cached = getPayloadFn({ config });
  }
  return cached;
}
```

- [ ] **Step 7: Update `next.config.ts` to wrap with Payload**

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withPayload } from "@payloadcms/next/withPayload";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    reactCompiler: true,
    typedRoutes: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 90],
    deviceSizes: [640, 768, 1024, 1280, 1536, 1920, 2880],
    imageSizes: [16, 32, 64, 96, 128, 256, 384, 512],
  },
};

export default withPayload(withNextIntl(config));
```

- [ ] **Step 8: Add Payload scripts to `package.json`**

In the `"scripts"` block, add:

```json
"payload": "PAYLOAD_CONFIG_PATH=src/payload/payload.config.ts payload",
"payload:generate-types": "PAYLOAD_CONFIG_PATH=src/payload/payload.config.ts payload generate:types"
```

- [ ] **Step 9: Generate Payload types**

```bash
pnpm payload:generate-types
```

Expected: creates `payload-types.ts` with TypeScript types for the `users` collection.

- [ ] **Step 10: Commit**

```bash
git add .
git commit -m "feat(foundation): install payload v3 with postgres + vercel blob adapters"
```

---

## Task 11: Mount Payload admin and REST/GraphQL routes

**Files:**

- Create: `src/app/(payload)/admin/[[...segments]]/page.tsx`
- Create: `src/app/(payload)/admin/[[...segments]]/not-found.tsx`
- Create: `src/app/(payload)/api/[...slug]/route.ts`
- Create: `src/app/(payload)/api/graphql/route.ts`
- Create: `src/app/(payload)/api/graphql-playground/route.ts`
- Modify: `src/middleware.ts` (already excludes `/admin` and `/api` — verify)

- [ ] **Step 1: Write `src/app/(payload)/admin/[[...segments]]/page.tsx`**

```tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { RootPage, generatePageMetadata } from "@payloadcms/next/views";
import config from "@/payload/payload.config";
import { importMap } from "../importMap";

type Args = {
  params: Promise<{ segments?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const generateMetadata = ({ params, searchParams }: Args) =>
  generatePageMetadata({ config, params, searchParams });

const Page = ({ params, searchParams }: Args) =>
  RootPage({ config, params, searchParams, importMap });

export default Page;
```

- [ ] **Step 2: Write `src/app/(payload)/admin/importMap.js`**

```js
export const importMap = {};
```

Payload's CLI may regenerate this. For now an empty object is fine.

- [ ] **Step 3: Write `src/app/(payload)/admin/[[...segments]]/not-found.tsx`**

```tsx
import { NotFoundPage, generatePageMetadata } from "@payloadcms/next/views";
import config from "@/payload/payload.config";
import { importMap } from "../importMap";

type Args = {
  params: Promise<{ segments?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const generateMetadata = ({ params, searchParams }: Args) =>
  generatePageMetadata({ config, params, searchParams });

const NotFound = ({ params, searchParams }: Args) =>
  NotFoundPage({ config, params, searchParams, importMap });

export default NotFound;
```

- [ ] **Step 4: Write `src/app/(payload)/api/[...slug]/route.ts`**

```ts
import {
  REST_GET,
  REST_POST,
  REST_DELETE,
  REST_PATCH,
  REST_PUT,
  REST_OPTIONS,
} from "@payloadcms/next/routes";
import config from "@/payload/payload.config";

export const GET = REST_GET(config);
export const POST = REST_POST(config);
export const DELETE = REST_DELETE(config);
export const PATCH = REST_PATCH(config);
export const PUT = REST_PUT(config);
export const OPTIONS = REST_OPTIONS(config);
```

- [ ] **Step 5: Write `src/app/(payload)/api/graphql/route.ts`**

```ts
import { GRAPHQL_POST, REST_OPTIONS } from "@payloadcms/next/routes";
import config from "@/payload/payload.config";

export const POST = GRAPHQL_POST(config);
export const OPTIONS = REST_OPTIONS(config);
```

- [ ] **Step 6: Write `src/app/(payload)/api/graphql-playground/route.ts`**

```ts
import { GRAPHQL_PLAYGROUND_GET } from "@payloadcms/next/routes";
import config from "@/payload/payload.config";

export const GET = GRAPHQL_PLAYGROUND_GET(config);
```

- [ ] **Step 7: Boot the app and run migrations**

```bash
pnpm dev
```

In another terminal:

```bash
curl -i http://localhost:3000/admin
```

Expected: 200 (or 307 to `/admin/login`) — Payload's first-run UI loads and prompts to create the first user.

Open `http://localhost:3000/admin` in a browser. Create the first admin user with:

- Email: `belin@belinakguel.com` (or your dev email)
- Password: a strong one stored in a password manager
- Role will default to `editor` on first save; manually flip to `admin` in the admin UI after first login.

- [ ] **Step 8: Add e2e test `tests/e2e/admin-login.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("admin login page renders", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
});
```

- [ ] **Step 9: Run all tests**

```bash
pnpm test
pnpm test:e2e
```

Expected: all pass.

- [ ] **Step 10: Commit**

```bash
git add .
git commit -m "feat(foundation): mount payload admin and rest/graphql routes"
```

---

## Task 12: Legal singletons (Impressum, Datenschutz, Settings)

**Files:**

- Create: `src/payload/globals/impressum.ts`
- Create: `src/payload/globals/datenschutz.ts`
- Create: `src/payload/globals/settings.ts`
- Modify: `src/payload/payload.config.ts` (add globals)
- Create: `src/app/[locale]/impressum/page.tsx`
- Create: `src/app/[locale]/datenschutz/page.tsx`

- [ ] **Step 1: Write `src/payload/globals/impressum.ts`**

```ts
import type { GlobalConfig } from "payload";
import { isAdmin } from "../access/is-admin";
import { isAdminOrEditor } from "../access/is-admin-or-editor";

export const Impressum: GlobalConfig = {
  slug: "impressum",
  label: "Impressum",
  admin: { group: "Rechtliches" },
  access: { read: () => true, update: isAdmin },
  fields: [
    { name: "legalName", type: "text", required: true, localized: false },
    { name: "addressLine1", type: "text", required: true },
    { name: "addressLine2", type: "text" },
    { name: "postalCode", type: "text", required: true },
    { name: "city", type: "text", required: true, defaultValue: "Bremen" },
    { name: "country", type: "text", required: true, defaultValue: "Deutschland" },
    { name: "email", type: "email", required: true },
    { name: "phone", type: "text" },
    { name: "ustIdNr", type: "text", label: "USt-IdNr." },
    {
      name: "responsibleForContent",
      type: "text",
      label: "Verantwortlich i.S.d. § 18 Abs. 2 MStV",
    },
    { name: "additionalNotesDe", type: "textarea", localized: true },
  ],
};
```

Note: only the _narrative_ fields are localized (e.g. `additionalNotesDe` — which we declare as `localized: true` so Payload manages the DE/EN values).

- [ ] **Step 2: Write `src/payload/globals/datenschutz.ts`**

```ts
import type { GlobalConfig } from "payload";
import { isAdmin } from "../access/is-admin";

export const Datenschutz: GlobalConfig = {
  slug: "datenschutz",
  label: "Datenschutzerklärung",
  admin: { group: "Rechtliches" },
  access: { read: () => true, update: isAdmin },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      localized: true,
      defaultValue: "Datenschutzerklärung",
    },
    { name: "intro", type: "richText", localized: true },
    { name: "body", type: "richText", localized: true },
    { name: "lastUpdated", type: "date", required: true },
  ],
};
```

- [ ] **Step 3: Write `src/payload/globals/settings.ts`**

```ts
import type { GlobalConfig } from "payload";
import { isAdmin } from "../access/is-admin";

export const Settings: GlobalConfig = {
  slug: "settings",
  label: "Einstellungen",
  admin: { group: "System" },
  access: { read: () => true, update: isAdmin },
  fields: [
    {
      name: "defaultWatermark",
      type: "checkbox",
      defaultValue: false,
      label: "Wasserzeichen standardmäßig aktiv",
    },
    {
      name: "accentColor",
      type: "text",
      defaultValue: "#E63946",
      label: "Akzentfarbe (Hex)",
    },
    {
      name: "homeFeaturedCount",
      type: "number",
      defaultValue: 3,
      min: 1,
      max: 6,
      label: "Anzahl Featured Stories auf der Startseite",
    },
  ],
};
```

- [ ] **Step 4: Register globals in `src/payload/payload.config.ts`**

Update the `globals: []` line:

```ts
import { Impressum } from "./globals/impressum";
import { Datenschutz } from "./globals/datenschutz";
import { Settings } from "./globals/settings";

// ...

  globals: [Impressum, Datenschutz, Settings],
```

- [ ] **Step 5: Generate types**

```bash
pnpm payload:generate-types
```

Expected: `payload-types.ts` now includes `Impressum`, `Datenschutz`, `Settings`.

- [ ] **Step 6: Write `src/app/[locale]/impressum/page.tsx`**

```tsx
import { getPayload } from "@/lib/payload/get-payload";
import { setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function ImpressumPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const payload = await getPayload();
  const data = await payload.findGlobal({ slug: "impressum", locale });

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-tight">Impressum</h1>
      <dl className="mt-10 space-y-6 text-sm leading-relaxed">
        <div>
          <dt className="text-ink-muted">Anbieter</dt>
          <dd>{data.legalName}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Anschrift</dt>
          <dd>
            {data.addressLine1}
            {data.addressLine2 ? (
              <>
                <br />
                {data.addressLine2}
              </>
            ) : null}
            <br />
            {data.postalCode} {data.city}
            <br />
            {data.country}
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">Kontakt</dt>
          <dd>
            {data.email}
            {data.phone ? (
              <>
                <br />
                {data.phone}
              </>
            ) : null}
          </dd>
        </div>
        {data.ustIdNr ? (
          <div>
            <dt className="text-ink-muted">USt-IdNr.</dt>
            <dd>{data.ustIdNr}</dd>
          </div>
        ) : null}
        {data.responsibleForContent ? (
          <div>
            <dt className="text-ink-muted">Verantwortlich i.S.d. § 18 Abs. 2 MStV</dt>
            <dd>{data.responsibleForContent}</dd>
          </div>
        ) : null}
      </dl>
    </main>
  );
}
```

- [ ] **Step 7: Write `src/app/[locale]/datenschutz/page.tsx`**

```tsx
import { getPayload } from "@/lib/payload/get-payload";
import { setRequestLocale } from "next-intl/server";
import { RichText } from "@payloadcms/richtext-lexical/react";

export const dynamic = "force-dynamic";

export default async function DatenschutzPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const payload = await getPayload();
  const data = await payload.findGlobal({ slug: "datenschutz", locale });

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-tight">{data.title}</h1>
      {data.intro ? (
        <div className="prose prose-invert mt-8 max-w-none">
          <RichText data={data.intro as never} />
        </div>
      ) : null}
      {data.body ? (
        <div className="prose prose-invert mt-8 max-w-none">
          <RichText data={data.body as never} />
        </div>
      ) : null}
      <p className="text-ink-muted mt-12 text-xs">
        Stand: {new Date(data.lastUpdated).toLocaleDateString("de-DE")}
      </p>
    </main>
  );
}
```

- [ ] **Step 8: Boot dev and seed minimal Impressum content**

```bash
pnpm dev
```

Open `http://localhost:3000/admin` → log in → **Globals → Impressum**. Fill in:

- Legal name: `Belin Akguel`
- Address line 1: `Musterstraße 1`
- Postal code: `28195`
- City: `Bremen`
- Country: `Deutschland`
- Email: `kontakt@belinakguel.com`

Save. Open `http://localhost:3000/impressum` — the page renders with the seeded data.

Also visit **Globals → Datenschutzerklärung** and set `lastUpdated` to today + a minimal intro paragraph.

- [ ] **Step 9: Write e2e test `tests/e2e/legal-pages.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("Impressum page renders with seeded data", async ({ page }) => {
  await page.goto("/impressum");
  await expect(page.getByRole("heading", { name: "Impressum" })).toBeVisible();
  await expect(page.getByText("Bremen")).toBeVisible();
});

test("Datenschutz page renders with last-updated date", async ({ page }) => {
  await page.goto("/datenschutz");
  await expect(page.getByRole("heading", { name: /Datenschutzerklärung|Privacy/i })).toBeVisible();
  await expect(page.getByText(/Stand:/)).toBeVisible();
});
```

- [ ] **Step 10: Run all tests**

```bash
pnpm test
pnpm test:e2e
```

Expected: all pass. (E2E requires the dev server with seeded data; the Playwright `webServer` block boots it automatically — seeded data must already exist in the local Neon DB.)

- [ ] **Step 11: Commit**

```bash
git add .
git commit -m "feat(foundation): impressum + datenschutz + settings globals with public pages"
```

---

## Task 13: Cookieless analytics (Vercel Analytics + Speed Insights)

**Files:**

- Modify: `src/app/layout.tsx`
- Modify: `package.json`

- [ ] **Step 1: Install analytics packages**

```bash
pnpm add @vercel/analytics @vercel/speed-insights
```

- [ ] **Step 2: Wire into `src/app/layout.tsx`**

```tsx
import "./globals.css";
import { fraunces, inter, jetbrainsMono } from "@/lib/design/fonts";
import { getLocale } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify no cookies are dropped in dev**

Run `pnpm dev`, open `http://localhost:3000`, open DevTools → Application → Cookies. Expected: empty (or only the Payload admin session cookie, which is set only on `/admin`).

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(foundation): wire cookieless Vercel Analytics + Speed Insights"
```

---

## Task 14: Sentry (errors only, no PII)

**Files:**

- Create: `sentry.server.config.ts`
- Create: `sentry.client.config.ts`
- Create: `sentry.edge.config.ts`
- Create: `instrumentation.ts`
- Modify: `next.config.ts` (wrap with `withSentryConfig`)
- Modify: `package.json`

- [ ] **Step 1: Install Sentry**

```bash
pnpm add @sentry/nextjs
```

- [ ] **Step 2: Write `sentry.server.config.ts`**

```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
});
```

- [ ] **Step 3: Write `sentry.client.config.ts`**

```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
  replaysOnErrorSampleRate: 0,
  replaysSessionSampleRate: 0,
});
```

- [ ] **Step 4: Write `sentry.edge.config.ts`**

```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  tracesSampleRate: 0,
  sendDefaultPii: false,
});
```

- [ ] **Step 5: Write `instrumentation.ts`**

```ts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
```

- [ ] **Step 6: Update `next.config.ts` to wrap with Sentry (outermost)**

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withPayload } from "@payloadcms/next/withPayload";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    reactCompiler: true,
    typedRoutes: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 90],
    deviceSizes: [640, 768, 1024, 1280, 1536, 1920, 2880],
    imageSizes: [16, 32, 64, 96, 128, 256, 384, 512],
  },
};

export default withSentryConfig(withPayload(withNextIntl(config)), {
  silent: true,
  tunnelRoute: "/monitoring",
  hideSourceMaps: true,
  disableLogger: true,
});
```

- [ ] **Step 7: Build to verify**

```bash
pnpm build
```

Expected: build succeeds. Sentry warnings about missing DSN are fine in local dev.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat(foundation): sentry error tracking (no PII, low sample rate)"
```

---

## Task 15: `vercel.ts` configuration

**Files:**

- Create: `vercel.ts`
- Modify: `package.json`

- [ ] **Step 1: Install `@vercel/config`**

```bash
pnpm add -D @vercel/config
```

- [ ] **Step 2: Write `vercel.ts`**

```ts
import { type VercelConfig, routes } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  buildCommand: "pnpm build",
  installCommand: "pnpm install --frozen-lockfile",
  regions: ["fra1"],
  headers: [
    routes.cacheControl("/_next/static/(.*)", {
      public: true,
      maxAge: "1 year",
      immutable: true,
    }),
  ],
  redirects: [routes.redirect("/admin/", "/admin", { permanent: true })],
};
```

- [ ] **Step 3: Verify Vercel picks up the config**

```bash
vercel build --prod=false
```

Expected: build completes locally using the config (Frankfurt region recorded in build output).

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(foundation): vercel.ts config with fra1 region + cache headers"
```

---

## Task 16: GitHub Actions CI

**Files:**

- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  install:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9.15.0
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile

  typecheck:
    needs: install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9.15.0
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck

  lint:
    needs: install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9.15.0
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm exec prettier --check .

  unit:
    needs: install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9.15.0
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm test

  e2e:
    needs: install
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL_PREVIEW }}
      PAYLOAD_SECRET: ${{ secrets.PAYLOAD_SECRET }}
      NEXT_PUBLIC_SITE_URL: http://localhost:3000
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9.15.0
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e
      - if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

- [ ] **Step 2: Add `DATABASE_URL_PREVIEW` and `PAYLOAD_SECRET` to GitHub repo secrets**

In GitHub → Settings → Secrets and variables → Actions, add:

- `DATABASE_URL_PREVIEW` — a Neon branch URL dedicated to CI
- `PAYLOAD_SECRET` — same as production for now (can rotate later)

- [ ] **Step 3: Push to trigger the workflow**

```bash
git push origin main
```

Expected: CI runs and passes.

- [ ] **Step 4: Commit (the workflow file itself)**

```bash
git add .github/workflows/ci.yml
git commit -m "ci(foundation): github actions for typecheck, lint, unit, e2e"
```

(May already be committed in step 3 above; if so, this is a no-op.)

---

## Task 17: README + healthcheck + first preview deploy

**Files:**

- Create: `README.md`
- Create: `src/app/api/health/route.ts`

- [ ] **Step 1: Write `src/app/api/health/route.ts`**

```ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
```

- [ ] **Step 2: Add an e2e check `tests/e2e/health.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("healthcheck returns ok", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe("ok");
});
```

- [ ] **Step 3: Run e2e**

```bash
pnpm test:e2e
```

Expected: all e2e tests pass.

- [ ] **Step 4: Write `README.md`**

````markdown
# belin akguel — volleyball photography

Production website + admin for Belin Akguel, Bremen-based volleyball photographer.

## Stack

- Next.js 16 (App Router, React 19, React Compiler, Turbopack)
- Payload v3 (embedded at `/admin`) — Postgres via `@payloadcms/db-postgres`, photo storage via `@payloadcms/storage-vercel-blob`
- Tailwind v4, shadcn/ui, `next-intl` (DE default + EN)
- Vercel Analytics + Speed Insights (cookieless), Sentry (no PII)
- Hosted on Vercel Fluid Compute, Frankfurt region

## Prerequisites

- Node ≥ 24 (see `.nvmrc`)
- pnpm 9.15.0
- A Neon Postgres database (EU region)
- A Vercel Blob store (EU region)

## Setup

```bash
pnpm install
vercel link              # one-time, links the project
vercel env pull .env.local
pnpm exec lefthook install
```
````

## Run

```bash
pnpm dev
```

Public site: http://localhost:3000
Admin: http://localhost:3000/admin

First-run: open `/admin`, create the initial admin user, then set its role to `admin` in the user record.

## Common commands

| Command                       | What it does                                       |
| ----------------------------- | -------------------------------------------------- |
| `pnpm dev`                    | Next.js + Payload dev server                       |
| `pnpm build`                  | Production build                                   |
| `pnpm typecheck`              | TypeScript strict check                            |
| `pnpm lint`                   | ESLint                                             |
| `pnpm test`                   | Vitest unit tests                                  |
| `pnpm test:e2e`               | Playwright end-to-end tests                        |
| `pnpm payload:generate-types` | Regenerate `payload-types.ts` after schema changes |

## Deployment

Pushes to `main` deploy to production automatically via Vercel.
PRs get a preview URL with an isolated Neon branch.

## Specs and plans

See `docs/superpowers/specs/` and `docs/superpowers/plans/`.

````

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "docs(foundation): readme + healthcheck endpoint"
````

- [ ] **Step 6: Deploy to Vercel preview**

```bash
vercel
```

Expected: preview URL printed. Open it; verify:

- Home page loads with cinematic palette + Fraunces wordmark
- `/en` works
- `/impressum` renders the seeded data (from preview DB branch)
- `/admin/login` renders
- `/api/health` returns `{"status":"ok",...}`

- [ ] **Step 7: Promote to production (only when ready)**

```bash
vercel --prod
```

Expected: production deployment to `belinakguel.com` (or chosen domain).

---

## Definition of Done — Foundation

- [ ] `pnpm dev` boots in under 5s, serves home (DE + EN), `/impressum`, `/datenschutz`, `/admin`
- [ ] `pnpm build` succeeds with zero TypeScript errors
- [ ] `pnpm test` passes (≥ 5 unit tests across i18n, env, design tokens)
- [ ] `pnpm test:e2e` passes (smoke, locale-switch, admin-login, legal-pages, health — 6+ tests)
- [ ] CI passes on a PR
- [ ] Preview deployment is reachable
- [ ] No cookies dropped on the public site
- [ ] Admin requires login; first admin user created; admin can edit Impressum + Datenschutz singletons
- [ ] Header + footer render bilingually; locale switcher works
- [ ] Sentry initialized but quiet without a DSN

## Notes for the executing engineer

- **Run lefthook hooks locally before pushing.** The pre-push hook runs `pnpm test`; CI re-runs it.
- **Do not commit `.env.local`.** `.gitignore` already excludes it; double-check `git status` before each commit.
- **Use `pnpm payload:generate-types` after any Payload schema change.** Out-of-date `payload-types.ts` causes silent type drift.
- **The first admin user must be promoted to `admin` role manually after creation.** Payload's first-user flow creates with the collection default (`editor` here); flip the role in the admin UI immediately.
- **Watch for `<html>` nesting warnings.** Only the root layout in `src/app/layout.tsx` renders `<html>`. The `[locale]/layout.tsx` returns just the children inside the IntlProvider.
- **Sentry's `tunnelRoute: "/monitoring"`** routes Sentry traffic through your domain to dodge ad-blockers without dropping cookies. Confirmed cookieless.
- **Region pin:** every Vercel resource (project, Blob, Cron) must be in `fra1` / EU. Confirm in dashboard.

## Out of scope (handled in subsequent plans)

- **TOTP 2FA for the `admin` role** — wired in Plan 2 alongside Editor accounts, via `@payloadcms/plugin-multi-factor-auth`. v1 auth in Plan 1 ships with strong-password + magic-link reset; 2FA is added before the first piece of athlete PII lands in the database.
- Photos, Stories, Athletes, Tags, Teams, Competitions, Journal, Press, Comments collections (Plan 2)
- Block-based story layout renderer, lightbox, Highlights, Athletes profile pages, Booking form (Plan 3)
- Comments + moderation, Likes, Instagram cron sync, Lighthouse gate, JSON-LD, sitemap (Plan 4)

---

_End of Foundation plan._
