# Security — Find My Mahj Game

## Firebase Security Rules (Firestore)

All data access is controlled through Firestore Security Rules. No client can read or write data without passing these rules.

### Rule Principles

1. **Authenticated reads** — most collections require the user to be signed in
2. **Public reads for public content** — state pages, events, and venue listings are readable by anyone
3. **Write restrictions** — only admins or the owning user can write data
4. **No direct deletes from client** — deletions go through admin review

### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // --- CONNECTORS (people/groups who host games) ---
    match /connectors/{connectorId} {
      // Anyone can view published connectors
      allow read: if resource.data.status == 'published';
      // Only the connector owner or admin can edit
      allow write: if request.auth != null &&
        (request.auth.uid == resource.data.ownerId || isAdmin());
      // Only authenticated users can create
      allow create: if request.auth != null;
    }

    // --- CONNECTIONS (player-to-connector relationships) ---
    match /connections/{connectionId} {
      // Only the two parties involved can read
      allow read: if request.auth != null &&
        (request.auth.uid == resource.data.playerId ||
         request.auth.uid == resource.data.connectorId);
      // Only authenticated users can create a connection
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.playerId;
      // Only the parties involved can update
      allow update: if request.auth != null &&
        (request.auth.uid == resource.data.playerId ||
         request.auth.uid == resource.data.connectorId);
      // No client-side deletes
      allow delete: if false;
    }

    // --- REFERRALS ---
    match /referrals/{referralId} {
      // Only the referrer or referred user can read
      allow read: if request.auth != null &&
        (request.auth.uid == resource.data.referrerId ||
         request.auth.uid == resource.data.referredId);
      // Only authenticated users can create
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.referrerId;
      // No client edits or deletes — admin only
      allow update, delete: if isAdmin();
    }

    // --- EVENTS ---
    match /events/{eventId} {
      // Anyone can read published events
      allow read: if resource.data.status == 'published';
      // Only admin or event owner can write
      allow write: if request.auth != null &&
        (request.auth.uid == resource.data.ownerId || isAdmin());
    }

    // --- VENUES ---
    match /venues/{venueId} {
      // Anyone can read published venues
      allow read: if resource.data.status == 'published';
      // Only admin or venue owner can write
      allow write: if request.auth != null &&
        (request.auth.uid == resource.data.ownerId || isAdmin());
    }

    // --- STATES (map data) ---
    match /states/{stateId} {
      // Public read — powers the homepage map
      allow read: if true;
      // Only admins can modify state data
      allow write: if isAdmin();
    }

    // --- SPONSORS ---
    match /sponsors/{sponsorId} {
      // Public read — displayed on pages
      allow read: if true;
      // Only admins can manage sponsors
      allow write: if isAdmin();
    }

    // --- PRICING TIERS ---
    match /pricing_tiers/{tierId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // --- INQUIRIES (contact form) ---
    match /inquiries/{inquiryId} {
      // Anyone can submit a contact form
      allow create: if true;
      // Only admins can read submissions
      allow read, update, delete: if isAdmin();
    }

    // --- STATS ---
    match /stats/{statId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // --- ADMIN HELPER ---
    function isAdmin() {
      return request.auth != null &&
        get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### Authentication

- **Firebase Authentication** handles sign-in
- Supported providers: Email/password, Google
- Admin users are stored in an `admins` collection with `role: 'admin'`

### Data Validation

- All user-submitted data is validated in security rules using `request.resource.data`
- Required fields are enforced at the rule level
- String lengths and data types are checked before writes are allowed

### Sensitive Data

- **Never store** passwords, payment info, or API keys in Firestore
- Keep Firebase config keys in the client (they are safe — security rules protect the data)
- Store secrets (API keys for third-party services) in Firebase environment config, not in code
- W9s, contracts, and financial documents stay **off GitHub** — never commit these
