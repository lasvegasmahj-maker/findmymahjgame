"use client";

import { useEffect, useState } from "react";
import { isPremiumActive } from "@/lib/premium";

type OwnedListing = {
  id: string;
  listing_table: "venue_listings" | "event_listings";
  business_name?: string | null;
  event_name?: string | null;
  city: string | null;
  state: string | null;
  status: string;
  tier: string | null;
  premium_until?: string | null;
  premium_paid?: boolean;
  website?: string | null;
  instagram?: string | null;
  display_email?: string | null;
  description?: string | null;
};

type Claim = {
  id: string;
  listing_table: string;
  listing_id: string;
  status: string;
  confidence: string | null;
  decision_reason: string | null;
  created_at: string;
  decided_at: string | null;
};

type Dashboard = {
  displayName: string | null;
  ownedListings: OwnedListing[];
  claims: Claim[];
  billing: { configured: boolean };
};

type SearchResult = {
  id: string;
  name: string | null;
  city: string | null;
  state: string | null;
  listing_table: "venue_listings" | "event_listings";
};

const EDITABLE: Record<string, string[]> = {
  venue_listings: ["display_email", "website", "instagram", "description"],
  event_listings: ["description"],
};

const FIELD_LABEL: Record<string, string> = {
  display_email: "Contact email",
  website: "Website",
  instagram: "Instagram",
  description: "Description",
};

const STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted, awaiting review",
  needs_review: "Under review",
  auto_approved: "Approved, you own this listing",
  approved: "Approved, you own this listing",
  rejected: "Not approved",
  withdrawn: "Withdrawn",
  claimed: "Claimed",
};

const card: React.CSSProperties = { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.4rem" };
const input: React.CSSProperties = { width: "100%", minHeight: 46, padding: "0 1rem", border: "2px solid var(--border)", borderRadius: 10, fontSize: "0.95rem", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)" };
const textarea: React.CSSProperties = { ...input, minHeight: 90, padding: "0.7rem 1rem", resize: "vertical" as const };
const primaryBtn: React.CSSProperties = { background: "var(--pink)", color: "white", border: "none", borderRadius: 8, padding: "0.7rem 1.3rem", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" };
const quietBtn: React.CSSProperties = { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.7rem 1.3rem", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)" };
const sectionTitle: React.CSSProperties = { fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.35rem", color: "var(--navy)", margin: "0 0 0.8rem" };
const label: React.CSSProperties = { display: "block", fontWeight: 700, color: "var(--navy)", fontSize: "0.85rem", marginBottom: "0.3rem" };

function listingName(l: { business_name?: string | null; event_name?: string | null }): string {
  return l.business_name || l.event_name || "Untitled listing";
}

export default function ProviderClient({ signedIn, gateOpen }: { signedIn: boolean; gateOpen: boolean }) {
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(() => signedIn && gateOpen);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"success" | "neutral">("success");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [startingCheckout, setStartingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("checkout");
    if (q === "success") setNotice("Thanks! Premium activates as soon as your payment is confirmed, usually within a minute.");
    if (q === "cancelled") {
      setNoticeTone("neutral");
      setNotice("Checkout cancelled. Nothing was charged.");
    }
  }, []);

  async function startCheckout() {
    setStartingCheckout(true);
    setCheckoutError("");
    try {
      const r = await fetch("/api/billing/checkout", { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j?.url) {
        window.location.href = j.url;
        return;
      }
      setCheckoutError(j?.error || "Could not start checkout. Please try again.");
    } catch {
      setCheckoutError("Could not start checkout. Please try again.");
    }
    setStartingCheckout(false);
  }

  const canLoad = signedIn && gateOpen;

  useEffect(() => {
    if (!canLoad) return;
    fetch("/api/provider", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((j) => setDash(j))
      .catch(() => setError("Could not load your dashboard. Please refresh."))
      .finally(() => setLoading(false));
  }, [canLoad]);

  async function refreshDashboard() {
    const r = await fetch("/api/provider", { cache: "no-store" });
    if (r.ok) setDash(await r.json());
  }

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setSearching(true);
    setError("");
    try {
      const r = await fetch(`/api/provider/search?q=${encodeURIComponent(query.trim())}`);
      const j = await r.json().catch(() => ({}));
      if (r.ok) setResults(j.results || []);
      else setError(j.error || "Search failed.");
    } catch {
      setError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  async function startClaim(result: SearchResult) {
    setClaiming(`${result.listing_table}:${result.id}`);
    setError("");
    setNotice("");
    try {
      const r = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_table: result.listing_table, listing_id: result.id }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(j.error || "Could not submit your claim.");
        return;
      }
      const status = j.claim?.status ? STATUS_LABEL[j.claim.status] || j.claim.status : "submitted";
      setNotice(`Claim for "${result.name || "that listing"}" ${status.toLowerCase()}.`);
      await refreshDashboard();
    } catch {
      setError("Could not submit your claim. Please try again.");
    } finally {
      setClaiming(null);
    }
  }

  function claimForListing(listingTable: string, listingId: string): Claim | undefined {
    return dash?.claims.find((c) => c.listing_table === listingTable && c.listing_id === listingId);
  }

  function beginEdit(l: OwnedListing) {
    setEditingId(l.id);
    const fields = EDITABLE[l.listing_table] || [];
    const values: Record<string, string> = {};
    for (const f of fields) values[f] = String((l as unknown as Record<string, unknown>)[f] ?? "");
    setEditValues(values);
    setNotice("");
    setError("");
  }

  async function saveEdit(l: OwnedListing) {
    setSavingEdit(true);
    setError("");
    setNotice("");
    try {
      const r = await fetch("/api/provider/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_table: l.listing_table, listing_id: l.id, ...editValues }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(j.error || "Could not submit your changes.");
        return;
      }
      if (!j.pending || j.pending.length === 0) {
        setNotice("No changes to submit.");
      } else {
        setNotice("Your changes were submitted for review. A real person confirms every change before it goes live.");
      }
      setEditingId(null);
    } catch {
      setError("Could not submit your changes. Please try again.");
    } finally {
      setSavingEdit(false);
    }
  }

  if (!signedIn) {
    return (
      <div style={{ ...card, textAlign: "center" }}>
        <p style={{ margin: 0, color: "var(--navy)", fontWeight: 700 }}>Sign in to manage your listings.</p>
        <p style={{ margin: "0.5rem 0 1rem", color: "var(--muted)" }}>
          The provider dashboard is for teachers, hosts, and venues who want to claim and manage their listing.
        </p>
        <a href="/account" style={{ ...primaryBtn, display: "inline-block", textDecoration: "none" }}>
          Sign in
        </a>
      </div>
    );
  }

  if (!gateOpen) {
    return (
      <div style={{ ...card, textAlign: "center" }}>
        <p style={{ margin: 0, color: "var(--navy)", fontWeight: 700 }}>Provider claims are not open yet.</p>
        <p style={{ margin: "0.5rem 0 0", color: "var(--muted)" }}>
          We are still finishing this feature. Check back soon, or email hello@findmymahjgame.com if you need your listing updated now.
        </p>
      </div>
    );
  }

  if (loading) return <p style={{ color: "var(--muted)", textAlign: "center" }}>Loading...</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.6rem" }}>
      {notice && <p role="status" style={{ color: noticeTone === "success" ? "#1a6e3a" : "var(--navy)", fontWeight: 700, margin: 0 }}>{notice}</p>}
      {error && <p role="alert" style={{ color: "#dc2626", fontWeight: 600, margin: 0 }}>{error}</p>}

      <section>
        <h2 style={sectionTitle}>My listings</h2>
        {!dash || dash.ownedListings.length === 0 ? (
          <div style={card}>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              You do not own any listings yet. Search for your listing below to claim it.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            {dash.ownedListings.map((l) => (
              <div key={`${l.listing_table}:${l.id}`} style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.8rem", flexWrap: "wrap" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, color: "var(--navy)" }}>{listingName(l)}</p>
                    <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>
                      {[l.city, l.state].filter(Boolean).join(", ") || "Location not set"} &middot; {l.status}
                      {l.tier ? ` · ${l.tier}` : ""}
                    </p>
                  </div>
                  {editingId !== l.id && (
                    <button type="button" onClick={() => beginEdit(l)} style={quietBtn}>
                      Edit
                    </button>
                  )}
                </div>

                {editingId === l.id && (
                  <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                    {(EDITABLE[l.listing_table] || []).map((f) => (
                      <div key={f}>
                        <label style={label} htmlFor={`edit-${l.id}-${f}`}>
                          {FIELD_LABEL[f] || f}
                        </label>
                        {f === "description" ? (
                          <textarea
                            id={`edit-${l.id}-${f}`}
                            style={textarea}
                            maxLength={600}
                            value={editValues[f] || ""}
                            onChange={(e) => setEditValues((v) => ({ ...v, [f]: e.target.value }))}
                          />
                        ) : (
                          <input
                            id={`edit-${l.id}-${f}`}
                            style={input}
                            maxLength={254}
                            value={editValues[f] || ""}
                            onChange={(e) => setEditValues((v) => ({ ...v, [f]: e.target.value }))}
                          />
                        )}
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: "0.6rem" }}>
                      <button type="button" disabled={savingEdit} onClick={() => saveEdit(l)} style={{ ...primaryBtn, opacity: savingEdit ? 0.7 : 1 }}>
                        {savingEdit ? "Submitting..." : "Submit for review"}
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} style={quietBtn}>
                        Cancel
                      </button>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--muted)" }}>
                      Changes are reviewed by a real person before they go live.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 style={sectionTitle}>Claim a listing</h2>
        <div style={card}>
          <form onSubmit={runSearch} style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <input
              style={{ ...input, flex: "1 1 220px" }}
              placeholder="Search by business name or city"
              aria-label="Search by business name or city"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              maxLength={80}
            />
            <button type="submit" disabled={searching} style={{ ...primaryBtn, opacity: searching ? 0.7 : 1 }}>
              {searching ? "Searching..." : "Search"}
            </button>
          </form>

          {results.length > 0 && (
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {results.map((r) => {
                const existing = claimForListing(r.listing_table, r.id);
                const key = `${r.listing_table}:${r.id}`;
                return (
                  <div
                    key={key}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.8rem", flexWrap: "wrap", borderTop: "1px solid var(--border)", paddingTop: "0.6rem" }}
                  >
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: "var(--navy)" }}>{r.name || "Untitled listing"}</p>
                      <p style={{ margin: "0.15rem 0 0", fontSize: "0.82rem", color: "var(--muted)" }}>{[r.city, r.state].filter(Boolean).join(", ")}</p>
                    </div>
                    {existing ? (
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)" }}>{STATUS_LABEL[existing.status] || existing.status}</span>
                    ) : (
                      <button type="button" disabled={claiming === key} onClick={() => startClaim(r)} style={{ ...quietBtn, opacity: claiming === key ? 0.7 : 1 }}>
                        {claiming === key ? "Submitting..." : "This is my listing"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {dash && dash.claims.length > 0 && (
        <section>
          <h2 style={sectionTitle}>Claim history</h2>
          <div style={{ ...card, display: "flex", flexDirection: "column", gap: "0.7rem" }}>
            {dash.claims.map((c) => (
              <div key={c.id} style={{ borderBottom: "1px solid var(--border)", paddingBottom: "0.7rem" }}>
                <p style={{ margin: 0, fontWeight: 700, color: "var(--navy)" }}>{STATUS_LABEL[c.status] || c.status}</p>
                <p style={{ margin: "0.15rem 0 0", fontSize: "0.82rem", color: "var(--muted)" }}>
                  {c.listing_table === "venue_listings" ? "Teacher/venue listing" : "Event listing"} &middot; submitted {new Date(c.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 style={sectionTitle}>Membership</h2>
        <div style={card}>
          {(() => {
            const teacher = dash?.ownedListings.find((l) => l.listing_table === "venue_listings" && l.status === "published");
            const premiumActive = isPremiumActive(teacher?.premium_until);
            const until = teacher?.premium_until ? new Date(teacher.premium_until).toLocaleDateString() : "";
            const checkoutButton = (
              <div>
                <button
                  type="button"
                  onClick={startCheckout}
                  disabled={startingCheckout}
                  style={{ ...primaryBtn, minHeight: 48, fontSize: "1rem", opacity: startingCheckout ? 0.6 : 1 }}
                >
                  {startingCheckout ? "Opening checkout..." : "Choose Premium: $89/year"}
                </button>
                {checkoutError && <p style={{ margin: "0.7rem 0 0", color: "#b3261e", fontWeight: 600 }}>{checkoutError}</p>}
              </div>
            );
            if (premiumActive && teacher?.premium_paid) {
              return (
                <p style={{ margin: 0, color: "var(--navy)" }}>
                  Premium is active on {teacher.business_name || "your listing"} through {until}.
                  Players can send you lesson requests directly, and your card shows the Premium Provider badge.
                </p>
              );
            }
            if (premiumActive) {
              return (
                <div>
                  <p style={{ margin: "0 0 0.8rem", color: "var(--navy)" }}>
                    Your free Premium period on {teacher?.business_name || "your listing"} runs through {until}: lesson requests from players plus the Premium Provider badge.
                    To keep Premium after that date, choose Premium for $89 a year. Otherwise your listing simply continues on the free Basic plan; nothing is ever charged on its own.
                  </p>
                  {dash?.billing.configured && checkoutButton}
                </div>
              );
            }
            if (!dash?.billing.configured) {
              return <p style={{ margin: 0, color: "var(--muted)" }}>Your listing is free forever. Premium options appear here once billing opens.</p>;
            }
            if (!teacher) {
              return <p style={{ margin: 0, color: "var(--muted)" }}>Premium extends your claimed teacher listing. Claim your listing above, then choose Premium here.</p>;
            }
            return (
              <div>
                <p style={{ margin: "0 0 0.8rem", color: "var(--navy)" }}>
                  Premium on {teacher.business_name || "your listing"}: on-platform lesson requests from players plus the Premium Provider badge. $89 a year, cancel anytime, and your listing stays free forever either way.
                </p>
                {checkoutButton}
              </div>
            );
          })()}
        </div>
      </section>

      <section>
        <a href="/account" style={{ color: "var(--pink-text)", fontWeight: 700, textDecoration: "none" }}>
          Account settings &rarr;
        </a>
      </section>
    </div>
  );
}
