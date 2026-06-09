import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminSessionToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import ProfilesAdminClient from "./profiles-admin-client";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function AdminAmbassadorProfilesPage() {
  const c = await cookies();
  if (!verifyAdminSessionToken(c.get(ADMIN_COOKIE)?.value)) {
    return (
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "4rem 1.5rem", textAlign: "center" }}>
        <p style={{ fontSize: "1.1rem", color: "var(--navy)" }}>Please sign in to manage ambassador profiles.</p>
        <a href="/admin" style={{ color: "var(--pink)", fontWeight: 700 }}>Go to Admin</a>
      </main>
    );
  }
  // Approved ambassadors are eligible for a public profile.
  const { data, error } = await supabase
    .from("ambassadors").select("*")
    .in("status", ["approved", "contacted"])
    .order("created_at", { ascending: false });
  const tableMissing = !!error;
  const ambassadors = (data || []) as Record<string, unknown>[];
  const publishedCount = ambassadors.filter((a) => a.profile_status === "published").length;
  return <ProfilesAdminClient initialAmbassadors={ambassadors} tableMissing={tableMissing} publishedCount={publishedCount} />;
}
