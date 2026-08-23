// Canonical matching states on the existing skeleton (tables, table_seats,
// play_requests, match_drafts). One architecture: a proposal IS a tables row in
// status 'proposed' with invited seats; acceptance is per seat; the table becomes
// real only when every seat holder has said yes. No second matching system.

// A player's standing request to be matched.
export const PLAY_REQUEST_STATUSES = ["open", "proposed", "matched", "cancelled", "expired"] as const;
export type PlayRequestStatus = (typeof PLAY_REQUEST_STATUSES)[number];

// The table lifecycle. 'proposed' tables are invisible to the public: homepage and
// share pages show only 'forming' and beyond. 'forming' means every proposed seat
// accepted (mutual consent reached) but the table still has open capacity or
// pending logistics; 'confirmed' means full and locked.
export const TABLE_STATUSES = ["proposed", "forming", "confirmed", "cancelled", "played"] as const;
export type TableStatus = (typeof TABLE_STATUSES)[number];

// Per-seat consent. Every seat starts 'invited'; nothing about a player is shown
// to the other players beyond first name and shared compatibility facts until the
// seat is 'accepted'. 'left' reopens the seat for replacement.
export const SEAT_STATUSES = ["invited", "accepted", "declined", "left"] as const;
export type SeatStatus = (typeof SEAT_STATUSES)[number];

// Matcher work queue (match_drafts): 'proposed' drafts created a proposed table;
// terminal states record what happened for the audit trail.
export const DRAFT_STATUSES = ["pending", "proposed", "formed", "expired", "cancelled"] as const;
export type DraftStatus = (typeof DRAFT_STATUSES)[number];

export const TABLE_SIZE = 4;

// Legal transitions; anything not listed is a bug. Enforce in every route that
// mutates state so no code path can invent a shortcut around consent.
export const SEAT_TRANSITIONS: Record<SeatStatus, SeatStatus[]> = {
  invited: ["accepted", "declined"],
  accepted: ["left"],
  declined: [],
  left: [],
};

export const TABLE_TRANSITIONS: Record<TableStatus, TableStatus[]> = {
  proposed: ["forming", "cancelled"],
  forming: ["confirmed", "cancelled"],
  confirmed: ["played", "cancelled", "forming"],
  cancelled: [],
  played: [],
};

export function canTransitionSeat(from: SeatStatus, to: SeatStatus): boolean {
  return SEAT_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canTransitionTable(from: TableStatus, to: TableStatus): boolean {
  return TABLE_TRANSITIONS[from]?.includes(to) ?? false;
}
