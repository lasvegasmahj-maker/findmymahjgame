# Schema — Find My Mahj Game

## Core Data Model: Connectors → Connections → Referrals

The database is built around three core concepts that form the backbone of the platform:

```
CONNECTORS (hosts/groups)
    ↓ players discover and connect
CONNECTIONS (player-to-host relationships)
    ↓ players invite friends
REFERRALS (growth tracking)
```

## Collections

### `connectors`
People or groups who host mahjong games, lessons, or events. This is the primary listing unit on the platform.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (auto) | Firestore document ID |
| `ownerId` | string | Firebase Auth UID of the connector |
| `name` | string | Display name (person or group name) |
| `type` | string | `"individual"`, `"group"`, `"venue"`, `"instructor"` |
| `state` | string | US state code (e.g., `"NV"`, `"FL"`) |
| `city` | string | City name |
| `description` | string | Bio or group description |
| `gameTypes` | array[string] | `["american"]`, `["riichi"]`, etc. |
| `skillLevel` | string | `"beginner"`, `"intermediate"`, `"advanced"`, `"all"` |
| `contactEmail` | string | Contact email (not public unless opted in) |
| `contactPhone` | string | Optional phone |
| `instagram` | string | Instagram handle |
| `website` | string | Optional website URL |
| `imageUrl` | string | Profile/group photo URL (Firebase Storage) |
| `isOfficialMahjSpot` | boolean | Has "Official Mahj Spot" badge |
| `status` | string | `"draft"`, `"pending"`, `"published"` |
| `tier` | string | `"free"`, `"basic"`, `"featured"`, `"premium"` |
| `createdAt` | timestamp | When the listing was created |
| `updatedAt` | timestamp | Last update |

### `connections`
A relationship between a player and a connector. Created when a player reaches out or joins a group.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (auto) | Firestore document ID |
| `playerId` | string | Firebase Auth UID of the player |
| `connectorId` | string | Reference to `connectors` document |
| `status` | string | `"requested"`, `"accepted"`, `"declined"` |
| `message` | string | Optional intro message from the player |
| `source` | string | How they found it: `"map"`, `"search"`, `"referral"`, `"direct"` |
| `referralId` | string | Reference to `referrals` doc (if source is referral) |
| `createdAt` | timestamp | When the connection was made |
| `updatedAt` | timestamp | Last status change |

### `referrals`
Tracks when a player invites someone else to the platform. Links back to the connection that triggered it.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (auto) | Firestore document ID |
| `referrerId` | string | Firebase Auth UID of the person who referred |
| `referredId` | string | Firebase Auth UID of the new user |
| `referredEmail` | string | Email of the referred person (before signup) |
| `connectionId` | string | The connection that triggered this referral |
| `status` | string | `"sent"`, `"signed_up"`, `"converted"` |
| `code` | string | Unique referral code |
| `createdAt` | timestamp | When referral was sent |
| `convertedAt` | timestamp | When referred user signed up (null until then) |

## Supporting Collections

### `events`
Events, retreats, and tournaments.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (auto) | Firestore document ID |
| `ownerId` | string | Firebase Auth UID of the event creator |
| `title` | string | Event name |
| `type` | string | `"open_play"`, `"tournament"`, `"retreat"`, `"lesson"`, `"social"` |
| `description` | string | Event details |
| `state` | string | US state code |
| `city` | string | City name |
| `venue` | string | Venue name |
| `address` | string | Full address |
| `date` | timestamp | Event date/time |
| `endDate` | timestamp | End date (for multi-day events) |
| `price` | number | Cost (0 for free) |
| `capacity` | number | Max attendees (null for unlimited) |
| `registrationUrl` | string | External signup link |
| `imageUrl` | string | Event image |
| `tier` | string | `"free"`, `"local"`, `"national"`, `"featured"` |
| `status` | string | `"draft"`, `"published"`, `"cancelled"` |
| `createdAt` | timestamp | Created date |

### `venues`
Physical locations where mahjong is played.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (auto) | Firestore document ID |
| `ownerId` | string | Firebase Auth UID of venue owner |
| `name` | string | Venue name |
| `state` | string | US state code |
| `city` | string | City |
| `address` | string | Full address |
| `lat` | number | Latitude (for map) |
| `lng` | number | Longitude (for map) |
| `description` | string | About the venue |
| `website` | string | Venue website |
| `phone` | string | Contact phone |
| `isOfficialMahjSpot` | boolean | Badge status |
| `imageUrl` | string | Venue photo |
| `status` | string | `"draft"`, `"published"` |
| `createdAt` | timestamp | Created date |

### `states`
Aggregate data per state — powers the homepage interactive map.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | US state code (e.g., `"NV"`) |
| `name` | string | Full state name |
| `playerCount` | number | Number of registered players |
| `connectorCount` | number | Number of connectors |
| `eventCount` | number | Number of upcoming events |
| `hasLandingPage` | boolean | Whether a state page exists |
| `landingPageUrl` | string | URL to state page (e.g., `/nevada.html`) |

### `sponsors`
Advertising partners displayed on the site.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (auto) | Firestore document ID |
| `name` | string | Sponsor/brand name |
| `logoUrl` | string | Logo image |
| `website` | string | Sponsor website |
| `placement` | string | `"sidebar"`, `"banner"`, `"map_popup"`, `"sponsor_bar"` |
| `tier` | string | Pricing tier |
| `startDate` | timestamp | Campaign start |
| `endDate` | timestamp | Campaign end |
| `isActive` | boolean | Currently displaying |

### `inquiries`
Contact form submissions.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (auto) | Firestore document ID |
| `name` | string | Submitter name |
| `email` | string | Submitter email |
| `subject` | string | Subject line |
| `message` | string | Message body |
| `type` | string | `"general"`, `"advertising"`, `"listing"`, `"partnership"` |
| `status` | string | `"new"`, `"read"`, `"replied"` |
| `createdAt` | timestamp | Submission date |

### `admins`
Admin user registry (used by security rules).

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Firebase Auth UID |
| `role` | string | `"admin"` |
| `email` | string | Admin email |

## Relationships Diagram

```
admins
  └── manages all collections

connectors ──────────────── venues (optional link)
  │                            │
  │ (player finds connector)   │ (events happen at venues)
  ▼                            ▼
connections ──────────────── events
  │
  │ (player refers a friend)
  ▼
referrals

states ← aggregated from connectors + events
sponsors ← independent, displayed on pages
inquiries ← independent, from contact forms
```
