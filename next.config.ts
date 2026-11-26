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
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 768, 1024, 1280, 1536, 1920, 2880],
    imageSizes: [16, 32, 64, 96, 128, 256, 384, 512],
    remotePatterns: [
      { protocol: "https", hostname: "*.setandshoot.com", pathname: "/**" },
      // Cloudflare R2 public serving (cdn.setandshoot.com covered above; r2.dev
      // is the interim public URL until the custom domain is bound).
      { protocol: "https", hostname: "*.r2.dev", pathname: "/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // SAMEORIGIN (not DENY) so Payload admin same-origin live preview
          // keeps working while blocking third-party clickjacking.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://*.clarity.ms https://c.bing.com https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://*.setandshoot.com https://*.r2.dev https://www.googletagmanager.com https://www.google-analytics.com https://*.clarity.ms https://c.bing.com",
              "connect-src 'self' https://*.setandshoot.com https://*.r2.dev https://*.neon.tech https://www.googletagmanager.com https://www.google-analytics.com https://region1.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://*.clarity.ms https://c.bing.com https://vitals.vercel-insights.com https://va.vercel-scripts.com",
              "frame-src 'self'",
              "frame-ancestors 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(withPayload(withNextIntl(config)), {
  silent: true,
  tunnelRoute: "/monitoring",
});
