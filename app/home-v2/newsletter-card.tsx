"use client";

import { useState } from "react";
import styles from "./home-v2.module.css";

export default function NewsletterCard() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <div className={styles.newsletter}>
      <h2 className={styles.nlTitle}>Stay Connected</h2>
      <p className={styles.nlText}>Get updates on events, open plays, teachers, and community news.</p>
      {done ? (
        <p className={styles.nlText}>Thank you. (Preview only, not yet connected to the email tool.)</p>
      ) : (
        <form className={styles.nlForm} onSubmit={(e) => { e.preventDefault(); setDone(true); }}>
          <label htmlFor="nl-email" className={styles.nlLabel}>Email address</label>
          <div className={styles.nlRow}>
            <input
              id="nl-email"
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.nlInput}
            />
            <button type="submit" className={styles.nlBtn}>Subscribe</button>
          </div>
          <p className={styles.nlNote}>No spam. Unsubscribe anytime.</p>
        </form>
      )}
    </div>
  );
}
