import { escapeHtml } from "@/lib/sanitize";

// Branded body builders for every notify() kind, so lanes A, B, and C produce
// consistent email content without hand-rolling HTML per route. notify() hands
// this HTML to sendEmail(), which always wraps it in the site-wide branded
// shell (logo, navy border, generic footer) unless raw is set, and it never
// is here. Wrapping again with a full page frame would nest two shells inside
// one email, so shell() below is a lightweight content block, not a second
// <html> document: a small text wordmark, the body, and a footer line
// specific to why the recipient got this message.

const NAVY = "#1a1f5e";
const PINK = "#e91e8c";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const FONT_STACK = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

function ctaButton(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="background:${PINK};border-radius:8px;">` +
    `<a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-family:${FONT_STACK};font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">${escapeHtml(label)}</a>` +
    `</td></tr></table>`;
}

function shell(bodyHtml: string): string {
  return `<div style="font-family:${FONT_STACK};color:${NAVY};">` +
    `<div style="font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${NAVY};margin-bottom:20px;">Find My Mahj Game</div>` +
    `<div style="font-size:16px;line-height:1.7;color:${NAVY};">${bodyHtml}</div>` +
    `<div style="margin-top:28px;padding-top:16px;border-top:1px solid ${BORDER};font-size:13px;color:${MUTED};">You are receiving this because of activity on your Find My Mahj Game account.</div>` +
    `</div>`;
}

function joinNames(names: string[]): string {
  const clean = names.filter(Boolean);
  if (clean.length === 0) return "other players nearby";
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")}, and ${clean[clean.length - 1]}`;
}

export function claimReceived(name: string, listingName: string): string {
  return shell(
    `<p>Hi ${escapeHtml(name)},</p>` +
    `<p>We received your claim request for <strong>${escapeHtml(listingName)}</strong>. Our team is reviewing it now and will follow up soon.</p>` +
    `<p>Thank you for keeping your listing accurate for players looking for a game.</p>`
  );
}

export function claimApproved(listingName: string, dashboardUrl: string): string {
  return shell(
    `<p>Good news. Your claim for <strong>${escapeHtml(listingName)}</strong> has been approved.</p>` +
    `<p>You can now manage your listing from your dashboard.</p>` +
    ctaButton("Go to your dashboard", dashboardUrl)
  );
}

export function claimNeedsInfo(listingName: string, reason: string): string {
  return shell(
    `<p>We need more information before we can approve your claim for <strong>${escapeHtml(listingName)}</strong>.</p>` +
    `<p>${escapeHtml(reason)}</p>` +
    `<p>Reply to this email with the details and we will continue the review.</p>`
  );
}

export function claimRejected(listingName: string, reason: string): string {
  return shell(
    `<p>We were not able to approve your claim for <strong>${escapeHtml(listingName)}</strong>.</p>` +
    `<p>${escapeHtml(reason)}</p>` +
    `<p>If you believe this is a mistake, reply to this email and we will take another look.</p>`
  );
}

export function tableProposed(firstNames: string[], dayTime: string, cityArea: string, respondUrl: string): string {
  return shell(
    `<p>A table is coming together for <strong>${escapeHtml(dayTime)}</strong> in <strong>${escapeHtml(cityArea)}</strong>, with ${escapeHtml(joinNames(firstNames))}.</p>` +
    `<p>Let us know if you can make it.</p>` +
    ctaButton("Respond to this table", respondUrl)
  );
}

export function playerAccepted(firstName: string, tableLabel: string): string {
  return shell(
    `<p>${escapeHtml(firstName)} accepted the invite to <strong>${escapeHtml(tableLabel)}</strong>.</p>` +
    `<p>Check your dashboard for the latest table details.</p>`
  );
}

export function tableConfirmed(tableLabel: string, tableUrl: string): string {
  return shell(
    `<p>Your table, <strong>${escapeHtml(tableLabel)}</strong>, is confirmed.</p>` +
    ctaButton("View your table", tableUrl)
  );
}

export function seatReopened(tableLabel: string): string {
  return shell(
    `<p>A seat opened up at <strong>${escapeHtml(tableLabel)}</strong>. Check your dashboard if you would like to fill it.</p>`
  );
}

export function tableCancelled(tableLabel: string): string {
  return shell(
    `<p>Your table, <strong>${escapeHtml(tableLabel)}</strong>, has been cancelled.</p>` +
    `<p>We are sorry for the disruption. Check your dashboard for other tables near you.</p>`
  );
}

export function billingStatus(statusLine: string): string {
  return shell(
    `<p>${escapeHtml(statusLine)}</p>` +
    `<p>Visit your dashboard to review your membership billing.</p>`
  );
}
