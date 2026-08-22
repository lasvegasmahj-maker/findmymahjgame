import type { SupabaseClient } from "@supabase/supabase-js";

// PostgREST caps a select at 1000 rows. A truncated scan looks exactly like a clean one, so
// every full-table read that drives a count or a sweep pages through explicitly.
export async function fetchAllRows<T>(
  supabase: SupabaseClient,
  table: string,
  columns: string,
  eqFilters: Array<[string, string]> = []
): Promise<{ rows: T[]; error: string | null }> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    let query = supabase.from(table).select(columns).range(from, from + 999);
    for (const [col, val] of eqFilters) query = query.eq(col, val);
    const { data, error } = await query;
    if (error) return { rows, error: error.message };
    const page = (data || []) as unknown as T[];
    rows.push(...page);
    if (page.length < 1000) return { rows, error: null };
  }
}
