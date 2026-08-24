-- Classification at ingestion shipped 2026-08-24: the webhook now stamps
-- billing_subscriptions.record_class from the event's livemode flag and the owning
-- account's record_class. Any row mirrored before that predates every live-mode
-- purchase (payments have never been public), so it is non-real by definition.
-- Idempotent; a no-op when the table is empty, which it was at deploy time.
update public.billing_subscriptions
set record_class = 'test'
where record_class = 'real_external'
  and created_at < '2026-08-24T03:00:00Z';
