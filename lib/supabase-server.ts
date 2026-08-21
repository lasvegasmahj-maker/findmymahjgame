import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client using service role key
// Only used in server components — never exposed to the browser
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Lazy singleton for module-scope use. Next evaluates route modules while collecting page
// data during build, where env vars may be absent (the Vercel Preview failure mode), so the
// client must not construct until the first real query. Missing configuration then surfaces
// as a clear runtime error on the affected endpoint instead of failing the whole deployment.
import type { SupabaseClient } from "@supabase/supabase-js";
let lazyCached: SupabaseClient | null = null;
export function lazyServerClient(): SupabaseClient {
  return new Proxy({} as SupabaseClient, {
    get(_t, prop) {
      if (!lazyCached) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key) throw new Error("Supabase server env vars missing at runtime");
        lazyCached = createClient(url, key);
      }
      return (lazyCached as unknown as Record<string | symbol, unknown>)[prop];
    },
  });
}
