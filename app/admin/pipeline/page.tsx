import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminSessionToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import PipelineClient from "./pipeline-client";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function AdminPipelinePage() {
  const c = await cookies();
  if (!verifyAdminSessionToken(c.get(ADMIN_COOKIE)?.value)) {
    return (
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "4rem 1.5rem", textAlign: "center" }}>
        <p style={{ fontSize: "1.1rem", color: "var(--navy)" }}>Please sign in to view the relationship pipeline.</p>
        <a href="/admin" style={{ color: "var(--pink)", fontWeight: 700 }}>Go to Admin</a>
      </main>
    );
  }
  const { data, error } = await supabase.from("warm_contacts").select("*").order("updated_at", { ascending: false });
  const tableMissing = !!error;
  const contacts = (data || []) as Record<string, unknown>[];
  return <PipelineClient initialContacts={contacts} tableMissing={tableMissing} />;
}
