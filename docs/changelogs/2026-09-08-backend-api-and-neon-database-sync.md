# Changelog: Backend REST API & Neon Database Synchronization

**Date:** 2026-09-08  
**Version:** 0.4.0  
**Scope:** Neon PostgreSQL integration, Prisma Entity Serializer, Backend REST API Routes, Zustand Store DB Sync, UI Loading States, and API Documentation.

---

## Overview

Previously, NestPick ran with a client-only Zustand state pre-loaded with mock Bangkok condos and cached in browser `localStorage`. In this release, NestPick was completely transformed into a full-stack, database-backed application connected to a live serverless Neon PostgreSQL database.

All frontend mutations (adding listings, updating status, toggling favorites, logging negotiation offers, recording viewing visits, adjusting lease contracts, and managing center reference points) now synchronize seamlessly with PostgreSQL through Next.js 16 REST API route handlers.

---

## Key Additions & Improvements

### 1. Prisma Entity Serializer Layer (`lib/serializers/listing.ts`)
- Implemented bidirectional serialization between Prisma database models and frontend TypeScript interfaces:
  - Converts PostgreSQL `Decimal` types (`size_sqm`, `rent`, `deposit`, `advance`, `rating`, `common_fee`, etc.) to standard JavaScript numbers.
  - Maps database snake_case columns and relation camelCase fields (`priceHistory` $\leftrightarrow$ `price_history`, `viewingLogs` $\leftrightarrow$ `viewing_logs`) seamlessly.
  - Safely casts and serializes stored JSON objects (`amenities`) and photo arrays.

### 2. Core & Sub-Resource REST API Routes
- **Listings API**:
  - `GET /api/listings`: Fetch all listings with optional filtering by property `type`, pipeline `status`, case-insensitive `search` query, and `favorite` flag.
  - `POST /api/listings`: Create a new listing along with initial price history and lease contract entries.
  - `GET /api/listings/[id]`: Retrieve a specific listing with all attached relations.
  - `PUT /api/listings/[id]`: Full update of property specifications, contact details, and amenities.
  - `PATCH /api/listings/[id]`: Fast atomic updates for toggling favorites, changing pipeline statuses, or updating notes.
  - `DELETE /api/listings/[id]`: Cascading deletion of the listing and all related entries.
- **Sub-Resource APIs**:
  - `POST /api/listings/[id]/price-history`: Record price negotiations, rent counter-offers, or fee adjustments.
  - `DELETE /api/listings/[id]/price-history/[historyId]`: Delete a specific price history log entry.
  - `POST /api/listings/[id]/viewings`: Schedule or record viewing visits with inspection ratings and notes.
  - `PATCH /api/listings/[id]/viewings/[viewingId]`: Update viewing visit details (rating, completion status, notes).
  - `DELETE /api/listings/[id]/viewings/[viewingId]`: Delete a viewing appointment.
  - `PUT /api/listings/[id]/contract`: Upsert lease contract terms, deposit refund conditions, and attached document links.
  - `DELETE /api/listings/[id]/contract`: Delete lease contract terms.
- **Reference Center Points API**:
  - `GET /api/center-points` & `POST /api/center-points`: Manage custom reference points (workplace, university, transit hubs).
  - `PUT /api/center-points/[id]` & `DELETE /api/center-points/[id]`: Update coordinates or delete reference points.
- **Metadata API**:
  - `GET /api/metadata`: Returns lookup tables for pipeline statuses and property types with associated icons and badge colors.

### 3. Zustand Store Database Sync & Cache Invalidation (`store/maps-store.ts`, `app/(dashboard)/layout.tsx`)
- **Clean Initial State**: Removed mock condos from store defaults (`listings: []`, `centerPoints: []`).
- **Data Hydration (`fetchInitialData`)**: Asynchronously loads live listings and center points from `/api/listings` and `/api/center-points` on dashboard mount.
- **Optimistic UI with Background Sync**: All store mutations (`addListing`, `updateListing`, `deleteListing`, `toggleFavorite`, `addPriceHistory`, `deletePriceHistory`, `addViewingLog`, `updateViewingLog`, `deleteViewingLog`, `updateContract`, `deleteContract`, `addCenterPoint`, `deleteCenterPoint`) immediately update the UI optimistically and persist changes to the backend in the background.
- **LocalStorage Cleansing**: Upgraded storage key to `nestpick-store-v2`, excluded `listings` and `centerPoints` from `partialize` (so PostgreSQL is the single source of truth), and added automatic purging of legacy mock-data cache keys (`nestpick-store-v1`, `nestpick-maps-storage`).

### 4. UI Loading & Empty State Handling
- Added animated loading spinners to `MapsPanel` and `TableView` while the initial database hydration is in progress.
- Enhanced empty state presentation when 0 listings exist in the database with one-click actions to add the first listing.

### 5. API Reference Documentation (`docs/api.md`)
- Created comprehensive API reference documentation detailing base URLs, authentication headers, error formats, query parameters, request bodies, response schemas, and status codes for all endpoints.

---

## Verification
- Built locally with Next.js 16 Turbopack compiler (`bun run build`): All 12 API routes compiled dynamically (`ƒ`) without TypeScript or runtime warnings.
