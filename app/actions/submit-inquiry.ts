"use server";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

  return { success: true };
}
