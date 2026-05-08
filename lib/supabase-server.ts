import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client using service role key
// Only used in server components — never exposed to the browser
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
