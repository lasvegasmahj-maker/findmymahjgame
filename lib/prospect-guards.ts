// Deterministic prospect admission rules, shared by the ingest script and the test suite.
// A prospect that fails here never enters the CRM, which is what makes rediscovery of a
// suppressed contact or of our own listings impossible by construction.

export type CandidateProspect = {
  name?: string | null;
  organization_name?: string | null;
  public_email?: string | null;
  city?: string | null;
  state?: string | null;
  source_url?: string | null;
  website_url?: string | null;
};

export type KnownEntities = {
  suppressedEmails: Set<string>;
  prospectEmails: Set<string>;
  prospectNames: Set<string>;
  listingEmails: Set<string>;
  listingNameCityKeys: Set<string>;
};

export const norm = (s: unknown): string => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

export function hostOf(u: unknown): string | null {
  try {
    return new URL(String(u)).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// The directory's own canonical entities. Facets of the owner's business must never become
// prospects under any spelling; this list is checked against normalized names and hosts.
export const CANONICAL_EXCLUSIONS = {
  names: ["lasvegasmahjong", "lasvegasmahjongstudio", "findmymahjgame"],
  hosts: ["lasvegasmahj.com", "findmymahjgame.com"],
};

export type AdmissionVerdict = { admit: false; reason: string } | { admit: true; reason: null };

export function admissionVerdict(p: CandidateProspect, known: KnownEntities): AdmissionVerdict {
  const email = (p.public_email || "").toLowerCase();
  const nameKey = norm(p.organization_name || p.name);
  const cityKey = nameKey + "|" + norm(p.city);
  const host = hostOf(p.website_url || p.source_url);

  if (!p.name || !p.city || !p.state || !p.source_url) return { admit: false, reason: "missing identity, location, or source" };
  if (CANONICAL_EXCLUSIONS.names.some((n) => nameKey.includes(n))) return { admit: false, reason: "canonical entity: the directory's own business is never a prospect" };
  if (host && CANONICAL_EXCLUSIONS.hosts.includes(host)) return { admit: false, reason: "canonical entity: the directory's own domain is never a prospect" };
  if (email && known.suppressedEmails.has(email)) return { admit: false, reason: "suppressed contact" };
  if (email && (known.prospectEmails.has(email) || known.listingEmails.has(email))) return { admit: false, reason: "email already known (prospect or listing)" };
  if (known.prospectNames.has(nameKey)) return { admit: false, reason: "prospect already exists" };
  if (known.listingNameCityKeys.has(cityKey)) return { admit: false, reason: "already a listing" };
  return { admit: true, reason: null };
}
