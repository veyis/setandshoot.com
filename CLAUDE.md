## SEO: run the checker before shipping SEO changes

```bash
node ~/.claude/skills/seo-master-playbook/scripts/verify-seo-fundamentals.mjs --repo .
```

Baseline is **0 errors** (whole portfolio swept 2026-08-17) — so **any error is new**.
Warnings and info are expected; they need judgment, not a reflex fix.

What it enforces, each traceable to a Google primary source:

- **No `keywords` in route metadata** — *"Google Search doesn't use the keywords meta tag."*
  Note it is also a valid schema.org property on Article/CreativeWork; that one is fine.
- **No `HowTo` schema** — retired Sept 2023, nothing consumes it.
- **Keep `FAQPage`** — retired as a Google rich result (7 May 2026) but unpenalized, still
  parsed by other engines, and the visible Q&A is what earns passage extraction anyway.
  **Retired ≠ remove:** the only test is whether anything still consumes it.
- **Statistics need a named source.** A percentage in an SEO claim with no study behind it
  is flagged. Don't add one — that is how a fabricated stat ends up justifying dead code.

Rationale and the full system: `~/.claude/skills/seo-master-playbook/`
(SKILL.md · PLAYBOOK.md Part 4 and Phase 12a · `references/google-primary.md` for what
Google states is **not** a ranking factor).
