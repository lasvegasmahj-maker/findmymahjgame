// Public surface of the shared Ask core. Both sites import only from here (via their vendored
// copy under lib/ask-core), so the contract between the sites and the core is this file.

export type { CanonicalRule, Category, Level, Provenance, ApprovalState, RuleClassification, EvidenceState, SourceType, OwnerSite, Tag } from "./corpus/types.ts";
export { RULES_KNOWLEDGE, KNOWLEDGE_BY_ID, ALIASES, resolveId, entryById, isPending, PENDING_IDS, CURRENT_CARD_YEAR } from "./corpus/entries.ts";
export { blindReadsAsPlace, placeAfterPrep, VARIANT_RE, AMERICAN_RE } from "./corpus/matchers.ts";
export { normalizeQuestion, spellfix, prepare, mentionedYear, summarizeForEscalation, MAX_QUESTION_CHARS } from "./engine/normalize.ts";
export { rankEntries, retrieve, approvalRank } from "./engine/retrieve.ts";
export { classifyTopic, hasStrongRulesSignal, SHARED_DISCOVERY_RE, type AskTopic, type TopicHooks } from "./engine/topic.ts";
export { excludedIds, overrideSummary, type SiteConfig, type SiteOverride, type SiteId } from "./site.ts";
export { CLARIFICATIONS, GAP_ANSWER, VARIANT_SCOPE_ANSWER, needsClarification, topicClarification, resolveReply, isExactOption, answersOption, toPayload, type ClarifyContext, type ClarifyPayload, type Clarification } from "./engine/clarify.ts";
export { CARD_REFUSAL, CARD_REFUSAL_FOLLOWUPS, EMPTY_ANSWER, SMALL_TALK, CANCELLED, ELLIPTICAL_RE, isCardContentRequest, isSmallTalk, isWhyFollowup, cancelPhrase, yearNoteFor, splitQuestions } from "./engine/guards.ts";
export { LABEL_TEXT, PENDING_NOTE, type AskLabel } from "./engine/labels.ts";
export {
  lookup,
  approvedText,
  labelFor,
  mustServeVerbatim,
  lastAnsweredEntry,
  askedEntryIds,
  canonicalEntryFor,
  buildFollowups,
  replyStaysReply,
  type Turn,
  type LookupInput,
  type LookupResult,
  type LookupKind,
  type LookupOptions,
} from "./engine/lookup.ts";
export {
  DEFAULT_MODEL,
  MODEL_TIMEOUT_MS,
  OUTPUT_SCHEMA,
  OPENERS,
  modelEligible,
  systemPrompt,
  buildUserMessage,
  validateModelOutput,
  entryParts,
  composeWithModel,
  type ModelClient,
  type ModelMessage,
  type ModelReply,
  type ModelSite,
  type ModelInput,
  type ModelResult,
  type ComposeOptions,
} from "./model/compose.ts";
export { SlidingWindow, ipOf, makeLimiters, DEFAULT_LIMITS } from "./limits/sliding-window.ts";
export { corpusFingerprint, behaviorFingerprint, coreIdentity, BEHAVIOR_PROBES, type CoreIdentity } from "./fingerprint.ts";
export { CORE_VERSION } from "./version.ts";
