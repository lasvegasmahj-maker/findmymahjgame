import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PRICING_HTML = `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">

  <div style="background: #1a1f5e; padding: 32px 32px 24px; border-radius: 12px 12px 0 0;">
    <div style="font-family: Georgia, serif; font-size: 1.4rem; color: white; margin-bottom: 4px;">Find My Mahj Game</div>
    <div style="font-size: 0.85rem; color: rgba(255,255,255,0.6);">Advertising Options</div>
  </div>

  <div style="background: #f4f6ff; padding: 28px 32px; border-radius: 0 0 12px 12px; border: 1px solid #e8eaf0; border-top: none;">

    <p style="font-size: 0.95rem; color: #6b7280; line-height: 1.7; margin-bottom: 20px;">
      Thanks for your interest in advertising on Find My Mahj Game! Here are our current options. Once you've picked a plan, click the button at the bottom to submit your full listing details.
    </p>

    <!-- Founding Partner highlight -->
    <div style="background: linear-gradient(135deg, #fffdf0, #fff8dc); border: 2px solid #f5c842; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px;">
      <div style="font-family: Georgia, serif; font-size: 1rem; color: #5a4000; margin-bottom: 6px;">Founding Partner Offer</div>
      <p style="font-size: 0.88rem; color: #7a6020; margin: 0 0 8px; line-height: 1.6;">
        You're getting in early. Use code <strong>FINDMYMAHJ</strong> to unlock <strong>6 months free</strong> on any listing. After your free period, Founding Partners lock in <strong>30% off their rate for life</strong> -- as long as you stay listed. Only a limited number of spots are available.
      </p>
      <p style="font-size: 0.82rem; color: #a07800; margin: 0;">Just mention the code when you reply and we'll apply it to your listing.</p>
    </div>

    <!-- Venue Listings -->
    <h2 style="font-family: Georgia, serif; font-size: 1.1rem; color: #1a1f5e; border-bottom: 2px solid #e8eaf0; padding-bottom: 8px; margin-bottom: 16px;">Venue Listings</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 0.88rem;">
      <tr style="background: #1a1f5e; color: white;">
        <th style="padding: 10px 12px; text-align: left;">Tier</th>
        <th style="padding: 10px 12px; text-align: left;">What's included</th>
        <th style="padding: 10px 12px; text-align: left;">Monthly</th>
        <th style="padding: 10px 12px; text-align: left;">Annual</th>
      </tr>
      <tr style="background: white;">
        <td style="padding: 10px 12px; font-weight: 700; color: #1a1f5e; border-bottom: 1px solid #e8eaf0;">Starter</td>
        <td style="padding: 10px 12px; color: #6b7280; border-bottom: 1px solid #e8eaf0;">Name, city, hours, description, website link</td>
        <td style="padding: 10px 12px; color: #e91e8c; font-weight: 700; border-bottom: 1px solid #e8eaf0;">$19/mo</td>
        <td style="padding: 10px 12px; color: #1a6e3a; font-weight: 700; border-bottom: 1px solid #e8eaf0;">$129/yr</td>
      </tr>
      <tr style="background: #f4f6ff;">
        <td style="padding: 10px 12px; font-weight: 700; color: #1a1f5e; border-bottom: 1px solid #e8eaf0;">Featured Spot ⭐</td>
        <td style="padding: 10px 12px; color: #6b7280; border-bottom: 1px solid #e8eaf0;">Top placement, highlighted listing, photo</td>
        <td style="padding: 10px 12px; color: #e91e8c; font-weight: 700; border-bottom: 1px solid #e8eaf0;">$39/mo</td>
        <td style="padding: 10px 12px; color: #1a6e3a; font-weight: 700; border-bottom: 1px solid #e8eaf0;">$329/yr</td>
      </tr>
      <tr style="background: white;">
        <td style="padding: 10px 12px; font-weight: 700; color: #1a1f5e;">Official Mahj Spot</td>
        <td style="padding: 10px 12px; color: #6b7280;">Featured + homepage placement + displayable badge</td>
        <td style="padding: 10px 12px; color: #e91e8c; font-weight: 700;">$79/mo</td>
        <td style="padding: 10px 12px; color: #1a6e3a; font-weight: 700;">$699/yr</td>
      </tr>
    </table>

    <!-- Event Listings -->
    <h2 style="font-family: Georgia, serif; font-size: 1.1rem; color: #1a1f5e; border-bottom: 2px solid #e8eaf0; padding-bottom: 8px; margin-bottom: 16px;">Event &amp; Tournament Listings</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 0.88rem;">
      <tr style="background: #1a1f5e; color: white;">
        <th style="padding: 10px 12px; text-align: left;">Type</th>
        <th style="padding: 10px 12px; text-align: left;">Description</th>
        <th style="padding: 10px 12px; text-align: left;">Price</th>
      </tr>
      <tr style="background: white;">
        <td style="padding: 10px 12px; font-weight: 700; color: #1a1f5e; border-bottom: 1px solid #e8eaf0;">Local Event</td>
        <td style="padding: 10px 12px; color: #6b7280; border-bottom: 1px solid #e8eaf0;">Open play or city event, 30-day listing</td>
        <td style="padding: 10px 12px; color: #e91e8c; font-weight: 700; border-bottom: 1px solid #e8eaf0;">$10/event or $199/yr</td>
      </tr>
      <tr style="background: #f4f6ff;">
        <td style="padding: 10px 12px; font-weight: 700; color: #1a1f5e; border-bottom: 1px solid #e8eaf0;">National Event</td>
        <td style="padding: 10px 12px; color: #6b7280; border-bottom: 1px solid #e8eaf0;">Retreat or tournament, 60-day listing, US-wide reach</td>
        <td style="padding: 10px 12px; color: #e91e8c; font-weight: 700; border-bottom: 1px solid #e8eaf0;">$199/listing or $500/yr</td>
      </tr>
    </table>

    <!-- Brand Advertising -->
    <h2 style="font-family: Georgia, serif; font-size: 1.1rem; color: #1a1f5e; border-bottom: 2px solid #e8eaf0; padding-bottom: 8px; margin-bottom: 16px;">Brand &amp; Company Advertising</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 0.88rem;">
      <tr style="background: #1a1f5e; color: white;">
        <th style="padding: 10px 12px; text-align: left;">Placement</th>
        <th style="padding: 10px 12px; text-align: left;">Reach</th>
        <th style="padding: 10px 12px; text-align: left;">Price</th>
      </tr>
      <tr style="background: white;">
        <td style="padding: 10px 12px; font-weight: 700; color: #1a1f5e; border-bottom: 1px solid #e8eaf0;">Sponsored Card (next to map)</td>
        <td style="padding: 10px 12px; color: #6b7280; border-bottom: 1px solid #e8eaf0;">All homepage visitors</td>
        <td style="padding: 10px 12px; color: #e91e8c; font-weight: 700; border-bottom: 1px solid #e8eaf0;">$99/mo</td>
      </tr>
      <tr style="background: #f4f6ff;">
        <td style="padding: 10px 12px; font-weight: 700; color: #1a1f5e; border-bottom: 1px solid #e8eaf0;">Sponsored State Card</td>
        <td style="padding: 10px 12px; color: #6b7280; border-bottom: 1px solid #e8eaf0;">Players in your target state(s)</td>
        <td style="padding: 10px 12px; color: #e91e8c; font-weight: 700; border-bottom: 1px solid #e8eaf0;">$49/mo per state</td>
      </tr>
      <tr style="background: white;">
        <td style="padding: 10px 12px; font-weight: 700; color: #1a1f5e;">Featured Partner Banner</td>
        <td style="padding: 10px 12px; color: #6b7280;">All visitors, sitewide</td>
        <td style="padding: 10px 12px; color: #e91e8c; font-weight: 700;">$229/mo</td>
      </tr>
    </table>

    <!-- Founding Partner -->
    <div style="background: linear-gradient(135deg, #fffdf0, #fff8dc); border: 2px solid #f5c842; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; text-align: center;">
      <div style="font-family: Georgia, serif; font-size: 1.1rem; color: #5a4000; margin-bottom: 6px;">Founding Partner Offer</div>
      <p style="font-size: 0.88rem; color: #7a6020; margin: 0 0 8px;">Use code <strong>FINDMYMAHJ</strong> to lock in 6 months free + 30% off your rate for life once paid listings begin. Limited spots.</p>
    </div>

    <div style="background: #1a1f5e; border-radius: 10px; padding: 20px 24px; text-align: center;">
      <p style="color: rgba(255,255,255,0.8); font-size: 0.9rem; margin: 0 0 12px;">Ready to proceed? Click below to fill out your full listing details. Takes about 3 minutes.</p>
      <a href="https://findmymahjgame.com/advertise/submit" style="background: #e91e8c; color: white; padding: 12px 32px; border-radius: 6px; font-weight: 700; font-size: 0.95rem; text-decoration: none; display: inline-block;">Submit My Listing Details &rarr;</a>
    </div>

    <p style="font-size: 0.75rem; color: #9ca3af; text-align: center; margin-top: 24px;">
      Find My Mahj Game &mdash; findmymahjgame.com
    </p>
  </div>
</div>
`;

export async function POST(req: NextRequest) {
  try {
    const { name, email, company, interest, message } = await req.json();

    if (!name || !email || !interest) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Save to Supabase
    await supabase.from("inquiries").insert({
      name,
      email,
      company: company || null,
      inquiry_type: "advertising",
      interest,
      message: message || null,
      status: "new",
    });

    // Send pricing email to the inquirer
    await resend.emails.send({
      from: "Find My Mahj Game <hello@findmymahjgame.com>",
      to: email,
      subject: "Your Find My Mahj Game advertising options",
      html: PRICING_HTML,
    });

    // Notify Shauna
    await resend.emails.send({
      from: "Find My Mahj Game <hello@findmymahjgame.com>",
      to: "hello@findmymahjgame.com",
      subject: `New advertising inquiry: ${name}${company ? ` (${company})` : ""}`,
      html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1f5e;">New Advertising Inquiry</h2>
        <div style="background: #f4f6ff; border-left: 4px solid #e91e8c; padding: 16px; border-radius: 4px; font-size: 14px; line-height: 1.8; color: #333;">
          <strong>Name:</strong> ${name}<br/>
          ${company ? `<strong>Company:</strong> ${company}<br/>` : ""}
          <strong>Email:</strong> ${email}<br/>
          <strong>Interest:</strong> ${interest}<br/>
          ${message ? `<strong>Message:</strong> ${message}` : ""}
        </div>
        <p style="color: #888; font-size: 12px; margin-top: 16px;">Pricing email was automatically sent to ${email}.</p>
      </div>`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
