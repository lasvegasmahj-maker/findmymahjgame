import type { Metadata } from "next";
import { Suspense } from "react";
import ConfirmClient from "./confirm-client";

export const metadata: Metadata = {
  title: "Finish signing in",
  robots: { index: false },
};

export default function ConfirmPage() {
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "3rem 1.2rem 4rem", textAlign: "center" }}>
      <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.8rem", color: "var(--navy)", margin: "0 0 0.6rem" }}>
        Finish signing in
      </h1>
      <Suspense fallback={null}>
        <ConfirmClient />
      </Suspense>
    </main>
  );
}
