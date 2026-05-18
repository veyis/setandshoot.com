import { createClient } from "@/lib/supabase/server";

export type SiteBootstrap = {
  connected: boolean;
  schemaReady: boolean;
  foundationVersion: number | null;
};

export async function getSiteBootstrap(): Promise<SiteBootstrap> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_meta")
      .select("key, value")
      .eq("key", "foundation")
      .maybeSingle();

    if (error) {
      return { connected: true, schemaReady: false, foundationVersion: null };
    }

    const version =
      data?.value &&
      typeof data.value === "object" &&
      data.value !== null &&
      "version" in data.value
        ? Number((data.value as { version?: number }).version)
        : null;

    return {
      connected: true,
      schemaReady: Boolean(data),
      foundationVersion: Number.isFinite(version) ? version : null,
    };
  } catch {
    return { connected: false, schemaReady: false, foundationVersion: null };
  }
}
