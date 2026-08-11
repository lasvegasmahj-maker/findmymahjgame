const REVIEW_ORDER: Record<string, number> = { pending_review: 0, flagged: 1, published: 2 };

export function sourceHost(url: string | null | undefined): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// Pending rows cluster by source, so verifying one publisher clears many rows at once
// instead of forcing a context switch on every listing.
export function byReviewOrder<
  T extends { status: string; source_url: string | null; created_at: string }
>(rows: T[]): T[] {
  return rows.slice().sort((a, b) => {
    const s = (REVIEW_ORDER[a.status] ?? 3) - (REVIEW_ORDER[b.status] ?? 3);
    if (s !== 0) return s;
    const h = sourceHost(a.source_url).localeCompare(sourceHost(b.source_url));
    if (h !== 0) return h;
    return (b.created_at || "").localeCompare(a.created_at || "");
  });
}
