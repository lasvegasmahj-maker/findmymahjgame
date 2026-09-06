// The canonical rule schema shared by Find My Mahj Game and Las Vegas Mahjong.
//
// One rule, one representation. Both sites vendor this package by copy (never at runtime),
// so a rule the owner approves here is approved on both sites at once. Site-specific
// material (Read more links, local CTAs, house notes a site adds, directory search) lives
// in each site's overlay, never in an entry.

export type RuleClassification =
  | "standard_nmjl_rule"
  | "nmjl_clarification"
  | "tournament_rule"
  | "house_optional_rule"
  | "etiquette"
  | "strategy";

// owner_approved: the owner (a certified instructor) signed the wording off, on either site.
// research_verified: written from League material located through research; the owner has
//   not signed it off, so both sites show it with the review badge and serve it verbatim.
// owner_question: an open ruling the owner has not made; reserved, unused today.
export type ApprovalState = "owner_approved" | "research_verified" | "owner_question";

export type EvidenceState = "verified" | "owner_review_pending" | "owner_question_pending";

export type SourceType =
  | "owner_approved" // an explicit owner decision or owner wording
  | "owner_site_page" // owner-published rules page text reconciled with the card (lasvegasmahj.com/rules)
  | "nmjl_primary"
  | "secondary_research"
  | "arithmetic";

export type OwnerSite = "fmg" | "lvm";

export type IsoDate = `${number}-${number}-${number}`;

export type Provenance = {
  source_type: SourceType;
  // Titles, page numbers, and article numbers only. Never source text.
  source_title: string;
  source_ref?: string;
  source_year?: number;
  owner_review_required: boolean;
  evidence: EvidenceState;
  // Date of an explicit owner decision on this exact wording. An entry with a decision
  // date outranks an entry approved only by publication when both fit a question equally.
  owner_decided?: IsoDate;
  // Which site's owner record carries the approval. Both sites inherit it either way.
  approved_via: OwnerSite | "shared";
};

// Topic families. They drive follow-up chips, the elliptical follow-up context ("what
// about a kong?" after a joker question), and the site-specific nudges.
export type Category =
  | "tiles"
  | "jokers"
  | "charleston"
  | "calling"
  | "winning"
  | "scoring"
  | "dead-hands"
  | "card"
  | "etiquette"
  | "basics"
  | "tournament"
  | "strategy";

export type Level = "foundational" | "core" | "advanced";

// money: payment wording the owner made deliberate; served word for word, never framed,
// combined, or swapped by the model layer. Pending entries get the same protection
// automatically, so they need no tag.
export type Tag = "money";

export type Blocker = RegExp | ((question: string) => boolean);

export type CanonicalRule = {
  id: string;
  // Short player-facing topic name.
  topic: string;
  category: Category;
  level: Level;
  // The canonical question first. Alternates are other approved chip wordings (a starter
  // chip on either site must match one of these exactly to be answered with no model call).
  questions: string[];
  question_patterns: RegExp[];
  // Concept matchers that must all be present. An entry requiring more concepts outranks
  // one requiring fewer, ahead of approval rank and keyword score.
  requires?: RegExp[];
  // Contexts this entry's text does not cover; any hit disqualifies the entry.
  blocks?: Blocker[];
  keywords: string[];
  answer: string;
  varies_by_house: boolean;
  house_note?: string;
  confidence: "high" | "medium";
  approval: ApprovalState;
  classification: RuleClassification;
  provenance: Provenance;
  last_verified: IsoDate;
  related: string[];
  tags?: Tag[];
  // Former ids from either site that resolve to this entry. Chips, tests, and stored
  // conversation history keep working across the unification.
  aliases?: string[];
  // Other canonical entries covering the same rule in different owner-approved wording.
  // Both are correct; consolidating them is an owner wording decision, not an engineering one.
  equivalents?: string[];
  // Canonical ids whose explicit owner decision covers this entry's scenario: whenever one of
  // them is also a candidate for the question, this entry stands down. A site whose owner
  // decision excludes that entry (SiteConfig.overrides) gets this entry instead. Pending
  // entries use it so research never displaces an owner decision, and never by a block that
  // would leave the other site with no answer.
  yields_to?: string[];
};

export const RULESET = "american_nmjl" as const;
