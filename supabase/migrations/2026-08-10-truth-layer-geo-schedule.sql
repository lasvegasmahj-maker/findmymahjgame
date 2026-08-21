-- Truth layer: geography, provenance and structured schedule.
-- Additive only. Every column is nullable so existing rows and existing queries keep working.
-- Verified against production 2026-08-10: the membership-05 columns were never applied there,
-- so day_of_week and time_of_day genuinely do not exist yet despite appearing in that file.

-- Geography. Coordinates are stored on the listing so radius search never depends on a live
-- geocoder call. geo_precision records how the coordinates were derived, because a city
-- centroid is honest at 25 miles and misleading at 1 mile.
alter table venue_listings add column if not exists latitude double precision;
alter table venue_listings add column if not exists longitude double precision;
alter table venue_listings add column if not exists postal_code text;
alter table venue_listings add column if not exists geo_precision text;
alter table venue_listings add column if not exists geocoded_at timestamptz;

alter table event_listings add column if not exists latitude double precision;
alter table event_listings add column if not exists longitude double precision;
alter table event_listings add column if not exists postal_code text;
alter table event_listings add column if not exists geo_precision text;
alter table event_listings add column if not exists geocoded_at timestamptz;

alter table venue_listings drop constraint if exists venue_listings_geo_precision_check;
alter table venue_listings add constraint venue_listings_geo_precision_check
  check (geo_precision is null or geo_precision in ('address', 'postal', 'city'));

alter table event_listings drop constraint if exists event_listings_geo_precision_check;
alter table event_listings add constraint event_listings_geo_precision_check
  check (geo_precision is null or geo_precision in ('address', 'postal', 'city'));

-- Provenance. source_url already exists on both tables and is empty everywhere; it is reused
-- rather than replaced. source_type records how the record entered the directory.
alter table venue_listings add column if not exists source_type text;
alter table event_listings add column if not exists source_type text;

alter table venue_listings drop constraint if exists venue_listings_source_type_check;
alter table venue_listings add constraint venue_listings_source_type_check
  check (source_type is null or source_type in ('imported', 'organizer', 'community', 'admin'));

alter table event_listings drop constraint if exists event_listings_source_type_check;
alter table event_listings add constraint event_listings_source_type_check
  check (source_type is null or source_type in ('imported', 'organizer', 'community', 'admin'));

-- Structured schedule. day_time and frequency already exist and stay as the human readable
-- display string; these columns are what search filters on.
alter table event_listings add column if not exists day_of_week text[];
alter table event_listings add column if not exists start_time time;
alter table event_listings add column if not exists end_time time;
alter table event_listings add column if not exists time_of_day text;
alter table event_listings add column if not exists is_recurring boolean;
alter table event_listings add column if not exists schedule_confidence text;
alter table event_listings add column if not exists schedule_parsed_at timestamptz;

alter table event_listings drop constraint if exists event_listings_time_of_day_check;
alter table event_listings add constraint event_listings_time_of_day_check
  check (time_of_day is null or time_of_day in ('morning', 'afternoon', 'evening'));

alter table event_listings drop constraint if exists event_listings_schedule_confidence_check;
alter table event_listings add constraint event_listings_schedule_confidence_check
  check (schedule_confidence is null or schedule_confidence in ('high', 'medium', 'low'));

-- Review queue support. Lets an admin mark a record as inspected without publishing it,
-- so working through 552 pending rows is resumable.
alter table venue_listings add column if not exists review_flag text;
alter table event_listings add column if not exists review_flag text;

create index if not exists idx_venue_listings_latlng on venue_listings (latitude, longitude)
  where latitude is not null and longitude is not null;
create index if not exists idx_event_listings_latlng on event_listings (latitude, longitude)
  where latitude is not null and longitude is not null;
create index if not exists idx_event_listings_recurring on event_listings (is_recurring);
create index if not exists idx_event_listings_dow on event_listings using gin (day_of_week);
create index if not exists idx_venue_listings_status on venue_listings (status);
create index if not exists idx_event_listings_status_date on event_listings (status, event_date);
