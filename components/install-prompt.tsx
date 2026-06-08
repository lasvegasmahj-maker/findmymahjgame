"use client";

import { useEffect, useState } from "react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("fmm_install_dismissed")) return;
    } catch { /* ignore */ }
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const standalone = window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
    if (standalone) return;

    const ua = navigator.userAgent || "";
    const isIos = /iphone|ipad|ipod/i.test(ua);
    const isSafari = isIos && /safari/i.test(ua) && !/crios|fxios/i.test(ua);

    const onBIP = (e: Event) => { e.preventDefault(); setDeferred(e as BIPEvent); setShow(true); };
    window.addEventListener("beforeinstallprompt", onBIP);
    if (isIos && isSafari) { setIos(true); setShow(true); }
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  function dismiss() {
    try { localStorage.setItem("fmm_install_dismissed", "1"); } catch { /* ignore */ }
    setShow(false);
  }
  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    dismiss();
  }

  if (!show) return null;

  return (
    <div style={{ position: "fixed", left: 12, right: 12, bottom: 12, zIndex: 50, background: "white", border: "2px solid var(--navy)", borderRadius: 16, padding: "1rem 1.1rem", boxShadow: "0 8px 30px rgba(0,0,0,0.25)", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" width={44} height={44} style={{ borderRadius: 10, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, color: "var(--navy)", fontSize: "1.05rem" }}>Put Mahj on your phone</div>
          {ios
            ? <div style={{ fontSize: "0.95rem", color: "var(--muted)", lineHeight: 1.4 }}>Tap the Share button, then <strong>Add to Home Screen</strong>.</div>
            : <div style={{ fontSize: "0.95rem", color: "var(--muted)", lineHeight: 1.4 }}>One tap, no app store. Opens like an app.</div>}
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.8rem" }}>
        {!ios && <button onClick={install} style={{ flex: 1, minHeight: 48, border: "none", borderRadius: 10, background: "var(--pink)", color: "white", fontWeight: 800, fontSize: "1rem", cursor: "pointer" }}>Add to my phone</button>}
        <button onClick={dismiss} style={{ flex: ios ? 1 : 0, minWidth: 90, minHeight: 48, border: "2px solid var(--border)", borderRadius: 10, background: "white", color: "var(--muted)", fontWeight: 700, fontSize: "1rem", cursor: "pointer" }}>{ios ? "Got it" : "Not now"}</button>
      </div>
    </div>
  );
}
