import { NextResponse } from "next/server";
import { coreIdentity, overrideSummary } from "@/lib/ask-core/index.ts";
import { FMG_SITE } from "@/lib/ask-site";

// Which shared Ask core this site is serving, so the parity check can compare the two sites
// without reading either one's code. No secrets, no configuration values, only identity.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      site: FMG_SITE.site,
      ...coreIdentity(),
      overrides: overrideSummary(FMG_SITE),
      build: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
