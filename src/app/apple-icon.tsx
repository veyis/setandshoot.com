import { ImageResponse } from "next/og";

// iOS home-screen icon; same brand system as icon.tsx.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
        fontSize: 78,
        fontWeight: 700,
        letterSpacing: -4,
      }}
    >
      S<span style={{ color: "#E63946" }}>&amp;</span>S
    </div>,
    { ...size },
  );
}
