export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Prefer IPv4: some local networks have broken IPv6 routing to Cloudflare R2,
    // which makes the S3 client's TLS handshake fail. Harmless on Vercel.
    const dns = await import("node:dns");
    dns.setDefaultResultOrder("ipv4first");
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
