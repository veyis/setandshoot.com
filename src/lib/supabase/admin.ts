import { createClient } from "@supabase/supabase-js";
import { env } from "@/env";
import type { Database } from "@/types/database.types";

/** Server-only client with service role — bypasses RLS. Never import in client code. */
export function createAdminClient() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
