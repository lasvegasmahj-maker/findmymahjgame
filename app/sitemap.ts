import type { MetadataRoute } from "next";
import { ALL_STATE_SLUGS } from "@/lib/states-data";

const BASE = "https://findmymahjgame.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/events`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/teachers`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/list-my-game`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/states`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/play`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/start`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/newsletter`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/help`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/ambassadors`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/get-listed`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/advertise`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  const statePages: MetadataRoute.Sitemap = ALL_STATE_SLUGS.map((slug) => ({
    url: `${BASE}/states/${slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  return [...staticPages, ...statePages];
}
