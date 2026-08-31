import { ImageResponse } from "next/og";

// Favicon derived from the OG card's brand system (see src/lib/seo/og-card.tsx):
// same background, accent and wordmark initials. Next serves this at /icon and
// emits the <link rel="icon"> automatically — the site had none (404) until
// 2026-08-31, and Google needs a crawlable square icon of a supported format.
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0b0b0c",
        color: "#f5f5f4",
        fontSize: 220,
        fontWeight: 700,
        letterSpacing: -12,
      }}
    >
      S<span style={{ color: "#E63946" }}>&amp;</span>S
    </div>,
    { ...size },
  );
}
