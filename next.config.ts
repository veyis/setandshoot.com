import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";
import { withPayload } from "@payloadcms/next/withPayload";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 90],
    deviceSizes: [640, 768, 1024, 1280, 1536, 1920, 2880],
    imageSizes: [16, 32, 64, 96, 128, 256, 384, 512],
    remotePatterns: [
      { protocol: "https", hostname: "*.setandshoot.com", pathname: "/**" },
      // Cloudflare R2 public serving (cdn.setandshoot.com covered above; r2.dev
      // is the interim public URL until the custom domain is bound).
      { protocol: "https", hostname: "*.r2.dev", pathname: "/**" },
    ],
  },
};

export default withSentryConfig(withPayload(withNextIntl(config)), {
  silent: true,
  tunnelRoute: "/monitoring",
});
