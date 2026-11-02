#!/usr/bin/env node
/**
 * Design-token drift check — portfolio edition.
 *
 * Canonical copy: tier1/pxlpeak.com/scripts/checks/verify-design-tokens.mjs.
 * Other sites vendor it unchanged and describe themselves in a
 * `design-tokens.config.json` at their repo root (see DEFAULTS below).
 *
 *  1. Class/literal drift — counts violations per file and rule, and fails when
 *     any file exceeds its entry in the baseline JSON (a ratchet: existing debt
 *     is recorded, new debt is refused, paid-down debt is reported so the
 *     baseline can be tightened with --update).
 *  2. Token contrast — resolves the colour tokens for each theme (oklch, hex,
 *     rgb, hsl, bare shadcn-v3 HSL triplets, var() chains) and asserts WCAG 2.x
 *     ratios for the text/surface pairs the UI renders. Pairs whose tokens a
 *     site does not define are skipped and listed, not failed.
 *
 * Usage:
 *   node scripts/checks/verify-design-tokens.mjs            # check (CI)
 *   node scripts/checks/verify-design-tokens.mjs --report   # per-rule totals + every contrast pair
 *   node scripts/checks/verify-design-tokens.mjs --update   # rewrite the baseline
 *   node scripts/checks/verify-design-tokens.mjs --json     # machine-readable summary
 *
 * --update records the current counts. Run it after paying debt down, or with a
 * written reason in the commit when an exception is deliberate.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");

/* ───────────────────────── Config ───────────────────────── */

/**
 * design-tokens.config.json — every field optional:
 * {
 *   "css": "src/app/globals.css",                  // token stylesheet
 *   "themes": { "light": ":root", "dark": ".dark" }, // dark: selector, "media" or null
 *   "srcDirs": ["src"],                            // scanned for .ts/.tsx
 *   "rules": ["raw-color", ...],                   // enabled drift rules (default: PORTABLE_RULES)
 *   "exclude": ["^src/lib/email/"],                // extra path regexes to skip
 *   "extraPairs": [["brand", "background", 3]],    // contrast pairs beyond CONTRAST_PAIRS
 *   "strictTokens": false,                         // fail when a paired token cannot be parsed
 *   "knownContrastGaps": [{ "theme", "fgName", "bgName", "floor", "reason" }],
 *   "baseline": "scripts/checks/design-tokens-baseline.json"
 * }
 */
const PORTABLE_RULES = ["raw-color", "arbitrary-text-size", "arbitrary-radius", "arbitrary-shadow", "palette-class", "white-black", "muted-opacity"];

export function loadConfig(dir = root) {
  const file = path.join(dir, "design-tokens.config.json");
  const user = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
  const srcDirs = user.srcDirs ?? (fs.existsSync(path.join(dir, "src")) ? ["src"] : ["app", "components", "lib"].filter((d) => fs.existsSync(path.join(dir, d))));
  return {
    css: user.css ?? "src/app/globals.css",
    themes: { light: ":root", dark: ".dark", ...(user.themes ?? {}) },
    srcDirs,
    rules: user.rules ?? PORTABLE_RULES,
    exclude: (user.exclude ?? []).map((r) => new RegExp(r)),
    extraPairs: user.extraPairs ?? [],
    strictTokens: user.strictTokens ?? false,
    knownContrastGaps: user.knownContrastGaps ?? [],
    baseline: user.baseline ?? "scripts/checks/design-tokens-baseline.json",
  };
}

/* ───────────────────────── 1. Drift rules ───────────────────────── */

const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const COLOR_UTIL =
  "bg|text|border(?:-[trblxy])?|from|via|to|ring|ring-offset|fill|stroke|shadow|outline|divide|decoration|placeholder|caret|accent";

/** Each rule: what it catches, why it is drift, and the token to use instead. */
export const RULES = {
  "palette-class": {
    re: new RegExp(`(?<![\\w-])(?:${COLOR_UTIL})-(${PALETTE})-\\d{2,3}(?![\\w-])`, "g"),
    fix: "Use a semantic token (bg-muted, text-muted-foreground, text-success…).",
  },
  "white-black": {
    re: /(?<![\w-])(?:bg|text|border|from|via|to|fill|stroke)-(?:white|black)(?![\w-])/g,
    fix: "Use bg-background/text-foreground, the primary foreground, or a scrim token over media.",
  },
  "raw-color": {
    re: /(?<=["'`\s(:,])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![\w-])|(?<![\w-])(?:rgba?|hsla?|oklch)\(\s*[\d.]/g,
    fix: "Reference a CSS token (var(--…), bg-*, text-*) instead of a colour literal.",
  },
  "arbitrary-text-size": {
    // px/rem only: an `em` size (inline code at 0.9em) is relative to its text by design.
    re: /(?<![\w-])text-\[\d*\.?\d+(?:px|rem)\]/g,
    fix: "Use the type scale (text-xs…text-xl and the site's display/section utilities).",
  },
  "arbitrary-radius": {
    re: /(?<![\w-])rounded(?:-[a-z]{1,2})?-\[[^\]]+\]/g,
    fix: "Use the radius scale (rounded-md | lg | xl | 2xl | 3xl | full).",
  },
  "arbitrary-shadow": {
    re: /(?<![\w-])shadow-\[[^\]]+\]/g,
    fix: "Use the elevation scale (shadow-sm | md | lg | xl).",
  },
  "arbitrary-tracking": {
    re: /(?<![\w-])(?:tracking|leading)-\[[^\]]+\]/g,
    fix: "Use tracking-tight/wide and the leading-* scale.",
  },
  "heavy-weight": {
    re: /(?<![\w-])font-(?:bold|extrabold|black)(?![\w-])/g,
    fix: "This site's font ships no 700+ weight: use font-medium or font-semibold.",
  },
  "muted-opacity": {
    re: /(?<![\w-])text-muted-foreground\/\d+/g,
    fix: "Text: full text-muted-foreground (dimmed steps fall below 4.5:1). Icons: a faint token.",
  },
  "focus-color": {
    // brand-gold-on-primary stays allowed: it is pxlpeak's ring for ink (bg-primary) surfaces.
    re: /(?<![\w-])(?:[\w-]+:)*focus-visible:outline-(?:brand-gold|brand-gold-ink|primary)(?![\w-])/g,
    fix: "Focus indicators use --ring: the focus-ring utility, or focus-visible:outline-ring with an explicit offset.",
  },
  "focus-recipe": {
    re: /(?<![\w-])focus-visible:outline-offset-2(?![\w-])/g,
    fix: "Use the focus-ring utility (2px --ring outline, 2px offset) instead of the three-class recipe.",
  },
  "strong-tint-text": {
    // Same-colour status text on its own tint passes only at /10 (measured with
    // browser sRGB compositing: success text on success/20 is 4.04:1).
    count: (src) => {
      let n = 0;
      for (const m of src.matchAll(/["'`]([^"'`]*)["'`]/g)) {
        const toks = m[1].split(/\s+/);
        for (const t of ["success", "warning", "destructive", "info"]) {
          const strong = new RegExp(`^(?:[\\w-]+:)*bg-${t}/(?:1[5-9]|[2-9]\\d)$`);
          const text = new RegExp(`^(?:[\\w-]+:)*text-${t}$`);
          if (toks.some((x) => strong.test(x)) && toks.some((x) => text.test(x))) n++;
        }
      }
      return n;
    },
    fix: "Put same-colour status text on a /10 tint (bg-success/10 text-success), or use the -foreground text on a stronger fill.",
  },
  "arbitrary-split": {
    re: /(?<![\w-])grid-cols-\[minmax\(0,[\d.]+fr\)_minmax\(0,[\d.]+fr\)\]/g,
    fix: "Use a named split: grid-cols-label-content | main-aside | aside-main, or grid-cols-2.",
  },
};

/** Paths where inline colour is structurally required (email HTML, OG images…). */
export const EXCLUDED = [
  /^src\/lib\/email\//,
  /^src\/lib\/alerts\/templates\.ts$/,
  /(?:^|\/)lib\/og\//,
  /(?:^|\/)api\/embed\//,
  /(?:^|\/)(?:opengraph|twitter)-image\.tsx$/,
  /(?:^|\/)__tests__\//,
  /\.(?:test|spec)\.tsx?$/,
  /\.d\.ts$/,
];

/** Comments are not rendered; skip them so prose about a banned class is not a hit. */
function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, (m, p) => p + " ".repeat(m.length - p.length));
}

/**
 * Count violations per rule in one source text.
 * `ownPalette` holds palette names the site defines as its own tokens
 * (`--color-slate-100` in its CSS); those classes are tokens, not drift.
 */
export function scanSource(text, rules = Object.keys(RULES), ownPalette = new Set()) {
  const src = stripComments(text);
  const counts = {};
  for (const name of rules) {
    const { re, count } = RULES[name];
    let n = 0;
    if (count) n = count(src);
    else for (const m of src.matchAll(re)) if (!(name === "palette-class" && ownPalette.has(m[1]))) n++;
    if (n) counts[name] = n;
  }
  return counts;
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!/^(node_modules|\.next|\.git)$/.test(e.name)) walk(p, out);
    } else if (/\.(?:ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

export function scanTree(config = loadConfig(), dir = root, ownPalette = new Set()) {
  const result = {};
  for (const src of config.srcDirs) {
    for (const abs of walk(path.join(dir, src))) {
      const rel = path.relative(dir, abs).split(path.sep).join("/");
      if (EXCLUDED.some((re) => re.test(rel)) || config.exclude.some((re) => re.test(rel))) continue;
      const counts = scanSource(fs.readFileSync(abs, "utf8"), config.rules, ownPalette);
      if (Object.keys(counts).length) result[rel] = counts;
    }
  }
  return Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
}

/** Compare current counts with the baseline. */
export function compareToBaseline(current, baseline) {
  const regressions = [];
  const improvements = [];
  for (const [file, counts] of Object.entries(current)) {
    for (const [rule, n] of Object.entries(counts)) {
      const allowed = baseline[file]?.[rule] ?? 0;
      if (n > allowed) regressions.push({ file, rule, n, allowed });
    }
  }
  for (const [file, counts] of Object.entries(baseline)) {
    for (const [rule, allowed] of Object.entries(counts)) {
      const n = current[file]?.[rule] ?? 0;
      if (n < allowed) improvements.push({ file, rule, n, allowed });
    }
  }
  return { regressions, improvements };
}

/* ───────────────────────── 2. Token contrast ───────────────────────── */

/**
 * Pairs the UI renders. min = WCAG 2.x: 4.5 body text, 3 non-text/focus.
 * A background written `token/NN` is that token at NN% over --background and
 * over --card (the `bg-success/10 text-success` badge pattern); both must pass.
 * An optional 4th entry limits a pair to one theme. Pairs whose tokens a site
 * does not define are skipped.
 */
export const CONTRAST_PAIRS = [
  ["foreground", "background", 4.5],
  ["card-foreground", "card", 4.5],
  ["popover-foreground", "popover", 4.5],
  ["muted-foreground", "background", 4.5],
  ["muted-foreground", "card", 4.5],
  ["muted-foreground", "muted", 4.5],
  ["secondary-foreground", "secondary", 4.5],
  ["primary-foreground", "primary", 4.5],
  ["accent-foreground", "accent", 4.5],
  ["brand-gold-ink", "background", 4.5],
  ["brand-gold-on-primary", "primary", 3],
  ["brand-gold-foreground", "brand-gold", 4.5],
  ["ring", "background", 3],
  ["ring", "card", 3],
  ["destructive", "background", 4.5],
  ["destructive-foreground", "destructive", 4.5],
  ["success", "background", 4.5],
  ["success-foreground", "success", 4.5],
  ["warning", "background", 4.5],
  ["warning-foreground", "warning", 4.5],
  ["info", "background", 4.5],
  ["info-foreground", "info", 4.5],
  ["sidebar-foreground", "sidebar", 4.5],
  // Status text on its own tint — the dominant badge/callout pattern.
  ["success", "success/10", 4.5],
  ["warning", "warning/10", 4.5],
  ["destructive", "destructive/10", 4.5],
  ["info", "info/10", 4.5],
  ["brand-gold-ink", "brand-gold/10", 4.5],
  // Stronger tints are a usage rule, not a token property: with browser (sRGB)
  // compositing, same-colour text on a /20 tint lands near 4:1 in light and
  // 3.8:1 in dark. The strong-tint-text drift rule keeps such text on /10.
  // Faint is for icons: 3:1 non-text contrast on every neutral surface.
  ["faint", "background", 3],
  ["faint", "card", 3],
  ["faint", "muted", 3],
];

/**
 * Measured failures accepted for a stated reason. They warn on every run
 * instead of failing; a ratio that drops below `floor`, or a failure not
 * listed, still fails. Sites list theirs in config.knownContrastGaps.
 * pxlpeak's list has been empty since the 2026-11-02 status-colour retune.
 */
export const KNOWN_CONTRAST_GAPS = [];

const isKnownGap = (c, gaps) =>
  gaps.some((g) => g.theme === c.theme && g.fgName === c.fgName && g.bgName === c.bgName && c.ratio >= g.floor - 0.005);

/** Custom properties declared directly inside every block whose selector matches. */
function blockVars(css, selector) {
  const vars = {};
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(^|[\\s,}])${esc}\\s*\\{`, "g");
  for (const m of clean.matchAll(re)) {
    let depth = 0, i = m.index + m[0].length - 1, start = i + 1;
    for (; i < clean.length; i++) {
      if (clean[i] === "{") depth++;
      else if (clean[i] === "}" && --depth === 0) break;
    }
    const body = clean.slice(start, i).replace(/\{[^{}]*\}/g, ""); // drop nested rules
    for (const v of body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) vars[v[1]] = v[2].trim();
  }
  return vars;
}

function mediaDarkVars(css) {
  const out = {};
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of clean.matchAll(/@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*\{/g)) {
    let depth = 0, i = m.index + m[0].length - 1, start = i + 1;
    for (; i < clean.length; i++) { if (clean[i] === "{") depth++; else if (clean[i] === "}" && --depth === 0) break; }
    Object.assign(out, blockVars(clean.slice(start, i), ":root"));
  }
  return out;
}

/** Light and dark custom-property maps (dark inherits light). `@theme` blocks count as light. */
export function readThemes(css, themes = { light: ":root", dark: ".dark" }) {
  const light = { ...blockVars(css, "@theme"), ...blockVars(css, "@theme inline"), ...blockVars(css, themes.light) };
  const out = { light };
  if (themes.dark) {
    const dark = themes.dark === "media" ? mediaDarkVars(css) : blockVars(css, themes.dark);
    if (Object.keys(dark).length) out.dark = { ...light, ...dark };
  }
  return out;
}

/**
 * Resolve a pair's token name through var() chains. The top-level name may be
 * declared as `--background` or Tailwind v4's `--color-background`; a var()
 * reference names one exact property, so it gets no prefix fallback (otherwise
 * `--color-ring: var(--ring)` with no --ring would loop back to itself).
 */
function resolve(vars, name, seen = new Set(), exact = false) {
  const key = vars[name] !== undefined ? name : !exact && vars[`color-${name}`] !== undefined ? `color-${name}` : null;
  if (!key) return undefined;
  if (seen.has(key)) throw new Error(`token cycle at --${key}`);
  seen.add(key);
  const v = vars[key];
  const ref = v.match(/^var\(--([\w-]+)(?:\s*,\s*([^)]*))?\)$/);
  if (ref) return resolve(vars, ref[1], seen, true) ?? (ref[2]?.trim() || undefined);
  const hslRef = v.match(/^hsla?\(\s*var\(--([\w-]+)\)\s*\)$/); // shadcn v3: hsl(var(--x)) over a bare triplet
  if (hslRef) return resolve(vars, hslRef[1], seen, true);
  return v;
}

function oklchToRgb(L, C, h) {
  const a = C * Math.cos((h * Math.PI) / 180);
  const b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((v) => Math.min(1, Math.max(0, v))); // linear sRGB, gamut-clipped
}

const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

function hslToLinear(h, s, l) {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)].map(srgbToLinear);
}

const num = (v, scale = 1) => (v.endsWith("%") ? (parseFloat(v) / 100) * scale : parseFloat(v));
const alphaOf = (a) => (a === undefined ? 1 : a.endsWith("%") ? parseFloat(a) / 100 : parseFloat(a));

/** Parse a CSS colour into linear sRGB + alpha. Returns null when unsupported (color-mix, keywords…). */
export function parseColor(value) {
  const v = value.trim().toLowerCase();
  let m;
  if ((m = v.match(/^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+%?))?\s*\)$/)))
    return { rgb: oklchToRgb(num(m[1]), parseFloat(m[2]), parseFloat(m[3])), alpha: alphaOf(m[4]) };
  if ((m = v.match(/^#([0-9a-f]{3,8})$/))) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
    if (h.length !== 6 && h.length !== 8) return null;
    const rgb = [0, 2, 4].map((i) => srgbToLinear(parseInt(h.slice(i, i + 2), 16) / 255));
    return { rgb, alpha: h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1 };
  }
  if ((m = v.match(/^rgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)\s*(?:[,/]\s*([\d.]+%?))?\s*\)$/)))
    return { rgb: [m[1], m[2], m[3]].map((c) => srgbToLinear(num(c, 255) / 255)), alpha: alphaOf(m[4]) };
  const hsl = v.match(/^(?:hsla?\()?\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%\s*(?:[,/]\s*([\d.]+%?))?\s*\)?$/);
  if (hsl) return { rgb: hslToLinear(parseFloat(hsl[1]), parseFloat(hsl[2]) / 100, parseFloat(hsl[3]) / 100), alpha: alphaOf(hsl[4]) };
  if (v === "white") return { rgb: [1, 1, 1], alpha: 1 };
  if (v === "black") return { rgb: [0, 0, 0], alpha: 1 };
  return null;
}

/** Back-compat name used by the pxlpeak tests. */
export const parseOklch = parseColor;

const luminance = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

const linearToSrgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

/**
 * Alpha-blend in gamma-encoded sRGB, as browsers composite layers (including
 * Tailwind's `bg-x/10`, a colour with alpha). Blending in linear light makes a
 * translucent layer look brighter than it renders and overstates contrast.
 */
const blend = (top, ground, alpha) =>
  top.map((c, i) => srgbToLinear(linearToSrgb(c) * alpha + linearToSrgb(ground[i]) * (1 - alpha)));

export function contrastRatio(fg, bg) {
  const rgb = fg.alpha < 1 ? blend(fg.rgb, bg.rgb, fg.alpha) : fg.rgb;
  const [hi, lo] = [luminance(rgb), luminance(bg.rgb)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Blend `top` at `alpha` over an opaque `ground` (sRGB compositing). */
const over = (top, ground, alpha) => ({ rgb: blend(top.rgb, ground.rgb, alpha), alpha: 1 });

/**
 * Evaluate every pair in every theme. Result rows carry `ok`, or `skipped` with
 * a reason when a token is undefined (or unparseable and strictTokens is off).
 */
export function checkContrast(css, { themes, pairs = CONTRAST_PAIRS, strictTokens = true } = {}) {
  const out = [];
  for (const [theme, vars] of Object.entries(readThemes(css, themes))) {
    const lookup = (name) => {
      const raw = resolve(vars, name);
      if (raw === undefined) return { missing: true };
      const c = parseColor(raw);
      return c ? { color: c } : { unparsed: raw };
    };
    for (const [fgName, bgSpec, min, onlyTheme] of pairs) {
      if (onlyTheme && onlyTheme !== theme) continue;
      const tint = bgSpec.match(/^([\w-]+)\/(\d+)$/);
      const grounds = tint ? ["background", "card"] : [null];
      for (const ground of grounds) {
        const bgName = tint ? `${bgSpec} over ${ground}` : bgSpec;
        const parts = [lookup(fgName), lookup(tint ? tint[1] : bgSpec), ...(ground ? [lookup(ground)] : [])];
        const missing = parts.find((p) => p.missing);
        const unparsed = parts.find((p) => p.unparsed);
        if (missing) { out.push({ theme, fgName, bgName, min, skipped: "token not defined" }); continue; }
        if (unparsed) {
          if (strictTokens) out.push({ theme, fgName, bgName, min, ratio: NaN, ok: false, note: `cannot parse "${unparsed.unparsed}"` });
          else out.push({ theme, fgName, bgName, min, skipped: `cannot parse "${unparsed.unparsed}"` });
          continue;
        }
        const [fg, base, under] = parts.map((p) => p.color);
        // A translucent surface (`--card: oklch(100% 0 0 / 0.03)`) shows the page
        // through it: flatten it over --background before measuring.
        const page = lookup("background").color;
        const flat = (c) => (c.alpha < 1 && page ? over({ rgb: c.rgb, alpha: 1 }, page, c.alpha) : c);
        const bg = tint ? over(base, flat(under), Number(tint[2]) / 100) : flat(base);
        const ratio = contrastRatio(fg, bg);
        out.push({ theme, fgName, bgName, min, ratio, ok: ratio >= min });
      }
    }
  }
  return out;
}

/** Palette names a site defines as its own tokens (`--color-slate-100`). */
export function ownPaletteNames(css) {
  return new Set([...css.matchAll(new RegExp(`--color-(${PALETTE})-\\d{2,3}\\s*:`, "g"))].map((m) => m[1]));
}

/* ───────────────────────── CLI ───────────────────────── */

function main(argv) {
  const mode = argv.includes("--update") ? "update" : argv.includes("--report") ? "report" : argv.includes("--json") ? "json" : "check";
  const config = loadConfig();
  const css = fs.readFileSync(path.join(root, config.css), "utf8");
  const current = scanTree(config, root, ownPaletteNames(css));
  const contrast = checkContrast(css, {
    themes: config.themes,
    pairs: [...CONTRAST_PAIRS, ...config.extraPairs],
    strictTokens: config.strictTokens,
  });
  const gaps = [...KNOWN_CONTRAST_GAPS, ...config.knownContrastGaps];
  const measured = contrast.filter((c) => !c.skipped);
  const contrastFails = measured.filter((c) => !c.ok && !isKnownGap(c, gaps));
  const contrastKnown = measured.filter((c) => !c.ok && isKnownGap(c, gaps));
  const baselinePath = path.join(root, config.baseline);
  const totals = {};
  for (const counts of Object.values(current)) for (const [r, n] of Object.entries(counts)) totals[r] = (totals[r] || 0) + n;

  if (mode === "json") {
    const failing = measured.filter((c) => !c.ok).map((c) => ({ theme: c.theme, fg: c.fgName, bg: c.bgName, ratio: Number(c.ratio.toFixed(2)), min: c.min }));
    console.log(JSON.stringify({ rules: config.rules, totals, files: Object.keys(current).length, pairsMeasured: measured.length, pairsSkipped: contrast.length - measured.length, failing }));
    return;
  }

  if (mode === "update") {
    fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
    fs.writeFileSync(baselinePath, JSON.stringify(current, null, 2) + "\n");
    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    console.log(`design tokens: baseline written — ${total} recorded exceptions in ${Object.keys(current).length} files`);
  }

  if (mode === "report") {
    console.log(`Drift by rule (enabled: ${config.rules.join(", ")}):`);
    for (const r of config.rules) console.log(`  ${r.padEnd(22)} ${String(totals[r] || 0).padStart(4)}`);
    console.log("\nContrast:");
    for (const c of contrast)
      console.log(c.skipped
        ? `  skip ${c.theme.padEnd(5)} ${c.fgName} on ${c.bgName} (${c.skipped})`
        : `  ${c.ok ? "ok  " : "FAIL"} ${c.theme.padEnd(5)} ${c.fgName} on ${c.bgName}: ${c.ratio.toFixed(2)} (min ${c.min})`);
  }

  let failed = false;
  for (const c of contrastKnown)
    console.warn(`design tokens: known contrast gap — ${c.theme} --${c.fgName} on --${c.bgName} = ${c.ratio.toFixed(2)}:1 (needs ${c.min}:1)`);
  if (contrastFails.length) {
    failed = true;
    console.error("design tokens: contrast below WCAG minimum");
    for (const c of contrastFails)
      console.error(`  ${c.theme}: --${c.fgName} on --${c.bgName} = ${Number.isNaN(c.ratio) ? "?" : c.ratio.toFixed(2)}:1 (needs ${c.min}:1)${c.note ? ` — ${c.note}` : ""}`);
  }

  if (mode !== "update") {
    const baseline = fs.existsSync(baselinePath) ? JSON.parse(fs.readFileSync(baselinePath, "utf8")) : {};
    const { regressions, improvements } = compareToBaseline(current, baseline);
    if (regressions.length) {
      failed = true;
      console.error(`design tokens: ${regressions.length} new violation(s) beyond the baseline`);
      for (const { file, rule, n, allowed } of regressions)
        console.error(`  ${file}: ${rule} ${allowed} → ${n}\n    fix: ${RULES[rule].fix}`);
    }
    if (improvements.length)
      console.log(
        `design tokens: ${improvements.length} baseline entr${improvements.length === 1 ? "y" : "ies"} paid down — run with --update to lock the gain in`
      );
    if (!failed) console.log(`design tokens: ok (${measured.length} contrast pairs, no new drift)`);
  }

  process.exitCode = failed ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
