# Project Spec: Condo/Apartment Hunting Tracker

## Overview

A single-user web application for tracking apartments/condos while searching for a place to rent. The app should let the user record, compare, and visualize potential listings, their lease terms, and pricing.

**Tech Stack:** Next.js 16, shadcn/ui, TypeScript

---

## Core Features

### 1. Listing Records

Each listing should store:

- Name/project name, address, coordinates (lat/long)
- Type: dorm, condo, apartment, house
- Room size (sqm), floor, view
- Multiple photos
- Source link (Facebook, DDproperty, etc.)
- Owner/agent contact info (phone, LINE)

### 2. Pricing & Costs

- Monthly rent
- Deposit, advance payment
- Water/electricity (flat rate vs. metered + rate)
- Common area fee, parking fee, internet fee
- Price history log (track changes from negotiation over time)

### 3. Lease Contract

- Contract duration, start/end date
- Deposit refund conditions
- Pet/smoking/overnight guest policy
- Early termination penalty
- Attached contract file (PDF/image upload)

### 4. Tracking Pipeline

- Status: Interested → Viewing Scheduled → Viewed → Negotiating → Decided/Rejected
- Viewing appointment date, viewing notes/rating
- Reminders/notifications for appointments or promo deadlines

### 5. Comparison View

- Side-by-side comparison table across multiple listings (price, distance, amenities)
- Weighted scoring based on user-defined priorities (e.g. near BTS, has elevator, has gym)

### 6. Amenities

- Elevator, gym, pool, parking, CCTV, keycard access
- Distance from key reference points (BTS/MRT, university, workplace)

### 7. Personal Notes

- Free-text notes per listing (pros/cons, smell, noise, etc.)
- Favorite/star tagging

### 8. Map View (
9. 
- Dedicated map page using **mapcn** (shadcn-style map component) or openstreetmap
- User first pins one or more **center reference points** (e.g. workplace, university, key landmark)
- All saved listings render as pins on the map
- Show distance (straight-line and/or travel time if feasible) from each listing to the center point(s)
- Clicking a pin opens a quick-view card (photo, price, status)

### 9. Table View

- Spreadsheet-like table view (similar to Google Sheets/Excel UX) for all listings
- Sortable/filterable columns matching the data fields above (price, size, status, distance, etc.)
- Inline editing where practical
- Should complement the Map View — same dataset, two display modes (Table / Map), switchable via tabs or toggle

---

## Notes

- No multi-user or authentication system — this is a personal single-user tool.
- Data model should support: `Listing`, `PriceHistory`, `Contract`, `ViewingLog`, `CenterPoint` (reference locations for map distance calculation).

## Suggested Next Steps
- Design ER diagram / database schema based on the entities above
- Choose a map data source/provider compatible with mapcn (e.g. Mapbox, MapLibre, Google Maps)
- Scaffold Next.js 16 app with shadcn/ui components for Table and Map pages
