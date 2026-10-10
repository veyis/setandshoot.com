import type { MetadataRoute } from "next";
import { env } from "@/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Public auth pages must be crawlable for their noindex metadata to be read.
        disallow: ["/admin", "/account", "/api/"],
      },
      {
        userAgent: [
          "OAI-SearchBot",
          "Claude-SearchBot",
          "PerplexityBot",
          "ChatGPT-User",
          "Claude-User",
          "Gemini-Deep-Research",
        ],
        allow: "/",
        disallow: ["/admin", "/account", "/api/"],
      },
    ],
    sitemap: `${env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
