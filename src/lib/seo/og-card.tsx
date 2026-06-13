import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

/** Branded 1200×630 OG card: page title + wordmark on the brand background. */
export function ogCard({ title }: { title: string }) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0b0b0c",
        color: "#f5f5f4",
        padding: "80px",
      }}
    >
      <div style={{ fontSize: 30, letterSpacing: 4, color: "#E63946", textTransform: "uppercase" }}>
        Set &amp; Shoot
      </div>
      <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1, maxWidth: 900 }}>{title}</div>
      <div style={{ fontSize: 34, color: "#a3a3a3" }}>
        Belin Akguel · Volleyball-Fotografie · Bremen
      </div>
    </div>,
    { ...OG_SIZE },
  );
}
