import { cookies } from "next/headers";
import { verifyAdminSessionToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import AdminLogin from "@/components/admin-login";
import ControlClient from "./control-client";

export const dynamic = "force-dynamic";

export default async function AdminControlPage() {
  const c = await cookies();
  if (!verifyAdminSessionToken(c.get(ADMIN_COOKIE)?.value)) return <AdminLogin />;
  return <ControlClient />;
}
