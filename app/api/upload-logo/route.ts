import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ACCEPTED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "upload-logo", 5, 60))) return NextResponse.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  const ext = ACCEPTED[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Please upload a JPEG, PNG, or WebP image." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "That image is over 5 MB." }, { status: 400 });
  }

  const filename = `${crypto.randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  // The Content-Type header is attacker-controlled; confirm the real bytes
  // match so a script can't ride in as image/png.
  const sig =
    bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff ? "image/jpeg" :
    bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 ? "image/png" :
    bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" ? "image/webp" :
    null;
  if (sig !== file.type) {
    return NextResponse.json({ error: "That file does not look like a real image. Please upload a JPEG, PNG, or WebP." }, { status: 400 });
  }

  const { error } = await supabase.storage
    .from("logos")
    .upload(filename, bytes, { contentType: file.type, upsert: false });

  if (error) {
    { console.error("upload-logo failed:", error.message); return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }); }
  }

  const { data } = supabase.storage.from("logos").getPublicUrl(filename);
  return NextResponse.json({ url: data.publicUrl });
}
