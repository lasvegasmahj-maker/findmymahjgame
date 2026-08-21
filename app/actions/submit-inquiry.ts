"use server";

import { createClient } from "@supabase/supabase-js";
import { lazyServerClient } from "@/lib/supabase-server";

const supabase = lazyServerClient();

export async function submitInquiry(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const company = formData.get("company") as string | null;
  const topic = formData.get("topic") as string | null;
  const interest = formData.get("interest") as string | null;
  const message = formData.get("message") as string | null;

  // Determine inquiry type from the form fields
  const inquiry_type = interest ? "advertising" : topic ? "general" : "general";

  const { error } = await supabase.from("inquiries").insert({
    name,
    email,
    company: company || null,
    inquiry_type,
    interest: interest || topic || null,
    message: message || null,
    status: "new",
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const subjectLabel = inquiry_type === "advertising" ? "Advertise Inquiry" : "Contact Form";
  const bodyLines = [
    `From: ${name} (${email})`,
    company ? `Company: ${company}` : null,
    interest ? `Interest: ${interest}` : null,
    topic ? `Topic: ${topic}` : null,
    `\nMessage:\n${message || "(no message)"}`,
  ].filter(Boolean).join("\n");

  // Fire-and-forget notify — use absolute URL for server actions
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  await fetch(`${baseUrl}/api/notify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "inquiry",
      subject: `New ${subjectLabel}: ${name}`,
      body: bodyLines,
    }),
  }).catch(() => {});

  return { success: true };
}
