# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
  - 8 realistic property listings across Bangkok (Sukhumvit, Asoke, Phrom Phong, Ari, Samyan, Rama 9, Sathorn) with high-res photos, lease terms, price histories, viewing logs, and contact information.
  - 4 default reference points: Workplace (Siam / CentralWorld), BTS Asok Interchange, Chulalongkorn University, Silom/Sathorn CBD.
- **Zustand State Store (`store/maps-store.ts`)**:
  - LocalStorage persistence for user listings, center points, active target, and comparisons.
  - Haversine distance calculator relative to the user's active reference center point.
  - Actions for adding/updating/deleting listings, price history offers, viewing notes, contracts, and center points.
  - Multi-criteria sorting: Nearest to Target, Rent (Low-High / High-Low), Size, Inspection Rating, Date Added, and Name.
- **Floating Listing Information Panel (`components/dashboard/maps-panel.tsx`)**:
  - Compact cards with photos, rent badges, floor/size specs, target distance, and pipeline status.
  - Tabbed detail view:
    - **Specs**: Amenities checklist, unblocked view, pros/cons notes.
    - **Pricing History**: Timeline of initial prices vs negotiated counter-offers, with an inline "+ Offer" logger.
    - **Lease Contract**: Duration, dates, deposit refund conditions, pet/smoking/guest policies, early termination terms.
    - **Visit Logs**: Inspection dates, star ratings (1–5), notes on water pressure/noise/sunlight, with inline "+ Log Visit" form.
    - **Direct Contacts**: One-click phone calling and direct LINE chat launcher (`line.me/ti/p/~...`).
- **Interactive Map Dashboard (`components/dashboard/map-view.tsx`)**:
  - Rent price pill badges and status-colored markers.
  - Pulsing landmark pin for the active Reference Center Point.
  - Rich hover preview cards showing thumbnail, rent, size, and distance.
  - OSRM route line drawing connecting the listing to the target center point.
- **Spreadsheet Table View (`components/dashboard/table-view.tsx` • `/table`)**:
  - Google Sheets / Excel UX with sortable columns, alternating row highlights, and sticky header.
  - Inline pipeline status dropdown directly inside the table cell.
  - Quick action to select and fly to the place on the map.
- **Side-by-Side Comparison Matrix (`components/dashboard/compare-view.tsx` • `/compare`)**:
  - Side-by-side comparison across up to 4 listings.
  - Weighted Scoring Engine with dynamic sliders (Budget, Distance, Room Size, Amenities) calculating a 0–100 match score and highlighting the #1 Top Match with a trophy badge.
- **Navigation Sidebar (`components/dashboard/sidebar.tsx`)**:
  - Updated navigation items: Map View (`/`), Spreadsheet Table (`/table`), Compare (`/compare`), Favorites (`/favorites`), Recent (`/recents`).
  - Filters for property types and pipeline stages with item counts.
  - Target Reference Point indicator card.
- **Modals**:
  - `ListingModal`: Comprehensive dialog to create or edit full listing records and pricing terms.
  - `CenterPointModal`: Dialog to manage reference center points (workplace, university, transit, landmark).
  - Radix UI Dialog (`components/ui/dialog.tsx`) and Radix UI Tabs (`components/ui/tabs.tsx`).

### Fixed & Optimized
- **Dependency Conflicts (`package.json`)**:
  - Removed breaking `"brace-expansion": "^5.0.6"` and `"@isaacs/brace-expansion": "^5.0.1"` overrides that caused `TypeError: expand is not a function` in ESLint 9's config array parser.
  - Removed unused root `"minimatch": "^10.2.3"`.
- **ESLint 9 / Next.js 16 Configuration (`eslint.config.mjs`)**:
  - Replaced legacy `@eslint/eslintrc` `FlatCompat` wrapper with native `import nextConfig from "eslint-config-next"` export.
- **React 19 Rules & Build Stability**:
  - Resolved `react-hooks/purity` error in `components/ui/sidebar.tsx` by eliminating `Math.random()` inside render.
  - Resolved variable access order in `components/dashboard/map-view.tsx` for `drawRoute`.
  - Replaced unescaped quotes in `components/dashboard/table-view.tsx`.
- **Map View Controls (`components/dashboard/map-controls.tsx`)**:
  - Updated default compass/reset view to center onto Bangkok and the active reference target point instead of world coordinates `(20, 0)`.
