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
