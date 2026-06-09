# Schema — Find My Mahj Game

## Database: Supabase (PostgreSQL)

## Core Data Model: Connectors → Connections → Referrals

```
CONNECTORS (hosts/groups)
    ↓ players discover and connect
CONNECTIONS (player-to-host relationships)
    ↓ players invite friends
REFERRALS (growth tracking)
```

## Tables

### `connectors`
People or groups who host mahjong games, lessons, or events.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Auto-generated |
| `owner_id` | uuid | Supabase Auth user ID |
| `name` | text | Display name |
| `type` | text | `individual`, `group`, `venue`, `instructor` |
| `state` | text | US state code (e.g., `NV`, `FL`) |
| `city` | text | City name |
| `description` | text | Bio or group description |
| `game_types` | text[] | `{american}`, `{riichi}`, etc. |
| `skill_level` | text | `beginner`, `intermediate`, `advanced`, `all` |
| `contact_email` | text | Contact email |
| `contact_phone` | text | Optional phone |
| `instagram` | text | Instagram handle |
| `website` | text | Optional website URL |
| `image_url` | text | Profile/group photo URL |
| `is_official_mahj_spot` | boolean | Has badge |
| `status` | text | `draft`, `pending`, `published` |
| `tier` | text | `free`, `basic`, `featured`, `premium` |
| `created_at` | timestamptz | Auto-set |
| `updated_at` | timestamptz | Auto-set |

### `connections`
Relationship between a player and a connector.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Auto-generated |
| `player_id` | uuid | Supabase Auth user ID |
| `connector_id` | uuid | Reference to `connectors` |
| `status` | text | `requested`, `accepted`, `declined` |
| `message` | text | Optional intro message |
| `source` | text | `map`, `search`, `referral`, `direct` |
| `referral_id` | uuid | Reference to `referrals` (if source is referral) |
| `created_at` | timestamptz | Auto-set |
| `updated_at` | timestamptz | Auto-set |

### `referrals`
Tracks when a player invites someone else.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Auto-generated |
| `referrer_id` | uuid | Supabase Auth user ID |
| `referred_id` | uuid | Supabase Auth user ID (after signup) |
| `referred_email` | text | Email before signup |
| `connection_id` | uuid | The connection that triggered this |
| `status` | text | `sent`, `signed_up`, `converted` |
| `code` | text | Unique referral code |
| `created_at` | timestamptz | Auto-set |
| `converted_at` | timestamptz | When referred user signed up |

### `events`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Auto-generated |
| `owner_id` | uuid | Supabase Auth user ID |
| `title` | text | Event name |
| `type` | text | `open_play`, `tournament`, `retreat`, `lesson`, `social` |
| `description` | text | Event details |
| `state` | text | US state code |
| `city` | text | City name |
| `venue` | text | Venue name |
| `address` | text | Full address |
| `date` | timestamptz | Event date/time |
| `end_date` | timestamptz | End date |
| `price` | numeric | Cost (0 for free) |
| `capacity` | integer | Max attendees |
| `registration_url` | text | External signup link |
| `image_url` | text | Event image |
| `tier` | text | `free`, `local`, `national`, `featured` |
| `status` | text | `draft`, `published`, `cancelled` |
| `created_at` | timestamptz | Auto-set |

### `venues`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Auto-generated |
| `owner_id` | uuid | Supabase Auth user ID |
| `name` | text | Venue name |
| `state` | text | US state code |
| `city` | text | City |
| `address` | text | Full address |
| `lat` | numeric | Latitude |
| `lng` | numeric | Longitude |
| `description` | text | About the venue |
| `website` | text | Venue website |
| `phone` | text | Contact phone |
| `is_official_mahj_spot` | boolean | Badge status |
| `image_url` | text | Venue photo |
| `status` | text | `draft`, `published` |
| `created_at` | timestamptz | Auto-set |

### `states`
Powers the homepage interactive map.

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | US state code (e.g., `NV`) |
| `name` | text | Full state name |
| `player_count` | integer | Number of registered players |
| `connector_count` | integer | Number of connectors |
| `event_count` | integer | Number of upcoming events |
| `has_landing_page` | boolean | Whether a state page exists |
| `landing_page_url` | text | URL to state page |

### `sponsors`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Auto-generated |
| `name` | text | Sponsor/brand name |
| `logo_url` | text | Logo image |
| `website` | text | Sponsor website |
| `placement` | text | `sidebar`, `banner`, `map_popup`, `sponsor_bar` |
| `tier` | text | Pricing tier |
| `start_date` | timestamptz | Campaign start |
| `end_date` | timestamptz | Campaign end |
| `is_active` | boolean | Currently displaying |

### `pricing_tiers`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Auto-generated |
| `name` | text | Tier name |
| `price` | numeric | Monthly price |
| `features` | text[] | What's included |
| `sort_order` | integer | Display order |

### `inquiries`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Auto-generated |
| `name` | text | Submitter name |
| `email` | text | Submitter email |
| `subject` | text | Subject line |
| `message` | text | Message body |
| `type` | text | `general`, `advertising`, `listing`, `partnership` |
| `status` | text | `new`, `read`, `replied` |
| `created_at` | timestamptz | Auto-set |

### `admins`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Supabase Auth user ID |
| `role` | text | `admin` |
| `email` | text | Admin email |

## Naming Convention

All column names use **snake_case** (PostgreSQL standard).
