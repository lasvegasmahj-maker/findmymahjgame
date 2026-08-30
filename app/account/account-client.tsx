"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BlockButton from "@/components/safety/block-button";

type Me = { role: string; displayName: string | null; qa: boolean };

const card: React.CSSProperties = { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.4rem" };
const input: React.CSSProperties = { width: "100%", minHeight: 48, padding: "0 1rem", border: "2px solid var(--border)", borderRadius: 10, fontSize: "1rem", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)" };
const primaryBtn: React.CSSProperties = { background: "var(--pink)", color: "white", border: "none", borderRadius: 8, padding: "0.8rem 1.5rem", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" };
const quietBtn: React.CSSProperties = { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.8rem 1.5rem", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", color: "var(--navy)" };

export default function AccountClient({ signupOpen }: { signupOpen: boolean }) {
  const [me, setMe] = useState<Me | null>(null);
  const [checked, setChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.ok) {
          setMe(j);
          setName(j.displayName || "");
        }
      })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, []);

  async function post(url: string, body: unknown): Promise<{ ok: boolean; j: { error?: string; message?: string; displayName?: string } }> {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setError(j.error || "Something went wrong. Please try again.");
      return { ok: r.ok, j };
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
      return { ok: false, j: {} };
    } finally {
      setBusy(false);
    }
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    const { ok, j } = await post("/api/auth/signin", { email });
    if (ok) setNotice(j.message || "Check your email for a sign-in link.");
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    const { ok, j } = await post("/api/account", { action: "set_display_name", display_name: name });
    if (ok) {
      setNotice("Name saved.");
      if (j.displayName) setName(j.displayName);
    }
  }

  async function signOut() {
    await post("/api/auth/signout", {});
    window.location.href = "/";
  }

  async function deactivate() {
    if (!window.confirm("Deactivate your account? You can come back any time by signing in again.")) return;
    const { ok } = await post("/api/account", { action: "deactivate" });
    if (ok) window.location.href = "/";
  }

  async function requestDeletion() {
    if (!window.confirm("Ask us to permanently delete your account and data? We confirm by email when it is done.")) return;
    const { ok, j } = await post("/api/account", { action: "request_deletion" });
    if (ok) setNotice(j.message || "We received your deletion request.");
  }

  if (!checked) return <p style={{ color: "var(--muted)", textAlign: "center" }}>Loading...</p>;

  if (!me) {
    if (!signupOpen) {
      return (
        <div style={{ ...card, marginTop: "1.2rem", textAlign: "center" }}>
          <p style={{ margin: 0, color: "var(--navy)", fontWeight: 700 }}>Accounts are not open yet.</p>
          <p style={{ margin: "0.5rem 0 0", color: "var(--muted)" }}>
            Browsing and search are free and need no account. When accounts open, you will be able to
            sign in here with just your email; no password to remember.
          </p>
        </div>
      );
    }
    return (
      <div>
        <p style={{ color: "var(--muted)", textAlign: "center", margin: "0 0 1.6rem" }}>
          Sign in with your email. No password to remember; we send you a one-tap link.
        </p>
        <form onSubmit={signIn} style={card}>
          <label htmlFor="acct-email" style={{ display: "block", fontWeight: 700, color: "var(--navy)", fontSize: "0.9rem", marginBottom: "0.4rem" }}>
            Email address
          </label>
          <input id="acct-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={input} maxLength={254} />
          <button type="submit" disabled={busy} style={{ ...primaryBtn, width: "100%", marginTop: "0.9rem", opacity: busy ? 0.7 : 1 }}>
            {busy ? "Sending..." : "Email me a sign-in link"}
          </button>
          {notice && <p role="status" style={{ color: "#1a6e3a", fontWeight: 700, marginTop: "0.9rem", marginBottom: 0 }}>{notice}</p>}
          {error && <p role="alert" style={{ color: "#dc2626", fontWeight: 600, marginTop: "0.9rem", marginBottom: 0 }}>{error}</p>}
          <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.9rem", marginBottom: 0 }}>
            Browsing and search never need an account. We keep your email to sign you in and never show it publicly.
          </p>
        </form>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1.2rem" }}>
      <div style={card}>
        <p style={{ margin: 0, color: "var(--navy)", fontWeight: 700 }}>
          Signed in{me.displayName ? ` as ${me.displayName}` : ""} ({me.role})
          {me.qa && <span style={{ marginLeft: "0.6rem", fontSize: "0.72rem", fontWeight: 800, color: "#a07800", background: "rgba(245,200,66,0.18)", borderRadius: 4, padding: "0.15rem 0.5rem" }}>TEST ACCOUNT</span>}
        </p>
      </div>

      <form onSubmit={saveName} style={card}>
        <label htmlFor="acct-name" style={{ display: "block", fontWeight: 700, color: "var(--navy)", fontSize: "0.9rem", marginBottom: "0.4rem" }}>
          Display name (first name and last initial)
        </label>
        <input id="acct-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sandra M." style={input} maxLength={40} />
        <button type="submit" disabled={busy} style={{ ...primaryBtn, marginTop: "0.9rem", opacity: busy ? 0.7 : 1 }}>Save name</button>
      </form>

      <div style={{ ...card, display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <button type="button" onClick={signOut} disabled={busy} style={quietBtn}>Sign out</button>
        <button type="button" onClick={deactivate} disabled={busy} style={quietBtn}>Deactivate account</button>
        <button type="button" onClick={requestDeletion} disabled={busy} style={{ ...quietBtn, color: "#dc2626", borderColor: "#fca5a5" }}>Request deletion</button>
      </div>

      <MahjMatchSection />

      {notice && <p role="status" style={{ color: "#1a6e3a", fontWeight: 700, margin: 0 }}>{notice}</p>}
      {error && <p role="alert" style={{ color: "#dc2626", fontWeight: 600, margin: 0 }}>{error}</p>}
    </div>
  );
}

type MatchConsent = {
  ok: boolean;
  optedIn: boolean;
  city: string | null;
  state: string | null;
  travelRadiusMiles: number | null;
  availability: { day: string; time_of_day: string }[] | null;
  skill: string | null;
  socialStyle: string | null;
  hostPref: string | null;
  groupPref: string | null;
};

type BlockedPlayer = { userId: string; displayName: string | null; createdAt: string };

const DAYS = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" },
];
const TIMES_OF_DAY = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
];
const smallLbl: React.CSSProperties = { display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.25rem" };

// Mahj Match: consent, preferences, deactivation, and the caller's own block
// list. Self-contained (its own fetches, its own busy/notice/error state) so it
// drops into the signed-in view without touching the account form above it.
function MahjMatchSection() {
  const [consent, setConsent] = useState<MatchConsent | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [gateClosed, setGateClosed] = useState(false);
  const [ack, setAck] = useState(false);
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [radius, setRadius] = useState("25");
  const [availability, setAvailability] = useState<{ day: string; time_of_day: string }[]>([]);
  const [skill, setSkill] = useState("");
  const [socialStyle, setSocialStyle] = useState("");
  const [hostPref, setHostPref] = useState("");
  const [groupPref, setGroupPref] = useState("");
  const [blocks, setBlocks] = useState<BlockedPlayer[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/match/consent", { cache: "no-store" })
      .then(async (r) => {
        if (r.status === 403) {
          setGateClosed(true);
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((j) => {
        if (j?.ok) {
          setConsent(j);
          if (j.optedIn) {
            setCity(j.city || "");
            setStateCode(j.state || "");
            setRadius(j.travelRadiusMiles ? String(j.travelRadiusMiles) : "25");
            setAvailability(j.availability || []);
            setSkill(j.skill || "");
            setSocialStyle(j.socialStyle || "");
            setHostPref(j.hostPref || "");
            setGroupPref(j.groupPref || "");
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
    fetch("/api/safety/block", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.ok) setBlocks(j.blocks || []);
      })
      .catch(() => {});
  }, []);

  function toggleSlot(day: string, timeOfDay: string) {
    setAvailability((prev) => {
      const exists = prev.some((s) => s.day === day && s.time_of_day === timeOfDay);
      return exists ? prev.filter((s) => !(s.day === day && s.time_of_day === timeOfDay)) : [...prev, { day, time_of_day: timeOfDay }];
    });
  }

  async function post(body: Record<string, unknown>): Promise<{ ok: boolean; blocked?: boolean } | null> {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await fetch("/api/match/consent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(j.error || "Something went wrong. Please try again.");
        return null;
      }
      return j;
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  function prefsPayload(): Record<string, unknown> {
    const body: Record<string, unknown> = {
      city,
      state: stateCode,
      travel_radius_miles: Number(radius) || 25,
      availability,
      variant: "AMERICAN",
    };
    if (skill) body.skill = skill;
    if (socialStyle) body.social_style = socialStyle;
    if (hostPref) body.host_pref = hostPref;
    if (groupPref) body.group_pref = groupPref;
    return body;
  }

  async function optIn(e: React.FormEvent) {
    e.preventDefault();
    if (!ack) {
      setError("Confirm you are 18 or older and agree to how your information is shared.");
      return;
    }
    if (!city.trim() || !stateCode.trim()) {
      setError("Enter your city and state.");
      return;
    }
    const j = await post({ action: "opt_in", adult: true, agree: true, ...prefsPayload() });
    if (j) {
      setNotice("You're opted in to Mahj Match.");
      setConsent((c) => (c ? { ...c, optedIn: true } : c));
    }
  }

  async function savePrefs(e: React.FormEvent) {
    e.preventDefault();
    const j = await post({ action: "update_preferences", ...prefsPayload() });
    if (j) setNotice("Preferences saved.");
  }

  async function deactivateMatching() {
    if (!window.confirm("Turn off Mahj Match? You can opt back in any time. If you are currently on a formed table, leave it from that table's page.")) return;
    const j = await post({ action: "deactivate" });
    if (j) {
      setNotice("Mahj Match turned off.");
      setConsent((c) => (c ? { ...c, optedIn: false } : c));
    }
  }

  function renderPrefFields() {
    return (
      <>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.6rem" }}>
          <div>
            <label style={smallLbl} htmlFor="acct-mm-city">City</label>
            <input id="acct-mm-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Las Vegas" style={input} maxLength={80} />
          </div>
          <div>
            <label style={smallLbl} htmlFor="acct-mm-state">State</label>
            <input id="acct-mm-state" value={stateCode} onChange={(e) => setStateCode(e.target.value)} placeholder="NV" style={input} maxLength={20} />
          </div>
        </div>
        <div>
          <label style={smallLbl} htmlFor="acct-mm-radius">Willing to travel (miles)</label>
          <input id="acct-mm-radius" type="number" min={1} max={200} value={radius} onChange={(e) => setRadius(e.target.value)} style={input} />
        </div>
        <div>
          <label style={smallLbl} id="acct-mm-availability-label">Availability</label>
          <div role="group" aria-labelledby="acct-mm-availability-label" style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {DAYS.map((d) => (
              <div key={d.value} style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                <span aria-hidden="true" style={{ width: 36, fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)" }}>{d.label}</span>
                {TIMES_OF_DAY.map((t) => {
                  const on = availability.some((s) => s.day === d.value && s.time_of_day === t.value);
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => toggleSlot(d.value, t.value)}
                      aria-pressed={on}
                      aria-label={`${d.label} ${t.label}`}
                      style={{ minHeight: 44, padding: "0.3rem 0.6rem", borderRadius: 50, border: `1.5px solid ${on ? "var(--pink)" : "var(--border)"}`, background: on ? "var(--pink)" : "white", color: on ? "white" : "var(--navy)", fontWeight: 700, fontSize: "0.75rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.6rem" }}>
          <div>
            <label style={smallLbl} htmlFor="acct-mm-skill">Skill level</label>
            <select id="acct-mm-skill" className="form-select" value={skill} onChange={(e) => setSkill(e.target.value)} style={input}>
              <option value="">No preference</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="any">Any</option>
            </select>
          </div>
          <div>
            <label style={smallLbl} htmlFor="acct-mm-social-style">Style</label>
            <select id="acct-mm-social-style" className="form-select" value={socialStyle} onChange={(e) => setSocialStyle(e.target.value)} style={input}>
              <option value="">No preference</option>
              <option value="social">Social</option>
              <option value="competitive">Competitive</option>
              <option value="either">Either</option>
            </select>
          </div>
          <div>
            <label style={smallLbl} htmlFor="acct-mm-host-pref">Hosting</label>
            <select id="acct-mm-host-pref" className="form-select" value={hostPref} onChange={(e) => setHostPref(e.target.value)} style={input}>
              <option value="">No preference</option>
              <option value="can_host">I can host</option>
              <option value="prefer_travel">I prefer to travel</option>
              <option value="either">Either</option>
            </select>
          </div>
          <div>
            <label style={smallLbl} htmlFor="acct-mm-group-pref">Group</label>
            <select id="acct-mm-group-pref" className="form-select" value={groupPref} onChange={(e) => setGroupPref(e.target.value)} style={input}>
              <option value="">No preference</option>
              <option value="same_group">Same group each time</option>
              <option value="new_people">New people</option>
              <option value="either">Either</option>
            </select>
          </div>
        </div>
      </>
    );
  }

  if (!loaded) return null;

  return (
    <div style={{ ...card, display: "flex", flexDirection: "column", gap: "0.9rem" }}>
      <div>
        <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "var(--navy)" }}>Mahj Match</h2>
        <p style={{ margin: "0.3rem 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>Get introduced to other adult players near you.</p>
      </div>

      {gateClosed ? (
        <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>Mahj Match is not open yet. We will let you know when it launches.</p>
      ) : !consent?.optedIn ? (
        <form onSubmit={optIn} style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
          <p style={{ margin: 0, fontSize: "0.86rem", color: "var(--navy)", lineHeight: 1.6, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.8rem" }}>
            Mahj Match introduces you to other adult players. By opting in you confirm you are 18 or older, and you agree we may share your first name, general area, availability, and play preferences with players we propose seating you with. We never share your email, exact address, or last name. You can turn this off any time.
           Read the <Link href="/matching-standards" style={{ color: "var(--pink-text)", fontWeight: 700 }}>Matching Community Standards</Link>.
          </p>

          {renderPrefFields()}

          <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.85rem", color: "var(--navy)", fontWeight: 600 }}>
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} style={{ marginTop: 3 }} />
            I confirm I am 18 or older and agree to how my information is shared, as described above.
          </label>

          <button type="submit" disabled={busy} style={{ ...primaryBtn, opacity: busy ? 0.7 : 1 }}>{busy ? "Saving..." : "Opt in to Mahj Match"}</button>
        </form>
      ) : (
        <>
          <p style={{ margin: 0, color: "#1a6e3a", fontWeight: 700, fontSize: "0.88rem" }}>You&rsquo;re opted in to Mahj Match.</p>
          <form onSubmit={savePrefs} style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
            {renderPrefFields()}
            <button type="submit" disabled={busy} style={{ ...primaryBtn, opacity: busy ? 0.7 : 1 }}>{busy ? "Saving..." : "Save preferences"}</button>
          </form>
          <button type="button" onClick={deactivateMatching} disabled={busy} style={quietBtn}>Turn off Mahj Match</button>
        </>
      )}

      <div>
        <h3 style={{ margin: "0.4rem 0 0.3rem", fontSize: "0.95rem", fontWeight: 800, color: "var(--navy)" }}>Blocked players</h3>
        {blocks.length === 0 ? (
          <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--muted)" }}>You have not blocked anyone.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {blocks.map((b) => (
              <li key={b.userId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.6rem" }}>
                <span style={{ fontSize: "0.88rem", color: "var(--navy)" }}>{b.displayName || "Player"}</span>
                <BlockButton
                  targetUserId={b.userId}
                  initialBlocked={true}
                  onChange={(blocked) => {
                    if (!blocked) setBlocks((prev) => prev.filter((x) => x.userId !== b.userId));
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {notice && <p role="status" style={{ color: "#1a6e3a", fontWeight: 700, margin: 0, fontSize: "0.85rem" }}>{notice}</p>}
      {error && <p role="alert" style={{ color: "#dc2626", fontWeight: 600, margin: 0, fontSize: "0.85rem" }}>{error}</p>}
    </div>
  );
}
