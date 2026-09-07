# Changelog: 2026-09-08 - Map UX Stabilization, Deselection & Database Wipe Tooling (v0.3.1)

## Overview
Comprehensive overhaul of map marker UX, camera synchronization, layer hierarchy, and database maintenance scripts. Resolved critical MapLibre DOM recreation flicker, coordinate drift on scaled pins, geolocation Crosshairs reliability, deselection workflows across map and side panel, and ensured that all map pins and selections render cleanly behind the sidebar panel.

---

## Key Improvements

### 1. Pin Stability & Flicker-Free Transitions (`components/dashboard/map-view.tsx`)
- **Decoupled Marker Lifecycle**: Separated marker creation from `selectedListingId` in `MapView`. Markers are created once per dataset and kept in memory.
- **In-Place Style Synchronization**: When a listing is selected or deselected, CSS classes and inner wrapper scaling are mutated in-place with zero DOM destruction, completely eliminating marker flickering/flashing.
- **Protected Root Transform**: MapLibre coordinates rely on inline `transform: translate(x, y)` on the root marker DOM element. Removed inline transforms on the root element, moving all scaling (`scale-115`), hover states, and animations (`animate-bounce`) into nested wrappers (`.marker-wrapper`, `.center-point-inner`). This solved the issue where clicking a condo pin caused it to go missing immediately.
- **Exact Bottom Anchor**: Set `anchor: "bottom"` on MapLibre markers and `origin-bottom` on marker wrappers, guaranteeing that pins scale upwards while the bottom pin tip remains anchored to the exact geographic coordinates without drifting.
- **Stationary Camera on Direct Click**: Added `userClickedMarkerRef` guard to prevent map camera panning when clicking directly on a map pin, avoiding pins jumping away from under the cursor.

### 2. Panel Layering & Z-Index Isolation (`components/dashboard/map-view.tsx`, `components/dashboard/maps-panel.tsx`)
- **Map Stacking Context**: Configured the map container with `z-0 isolate`, creating an isolated CSS stacking context that confines all canvas layers, routes, condo markers, target pins, and popups.
- **Panel Elevation**: Elevated `MapsPanel` to `z-30`. As a result, all map pins, selected condo markers, and target reference points (`🎯`) stay **strictly behind the sidebar panel** when positioned on the left side of the map.

### 3. Comprehensive Condo Deselection Workflow (`store/maps-store.ts`, `components/dashboard/maps-panel.tsx`, `components/dashboard/map-view.tsx`)
- **Store-Level Toggle**: Updated `selectListing(id)` to toggle off selection when called with `null` or when re-selecting the currently active listing ID.
- **Keyboard & Canvas Listeners**: Added `Escape` key handler and empty map canvas click handler to instantly clear selection.
- **Panel Deselection Controls**:
  - Added a "1 condo selected" banner with a "Deselect" button at the top of the listings scroll view.
  - Added a `✕` close button in the header of the selected condo card.
  - Added a `Close` button in the footer of the expanded condo card.

### 4. Crosshairs Geolocation & GPS Radar Marker (`components/dashboard/map-controls.tsx`, `lib/utils.ts`, `components/dashboard/map-view.tsx`)
- Added `isValidCoordinates(lat, lng)` boundary verification utility.
- Enhanced browser geolocation handling with explicit timeout (10s), maximum age, and graceful toast error notifications for denied permissions.
- Added a pulsating blue radar beacon marker on the map displaying the user's verified location.
- Added pointer cursor and hover tooltips for all map action controls.

### 5. Interactive Database Wipe & Seed CLI Tool (`scripts/db-wipe.ts`, `package.json`)
- Created `scripts/db-wipe.ts` with an interactive terminal prompt:
  - Option 1: Wipe all database records and re-seed fresh Bangkok rental mock data.
  - Option 2: Just wipe all records clean.
- Added CLI flag support: `--seed`, `--only`, and `--force`.
- Registered npm scripts: `npm run db:wipe`, `npm run db:wipe:only`, `npm run db:wipe:seed`.
