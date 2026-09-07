# Database Design: Condo/Apartment Hunting Tracker

## ER Diagram

```mermaid
erDiagram
  LISTING ||--o{ PRICE_HISTORY : has
  LISTING ||--o{ CONTRACT : has
  LISTING ||--o{ VIEWING_LOG : has
  LISTING ||--o{ LISTING_PHOTO : has

  LISTING {
    uuid id PK
    string name
    string address
    float lat
    float lng
    string type
    float size_sqm
    int floor
    string source_url
    string contact_phone
    string status
    boolean is_favorite
    timestamp created_at
  }

  PRICE_HISTORY {
    uuid id PK
    uuid listing_id FK
    decimal rent
    decimal deposit
    decimal advance
    decimal common_fee
    decimal parking_fee
    decimal internet_fee
    string water_type
    string electric_type
    timestamp recorded_at
  }

  CONTRACT {
    uuid id PK
    uuid listing_id FK
    date start_date
    date end_date
    int duration_months
    text deposit_refund_terms
    boolean pet_allowed
    boolean smoking_allowed
    text early_termination_penalty
    string contract_file_url
  }

  VIEWING_LOG {
    uuid id PK
    uuid listing_id FK
    timestamp scheduled_at
    text notes
    int rating
  }

  LISTING_PHOTO {
    uuid id PK
    uuid listing_id FK
    string url
  }

  CENTER_POINT {
    uuid id PK
    string name
    float lat
    float lng
  }
```

## Entity Notes

### LISTING
Core table. One row per apartment/condo/room being tracked. Holds coordinates (`lat`/`lng`) for the map view (mapcn) and a `status` field for the pipeline (e.g. `interested`, `viewing_scheduled`, `viewed`, `negotiating`, `decided`, `rejected`).

### PRICE_HISTORY
Kept separate from `LISTING` so price changes (e.g. after negotiation) are logged over time instead of overwriting the original quoted price. One listing can have many price records, ordered by `recorded_at`.

### CONTRACT
Lease terms for a listing. Stored separately since not every listing will have a signed contract yet — only ones that progressed to that stage.

### VIEWING_LOG
Tracks scheduled/completed viewing appointments and notes/rating from each visit.

### LISTING_PHOTO
Multiple photos per listing, stored as a child table rather than an array column for easier querying/display in gallery or table view.

### CENTER_POINT
Independent table for reference locations (e.g. workplace, university, a landmark). Not foreign-keyed to `LISTING` — distance from each listing to each center point is computed on the fly from `lat`/`lng` at query time rather than stored, so no join table is needed.

## Relationships Summary
- `LISTING (1) → (N) PRICE_HISTORY`
- `LISTING (1) → (N) CONTRACT`
- `LISTING (1) → (N) VIEWING_LOG`
- `LISTING (1) → (N) LISTING_PHOTO`
- `CENTER_POINT` — standalone, referenced at query time for distance calculations, not via FK

## Suggested Cascade Rule
When a `LISTING` is deleted, cascade-delete its related `PRICE_HISTORY`, `CONTRACT`, `VIEWING_LOG`, and `LISTING_PHOTO` rows.
