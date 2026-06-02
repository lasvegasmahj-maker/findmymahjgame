import { createClient } from "@supabase/supabase-js";

// Fall back to a harmless placeholder so the build never fails when env vars
// are absent. Real env vars take precedence and power live data.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
