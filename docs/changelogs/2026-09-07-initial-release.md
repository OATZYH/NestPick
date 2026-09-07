# Changelog: 2026-09-07 - Initial Release (v0.1.0)

## Overview
Transformed the template into an interactive single-user **Condo & Apartment Hunting Tracker** for Bangkok rentals, fully implementing the requirements in `prompts/spec.md` and `prompts/er.md` while maintaining the template's layout architecture.

## Key Changes

### 1. Build & Dependency Conflict Resolution
- Fixed `package.json` overrides: removed `@isaacs/brace-expansion` and `brace-expansion` forced v5 which broke `minimatch@3` in `@eslint/config-array`.
- Configured native ESLint 9 Flat Config in Next.js 16 (`eslint.config.mjs`).
- Fixed React 19 Compiler purity rules in `components/ui/sidebar.tsx` and declaration order in `components/dashboard/map-view.tsx`.
- Installed `@radix-ui/react-tabs` and created `components/ui/dialog.tsx` and `components/ui/tabs.tsx`.

### 2. Data Architecture (`types/hunting.ts`, `store/maps-store.ts`, `mock-data/condos.ts`)
- **Entities**:
  - `Listing`: Name, address, coordinates, property type (`condo`, `apartment`, `dorm`, `house`), room size, floor, view, photos, source URLs, phone, LINE ID, status, amenities, pros/cons notes.
  - `PriceHistory`: Monthly rent, deposit, advance, common fees, parking, internet, water & electricity rates, recorded timestamp, negotiation notes.
  - `Contract`: Duration, start/end dates, deposit refund conditions, pet/smoking/guest policies, early termination penalty.
  - `ViewingLog`: Scheduled appointment dates, remarks on inspection (light, noise, water pressure), 1–5 star ratings, completion status.
  - `CenterPoint`: Reference hubs (workplace, university, transit) with live distance calculation.
- **Bangkok Dataset**: 8 realistic listings in Rama 9, Sukhumvit, Phrom Phong, Ari, Sathorn, Samyan.
- **LocalStorage State**: State persistence with full CRUD, filter by type and status, multi-mode sorting.

### 3. Layout & Views
- **Map View (`/`)**: Custom MapLibre markers with rent badges, target center point marker, interactive hover popups, and OSRM route line.
- **Floating Info Panel (`components/dashboard/maps-panel.tsx`)**: Compact cards and expanded view with 4 tabs (Specs, Pricing History with inline offer logger, Lease Contract, and Viewing Visit Logs with star ratings).
- **Spreadsheet Table View (`/table`)**: Excel / Google Sheets UX with sortable columns, quick map navigation, and inline pipeline status editor.
- **Side-by-Side Comparison Matrix (`/compare`)**: Up to 4 listings compared with custom weighted scoring engine (Rent, Distance, Size, Amenities) and Top Match indicator.
- **Sidebar (`components/dashboard/sidebar.tsx`)**: Navigation across all views, property types, pipeline stages, and active target reference point.
- **Modals**: Full listing creator/editor modal (`ListingModal`) and reference center points modal (`CenterPointModal`).
