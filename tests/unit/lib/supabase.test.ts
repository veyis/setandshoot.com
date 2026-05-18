import { describe, it, expect, vi, beforeEach } from "vitest";

describe("createBrowserClient", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://api.setandshoot.com");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
  });

  it("creates a client when env vars are set", async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const client = createClient();
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });

  it("throws when env vars are missing", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const { createClient } = await import("@/lib/supabase/client");
    expect(() => createClient()).toThrow(/Missing NEXT_PUBLIC_SUPABASE/);
  });
});
