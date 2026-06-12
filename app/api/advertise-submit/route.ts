import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { escapeHtml, isValidEmail, clampText, safeHttpUrl } from "@/lib/sanitize";
import { getHmacSecret } from "@/lib/hmac";

const LISTING_TYPES = ["venue", "instructor", "event", "brand"];

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function signToken(submissionId: string, action: string): string {
  const expires = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = `${submissionId}:${action}:${expires}`;
  const sig = crypto.createHmac("sha256", getHmacSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

function buildApprovalEmail(data: Record<string, string>, submissionId: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://findmymahjgame.com";
  const approveUrl = `${siteUrl}/api/advertise-approve?token=${signToken(submissionId, "approve")}`;
  const rejectUrl = `${siteUrl}/api/advertise-approve?token=${signToken(submissionId, "reject")}`;

  const typeLabels: Record<string, string> = {
    venue: "Venue Listing",
    instructor: "Instructor Listing",
    event: "Event Listing",
    brand: "Brand Advertising",
  };

  // Escaped view of every text field, plus scheme-validated URLs for href/src.
  const d: Record<string, string> = {};
  for (const key of Object.keys(data)) d[key] = escapeHtml(data[key]);
  const websiteUrl = safeHttpUrl(data.website);
  const registrationUrl = safeHttpUrl(data.registrationUrl);
  const facebookUrl = safeHttpUrl(data.facebook);
  const logoUrl = safeHttpUrl(data.logoUrl);

  const allRows: Array<[string, string]> = [
    ["Contact", `${d.contactName} (${d.contactEmail})`],
    ["Type", typeLabels[data.listingType] ?? d.listingType],
    ["Name", d.displayName ?? ""],
  ];
  if (data.address) allRows.push(["Address", `${d.address}, ${d.city}, ${d.stateName}`]);
  else if (data.city) allRows.push(["Location", `${d.city ?? ""}${data.stateName ? `, ${d.stateName}` : ""}`]);
  if (data.hours) allRows.push(["Mahjong Hours", d.hours]);
  if (data.eventDate) allRows.push(["Event Date", d.eventDate]);
  if (data.eventType) allRows.push(["Event Type", d.eventType]);
  if (data.eventLocation) allRows.push(["Event Location", d.eventLocation]);
  if (data.price) allRows.push(["Price", d.price]);
  if (registrationUrl) allRows.push(["Registration Link", `<a href="${escapeHtml(registrationUrl)}" style="color:#e91e8c">${d.registrationUrl}</a>`]);
  if (data.bio) allRows.push(["Bio", d.bio]);
  if (data.whatOffered) allRows.push(["What Offered", d.whatOffered]);
  if (data.targetStates) allRows.push(["Target States", d.targetStates]);
  if (data.description) allRows.push(["Description", d.description]);
  if (websiteUrl) allRows.push(["Website", `<a href="${escapeHtml(websiteUrl)}" style="color:#e91e8c">${d.website}</a>`]);
  if (data.instagram) allRows.push(["Instagram", d.instagram]);
  if (facebookUrl) allRows.push(["Facebook", `<a href="${escapeHtml(facebookUrl)}" style="color:#e91e8c">${d.facebook}</a>`]);
  if (logoUrl) allRows.push(["Logo URL", `<a href="${escapeHtml(logoUrl)}" style="color:#e91e8c">View logo</a>`]);
  if (data.notes) allRows.push(["Notes", d.notes]);
  const rows = allRows;

  const rowsHtml = rows.map(([label, value]) => `
    <tr>
      <td style="padding:9px 14px;font-size:0.82rem;font-weight:700;color:#6b7280;white-space:nowrap;vertical-align:top;border-bottom:1px solid #e8eaf0;width:140px;">${label}</td>
      <td style="padding:9px 14px;font-size:0.88rem;color:#1a1a2e;border-bottom:1px solid #e8eaf0;line-height:1.6;">${value}</td>
    </tr>
  `).join("");

  const logoSection = logoUrl
    ? `<div style="text-align:center;margin-bottom:20px;"><img src="${escapeHtml(logoUrl)}" alt="Logo" style="max-height:80px;max-width:200px;object-fit:contain;border-radius:8px;" /></div>`
    : "";

  return `
<div style="font-family:sans-serif;max-width:620px;margin:0 auto;color:#1a1a2e;">

  <div style="background:#1a1f5e;padding:28px 32px 20px;border-radius:12px 12px 0 0;">
    <div style="font-family:Georgia,serif;font-size:1.3rem;color:white;margin-bottom:4px;">New Listing Submission</div>
    <div style="font-size:0.82rem;color:rgba(255,255,255,0.6);">Find My Mahj Game &bull; Needs your approval</div>
  </div>

  <div style="background:#f4f6ff;padding:24px 32px;border:1px solid #e8eaf0;border-top:none;border-radius:0 0 12px 12px;">

    <p style="font-size:0.9rem;color:#6b7280;margin-bottom:20px;">Review the listing below. If everything looks right, click <strong style="color:#1a6e3a;">Approve</strong> to publish it.
      If something's off, click <strong style="color:#dc2626;">Reject</strong> and follow up with the advertiser.
    </p>

    <!-- Preview card -->
    <div style="background:white;border:1.5px solid #e8eaf0;border-radius:12px;padding:24px;margin-bottom:20px;">
      <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#e91e8c;margin-bottom:10px;">
        ${typeLabels[data.listingType] ?? data.listingType}
      </div>
      ${logoSection}
      <h2 style="font-family:Georgia,serif;font-size:1.4rem;color:#1a1f5e;margin-bottom:6px;">${d.displayName || "(no name)"}</h2>
      ${data.city ? `<p style="font-size:0.85rem;color:#6b7280;margin-bottom:12px;"> ${d.city}${data.stateName ? `, ${d.stateName}` : ""}${data.address ? ` &bull; ${d.address}` : ""}</p>` : ""}
      ${data.hours ? `<p style="font-size:0.85rem;color:#6b7280;margin-bottom:8px;"> ${d.hours}</p>` : ""}
      ${data.eventDate ? `<p style="font-size:0.85rem;color:#6b7280;margin-bottom:8px;"> ${d.eventDate}${data.eventType ? ` &bull; ${d.eventType}` : ""}</p>` : ""}
      ${data.price ? `<p style="font-size:0.85rem;color:#6b7280;margin-bottom:8px;"> ${d.price}</p>` : ""}
      ${data.description ? `<p style="font-size:0.88rem;color:#374151;line-height:1.7;margin-bottom:12px;">${d.description}</p>` : ""}
      ${data.bio ? `<p style="font-size:0.88rem;color:#374151;line-height:1.7;margin-bottom:8px;"><strong>Bio:</strong> ${d.bio}</p>` : ""}
      ${data.whatOffered ? `<p style="font-size:0.88rem;color:#374151;line-height:1.7;margin-bottom:8px;"><strong>Offers:</strong> ${d.whatOffered}</p>` : ""}
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:12px;">
        ${websiteUrl ? `<a href="${escapeHtml(websiteUrl)}" style="font-size:0.78rem;color:#e91e8c;font-weight:700;text-decoration:none;"> Website</a>` : ""}
        ${data.instagram ? `<span style="font-size:0.78rem;color:#6b7280;"> ${d.instagram}</span>` : ""}
        ${registrationUrl ? `<a href="${escapeHtml(registrationUrl)}" style="font-size:0.78rem;color:#e91e8c;font-weight:700;text-decoration:none;"> Register</a>` : ""}
      </div>
    </div>

    <!-- Full details table -->
    <table style="width:100%;border-collapse:collapse;background:white;border-radius:10px;overflow:hidden;border:1px solid #e8eaf0;margin-bottom:24px;">
      ${rowsHtml}
    </table>

    <!-- Approve / Reject buttons -->
    <div style="display:flex;gap:16px;justify-content:center;margin-bottom:16px;">
      <a href="${approveUrl}" style="background:#1a6e3a;color:white;padding:14px 36px;border-radius:8px;font-weight:700;font-size:1rem;text-decoration:none;display:inline-block;">Approve Listing
      </a>
      <a href="${rejectUrl}" style="background:#dc2626;color:white;padding:14px 28px;border-radius:8px;font-weight:700;font-size:1rem;text-decoration:none;display:inline-block;">Reject
      </a>
    </div>

    <p style="font-size:0.75rem;color:#9ca3af;text-align:center;">Approval links expire in 7 days. Reply to this email to contact the advertiser directly.
    </p>
  </div>
</div>
  `;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      listingType, contactName, contactEmail, displayName,
      city, stateName, address, hours, phone,
      description, website, instagram, facebook, logoUrl,
      eventDate, eventType, eventLocation, registrationUrl, price,
      bio, whatOffered, photoUrl, targetStates, notes,
    } = body;

    if (!contactName || !contactEmail || !listingType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!isValidEmail(contactEmail)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (!LISTING_TYPES.includes(listingType)) {
      return NextResponse.json({ error: "Invalid listing type" }, { status: 400 });
    }

    const clean: Record<string, string> = {
      listingType,
      contactName: clampText(contactName, 120),
      contactEmail: clampText(contactEmail, 254),
      displayName: clampText(displayName, 160),
      city: clampText(city, 80),
      stateName: clampText(stateName, 60),
      address: clampText(address, 200),
      hours: clampText(hours, 200),
      phone: clampText(phone, 40),
      description: clampText(description, 3000),
      website: clampText(website, 500),
      instagram: clampText(instagram, 120),
      facebook: clampText(facebook, 500),
      logoUrl: clampText(logoUrl, 500),
      eventDate: clampText(eventDate, 100),
      eventType: clampText(eventType, 60),
      eventLocation: clampText(eventLocation, 200),
      registrationUrl: clampText(registrationUrl, 500),
      price: clampText(price, 80),
      bio: clampText(bio, 3000),
      whatOffered: clampText(whatOffered, 3000),
      photoUrl: clampText(photoUrl, 500),
      targetStates: clampText(targetStates, 200),
      notes: clampText(notes, 2000),
    };

    // Save to Supabase
    const { data: saved, error: dbError } = await supabase
      .from("listing_submissions")
      .insert({
        listing_type: clean.listingType,
        contact_name: clean.contactName,
        contact_email: clean.contactEmail,
        display_name: clean.displayName || null,
        city: clean.city || null,
        state_name: clean.stateName || null,
        description: clean.description || null,
        website: safeHttpUrl(clean.website) || null,
        instagram: clean.instagram || null,
        facebook: safeHttpUrl(clean.facebook) || null,
        logo_url: safeHttpUrl(clean.logoUrl) || null,
        address: clean.address || null,
        hours: clean.hours || null,
        phone: clean.phone || null,
        event_date: clean.eventDate || null,
        event_type: clean.eventType || null,
        event_location: clean.eventLocation || null,
        registration_url: safeHttpUrl(clean.registrationUrl) || null,
        price: clean.price || null,
        bio: clean.bio || null,
        what_offered: clean.whatOffered || null,
        photo_url: safeHttpUrl(clean.photoUrl) || null,
        target_states: clean.targetStates || null,
        notes: clean.notes || null,
        status: "pending",
      })
      .select("id")
      .single();

    if (dbError) throw new Error(dbError.message);

    const submissionId = saved.id as string;

    // Email Shauna with the approval preview
    await resend.emails.send({
      from: "Find My Mahj Game <hello@findmymahjgame.com>",
      to: "hello@findmymahjgame.com",
      replyTo: clean.contactEmail,
      subject: clampText(`New listing submission: ${clean.displayName || clean.contactName} (${clean.listingType})`, 200),
      html: buildApprovalEmail(clean, submissionId),
    });

    // Confirmation email to advertiser
    await resend.emails.send({
      from: "Find My Mahj Game <hello@findmymahjgame.com>",
      to: clean.contactEmail,
      subject: "We received your listing details",
      html: `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
  <div style="background:#1a1f5e;padding:28px 32px 20px;border-radius:12px 12px 0 0;">
    <div style="font-family:Georgia,serif;font-size:1.2rem;color:white;">Find My Mahj Game</div>
  </div>
  <div style="background:#f4f6ff;padding:28px 32px;border:1px solid #e8eaf0;border-top:none;border-radius:0 0 12px 12px;">
    <h2 style="font-family:Georgia,serif;color:#1a1f5e;font-size:1.2rem;margin-bottom:12px;">Got it, ${escapeHtml(clean.contactName)}!</h2>
    <p style="color:#6b7280;font-size:0.92rem;line-height:1.7;margin-bottom:16px;">We received your listing details for <strong>${escapeHtml(clean.displayName || "your listing")}</strong>.
      We review every listing personally, usually within 1-2 business days, and we'll email you either way. Once approved, you'll be live.
    </p>
    <p style="color:#6b7280;font-size:0.88rem;line-height:1.7;">Questions? Reply to this email or reach us at <a href="mailto:hello@findmymahjgame.com" style="color:#e91e8c;">hello@findmymahjgame.com</a>.
    </p>
  </div>
</div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
