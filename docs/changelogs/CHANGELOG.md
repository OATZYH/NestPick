# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.3.1] - 2026-09-08

### Added
- **Database Wipe & Seed CLI Script (`scripts/db-wipe.ts`, `package.json`)**:
  - Interactive CLI utility supporting two clean operations: (1) Wipe all data and re-seed with clean Bangkok mock data, or (2) Just wipe database clean.
  - Supports automated CLI flags `--seed`, `--only`, and `--force` for non-interactive scripting.
  - Added npm scripts: `npm run db:wipe`, `npm run db:wipe:only`, and `npm run db:wipe:seed`.
  - Added clean foreign key cascade deletion order across `Listing`, `PriceHistory`, `Contract`, `ViewingLog`, and `CenterPoint`.
- **GPS Location Beacon (`components/dashboard/map-view.tsx`, `components/dashboard/map-controls.tsx`, `lib/utils.ts`)**:
  - Added GPS coordinate boundary validation helper `isValidCoordinates(lat, lng)`.
  - Fixed Crosshairs geolocation button with accurate error handling, permission checks, and timeout recovery.
  - Added pulsating blue radar beacon marker on the map indicating current user position with tooltip.
  - Added pointer cursor and hover tooltips for map control buttons.

### Fixed & Improved
- **Condo Selection & Deselection UX (`store/maps-store.ts`, `components/dashboard/maps-panel.tsx`, `components/dashboard/map-view.tsx`)**:
  - Enabled multi-surface deselection: re-clicking an active map marker, clicking on empty map canvas, or pressing `Escape` key clears active condo selection.
  - Added "1 condo selected" banner with a "Deselect" button at the top of `MapsPanel`.
  - Added `✕` close button on condo card header and `Close` button on expanded card footer.
- **Pin Flickering & Coordinate Jump Elimination (`components/dashboard/map-view.tsx`, `store/maps-store.ts`)**:
  - **Flicker-Free Marker Updates**: Decoupled MapLibre marker lifecycle from `selectedListingId`. Markers are preserved in-memory and visual states (scale, highlight ring, z-index) are synchronized in-place without destroying and recreating DOM nodes.
  - **Stationary GPS Anchoring**: Added `anchor: "bottom"` and `origin-bottom` (`transform-origin: bottom center`) to pins so selection scaling expands strictly upwards from the pin tip, locking coordinates to the exact building location.
  - **Protected Root Transform**: Fixed bug where setting `transform` directly on the root marker element blew away MapLibre coordinates (causing clicked condo pins to disappear). All transforms and animations are now safely applied to inner wrappers.
  - **Target Pin Stability**: Fixed frantic flickering on temporary and reference point target pins (`🎯`) by isolating `animate-bounce` and hover effects to inner containers.
  - **Data Memoization**: Memoized `getFilteredListings()` in `MapView` to eliminate redundant effect executions on re-renders.
  - **Camera Cursor Stability**: Added `userClickedMarkerRef` so clicking a pin directly on the map keeps the camera stationary under the cursor.
- **Layering & Z-Index Isolation (`components/dashboard/map-view.tsx`, `components/dashboard/maps-panel.tsx`)**:
  - Encapsulated map viewport with `z-0 isolate` to establish an isolated stacking context.
  - Elevated `MapsPanel` to `z-30` so that all map markers, selected condo pins, target reference points, and hover popups render **strictly behind the sidebar panel** when positioned on the left side of the map.

---

## [0.3.0] - 2026-09-08

### Added
- **Click-on-Map Quick Action Menu (`components/dashboard/map-view.tsx`, `app/globals.css`)**:
  - Added interactive click listener on the MapLibre map canvas displaying a contextual action popup at the clicked coordinates.
  - Provides two one-click actions: **"➕ Add Listing Here"** (opens the listing creation dialog with coordinates pre-filled) and **"🎯 Set Reference Point"** (opens the commuting target modal with coordinates pre-filled).
  - Configured click filtering so interacting with existing markers, controls, and popups does not trigger unwanted location popups.
- **3-Option Location Selector (`components/dashboard/location-input-tabs.tsx`, `lib/geo-utils.ts`)**:
  - Created reusable tabbed location selector component supporting three input methods:
    1. **Google Maps Link / Coords**: Auto-parses coordinates from pasted desktop/mobile Google Maps URLs (`/@lat,lng`, `?q=lat,lng`, `!3dlat!4dlng`), search queries, and raw coordinate pairs (`13.7554, 100.5658`), displaying a success badge with extracted latitude and longitude.
    2. **Click on Map**: Minimizes modal and activates interactive map-picking mode with a crosshair cursor, floating guidance banner (*"Click anywhere on map to place listing / waypoint • Cancel (Esc)"*), and an animated temporary placement marker.
    3. **Manual Lat/Lng**: Numerical decimal inputs with step adjustments and physical coordinate boundary validation.
- **Server-Side Google Maps URL Resolver (`app/api/resolve-maps-url/route.ts`)**:
  - Added Next.js API route to resolve shortened mobile Google Maps URLs (`maps.app.goo.gl` and `goo.gl/maps`) by following HTTP redirects server-side and extracting destination coordinates from location headers and page metadata.
- **Zustand Map Store State Synchronization (`store/maps-store.ts`, `components/dashboard/maps-panel.tsx`)**:
  - Centralized modal visibility and editing states (`isListingModalOpen`, `isCenterPointModalOpen`, `editingListing`) in the global store to coordinate modals across map canvas clicks, panel headers, and table views.
  - Added transient map-picking states (`isPickingOnMap`, `pickingTarget`, `pendingCoordinates`) excluded from LocalStorage persistence.
- **Expanded 2-Column Responsive Modal Layout (`components/dashboard/listing-modal.tsx`)**:
  - Retained the expanded 2-column desktop grid layout (`sm:max-w-4xl lg:max-w-5xl`): Left column for Property Info, 3-Option Location Picker, and Financials; Right column for Pipeline Status, Facility Amenities, Contacts, and Inspection Notes.
  - Integrated the 3-option location picker in both `ListingModal` and `CenterPointModal`.

---

## [0.2.1] - 2026-09-08

### Added
- **Listing Modal 2-Column Responsive Layout (`components/dashboard/listing-modal.tsx`)**:
  - Expanded dialog container to wider responsive breakpoints (`sm:max-w-4xl lg:max-w-5xl`).
  - Organized form sections into a 2-column grid on desktop (`lg:grid-cols-2 gap-6`): Property Info & Financials on the left, Pipeline Status, Amenities, Contacts, and Inspection Notes on the right.
  - Added interactive section headers with tooltips (`Tooltip`, `TooltipTrigger`, `TooltipContent`) explaining each category.
  - Added shadcn `Select` component (`components/ui/select.tsx`) powered by `@radix-ui/react-select`.
- **Maps Panel Show/Hide Toggle (`components/dashboard/maps-panel.tsx`, `store/maps-store.ts`)**:
  - Added `togglePanelVisible` action to Zustand maps store.
  - Enabled manual collapse and restoration of the floating maps panel on both desktop and mobile.
  - Added floating restore button with listing count badge (`PanelLeftOpen`) when panel is closed.
- **Mobile Sidebar Trigger (`components/dashboard/map-controls.tsx`)**:\
  - Added mobile-only trigger button (`sm:hidden`) in top-right map controls to open the navigation drawer sheet on smaller screens.

### Changed & Fixed
- **Sidebar Header & Collapse Behavior (`components/dashboard/sidebar.tsx`)**:
  - Replaced redundant dropdown menu on the logo with a plain branding logo link.
  - Fixed sidebar toggle button alignment and spacing in `SidebarHeader`.
  - Switched sidebar collapse mode from `offcanvas` to `icon`, preserving a 48px navigation rail when collapsed instead of disappearing off-screen.
  - Added centered trigger button in the icon rail and hover tooltips for all navigation items.\
- **Listing Modal UI Fixes (`components/dashboard/listing-modal.tsx`)**:
  - Converted pipeline status selection from badge chips into a clean `<Select>` dropdown with color status indicators.
  - Removed numeric prefixes (`1. `, `2. `, etc.) from all modal section titles.
  - Fixed Project Amenities component by replacing rigid 6-column fixed grid with `flex flex-wrap gap-2` chips with Lucide icons and active check indicators, preventing label truncation.

---

## [0.2.0] - 2026-09-07

### Added
- **Prisma ORM 7 Integration**:
  - Defined PostgreSQL models in `prisma/schema.prisma` (`Listing`, `PriceHistory`, `Contract`, `ViewingLog`, `CenterPoint`, `PropertyType`, `PipelineStatus`) with cascade delete constraints and indexes.
  - Created singleton database client in `lib/prisma.ts` using `@prisma/adapter-pg` driver adapter with connection pooling and adaptive SSL (disabled for localhost/Docker, enabled for cloud databases).
  - Added Prisma 7 CLI configuration in `prisma7.config.ts`.
  - Migrated `scripts/seed.ts` to type-safe Prisma upsert operations.
- **Docker Compose Local Database**:
  - Configured PostgreSQL 17 Alpine in `docker-compose.yml` (`nestpick-postgres`) on port `5432` with healthcheck and volume persistence.
  - Added local `.env.example` template and cleaned cloud credentials from `.env.local` / `.env`.
- **New NPM Scripts**:
  - `db:up` and `db:down` for Docker container lifecycle.
  - `prisma:push`, `prisma:generate`, `prisma:migrate`, `prisma:studio`, `db:seed`, and `postinstall`.

### Removed
- Removed unused dependencies `ajv` and `@radix-ui/react-scroll-area`.

---

## [0.1.1] - 2026-09-07

### Changed
- Rebranded project name from "maps" to **NestPick**:
  - Updated package name in `package.json` to `nestpick`.
  - Updated application title and metadata in `app/layout.tsx` to "NestPick - Condo & Apartment Hunting Tracker".
  - Updated branding in sidebar (`components/dashboard/sidebar.tsx`) and floating panel (`components/dashboard/maps-panel.tsx`).
  - Updated LocalStorage persistence key in `store/maps-store.ts` to `nestpick-store-v1`.

---

## [0.1.0] - 2026-09-07

### Initial Release: Modern Maps Condo & Apartment Hunting Tracker

Transformed the template into a production-ready single-user condo/apartment hunting tracker for Bangkok rentals, while strictly preserving the template's layout architecture (collapsible sidebar, floating card panel, and full MapLibre background map).

### Added
- **Data Models & Types (`types/hunting.ts`)**:
  - Full TypeScript models for `Listing`, `PriceHistory`, `Contract`, `ViewingLog`, `Amenities`, `CenterPoint`, `PropertyType`, and `PipelineStatus`.
  - Added support for 4 property types: `condo`, `apartment`, `dorm`, `house`.
  - Added 6-stage tracking pipeline: `interested` → `viewing_scheduled` → `viewed` → `negotiating` → `decided` → `rejected`.
- **Bangkok Rental Mock Dataset (`mock-data/condos.ts`)**:
