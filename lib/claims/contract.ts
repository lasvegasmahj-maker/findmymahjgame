// The provider-claim contract: canonical states, confidence levels, and the
// deterministic evidence scorer. Ownership of a listing is granted only through
// this contract or an admin decision; an LLM may gather or summarize evidence but
// its judgment alone can never grant ownership.

export type ClaimConfidence = "high" | "medium" | "low";
// 'claimed' is the legacy token-flow approval status and counts as a win; the
// account flow uses auto_approved/approved. Exactly one winning claim can exist
// per listing (enforced by the listing_claims_winner unique index), and the
// ownership fact itself is account_id on the listing row, never a claim row.
export type ClaimStatus = "submitted" | "auto_approved" | "needs_review" | "approved" | "rejected" | "withdrawn" | "claimed";
export const WINNING_CLAIM_STATUSES = ["claimed", "approved", "auto_approved"] as const;
export const OPEN_CLAIM_STATUSES = ["submitted", "needs_review"] as const;

export type ClaimEvidence = {
  accountEmail: string;
  listingEmail?: string | null;
  listingWebsite?: string | null;
  listingName?: string | null;
  listingAlreadyOwned?: boolean;
  hasOpenCompetingClaim?: boolean;
};

export type ClaimScore = {
  confidence: ClaimConfidence;
  autoApprove: boolean;
  reasons: string[];
};

// Freemail domains prove who a person is, never what organization they belong to.
const GENERIC_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "icloud.com",
  "me.com", "live.com", "msn.com", "comcast.net", "att.net", "verizon.net",
  "sbcglobal.net", "proton.me", "protonmail.com", "ymail.com", "mail.com",
]);

export function emailDomain(email: string): string {
  return email.trim().toLowerCase().split("@")[1] || "";
}

export function websiteDomain(url: string): string {
  try {
    const u = new URL(url.includes("://") ? url : `https://${url}`);
    return u.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

// Pure and deterministic: same evidence, same verdict, every time. Security rules
// are hard: an owned listing or a competing open claim can never auto-approve, no
// matter how strong the email evidence looks, because those are exactly the cases
// where a takeover attempt looks like a routine claim.
export function scoreClaimEvidence(e: ClaimEvidence): ClaimScore {
  const reasons: string[] = [];
  const accountDomain = emailDomain(e.accountEmail);
  const accountIsGeneric = GENERIC_DOMAINS.has(accountDomain);

  if (e.listingAlreadyOwned) {
    reasons.push("listing already has an owner; possible takeover attempt");
    return { confidence: "low", autoApprove: false, reasons };
  }
  if (e.hasOpenCompetingClaim) {
    reasons.push("another open claim exists for this listing");
    return { confidence: "low", autoApprove: false, reasons };
  }

  const listingEmail = (e.listingEmail || "").trim().toLowerCase();
  if (listingEmail && listingEmail === e.accountEmail.trim().toLowerCase()) {
    reasons.push("account email exactly matches the listing contact email");
    return { confidence: "high", autoApprove: true, reasons };
  }

  const siteDomain = e.listingWebsite ? websiteDomain(e.listingWebsite) : "";
  if (!accountIsGeneric && siteDomain && accountDomain === siteDomain) {
    reasons.push("account email domain matches the listing website domain");
    return { confidence: "high", autoApprove: true, reasons };
  }
  if (!accountIsGeneric && listingEmail && emailDomain(listingEmail) === accountDomain) {
    reasons.push("account email domain matches the listing contact email domain");
    return { confidence: "high", autoApprove: true, reasons };
  }

  // Weaker organizational signals: worth agent-assisted research, never automatic.
  const name = (e.listingName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const localPart = e.accountEmail.trim().toLowerCase().split("@")[0].replace(/[^a-z0-9]/g, "");
  if (!accountIsGeneric && name && accountDomain.replace(/[^a-z0-9]/g, "").includes(name.slice(0, 12))) {
    reasons.push("account email domain resembles the listing name");
    return { confidence: "medium", autoApprove: false, reasons };
  }
  if (name && localPart && name.includes(localPart) && localPart.length >= 5) {
    reasons.push("account email local part appears in the listing name");
    return { confidence: "medium", autoApprove: false, reasons };
  }
  if (!listingEmail && !siteDomain) {
    reasons.push("listing has no contact email or website on record to verify against");
    return { confidence: "medium", autoApprove: false, reasons };
  }

  reasons.push("no deterministic relationship between the account and the listing");
  return { confidence: "low", autoApprove: false, reasons };
}
