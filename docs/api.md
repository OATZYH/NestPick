# NestPick REST API Documentation

The NestPick REST API provides endpoints to manage rental hunting listings, negotiation price history, lease contracts, viewing appointment logs, and map reference points.

## Base URL
- Local: `http://localhost:3000/api`
- Production: `https://nestpick-oatzyhs.vercel.app/api`

---

## Authentication & Authorization

NestPick is a single-user secured application protected by NextAuth.js (Auth.js v5).

- **Authentication Method**: NextAuth Session Cookies (`__Secure-authjs.session-token` or `authjs.session-token`).
- **Access Control**: Requests to mutating and protected data endpoints require an authenticated admin session.
- **Unauthorized Response**:
  ```json
  {
    "error": "Unauthorized"
  }
  ```
  Status code: `401 Unauthorized`.

---

## 1. Listings

### `GET /api/listings`
Retrieve all listings. Supports query parameters for filtering.

#### Query Parameters
| Parameter | Type | Description |
|---|---|---|
| `type` | string | Filter by property type (`condo`, `apartment`, `dorm`, `house`) |
| `status` | string | Filter by pipeline status (`interested`, `viewing_scheduled`, `viewed`, `negotiating`, `decided`, `rejected`) |
| `search` | string | Case-insensitive search on `name`, `address`, or `notes` |
| `favorite` | boolean | Set to `true` to return only favorited listings |

#### Response (`200 OK`)
```json
[
  {
    "id": "condo-1",
    "name": "Life Asoke Hype",
    "address": "Asoke-Dindaeng Rd, Makkasan, Ratchathewi, Bangkok 10400",
    "lat": 13.7547,
    "lng": 100.5614,
    "type": "condo",
    "size_sqm": 32,
    "floor": 18,
    "view": "City & Pool view (East facing)",
    "source_url": "https://www.facebook.com/marketplace/item/example1",
    "contact_phone": "081-234-5678",
    "contact_line": "agent_asoke",
    "is_favorite": true,
    "notes": "Spacious layout, great morning light, near MRT Phra Ram 9.",
    "amenities": {
      "elevator": true,
      "gym": true,
      "pool": true,
      "parking": true,
      "cctv": true,
      "keycard": true
    },
    "photos": [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688"
    ],
    "status": "interested",
    "price_history": [
      {
        "id": "ph-1",
        "listing_id": "condo-1",
        "rent": 15000,
        "deposit": 30000,
        "advance": 15000,
        "water_type": "metered",
        "water_rate": "18 ฿/unit",
        "electric_type": "government",
        "electric_rate": "MEA (~4.4 ฿/unit)",
        "common_fee": 0,
        "parking_fee": 0,
        "internet_fee": 0,
        "recorded_at": "2026-03-01T10:00:00.000Z",
        "note": "Initial listed price"
      }
    ],
    "contract": {
      "id": "c-1",
      "listing_id": "condo-1",
      "duration_months": 12,
      "deposit_refund_terms": "Full refund upon departure inspection",
      "pet_friendly": false,
      "smoking_allowed": false,
      "early_termination_penalty": "Forfeiture of 1-month deposit"
    },
    "viewing_logs": [
      {
        "id": "vl-1",
        "listing_id": "condo-1",
        "scheduled_at": "2026-03-05T14:00:00.000Z",
        "notes": "Spacious unit. Gym has 4 treadmills and dumbbells up to 25kg.",
        "rating": 4.5,
        "completed": true
      }
    ],
    "created_at": "2026-03-01T08:00:00.000Z"
  }
]
```

---

### `POST /api/listings`
Create a new rental listing record. Automatically persists initial price history, contract, and viewing logs if included.

#### Request Body
```json
{
  "id": "condo-new-123", // Optional: system generates UUID if omitted
  "name": "Ideo Mobi Asoke",
  "address": "New Petchaburi Rd, Bang Kapi, Huai Khwang, Bangkok",
  "lat": 13.7486,
  "lng": 100.5645,
  "type": "condo",
  "status": "interested",
  "size_sqm": 35,
  "floor": 22,
  "view": "City Skyline",
  "source_url": "https://livinginsider.com/item/12345",
  "contact_phone": "089-123-4567",
  "contact_line": "agent_ideo",
  "is_favorite": false,
  "notes": "Walking distance to MRT Phetchaburi and ARL Makkasan.",
  "amenities": {
    "elevator": true,
    "gym": true,
    "pool": true,
    "parking": true,
    "cctv": true,
    "keycard": true
  },
  "photos": [
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00"
  ],
  "price_history": [
    {
      "rent": 18000,
      "deposit": 36000,
      "advance": 18000,
      "common_fee": 0,
      "parking_fee": 0,
      "internet_fee": 0,
      "water_type": "metered",
      "water_rate": "18 ฿/unit",
      "electric_type": "government",
      "electric_rate": "MEA (~4.4 ฿/unit)",
      "note": "Initial listed price"
    }
  ]
}
```

#### Response (`201 Created`)
Returns the complete serialized `Listing` object.

---

### `GET /api/listings/:id`
Retrieve a single listing by its ID.

#### Response (`200 OK` or `404 Not Found`)
```json
{
  "id": "condo-1",
  "name": "Life Asoke Hype",
  ...
}
```

---

### `PUT /api/listings/:id`
Full update of a listing's metadata, physical attributes, contact information, and amenities.

#### Request Body
Accepts partial or complete listing attributes: `name`, `address`, `lat`, `lng`, `type`, `status`, `size_sqm`, `floor`, `view`, `source_url`, `contact_phone`, `contact_line`, `notes`, `photos`, `amenities`.

#### Response (`200 OK`)
Returns the updated `Listing`.

---

### `PATCH /api/listings/:id`
Fast atomic updates for quick actions (e.g. toggling favorite, advancing pipeline status, or editing personal notes).

#### Request Body (Any subset of fields)
```json
{
  "is_favorite": true,
  "status": "viewing_scheduled"
}
```

#### Response (`200 OK`)
Returns the updated `Listing`.

---

### `DELETE /api/listings/:id`
Permanently delete a listing. Cascades and removes all attached price histories, viewing logs, and contracts.

#### Response (`200 OK`)
```json
{
  "success": true,
  "id": "condo-1"
}
```

---

## 2. Sub-Resources (Price History, Viewings, Contracts)

### Price History

#### `POST /api/listings/:id/price-history`
Log a new price offer or negotiation change.

```json
{
  "rent": 14000,
  "deposit": 28000,
  "advance": 14000,
  "common_fee": 0,
  "parking_fee": 0,
  "internet_fee": 0,
  "water_type": "metered",
  "water_rate": "18 ฿/unit",
  "electric_type": "government",
  "electric_rate": "MEA",
  "note": "Owner offered 1,000 THB discount for 2-year lease contract",
  "recorded_at": "2026-03-04T12:00:00.000Z"
}
```
**Response (`201 Created`)**: Returns the created `PriceHistory` record.

#### `DELETE /api/listings/:id/price-history/:historyId`
Remove a specific price history log entry.

**Response (`200 OK`)**:
```json
{
  "success": true,
  "id": "ph-123",
  "listing_id": "condo-1"
}
```

---

### Viewing Logs

#### `POST /api/listings/:id/viewings`
Schedule or record a property viewing visit.

```json
{
  "scheduled_at": "2026-03-10T11:00:00.000Z",
  "notes": "Visited unit 1804. Soundproofing is excellent, kitchen has electric stove.",
  "rating": 4.5,
  "completed": true
}
```
**Response (`201 Created`)**: Returns the created `ViewingLog`.

#### `PATCH /api/listings/:id/viewings/:viewingId`
Update viewing status, notes, or rating.

```json
{
  "rating": 5.0,
  "completed": true,
  "notes": "Agent agreed to install new blackout curtains."
}
```
**Response (`200 OK`)**: Returns the updated `ViewingLog`.

#### `DELETE /api/listings/:id/viewings/:viewingId`
Delete a viewing log entry.

**Response (`200 OK`)**:
```json
{
  "success": true,
  "id": "vl-123",
  "listing_id": "condo-1"
}
```

---

### Contracts

#### `PUT /api/listings/:id/contract`
Create or replace lease contract terms for a listing.

```json
{
  "duration_months": 12,
  "start_date": "2026-04-01T00:00:00.000Z",
  "end_date": "2027-03-31T00:00:00.000Z",
  "deposit_refund_terms": "Deposit returned within 14 days of lease completion.",
  "pet_friendly": false,
  "smoking_allowed": false,
  "overnight_guest_policy": "Allowed up to 3 consecutive nights.",
  "early_termination_penalty": "Forfeiture of security deposit.",
  "contract_file_url": "https://storage.example.com/leases/lease-condo-1.pdf"
}
```
**Response (`200 OK`)**: Returns the upserted `Contract`.

#### `DELETE /api/listings/:id/contract`
Remove contract details from a listing.

**Response (`200 OK`)**:
```json
{
  "success": true,
  "listing_id": "condo-1"
}
```

---

## 3. Center Reference Points

Center points serve as reference landmarks (workplaces, universities, BTS/MRT hubs) for calculating distances and straight-line directions.

### `GET /api/center-points`
List all user reference points.

#### Response (`200 OK`)
```json
[
  {
    "id": "cp-workplace",
    "name": "Siam Paragon / Work",
    "lat": 13.7462,
    "lng": 100.5347,
    "category": "work",
    "icon": "building",
    "color": "#3b82f6"
  }
]
```

### `POST /api/center-points`
Create a new reference point.

```json
{
  "name": "Chulalongkorn University",
  "lat": 13.7383,
  "lng": 100.5323,
  "category": "university",
  "icon": "graduation-cap",
  "color": "#ec4899"
}
```
**Response (`201 Created`)**: Returns the created `CenterPoint`.

### `PUT /api/center-points/:id`
Update an existing reference point's coordinates or metadata.

### `DELETE /api/center-points/:id`
Delete a reference point.

---

## 4. Metadata & Utility Endpoints

### `GET /api/metadata`
Returns lookup tables for pipeline statuses and property types, including UI badges and icons.

#### Response (`200 OK`)
```json
{
  "property_types": [
    { "id": "condo", "name": "Condominium", "icon": "building-2", "color": "#3b82f6" },
    { "id": "apartment", "name": "Apartment", "icon": "building", "color": "#8b5cf6" },
    { "id": "dorm", "name": "Dormitory", "icon": "graduation-cap", "color": "#f59e0b" },
    { "id": "house", "name": "Townhouse / House", "icon": "home", "color": "#10b981" }
  ],
  "pipeline_statuses": [
    { "id": "interested", "name": "Interested", "color": "#3b82f6", "badge_class": "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    { "id": "viewing_scheduled", "name": "Viewing Scheduled", "color": "#8b5cf6", "badge_class": "bg-purple-500/10 text-purple-600 border-purple-500/20" },
    { "id": "viewed", "name": "Viewed", "color": "#f59e0b", "badge_class": "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    { "id": "negotiating", "name": "Negotiating", "color": "#ec4899", "badge_class": "bg-pink-500/10 text-pink-600 border-pink-500/20" },
    { "id": "decided", "name": "Decided / Rented", "color": "#10b981", "badge_class": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    { "id": "rejected", "name": "Rejected / Passed", "color": "#64748b", "badge_class": "bg-slate-500/10 text-slate-600 border-slate-500/20" }
  ]
}
```

### `GET /api/resolve-maps-url?url=https://maps.app.goo.gl/...`
Expands shortened Google Maps links and extracts coordinate pairs (`{ lat, lng }`) automatically for listing creation.
