import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

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
  },
};

export default withSentryConfig(withNextIntl(config), {
  silent: true,
  tunnelRoute: "/monitoring",
});
